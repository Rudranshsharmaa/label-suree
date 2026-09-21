from typing import Dict, Any

def calculate_health_grade(nutritional_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes nutritional health score (0-100) and letter grade (A+ to F).
    """
    if not nutritional_data or not nutritional_data.get("hasNutritionPanel"):
        return {
            "grade": "N/A",
            "score": 0.0,
            "status": "UNAVAILABLE",
            "summary": "Nutritional data not provided or unreadable from packaging views.",
            "nutrients": []
        }

    sugar = nutritional_data.get("totalSugarG") or 0.0
    sat_fat = nutritional_data.get("saturatedFatG") or 0.0
    sodium = nutritional_data.get("sodiumMg") or 0.0
    fiber = nutritional_data.get("dietaryFibreG") or 0.0
    protein = nutritional_data.get("proteinG") or 0.0

    # Baseline 100
    score = 100.0

    # Negative factors (Per 100g)
    # Sugar penalties
    if sugar > 22.5:
        score -= 30
    elif sugar > 10:
        score -= 15
    elif sugar > 5:
        score -= 5

    # Saturated Fat penalties
    if sat_fat > 5:
        score -= 25
    elif sat_fat > 1.5:
        score -= 12

    # Sodium penalties
    if sodium > 600:
        score -= 25
    elif sodium > 300:
        score -= 12

    # Positive factors
    if fiber >= 6:
        score += 15
    elif fiber >= 3:
        score += 8

    if protein >= 10:
        score += 15
    elif protein >= 5:
        score += 8

    # Clamp 0 - 100
    final_score = max(0.0, min(100.0, score))

    if final_score >= 90:
        grade = "A+"
    elif final_score >= 80:
        grade = "A"
    elif final_score >= 70:
        grade = "B"
    elif final_score >= 55:
        grade = "C"
    elif final_score >= 40:
        grade = "D"
    else:
        grade = "F"

    nutrients = [
        {"name": "Total Sugar", "value": f"{sugar}g", "status": "HIGH" if sugar > 22.5 else ("MODERATE" if sugar > 10 else "LOW")},
        {"name": "Saturated Fat", "value": f"{sat_fat}g", "status": "HIGH" if sat_fat > 5 else ("MODERATE" if sat_fat > 1.5 else "LOW")},
        {"name": "Sodium", "value": f"{sodium}mg", "status": "HIGH" if sodium > 600 else ("MODERATE" if sodium > 300 else "LOW")},
        {"name": "Dietary Fibre", "value": f"{fiber}g", "status": "HIGH" if fiber >= 6 else ("MODERATE" if fiber >= 3 else "LOW")},
        {"name": "Protein", "value": f"{protein}g", "status": "HIGH" if protein >= 10 else ("MODERATE" if protein >= 5 else "LOW")},
    ]

    return {
        "grade": grade,
        "score": round(final_score, 1),
        "status": "EVALUATED",
        "summary": f"Nutritional Health Grade: {grade} (Score: {round(final_score, 1)}/100)",
        "nutrients": nutrients
    }
