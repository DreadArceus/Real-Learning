# Personal Status Tracker API Documentation

## Overview

The Personal Status Tracker API is a production-ready RESTful service for tracking water intake and mood (altitude) with role-based access control. It features comprehensive security, monitoring, and error handling.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.yourdomain.com`

## Authentication

The API uses JWT (JSON Web Token) authentication with the following user roles:

- **Admin**: Can create, read, update, and delete all data
- **Viewer**: Can only read data (view-only access)

### Token Usage

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes per IP/username
- **Registration**: 5 registrations per hour per IP
- **Admin endpoints**: 50 requests per 5 minutes

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { ... } // Optional additional details
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## API Endpoints

### Health & System

#### GET /health
Check system health and status.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2025-06-24T21:00:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "metrics": {
    "requests": {
      "total": 1000,
      "errorRate": 0.01,
      "averageResponseTime": 150
    },
    "memory": {
      "usage": 0.7,
      "heapUsed": 128,
      "heapTotal": 256
    },
    "database": {
      "queries": 500,
      "averageQueryTime": 25,
      "slowQueries": 2
    }
  }
}
```

#### GET /metrics
Get detailed system metrics (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 10000,
      "successful": 9500,
      "failed": 500,
      "byMethod": { "GET": 6000, "POST": 3000, "PUT": 800, "DELETE": 200 },
      "byStatus": { "200": 8000, "201": 1000, "400": 300, "401": 150, "500": 50 },
      "byEndpoint": { ... }
    },
    "performance": {
      "averageResponseTime": 145.5,
      "maxResponseTime": 5000,
      "minResponseTime": 10
    },
    "errors": {
      "total": 500,
      "byType": { "ValidationError": 200, "AuthError": 150, "DatabaseError": 50 },
      "recent": [ ... ]
    },
    "database": { ... },
    "memory": { ... },
    "system": { ... }
  },
  "timestamp": "2025-06-24T21:00:00.000Z"
}
```

### Authentication

#### POST /api/auth/register
Register a new viewer account.

**Request:**
```json
{
  "username": "newuser",
  "password": "SecurePass123!"
}
```

**Validation Rules:**
- Username: 3-50 characters, alphanumeric with underscores/hyphens
- Password: 8+ characters with uppercase, lowercase, number, and special character

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "newuser",
    "role": "viewer",
    "createdAt": "2025-06-24T21:00:00.000Z"
  },
  "message": "Account created successfully"
}
```

#### POST /api/auth/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "username": "username",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "username",
      "role": "admin",
      "createdAt": "2025-06-24T21:00:00.000Z",
      "lastLogin": "2025-06-24T21:00:00.000Z"
    }
  },
  "message": "Login successful"
}
```

#### GET /api/auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "username",
    "role": "admin",
    "createdAt": "2025-06-24T21:00:00.000Z",
    "lastLogin": "2025-06-24T21:00:00.000Z"
  }
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful. Please remove the token from client storage."
}
```

### Admin-Only Authentication Endpoints

#### POST /api/auth/admin/register
Create a new user with any role (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "username": "newadmin",
  "password": "SecurePass123!",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newadmin",
    "role": "admin",
    "createdAt": "2025-06-24T21:00:00.000Z"
  },
  "message": "User created successfully"
}
```

#### GET /api/auth/users
Get all users (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "createdAt": "2025-06-24T21:00:00.000Z",
      "lastLogin": "2025-06-24T21:00:00.000Z"
    },
    {
      "id": 2,
      "username": "viewer",
      "role": "viewer",
      "createdAt": "2025-06-24T21:00:00.000Z",
      "lastLogin": null
    }
  ]
}
```

#### DELETE /api/auth/users/:id
Delete a user (Admin only, cannot delete self).

**Headers:** `Authorization: Bearer <admin-token>`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Status Tracking

