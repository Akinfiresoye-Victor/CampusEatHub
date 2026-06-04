# CampusConnect

CampusConnect is a campus marketplace built with Django on the backend and React/Vite on the frontend. It supports two user roles (`student` and `cafeteria`), provides student vendor workflows, cafeteria menu management, cart and checkout flows, and dashboard-style analytics.

Repository: https://github.com/Akinfiresoye-Victor/CampusEatHub

## Quick start (5 minutes)

If you've already installed Python and Node.js:

```bash
# 1. Navigate to project folder and activate Python env
env\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt
cd frontend/my-app
npm install

# 3. Set up database
python backend/manage.py migrate

# 4. Open two terminals and run:
# Terminal 1:
python backend/manage.py runserver

# Terminal 2:
cd frontend/my-app
npm run dev
```

Then open `http://localhost:5173` in your browser.

**Don't have Python or Node.js?** See the detailed setup section below.

## What this app does

- Registers and authenticates users as `student` or `cafeteria` via session-based auth
- Lets students browse marketplace products, manage a cart, checkout, and review orders
- Lets student vendors and cafeterias manage their own menus and order queues
- Provides cafeteria stats and top-selling item endpoints for dashboard use
- Uses Django admin for backend management and a custom user model for role control
- Connects the React frontend on `localhost:5173` with the Django API on `localhost:8000`

## Stack

- Backend: Django 6.0, SQLite, custom `members.User` model, session auth, CORS
- Frontend: React 19, Vite, React Router, Axios, Zustand
- Dev tooling: ESLint, Vite, Django admin site

## Project structure

- `backend/` — Django project
  - `megabite/` — project settings, URL routing, CORS and auth configuration
  - `members/` — login, logout, student/cafeteria registration, `me` profile endpoint
  - `student/` — student shopping, cart management, checkout, student vendor products and orders, budget AI helper
  - `cafeteria/` — cafeteria menu management, order handling, status, stats, AI assistant endpoint
  - `shop/` — public catalog endpoints, cafeteria lookup, shared marketplace utilities
  - `admin_panel/` — admin-specific APIs and data access
- `frontend/my-app/` — React/Vite frontend code
- `env/` — local Python virtual environment
- `backend/db.sqlite3` — development database
- `docs/` — supporting project notes and design references

## Key backend routes

Base API prefix: `/api/`

- `api/auth/login_user/` — POST, user login via username or email
- `api/auth/logout_user/` — POST, log out current session
- `api/auth/register_student/` — POST, create a student account
- `api/auth/register_cafeteria/` — POST, create a cafeteria account
- `api/auth/me/` — GET, return current user profile and role-specific metadata

- `api/student/products/` — GET, list products available to students
- `api/student/cart/` — GET/POST/PATCH/DELETE, manage student cart items
- `api/student/orders/checkout/` — POST, place an order from cart
- `api/student/orders/` — GET, list student orders
- `api/student/orders/<order_id>/` — GET, student order detail
- `api/student/orders/spending/` — GET, student spending summary
- `api/student/vendor/menu/` — GET, student vendor product list
- `api/student/vendor/menu/<product_id>/` — GET/PUT/DELETE, manage student vendor product
- `api/student/vendor/orders/` — GET, student vendor order list
- `api/student/vendor/orders/<order_id>/status/` — PUT/PATCH, update student vendor order status
- `api/student/ai/meal_recommender/` — POST, AI-based meal budget recommendation

- `api/cafeteria/menu/` — GET/POST, cafeteria menu list and new product creation
- `api/cafeteria/menu/<product_id>/` — GET/PUT/DELETE, manage cafeteria product
- `api/cafeteria/menu/<product_id>/toggle/` — PUT/PATCH, toggle cafeteria menu item availability
- `api/cafeteria/status/` — GET, cafeteria status summary
- `api/cafeteria/orders/` — GET, cafeteria order list
- `api/cafeteria/orders/<order_id>/status/` — PUT/PATCH, update cafeteria order status
- `api/cafeteria/stats/` — GET, cafeteria dashboard stats
- `api/cafeteria/top-items/` — GET, top-selling items
- `api/cafeteria/ai/assistant/` — POST, cafeteria analytics helper

- `api/products/` — GET, public product catalog
- `api/products/<product_id>/` — GET, product details
- `api/cafeterias/` — GET, list registered cafeterias
- `api/cafeterias/<caf_id>/menu/` — GET, cafeteria menu details

