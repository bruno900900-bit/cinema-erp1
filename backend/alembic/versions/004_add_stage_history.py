"""Add project_location_stage_history table

Revision ID: 004_add_stage_history
Revises: 003_add_project_compatibility_fields
Create Date: 2025-12-13 01:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_stage_history'
down_revision = '003_add_project_compatibility_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Create project_location_stage_history table
    op.create_table(
        'project_location_stage_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.Column('previous_status', sa.Enum('pending', 'in_progress', 'completed', 'cancelled', 'on_hold', name='stagestatus'), nullable=True),
        sa.Column('new_status', sa.Enum('pending', 'in_progress', 'completed', 'cancelled', 'on_hold', name='stagestatus'), nullable=False),
        sa.Column('previous_completion', sa.Float(), nullable=True),
        sa.Column('new_completion', sa.Float(), nullable=False),
        sa.Column('changed_by_user_id', sa.Integer(), nullable=False),
        sa.Column('change_notes', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['stage_id'], ['project_location_stages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_project_location_stage_history_id'), 'project_location_stage_history', ['id'], unique=False)
    op.create_index(op.f('ix_project_location_stage_history_stage_id'), 'project_location_stage_history', ['stage_id'], unique=False)
    op.create_index(op.f('ix_project_location_stage_history_changed_at'), 'project_location_stage_history', ['changed_at'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_project_location_stage_history_changed_at'), table_name='project_location_stage_history')
    op.drop_index(op.f('ix_project_location_stage_history_stage_id'), table_name='project_location_stage_history')
    op.drop_index(op.f('ix_project_location_stage_history_id'), table_name='project_location_stage_history')

    # Drop table
    op.drop_table('project_location_stage_history')
