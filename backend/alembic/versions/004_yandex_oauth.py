"""OAuth Яндекс: yandex_id и необязательный пароль

Revision ID: 004
Revises: 003
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("yandex_id", sa.String(length=64), nullable=True))
    op.create_index("ix_users_yandex_id", "users", ["yandex_id"], unique=True)
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
    op.drop_index("ix_users_yandex_id", table_name="users")
    op.drop_column("users", "yandex_id")
