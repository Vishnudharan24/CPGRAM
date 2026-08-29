"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


user_role = postgresql.ENUM("citizen", "officer", "admin", name="userrole")
department_level = postgresql.ENUM("ministry", "department", "district_office", name="departmentlevel")
grievance_category = postgresql.ENUM("complaint", "grievance", "suggestion", name="grievancecategory")
grievance_status = postgresql.ENUM(
    "submitted", "routed", "under_review", "atr_filed", "resolved", "rated_poor",
    "appeal_open", "appeal_resolved", "closed", name="grievancestatus"
)
rating = postgresql.ENUM("good", "average", "poor", name="rating")
actor_role = postgresql.ENUM("citizen", "officer", "system", "admin", name="actorrole")
atr_quality = postgresql.ENUM("ok", "too_short", "templated_language_detected", name="atrquality")
window_type = postgresql.ENUM("resolution", "appeal", name="windowtype")
window_status = postgresql.ENUM("open", "met", "missed", "escalated", name="windowstatus")


def upgrade():


    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("role", user_role, nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "departments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(length=240), nullable=False, unique=True),
        sa.Column("level", department_level, nullable=False),
        sa.Column("parent_department_id", sa.Uuid(), sa.ForeignKey("departments.id"), nullable=True),
    )
    op.create_table(
        "grievances",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("registration_id", sa.String(length=32), nullable=False, unique=True),
        sa.Column("citizen_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("current_department_id", sa.Uuid(), sa.ForeignKey("departments.id"), nullable=False),
        sa.Column("raw_description", sa.Text(), nullable=False),
        sa.Column("category", grievance_category, nullable=False),
        sa.Column("status", grievance_status, nullable=False),
        sa.Column("citizen_rating", rating, nullable=True),
        sa.Column("appeal_text", sa.Text(), nullable=True),
        sa.Column("appeal_decision", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "grievance_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("grievance_id", sa.Uuid(), sa.ForeignKey("grievances.id"), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("from_department_id", sa.Uuid(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("to_department_id", sa.Uuid(), sa.ForeignKey("departments.id"), nullable=True),
        sa.Column("actor_role", actor_role, nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "atrs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("grievance_id", sa.Uuid(), sa.ForeignKey("grievances.id"), nullable=False),
        sa.Column("officer_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("quality_flag", atr_quality, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_table(
        "review_windows",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("grievance_id", sa.Uuid(), sa.ForeignKey("grievances.id"), nullable=False),
        sa.Column("window_type", window_type, nullable=False),
        sa.Column("opens_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", window_status, nullable=False),
    )


def downgrade():
    op.drop_table("review_windows")
    op.drop_table("atrs")
    op.drop_table("grievance_events")
    op.drop_table("grievances")
    op.drop_table("departments")
    op.drop_table("users")
