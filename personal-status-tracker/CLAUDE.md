# Personal Status Tracker - Development Guide for Claude

## Project Overview
A full-stack application for tracking personal status metrics (water intake and mood/altitude) with authentication, role-based access control, and production-ready features.

## Tech Stack
- **Frontend**: Next.js 15.3.4, React 19, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, SQLite, Zod validation
- **Authentication**: JWT with bcrypt hashing
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, Docker Compose, Nginx

## Project Structure
```
personal-status-tracker/
├── app/                    # Next.js frontend application
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components
│   │   ├── status/        # Status tracking components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React contexts (AuthContext)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   │   ├── api.ts         # API service client
│   │   ├── authService.ts # Frontend auth service
│   │   └── utils/         # Helper functions
│   ├── types/             # TypeScript type definitions
│   └── __tests__/         # Frontend tests
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── errors/        # Custom error classes
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # Business logic services
│   │   └── __tests__/     # Backend tests
│   └── data/              # SQLite database files
└── docker-compose.yml     # Multi-container setup
```

## Key Features
1. **Authentication System**
   - JWT-based authentication with 24h token expiration
   - Role-based access control (Admin/Viewer)
   - Account lockout protection (5 attempts)
   - Strong password requirements

2. **Status Tracking**
   - Water intake tracking with timestamps
   - Mood/altitude tracking (1-10 scale)
   - Historical data viewing
   - Real-time updates
   - **User-specific data**: Each admin tracks their own status
   - **Admin selector**: Viewers can pick any admin to view their data

3. **Security Features**
   - Rate limiting (multi-tier)
   - Input validation with Zod
   - XSS/SQL injection protection
   - Security headers with Helmet.js
   - Audit logging

4. **Production Features**
   - Health checks and monitoring
   - Database backups
   - Error handling and recovery
   - Performance optimization
   - Docker deployment

## Development Commands

### Frontend
```bash
cd personal-status-tracker
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run linter
npm run typecheck  # Type checking
npm test          # Run tests
npm run test:coverage  # Test coverage
```

### Backend
```bash
cd backend
npm run dev        # Start development server
npm run build      # Build TypeScript
npm start         # Start production server
npm test          # Run tests
npm run test:coverage  # Test coverage
```

### Docker Deployment
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml up -d

# Create admin user (use environment variables)
ADMIN_USERNAME=admin ADMIN_PASSWORD=securePassword123! docker exec -it status-tracker-api npm run create-admin:prod

# Or set in .env file first
docker exec -it status-tracker-api npm run create-admin:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/admins` - Get all admin users (for viewer selection)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Status
- `GET /api/status` - Get latest status (admins: own data, viewers: specify userId)
- `GET /api/status?userId=123` - Get specific user's status (viewers only)
- `POST /api/status` - Create new status (admins only, for themselves)
- `PUT /api/status` - Update status (admins only, for themselves)
- `DELETE /api/status` - Delete all status (admins only, for themselves)
- `GET /api/status/history` - Get status history (with optional userId for viewers)

### System
- `GET /health` - Health check
- `GET /metrics` - System metrics (Admin only)

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
DATABASE_PATH=./data/status.db

# Admin credentials (for createAdmin script)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

## Testing Strategy
- Unit tests for all components and functions
- Integration tests for API endpoints
- Test coverage targets: >80%
- Mock data and test utilities provided

## Security Considerations
- Never commit .env files
- Use strong JWT secrets in production
- Enable HTTPS in production
- Regular security audits
- Keep dependencies updated

## User Roles and Workflows

### Admin Users
- **Data Management**: Can create, update, and delete their own status data
- **Self-tracking**: Each admin tracks their own water intake and mood
- **Independence**: Cannot access or modify other users' data

### Viewer Users  
- **Read-only Access**: Can view any admin's status data
- **Admin Selection**: Must select which admin's data to view
- **No Data Modification**: Cannot update status data

### Typical Workflow
1. **Admin logs in**: Sees their own status dashboard with edit capabilities
2. **Viewer logs in**: Sees admin selector dropdown
3. **Viewer selects admin**: Views that admin's data in read-only mode
4. **Admin updates status**: Only affects their own data
5. **Viewer refreshes**: Sees updated data from selected admin

## Common Tasks

### Adding a New Feature
1. Create TypeScript types in `types/`
2. Add backend model/service if needed
3. Create API endpoint with validation
4. Build frontend components
5. Add tests for all new code
6. Update documentation

### Debugging Issues
1. Check browser console for frontend errors
2. Check backend logs: `docker logs status-tracker-api`
3. Verify API responses in Network tab
4. Check database: `sqlite3 backend/data/status.db`

### Performance Optimization
- Database indexes are already optimized
- Use React.memo for expensive components
- Implement pagination for large datasets
- Monitor with `/metrics` endpoint

## Code Style Guidelines
- Use TypeScript for type safety
- Follow existing patterns in codebase
- Keep components small and focused
- Use custom hooks for logic reuse
- Write tests for new features
- Use meaningful variable names
- Add error boundaries where needed

## Deployment Checklist
1. Set production environment variables
2. Generate strong JWT secret
3. Configure SSL/HTTPS
4. Set up database backups
5. Configure monitoring
6. Test all features
7. Create initial admin user

## Troubleshooting

### Common Issues
1. **CORS errors**: Check FRONTEND_URL in backend .env
2. **Database locked**: Restart backend container
3. **Auth failures**: Clear cookies/localStorage
4. **Build failures**: Check Node.js version (>=20)

### Useful Commands
```bash
# View logs
docker-compose logs -f

