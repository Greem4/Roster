"""initial schema and seed

Revision ID: 001
Revises:
Create Date: 2026-05-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from passlib.context import CryptContext

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PERMISSIONS = [
    "medicines:view",
    "medicines:edit",
    "users:manage",
]


def upgrade() -> None:
    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_superadmin", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_table(
        "user_permissions",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "permission_id"),
    )
    op.create_table(
        "medicines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("series", sa.String(length=128), nullable=False),
        sa.Column("expiry_date", sa.Date(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_medicines_expiry_date", "medicines", ["expiry_date"])

    permissions_table = sa.table("permissions", sa.column("id", sa.Integer), sa.column("code", sa.String))
    op.bulk_insert(permissions_table, [{"id": i + 1, "code": code} for i, code in enumerate(PERMISSIONS)])

    users_table = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("username", sa.String),
        sa.column("email", sa.String),
        sa.column("password_hash", sa.String),
        sa.column("is_superadmin", sa.Boolean),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )
    from datetime import datetime, timezone

    op.bulk_insert(
        users_table,
        [
            {
                "id": 1,
                "username": "admin",
                "email": None,
                "password_hash": pwd_context.hash("admin"),
                "is_superadmin": True,
                "is_active": True,
                "created_at": datetime.now(timezone.utc),
            }
        ],
    )

    user_permissions_table = sa.table(
        "user_permissions",
        sa.column("user_id", sa.Integer),
        sa.column("permission_id", sa.Integer),
    )
    op.bulk_insert(
        user_permissions_table,
        [{"user_id": 1, "permission_id": i + 1} for i in range(len(PERMISSIONS))],
    )


def downgrade() -> None:
    op.drop_table("medicines")
    op.drop_table("user_permissions")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
    op.drop_table("permissions")
