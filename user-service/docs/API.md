# user-service API Documentation

## Overview
user-service provides authentication and user management endpoints. All responses follow a consistent error format.

## Error Format
```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

### POST /users/register
Register a new user account.

**No authentication required**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CUSTOMER"
}
```

**Error Responses:**
- 400: Invalid email format or password < 8 characters
- 409: Email already registered

---

### POST /auth/login
Authenticate user and receive JWT token.

**No authentication required**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```

**Error Responses:**
- 400: Invalid email format or password < 8 characters
- 401: Invalid credentials (invalid email or password — message is identical for both cases to prevent email enumeration)

**Token:**
- Algorithm: HS256
- Payload: `{ userId, role, iat, exp }`
- Expiry: 24 hours (configurable via `JWT_EXPIRES_IN` env var)

---

### GET /health
Health check endpoint (no authentication required).

**Success Response (200):**
```json
{
  "status": "ok"
}
```

---

## User Object Fields

| Field | Type | Description | Sensitive |
|-------|------|-------------|-----------|
| id | UUID | User's unique identifier | No |
| email | String | User's email address | No |
| name | String | User's display name (required) | No |
| role | Enum | CUSTOMER \| AGENT \| ADMIN | No |

**Never returned in any response:**
- `password_hash`

---

## Authentication

The `name` field was added in migration `20260414103019_add_name_to_users` to support user profile information for frontend display.

Frontend can:
1. Set `name` during registration via POST /users/register
2. Update `name` via PATCH /users/:id (implemented in Sprint 1 HEL-4)
3. Read `name` from login response

Example flow:
```
1. User registers with email + password + name
2. System returns user object including name
3. User logs in, receives token + user object with name
4. Frontend displays name from token or GET /users/:id
```
