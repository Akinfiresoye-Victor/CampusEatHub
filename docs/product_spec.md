# ByteNBite — Campus Commerce Platform
## Project Specification · MVP · Elizade TechFest Hackathon 2026

---

> **This document is the single source of truth for this project.**
> If it is not in this document, it does not get built. If a decision changes, update this document first, then code.

---

## Quick Reference

| Item | Detail |
|------|--------|
| Event | Elizade TechFest Hackathon 2026 |
| Theme | Byte & Bite: Innovating Campus Commerce |
| Build Window | June 2 – June 5, 2026 (4 days) |
| Grand Prize | ₦60,000 |
| Team | Victor (Django Backend) · [Partner] (React Frontend) |
| Backend Stack | Django + SQLite + Groq API |
| Frontend Stack | React + Axios + React Router |
| AI Provider | Groq API (llama-3.3-70b-versatile model) |

---

## 1. Project Summary

ByteNBite is a campus-scoped e-commerce platform for Elizade University. It solves two real problems students face every day:

1. **You don't know what the cafeteria has available** until you walk there and find out it's finished.
2. **You don't know how your money disappeared** — you can't track what you spent on food.

The platform lets students order food from cafeterias, buy from student vendors, and also sell their own products — all under one account. Cafeterias manage their menus live and receive orders digitally. The school admin (VC) has an overview dashboard to monitor the platform.

Three AI assistants powered by Groq are the platform's competitive edge:
- A **Budget Meal Recommender** for students
- A **Dashboard Assistant** for the admin/VC
- An **Order Analytics Assistant** for cafeterias

This is an MVP. The goal is a clean, working demo that judges can interact with and that solves a real campus problem better than everyone else.

---

## 2. Tech Stack

### Backend (Victor)

| Tool | Purpose |
|------|---------|
| Django | Web framework, handles all routing and business logic |
| SQLite | Database (no PostgreSQL setup needed, SQLite is fast enough for demo) |
| `django-cors-headers` | Allows the React frontend to make requests to Django without browser blocking |
| Groq Python SDK | All AI features |
| Pillow | Image upload and processing |
| `python-dotenv` | Load environment variables from `.env` file |

### Frontend ([Partner])

| Tool | Purpose |
|------|---------|
| React (Vite) | Frontend framework |
| Axios | Makes HTTP requests to the Django API |
| React Router | Handles page navigation without reloading |

### Auth Strategy — Custom Token Auth

Django and React run on different ports (Django: 8000, React: 5173). Django's built-in session auth with CSRF is painful to configure across origins under time pressure. Instead, use a simple custom token approach:

1. When a user logs in, Django generates a random 40-character token and stores it in the database.
2. Django sends this token back in the login response.
3. React stores the token in `localStorage` and attaches it to every request using the `Authorization: Token <token>` header.
4. Every protected Django view checks for this token in the request header, finds the matching user, and proceeds.

This is essentially the same system as Django REST Framework's `TokenAuthentication` but built manually since we are not using DRF.

---

## 3. Team Responsibilities (Hard Boundaries)

This is your first collaboration. Clear ownership prevents the biggest time-waster in team projects: two people touching the same thing and confusing each other.

### Victor — Django Backend

- All Django models (database tables)
- All API endpoint views (functions that receive a request and return JSON)
- Auth logic: register, login, logout, token checking
- Image upload handling and serving
- Groq AI integration (all three AI features)
- CORS and environment configuration
- Seeding the database with demo data before the presentation
- Keeping this spec up to date if any endpoint changes

### [Partner] — React Frontend

- All React pages and components
- All Axios API calls to Django
- Token storage in `localStorage` and attaching it to requests
- UI state: loading indicators, error messages, success feedback
- Page routing and navigation
- Role-aware UI (students see different menus than cafeteria accounts)
- Final visual polish and presentation flow

### Shared Responsibility

- **API contract:** Victor must inform the partner immediately whenever an endpoint URL, request body, or response shape changes. Partner never guesses what the backend returns.
- **Git workflow:** Both use the same repository. Victor works on a `backend` branch or `backend/feature-name` branches. Partner works on `frontend` or `frontend/feature-name` branches. Neither person pushes directly to `main`. Merge to `main` only when something is fully working and tested.
- **Demo accounts:** Victor creates three seeded accounts before the demo. Partner knows the credentials for all three.

