"""initial

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-04-13 23:59:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('companies',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('hr_users',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Uuid(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('password_hash', sa.String(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_admin', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_users_company_id'), 'hr_users', ['company_id'], unique=False)
    op.create_index(op.f('ix_hr_users_email'), 'hr_users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_hr_users_email'), table_name='hr_users')
    op.drop_index(op.f('ix_hr_users_company_id'), table_name='hr_users')
    op.drop_table('hr_users')
    op.drop_table('companies')
