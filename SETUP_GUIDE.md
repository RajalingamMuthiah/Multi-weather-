# Weather Dashboard - Setup Guide

## Project Structure

```
weather-dashboard/
├── server/
│   ├── server.js                    # Express server entry point
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   └── City.js                  # City schema
│   ├── controllers/
│   │   ├── authController.js        # Auth business logic
│   │   └── cityController.js        # City business logic
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   └── cityRoutes.js            # City endpoints
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification
│   ├── package.json
│   └── .env
│
└── client/
    ├── index.html                   # Login/Register page
    ├── dashboard.html               # Dashboard page
    ├── css/
    │   └── style.css                # Styling
    └── js/
        ├── auth.js                  # Auth logic
        └── dashboard.js             # Dashboard logic
```

## Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- OpenWeatherMap API key

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Create Environment File

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/weather-dashboard
JWT_SECRET=your_strong_secret_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### 3. Start MongoDB

If using local MongoDB:

```bash
mongod
```

### 4. Start Server

```bash
cd server
node server.js
```

Server runs on http://localhost:5000

### 5. Open Frontend

Open `client/index.html` in a browser or use Live Server.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Cities (Protected)
- `POST /api/cities` - Add city
- `GET /api/cities` - Get user's cities with weather
- `PUT /api/cities/:id/favorite` - Toggle favorite
- `DELETE /api/cities/:id` - Delete city

## Architecture Flow

### Authentication Flow
1. User registers → password hashed with bcrypt
2. User logs in → JWT token generated with userId
3. Token stored in localStorage
4. Token sent in Authorization header for protected routes
5. authMiddleware verifies token and attaches req.userId

### City Management Flow
1. User adds city → saved with userId in MongoDB
2. User views cities → backend queries cities by userId
3. For each city → fetch real-time weather from OpenWeather API
4. Merge database + weather data → return to frontend
5. Frontend renders dynamically

### Data Isolation
- Every city has userId field
- All queries filter by req.userId
- User can only access their own cities
- No cross-user data access possible

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT authentication (7-day expiry)
- Protected routes with middleware
- Strict data isolation
- No password returned in responses

## Testing the Application

### 1. Register a User
- Open index.html
- Click "Register" tab
- Fill form and submit
- Auto-redirected to dashboard

### 2. Add Cities
- Enter city name (e.g., "London")
- Click "Add"
- Weather data displayed

### 3. Toggle Favorite
- Click star icon to mark favorite
- Gold star = favorite

### 4. Delete City
- Click "Delete" button
- City removed from list

### 5. Logout
- Click "Logout" button
- Redirected to login page

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env

### Weather Data Not Loading
- Verify OPENWEATHER_API_KEY in .env
- Check API key is valid

### 401 Unauthorized
- Token expired or invalid
- User needs to login again

### CORS Issues
- Server already configured with CORS
- Ensure frontend calls correct API_URL

## Key Files Explained

### server.js
- Loads environment variables
- Connects to MongoDB
- Registers middleware (CORS, JSON parser)
- Mounts routes
- Starts server

### authController.js
- register: hashes password, creates user, returns JWT
- login: validates credentials, returns JWT

### cityController.js
- createCity: saves city with userId
- getCities: fetches cities + weather data
- toggleFavorite: updates favorite status
- deleteCity: removes city

### authMiddleware.js
- Extracts token from Authorization header
- Verifies JWT with secret
- Attaches userId to request
- Returns 401 if invalid

### dashboard.js
- fetchCities: gets cities from backend
- renderCities: displays city cards
- addCity: creates new city
- toggleFavorite: updates favorite status
- deleteCity: removes city

## Integration Verification Checklist

✓ server.js imports routes correctly
✓ Routes import controllers correctly
✓ Controllers import models correctly
✓ authMiddleware extracts and verifies JWT
✓ All city routes use authMiddleware
✓ Controllers filter by req.userId
✓ Frontend sends token in headers
✓ Frontend handles 401 responses
✓ No circular dependencies

## Production Deployment

### Backend
1. Set strong JWT_SECRET
2. Use MongoDB Atlas URI
3. Enable HTTPS
4. Set appropriate CORS origins
5. Add rate limiting
6. Add input validation

### Frontend
1. Update API_URL to production server
2. Enable HTTPS
3. Add error boundaries
4. Optimize assets

## Common Issues

### Issue: Token not being sent
**Solution:** Check Authorization header format: `Bearer <token>`

### Issue: Weather data always "unavailable"
**Solution:** Verify OPENWEATHER_API_KEY and check API quota

### Issue: Can see other users' cities
**Solution:** Verify userId filter in all city queries

### Issue: Login works but dashboard empty
**Solution:** Check browser console for errors, verify token in localStorage

## Next Steps

- Add 5-day weather forecast
- Implement weather alerts
- Add city search autocomplete
- Create mobile responsive design
- Add loading skeletons
- Implement city weather history
