import json
from pathlib import Path
from functools import lru_cache

DATA_DIR = Path(__file__).parent.parent / "data"
JSON_FILE = DATA_DIR / "categories.json"

@lru_cache(maxsize=1)
def load_data():
    if not JSON_FILE.exists():
        return {"fields": {}, "organizations": {}}
    with open(JSON_FILE, mode='r', encoding='utf-8') as f:
        return json.load(f)

def get_categories_for_org(org_code: str):
    data = load_data()
    org_cats = data["organizations"].get(org_code, [])
    fields_dict = data["fields"]
    
    # Determine leaves: a node is a leaf if its path is not a strict prefix of any other path
    paths = [c["path"] for c in org_cats]
    
    result = []
    for c in org_cats:
        cat_path = c["path"]
        is_leaf = True
        for other_path in paths:
            if other_path != cat_path and other_path.startswith(cat_path + " -> "):
                is_leaf = False
                break
                
        # Split path for UI levels
        parts = cat_path.split(" -> ")
        
        cat_obj = {
            "category_code": c["code"],
            "parent_category_code": "", 
            "category_name": parts[-1],
            "category_path": cat_path,
            "stage": c["stage"],
            "field_set_id": c["field_set_id"],
            "destination_routing_codes": c["destination_routing_codes"],
            "is_leaf_category": "Yes" if is_leaf else "No",
            "parsed_input_fields": fields_dict.get(c["field_set_id"], [])
        }
        
        # The MD file paths often start with the org name itself. We want to skip it for the UI levels.
        # e.g., "Telecommunications -> Mobile Related" -> level_1 is "Mobile Related"
        # We can identify if the first part is the org by checking if len(parts) > 1 and parts[0] is the org name or just generically skipping the first part if it's the root.
        # Let's just always shift by 1 if the path has > 1 parts and the first part has no '->' (which it doesn't since we split by it).
        # Wait, not all orgs might have the org name as the root. Let's just strip the first part if it matches the org's top-level name.
        # Since we don't have the org name easily here, we'll just skip the first part if it is at stage 1 or if we see the pattern.
        # Actually, let's just use the parts starting from index 1 if the first part is the same for all items in the org.
        
        if len(parts) == 1 and not is_leaf:
            continue
            
        root_name = parts[0]
        # We'll assign levels starting from the actual categories.
        # If the root_name is the only thing, it's stage 1.
        ui_parts = parts[1:] if len(parts) > 1 else parts
        
        for i, part in enumerate(ui_parts):
            if i == 0:
                cat_obj["level_1_category"] = part
            else:
                cat_obj[f"level_{i+1}_subcategory"] = part
                
        result.append(cat_obj)
        
    return result

def get_category_by_code(category_code: str):
    data = load_data()
    # brute force search for now
    for org_code, cats in data["organizations"].items():
        for c in cats:
            if c["code"] == category_code:
                # To return the full object, we can reuse get_categories_for_org
                org_cats = get_categories_for_org(org_code)
                for oc in org_cats:
                    if oc["category_code"] == category_code:
                        return oc
    return None
