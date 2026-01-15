# Lucky Aces

## Installation & Deployment Guide

---

## Overview & Architecture

**Lucky Aces** is a full-stack web application built for CSC309 (Web Programming).

* **Frontend**: React single-page application located in `frontend/lucky_aces`, bootstrapped with Create React App and bundled using `react-scripts`.
* **Backend**: Node.js + Express application in `backend/`, using Prisma for data access, Socket.IO for real-time notifications, and SQLite as the default database.
* **Data Layer**: Prisma schema defined in `backend/prisma/schema.prisma`, with checked-in migrations and optional seed data.
* **Transport & Security**: REST/JSON APIs and Socket.IO websockets with CORS protection via the `FRONTEND_URL` environment variable.

---

## Prerequisites

### Node.js 20 LTS + npm 10+

```bash
node -v
npm -v
```

### Git 2.40+

```bash
git --version
```

### SQLite 3.40+

```bash
sqlite3 --version
```

### Prisma CLI

```bash
npm install -g prisma@6.18.0
prisma -v
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-long-random-string
```

Start the backend with:

```bash
node index.js 3001
```

### Frontend (`frontend/lucky_aces/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_FRONTEND_URL=http://localhost:3000
```

---

## Local Development Workflow

### Clone

```bash
git clone https://github.com/LL333111/CSC309A2.git
cd CSC309A2
```

### Backend

```bash
cd backend
npm install
npm run seed
node index.js 3001
```

### Frontend

```bash
cd frontend/lucky_aces
npm install
npm start
```

---

## Re-populated Database Description

The database is pre-seeded to support full feature testing and demonstration. All users share the same initial password:

**Password:** `123456cC!`

---

### 1. User Accounts

There are **10 pre-configured users** divided into four roles:

* **Superuser** (1): `super001`
  *Recommended for exploring the full website experience, as most seeded data is associated with this account.*
* **Managers** (2): `mana001`, `mana002`
* **Cashiers** (3): `cash001`, `cash002`, `cash003`
  *Note: `cash003` is marked as suspicious.*
* **Regular Users** (4): `regul001`, `regul002`, `regul003`, `regul004`

**Tip:** Log in as `super001` for the most complete and representative dataset.

---

### 2. Promotions

Each user is initialized with promotions for testing:

* **Automatic Promotions:** 5
* **One-time Promotions:** 5

For *each* promotion type, the status distribution is:

* Ended: 1
* Upcoming: 1
* Active: 3

---

### 3. Events

The database includes **12 pre-loaded events** with a balanced distribution of states and visibility:

* **Ended Events (4)**

  * 2 Published (1 without organizers/guests, 1 with organizers/guests)
  * 2 Unpublished
* **Active Events (4)**

  * 2 Published (1 without organizers/guests, 1 with organizers/guests)
  * 2 Unpublished
* **Upcoming Events (4)**

  * 2 Published (1 without organizers/guests, 1 with organizers/guests)
  * 2 Unpublished

---

### 4. Transactions

There are **40 initial transaction records**, covering all supported transaction types:

* **By Type**:

  * Transfer: 6
  * Purchase: 4
  * Redemption: 7
  * Adjustment: 2
  * Event-related: 11

* **User Association**:

  * 19 transactions are associated with the superuser `super001`.

---

## Key URLs (Development)

* Frontend SPA: `http://localhost:3000`
* Backend REST API: `http://localhost:3001`

---

## Notes

* Rerun `npm run seed` to restore the database to this initial state.
* Delete `backend/prisma/dev.db` to fully reset all data before reseeding.