---

## 4. User Roles

There are exactly three roles in this platform. The role is set at registration and stored on the user record. It cannot be changed after creation.

### 4.1 Student

A student account is for any Elizade student. It is a dual-purpose account — the same student can both buy from others and sell their own products. There is no separate "vendor" account. A student is a vendor the moment they list a product.

**A student can:**
- Browse all cafeteria menus and see which items are available
- Browse all student vendor products
- Add items to their cart (with a one-seller-per-order restriction — details in Section 7)
- Place orders and choose between pickup or delivery
- Track the status of their orders in real time
- List their own products for other students to buy
- Manage their own product listings (add, update, remove, toggle availability)
- Use the AI Budget Meal Recommender
- View their total spending history and order breakdown

### 4.2 Cafeteria

A cafeteria account is created by the admin or self-registered as a cafeteria during signup. Each cafeteria on campus gets one account. This account type cannot place orders — it only manages and fulfills them.

**A cafeteria can:**
- Manage their full menu (add, update, delete food items)
- Toggle food items between available and unavailable — this is a key feature that solves the "walk to the cafeteria for nothing" problem
- View all incoming orders placed by students for their cafeteria
- Update order status as they work on it (Processing → Ready / Delivered)
- Use the AI Order Analytics Assistant to get insights on their performance

### 4.3 Admin (VC)

The admin account is a single read-only oversight account. It cannot place orders or manage products. Its sole purpose is to give the school's vice chancellor a birds-eye view of what is happening on the platform.

**An admin can:**
- View total users, orders, revenue, and product counts
- See a list of all users on the platform
- Browse all orders on the platform
- Ask the Admin AI Assistant any question about platform activity in plain English

---

## 5. Feature Scope (MVP)

Being deliberate about scope is the difference between finishing on time and not finishing at all. Read both lists carefully.

### What IS in this MVP

- User registration and login (all 3 roles)
- Custom token-based authentication
- Cafeteria menu management: add, edit, delete, toggle availability
- Student vendor product management: add, edit, delete, toggle availability
- Public product browsing (all products, per-cafeteria menu)
- Cart with one-seller restriction per session
- Order placement with pickup or delivery selection
- Delivery fee: added to total when delivery is selected (flat fee, Victor decides the amount)
- Order status tracking for students (Pending → Processing → Ready / Delivered)
- Cafeteria order dashboard with status update controls
- Admin overview dashboard (user count, order count, revenue total)
- Student spending history (total spent, number of orders, per-seller breakdown)
- AI Budget Meal Recommender (Student)
- AI Dashboard Assistant (Admin)
- AI Order Analytics Assistant (Cafeteria)
- Pre-seeded demo data (cafeterias, products, sample orders, demo accounts)

### What is NOT in this MVP

Do not touch any of the following. Write them down if you want, build them after June 5.

| Feature | Reason Excluded |
|---------|----------------|
| Paystack payment integration | Too risky for Day 4. Mock payment only — checkout just places the order, no real payment processing |
| Real-time notifications (WebSockets) | Django JsonResponse is purely request/response. Frontend polls for status updates |
| Email verification on registration | No email server setup time |
| Password reset flow | Same reason |
| Student-to-student messaging | Out of scope |
| Ratings and reviews | Out of scope |
| Search and filtering | Out of scope for MVP. Nice to have |
| Delivery tracking or maps | Out of scope |
| Multiple cafeteria cart | One seller per order, always. This is intentional |
| Student vendor "shop pages" | Vendor products appear in the general product listing with the seller name shown |
| Admin account creation via UI | Admin account is seeded directly by Victor in the database |

---

## 6. Data Models

These are the database tables Victor will build in Django. Every field is listed. `nullable` means the field can be empty.

---

### User (extends Django's AbstractUser)

Django already gives us `username`, `email`, `password`, `date_joined`, and `is_active` for free through `AbstractUser`. We extend it with these extra fields:

| Field | Type | Notes |
|-------|------|-------|
| role | CharField | `student`, `cafeteria`, or `admin` |
| full_name | CharField | Display name shown in the UI |
| matric_number | CharField | Students only — nullable |
| phone | CharField | Optional — nullable |
| profile_image | ImageField | Optional — nullable |