# Reset database
rm backend/data/status.db
docker-compose restart backend

# Check API health
curl http://localhost:3001/health

# Run specific test
npm test -- --testNamePattern="StatusService"
```

## Codebase Review & Refactoring Insights (2025-06)

### Key Issues Discovered & Fixed

#### Backend Configuration Issues
- **Missing Dependencies**: Added `validator`, `express-rate-limit`, `compression` packages
- **Config Schema Gaps**: Extended schema with production settings (DB_CONNECTION_TIMEOUT, TRUST_PROXY, etc.)
- **Type Safety**: Created `src/types/express.d.ts` to extend Express Request interface

#### Code Quality Improvements
- **Console Cleanup**: Removed 8+ console.log statements from frontend production code
- **Type Safety**: Replaced `any` types with proper interfaces (`HealthCheckResponse`, `ApiResponse<unknown>`)
- **Unused Imports**: Removed `AdminOnlyComponent` imports from status cards
- **Deprecated APIs**: Updated crypto to use `createCipheriv`/`createDecipheriv`

#### Test Coverage Enhancements
- **Missing Tests**: Added comprehensive tests for `AuthWrapper` and `ProtectedRoute` components
- **Current Coverage**: Frontend ~76%, Backend ~37% (needs improvement)
- **Test Issues**: Some timeout issues in backend tests due to config validation

### Architecture Patterns Observed

#### Frontend (Next.js 15 + React 19)
- **Component Structure**: Well-organized auth, layout, status, and UI components
- **State Management**: Context API for auth, custom hooks for business logic
- **Type Safety**: Strong TypeScript usage with proper interfaces
- **Testing**: React Testing Library with jest mocking patterns

#### Backend (Express + TypeScript)
- **Layered Architecture**: Routes → Services → Models pattern
- **Security**: Multiple middleware layers (auth, rate limiting, validation)
- **Configuration**: Zod schema validation with environment-specific configs
- **Database**: SQLite with both standard and optimized connection classes

### Best Practices Implemented
1. **Error Handling**: Consistent error boundaries and async/await patterns
2. **Security**: Helmet.js, rate limiting, input sanitization
3. **Validation**: Zod schemas for both request/response validation
4. **Testing**: Mocking external dependencies, component isolation
5. **TypeScript**: Strict typing with interface extensions

### Performance Optimizations
- **React.memo**: Used in status components for render optimization
- **Database**: WAL mode, connection pooling in optimized DB class
- **Caching**: In-memory rate limiting with cleanup intervals
- **Build**: TypeScript compilation optimizations

### Development Workflow Improvements
- **Build Process**: Fixed TypeScript compilation errors blocking builds
- **Type Checking**: Resolved null/undefined type mismatches
- **Import Management**: Cleaned unused imports for better tree-shaking
- **Error Logging**: Replaced console statements with proper error handling

### Remaining Technical Debt
1. **Backend Tests**: Need comprehensive service and middleware test coverage
2. **Frontend Types**: Some test files need jest matcher type definitions
3. **Duplicate Code**: View-only UI pattern in status cards could be abstracted
4. **Console Cleanup**: Backend still has console statements for monitoring

### Security Considerations
- **JWT Implementation**: Secure token handling with proper expiration
- **Input Validation**: Multi-layer validation (client, middleware, schema)
- **Rate Limiting**: Progressive limiting with different tiers
- **Error Exposure**: Careful not to leak sensitive info in error messages

### Testing Strategy
- **Unit Tests**: Component and service level testing
- **Integration Tests**: API endpoint testing with supertest
- **Mocking**: Comprehensive mocking of external dependencies
- **Coverage Goals**: Aiming for >80% coverage across both frontend/backend

### Production Readiness
- **Docker**: Multi-container setup with nginx reverse proxy
- **Monitoring**: Health checks, metrics collection, logging
- **Security**: Production-grade headers, HTTPS enforcement
- **Database**: Backup strategies and connection management

## Future Enhancements
- Add data export functionality
- Implement push notifications
- Add more metrics tracking
- Create mobile app version
- Add data visualization charts
- Implement social features

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [SQLite Optimization](https://www.sqlite.org/optoverview.html)