## How to run locally

### Prerequisites

Before you start, make sure you have Python and Node.js installed on your machine.

**Check if Python is installed:**
- Open your terminal/command prompt
- Run: `python --version`
- If you see a version like `3.9.0` or higher, you're good. If not, download and install Python from https://www.python.org/downloads/
- **Important:** During installation, check the box that says "Add Python to PATH"

**Check if Node.js is installed:**
- Open your terminal/command prompt
- Run: `node --version` and `npm --version`
- If you see version numbers, you're good. If not, download and install Node.js from https://nodejs.org/
- Node.js comes with `npm` (Node Package Manager), so you'll get both

### Step-by-step setup

1. **Clone the repository or navigate to the project folder:**
   ```
   cd c:\Users\ZENOID\Desktop\Home\home\self_made.project\MegaByte2
   ```

2. **Create a Python virtual environment (first time only):**
   ```
   python -m venv env
   ```
   This creates a folder called `env` that isolates Python packages for this project.

3. **Activate the virtual environment:**
   - **Windows:**
     ```
     env\Scripts\activate
     ```
   - **macOS/Linux:**
     ```
     source env/bin/activate
     ```
   - You should see `(env)` at the start of your terminal line — that means it's active.

4. **Install Python backend dependencies:**
   ```
   pip install -r backend/requirements.txt
   ```
   This downloads and installs all the Python packages the backend needs (Django, Pillow, Groq, etc.). It may take a minute or two.

5. **Apply database migrations:**
   ```
   python backend/manage.py migrate
   ```
   This sets up the database tables in `backend/db.sqlite3`. You only need to do this once, or after new migrations are created.

6. **Install frontend dependencies:**
   ```
   cd frontend/my-app
   npm install
   ```
   This downloads React, Vite, and other JavaScript packages. It may take a couple of minutes.

### Running the app

You'll need **two terminal windows** — one for the backend and one for the frontend.

**Terminal 1 — Django backend:**
```
cd c:\Users\ZENOID\Desktop\Home\home\self_made.project\MegaByte2
env\Scripts\activate
python backend/manage.py runserver
```
You should see: `Starting development server at http://127.0.0.1:8000/`

**Terminal 2 — React frontend:**
```
cd c:\Users\ZENOID\Desktop\Home\home\self_made.project\MegaByte2\frontend\my-app
npm run dev
```
You should see: `VITE v8.x.x ready in xxx ms` and a local URL like `http://localhost:5173`

Open your browser and go to `http://localhost:5173` to use the app.

### Troubleshooting

- **`python: command not found`** — Python isn't in your PATH. Reinstall Python and check "Add Python to PATH" during setup.
- **`npm: command not found`** — Node.js isn't in your PATH. Reinstall Node.js.
- **`ModuleNotFoundError` when running backend** — Did you run `pip install -r backend/requirements.txt`? Try running it again.
- **Port 8000 already in use** — Another app is using that port. Run `python backend/manage.py runserver 8001` instead.
- **Port 5173 already in use** — Run `npm run dev -- --port 5174` instead.

## Development notes

- The backend uses session authentication and allows CORS from `http://localhost:5173`
- CSRF cookies are configured for local dev; the frontend automatically handles this when you use Axios
- `DEBUG = True` in `backend/megabite/settings.py`; change this before deploying to production
- The local database is stored at `backend/db.sqlite3`; it's safe to delete and re-run migrations to start fresh
- If you want to access the Django admin panel, create a superuser:
  ```
  python backend/manage.py createsuperuser
  ```
  Then go to `http://localhost:8000/admin/` and log in

## First time after setup

1. **Create test accounts:**
   - Go to `http://localhost:5173` and register as a **Student**
   - Register as a **Cafeteria** user
   - Log in and explore the different features for each role

2. **Optional — add test data via Django admin:**
   - Run `python backend/manage.py createsuperuser` to create an admin account
   - Go to `http://localhost:8000/admin/`
   - Log in and add test products, cafeterias, and orders

## Deactivating the virtual environment

When you're done working, type `deactivate` in your terminal to exit the virtual environment.

## What to update next before production

- Replace local secret key and turn off debug in production settings
- Add production database configuration (PostgreSQL recommended)
- Enable secure cookie settings and HTTPS
- Add explicit frontend docs for cookie-based auth and CSRF handling
- Harden API error handling and input validation for public deployment
- Set up environment variables for sensitive data (API keys, secret key, etc.)