---

### AuthToken

Stores the login token for each user.

| Field | Type | Notes |
|-------|------|-------|
| user | OneToOneField → User | One token per user |
| key | CharField | Random 40-character string generated on login |
| created_at | DateTimeField | |

---

### Product

This single model covers both cafeteria food items and student vendor products. The `seller_type` field tells them apart.

| Field | Type | Notes |
|-------|------|-------|
| seller | ForeignKey → User | The cafeteria or student vendor who listed this |
| name | CharField | |
| price | DecimalField | In Naira, 2 decimal places |
| image | ImageField | Required — no product without a photo |
| is_available | BooleanField | Default: True. Cafeteria and vendors toggle this |
| seller_type | CharField | `cafeteria` or `student_vendor` |
| created_at | DateTimeField | Auto-set on creation |

---

### Cart

One cart per student. The cart persists until the student checks out. After checkout, the cart is cleared.

| Field | Type | Notes |
|-------|------|-------|
| student | OneToOneField → User | One cart per student |
| seller | ForeignKey → User | The seller this cart is locked to. Set when the first item is added |
| updated_at | DateTimeField | Auto-updated on every change |

---

### CartItem

Each product in the cart is a separate CartItem row.

| Field | Type | Notes |
|-------|------|-------|
| cart | ForeignKey → Cart | |
| product | ForeignKey → Product | |
| quantity | PositiveIntegerField | Default: 1 |

---

### Order

Created when a student checks out. One order per checkout.

| Field | Type | Notes |
|-------|------|-------|
| buyer | ForeignKey → User | The student who placed the order |
| seller | ForeignKey → User | The cafeteria or vendor fulfilling the order |
| total_amount | DecimalField | Total including delivery fee, calculated at checkout |
| delivery_type | CharField | `pickup` or `delivery` |
| delivery_fee | DecimalField | 0.00 for pickup, flat fee for delivery |
| status | CharField | `pending`, `processing`, `ready`, `delivered`, `cancelled` |
| created_at | DateTimeField | Auto-set on creation |
| updated_at | DateTimeField | Auto-updated on status change |

---

### OrderItem

Each product in the order gets its own row. Price is stored at the time of ordering because product prices can change later.

| Field | Type | Notes |
|-------|------|-------|
| order | ForeignKey → Order | |
| product | ForeignKey → Product | |
| quantity | PositiveIntegerField | |
| price_at_time | DecimalField | The price of the product at the moment the order was placed. Do not use the current product price for this — prices may change after ordering |

---

## 7. API Endpoints

All endpoints return JSON. All endpoints that require login must receive the `Authorization: Token <token>` header in the request.

**Access key:**
- `PUBLIC` — No login required
- `STUDENT` — Must be logged in as a student
- `CAFETERIA` — Must be logged in as a cafeteria
- `ADMIN` — Must be logged in as admin
- `ANY` — Any logged-in user regardless of role

---

### Auth Endpoints

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| POST | `/api/auth/register/` | PUBLIC | Creates a new account. Accepts: `username`, `password`, `role`, `full_name`, `matric_number` (if student). Returns the token immediately so the user is logged in right after registration |
| POST | `/api/auth/login/` | PUBLIC | Accepts: `username`, `password`. Returns: `token`, `user_id`, `role`, `full_name` |
| POST | `/api/auth/logout/` | ANY | Deletes the user's token from the database, ending their session |
| GET | `/api/auth/me/` | ANY | Returns the current user's profile data based on the token in the header |

---

### Product Browsing (Public)

These endpoints have no auth requirement. Anyone can browse.

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| GET | `/api/products/` | PUBLIC | Returns all available products across the entire platform (cafeterias + student vendors). Only `is_available=True` products appear here |
| GET | `/api/products/<id>/` | PUBLIC | Returns full details of a single product including seller info |
| GET | `/api/cafeterias/` | PUBLIC | Returns a list of all cafeteria accounts with their name and profile image |
| GET | `/api/cafeterias/<id>/menu/` | PUBLIC | Returns all products listed by a specific cafeteria. Includes both available and unavailable items so the student can see what exists but is tagged unavailable today |

---

### Student Vendor — Managing Own Products

