from app.core.enums import UserRole
from app.models.grievance import Grievance

def apply_rbac_filter(stmt, user):
    """
    Applies the Role-Based Access Control filters to a SQLAlchemy select statement for Grievances.
    Access is determined by: Role + Administrative Level + Organization/Department + Geographic Scope.
    """
    # Overall Admin sees everything
    if user.role == UserRole.admin:
        return stmt
        
    # Citizens only see their own
    if user.role == UserRole.citizen:
        return stmt.where(Grievance.citizen_id == user.id)
        
    # Scope-specific admins
    if user.role == UserRole.central_admin:
        return stmt.where(Grievance.organization_code == user.organization_code)
    if user.role in (UserRole.state_admin, UserRole.ut_admin):
        return stmt.where(Grievance.state_code == user.state_code)
        
    # NPGs, GROs, and Appellate Authorities
    if user.role in (UserRole.npg, UserRole.gro, UserRole.appellate_authority, UserRole.officer):
        # 1. Check organization scope
        if user.organization_code:
            stmt = stmt.where(Grievance.organization_code == user.organization_code)
            
        # 2. Check geographic scope
        if user.level in ("State", "UT"):
            if user.state_code:
                stmt = stmt.where(Grievance.state_code == user.state_code)
        elif user.level == "District":
            if user.state_code:
                stmt = stmt.where(Grievance.state_code == user.state_code)
            if user.district_code:
                stmt = stmt.where(Grievance.district_code == user.district_code)
                
        return stmt
        
    # Default Deny
    return stmt.where(False)
