# TaskFlow Pro — Full-Stack Modern Task Management & Productivity Dashboard

A modern, responsive, and full-stack Task Management web application built with **Node.js, Express.js, MongoDB, Mongoose, and Vanilla JavaScript (HTML5 & CSS3)**.

---

## ✨ Key Features

1. **Productivity Dashboard**:
   - Live metrics calculated dynamically from MongoDB: Total Tasks, Completed, In-Progress, To Do, Overdue, Due Today, and Completion Rate.
   - Interactive Chart.js visualizations: 7-day completion velocity curve and status distribution doughnut.
   - Real-time "Due Today & Urgent" and "Recent Activity" widgets.

2. **Complete CRUD Task Operations**:
   - **Create**: Add new tasks with title, description, category, priority, status, and due dates.
   - **Read**: Search, filter, and sort tasks with smooth pagination and details preview modal.
   - **Update**: Edit all task metadata and toggle completion directly from checkboxes or modal dialogs.
   - **Delete**: Remove tasks with confirmation dialogs and instant UI synchronization.

3. **Multi-Column Kanban Board**:
   - Native HTML5 Drag-and-Drop functionality across **To Do**, **In Progress**, and **Completed** columns.
   - Automatically synchronizes stage changes to MongoDB in real-time.

4. **Interactive Calendar View**:
   - Monthly calendar grid rendering task deadlines as color-coded priority badges.
   - Quick navigation between months and single-click task details preview.

5. **Deep Search, Filter & Sort**:
   - Instant search by title or description.
   - Filters for status (`To Do`, `In Progress`, `Completed`), priority (`High`, `Medium`, `Low`), category (`Work`, `College`, `Projects`, `Personal`), and due dates (`Today`, `This Week`, `Upcoming`, `Overdue`).
   - Sorting by newest, oldest, due date, and priority.

6. **Design & Theming**:
   - Fully custom Vanilla CSS design system with smooth dark/light mode toggle.
   - Glassmorphic card styling, micro-animations, and mobile-responsive drawer navigation.
   - Toast notifications for real-time operation feedback.

7. **User Authentication (JWT)**:
   - Secure account registration and login with bcrypt password hashing and JSON Web Tokens.
   - Scoped task isolation per user, plus offline/guest workspace mode.

---

## 📁 Project Structure

```text
task-manager/
├── config/
│   └── db.js                 # MongoDB connection & in-memory dev fallback
├── controllers/
│   ├── authController.js     # User registration, login, and profile logic
│   └── taskController.js     # Task CRUD and dashboard statistics engine
├── middleware/
│   └── authMiddleware.js     # JWT verification and route protection
├── models/
│   ├── Task.js               # Mongoose schema for tasks
│   └── User.js               # Mongoose schema for users
├── public/
│   ├── index.html            # Main Single Page Application structure
│   ├── css/
│   │   └── style.css         # Modern responsive CSS design system
│   └── js/
│       ├── api.js            # REST API client wrapper
│       └── app.js            # Frontend router, state, Kanban & Calendar logic
├── routes/
│   ├── authRoutes.js         # /api/auth routes
│   └── taskRoutes.js         # /api/tasks & /api/stats routes
├── scripts/
│   └── seed.js               # Sample task dataset populator
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── server.js                 # Express server entry point
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance running at `mongodb://127.0.0.1:27017` or a cloud [MongoDB Atlas](https://www.mongodb.com/atlas) connection string)

---

### 2. Installation

1. Clone or open the repository folder in VS Code:
   ```bash
   cd "task manager"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

### 3. Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
```

> **Note**: If your local MongoDB service is not currently active, the development server will automatically initialize a temporary in-memory database so you can test immediately without setup errors!

---

### 4. Seed Sample Data (Optional)

To populate the database with realistic sample tasks:
```bash
npm run seed
```

---

### 5. Running the Application

- **Start Development Server (with auto-restart)**:
  ```bash
  npm run dev
  ```

- **Start Standard Production Server**:
  ```bash
  npm start
  ```

Once started, open your browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer Token) |
| `GET` | `/api/stats` | Fetch computed dashboard statistics | Optional |
| `GET` | `/api/tasks` | Get all tasks (supports query filters) | Optional |
| `GET` | `/api/tasks/:id` | Get single task details | Optional |
| `POST` | `/api/tasks` | Create a new task | Optional |
| `PUT` | `/api/tasks/:id` | Update an existing task or status | Optional |
| `DELETE`| `/api/tasks/:id` | Delete a task permanently | Optional |

---

## 🛠️ Testing the Application

1. **Dashboard Overview**: Verify summary counter cards, the 7-day velocity chart, and status doughnut chart.
2. **Create Task**: Click the **"+ New Task"** button, fill in the form with a category, priority, status, and due date, and submit.
3. **Filter & Sort**: Head over to **"All Tasks"** to test live search, dropdown filters, and sorting.
4. **Kanban Drag and Drop**: Go to **"Kanban Board"** and drag any task card to another column (e.g. from *To Do* to *In Progress*). Refresh the page to verify persistence in MongoDB.
5. **Calendar View**: Check the **"Calendar"** tab to see your tasks positioned on their due dates.
6. **Theme Switcher**: Click the sun/moon icon in the top navigation bar to toggle between Dark Mode and Light Mode.