These endpoints let a student manage the products they are selling.

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| GET | `/api/vendor/products/` | STUDENT | Returns only the products that the currently logged-in student is selling |
| POST | `/api/vendor/products/` | STUDENT | Creates a new product listing. Accepts: `name`, `price`, `image` |
| PUT | `/api/vendor/products/<id>/` | STUDENT | Fully updates a product. Accepts: `name`, `price`, `image` |
| PATCH | `/api/vendor/products/<id>/toggle/` | STUDENT | Flips `is_available` between True and False |
| DELETE | `/api/vendor/products/<id>/` | STUDENT | Permanently removes the product listing |

---

### Cafeteria — Managing Menu and Orders

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| GET | `/api/cafeteria/menu/` | CAFETERIA | Returns the full menu of the currently logged-in cafeteria (all items, available and unavailable) |
| POST | `/api/cafeteria/menu/` | CAFETERIA | Adds a new food item. Accepts: `name`, `price`, `image` |
| PUT | `/api/cafeteria/menu/<id>/` | CAFETERIA | Fully updates a food item |
| PATCH | `/api/cafeteria/menu/<id>/toggle/` | CAFETERIA | Toggles `is_available`. This is the core availability feature |
| DELETE | `/api/cafeteria/menu/<id>/` | CAFETERIA | Removes a food item from the menu |
| GET | `/api/cafeteria/orders/` | CAFETERIA | Returns all orders placed at this cafeteria, newest first. Filterable by status via query param e.g. `?status=pending` |
| PATCH | `/api/cafeteria/orders/<id>/status/` | CAFETERIA | Updates an order's status. Accepts: `{ "status": "processing" }`. Valid transitions are: `pending → processing`, `processing → ready`, `processing → delivered`, `pending → cancelled` |

---

### Cart

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| GET | `/api/cart/` | STUDENT | Returns the current cart contents including all items, quantities, subtotals, and the locked seller info |
| POST | `/api/cart/add/` | STUDENT | Adds a product to the cart. Accepts: `{ "product_id": 5, "quantity": 2 }`. If the product is from a different seller than what's already in the cart, returns a 400 error |
| PUT | `/api/cart/update/<item_id>/` | STUDENT | Updates the quantity of a specific cart item. Accepts: `{ "quantity": 3 }`. If quantity is set to 0, the item is removed |
| DELETE | `/api/cart/remove/<item_id>/` | STUDENT | Removes one specific item from the cart |
| DELETE | `/api/cart/clear/` | STUDENT | Empties the entire cart and removes the seller lock so the student can start a fresh cart from any seller |

**Cart Seller-Lock Rule (critical):** When a student adds their first product to an empty cart, Django stores that product's seller as the cart's locked seller. Every subsequent add-to-cart call checks: is this product from the same seller as the locked seller? If yes, it is added. If no, Django returns a 400 error with a clear message: `"Your cart already has items from [seller name]. Clear your cart first to order from a different seller."` The frontend must display this message to the student and offer a "Clear Cart" button.

---

### Orders

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| POST | `/api/orders/checkout/` | STUDENT | Converts the cart into an order. Accepts: `{ "delivery_type": "pickup" }` or `{ "delivery_type": "delivery" }`. Calculates total, creates the Order and all OrderItems, clears the cart, returns the new order ID and details |
| GET | `/api/orders/` | STUDENT | Returns all orders the student has ever placed, newest first |
| GET | `/api/orders/<id>/` | STUDENT | Returns full detail of a single order including all items, quantities, prices, and current status |
| GET | `/api/orders/spending/` | STUDENT | Returns the student's spending summary: total amount spent overall, total number of orders, and a breakdown showing how much was spent at each seller |

---

### Admin

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| GET | `/api/admin/overview/` | ADMIN | Returns platform-wide stats: total user count by role, total orders by status, total revenue across all orders, count of active products |
| GET | `/api/admin/users/` | ADMIN | Returns a paginated list of all users. Includes: `id`, `username`, `full_name`, `role`, `date_joined` |
| GET | `/api/admin/orders/` | ADMIN | Returns a paginated list of all orders on the platform, filterable by status via `?status=pending` |

---

### AI Endpoints

