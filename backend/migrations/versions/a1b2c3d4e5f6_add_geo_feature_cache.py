"""add geo_feature_cache table (live location-based prediction)

Revision ID: a1b2c3d4e5f6
Revises: d3c94052dd14
Create Date: 2026-09-20 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd3c94052dd14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'geo_feature_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('latitude_rounded', sa.Float(), nullable=False),
        sa.Column('longitude_rounded', sa.Float(), nullable=False),
        sa.Column('radius_km', sa.Float(), nullable=False),
        sa.Column('source', sa.String(length=30), nullable=False),
        sa.Column('payload_json', sa.Text(), nullable=False),
        sa.Column('data_status', sa.String(length=20), nullable=False),
        sa.Column('fetched_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_geo_cache_lookup',
        'geo_feature_cache',
        ['latitude_rounded', 'longitude_rounded', 'radius_km', 'source'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_geo_cache_lookup', table_name='geo_feature_cache')
    op.drop_table('geo_feature_cache')
