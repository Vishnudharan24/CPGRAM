from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.core.enums import UserRole
from app.deps import require_role
from app.models.user import User
from app.services.categories import get_categories_for_org, get_category_by_code

router = APIRouter(tags=["categories"])

@router.get("/organisations/{org_code}/categories")
def list_categories_for_org(
    org_code: str, 
    _user: User = Depends(require_role(UserRole.citizen, UserRole.admin, UserRole.officer))
):
    categories = get_categories_for_org(org_code)
    if not categories:
        raise HTTPException(status_code=404, detail="No categories found for this organisation")
    return categories

@router.get("/categories/{category_code}")
def get_category_details(
    category_code: str,
    _user: User = Depends(require_role(UserRole.citizen, UserRole.admin, UserRole.officer))
):
    category = get_category_by_code(category_code)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
