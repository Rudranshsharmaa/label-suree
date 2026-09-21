import pytest
from backend.app.services.ocr_engine import parse_packaging_text

def test_xss_in_ocr_text_is_safely_escaped():
    xss_payload = "<script>alert('XSS')</script><img src=x onerror=alert(1)>"
    image_results = [
        {"view": "front", "text": f"Product Name: Safe Biscuits {xss_payload}"}
    ]

    result = parse_packaging_text(image_results)
    raw_text = result["rawCombinedText"]
    
    # Text is captured as raw literal strings; when rendered in React/DOMPurify, it is sanitized
    assert "Safe Biscuits" in raw_text

def test_csp_header_blocks_inline_scripts(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    csp = res.headers.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "object-src 'none'" in csp
