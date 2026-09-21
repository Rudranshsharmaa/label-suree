import re
from typing import List, Dict, Any, Optional

PACKAGING_VIEWS = [
    {"id": "front", "label": "Front Packaging", "description": "Brand, product name, net quantity, veg/non-veg logo"},
    {"id": "back", "label": "Back Packaging", "description": "Ingredients, nutritional table, manufacturer, FSSAI lic."},
    {"id": "left", "label": "Left Side", "description": "Storage instructions, batch details, consumer care"},
    {"id": "right", "label": "Right Side", "description": "Certifications, barcodes, recycling symbols"},
    {"id": "top", "label": "Top Lid / Cap", "description": "Seal integrity, branding"},
    {"id": "bottom", "label": "Bottom Base", "description": "Manufacturing code, container markings"},
    {"id": "mrp_close", "label": "MRP Close-Up", "description": "Clear focus on price and taxes declaration"},
    {"id": "date_close", "label": "Date / Expiry Close-Up", "description": "MFD, PKD, Expiry or Best Before date"},
    {"id": "ingredients_close", "label": "Ingredients Close-Up", "description": "High-res view of full ingredient listing"},
    {"id": "nutrition_close", "label": "Nutrition Label Close-Up", "description": "Nutritional facts table per 100g / serve"},
]

