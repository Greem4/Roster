"""Таблица duty_employees, привязка users.duty_employee_id, seed из бумажного графика.

Revision ID: 012
Revises: 011
Create Date: 2026-06-06
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_VACATIONS = '[{"start": "", "end": ""}, {"start": "", "end": ""}]'
DEFAULT_PREFERENCES = '{"canWork": "", "avoid": ""}'

# Порядок строк бумажного графика ОСМП
SEED_EMPLOYEES = (
    ("Васильева Е.С.", "doctor"),
    ("Дивинский Н.В.", "doctor"),
    ("Корнева Т.И.", "doctor"),
    ("Красницкий Я.И.", "doctor"),
    ("Яшин В.А.", "doctor"),
    ("Белялов С.В.", "medbrother"),
    ("Зеленкин С.Е.", "paramedic"),
    ("Иванова Е.С.", "nurse"),
    ("Кочулаева Н.Е.", "nurse"),
    ("Левина Л.Г.", "nurse"),
    ("Суркова С.А.", "nurse"),
    ("Силин А.Ю.", "medbrother"),
    ("Толпинская Г.А.", "nurse"),
    ("Фомина Н.П.", "nurse"),
)


def upgrade() -> None:
    op.create_table(
        "duty_employees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=16), nullable=False),
        sa.Column("gender", sa.String(length=1), nullable=True),
        sa.Column("vacations", sa.JSON(), nullable=False, server_default=DEFAULT_VACATIONS),
        sa.Column("preferences", sa.JSON(), nullable=False, server_default=DEFAULT_PREFERENCES),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.add_column(
        "users",
        sa.Column("duty_employee_id", sa.Integer(), sa.ForeignKey("duty_employees.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_users_duty_employee_id", "users", ["duty_employee_id"], unique=True)

    for sort_order, (name, title) in enumerate(SEED_EMPLOYEES):
        op.execute(
            sa.text(
                "INSERT INTO duty_employees (name, title, sort_order) VALUES (:name, :title, :sort_order)"
            ).bindparams(name=name, title=title, sort_order=sort_order)
        )


def downgrade() -> None:
    op.drop_index("ix_users_duty_employee_id", table_name="users")
    op.drop_column("users", "duty_employee_id")
    op.drop_table("duty_employees")
