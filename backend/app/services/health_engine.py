from typing import Dict, Any, List

def calculate_health_grade(nutritional_data: Dict[str, Any], ingredients_raw: str = "") -> Dict[str, Any]:
    """
    Computes strict nutritional health score (0-100) and letter grade (A+ to F).
    """
    if not nutritional_data or not nutritional_data.get("hasNutritionPanel"):
        return {
            "grade": "N/A",
            "score": 0.0,
            "status": "UNAVAILABLE",
            "summary": "Health rating unavailable: Insufficient nutritional information.",
            "positives": [],
            "concerns": ["No nutritional facts panel detected"],
            "nutrients": []
        }

    sugar = nutritional_data.get("totalSugarG") or 0.0
    sat_fat = nutritional_data.get("saturatedFatG") or 0.0
    sodium = nutritional_data.get("sodiumMg") or 0.0
    fiber = nutritional_data.get("dietaryFibreG") or 0.0
    protein = nutritional_data.get("proteinG") or 0.0

    # Baseline 50
    score = 50.0
    positives: List[str] = []
    concerns: List[str] = []
    max_cap = "A+"

    def cap_to(cap_grade: str):
        nonlocal max_cap
        order = ["A+", "A", "B", "C", "D", "E", "F"]
        if order.index(cap_grade) > order.index(max_cap):
            max_cap = cap_grade

    # Sugar penalties
    if sugar > 35:
        score -= 35
        concerns.append(f"Excessive sugar ({sugar}g/100g)")
        cap_to("D")
    elif sugar > 22:
        score -= 25
        concerns.append(f"High sugar ({sugar}g/100g)")
        cap_to("C")
    elif sugar > 10:
        score -= 12
        concerns.append(f"Moderate sugar ({sugar}g/100g)")
        cap_to("B")
    elif sugar > 5:
        score -= 4
    else:
        score += 10
        positives.append(f"Low sugar ({sugar}g/100g)")

    # Saturated Fat penalties
    if sat_fat > 12:
        score -= 30
        concerns.append(f"High saturated fat ({sat_fat}g/100g)")
        cap_to("D")
    elif sat_fat > 5:
        score -= 18
        concerns.append(f"Elevated saturated fat ({sat_fat}g/100g)")
        cap_to("C")
    elif sat_fat > 2:
        score -= 8
        concerns.append(f"Moderate saturated fat ({sat_fat}g/100g)")
        cap_to("B")
    else:
        score += 8
        positives.append(f"Low saturated fat ({sat_fat}g/100g)")

    # Sodium penalties
    if sodium > 900:
        score -= 25
        concerns.append(f"High sodium ({sodium}mg/100g)")
        cap_to("D")
    elif sodium > 500:
        score -= 15
        concerns.append(f"Elevated sodium ({sodium}mg/100g)")
        cap_to("C")
    elif sodium > 250:
        score -= 6
        concerns.append(f"Moderate sodium ({sodium}mg/100g)")
        cap_to("B")
    else:
        score += 8
        positives.append(f"Low sodium ({sodium}mg/100g)")

    # Positive nutrients
    if fiber >= 7:
        score += 15
        positives.append(f"High dietary fibre ({fiber}g/100g)")
    elif fiber >= 3.5:
        score += 8
        positives.append(f"Source of dietary fibre ({fiber}g/100g)")

    if protein >= 15:
        score += 15
        positives.append(f"Rich in protein ({protein}g/100g)")
    elif protein >= 8:
        score += 8
        positives.append(f"Good source of protein ({protein}g/100g)")

    final_score = max(0.0, min(100.0, score))

    if final_score >= 92:
        calc_grade = "A+"
    elif final_score >= 80:
        calc_grade = "A"
    elif final_score >= 65:
        calc_grade = "B"
    elif final_score >= 48:
        calc_grade = "C"
    elif final_score >= 32:
        calc_grade = "D"
    elif final_score >= 18:
        calc_grade = "E"
    else:
        calc_grade = "F"

    order = ["A+", "A", "B", "C", "D", "E", "F"]
    if order.index(calc_grade) < order.index(max_cap):
        final_grade = max_cap
    else:
        final_grade = calc_grade

    nutrients = [
        {"name": "Total Sugar", "value": f"{sugar}g", "status": "HIGH" if sugar > 22 else ("MODERATE" if sugar > 10 else "LOW")},
        {"name": "Saturated Fat", "value": f"{sat_fat}g", "status": "HIGH" if sat_fat > 5 else ("MODERATE" if sat_fat > 2 else "LOW")},
        {"name": "Sodium", "value": f"{sodium}mg", "status": "HIGH" if sodium > 500 else ("MODERATE" if sodium > 250 else "LOW")},
        {"name": "Dietary Fibre", "value": f"{fiber}g", "status": "HIGH" if fiber >= 7 else ("MODERATE" if fiber >= 3.5 else "LOW")},
        {"name": "Protein", "value": f"{protein}g", "status": "HIGH" if protein >= 15 else ("MODERATE" if protein >= 8 else "LOW")},
    ]

    return {
        "grade": final_grade,
        "score": round(final_score, 1),
        "status": "EVALUATED",
        "summary": f"Nutritional Health Grade: {final_grade} (Score: {round(final_score, 1)}/100)",
        "positives": positives,
        "concerns": concerns,
        "nutrients": nutrients
    }