def parse_packaging_text(image_results: List[Dict[str, Any]] = None, qr_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Parses and normalizes text extracted from multi-angle food packaging scans.
    """
    if image_results is None:
        image_results = []

    combined_text = "\n".join([r.get("text", "") for r in image_results])
    normalized_text = combined_text.replace("\r\n", "\n")

    # 1. MRP Detection
    mrp_regex = re.compile(r"(?:mrp|m\.r\.p\.?|max\s*retail\s*price|price)\s*[:\-]?\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)", re.IGNORECASE)
    mrp_tax_regex = re.compile(r"(?:incl\.?|inclusive)\s*(?:of)?\s*(?:all)?\s*taxes", re.IGNORECASE)
    mrp_match = mrp_regex.search(normalized_text)
    mrp_tax_match = mrp_tax_regex.search(normalized_text)

    mrp_data = {
        "value": float(mrp_match.group(1)) if mrp_match else None,
        "formatted": f"₹ {mrp_match.group(1)}" if mrp_match else None,
        "inclusiveOfTaxes": bool(mrp_tax_match),
        "detectedVia": "Packaging OCR" if mrp_match else None,
        "sourceView": find_source_view(image_results, mrp_regex),
        "status": "DETECTED" if mrp_match else "NOT_FOUND"
    }

    # 2. Manufacturing / Packaging Date
    mfd_regex = re.compile(r"(?:mfd|mfg\.?\s*date|manufactured\s*(?:on|date)?|pkd|packed\s*(?:on|date)?)\s*[:\-]?\s*([0-9]{1,2}[./\-\s][0-9]{1,2}[./\-\s][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4})", re.IGNORECASE)
    mfd_match = mfd_regex.search(normalized_text)
    mfd_data = {
        "raw": mfd_match.group(1).strip() if mfd_match else None,
        "detectedVia": "Packaging OCR" if mfd_match else None,
        "sourceView": find_source_view(image_results, mfd_regex),
        "status": "DETECTED" if mfd_match else "NOT_FOUND"
    }

    # 3. Expiry / Best Before Date
    exp_regex = re.compile(r"(?:exp(?:iry)?\.?\s*date|best\s*before|use\s*by|expires\s*(?:on)?)\s*[:\-]?\s*([0-9]{1,2}[./\-\s][0-9]{1,2}[./\-\s][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{2,4}|[0-9]+\s*(?:months|days|weeks)\s*(?:from\s*(?:mfg|pkd|manufacture))?)", re.IGNORECASE)
    exp_match = exp_regex.search(normalized_text)
    exp_data = {
        "raw": exp_match.group(1).strip() if exp_match else None,
        "detectedVia": "Packaging OCR" if exp_match else None,
        "sourceView": find_source_view(image_results, exp_regex),
        "status": "DETECTED" if exp_match else "NOT_FOUND"
    }

    # 4. Batch Number
    batch_regex = re.compile(r"(?:batch\s*(?:no\.?|number)|lot\s*(?:no\.?|number)|b\.?\s*no\.?|b/no\.?|bn)\s*[:\-]?\s*([A-Za-z0-9\-_/]+)", re.IGNORECASE)
    batch_match = batch_regex.search(normalized_text)
    batch_data = {
        "value": batch_match.group(1).strip() if batch_match else None,
        "detectedVia": "Packaging OCR" if batch_match else None,
        "sourceView": find_source_view(image_results, batch_regex)
    }

    # 5. Net Quantity
    net_qty_regex = re.compile(r"(?:net\s*(?:qty|quantity|wt\.?|weight|volume|content))\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|litres|pcs|units|count|n))", re.IGNORECASE)
    net_qty_match = net_qty_regex.search(normalized_text)
    net_qty_data = {
        "value": net_qty_match.group(1).strip() if net_qty_match else None,
        "detectedVia": "Packaging OCR" if net_qty_match else None,
        "sourceView": find_source_view(image_results, net_qty_regex)
    }

    # 6. FSSAI 14-Digit License
    fssai_regex = re.compile(r"(?:fssai|lic(?:ense)?\.?\s*(?:no\.?|number)?)\s*[:\-]?\s*([0-9]{14})|(?:licence\s*no\.?\s*:\s*)([0-9]{14})|\b(1[0-9]{13})\b", re.IGNORECASE)
    fssai_match = fssai_regex.search(normalized_text)
    fssai_num = (fssai_match.group(1) or fssai_match.group(2) or fssai_match.group(3)) if fssai_match else None
    fssai_data = {
        "licenseNumber": fssai_num,
        "isValidFormat": len(fssai_num) == 14 if fssai_num else False,
        "hasLogo": bool(re.search(r"(?:fssai\s*logo|fssai)", normalized_text, re.IGNORECASE)),
        "detectedVia": "Packaging OCR" if fssai_num else None,
        "sourceView": find_source_view(image_results, fssai_regex)
    }

    # 7. Veg / Non-Veg
    is_veg = bool(re.search(r"(?:100%\s*vegetarian|vegetarian|green\s*dot|veg\s*logo|\bveg\b)", normalized_text, re.IGNORECASE)) and not bool(re.search(r"(?:non[\s\-]veg)", normalized_text, re.IGNORECASE))
    is_non_veg = bool(re.search(r"(?:non[\s\-]veg|contains\s*meat|contains\s*egg|non[\s\-]vegetarian|brown\s*dot)", normalized_text, re.IGNORECASE))
    veg_status = "VEGETARIAN" if is_veg else ("NON_VEGETARIAN" if is_non_veg else "UNCONFIRMED")

    # 8. Ingredients
    ing_regex = re.compile(r"ingredients\s*[:\-]?\s*([\s\S]+?)(?=(?:nutrition|mfg|packed|fssai|marketed|manufactured|storage|allergen|consumer care|$))", re.IGNORECASE)
    ing_match = ing_regex.search(normalized_text)
    ingredients_raw = re.sub(r"\s+", " ", ing_match.group(1)).strip() if ing_match else None

    # 9. Nutritional Data
    energy_match = re.search(r"(?:energy|calories)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:kcal|cal|kj)?", normalized_text, re.IGNORECASE)
    protein_match = re.search(r"(?:protein)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    carb_match = re.search(r"(?:carbohydrate|carbs|total\s*carbohydrate)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    sugar_match = re.search(r"(?:total\s*sugar|sugars?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    added_sugar_match = re.search(r"(?:added\s*sugars?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    fat_match = re.search(r"(?:total\s*fat|fat)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    sat_fat_match = re.search(r"(?:saturated\s*fat(?:ty\s*acids)?|sat\s*fat)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    trans_fat_match = re.search(r"(?:trans\s*fat(?:ty\s*acids)?)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)
    sodium_match = re.search(r"(?:sodium|salt)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg|g)?", normalized_text, re.IGNORECASE)
    fibre_match = re.search(r"(?:dietary\s*fibre|fiber)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm)?", normalized_text, re.IGNORECASE)

    nutritional_data = {
        "hasNutritionPanel": bool(energy_match or protein_match or carb_match or fat_match or sugar_match),
        "energyKcal": float(energy_match.group(1)) if energy_match else None,
        "proteinG": float(protein_match.group(1)) if protein_match else None,
        "carbohydratesG": float(carb_match.group(1)) if carb_match else None,
        "totalSugarG": float(sugar_match.group(1)) if sugar_match else None,
        "addedSugarG": float(added_sugar_match.group(1)) if added_sugar_match else None,
        "fatG": float(fat_match.group(1)) if fat_match else None,
        "saturatedFatG": float(sat_fat_match.group(1)) if sat_fat_match else None,
        "transFatG": float(trans_fat_match.group(1)) if trans_fat_match else None,
        "sodiumMg": float(sodium_match.group(1)) if sodium_match else None,
        "dietaryFibreG": float(fibre_match.group(1)) if fibre_match else None,
        "servingSize": "Per 100g"
    }

    # 10. Manufacturer & Customer Care
    mfg_match = re.search(r"(?:manufactured\s*by|marketed\s*by|packed\s*by|mfd\s*by)\s*[:\-]?\s*([^\n]+)", normalized_text, re.IGNORECASE)
    care_match = re.search(r"(?:customer\s*care|consumer\s*care|feedback|grievance|contact\s*us)\s*[:\-]?\s*([^\n]+)", normalized_text, re.IGNORECASE)

    return {
        "rawCombinedText": normalized_text,
        "mrp": mrp_data,
        "manufacturingDate": mfd_data,
        "expiryDate": exp_data,
        "batchNumber": batch_data,
        "netQuantity": net_qty_data,
        "fssai": fssai_data,
        "vegNonVegStatus": veg_status,
        "ingredientsRaw": ingredients_raw,
        "nutritionalData": nutritional_data,
        "manufacturerInfo": mfg_match.group(1).strip() if mfg_match else None,
        "customerCareInfo": care_match.group(1).strip() if care_match else None,
        "qrData": qr_data
    }

def find_source_view(image_results: List[Dict[str, Any]], regex: re.Pattern) -> Optional[str]:
    for item in image_results:
        text = item.get("text", "")
        if text and regex.search(text):
            return item.get("view", "Packaging Image")
    return None
