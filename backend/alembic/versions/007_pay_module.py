"""RosterPay: права и таблица счетов.

Revision ID: 007
Revises: 006
Create Date: 2026-06-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PAY_PERMISSIONS = ("pay:view", "pay:manage")


def upgrade() -> None:
    op.create_table(
        "pay_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("balance", sa.Numeric(precision=14, scale=2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="RUB"),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pay_accounts_name", "pay_accounts", ["name"])

    for code in PAY_PERMISSIONS:
        op.execute(sa.text("INSERT INTO permissions (code) VALUES (:code)").bindparams(code=code))

    # Администраторам кабинета — те же пользователи, что управляют users:manage
    op.execute(
        """
        INSERT INTO user_permissions (user_id, permission_id)
        SELECT up.user_id, p_pay.id
        FROM user_permissions up
        JOIN permissions p_admin ON p_admin.id = up.permission_id AND p_admin.code = 'users:manage'
        JOIN permissions p_pay ON p_pay.code IN ('pay:view', 'pay:manage')
        ON CONFLICT DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM user_permissions
        WHERE permission_id IN (SELECT id FROM permissions WHERE code IN ('pay:view', 'pay:manage'))
        """
    )
    op.execute("DELETE FROM permissions WHERE code IN ('pay:view', 'pay:manage')")
    op.drop_index("ix_pay_accounts_name", table_name="pay_accounts")
    op.drop_table("pay_accounts")
