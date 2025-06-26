# Personal Status Tracker - Development Guide for Claude

## Project Overview
A production-ready full-stack application for tracking personal health metrics (water intake and mood/altitude) with robust authentication, role-based access control, automated migrations, and comprehensive deployment capabilities.

## Tech Stack
- **Frontend**: Next.js 15.3.4, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express.js, TypeScript, SQLite with optimization layer
- **Authentication**: JWT with bcrypt hashing, privacy policy compliance
- **Testing**: Jest, React Testing Library (>76% frontend, >37% backend coverage)
- **Deployment**: Docker multi-stage builds, Docker Compose orchestration
- **Database**: SQLite with automated migration system, WAL mode optimization

## Project Architecture

### Frontend (Next.js App Router)
```
app/
├── components/           # React components (production-ready)
│   ├── auth/            # Authentication components with privacy policy
│   │   ├── AuthWrapper.tsx          # Global auth state wrapper
│   │   ├── LoginForm.tsx           # Login with error handling
│   │   ├── PrivacyPolicyModal.tsx  # GDPR compliance modal
│   │   ├── ProtectedRoute.tsx      # Route protection HOC
│   │   ├── RegisterForm.tsx        # Registration with validation
│   │   └── RoleBasedComponent.tsx  # Role-based UI rendering
│   ├── layout/          # Layout components
│   │   └── Header.tsx              # Application header with auth state
│   ├── status/          # Status tracking components
│   │   ├── AdminSelector.tsx       # Admin selection for viewers
│   │   ├── AltitudeMoodCard.tsx    # Mood tracking (1-10 scale)
│   │   ├── StatusSummary.tsx       # Dashboard overview
│   │   └── WaterIntakeCard.tsx     # Water tracking with "Never" state
│   └── ui/              # Reusable UI components
│       ├── Button.tsx, Card.tsx, ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx, Slider.tsx
├── contexts/            # React contexts
│   └── AuthContext.tsx             # Global authentication state
├── hooks/               # Custom React hooks
│   └── useStatusWithUser.ts        # Status data management with user context
├── lib/                 # Utilities and services
│   ├── api.ts                      # Type-safe API client
│   ├── authService.ts              # Frontend authentication service
│   ├── constants.ts                # Application constants
│   └── utils/                      # Helper functions
├── types/               # TypeScript type definitions
│   ├── auth.ts                     # Authentication types
│   └── status.ts                   # Status tracking types
└── __tests__/           # Comprehensive test suite
```

### Backend (Express.js with TypeScript)
```
backend/
├── src/
│   ├── config/          # Configuration management
│   │   ├── index.ts                # Environment-based config
│   │   └── production.ts           # Production optimizations
│   ├── errors/          # Custom error handling
│   │   └── AppError.ts             # Structured error responses
│   ├── middleware/      # Express middleware stack
│   │   ├── auth.ts                 # JWT authentication
│   │   ├── errorHandler.ts         # Global error handling
│   │   ├── logging.ts              # Structured logging with Winston
│   │   ├── rateLimiter.ts          # Multi-tier rate limiting
│   │   ├── security.ts             # Helmet.js + custom security
│   │   └── validation.ts           # Zod request validation
│   ├── models/          # Database layer
│   │   ├── database.ts             # Standard SQLite connection
│   │   ├── optimizedDatabase.ts    # Production SQLite with WAL, indexing
│   │   ├── StatusModel.ts          # Status data model
│   │   └── UserModel.ts            # User data model with privacy fields
│   ├── routes/          # API endpoints
│   │   ├── auth.ts                 # Authentication endpoints
│   │   ├── privacy.ts              # Privacy policy management
│   │   └── status.ts               # Status CRUD operations
│   ├── schemas/         # Zod validation schemas
│   │   ├── authSchemas.ts          # Login/register validation
│   │   └── statusSchemas.ts        # Status data validation
│   ├── scripts/         # Utility scripts
│   │   ├── addPrivacyPolicySchema.ts    # Legacy schema migration
│   │   ├── createAdmin.ts               # Admin user creation
│   │   ├── healthCheck.ts               # Deployment health verification
│   │   └── migrateDatabase.ts           # Automated migration system
│   ├── services/        # Business logic
│   │   ├── AuthService.ts          # Authentication business logic
│   │   └── StatusService.ts        # Status tracking business logic
│   └── utils/           # Utilities
│       ├── encryption.ts           # Data encryption for logs
│       ├── jwt.ts                  # JWT token management
│       └── logCleanup.ts           # Automated log rotation
├── data/                # SQLite database files
└── dist/                # Compiled TypeScript output
```

