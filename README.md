# 🎫 HelpDesk — IT Support Ticketing System

A full-stack IT helpdesk ticketing system built with React, Node.js/Express, and SQLite.

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18, React Router v6   |
| Backend    | Node.js, Express            |
| Database   | SQLite (via better-sqlite3) |
| Auth       | JWT (jsonwebtoken)          |
| Passwords  | bcryptjs (hashed)           |

---

## Features

- ✅ **User authentication** — Register/login with JWT tokens, role-based access (user/admin)
- ✅ **Submit tickets** — Title, description, category, priority
- ✅ **Track tickets** — View status, priority, assignee, full history
- ✅ **Comment threads** — Users and admins can add notes to any ticket
- ✅ **Admin dashboard** — View all tickets, inline status/priority editing, stats overview
- ✅ **Filtering & search** — Filter by status, priority, category; search by title, ID, or user
- ✅ **Role-based views** — Users see only their own tickets; admins see everything

---

## Getting Started

### Prerequisites

- Node.js v18+ installed
- npm v8+

---

### 1. Clone / download the project

```bash
cd helpdesk
```

---

### 2. Set up the Backend

```bash
cd backend
npm install
npm run dev
```

The server will start on **http://localhost:5000**

On first run it auto-creates the SQLite database and seeds demo data:

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@helpdesk.com     | admin123   |
| User  | user@helpdesk.com      | user123    |

---

### 3. Set up the Frontend

Open a **new terminal tab**:

```bash
cd frontend
npm install
npm start
```

The React app will open at **http://localhost:3000**

---

## Project Structure

```
helpdesk/
├── backend/
│   ├── server.js          # Express app entry point
│   ├── db.js              # SQLite init & seed
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   └── routes/
│       ├── auth.js        # /api/auth/*
│       ├── tickets.js     # /api/tickets/*
│       └── comments.js    # /api/comments/*
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js             # Routes & protected route logic
        ├── App.css            # Global styles
        ├── index.js           # React entry point
        ├── context/
        │   └── AuthContext.js # Global auth state
        ├── components/
        │   └── Layout.js      # Sidebar + nav
        └── pages/
            ├── Login.js
            ├── Register.js
            ├── Dashboard.js       # User home
            ├── TicketList.js      # Filterable ticket list
            ├── TicketDetail.js    # Ticket view + comments
            ├── NewTicket.js       # Submit form
            └── AdminDashboard.js  # Admin panel
```

---

## API Endpoints

### Auth
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/auth/register    | Create account        |
| POST   | /api/auth/login       | Login, returns JWT    |
| GET    | /api/auth/me          | Get current user      |
| GET    | /api/auth/users       | List all users (admin)|

### Tickets
| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | /api/tickets          | List tickets (filtered by role)    |
| GET    | /api/tickets/stats    | Dashboard stats (admin only)       |
| GET    | /api/tickets/:id      | Get single ticket                  |
| POST   | /api/tickets          | Create new ticket                  |
| PATCH  | /api/tickets/:id      | Update ticket fields               |
| DELETE | /api/tickets/:id      | Delete ticket (admin only)         |

### Comments
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/comments/:ticketId   | Get comments for ticket  |
| POST   | /api/comments/:ticketId   | Post new comment         |

---

## Resume / Portfolio Notes

**Concepts demonstrated in this project:**

- RESTful API design with Express
- JWT-based authentication & authorization
- Role-based access control (RBAC)
- Relational database design with SQLite (foreign keys, joins)
- React state management with Context API
- Protected routing in React Router v6
- Full-stack integration (React frontend proxying to Express backend)
- CRUD operations across multiple related resources

---

## Future Improvements (stretch goals)

- Email notifications when ticket status changes
- File attachment uploads
- SLA tracking / ticket aging alerts
- Reporting & export to CSV
- Dark/light mode toggle
- WebSocket real-time updates
