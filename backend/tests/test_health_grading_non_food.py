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

def test_pure_peanut_butter_grading():
    # 100% roasted peanuts without added sugar or hydrogenated fat
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 620,
        "proteinG": 26.0,
        "saturatedFatG": 6.8,
        "totalSugarG": 4.5,
        "addedSugarG": 0.0,
        "sodiumMg": 10,
        "dietaryFibreG": 8.5
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="100% Roasted Peanuts", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("A+", "A")
    assert result["score"] >= 88.0
    assert result["status"] == "EVALUATED"

def test_commercial_peanut_butter_with_sugar_and_palm_oil():
    # Peanut butter with added sugar and hydrogenated palm oil
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 590,
        "proteinG": 20.0,
        "saturatedFatG": 10.5,
        "totalSugarG": 16.0,
        "addedSugarG": 12.0,
        "sodiumMg": 350,
        "dietaryFibreG": 5.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Roasted Peanuts, Sugar, Hydrogenated Palm Oil, Salt", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("B", "C")
    assert result["score"] < 65.0

def test_whole_almonds_grading():
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 579,
        "proteinG": 21.1,
        "saturatedFatG": 3.8,
        "totalSugarG": 4.3,
        "addedSugarG": 0.0,
        "sodiumMg": 1,
        "dietaryFibreG": 12.5
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="100% California Almonds", 
        food_classification="Food Product"
    )
    assert result["grade"] == "A+"
    assert result["score"] >= 90.0

def test_whole_rolled_oats_grading():
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 389,
        "proteinG": 13.5,
        "saturatedFatG": 1.2,
        "totalSugarG": 1.0,
        "addedSugarG": 0.0,
        "sodiumMg": 2,
        "dietaryFibreG": 10.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="100% Whole Grain Rolled Oats", 
        food_classification="Food Product"
    )
    assert result["grade"] == "A+"
    assert result["score"] >= 90.0

def test_dairy_natural_lactose_grading():
    # Plain greek yogurt with naturally occurring lactose (no added sugar)
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 65,
        "proteinG": 10.0,
        "saturatedFatG": 2.5,
        "totalSugarG": 3.8,
        "addedSugarG": 0.0,
        "sodiumMg": 40,
        "dietaryFibreG": 0.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Pasteurized Milk, Live Active Yogurt Cultures", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("A+", "A")
    assert result["score"] >= 80.0

def test_breakfast_cereal_grading():
    # Fortified cereal with moderate added sugar, but good fibre & protein
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 375,
        "proteinG": 8.0,
        "saturatedFatG": 1.5,
        "totalSugarG": 15.0,
        "addedSugarG": 12.0,
        "sodiumMg": 380,
        "dietaryFibreG": 6.5
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Whole Grain Wheat, Sugar, Vitamins and Minerals", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("A", "B", "C")
    assert 50.0 <= result["score"] <= 85.0

def test_potato_crisps_grading():
    # Fried potato crisps with high saturated fat and sodium
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 535,
        "proteinG": 6.5,
        "saturatedFatG": 11.0,
        "totalSugarG": 0.5,
        "addedSugarG": 0.0,
        "sodiumMg": 850,
        "dietaryFibreG": 3.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Potatoes, Palmolein Oil, Salt, Seasoning", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("D", "E")
    assert result["score"] <= 40.0

def test_chocolate_hazelnut_spread_grading():
    # 50%+ added sugar and palm oil
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 540,
        "proteinG": 6.0,
        "saturatedFatG": 11.0,
        "totalSugarG": 56.0,
        "addedSugarG": 50.0,
        "sodiumMg": 45,
        "dietaryFibreG": 3.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Sugar, Palm Oil, Hazelnuts, Cocoa, Skimmed Milk Powder", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("E", "F")
    assert result["score"] <= 25.0

def test_sugary_carbonated_beverage_grading():
    # Empty sugar liquid with no protein or fiber
    nutritional_data = {
        "hasNutritionPanel": True,
        "energyKcal": 42,
        "proteinG": 0.0,
        "saturatedFatG": 0.0,
        "totalSugarG": 10.6,
        "addedSugarG": 10.6,
        "sodiumMg": 10,
        "dietaryFibreG": 0.0
    }
    result = calculate_health_grade(
        nutritional_data, 
        ingredients_raw="Carbonated Water, Sugar, Acidity Regulator, Caramel Color", 
        food_classification="Food Product"
    )
    assert result["grade"] in ("D", "E")
    assert result["score"] <= 38.0

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