## Key Features & Implementation

### 1. **Authentication System** (Production-Ready)
- **JWT-based**: 24h token expiration with secure httpOnly cookies
- **Role-based Access**: Admin (data management) vs Viewer (read-only)
- **Account Security**: 5-attempt lockout, password strength requirements
- **Privacy Compliance**: GDPR-compliant privacy policy acceptance tracking
- **Audit Logging**: All authentication events logged with IP/User-Agent

### 2. **Status Tracking** (User-Centric Design)
- **Water Intake**: Timestamp-based with "Never" state support (null values)
- **Mood/Altitude**: 1-10 scale with emoji feedback and thresholds
- **User Isolation**: Each admin tracks own data, viewers select admin to view
- **Real-time Updates**: Optimistic UI updates with error rollback
- **Historical Data**: Paginated history with date-based filtering

### 3. **Database Architecture** (Auto-Migrating)
```sql
-- Users table (with privacy compliance)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hashed
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  privacy_policy_accepted BOOLEAN DEFAULT 0,
  privacy_policy_version TEXT DEFAULT '1.0',
  privacy_policy_accepted_date TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT,
  password_changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Status entries (with nullable water intake)
CREATE TABLE status_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  last_water_intake TEXT,  -- NULL = "Never" state
  altitude INTEGER NOT NULL CHECK (altitude BETWEEN 1 AND 10),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Migration tracking
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER UNIQUE NOT NULL,
  description TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **Security Features** (Enterprise-Grade)
- **Rate Limiting**: Progressive limits (general: 100/15min, auth: 20/15min)
- **Input Validation**: Zod schemas with sanitization
- **XSS/CSRF Protection**: Helmet.js security headers
- **SQL Injection Prevention**: Parameterized queries only
- **Encryption**: Sensitive log data encrypted with AES-256-GCM
- **Audit Trail**: All user actions logged with metadata

### 5. **Production Features** (Cloud-Ready)
- **Health Monitoring**: `/health` endpoint with detailed system status
- **Performance Metrics**: Request timing, error rates, database performance
- **Automated Backups**: Configurable SQLite backups with S3 integration
- **Log Management**: Winston logging with rotation and cleanup
- **Graceful Shutdown**: Proper cleanup of connections and processes

## Database Migration System

### Migration Architecture
The automated migration system handles all schema changes:

```typescript
interface Migration {
  version: number;
  description: string;
  up: string[];    // Forward migration SQL
  down: string[];  // Rollback SQL
}
```

### Current Migrations
1. **Version 1**: Add privacy policy fields to users table
2. **Version 2**: Make last_water_intake nullable for "Never" state

### Adding New Migrations
```typescript
// In src/scripts/migrateDatabase.ts
{
  version: 3,
  description: "Add user preferences table",
  up: [
    `CREATE TABLE user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      notifications_enabled BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`
  ],
  down: ["DROP TABLE user_preferences"]
}
```

### Migration Execution
- **Automatic**: Runs on server startup (dev/prod)
- **Manual**: `npm run migrate:prod`
- **Health Check**: `npm run health-check:prod`
- **Transactional**: All-or-nothing with rollback on failure

## Development Workflow

### Frontend Development
```bash
# Development server
npm run dev           # Next.js with Turbopack
npm run build         # Production build
npm run typecheck     # TypeScript validation
npm test             # Jest test suite
npm run test:coverage # Coverage report
```

### Backend Development
```bash
cd backend
npm run dev          # Nodemon development server
npm run build        # TypeScript compilation
npm start           # Production server
npm test            # Jest + Supertest integration tests
npm run migrate     # Database migrations
npm run create-admin # Create admin user
```

### Docker Deployment (Recommended)
```bash
# Local development
docker-compose up -d

# Production deployment
cp .env.deployment.example .env
# Edit .env with production values
docker-compose up -d

# Health verification
docker exec status-tracker-api npm run health-check:prod

# Create admin user
docker exec status-tracker-api npm run create-admin:prod
```

## Environment Configuration

### Development (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/status.db
JWT_SECRET=development-secret-key
FRONTEND_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AdminPassword123!
```

