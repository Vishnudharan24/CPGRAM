import json
import logging
import os
from openai import OpenAI
from app.services.organizations import organization_options
from app.services.categories import get_categories_for_org

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MODEL = "nvidia/nemotron-3.5-lightning:free"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    timeout=15.0,
)

def suggest_category_path(description: str) -> dict:
    # 1. Suggest Ministry
    orgs = organization_options()
    orgs_text = "\n".join([f"- {o['name']} (Code: {o['code']})" for o in orgs])
    
    prompt1 = f"""You are a smart grievance routing assistant.
Read the citizen's grievance description and pick the SINGLE most appropriate ministry/organization from the provided list.
You must output ONLY a valid JSON object (no markdown, no backticks) with the key "org_code" containing the Code of the selected organization.

Grievance: "{description}"

Organizations:
{orgs_text}
"""
    try:
        resp1 = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt1}],
            temperature=0.0
        )
        result1_text = resp1.choices[0].message.content.strip()
        if result1_text.startswith("```json"):
            result1_text = result1_text[7:-3].strip()
        org_data = json.loads(result1_text)
        org_code = org_data.get("org_code")
    except Exception as e:
        logging.error(f"Error in LLM step 1: {e}")
        return {"error": "Failed to suggest organization."}

    if not org_code:
        return {"error": "No organization suggested."}
        
    org_name = next((o['name'] for o in orgs if o['code'] == org_code), org_code)

    # 2. Suggest Category Path
    cats = get_categories_for_org(org_code)
    if not cats:
        return {
            "organization_code": org_code,
            "suggestion_text": f"AI Suggests Organization: {org_name}, but no specific sub-categories were found."
        }
        
    # We only care about leaf categories for the suggestion to give a complete path
    leaf_cats = [c for c in cats if c["is_leaf_category"] == "Yes"]
    # If no leaves strictly flagged, use all
    if not leaf_cats:
        leaf_cats = cats
        
    cats_text = "\n".join([f"- Path: '{c['category_path']}' (Code: {c['category_code']})" for c in leaf_cats])
    
    prompt2 = f"""You are a smart grievance routing assistant.
The grievance belongs to the organization: {org_name}.
Below is a list of valid category paths for this organization.
Read the citizen's grievance description and pick the SINGLE best category path.
Output ONLY a valid JSON object (no markdown, no backticks) with the keys "category_path", "category_code", and "reasoning".

Grievance: "{description}"

Categories:
{cats_text}
"""
    try:
        resp2 = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt2}],
            temperature=0.0
        )
        result2_text = resp2.choices[0].message.content.strip()
        if result2_text.startswith("```json"):
            result2_text = result2_text[7:-3].strip()
        cat_data = json.loads(result2_text)
        
        category_path = cat_data.get("category_path")
        category_code = cat_data.get("category_code")
        reasoning = cat_data.get("reasoning", "Matches the description closely.")
        
        return {
            "organization_code": org_code,
            "category_path": category_path,
            "category_code": category_code,
            "suggestion_text": f"AI Suggests: {org_name} -> {category_path}. (Reasoning: {reasoning})"
        }
    except Exception as e:
        logging.error(f"Error in LLM step 2: {e}")
        return {
            "organization_code": org_code,
            "suggestion_text": f"AI Suggests Organization: {org_name}. (Category suggestion failed)"
        }
