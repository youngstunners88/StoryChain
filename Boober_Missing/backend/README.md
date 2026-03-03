# Boober Backend API

A production-ready ride-hailing backend API built with Node.js, Express, TypeScript, Prisma, PostgreSQL, and Redis.

## Features

- **Authentication**: JWT-based auth with phone verification
- **User Management**: Passengers, drivers, and admin users
- **Ride Booking**: Real-time ride requests and matching
- **Driver Management**: Availability, vehicle info, earnings
- **Payment Processing**: Wallet system with multiple payment methods
- **Real-time Updates**: WebSocket support for live tracking
- **Admin Dashboard**: Comprehensive admin API
- **Rate Limiting**: Protection against abuse
- **Validation**: Request validation with express-validator

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Auth**: JWT
- **Validation**: express-validator
- **Logging**: Winston

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Auth, error handling, validation
├── routes/          # API routes
├── services/        # Business logic
├── lib/             # Prisma, Redis clients
├── utils/           # Helper functions
└── index.ts         # App entry point
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/login-phone` - Login with phone
- `POST /api/auth/verify-phone` - Verify phone number
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password
- `GET /api/users/rides` - Ride history
- `GET /api/users/favorites` - Favorite locations
- `GET /api/users/payment-methods` - Payment methods

### Rides
- `POST /api/rides` - Create ride request
- `GET /api/rides` - Get rides
- `GET /api/rides/active` - Get active ride
- `GET /api/rides/nearby-drivers` - Find nearby drivers
- `GET /api/rides/estimate` - Get fare estimate
- `POST /api/rides/:id/cancel` - Cancel ride
- `POST /api/rides/:id/rate` - Rate ride

### Drivers
- `GET /api/driver/profile` - Driver profile
- `POST /api/driver/availability` - Update availability
- `GET /api/driver/stats` - Driver statistics
- `GET /api/driver/earnings` - Earnings report
- `GET /api/driver/rides` - Driver rides
- `GET /api/driver/vehicle` - Vehicle info
- `POST /api/driver/rides/:id/accept` - Accept ride
- `POST /api/driver/rides/:id/complete` - Complete ride

### Payments
- `GET /api/payments/wallet` - Wallet balance
- `POST /api/payments/wallet/topup` - Top up wallet
- `POST /api/payments/wallet/withdraw` - Withdraw funds
- `GET /api/payments/transactions` - Transaction history
- `POST /api/payments/process` - Process payment
- `POST /api/payments/refund` - Request refund

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - All users
- `GET /api/admin/rides` - All rides
- `GET /api/admin/reports/revenue` - Revenue report
- `GET /api/admin/reports/drivers` - Drivers report
- `GET /api/admin/verifications` - Pending verifications
- `GET /api/admin/settings` - System settings

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/boober?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@boober.taxi"
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Database Schema

### Users
- id, email, phone, name, avatar, password
- userType (PASSENGER, DRIVER, ADMIN)
- isVerified, status, rating
- createdAt, updatedAt

### Vehicles
- id, driverId, make, model, year, color
- plateNumber, vehicleType, capacity

### Rides
- id, passengerId, driverId
- pickup/dropoff (address, lat, lng)
- distance, fare, status
- paymentStatus, paymentMethod

### Wallets & Transactions
- id, userId, balance
- Transactions: type, amount, status, description

## License

MIT