### Production (.env.deployment.example)
```env
NODE_ENV=production
JWT_SECRET=<64-character-secret>  # openssl rand -base64 64
SESSION_SECRET=<64-character-secret>
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
DATABASE_PATH=/app/data/production.db
BCRYPT_ROUNDS=14
LOG_LEVEL=warn
```

## API Documentation

### Authentication Endpoints
```typescript
POST /api/auth/login
POST /api/auth/register  
POST /api/auth/logout
GET  /api/auth/profile
GET  /api/auth/admins        // Get admin users for viewer selection
DELETE /api/auth/users/:id   // Admin only
```

### Status Endpoints
```typescript
GET    /api/status                    // Get latest status
GET    /api/status?userId=123         // Viewer: get specific admin's status
POST   /api/status                    // Admin: create status
PUT    /api/status                    // Admin: update status  
DELETE /api/status                    // Admin: delete all status
GET    /api/status/history            // Get paginated history
GET    /api/status/history?userId=123 // Viewer: get admin's history
```

### System Endpoints
```typescript
GET /health      // Health check with system metrics
GET /metrics     // Performance metrics (Admin only)
```

## User Roles & Permissions

### Admin Users
- **Data Management**: Full CRUD on their own status data
- **Self-Tracking**: Each admin maintains independent status tracking
- **User Management**: Can delete other users
- **System Access**: Can view metrics and system information

### Viewer Users
- **Read-Only Access**: Can view any admin's status data
- **Admin Selection**: Choose which admin's data to view
- **No Data Modification**: Cannot create or update status entries
- **Limited System Access**: Basic health information only

### Privacy & Compliance
- **Privacy Policy**: Required acceptance with version tracking
- **Data Isolation**: Users only access permitted data
- **Audit Logging**: All data access logged for compliance
- **GDPR Compliance**: Privacy policy modal and consent tracking

## Testing Strategy

### Frontend Testing (>76% coverage)
- **Component Tests**: React Testing Library with user interaction simulation
- **Hook Tests**: Custom hook testing with mock dependencies
- **Integration Tests**: API integration with mock responses
- **Accessibility Tests**: Screen reader compatibility and ARIA compliance

### Backend Testing (>37% coverage)
- **Unit Tests**: Service and model layer testing
- **Integration Tests**: Full API endpoint testing with Supertest
- **Database Tests**: SQLite transaction testing with rollback
- **Security Tests**: Authentication, authorization, and input validation

### End-to-End Testing
- **Docker Testing**: Full containerized application testing
- **Migration Testing**: Database migration verification
- **Health Check Testing**: System health verification

## Performance Optimizations

### Frontend Optimizations
- **React 19**: Latest React features with concurrent rendering
- **Next.js 15**: App Router with automatic optimization
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: API response caching with stale-while-revalidate

### Backend Optimizations
- **SQLite WAL Mode**: Write-Ahead Logging for better concurrency
- **Connection Pooling**: Optimized database connection management
- **Query Optimization**: Indexed queries with EXPLAIN QUERY PLAN analysis
- **Compression**: Gzip compression for API responses
- **Memory Management**: Efficient error handling and cleanup

### Production Optimizations
- **Multi-stage Builds**: Minimal Docker images with build caching
- **Health Checks**: Docker and application-level health monitoring
- **Log Rotation**: Automated log cleanup with configurable retention
- **Resource Limits**: Memory and CPU limits for containerized deployment

## Deployment Architecture

### Local Development
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│  localhost:3000 │◄──►│ localhost:3001  │
│   (Next.js)     │    │  (Express.js)   │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │    SQLite DB    │
                       │   ./data/       │
                       └─────────────────┘
```

### Docker Deployment
```
┌─────────────────┐    ┌─────────────────┐
│   nginx:80/443  │    │   Prometheus    │
│  Reverse Proxy  │    │   Monitoring    │
└─────────┬───────┘    └─────────────────┘
          │                     │
┌─────────▼───────┐    ┌─────────▼───────┐
│   Frontend      │    │    Backend      │
│ Container:3000  │◄──►│ Container:3001  │
└─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │  Persistent     │
                       │  Volume Data    │
                       └─────────────────┘