| Method | URL | Access | What It Does |
|--------|-----|--------|--------------|
| POST | `/api/ai/meal-recommender/` | STUDENT | Full spec in Section 8.1. Accepts `amount` and optional `cafeteria_id`. Returns an AI-generated meal recommendation |
| POST | `/api/ai/admin-assistant/` | ADMIN | Full spec in Section 8.2. Accepts a plain English `question`. Returns an AI answer grounded in live platform data |
| POST | `/api/ai/cafeteria-assistant/` | CAFETERIA | Full spec in Section 8.3. Accepts a plain English `question`. Returns an AI answer grounded in the cafeteria's order data |

---

## 8. AI Features Specification

These are the competitive differentiators. Build these carefully. Victor owns all three entirely. The React partner only builds the UI inputs and displays the returned text.

---

### 8.1 Student Budget Meal Recommender

**Endpoint:** `POST /api/ai/meal-recommender/`

**Request body:**
```json
{
  "amount": 2000,
  "cafeteria_id": 3
}
```
`cafeteria_id` is optional. If not provided, the AI picks the best cafeteria to recommend from.

**Response:**
```json
{
  "success": true,
  "recommendation": "With ₦2,000 at Mama Nkechi's Kitchen, here is what you can do..."
}
```

**Backend Logic (step by step):**

1. Receive the amount and optional cafeteria ID.
2. Query the database: fetch all products where `is_available=True` and `seller_type='cafeteria'`. If a `cafeteria_id` was provided, filter to only that cafeteria's products.
3. Format the fetched menu as plain text — for example: `"Jollof Rice - ₦800, Fried Rice - ₦700, Egusi Soup - ₦600, Chicken - ₦500, Water - ₦100"`.
4. Build a system prompt and user message that you send to Groq.
5. Return Groq's response text as the `recommendation` field.

**AI Behavior Rules (enforce these in your system prompt):**

- The AI must only recommend food from ONE cafeteria per response. It should never mix items from Mama Nkechi's and the second cafeteria in one meal combo.
- The AI must show the math: "Jollof Rice ₦800 + Chicken ₦500 + Water ₦100 = ₦1,400. You have ₦600 left over."
- If the amount is less than the cheapest available item on the menu, the AI humorously roasts the student. Tone: funny, not cruel. Example direction: "With ₦50? My brother, no food here. Go and check if that garri is still in the hostel."
- If the amount is ₦10,000 or above, the AI must first tell the student to invest the money or reconsider spending it all on food, then proceed to give food combinations anyway.
- The AI should offer 2–3 different combination options if the budget allows, so the student has choices.
- All prices and calculations must come from the actual database data sent as context — the AI must not make up prices.

---

### 8.2 Admin AI Dashboard Assistant

**Endpoint:** `POST /api/ai/admin-assistant/`

**Request body:**
```json
{
  "question": "Which cafeteria has the most orders this week?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the current data, Mama Nkechi's Kitchen leads with 47 orders this week..."
}
```

**Backend Logic (step by step):**

1. Receive the admin's question.
2. Before calling Groq, fetch a fresh snapshot of platform data from the database: total user count broken down by role, total order count broken down by status, total platform revenue (sum of all order `total_amount`), top 3 cafeterias by order count, top 5 most ordered products, orders placed today.
3. Format all of this as a clear context block of plain text.
4. Send this context + the admin's question to Groq. Instruct the AI that it must only answer using the data provided and should not make up any figures.
5. Return the AI's answer as the `answer` field.

**Tone:** Professional, clear, concise. This is for the VC of a university. The AI should sound like a sharp assistant giving a briefing.

---

### 8.3 Cafeteria AI Order Analytics Assistant

**Endpoint:** `POST /api/ai/cafeteria-assistant/`

**Request body:**
```json
{
  "question": "What is selling the most today?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Your best seller today is Jollof Rice with 23 orders, followed by Fried Rice with 15 orders..."
}
```

**Backend Logic (step by step):**

1. Receive the cafeteria's question. Identify which cafeteria is asking using the token.
2. Fetch this cafeteria's order data: all orders for today, total revenue today, item-by-item order counts (what sold and how many times), and count of orders by status (pending, processing, ready, delivered).
3. Format this as a plain text context block.
4. Send the context + the cafeteria's question to Groq. Instruct the AI to use only the provided data.
5. Return the AI's response.

