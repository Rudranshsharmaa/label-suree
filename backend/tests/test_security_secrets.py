import os
import re
import pytest

def test_no_hardcoded_secrets_in_frontend():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src"))
    assert os.path.exists(frontend_dir), "Frontend src directory must exist"

    # Suspicious secret regex patterns
    gemini_key_pattern = re.compile(r"AIzaSy[0-9A-Za-z\-_]{33}")
    private_key_pattern = re.compile(r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----")

    for root, _, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith((".js", ".jsx", ".ts", ".tsx", ".html", ".json")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    assert not gemini_key_pattern.search(content), f"Potential hardcoded Gemini API key found in {file}"
                    assert not private_key_pattern.search(content), f"Private key found in {file}"
