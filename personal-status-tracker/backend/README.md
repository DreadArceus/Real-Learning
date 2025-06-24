# Personal Status Tracker API

A simple REST API for tracking personal status data including water intake and mood (altitude) levels.

## Features

- ✅ RESTful API with TypeScript
- ✅ SQLite database for data persistence
- ✅ Input validation and error handling
- ✅ CORS support for frontend integration
- ✅ Audit trail (creates new entries instead of updating)
- ✅ Multiple user support via userId parameter

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns API status and uptime information.

### Status Tracking

#### Get Latest Status
```
GET /api/status?userId=optional_user_id
```
Returns the most recent status entry for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": "default_user",
    "lastWaterIntake": "2024-01-15T12:00:00.000Z",
    "altitude": 7,
    "lastUpdated": "2024-01-15T12:00:00.000Z",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

#### Create Status Entry
```
POST /api/status?userId=optional_user_id
Content-Type: application/json

{
  "lastWaterIntake": "2024-01-15T12:00:00.000Z",
  "altitude": 7
}
```

**Validation:**
- `lastWaterIntake`: Required, valid ISO date string
- `altitude`: Required, integer between 1-10

#### Update Status
```
PUT /api/status?userId=optional_user_id
Content-Type: application/json

{
  "lastWaterIntake": "2024-01-15T13:00:00.000Z",
  "altitude": 8
}
```

**Note:** This creates a new entry for audit trail purposes.

**Validation:**
- `lastWaterIntake`: Optional, valid ISO date string
- `altitude`: Optional, integer between 1-10
- At least one field must be provided

#### Get Status History
```
GET /api/status/history?userId=optional_user_id&limit=10
```

**Query Parameters:**
- `userId`: Optional, defaults to "default_user"
- `limit`: Optional, defaults to 10, max 100

#### Delete All Status Entries
```
DELETE /api/status?userId=optional_user_id
```
Deletes all status entries for the specified user.

## Data Model

### StatusData
```typescript
interface StatusData {
  id?: number;
  userId?: string;
  lastWaterIntake: string;  // ISO date string
  altitude: number;         // 1-10 scale
  lastUpdated: string;      // ISO date string
  createdAt?: string;       // ISO date string
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Additional details (dev mode only)"
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `404`: Not Found - Resource not found
- `500`: Internal Server Error

## Database Schema

```sql
CREATE TABLE status_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT 'default_user',
  last_water_intake TEXT NOT NULL,
  altitude INTEGER NOT NULL CHECK (altitude >= 1 AND altitude <= 10),
  last_updated TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

```bash
PORT=3001                              # Server port
NODE_ENV=development                   # Environment
FRONTEND_URL=http://localhost:3000     # CORS origin
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── types/index.ts        # TypeScript interfaces
│   ├── models/
│   │   ├── database.ts       # Database connection
│   │   └── StatusModel.ts    # Status data model
│   ├── routes/
│   │   └── status.ts         # Status API routes
│   └── middleware/
│       ├── validation.ts     # Input validation
│       └── errorHandler.ts   # Error handling
├── data/                     # SQLite database files
├── package.json
└── tsconfig.json
```

### Testing the API

#### Using curl
```bash
# Health check
curl http://localhost:3001/health

# Create status
curl -X POST http://localhost:3001/api/status \
  -H "Content-Type: application/json" \
  -d '{"lastWaterIntake": "2024-01-15T12:00:00.000Z", "altitude": 7}'

# Get latest status
curl http://localhost:3001/api/status

# Update status
curl -X PUT http://localhost:3001/api/status \
  -H "Content-Type: application/json" \
  -d '{"altitude": 8}'

# Get history
curl http://localhost:3001/api/status/history?limit=5
```

## Frontend Integration

The API is designed to work with the Next.js frontend. Update the frontend to use these endpoints instead of localStorage:

1. Replace `useLocalStorage` hook with API calls
2. Update `useStatusData` to fetch from `/api/status`
3. Add proper error handling for network requests
4. Consider adding optimistic updates for better UX

## Security Considerations

- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- CORS configured for specific frontend origin
- Helmet.js for security headers
- No authentication by default (users identified by userId parameter)

## Performance

- SQLite for simplicity and portability
- Audit trail design (no data deletion/updates)
- Efficient queries with proper indexing
- Request logging with Morgan

## Deployment

The API can be deployed to any Node.js hosting platform:

1. Build the project: `npm run build`
2. Set environment variables
3. Start with: `npm start`
4. Ensure the `data/` directory is writable for SQLite