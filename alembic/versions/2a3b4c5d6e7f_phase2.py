"""phase2

Revision ID: 2a3b4c5d6e7f
Revises: 1a2b3c4d5e6f
Create Date: 2026-04-14 00:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2a3b4c5d6e7f'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Candidate Links
    op.create_table('candidate_links',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Uuid(), nullable=False),
    sa.Column('job_id', sa.String(), nullable=False),
    sa.Column('token', sa.String(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.Column('is_used', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_candidate_links_company_id'), 'candidate_links', ['company_id'], unique=False)
    op.create_index(op.f('ix_candidate_links_token'), 'candidate_links', ['token'], unique=True)
    
    # Candidates
    op.create_table('candidates',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Uuid(), nullable=False),
    sa.Column('job_id', sa.String(), nullable=False),
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('first_name', sa.String(), nullable=False),
    sa.Column('last_name', sa.String(), nullable=False),
    sa.Column('resume_path', sa.String(), nullable=False),
    sa.Column('status', sa.Enum('APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', name='statusupdate'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_candidates_email'), 'candidates', ['email'], unique=False)
    op.create_index('ix_candidate_company_job', 'candidates', ['company_id', 'job_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_candidate_company_job', table_name='candidates')
    op.drop_index(op.f('ix_candidates_email'), table_name='candidates')
    op.drop_table('candidates')
    
    op.drop_index(op.f('ix_candidate_links_token'), table_name='candidate_links')
    op.drop_index(op.f('ix_candidate_links_company_id'), table_name='candidate_links')
    op.drop_table('candidate_links')
    
    sa.Enum('APPLIED', 'REVIEWING', 'INTERVIEW', 'OFFER', 'REJECTED', name='statusupdate').drop(op.get_bind(), checkfirst=False)
