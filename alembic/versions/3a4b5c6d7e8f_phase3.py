"""phase3

Revision ID: 3a4b5c6d7e8f
Revises: 2a3b4c5d6e7f
Create Date: 2026-04-14 00:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a4b5c6d7e8f'
down_revision = '2a3b4c5d6e7f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # email_templates
    op.create_table('email_templates',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Uuid(), nullable=False),
    sa.Column('key', sa.String(), nullable=False),
    sa.Column('subject', sa.String(), nullable=False),
    sa.Column('body', sa.String(), nullable=False),
    sa.Column('variables', sa.JSON(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('company_id', 'key', name='uq_company_template_key')
    )
    op.create_index(op.f('ix_email_templates_company_id'), 'email_templates', ['company_id'], unique=False)
    
    # email_queue
    op.create_table('email_queue',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_id', sa.Uuid(), nullable=False),
    sa.Column('candidate_id', sa.Uuid(), nullable=True),
    sa.Column('template_key', sa.String(), nullable=False),
    sa.Column('recipient_email', sa.String(), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED', name='emailstatus'), nullable=False),
    sa.Column('scheduled_at', sa.DateTime(), nullable=False),
    sa.Column('locked_by', sa.String(), nullable=True),
    sa.Column('locked_at', sa.DateTime(), nullable=True),
    sa.Column('retry_count', sa.Integer(), nullable=False),
    sa.Column('retry_backoff_until', sa.DateTime(), nullable=True),
    sa.Column('error_message', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ),
    sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_email_queue_status_scheduled', 'email_queue', ['status', 'scheduled_at'], unique=False)

def downgrade() -> None:
    op.drop_table('email_queue')
    sa.Enum('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED', name='emailstatus').drop(op.get_bind(), checkfirst=False)
    
    op.drop_index(op.f('ix_email_templates_company_id'), table_name='email_templates')
    op.drop_table('email_templates')
