"""RosterDuty и RosterCA: права duty:view и ca:view.

Revision ID: 011
Revises: 010
Create Date: 2026-06-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_PERMISSIONS = ("duty:view", "ca:view")


def upgrade() -> None:
    for code in NEW_PERMISSIONS:
        op.execute(sa.text("INSERT INTO permissions (code) VALUES (:code)").bindparams(code=code))


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM user_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions WHERE code IN ('duty:view', 'ca:view')
        )
        """
    )
    op.execute("DELETE FROM permissions WHERE code IN ('duty:view', 'ca:view')")
