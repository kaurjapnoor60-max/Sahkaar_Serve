# Sahkaar Serve — Backend API

Full-stack Node.js/Express/MongoDB backend for the Sahkaar Serve SIH 2026 prototype.

## Quick Start

### 1. Configure MongoDB
Edit `.env` and replace the `MONGODB_URI` with your MongoDB Atlas connection string:
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/sahkaar_serve
```

### 2. Install dependencies
```bash
npm install
```

### 3. Seed the database
```bash
npm run seed
```

This creates:
- 1 Admin account
- 3 Customer accounts
- 14 Worker profiles (12 approved, 2 pending)
- 11 Service categories (including Househelp & Appliance Repair)
- 4 realistic bookings
- Demo notifications

### 4. Start the server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

## Demo Credentials

| Role | Phone | Password |
|------|-------|----------|
| Admin | 9000000000 | admin2026 |
| Customer (Priya) | 9900000001 | demo1234 |
| Worker (Rajesh) | 9801000001 | worker1234 |

---

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | JWT |
| GET | /api/services | Public |
| GET | /api/workers | Public |
| GET | /api/workers/me | Worker |
| GET | /api/workers/me/jobs | Worker |
| GET | /api/workers/me/earnings | Worker |
| POST | /api/bookings | Customer |
| GET | /api/bookings/my | Any |
| POST | /api/bookings/:id/accept | Worker |
| POST | /api/bookings/:id/reject | Worker |
| PATCH | /api/bookings/:id/status | Worker |
| POST | /api/bookings/:id/rating | Customer |
| POST | /api/bookings/:id/warranty | Customer |
| POST | /api/bookings/:id/insurance | Customer |
| POST | /api/matching/recommend | Any |
| POST | /api/ai/parse-request | Public |
| GET | /api/notifications | Any |
| GET | /api/admin/dashboard | Admin |
| GET | /api/admin/workers/pending | Admin |
| PATCH | /api/admin/workers/:id/approve | Admin |
| GET | /api/admin/demand/weekly | Admin |
| GET | /api/admin/demand/heatmap | Admin |
| GET | /api/admin/demand/forecast | Admin |
| GET | /api/health | Public |

---

## Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # MongoDB connection
│   │   └── constants.js    # Pricing, status, JWT config
│   ├── models/             # Mongoose schemas
│   ├── services/           # Business logic
│   ├── controllers/        # Route handlers
│   ├── routes/             # Express routers
│   ├── middleware/         # Auth, error handler
│   ├── seed/seed.js        # Database seeder
│   ├── app.js              # Express app setup
│   └── server.js           # Entry point
└── .env
```
