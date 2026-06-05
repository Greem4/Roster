"""RosterPay: несколько сумм за месяц (pay_monthly_entries).

Revision ID: 010
Revises: 009
Create Date: 2026-06-01
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pay_monthly_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="RUB"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_pay_monthly_entries_year_month",
        "pay_monthly_entries",
        ["year", "month"],
    )

    # Перенос одной суммы на месяц из старой таблицы
    op.execute(
        """
        INSERT INTO pay_monthly_entries (
            year, month, amount, currency, sort_order,
            created_by_id, created_at, updated_at
        )
        SELECT
            year, month, amount, currency, 0,
            created_by_id, created_at, updated_at
        FROM pay_monthly_totals
        """
    )

    op.drop_index("ix_pay_monthly_totals_year", table_name="pay_monthly_totals")
    op.drop_table("pay_monthly_totals")


def downgrade() -> None:
    op.create_table(
        "pay_monthly_totals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="RUB"),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("year", "month", name="uq_pay_monthly_totals_year_month"),
    )
    op.create_index("ix_pay_monthly_totals_year", "pay_monthly_totals", ["year"])

    # Схлопывание строк обратно в одну сумму на месяц
    op.execute(
        """
        INSERT INTO pay_monthly_totals (
            year, month, amount, currency,
            created_by_id, created_at, updated_at
        )
        SELECT
            year,
            month,
            SUM(amount),
            MIN(currency),
            MIN(created_by_id),
            MIN(created_at),
            MAX(updated_at)
        FROM pay_monthly_entries
        GROUP BY year, month
        """
    )

    op.drop_index("ix_pay_monthly_entries_year_month", table_name="pay_monthly_entries")
    op.drop_table("pay_monthly_entries")