#### GET /api/status
Get user's latest status or status history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `userId` (optional): User ID (admin only, defaults to current user)
- `limit` (optional): Number of records (1-100, default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `startDate` (optional): ISO date string for filtering
- `endDate` (optional): ISO date string for filtering

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "user123",
    "lastWaterIntake": "2025-06-24T20:30:00.000Z",
    "altitude": 7,
    "notes": "Feeling good today",
    "createdAt": "2025-06-24T21:00:00.000Z",
    "updatedAt": "2025-06-24T21:00:00.000Z"
  }
}
```

#### POST /api/status
Create a new status entry (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "lastWaterIntake": "2025-06-24T20:30:00.000Z",
  "altitude": 7,
  "notes": "Optional notes"
}
```

**Validation Rules:**
- `lastWaterIntake`: Valid ISO date string
- `altitude`: Integer between 1 and 10
- `notes`: Optional string, max 500 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "user123",
    "lastWaterIntake": "2025-06-24T20:30:00.000Z",
    "altitude": 7,
    "notes": "Optional notes",
    "createdAt": "2025-06-24T21:00:00.000Z",
    "updatedAt": "2025-06-24T21:00:00.000Z"
  },
  "message": "Status created successfully"
}
```

#### PUT /api/status
Update user's status (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Request:**
```json
{
  "lastWaterIntake": "2025-06-24T21:00:00.000Z",
  "altitude": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "user123",
    "lastWaterIntake": "2025-06-24T21:00:00.000Z",
    "altitude": 8,
    "notes": "Optional notes",
    "createdAt": "2025-06-24T21:00:00.000Z",
    "updatedAt": "2025-06-24T21:05:00.000Z"
  },
  "message": "Status updated successfully"
}
```

#### GET /api/status/history
Get status history with pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of records (1-100, default: 10)
- `offset`: Pagination offset (default: 0)
- `userId`: User ID (admin only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "userId": "user123",
      "lastWaterIntake": "2025-06-24T21:00:00.000Z",
      "altitude": 8,
      "createdAt": "2025-06-24T21:00:00.000Z"
    },
    {
      "id": 1,
      "userId": "user123",
      "lastWaterIntake": "2025-06-24T20:30:00.000Z",
      "altitude": 7,
      "createdAt": "2025-06-24T20:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 2,
    "hasMore": false
  }
}
```

#### DELETE /api/status
Delete all status entries for user (Admin only).

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `userId` (optional): User ID (defaults to current user)

**Response:**
```json
{
  "success": true,
  "message": "All status entries deleted successfully"
}
```

## Security Features

### Input Validation & Sanitization
- All inputs are validated using Zod schemas
- XSS protection through input sanitization
- SQL injection prevention via parameterized queries
- File upload validation (if applicable)

### Rate Limiting
- Multiple rate limiting strategies per endpoint type
- Progressive penalties for repeat offenders
- IP-based and user-based limiting

### Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy
- HSTS, X-Frame-Options, etc.

### Authentication & Authorization
- JWT tokens with configurable expiration
- Role-based access control (RBAC)
- Account lockout after failed attempts
- Secure password requirements

### Monitoring & Logging
- Comprehensive request/response logging
- Security event logging
- Performance monitoring
- Error tracking and alerting

## Development

### Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_PATH=./data/production.db
DB_CONNECTION_TIMEOUT=30000
DB_QUERY_TIMEOUT=10000

# Security
JWT_SECRET=your-super-secret-64-character-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-64-character-session-key-change-this-too
BCRYPT_ROUNDS=14

# CORS & Origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
COOKIE_SECURE=true
TRUST_PROXY=true

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=true
LOG_FILE_PATH=./logs/app.log

# Features
REGISTRATION_ENABLED=true
MAINTENANCE_MODE=false
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.ts
```

### Example Usage

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const { data: authData } = await loginResponse.json();
const token = authData.token;

// Get status
const statusResponse = await fetch('/api/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { data: statusData } = await statusResponse.json();

// Update status (admin only)
const updateResponse = await fetch('/api/status', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    lastWaterIntake: new Date().toISOString(),
    altitude: 8
  })
});
```

## Support

For issues, feature requests, or questions:

1. Check the logs for error details
2. Verify your authentication token
3. Ensure you have the required permissions
4. Check rate limiting headers in the response
5. Review the API documentation

## Changelog

### v1.0.0
- Initial production release
- JWT authentication with role-based access
- Comprehensive security middleware
- Production monitoring and logging
- Rate limiting and input validation
- Full API documentation