```

### Cloud Deployment Options
- **Docker Swarm**: Multi-node container orchestration
- **Kubernetes**: Full K8s deployment with ingress and services  
- **Cloud Run**: Serverless container deployment (GCP)
- **ECS/Fargate**: Managed container deployment (AWS)
- **App Service**: Container deployment (Azure)

## Security Considerations

### Authentication Security
- **JWT Secrets**: 64+ character secrets required for production
- **Token Expiration**: 24-hour tokens with refresh capability
- **Session Management**: Secure httpOnly cookies with SameSite
- **Account Lockout**: Progressive delays after failed attempts

### Data Security
- **Encryption at Rest**: SQLite database file encryption option
- **Encryption in Transit**: HTTPS enforcement in production
- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Prevention**: Parameterized queries exclusively

### Infrastructure Security
- **Rate Limiting**: Multi-tier limits to prevent abuse
- **Security Headers**: Comprehensive Helmet.js configuration
- **CORS Policy**: Strict origin validation
- **Container Security**: Non-root user execution, minimal attack surface

## Monitoring & Observability

### Application Metrics
- **Request Metrics**: Response times, error rates, throughput
- **Database Metrics**: Query performance, connection health
- **Authentication Metrics**: Login success/failure rates
- **Business Metrics**: User activity, data creation patterns

### System Health
- **Health Endpoints**: Detailed system health with dependencies
- **Resource Monitoring**: Memory, CPU, disk usage tracking
- **Log Analysis**: Structured logging with Winston
- **Error Tracking**: Comprehensive error logging with stack traces

### Alerting
- **Health Check Failures**: Automatic restart on health check failure
- **Resource Exhaustion**: Memory and disk space monitoring
- **Security Events**: Failed authentication attempts, suspicious activity
- **Performance Degradation**: Response time and error rate thresholds

## Troubleshooting Guide

### Common Issues

#### Database Migration Failures
```bash
# Check migration status
docker exec status-tracker-api npm run health-check:prod

# Manual migration
docker exec status-tracker-api npm run migrate:prod

# Reset database (development only)
rm -rf data/ && docker-compose restart api
```

#### Authentication Issues
```bash
# Check JWT secret configuration
docker exec status-tracker-api env | grep JWT_SECRET

# Create new admin user
docker exec -e ADMIN_USERNAME=newadmin -e ADMIN_PASSWORD=NewPassword123! status-tracker-api npm run create-admin:prod
```

#### Performance Issues
```bash
# Check system metrics
curl http://localhost:3001/metrics

# Monitor container resources
docker stats status-tracker-api

# Check database size and performance
docker exec status-tracker-api sqlite3 /app/data/production.db ".dbinfo"
```

### Log Analysis
```bash
# Backend logs
docker logs status-tracker-api

# Frontend logs  
docker logs status-tracker-frontend

# Filter authentication events
docker logs status-tracker-api 2>&1 | grep "Authentication Event"

# Filter errors
docker logs status-tracker-api 2>&1 | grep "error"
```

## Future Enhancements

### Planned Features
- **Data Export**: CSV/JSON export functionality
- **Push Notifications**: Browser/mobile push notifications
- **Advanced Metrics**: Trend analysis and insights
- **Social Features**: Sharing and comparison features
- **Mobile App**: React Native mobile application

### Technical Improvements
- **GraphQL API**: Alternative to REST API
- **Real-time Updates**: WebSocket integration
- **Advanced Caching**: Redis integration
- **Microservices**: Service decomposition for scale
- **Event Sourcing**: Event-driven architecture

### Infrastructure Enhancements
- **Multi-region Deployment**: Geographic distribution
- **Auto-scaling**: Horizontal scaling based on demand
- **Blue-green Deployment**: Zero-downtime deployments
- **Disaster Recovery**: Automated backup and recovery
- **Compliance**: SOC2, HIPAA compliance features

## Code Quality Standards

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path mapping for clean imports
- Consistent interface definitions across frontend/backend

### Testing Requirements
- Minimum 80% code coverage target
- Integration tests for all API endpoints
- Component tests for all UI components
- Mock-based testing for external dependencies

### Code Style Guidelines
- ESLint + Prettier for consistent formatting
- Conventional Commits for clear change history
- Security-first development practices
- Performance considerations in all implementations

This documentation reflects the current production-ready state of the Personal Status Tracker with comprehensive deployment fixes, automated migrations, and enterprise-grade security features.