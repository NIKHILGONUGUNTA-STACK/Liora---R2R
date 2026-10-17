import os
import shutil
import io
from pathlib import Path
from typing import BinaryIO, Optional, Union
from fastapi import UploadFile
from app.core.config import settings
from app.core.logging import logger

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False


class FileStorage:
    """
    Unified Layer 1 Raw File Storage.
    Supports:
      1. 'local' - Local persistent filesystem (Default for local development)
      2. 's3'    - S3-compatible cloud object storage (Cloudflare R2, AWS S3, MinIO)
    """

    def __init__(self, provider: Optional[str] = None):
        self.provider = (provider or settings.STORAGE_PROVIDER).lower()
        self.local_base_dir = Path(settings.STORAGE_LOCAL_DIR)
        self.local_base_dir.mkdir(parents=True, exist_ok=True)

        self.s3_client = None
        self.bucket_name = settings.S3_BUCKET_NAME

        if self.provider == "s3":
            if not BOTO3_AVAILABLE:
                logger.warning("boto3 is not installed. Falling back to local storage.")
                self.provider = "local"
            else:
                self._init_s3_client()

    def _init_s3_client(self):
        try:
            client_kwargs = {
                "service_name": "s3",
                "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
                "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
                "region_name": settings.S3_REGION_NAME or "auto",
            }
            if settings.S3_ENDPOINT_URL:
                client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL

            self.s3_client = boto3.client(**client_kwargs)
            logger.info(f"Initialized S3/R2 storage client for bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {str(e)}. Falling back to local storage.")
            self.provider = "local"

    def _parse_s3_uri(self, uri: str) -> tuple[str, str]:
        """Extract (bucket, key) from s3://bucket/key"""
        path = uri[5:]  # strip 's3://'
        parts = path.split("/", 1)
        bucket = parts[0]
        key = parts[1] if len(parts) > 1 else ""
        return bucket, key

    async def save(
        self,
        file: UploadFile,
        file_hash: str,
        owner_id: str,
        document_id: str
    ) -> str:
        """
        Save the uploaded file to either Cloudflare R2/S3 or Local Disk.
        Returns the persistent storage identifier:
          - S3 URI: 's3://<bucket>/documents/<owner>/<doc>/<hash>.<ext>'
          - Local Path: '/abs/path/storage/documents/<owner>/<doc>/<hash>.<ext>'
        """
        ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        ext = "".join(c for c in ext if c.isalnum() or c == ".")
        safe_filename = f"{file_hash}{ext}"
        relative_key = f"documents/{owner_id}/{document_id}/{safe_filename}"

        await file.seek(0)

        # ----------------------------------------------------
        # S3 / Cloudflare R2 Upload
        # ----------------------------------------------------
        if self.provider == "s3" and self.s3_client:
            try:
                content_type = file.content_type or "application/octet-stream"
                self.s3_client.upload_fileobj(
                    file.file,
                    self.bucket_name,
                    relative_key,
                    ExtraArgs={"ContentType": content_type}
                )
                s3_uri = f"s3://{self.bucket_name}/{relative_key}"
                logger.info(f"Uploaded file to S3/R2: {s3_uri}")
                return s3_uri
            except Exception as e:
                logger.error(f"S3 upload failed: {str(e)}. Falling back to local storage.")
                # Fall through to local storage if S3 upload errors

        # ----------------------------------------------------
        # Local Disk Storage
        # ----------------------------------------------------
        doc_dir = self.local_base_dir / str(owner_id) / str(document_id)
        doc_dir.mkdir(parents=True, exist_ok=True)
        file_path = doc_dir / safe_filename

        await file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"Saved file to local disk: {file_path.absolute()}")
        return str(file_path.absolute())

    def open(self, storage_path: str) -> BinaryIO:
        """
        Open a read stream for the document.
        Works seamlessly for both local paths and 's3://' URIs.
        """
        if storage_path.startswith("s3://"):
            if not self.s3_client:
                self._init_s3_client()
            bucket, key = self._parse_s3_uri(storage_path)
            try:
                response = self.s3_client.get_object(Bucket=bucket, Key=key)
                # Stream file bytes into an in-memory BytesIO buffer
                return io.BytesIO(response["Body"].read())
            except Exception as e:
                logger.error(f"Failed to read from S3 ({storage_path}): {str(e)}")
                raise FileNotFoundError(f"Could not retrieve S3 object: {str(e)}")

        # Local file path
        path = Path(storage_path)
        if not path.exists():
            raise FileNotFoundError(f"Local file not found: {storage_path}")
        return open(storage_path, "rb")

    def exists(self, storage_path: str) -> bool:
        """Check if file exists in either S3 or local filesystem."""
        if storage_path.startswith("s3://"):
            if not self.s3_client:
                return False
            bucket, key = self._parse_s3_uri(storage_path)
            try:
                self.s3_client.head_object(Bucket=bucket, Key=key)
                return True
            except ClientError:
                return False

        return Path(storage_path).exists()

    def delete(self, storage_path: str) -> bool:
        """Delete file from S3 or local disk."""
        if storage_path.startswith("s3://"):
            if not self.s3_client:
                return False
            bucket, key = self._parse_s3_uri(storage_path)
            try:
                self.s3_client.delete_object(Bucket=bucket, Key=key)
                logger.info(f"Deleted S3 object: {storage_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to delete S3 object {storage_path}: {str(e)}")
                return False

        # Local delete
        path = Path(storage_path)
        if path.exists() and path.is_file():
            path.unlink()
            try:
                path.parent.rmdir()
            except OSError:
                pass
            return True
        return False

    def generate_presigned_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Generate a direct secure presigned download/view URL.
        - For Cloudflare R2 / S3: Returns an authentic temporary URL straight to R2 with $0 bandwidth cost.
        - For Local: Returns None (served via backend API endpoint).
        """
        if storage_path.startswith("s3://") and self.s3_client:
            bucket, key = self._parse_s3_uri(storage_path)
            try:
                url = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": bucket, "Key": key},
                    ExpiresIn=expires_in
                )
                return url
            except Exception as e:
                logger.error(f"Failed to generate presigned URL: {str(e)}")
                return None
        return None
