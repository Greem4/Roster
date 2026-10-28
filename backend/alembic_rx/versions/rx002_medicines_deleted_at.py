"""Мягкое удаление лекарств: deleted_at вместо DELETE.

Revision ID: rx002
Revises: rx001
Create Date: 2026-10-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "rx002"
down_revision: Union[str, None] = "rx001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("medicines", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_medicines_deleted_at", "medicines", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_medicines_deleted_at", table_name="medicines")
    op.drop_column("medicines", "deleted_at")
