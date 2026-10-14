import os
import re

TESTS_DIR = r"C:\Users\nikhi\Liora_R2R\backend\tests"

def fix_tests():
    for root, _, files in os.walk(TESTS_DIR):
        for file in files:
            if file.startswith("test_") and file.endswith(".py") and file != "test_layer16_async.py" and file != "test_layer15_security.py":
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()

                original_content = content

                # 1. Add test_user to test signatures that use DocumentCreate
                # Look for def test_...(db_session) or similar and inject test_user
                
                # We need to find functions that contain DocumentCreate
                # Better: just inject `test_user` into any test function that has `DocumentCreate` inside it.
                # Regex to find `def test_name(args):`
                
                # To be safe, let's just add test_user to ALL test functions that take db_session
                content = re.sub(r'def test_([a-zA-Z0-9_]+)\(db_session(.*?)\):', r'def test_\1(db_session\2, test_user):', content)
                content = re.sub(r'def test_([a-zA-Z0-9_]+)\(\):', r'def test_\1(test_user):', content)
                
                # 2. Add owner_id=test_user.id to DocumentCreate(
                content = re.sub(r'DocumentCreate\(', r'DocumentCreate(owner_id=test_user.id, ', content)

                # 3. For layer 3, test_api_upload_valid_pdf etc uses `client.post`
                # Let's add auth_headers to all test signatures that use client.get or client.post
                if "client.post" in content or "client.get" in content:
                    content = re.sub(r'def test_([a-zA-Z0-9_]+)\((.*?)\):', r'def test_\1(\2, auth_headers):', content)
                    # Clean up multiple auth_headers or test_user if they somehow duplicated
                    content = re.sub(r',\s*test_user\s*,\s*test_user', r', test_user', content)
                    content = re.sub(r',\s*auth_headers\s*,\s*auth_headers', r', auth_headers', content)
                    
                    # Add headers=auth_headers to client.post / client.get
                    content = re.sub(r'client\.post\((.*?)\)', r'client.post(\1, headers=auth_headers)', content)
                    content = re.sub(r'client\.get\((.*?)\)', r'client.get(\1, headers=auth_headers)', content)
                    
                    # If it already had headers, we might break it. Let's do a simple replace
                    content = content.replace("headers=headers, headers=auth_headers", "headers=auth_headers")
                    content = content.replace("headers=auth_headers, headers=auth_headers", "headers=auth_headers")
                    
                if content != original_content:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Updated {file}")

if __name__ == "__main__":
    fix_tests()
