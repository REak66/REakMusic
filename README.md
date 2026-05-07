# REakMusic

A full-stack music selling platform built with Node.js/Express (backend) and Angular 17 (frontend).

## Features

- 🎵 Browse, preview, and purchase music
- 🔐 JWT RS256 authentication with OTP email verification
- 💳 KHQR payment integration (Bakong NBC)
- ☁️ Google Drive storage for audio files with signed download URLs
- 🔔 Telegram admin notifications
- 🌐 Bilingual (English + Khmer)
- 🎧 Persistent audio player with queue management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18, Express 4, Mongoose 7 |
| Database | MongoDB 7 |
| Cache | Redis 7 |
| Auth | JWT RS256, bcrypt (12 rounds) |
| Storage | Google Drive Service Account |
| Payment | KHQR / Bakong API |
| Frontend | Angular 17, ngx-translate |
| Infra | Docker Compose |

## Project Structure

```
REakMusic/
├── backend/          # Node.js + Express API
├── frontend/         # Angular 17 SPA
├── docker-compose.yml
└── README.md
```

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose
- Google Service Account JSON (for Drive integration)
- Gmail App Password
- Telegram Bot Token
- RS256 key pair

### 1. Generate RS256 Key Pair

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Base64 encode for env vars
base64 -w0 private.pem
base64 -w0 public.pem
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

### 3. Start All Services

```bash
docker-compose up -d
```

The app will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:3000/api/v1
- Health check: http://localhost:3000/api/v1/health

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
# Open http://localhost:4200
```

## API Overview

All endpoints are prefixed with `/api/v1`. Responses follow:
```json
{ "success": true, "data": {}, "message": "...", "pagination": {} }
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/login` | Login, returns access token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout, blacklist token |
| POST | `/auth/forgot-password` | Send password reset OTP |
| POST | `/auth/verify-forgot-otp` | Verify OTP, get reset token |
| POST | `/auth/reset-password` | Set new password |

### Music

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/songs` | List songs (paginated) |
| GET | `/songs/search` | Search with filters |
| GET | `/songs/:id` | Song detail |
| GET | `/songs/:id/download` | Download (authenticated, owned) |
| POST | `/songs` | Create song (admin) |
| PUT | `/songs/:id` | Update song (admin) |
| DELETE | `/songs/:id` | Delete song (admin) |
| GET | `/artists` | List artists |
| GET | `/albums` | List albums |
| GET | `/genres` | List genres |

### Orders & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/checkout` | Create order + KHQR QR |
| GET | `/orders/:id` | Get order status |
| POST | `/payments/callback` | KHQR webhook |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get profile |
| PATCH | `/users/me` | Update profile |
| GET | `/users/me/orders` | Purchase history |

### Analytics (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/summary` | Revenue, users, songs totals |
| GET | `/analytics/top-songs` | Top songs by downloads |
| GET | `/analytics/revenue` | Revenue by period |

## Environment Variables

See `backend/.env.example` for the full list of required environment variables.

## Security

- All passwords hashed with bcrypt (cost 12)
- JWT signed with RS256 asymmetric keys
- OTP stored in Redis with 10-minute TTL
- Account lockout after 3 failed login attempts
- Rate limiting: 100 req/min global, 5 req/min on auth endpoints
- KHQR webhook signature verified on every callback
- Google Drive files never publicly accessible — signed URLs only
- MongoDB input sanitization via express-mongo-sanitize
- Helmet.js for security headers

## License

MIT