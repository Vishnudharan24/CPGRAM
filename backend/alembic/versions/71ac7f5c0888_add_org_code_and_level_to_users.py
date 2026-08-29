"""add_org_code_and_level_to_users

Revision ID: 71ac7f5c0888
Revises: 897f7765565e
Create Date: 2026-08-26 12:01:23.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '71ac7f5c0888'
down_revision: Union[str, None] = '897f7765565e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('organization_code', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('level', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'level')
    op.drop_column('users', 'organization_code')