**Why this feature matters:** Cafeteria owners often have no idea which food is driving their revenue or how many outstanding orders they have. This gives them instant intelligence in plain English without needing to read through a table of data.

**Example questions a cafeteria might ask:**
- "How much have I made today?"
- "How many orders are still pending?"
- "What is my slowest-selling item this week?"
- "Give me a summary of today."

---

## 9. Order Lifecycle

This is the complete journey of an order from start to finish. Both Victor and the React partner must understand this flow.

```
Student browses products
        ↓
Student adds item to cart
(Cart locks to that seller — no mixing sellers)
        ↓
Student reviews cart
        ↓
Student hits Checkout
Selects: Pickup or Delivery
        ↓
Backend creates Order [status = "pending"]
Backend creates all OrderItems (price_at_time snapshot)
Cart is cleared (seller lock removed)
        ↓
Cafeteria sees the new order in their dashboard
(Frontend polls /api/cafeteria/orders/ every 30 seconds)
        ↓
Cafeteria accepts and starts working on the order
Backend updates Order [status = "processing"]
        ↓
Cafeteria finishes the order
   IF delivery_type = "pickup"  → Backend updates [status = "ready"]
   IF delivery_type = "delivery" → Backend updates [status = "delivered"]
        ↓
Student checks their orders page and sees the updated status
(Frontend polls /api/orders/ or the student refreshes)
```

**Cancellation rule:** Either the student or cafeteria can cancel an order that is still `pending`. Once the status moves to `processing`, cancellation is no longer allowed. Return a clear error message if cancellation is attempted on a non-pending order.

**Delivery fee rule:** Victor decides on a flat delivery fee (e.g., ₦200). This is defined as a constant in the backend code. When a student selects delivery at checkout, this fee is added to the order total. The fee is stored on the Order record, not calculated again later.

---

## 10. Day-by-Day Build Plan

This schedule is tight. Do not fall behind. If a feature is taking too long, simplify it — do not cut into the next day.

---

### Day 1 — June 2: Foundation

The goal of Day 1 is: both partners can log in and see a basic page. Nothing more.

**Victor (Backend — Day 1)**

- Create Django project, configure settings
- Install and configure `django-cors-headers`
- Build the custom User model (AbstractUser extension with role field)
- Build the AuthToken model
- Build the register endpoint
- Build the login endpoint (generates and returns token)
- Build the logout endpoint (deletes token)
- Build the `/api/auth/me/` endpoint
- Configure MEDIA_ROOT for image uploads
- Write a middleware or helper function that extracts the user from the Authorization header — this will be reused in every protected view
- Create the `.env` file and add it to `.gitignore`

**[Partner] (Frontend — Day 1)**

- Set up React project (Vite)
- Set up React Router with placeholder pages for all roles
- Build the Register page (choose role, enter details, submit)
- Build the Login page
- Store returned token in `localStorage` on successful login
- Build a utility function that attaches the token to every Axios request
- Build basic navigation bar that shows different links based on role
- Handle the case where a user is not logged in (redirect to login page)

**End of Day 1 target:** A student, cafeteria, and admin can all register and log in. After login they land on a simple dashboard page showing their name and role.

---

### Day 2 — June 3: Core Commerce

The goal of Day 2 is: a student can browse, add to cart, and place an order. A cafeteria can update that order's status.

**Victor (Backend — Day 2)**

- Build the Product model
- Build all public product browsing endpoints (`/api/products/`, `/api/products/<id>/`, `/api/cafeterias/`, `/api/cafeterias/<id>/menu/`)
- Build all cafeteria menu management endpoints
- Build all student vendor product management endpoints
- Build the Cart and CartItem models
- Build all cart endpoints including the seller-lock validation logic
- Build the Order and OrderItem models
- Build the checkout endpoint (converts cart to order, clears cart)
- Build the cafeteria order dashboard endpoint
- Build the order status update endpoint
- Build the student order history endpoint
- Build the student spending summary endpoint

**[Partner] (Frontend — Day 2)**

