from typing import Dict, Any, List, Optional

def calculate_health_grade(
    nutritional_data: Optional[Dict[str, Any]] = None, 
    ingredients_raw: str = "",
    food_classification: str = "Food Product"
) -> Dict[str, Any]:
    """
    Computes strict nutritional health score (0-100) and letter grade (A+ to F).
    Guarantees that NON-FOOD products never receive a health rating or score.
    """
    # 1. Non-Food Guard: Health grading is strictly not applicable
    class_lower = (food_classification or "").lower()
    if "non-food" in class_lower or "commodity" in class_lower:
        return {
            "grade": None,
            "score": None,
            "status": "NOT_APPLICABLE",
            "summary": "Health grading is not applicable to this product.",
            "positives": [],
            "concerns": [],
            "nutrients": []
        }

    # 2. Uncertain Classification Guard
    if "uncertain" in class_lower:
        return {
            "grade": None,
            "score": None,
            "status": "UNAVAILABLE",
            "summary": "Health rating unavailable: Product type could not be determined confidently.",
            "positives": [],
            "concerns": [],
            "nutrients": []
        }

    # 3. Food with missing or insufficient nutrition facts panel
    if not nutritional_data or not nutritional_data.get("hasNutritionPanel"):
        return {
            "grade": None,
            "score": None,
            "status": "UNAVAILABLE",
            "summary": "Health rating unavailable: Insufficient nutritional information.",
            "positives": [],
            "concerns": ["No nutritional facts panel detected"],
            "nutrients": []
        }

    energy = nutritional_data.get("energyKcal")
    total_sugar = nutritional_data.get("totalSugarG")
    added_sugar = nutritional_data.get("addedSugarG")
    sat_fat = nutritional_data.get("saturatedFatG")
    trans_fat = nutritional_data.get("transFatG")
    sodium = nutritional_data.get("sodiumMg")
    fiber = nutritional_data.get("dietaryFibreG")
    protein = nutritional_data.get("proteinG")

    # Balanced Baseline: 55.0 points
    score = 55.0
    positives: List[str] = []
    concerns: List[str] = []
    max_cap = "A+"

    def cap_to(cap_grade: str):
        nonlocal max_cap
        order = ["A+", "A", "B", "C", "D", "E", "F"]
        if order.index(cap_grade) > order.index(max_cap):
            max_cap = cap_grade

    has_positive_nutrients = (protein is not None and protein >= 4.0) or (fiber is not None and fiber >= 2.0)

    # 1. Sugar Assessment (Distinguish Added Sugar vs Total Sugar)
    if added_sugar is not None:
        if added_sugar > 30:
            score -= 30
            concerns.append(f"Excessive added sugar ({added_sugar}g/100g)")
            cap_to("D")
        elif added_sugar > 20:
            score -= 20
            concerns.append(f"High added sugar ({added_sugar}g/100g)")
            cap_to("C")
        elif added_sugar > 8:
            if not has_positive_nutrients:
                # Empty sugar liquid / confectionery without protein or fiber
                score -= 22
                concerns.append(f"High liquid/empty added sugar ({added_sugar}g/100g)")
                cap_to("D")
            else:
                score -= 10
                concerns.append(f"Moderate added sugar ({added_sugar}g/100g)")
        elif added_sugar > 4:
            score -= 4
        else:
            score += 8
            positives.append(f"Low / zero added sugar ({added_sugar}g/100g)")
    elif total_sugar is not None:
        if total_sugar > 40:
            score -= 25
            concerns.append(f"Excessive total sugar ({total_sugar}g/100g)")
            cap_to("D")
        elif total_sugar > 25:
            score -= 16
            concerns.append(f"High total sugar ({total_sugar}g/100g)")
        elif total_sugar > 10:
            if not has_positive_nutrients:
                score -= 18
                concerns.append(f"Elevated sugar with low protein/fibre ({total_sugar}g/100g)")
                cap_to("D")
            else:
                score -= 8
                concerns.append(f"Moderate sugar ({total_sugar}g/100g)")
        elif total_sugar > 5:
            score -= 3
        else:
            score += 6
            positives.append(f"Low sugar ({total_sugar}g/100g)")

    # 2. Saturated Fat Assessment (Forgiving for Moderate Levels)
    if sat_fat is not None:
        if sat_fat > 16:
            score -= 24
            concerns.append(f"Very high saturated fat ({sat_fat}g/100g)")
            cap_to("D")
        elif sat_fat > 10:
            score -= 15
            concerns.append(f"High saturated fat ({sat_fat}g/100g)")
        elif sat_fat > 5:
            score -= 8
            concerns.append(f"Moderate saturated fat ({sat_fat}g/100g)")
        elif sat_fat > 2.5:
            score -= 3
        else:
            if has_positive_nutrients or ((added_sugar is None or added_sugar <= 4) and (total_sugar is None or total_sugar <= 6)):
                score += 6
                positives.append(f"Low saturated fat ({sat_fat}g/100g)")

    # 3. Trans Fat Assessment (Strict Zero Tolerance)
    if trans_fat is not None and trans_fat > 0.2:
        score -= 25
        concerns.append(f"Contains industrial trans fats ({trans_fat}g/100g)")
        cap_to("E")

    # 4. Sodium Assessment
    if sodium is not None:
        if sodium > 1200:
            score -= 25
            concerns.append(f"Very high sodium ({sodium}mg/100g)")
            cap_to("D")
        elif sodium > 750:
            score -= 15
            concerns.append(f"High sodium ({sodium}mg/100g)")
        elif sodium > 400:
            score -= 8
            concerns.append(f"Moderate sodium ({sodium}mg/100g)")
        elif sodium > 150:
            score -= 2
        else:
            if has_positive_nutrients or ((added_sugar is None or added_sugar <= 4) and (total_sugar is None or total_sugar <= 6)):
                score += 6
                positives.append(f"Low sodium ({sodium}mg/100g)")

    # 5. Caloric Density (Contextual Adjustment)
    if energy is not None:
        if energy > 520:
            score -= 5
            concerns.append(f"High energy density ({energy} kcal/100g)")
        elif energy > 400:
            score -= 2
        elif energy < 150 and ((added_sugar is not None and added_sugar <= 5) or (total_sugar is not None and total_sugar <= 6)):
            score += 4
            positives.append(f"Low caloric density ({energy} kcal/100g)")

    # 6. Positive Factor: Dietary Fibre
    if fiber is not None:
        if fiber >= 8:
            score += 18
            positives.append(f"Rich in dietary fibre ({fiber}g/100g)")
        elif fiber >= 5:
            score += 12
            positives.append(f"High dietary fibre ({fiber}g/100g)")
        elif fiber >= 2.5:
            score += 6
            positives.append(f"Source of dietary fibre ({fiber}g/100g)")

    # 7. Positive Factor: Protein
    if protein is not None:
        if protein >= 20:
            score += 18
            positives.append(f"Rich in protein ({protein}g/100g)")
        elif protein >= 12:
            score += 12
            positives.append(f"High protein content ({protein}g/100g)")
        elif protein >= 6:
            score += 6
            positives.append(f"Good source of protein ({protein}g/100g)")

    # 8. Ingredient Quality Clues
    if ingredients_raw:
        ing_lower = ingredients_raw.lower()
        if any(term in ing_lower for term in ["palm oil", "palmolein", "hydrogenated", "partially hydrogenated"]):
            score -= 8
            concerns.append("Contains palm oil or hydrogenated fats")
        if any(term in ing_lower for term in ["high fructose", "corn syrup", "invert sugar", "glucose-fructose", "maltodextrin"]):
            score -= 6
            concerns.append("Contains refined high-glycemic syrups")
        if any(term in ing_lower for term in ["artificial sweetener", "aspartame", "sucralose", "acesulfame", "saccharin"]):
            score -= 8
            concerns.append("Contains artificial sweeteners")
        if any(term in ing_lower for term in ["100% whole", "100% roasted", "whole grain", "organic almonds", "roasted peanuts", "100% peanuts", "rolled oats"]):
            score += 10
            positives.append("Clean whole-food ingredient profile")

    final_score = max(0.0, min(100.0, score))

    # Balanced, lenient grade distribution thresholds
    if final_score >= 88:
        calc_grade = "A+"
    elif final_score >= 75:
        calc_grade = "A"
    elif final_score >= 60:
        calc_grade = "B"
    elif final_score >= 45:
        calc_grade = "C"
    elif final_score >= 30:
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

    # Dynamic explanation summary
    if final_grade in ("A+", "A"):
        summary = f"Exceptional nutritional quality with high protein/fibre and minimal added sugars. (Score: {round(final_score, 1)}/100)"
    elif final_grade == "B":
        summary = f"Good, balanced nutritional profile suitable for a healthy diet with reasonable nutrient density. (Score: {round(final_score, 1)}/100)"
    elif final_grade == "C":
        summary = f"Mixed nutritional profile with noticeable dietary considerations (sugars, saturated fats, or sodium). (Score: {round(final_score, 1)}/100)"
    elif final_grade == "D":
        summary = f"Significant nutritional concerns due to elevated added sugars, saturated fats, or sodium. (Score: {round(final_score, 1)}/100)"
    else:
        summary = f"Very high concentration of negative nutrients with minimal positive dietary elements. (Score: {round(final_score, 1)}/100)"

    nutrients = []
    if total_sugar is not None:
        nutrients.append({"name": "Total Sugar", "value": f"{total_sugar}g", "status": "HIGH" if total_sugar > 25 else ("MODERATE" if total_sugar > 12 else "LOW")})
    if added_sugar is not None:
        nutrients.append({"name": "Added Sugar", "value": f"{added_sugar}g", "status": "HIGH" if added_sugar > 20 else ("MODERATE" if added_sugar > 10 else "LOW")})
    if sat_fat is not None:
        nutrients.append({"name": "Saturated Fat", "value": f"{sat_fat}g", "status": "HIGH" if sat_fat > 10 else ("MODERATE" if sat_fat > 5 else "LOW")})
    if sodium is not None:
        nutrients.append({"name": "Sodium", "value": f"{sodium}mg", "status": "HIGH" if sodium > 750 else ("MODERATE" if sodium > 400 else "LOW")})
    if fiber is not None:
        nutrients.append({"name": "Dietary Fibre", "value": f"{fiber}g", "status": "HIGH" if fiber >= 5 else ("MODERATE" if fiber >= 2.5 else "LOW")})
    if protein is not None:
        nutrients.append({"name": "Protein", "value": f"{protein}g", "status": "HIGH" if protein >= 12 else ("MODERATE" if protein >= 6 else "LOW")})

    return {
        "grade": final_grade,
        "score": round(final_score, 1),
        "status": "EVALUATED",
        "summary": summary,
        "positives": positives,
        "concerns": concerns,
        "nutrients": nutrients
    }
