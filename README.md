# CareSupply Share

A full-stack community care supply exchange platform that helps verified organisations donate, discover, request, and safely exchange eligible care supplies.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 |
| Styling | Tailwind CSS 3 |
| Backend | Node.js + Express 4 |
| Database | MongoDB 9 + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Icons | Lucide React |
| Notifications | react-hot-toast |

---

## Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **MongoDB** v6+ running locally on port `27017`
  - On Windows: `mongod` or use MongoDB Compass
  - Or set `MONGO_URI` to a remote Atlas connection string

---

## Project Structure

```
c:\Caresupply\
├── backend/          Node.js / Express API
│   ├── src/
│   │   ├── models/       Mongoose schemas
│   │   ├── controllers/  Route logic
│   │   ├── routes/       Express routers
│   │   ├── middleware/   Auth, error handling
│   │   ├── app.js        Server entry
│   │   └── seed.js       Demo data seeder
│   └── .env
└── frontend/         React + Vite SPA
    └── src/
        ├── pages/        All 14 page components
        ├── components/   Reusable UI
        ├── context/      Auth context
        ├── hooks/        Custom hooks
        └── api/          Axios client
```

---

## Quick Start

### 1. Start MongoDB

```bash
mongod
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # already done — .env is pre-configured
npm install
npm run seed                # populate demo data (re-runnable)
npm run dev                 # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### `backend/.env.example`

```env
MONGO_URI=mongodb://localhost:27017/caresupply
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

A working `backend/.env` file is already provided. For production, change `JWT_SECRET` to a strong random value and set `CLIENT_URL` to your deployed frontend URL.

---

## Demo Credentials

All passwords: **`Demo1234!`** (except admin)

| Role | Email | Password | Organisation | Status |
|------|-------|----------|-------------|--------|
| **Admin** | `admin@caresupply.org` | `Admin1234!` | — | — |
| Donor | `donor1@greenleaf.org` | `Demo1234!` | Greenleaf Community Hub | Verified |
| Donor | `donor2@hopecenter.org` | `Demo1234!` | Hope Centre Supplies | Verified |
| Recipient | `recipient1@commcare.org` | `Demo1234!` | Community Care Network | Verified |
| Recipient | `recipient2@citysupport.org` | `Demo1234!` | City Support Services | Verified |
| Donor | `pending@sunrise.org` | `Demo1234!` | Sunrise Volunteers | **Pending** |

---

## Seeded Demo Data

The seed script (`npm run seed`) populates:

- **6 users** across all roles
- **5 organisations** (4 verified, 1 pending)
- **12 supply listings** across all 6 categories:
  - Emergency Trauma First Aid Kits, Sterile Gauze Bandages, Antibacterial Hand Rub, Incontinence Care Pads, Wheelchairs, Walking Crutches, Blood Pressure Monitors, Infrared Forehead Thermometers, Sensitive Cleansing Foam, Barrier Cream, Nitrile Gloves, Bed Protection Pads
- **6 requests**: 2 pending, 2 approved, 1 rejected, 1 completed
- **12 notifications** distributed across users

> The seed script is **idempotent** — it clears all collections before re-seeding.

---

## Workflows to Test

### Donor workflow
1. Log in as `donor1@greenleaf.org`
2. **Dashboard** → view active listings and pending requests
3. **My Listings** → view existing listings, edit, or create a new one
4. **Incoming Requests** → approve or reject a pending request
5. **Request Detail** → set a handover date and confirm dispatch

### Recipient workflow
1. Log in as `recipient1@commcare.org`
2. **Browse Supplies** → search and filter available listings
3. Open a listing → submit a request with quantity and message
4. **My Requests** → track request status
5. **Request Detail** → confirm receipt once donor dispatches

### Admin workflow
1. Log in as `admin@caresupply.org`
2. **Admin Dashboard → Pending Verification** → approve `Sunrise Volunteers`
3. **All Organisations** → suspend or reinstate any organisation
4. **Stats** → view platform-wide metrics

### Pending organisation
1. Log in as `pending@sunrise.org`
2. Observe the verification banner on the dashboard
3. Browse is allowed; listing creation is blocked until verified

---

## API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register org + user |
| POST | `/api/auth/login` | Public | Login (rate-limited) |
| GET | `/api/auth/me` | JWT | Current user + org |
| GET | `/api/listings` | Public | Browse with filters |
| POST | `/api/listings` | Donor + Verified | Create listing |
| PUT | `/api/listings/:id` | Donor owner | Update listing |
| DELETE | `/api/listings/:id` | Donor owner | Delete listing |
| POST | `/api/requests` | Recipient + Verified | Submit request |
| GET | `/api/requests/sent` | Recipient | My requests |
| GET | `/api/requests/received` | Donor | Incoming requests |
| PATCH | `/api/requests/:id/status` | Donor | Approve / Reject |
| PATCH | `/api/requests/:id/handover` | Both | Confirm handover |
| GET | `/api/notifications` | JWT | User notifications |
| PATCH | `/api/notifications/:id/read` | JWT | Mark as read |
| GET | `/api/admin/organisations` | Admin | All orgs |
| PATCH | `/api/admin/organisations/:id/verification` | Admin | Verify / Reject |
| GET | `/api/admin/stats` | Admin | Platform stats |

---

## Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- JWTs signed with `JWT_SECRET` from environment — never hard-coded
- Auth middleware enforces role and verification on every protected route
- Atomic MongoDB `findOneAndUpdate` prevents overselling of supply quantities
- Rate limiting on `/api/auth/login`: 10 requests per 15 minutes per IP
- `passwordHash` excluded from all API responses via Mongoose `transform`
- CORS restricted to `CLIENT_URL` only

---

## Feature Checklist

- [x] Organisation registration with verification workflow
- [x] JWT authentication with role-based access control
- [x] Supply listing creation with condition, expiry, and category validation
- [x] Browse, search, filter, and sort listings
- [x] Full request lifecycle: submit → approve/reject → handover → confirm
- [x] Atomic inventory management (no overselling)
- [x] Dual-confirmation handover (donor + recipient)
- [x] Automatic expiry exclusion from active listings
- [x] Expiry warnings on listings nearing 30-day window
- [x] In-app notification system (stored in MongoDB)
- [x] Admin verification dashboard with approve/reject/suspend
- [x] Responsive design (desktop, tablet, mobile)
- [x] Loading, empty, and error states throughout
- [x] Toast notifications on all user actions
