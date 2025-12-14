"""Create users table

Revision ID: 001
Revises:
Create Date: 2025-12-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create users table with authentication fields."""
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_signin_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create index on email for faster lookups
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_created_at', 'users', ['created_at'])


def downgrade() -> None:
    """Drop users table."""
    op.drop_index('idx_users_created_at', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