- Build the main product listing page (shows all products)
- Build the cafeteria menu page (one cafeteria's items, shows availability)
- Build the cart (sidebar or dedicated page) with item counts, subtotal, and clear cart
- Build the checkout page with pickup/delivery selection and order total display
- Build the student orders page showing each order and its current status
- Build the cafeteria dashboard page showing incoming orders with status update buttons
- Build the cafeteria menu management page (add/edit/delete items, toggle availability)
- Build the student vendor product management page (same as cafeteria menu page but for vendors)

**End of Day 2 target:** Full shopping flow works. A student browses → adds to cart → checks out → sees the order. A cafeteria sees the order and marks it as processing, then ready.

---

### Day 3 — June 4: AI + Admin

The goal of Day 3 is: all three AI features work. The admin dashboard shows real data.

**Victor (Backend — Day 3)**

- Install and configure the Groq Python SDK
- Set `GROQ_API_KEY` in the `.env` file
- Build the Student Budget Meal Recommender endpoint (full prompt engineering and DB context injection)
- Build the Admin AI Dashboard Assistant endpoint
- Build the Cafeteria AI Order Analytics Assistant endpoint
- Build the admin overview endpoint
- Build the admin users list endpoint
- Build the admin orders list endpoint
- Begin database seeding: create demo cafeteria accounts, add food items with prices, create a student account, place a few sample orders manually

**[Partner] (Frontend — Day 3)**

- Build the AI Meal Recommender page: amount input field, optional cafeteria dropdown, a "Get Recommendations" button, loading state while the AI processes, and the response displayed in a styled card
- Build the Admin dashboard page: stats overview cards (user counts, order counts, revenue total) + an AI chat input at the bottom where the VC types a question and sees the answer
- Build the Cafeteria AI assistant section: a simple text input on the cafeteria dashboard where the cafeteria types a question and sees the AI response
- Build the student spending history page: total spent, order count, breakdown by seller
- Review and polish existing pages for usability

**End of Day 3 target:** All three AI features respond correctly. Admin dashboard shows live numbers. All major pages are functional.

---

### Day 4 — June 5: Polish + Demo Prep

The goal of Day 4 is: the demo is clean, the database has good data, and you both know the demo flow by heart.

**Victor (Backend — Day 4)**

- Finish database seeding: at minimum 2 cafeteria accounts, 10+ food items across the cafeterias, 3+ student accounts, 5+ completed orders with different statuses, 1 admin account
- Fix any integration bugs that the partner discovers
- Confirm all endpoints return the correct data shapes
- Confirm image uploads and serving work correctly
- Bonus if time allows: Paystack integration for checkout (only attempt this if everything else is done and working)

**[Partner] (Frontend — Day 4)**

- Final UI polish: consistent fonts, colors, spacing
- Mobile-responsive layout (judges will likely check on a phone)
- All error states handled: show a clear message when an API call fails, when the cart is empty, when there are no orders yet
- Loading indicators on all pages that fetch data
- Rehearse the demo flow at least twice with Victor
- Know exactly which demo account to use for each role and what to click in what order

**End of Day 4 target:** Clean, working demo. You can hand a judge the student account and they can complete a full order themselves without you guiding them.

---

## 11. Collaboration Rules

These are not suggestions.

1. **One repository.** Victor creates it, adds the partner as a collaborator on Day 1.

2. **Never push directly to `main`.** Always use branches. Merge to `main` only when a feature is complete and tested.

3. **The API contract is sacred.** Victor communicates every endpoint URL, method, request body format, and response format to the partner in writing (a message is fine). The partner never guesses.

4. **No scope creep during the build.** If either person has a new idea, write it in a "Nice to Have" list. It does not get built until every item in Section 5 is done.

5. **The AI features are non-negotiable.** They are the primary differentiator. Both people protect time for them. If the core commerce features are delayed, simplify them — do not sacrifice the AI features.

6. **Daily sync at the end of every day.** Sit together for 15 minutes. What is done? What is blocked? What is the plan for tomorrow? Do not skip this.

7. **Victor seeds the demo data.** The React partner should not have to worry about having an empty database during the demo. Victor handles this.

8. **If you are stuck for more than 30 minutes on one thing, stop.** Ask your partner, search online, simplify, or skip it and move on. Hackathons are won by shipping, not by solving the perfect bug.

9. **Agree on demo accounts on Day 3.** Both people must know the login credentials for the demo student, demo cafeteria, and demo admin before Day 4 begins.

10. **The demo is a story.** Practice telling it as: "A student wonders what to eat. They check the cafeteria menu — Mama Nkechi's has Jollof Rice available today. They ask the AI what they can eat with ₦1,500. The AI recommends a combo. They order it. The cafeteria gets the order and marks it as processing. The student sees the update in real time." That story should run without friction.

---

## 12. Naming Conventions

Consistent naming means both people can read each other's code or endpoint names without confusion.

### Backend (Victor)

- Model names: PascalCase — `AuthToken`, `CartItem`, `OrderItem`
- View functions: snake_case — `def product_list(request)`, `def checkout(request)`
- URL endpoint names: snake_case in the `name=` param — `name='product_list'`
- Python files: snake_case — `views.py`, `cart_helpers.py`

### Frontend ([Partner])

- Component files: PascalCase — `CartPage.jsx`, `MealRecommender.jsx`, `CafeteriaOrders.jsx`
- Variables and functions: camelCase — `cartItems`, `handleCheckout`, `fetchOrders`
- API call files: grouped by feature in camelCase — `authApi.js`, `cartApi.js`, `aiApi.js`, `ordersApi.js`

### Shared — Status Values Must Match Exactly

Both the backend and frontend must use these exact string values. No variation, no capitalization differences.

| Field | Allowed Values |
|-------|----------------|
| `role` | `"student"`, `"cafeteria"`, `"admin"` |
| `seller_type` | `"cafeteria"`, `"student_vendor"` |
| `order.status` | `"pending"`, `"processing"`, `"ready"`, `"delivered"`, `"cancelled"` |
| `delivery_type` | `"pickup"`, `"delivery"` |

---

## 13. Standard Response Format

Every Django view must return JSON in one of these two shapes. The frontend must handle both.

**Success:**
```json
{
  "success": true,
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "error": "A human-readable explanation of what went wrong"
}
```

Use standard HTTP status codes on top of this:

| Code | When to Use |
|------|-------------|
| 200 | Successful GET, successful PATCH or DELETE |
| 201 | Successful POST that created something new |
| 400 | Bad request — missing fields, cart seller conflict, invalid data |
| 401 | No token provided or token is invalid |
| 403 | Valid token but wrong role (e.g., student trying to access cafeteria endpoint) |
| 404 | Resource not found |
| 500 | Something broke on the server — should not happen in demo |

---

## 14. Environment Variables

Victor manages all secrets. The partner does not need the Groq key. Never commit the `.env` file to git.

Create a file named `.env` in the Django project root directory on Day 1:

```
DJANGO_SECRET_KEY=generate_a_long_random_string_here
GROQ_API_KEY=your_groq_api_key_from_console.groq.com
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
MEDIA_URL=/media/
DELIVERY_FEE=200
```

Add `.env` to `.gitignore` before the first `git commit`. Use `python-dotenv` to load these values in `settings.py`.

---

## 15. Demo Script (Rehearse This)

This is the exact sequence to run during the judging presentation. Do not improvise. Know it cold.

1. Open the browser. Navigate to the app.
2. Log in as the **demo student** account.
3. Go to the Cafeteria page. Show that Mama Nkechi's has food listed with availability tags.
4. Navigate to the **AI Meal Recommender**. Type in ₦1,500. Hit submit. Show the AI response with food combos and math.
5. Go back to the cafeteria page. Add one item to cart.
6. Attempt to add an item from a different cafeteria. Show the seller-lock error message.
7. Go to the cart. Proceed to checkout. Select pickup. Place the order.
8. Log out.
9. Log in as the **demo cafeteria** account (Mama Nkechi's).
10. Show the cafeteria dashboard — the new order appears as pending.
11. Click "Start Processing". Status updates.
12. Ask the Cafeteria AI: "What is my best selling item today?" Show the response.
13. Log out.
14. Log in as the **demo admin** account.
15. Show the overview stats dashboard.
16. Ask the Admin AI: "Give me a summary of today's activity." Show the response.
17. Done.

Total demo time target: under 5 minutes. Practice until you can do it smoothly in 4 minutes.

---

*ByteNBite Project Specification v1.0 — Elizade TechFest Hackathon 2026*
*Last updated: June 2, 2026*