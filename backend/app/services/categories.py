import csv
import re
from pathlib import Path
from functools import lru_cache

DATA_DIR = Path(__file__).parent.parent / "data"
CSV_FILE = DATA_DIR / "cat_sub.csv"

def parse_input_fields(fields_str: str) -> list[dict]:
    if not fields_str or not isinstance(fields_str, str) or fields_str.strip() == "":
        return []
    fields = []
    # Example format: I.P No. (required; Textbox; AlNum); Name of B.O (required; Textbox; AlNum)
    matches = re.finditer(r'(.*?)\s*\((.*?)\)', fields_str)
    for match in matches:
        label = match.group(1).strip('; ')
        props = [p.strip() for p in match.group(2).split(';')]
        required = 'required' in [p.lower() for p in props]
        field_type = props[1] if len(props) > 1 else 'Textbox'
        data_type = props[2] if len(props) > 2 else 'AlNum'
        fields.append({
            "label": label,
            "required": required,
            "type": field_type,
            "dataType": data_type
        })
    return fields

@lru_cache(maxsize=1)
def load_categories():
    categories = []
    if not CSV_FILE.exists():
        return categories
    with open(CSV_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cat = dict(row)
            cat["parsed_input_fields"] = parse_input_fields(cat.get("input_fields_for_ui", ""))
            categories.append(cat)
    return categories

def get_categories_for_org(org_code: str):
    all_categories = load_categories()
    return [c for c in all_categories if c.get("org_code") == org_code]

def get_category_by_code(category_code: str):
    all_categories = load_categories()
    for c in all_categories:
        if c.get("category_code") == category_code:
            return c
    return None
