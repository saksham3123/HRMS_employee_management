# PeopleDesk – HR Management System

PeopleDesk is a full-stack Human Resource Management System (HRMS) that brings employee administration, attendance tracking, leave management, payroll and reporting hierarchies into one platform.

It is built with **React, Node.js, Express and PostgreSQL**, and follows a REST API architecture with JWT authentication and permission-based access control.

## Key Features

### Authentication & Access Control
- JWT-based login with bcrypt password hashing.
- Four roles: **Admin, HR, Manager and Employee**.
- Permission-based authorization (e.g. `leave.approve.team`, `payroll.view.all`) enforced on the backend through `requirePermission` middleware, not only by hiding UI.
- Protected frontend routes with role-specific dashboards.

### Employee Management
- Create, list, update and deactivate employee accounts.
- Assign and edit user roles.
- Department and designation management (create, update, delete), with employee counts.
- Employee profile page.

### Reporting Hierarchy
- Assign, update, view and remove an employee's reporting manager.
- Recursive PostgreSQL query (CTE) that blocks circular reporting chains.
- Manager team view.

### Attendance & Payroll
- Clock-in and clock-out, with one attendance record per employee per day.
- Today's attendance and attendance history.
- Automatic working-hours and daily-pay calculation.
- Admin overview of today's attendance across the organization.
- Monthly attendance reports and payroll summaries, overall and per employee.

### Leave Management
- Leave types (Annual, Sick, Personal).
- Apply for leave with date validation.
- Prevents overlapping pending or approved requests.
- Review workflow: pending, approved, rejected, cancelled.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Tables | DataTables (`datatables.net-react`) |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Data access | node-postgres (`pg`), Prisma ORM 7 (being integrated alongside `pg`) |
| Authentication | JWT, bcrypt |
| API communication | REST, Fetch API |
| Tools | Git, Postman, VS Code |

## Architecture

```text
React frontend (Vite)
        │  REST requests (JWT in Authorization header)
        ▼
Express API ── auth middleware ── permission middleware
        │
   Controllers
        │
  pg pool / Prisma Client
        │
    PostgreSQL
```

## Project Structure

```text
user_portal/
├── backend/
│   ├── config/          # PostgreSQL pool and Prisma client
│   ├── controllers/     # users, attendance, leave, departments, designations, reporting
│   ├── database/        # schema.sql (tables, roles, permissions, seed data)
│   ├── helpers/         # reporting-hierarchy cycle check (recursive CTE)
│   ├── middleware/      # auth, role and permission checks, validation
│   ├── prisma/          # schema.prisma (introspected from the database)
│   ├── routes/
│   ├── scripts/         # seedAdmin.js
│   ├── prisma7.config.ts
│   └── index.js
├── frontend/
│   └── src/
│       ├── components/  # admin, attendance, auth, dashboard
│       ├── context/     # auth context
│       ├── hooks/       # usePermissions
│       ├── pages/
│       ├── services/    # API calls
│       └── App.jsx
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v20 or later)
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd user_portal
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173

# PostgreSQL connection used by the pg pool
PGHOST=localhost
PGPORT=5432
PGDATABASE=hrms_db
PGUSER=postgres
PGPASSWORD=your_password

# PostgreSQL connection used by Prisma
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hrms_db?schema=public

# First admin account created by scripts/seedAdmin.js
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

If your password contains special characters, URL-encode them in `DATABASE_URL`.

### 3. Set up the database

```bash
createdb -U postgres hrms_db
psql -U postgres -d hrms_db -f database/schema.sql
npx prisma generate
node scripts/seedAdmin.js
```

This creates the tables, roles, permissions and leave types, generates the Prisma client, and creates the first admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### 4. Start the backend

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

### 5. Set up and start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend calls the API at `http://localhost:3000/api` (set in `src/services/api.js`).

### 6. Log in

Open the URL Vite prints (usually `http://localhost:5173`) and sign in with the admin credentials from `.env`. From there you can create HR, Manager and Employee accounts.

## API Overview

| Base route | Purpose |
|---|---|
| `/api/users` | Login, profile, user and employee management |
| `/api/admin` | Admin employee, attendance, payroll and manager assignment |
| `/api/attendance` | Clock-in/out, history, monthly reports |
| `/api/leave` | Leave types, requests and reviews |
| `/api/departments` | Department CRUD |
| `/api/designations` | Designation CRUD |
| `/api/manager` | Manager team view |

All routes except login require a `Bearer` token.

## Database Design

- Relational schema with primary keys, foreign keys, unique and CHECK constraints.
- Separate `users` (login accounts) and `employees` (HR records) tables. `users.id` and `employees.id` are different values; manager assignment uses `employees.id`.
- Many-to-many `user_roles` and `role_permissions` tables for RBAC.
- Recursive CTE to validate the reporting hierarchy.
- Transactions for multi-step operations such as creating a user with an employee record and role.
- Parameterized queries throughout.

## Security

- Passwords hashed with bcrypt.
- JWT authentication on every protected route.
- Permission checks on the backend for every sensitive action.
- Parameterized SQL and Prisma queries to prevent SQL injection.
- Secrets kept in environment variables.

## Roadmap

- Two-level leave approval (HR, then Manager).
- Manager view of team projects and leave requests.
- Team announcements for managers.
- SMTP email notifications and HTML email signatures.
- Complete migration of controllers to Prisma.
- End-to-end testing and production deployment.

## Author

**Saksham** – Full-Stack Developer

[GitHub](https://github.com/saksham3123) · [LinkedIn](https://www.linkedin.com/in/saksham31203/)