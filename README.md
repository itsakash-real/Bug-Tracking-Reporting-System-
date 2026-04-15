# 🐛 BugTracker Pro

A production-ready, JIRA-like **Bug Tracking & Reporting System** built with the MERN stack. Features a drag-and-drop Kanban board, role-based access control, analytics dashboards, and full bug lifecycle management.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 JWT Auth | Login/Register with role-based access (Admin, Developer, Tester) |
| 🐛 Bug Management | Create, edit, delete bugs with full lifecycle tracking |
| 📋 Kanban Board | Drag-and-drop between Open → In Progress → Closed |
| 📊 Dashboard | Recharts pie/bar charts for status, severity, priority distributions |
| 🔍 Filter & Search | Filter by status, severity, priority, assignee + full-text search |
| 📄 Pagination | Server-side pagination on the bug list |
| 💬 Comments | Add/delete comments on any bug |
| 📋 Activity Log | Full audit trail of every change made to a bug |
| 🌙 Dark Mode | Persistent dark/light theme via localStorage |
| 📧 Email Notification | Console-based mock notifications on key events |
| 🔒 Workflow Enforcement | Only assigned developer or Admin can change status |

---

## 🛠 Tech Stack

**Frontend:** React + Vite + TailwindCSS v4 + Recharts + @hello-pangea/dnd  
**Backend:** Node.js + Express + MongoDB (Mongoose)  
**Auth:** JWT + bcryptjs  
**Validation:** express-validator

---

## 📁 Folder Structure

```
bug-reporting-system/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/          # Business logic
│   ├── middleware/            # Auth & role middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── utils/seeder.js       # Demo data seeder
│   ├── validators/           # Input validation
│   ├── .env                  # Environment variables
│   └── server.js             # Express entry point
│
└── frontend/
    ├── src/
    │   ├── api/axios.js       # Axios instance with JWT interceptor
    │   ├── components/        # Reusable UI components
    │   ├── context/           # React context (Auth, Theme)
    │   └── pages/             # Page-level components
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd bug-reporting-system
```

### 2. Set up Backend
```bash
cd backend
npm install

# Edit .env if needed (default: localhost MongoDB)
npm run seed        # Populate demo data
npm run dev         # Start backend on http://localhost:5000
```

### 3. Set up Frontend
```bash
cd frontend
npm install
npm run dev         # Start frontend on http://localhost:5173
```

### 4. Open the app
Navigate to **http://localhost:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@bugtracker.com | password123 |
| Developer | bob@bugtracker.com | password123 |
| Developer | carol@bugtracker.com | password123 |
| Tester | dave@bugtracker.com | password123 |

---

## 📡 API Reference

### Auth
```
POST   /api/auth/register    — Create account
POST   /api/auth/login       — Get JWT token
GET    /api/auth/me          — Get current user (protected)
```

### Bugs
```
GET    /api/bugs             — List bugs (filters: status, severity, priority, assignedTo, search, page, limit)
POST   /api/bugs             — Create bug
GET    /api/bugs/stats       — Dashboard statistics
GET    /api/bugs/:id         — Bug details
PUT    /api/bugs/:id         — Update bug (status workflow enforced)
DELETE /api/bugs/:id         — Delete bug
POST   /api/bugs/:id/comments        — Add comment
DELETE /api/bugs/:id/comments/:cid   — Delete comment
```

### Users
```
GET    /api/users            — List users
GET    /api/users/:id        — User details
PUT    /api/users/:id        — Update role/status (Admin only)
DELETE /api/users/:id        — Delete user (Admin only)
```

---

## 🔒 Bug Workflow Rules

```
Open → In Progress → Closed
                  ↘ Open (Admin or Dev can reopen)
```

- **Assigned Developer:** Can move bugs to next allowed state
- **Admin:** Can perform any status transition (override)
- **Tester/Others:** Cannot change status — read-only access

---

## 🗃 Sample Test Data (via seeder)

8 sample bugs are created with various severities, priorities, and statuses:
- Critical P1: Login button unresponsive, Password reset broken
- High P2: Dashboard charts mobile issue, Kanban Firefox bug
- Medium P3: Slow bug list load, File upload validation
- Low: Spelling mistake (Closed), Dark mode preference reset

---

## 🌟 Portfolio Highlights

- **Role-based access control** — 3-tier permission system
- **Drag-and-drop with workflow validation** — not just visual, enforces business rules
- **Activity audit log** — tracks every field change with who/when/what
- **Optimistic UI updates** on Kanban drag (reverts on failure)
- **Secure by default** — helmet, CORS, bcrypt, no password leakage, JWT expiry
