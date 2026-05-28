"""drop medicines:edit permission

Revision ID: 003
Revises: 002
Create Date: 2026-05-28

"""

from typing import Sequence, Union

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM user_permissions
        WHERE permission_id IN (SELECT id FROM permissions WHERE code = 'medicines:edit')
        """
    )
    op.execute("DELETE FROM permissions WHERE code = 'medicines:edit'")


def downgrade() -> None:
    op.execute("INSERT INTO permissions (code) VALUES ('medicines:edit')")
