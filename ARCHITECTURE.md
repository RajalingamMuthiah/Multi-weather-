# Weather Dashboard - Project Architecture

## Executive Summary

This is a **full-stack multi-user weather dashboard** built with Node.js, Express, MongoDB, and vanilla JavaScript. The system demonstrates secure authentication, strict data isolation, RESTful API design, and external API integration.

## Core Features

### 1. Multi-User System
- Each user has isolated data
- No cross-user access possible
- Strict userId-based filtering

### 2. Authentication & Authorization
- Secure registration with bcrypt
- JWT-based authentication
- Token verification middleware
- 7-day token expiry

### 3. City Management
- Add unlimited cities
- Real-time weather data
- Favorite marking
- Delete functionality

### 4. Weather Integration
- OpenWeatherMap API
- Real-time temperature
- Weather descriptions
- Graceful fallback on API failure

## System Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  (HTML, CSS, Vanilla JavaScript)                │
│  - index.html (Login/Register)                  │
│  - dashboard.html (City Management)             │
│  - auth.js (Authentication Logic)               │
│  - dashboard.js (Dashboard Logic)               │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Requests (Fetch API)
                  │ Authorization: Bearer <JWT>
┌─────────────────▼───────────────────────────────┐
│                   Backend                        │
│  (Node.js + Express)                            │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  Routes                                 │    │
│  │  - authRoutes → /api/auth              │    │
│  │  - cityRoutes → /api/cities            │    │
│  └────────────┬───────────────────────────┘    │
│               │                                  │
│  ┌────────────▼───────────────────────────┐    │
│  │  Middleware                             │    │
│  │  - authMiddleware (JWT verification)   │    │
│  └────────────┬───────────────────────────┘    │
│               │                                  │
│  ┌────────────▼───────────────────────────┐    │
│  │  Controllers                            │    │
│  │  - authController (register, login)    │    │
│  │  - cityController (CRUD operations)    │    │
│  └────────────┬───────────────────────────┘    │
│               │                                  │
│  ┌────────────▼───────────────────────────┐    │
│  │  Models                                 │    │
│  │  - User (name, email, password)        │    │
│  │  - City (userId, cityName, favorite)   │    │
│  └────────────┬───────────────────────────┘    │
└───────────────┼──────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────┐
│                   Database                        │
│  (MongoDB)                                       │
│  - users collection                              │
│  - cities collection                             │
└──────────────────────────────────────────────────┘

External: OpenWeatherMap API (Weather Data)
```

## Authentication Flow (Critical)

### Registration Process

```
User submits form
    ↓
Frontend sends: { name, email, password }
    ↓
authController.register()
    ├─ Check if user exists
    ├─ Hash password (bcrypt, 10 rounds)
    ├─ Save user to MongoDB
    ├─ Generate JWT: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
    └─ Return: { token, userId }
    ↓
Frontend stores token in localStorage
    ↓
Redirect to dashboard.html
```

### Login Process

```
User submits credentials
    ↓
Frontend sends: { email, password }
    ↓
authController.login()
    ├─ Find user by email
    ├─ Compare password: bcrypt.compare(entered, stored)
    ├─ If valid → Generate JWT
    └─ Return: { token, userId }
    ↓
Frontend stores token
    ↓
Redirect to dashboard
```

### Protected Request Flow

```
User makes request (e.g., GET /api/cities)
    ↓
Frontend adds header: Authorization: Bearer <token>
    ↓
authMiddleware intercepts request
    ├─ Extract token from header
    ├─ Verify: jwt.verify(token, JWT_SECRET)
    ├─ Decode userId from token payload
    ├─ Attach req.userId
    └─ Call next()
    ↓
Controller executes with req.userId available
    ↓
Query database with userId filter
```

## Data Isolation Strategy

### The Problem
Multi-user systems must prevent users from accessing each other's data.

### The Solution
Every city document contains `userId` field:

```javascript
{
  _id: "abc123",
  userId: "user_xyz",  // ← This links city to specific user
  cityName: "London",
  favorite: false
}
```

### Enforcement Points

**1. Creation (POST /api/cities)**
```javascript
City.create({
  userId: req.userId,  // ← From verified JWT
  cityName: req.body.cityName
})
```

**2. Reading (GET /api/cities)**
```javascript
City.find({ userId: req.userId })  // ← Only user's cities
```

**3. Updating (PUT /api/cities/:id/favorite)**
```javascript
City.findOne({ 
  _id: req.params.id, 
  userId: req.userId  // ← Must match logged-in user
})
```

**4. Deleting (DELETE /api/cities/:id)**
```javascript
City.findOne({ 
  _id: req.params.id,
  userId: req.userId  // ← Prevents deleting others' cities
})
```

**Result:** User A cannot access, modify, or delete User B's cities.

## Weather Integration Architecture

### Why Not Store Weather in Database?

Weather changes every hour. Storing it would create:
- Stale data
- Extra database writes
- Synchronization complexity

### Solution: Hybrid Approach

**Database stores:** City names (permanent)  
**API provides:** Weather data (dynamic)  
**Backend merges:** Both sources in real-time

### Implementation

```javascript
// cityController.getCities()

1. Fetch cities from MongoDB
   cities = City.find({ userId: req.userId })

2. For each city, fetch weather
   Promise.all(cities.map(async (city) => {
     const weather = await axios.get(WEATHER_API, {
       params: { q: city.cityName }
     })
     
     return {
       _id: city._id,
       cityName: city.cityName,
       isFavorite: city.favorite,
       temperature: weather.data.main.temp,  // From API
       weatherDescription: weather.data.weather[0].description
     }
   }))

