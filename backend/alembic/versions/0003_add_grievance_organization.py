"""add organisation selection to grievances

Revision ID: 0003_add_grievance_organization
Revises: 0002_add_citizen_identity_fields
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_add_grievance_organization"
down_revision = "0002_add_citizen_identity_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("grievances", sa.Column("organization_name", sa.String(length=240), nullable=True))
    op.add_column("grievances", sa.Column("organization_code", sa.String(length=20), nullable=True))
    op.execute("UPDATE grievances SET organization_name = 'Public Services Ministry', organization_code = 'PUBLIC' WHERE organization_name IS NULL")
    op.alter_column("grievances", "organization_name", nullable=False)
    op.alter_column("grievances", "organization_code", nullable=False)


def downgrade():
    op.drop_column("grievances", "organization_code")
    op.drop_column("grievances", "organization_name")