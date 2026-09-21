import io
import pytest
from PIL import Image

def create_test_image_bytes(format="JPEG", size=(200, 200), color="green"):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()

def test_valid_image_upload(client, auth_headers_user_a):
    img_bytes = create_test_image_bytes(format="JPEG")
    files = {"file": ("packaging_front.jpg", img_bytes, "image/jpeg")}
    data = {"view": "front"}

    res = client.post("/api/v1/upload", files=files, data=data, headers=auth_headers_user_a)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["success"] is True
    assert res_data["view"] == "front"
    assert res_data["format"] == "JPEG"

def test_fake_image_polyglot_rejected_by_pillow(client, auth_headers_user_a):
    # Fake image: python/shell code disguised with a .jpg filename
    malicious_script = b"#!/bin/bash\necho 'hacked'\nimport os\n"
    files = {"file": ("malicious.jpg", malicious_script, "image/jpeg")}

    res = client.post("/api/v1/upload", files=files, headers=auth_headers_user_a)
    assert res.status_code == 400
    assert "Invalid or corrupted image format" in res.json()["detail"]

def test_oversized_image_rejected(client, auth_headers_user_a):
    # Create image exceeding max dimensions (e.g. 5000 x 5000)
    huge_img = create_test_image_bytes(format="PNG", size=(5000, 5000))
    files = {"file": ("huge.png", huge_img, "image/png")}

    res = client.post("/api/v1/upload", files=files, headers=auth_headers_user_a)
    assert res.status_code == 400
    assert "exceed maximum allowed" in res.json()["detail"]