3. Return merged data
```

### Benefits
- Always fresh weather data
- Reduced database load
- Separation of concerns

## Controller-Based Architecture

### Why Controllers?

**Before (Bad):**
```javascript
// routes/cityRoutes.js
router.get('/', authMiddleware, async (req, res) => {
  // 50 lines of business logic here...
})
```

**After (Good):**
```javascript
// routes/cityRoutes.js
router.get('/', authMiddleware, getCities);

// controllers/cityController.js
const getCities = async (req, res) => {
  // Business logic here
}
```

### Advantages
1. **Separation of Concerns:** Routes define endpoints, controllers define logic
2. **Testability:** Controllers can be unit tested independently
3. **Reusability:** Same controller can be used by multiple routes
4. **Maintainability:** Changes don't affect routing structure

## Security Measures

### 1. Password Security
- Never store plain-text passwords
- bcrypt hashing (10 rounds)
- Passwords never returned in responses

### 2. Authentication
- Stateless JWT tokens
- Signed with secret key
- Cannot be forged without secret

### 3. Authorization
- Every protected route uses authMiddleware
- Token required for all city operations
- Invalid/expired tokens → 401 Unauthorized

### 4. Data Isolation
- userId filtering on all queries
- Database-level enforcement
- No way to bypass via API

### 5. Input Validation
- Duplicate city prevention (unique index)
- Required field validation
- Type checking via Mongoose

## API Design

### RESTful Principles

| Method | Endpoint                      | Purpose              | Auth Required |
|--------|-------------------------------|----------------------|---------------|
| POST   | /api/auth/register            | Create user          | No            |
| POST   | /api/auth/login               | Authenticate user    | No            |
| POST   | /api/cities                   | Create city          | Yes           |
| GET    | /api/cities                   | Get user's cities    | Yes           |
| PUT    | /api/cities/:id/favorite      | Toggle favorite      | Yes           |
| DELETE | /api/cities/:id               | Delete city          | Yes           |

### Request/Response Examples

**Register**
```
POST /api/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "pass123" }
Response: { "token": "eyJhbGc...", "userId": "abc123" }
```

**Get Cities**
```
GET /api/cities
Headers: { "Authorization": "Bearer eyJhbGc..." }
Response: [
  {
    "_id": "city1",
    "cityName": "London",
    "isFavorite": true,
    "temperature": 15.2,
    "weatherDescription": "partly cloudy"
  }
]
```

## Frontend Architecture

### State Management
- JWT stored in localStorage
- No global state management library
- Fetch data on page load

### Error Handling
- Network errors → display error message
- 401 errors → redirect to login
- API failures → show fallback data

### User Experience
- Loading states during API calls
- Error messages auto-dismiss after 3s
- Optimistic UI updates

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date (default: now)
}
```

### Cities Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (required, ref: User),
  cityName: String (required),
  country: String,
  favorite: Boolean (default: false),
  addedAt: Date (default: now)
}

Indexes:
- { userId: 1, cityName: 1 } (unique)  // Prevent duplicate cities per user
```

## Key Design Decisions

### Q: Why JWT over sessions?
**A:** Stateless, scalable, works across multiple servers, no server-side storage required.

### Q: Why separate controllers from routes?
**A:** Better code organization, easier testing, clearer separation of concerns.

### Q: Why fetch weather dynamically instead of storing?
**A:** Weather changes frequently, real-time data is more accurate, reduces storage.

### Q: Why filter by userId in every query?
**A:** Security-critical, prevents data leaks, enforces multi-user isolation.

### Q: Why use Mongoose models?
**A:** Schema validation, middleware hooks, cleaner query syntax, better structure.

## Testing Strategy

### Backend Testing
1. Test authentication endpoints
2. Test protected routes require JWT
3. Test data isolation (user A can't access user B's data)
4. Test weather API integration
5. Test error handling

### Frontend Testing
1. Test login/register flow
2. Test token storage
3. Test 401 handling
4. Test CRUD operations
5. Test UI updates

## Deployment Considerations

### Environment Variables
- Use strong JWT_SECRET in production
- MongoDB Atlas for cloud database
- Secure API keys

### Security
- HTTPS only
- Rate limiting
- Input sanitization
- CORS configuration

### Scalability
- Stateless authentication enables horizontal scaling
- Database indexing for performance
- Weather API caching for quota management

## Common Pitfalls Avoided

❌ Storing passwords in plain text  
✅ Using bcrypt hashing

❌ Not filtering by userId  
✅ Every query includes userId filter

❌ Logic in route files  
✅ Separate controllers

❌ No token validation  
✅ authMiddleware on protected routes

❌ Storing weather in database  
✅ Fetch dynamically from API

## Project Demonstrates

✓ Full-stack development
✓ RESTful API design
✓ Secure authentication
✓ Authorization enforcement
✓ Third-party API integration
✓ Database relationship modeling
✓ Clean architecture
✓ Separation of concerns
✓ Error handling
✓ Modern JavaScript (async/await)

## What This Project Teaches

1. **Security:** How to build secure multi-user systems
2. **Architecture:** How to structure scalable applications
3. **Integration:** How to combine multiple technologies
4. **Best Practices:** Industry-standard patterns
5. **Problem Solving:** Real-world challenges and solutions
