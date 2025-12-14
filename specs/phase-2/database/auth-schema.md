# Authentication Database Schema

**Phase**: Phase 2
**Feature**: User Authentication (002-user-authentication)
**Created**: 2025-12-14

## Overview

Database schema for user accounts and session management. Uses Neon Serverless PostgreSQL with SQLModel ORM.

## Tables

### users

Stores user account information and credentials.

**Managed By**: Better Auth (creates and manages this table automatically)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(255) | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login credential) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last modification time |
| last_signin_at | TIMESTAMP | NULLABLE | Most recent signin |

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**SQLModel**:
```python
class User(SQLModel, table=True):
    id: str = Field(primary_key=True, max_length=255)
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_signin_at: Optional[datetime] = None
```

### sessions (Optional)

Tracks active sessions for audit and revocation capabilities.

**Note**: This table is optional in Phase 2. JWT tokens work without server-side session storage. Implement only if session revocation or audit logging is required.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(255) | PRIMARY KEY | Unique session identifier |
| user_id | VARCHAR(255) | FOREIGN KEY → users.id | Session owner |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of JWT |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Session start time |
| expires_at | TIMESTAMP | NOT NULL | Session expiration (7 days) |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last API request |
| user_agent | TEXT | NULLABLE | Browser/device info |
| ip_address | VARCHAR(45) | NULLABLE | IP address (IPv4/IPv6) |

**Indexes**:
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
```

**Foreign Keys**:
```sql
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Relationships

```
users (1) ──── (N) sessions
  ↑
  │ One user can have multiple active sessions
  │ Deleting user cascades to delete all sessions
```

## Security

- **Password Storage**: Never store plaintext passwords (Better Auth uses bcrypt)
- **Token Storage**: Store SHA-256 hash of JWT in sessions table, not the actual token
- **Data Exposure**: Never return `password_hash` or `token_hash` in API responses

## Migration Strategy

**Phase 2 Initial Setup**:
1. Better Auth creates `users` table automatically on first run
2. Optionally run custom migration for `sessions` table if implementing

**Future Enhancements**:
- User profiles (display name, avatar URL)
- User preferences/settings
- Password reset tokens
- Email verification tokens

## Related Documentation

- **Detailed Data Model**: `specs/phase-2/002-user-authentication/data-model.md`
- **API Contracts**: `specs/phase-2/002-user-authentication/contracts/auth-api.md`
- **Research & Decisions**: `specs/phase-2/002-user-authentication/research.md`
