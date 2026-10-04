import requests
from fpdf import FPDF
import time

def create_sample_pdf(filename, title, content):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=15)
    pdf.cell(200, 10, txt=title, ln=1, align='C')
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=content)
    pdf.output(filename)

def test_upload(filename):
    print(f"Testing upload of {filename}...")
    with open(filename, 'rb') as f:
        files = {'file': (filename, f, 'application/pdf')}
        res = requests.post("http://127.0.0.1:7272/upload", files=files)
        print("Upload Response:", res.json())
        assert res.status_code == 200, "Upload failed"
        assert res.json()['status'] == 'success', "Upload not successful"

def test_query(query, expected_in_response=None):
    print(f"Testing query: '{query}'")
    res = requests.post("http://127.0.0.1:7272/chat", json={"query": query})
    data = res.json()
    print("Chat Answer:", data.get('answer'))
    print("Sources count:", len(data.get('sources', [])))
    if expected_in_response:
        assert expected_in_response.lower() in data.get('answer', '').lower(), f"Expected '{expected_in_response}' in answer."
    
if __name__ == "__main__":
    # Create test documents
    create_sample_pdf(
        "space_colony.pdf", 
        "Mars Alpha Colony", 
        "The Mars Alpha Colony was established in 2045. It is located in the Jezero Crater and currently houses 1,200 scientists and engineers. Their primary objective is terraforming research."
    )
    
    create_sample_pdf(
        "ocean_base.pdf",
        "Atlantis Deep Sea Base",
        "The Atlantis Deep Sea Base, completed in 2038, is situated in the Mariana Trench. It is powered by advanced geothermal generators and studies deep-sea bioluminescence."
    )
    
    # Run tests
    try:
        test_upload("space_colony.pdf")
        test_upload("ocean_base.pdf")
        
        print("\n--- Test 3: Known Question ---")
        test_query("Where is the Mars Alpha Colony located?", "jezero")
        
        print("\n--- Test 6: Unknown Question ---")
        test_query("What is the capital of France?", "cannot answer")
        
        print("\n--- Test 7: Multi-document ---")
        test_query("How is the Atlantis base powered?", "geothermal")
        
        print("\nAll tests passed successfully!")
    except Exception as e:
        print(f"\nTest failed: {e}")
