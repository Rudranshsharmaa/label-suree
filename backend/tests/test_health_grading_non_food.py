import pytest
from fastapi.testclient import TestClient
from backend.app.services.health_engine import calculate_health_grade
from backend.app.services.ai_service import analyze_packaging_with_quarantine
from backend.app.main import app

client = TestClient(app)

def test_health_grade_food_with_nutrition():
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 579,
        "proteinG": 21.1,
        "saturatedFatG": 3.8,
        "totalSugarG": 4.3,
        "addedSugarG": 0.0,
        "sodiumMg": 12,
        "dietaryFibreG": 12.5
    }
    result = calculate_health_grade(nutritional_data, food_classification="Food Product")
    assert result["grade"] in ("A+", "A", "B")
    assert result["score"] is not None
    assert result["score"] > 60.0
    assert result["status"] == "EVALUATED"

def test_health_grade_food_without_nutrition():
    result = calculate_health_grade({}, food_classification="Food Product")
    assert result["grade"] is None
    assert result["score"] is None
    assert result["status"] == "UNAVAILABLE"
    assert "Insufficient nutritional information" in result["summary"]

def test_health_grade_non_food():
    # Even if some numbers happen to be parsed, non-food MUST NOT receive health rating
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 500,
        "proteinG": 10.0
    }
    result = calculate_health_grade(nutritional_data, food_classification="Non-Food Commodity")
    assert result["grade"] is None
    assert result["score"] is None
    assert result["status"] == "NOT_APPLICABLE"
    assert "Health grading is not applicable" in result["summary"]

def test_health_grade_uncertain():
    result = calculate_health_grade({}, food_classification="UNCERTAIN — REQUIRES REVIEW")
    assert result["grade"] is None
    assert result["score"] is None
    assert result["status"] == "UNAVAILABLE"
    assert "Product type could not be determined confidently" in result["summary"]

def test_ai_service_non_food_analysis():
    # Shampoo packaging OCR
    shampoo_ocr = [
        {
            "view": "front",
            "text": "HERBAL SHAMPOO 200ml. For external use only. Ingredients: Sodium laureth sulfate, aqua."
        }
    ]
    analysis = analyze_packaging_with_quarantine(shampoo_ocr, product_name="Herbal Shampoo", category="Personal Care")
    assert analysis["food_classification"] == "Non-Food Commodity"
    assert analysis["health_rating"] is None
    assert analysis["health_score"] is None
    assert analysis["health_results"]["status"] == "NOT_APPLICABLE"
