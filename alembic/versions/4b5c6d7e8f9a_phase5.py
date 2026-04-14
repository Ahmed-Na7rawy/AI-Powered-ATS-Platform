"""phase5

Revision ID: 4b5c6d7e8f9a
Revises: 3a4b5c6d7e8f
Create Date: 2026-04-14 00:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '4b5c6d7e8f9a'
down_revision = '3a4b5c6d7e8f'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('candidate_activities',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('candidate_id', sa.Uuid(), nullable=False),
    sa.Column('activity_type', sa.String(), nullable=False),
    sa.Column('details', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_candidate_activities_candidate_id'), 'candidate_activities', ['candidate_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_candidate_activities_candidate_id'), table_name='candidate_activities')
    op.drop_table('candidate_activities')
