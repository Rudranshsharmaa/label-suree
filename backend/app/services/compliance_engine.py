from typing import Dict, Any, List

def evaluate_compliance(parsed_fields: Dict[str, Any], food_classification: str = "Food Product", category: str = "General Packaged Food") -> Dict[str, Any]:
    """
    Evaluates statutory compliance under the Food Safety and Standards Act (2006)
    and Legal Metrology (Packaged Commodities) Rules.
    """
    findings = []
    
    # 1. Product Name Declaration
    has_name = bool(parsed_fields.get("product_name") or "product" in parsed_fields.get("rawCombinedText", "").lower())
    findings.append({
        "id": "RULE-NAME-01",
        "regulation": "FSS (Labelling and Display) Reg 5(1) & Legal Metrology Rule 6(1)(a)",
        "parameter": "Name of the Food & True Nature",
        "status": "COMPLIANT" if has_name else "REQUIRES_MANUAL_REVIEW",
        "severity": "CRITICAL" if not has_name else "INFO",
        "observation": "Clear declaration of product identity detected on primary packaging." if has_name else "Product name clarity unconfirmed from current scan views."
    })

    # 2. Maximum Retail Price (MRP)
    mrp = parsed_fields.get("mrp", {})
    if mrp.get("value") is not None:
        mrp_status = "COMPLIANT"
        mrp_obs = f"MRP declared as {mrp.get('formatted')} (inclusive of all taxes: {mrp.get('inclusiveOfTaxes')})."
    else:
        mrp_status = "MISSING"
        mrp_obs = "MRP declaration not detected in scanned packaging views. Physical packaging must display retail price."

    findings.append({
        "id": "RULE-MRP-02",
        "regulation": "Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)",
        "parameter": "Maximum Retail Price (MRP)",
        "status": mrp_status,
        "severity": "CRITICAL" if mrp_status == "MISSING" else "INFO",
        "observation": mrp_obs
    })

    # 3. Expiry / Best Before Date
    exp = parsed_fields.get("expiryDate", {})
    if exp.get("raw"):
        exp_status = "COMPLIANT"
        exp_obs = f"Expiry / Best Before date declared: {exp.get('raw')}."
    else:
        exp_status = "MISSING"
        exp_obs = "Expiry or Best Before declaration not detected in scanned packaging views."

    findings.append({
        "id": "RULE-EXP-03",
        "regulation": "FSS (Labelling and Display) Reg 5(3)(b) & Legal Metrology Rule 6(1)(d)",
        "parameter": "Date Marking / Expiry / Best Before",
        "status": exp_status,
        "severity": "CRITICAL" if exp_status == "MISSING" else "INFO",
        "observation": exp_obs
    })

    # 4. Net Quantity
    net_qty = parsed_fields.get("netQuantity", {})
    if net_qty.get("value"):
        net_status = "COMPLIANT"
        net_obs = f"Net quantity declared as {net_qty.get('value')}."
    else:
        net_status = "MISSING"
        net_obs = "Net quantity / weight declaration not identified."

    findings.append({
        "id": "RULE-QTY-04",
        "regulation": "Legal Metrology (Packaged Commodities) Rules — Rule 6(1)(b)",
        "parameter": "Net Quantity & Metric Weight",
        "status": net_status,
        "severity": "HIGH" if net_status == "MISSING" else "INFO",
        "observation": net_obs
    })

    # 5. FSSAI 14-Digit License (Category-Dependent)
    fssai = parsed_fields.get("fssai", {})
    is_non_food = "non-food" in food_classification.lower()
    
    if is_non_food:
        fssai_status = "NOT_APPLICABLE"
        fssai_obs = "FSSAI license is not applicable to non-food commodities."
    elif fssai.get("isValidFormat"):
        fssai_status = "COMPLIANT"
        fssai_obs = f"Valid 14-digit FSSAI license number ({fssai.get('licenseNumber')}) detected."
    elif fssai.get("licenseNumber"):
        fssai_status = "NON_COMPLIANT"
        fssai_obs = f"Detected FSSAI number ({fssai.get('licenseNumber')}) does not meet the mandatory 14-digit format requirement."
    else:
        fssai_status = "REQUIRES_MANUAL_REVIEW"
        fssai_obs = "14-digit FSSAI registration number not detected in scanned views. Manual verification recommended."

    findings.append({
        "id": "RULE-FSSAI-05",
        "regulation": "Food Safety and Standards (Licensing & Registration) Regulations, 2011",
        "parameter": "FSSAI 14-Digit License / Registration",
        "status": fssai_status,
        "severity": "CRITICAL" if fssai_status == "NON_COMPLIANT" else ("HIGH" if fssai_status == "MISSING" else "INFO"),
        "observation": fssai_obs
    })

    # 6. Vegetarian / Non-Vegetarian Logo
    veg_status = parsed_fields.get("vegNonVegStatus", "UNCONFIRMED")
    if is_non_food:
        v_status = "NOT_APPLICABLE"
        v_obs = "Veg/Non-Veg logo not applicable to non-food commodities."
    elif veg_status in ("VEGETARIAN", "NON_VEGETARIAN"):
        v_status = "COMPLIANT"
        v_obs = f"Product correctly categorized as {veg_status}."
    else:
        v_status = "REQUIRES_MANUAL_REVIEW"
        v_obs = "Veg / Non-Veg symbol could not be confirmed from scanned images."

    findings.append({
        "id": "RULE-VEG-06",
        "regulation": "FSS (Labelling and Display) Reg 5(4) — Veg / Non-Veg Symbol",
        "parameter": "Vegetarian / Non-Vegetarian Declaration",
        "status": v_status,
        "severity": "HIGH" if v_status == "MISSING" else "INFO",
        "observation": v_obs
    })

    # 7. Nutritional Information Table
    nutrition = parsed_fields.get("nutritionalData", {})
    if is_non_food:
        nut_status = "NOT_APPLICABLE"
        nut_obs = "Nutritional panel not applicable to non-food commodities."
    elif nutrition.get("hasNutritionPanel"):
        nut_status = "COMPLIANT"
        nut_obs = "Nutritional facts table detected and extracted."
    else:
        nut_status = "MISSING"
        nut_obs = "Nutritional facts panel not detected in scanned packaging views."

    findings.append({
        "id": "RULE-NUT-07",
        "regulation": "FSS (Labelling and Display) Reg 5(3) — Nutritional Information",
        "parameter": "Nutritional Facts Table (Per 100g / Serving)",
        "status": nut_status,
        "severity": "HIGH" if nut_status == "MISSING" else "INFO",
        "observation": nut_obs
    })

    # Determine overall status
    critical_missing = any(f["status"] == "MISSING" and f["severity"] == "CRITICAL" for f in findings)
    non_compliant = any(f["status"] == "NON_COMPLIANT" for f in findings)
    manual_review = any(f["status"] == "REQUIRES_MANUAL_REVIEW" for f in findings)

    if non_compliant or critical_missing:
        overall_status = "NON_COMPLIANT"
    elif manual_review:
        overall_status = "REQUIRES_MANUAL_REVIEW"
    else:
        overall_status = "COMPLIANT"

    return {
        "overall_status": overall_status,
        "findings": findings,
        "total_rules": len(findings),
        "compliant_rules": sum(1 for f in findings if f["status"] == "COMPLIANT"),
        "non_compliant_rules": sum(1 for f in findings if f["status"] == "NON_COMPLIANT"),
        "missing_rules": sum(1 for f in findings if f["status"] == "MISSING"),
        "manual_review_rules": sum(1 for f in findings if f["status"] == "REQUIRES_MANUAL_REVIEW"),
        "not_applicable_rules": sum(1 for f in findings if f["status"] == "NOT_APPLICABLE")
    }
