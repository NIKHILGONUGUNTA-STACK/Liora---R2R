import asyncio
import httpx
import os
from pathlib import Path

API_URL = "http://127.0.0.1:8000/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("1. Attempt to search documents without a token (Expect 401)")
        r = await client.post(f"{API_URL}/search", json={"query": "test"})
        print(f"Status: {r.status_code}")
        assert r.status_code == 401
        
        print("\n2. Register User A (Expect 200)")
        r = await client.post(f"{API_URL}/auth/register", json={
            "email": "userA@example.com",
            "password": "password123"
        })
        print(f"Status: {r.status_code}")
        if r.status_code == 400:
            print("User A might already exist, continuing...")
        else:
            assert r.status_code == 200
            
        print("\n3. Log in as User A (Expect 200)")
        r = await client.post(f"{API_URL}/auth/login", data={
            "username": "userA@example.com",
            "password": "password123"
        })
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        token_a = r.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}
        
        print("\n4. Upload a document as User A (Expect 200)")
        pdf_path = Path("space_colony.pdf")
        
        with open(pdf_path, "rb") as f:
            r = await client.post(f"{API_URL}/documents", headers=headers_a, files={"file": ("test_doc.pdf", f, "application/pdf")})
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        doc_id = r.json()["id"]
        
        print("\nWait for processing...")
        await asyncio.sleep(5)
        
        print("\n5. Search for the document as User A (Expect 200 + results)")
        r = await client.post(f"{API_URL}/search", headers=headers_a, json={"query": "space colony"})
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        data = r.json()
        print(f"Results: {data['result_count']}")
        assert data['result_count'] > 0
        
        print("\n6. Register User B (Expect 200)")
        r = await client.post(f"{API_URL}/auth/register", json={
            "email": "userB@example.com",
            "password": "password123"
        })
        print(f"Status: {r.status_code}")
        if r.status_code == 400:
            print("User B might already exist, continuing...")
        else:
            assert r.status_code == 200
            
        r = await client.post(f"{API_URL}/auth/login", data={
            "username": "userB@example.com",
            "password": "password123"
        })
        token_b = r.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}
        
        print("\n7. Search for User A's document as User B (Expect 200 + NO RESULTS)")
        r = await client.post(f"{API_URL}/search", headers=headers_b, json={"query": "space colony"})
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        data = r.json()
        print(f"Results: {data['result_count']}")
        assert data['result_count'] == 0
        
        print("\n8. Attempt to directly retrieve User A's document by ID as User B (Expect 404/403)")
        r = await client.get(f"{API_URL}/documents/{doc_id}", headers=headers_b)
        print(f"Status: {r.status_code}")
        assert r.status_code in [403, 404]
        
        print("\n9. Delete User A's document as User A (Expect 200)")
        r = await client.delete(f"{API_URL}/documents/{doc_id}", headers=headers_a)
        print(f"Status: {r.status_code}")
        assert r.status_code == 200
        
        print("\nValidation Complete!")

if __name__ == "__main__":
    asyncio.run(main())
