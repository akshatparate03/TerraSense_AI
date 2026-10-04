"""add locations.is_watchlist

Revision ID: c4d5e6f7a8b9
Revises: b7c8d9e0f1a2
Create Date: 2026-10-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS keeps this safe next to the startup safety-net in app/main.py
    op.execute("ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_watchlist BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.drop_column('locations', 'is_watchlist')
