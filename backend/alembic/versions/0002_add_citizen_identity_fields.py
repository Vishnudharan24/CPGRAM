"""add citizen identity fields

Revision ID: 0002_add_citizen_identity_fields
Revises: 0001_initial_schema
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_citizen_identity_fields"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    for name, length in (
        ("gender", 40),
        ("premise_name", 255),
        ("sub_locality", 255),
        ("locality", 255),
        ("country", 100),
        ("state", 100),
        ("district", 100),
        ("pincode", 20),
        ("mobile_number", 20),
    ):
        op.add_column("users", sa.Column(name, sa.String(length=length), nullable=True))


def downgrade():
    for name in (
        "mobile_number",
        "pincode",
        "district",
        "state",
        "country",
        "locality",
        "sub_locality",
        "premise_name",
        "gender",
    ):
        op.drop_column("users", name)