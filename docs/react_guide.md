# ByteNBite — React Frontend Developer Guide
### Elizade TechFest Hackathon 2026 · Frontend Build Reference (Updated)

> Updated to match the backend's 5-app structure and session-based authentication.
> URLs, auth setup, and API file structure have all changed from the original guide.

---

## How to Use This Guide

Work through it top to bottom, day by day. Each section tells you:
- **What to build** — the specific page, component, or utility you're making
- **What it needs to know / do** — the logic and UX rules to have in your head before you start
- **Watch out for** — common traps that will waste your time if you hit them

Do not skip ahead. Day 2's work depends on Day 1 being solid.

---

## Your Relationship With the Backend

You never touch the database. You never calculate totals or decide what's allowed. The Django backend does all of that. Your job is to:

1. Send the right request — right URL, right method, right data shape, cookies attached.
2. Handle whatever comes back — success or error — and show it to the user clearly.
3. Never guess what the backend returns. Ask Victor whenever you are unsure of the response shape.

Every response from the backend follows one of two shapes:

**Success:** `{ "success": true, "data": { ... } }`
**Error:** `{ "success": false, "error": "Human readable message" }`

Always check `response.data.success` before trying to use `response.data.data`. If `success` is false, show `response.data.error` to the user.

---

## The URL Structure — Read This Before Anything Else

The backend is split across 5 Django apps. Each app has its own URL prefix. You must use the correct prefix for every endpoint — mixing them up will give you 404 errors that are confusing to debug.

| What you're doing | URL prefix |
|-------------------|------------|
| Register, login, logout, profile | `/api/auth/` |
| Public product browsing, cafeteria menus | `/api/products/` and `/api/cafeterias/` |
| Student cart, orders, vendor products, AI recommender | `/api/student/` |
| Cafeteria menu management, order management, AI assistant | `/api/cafeteria/` |
| Admin overview, user list, order list, AI assistant | `/api/admin/` |

Keep this table open while building. Every API call you write maps to one of these prefixes.

---

## Session Auth — How It Works and What You Must Do

The backend uses Django's built-in session authentication instead of tokens. This changes how every request you make works. Read this carefully — getting this wrong means nothing will work.

**How session auth works:**
- When a user logs in, Django creates a session record in its database and sends back a cookie called `sessionid`. This cookie is stored in the browser automatically.
- Every request the browser makes to Django automatically includes this cookie. Django reads it, finds the session, and knows who the user is.
- For non-GET requests (POST, PUT, PATCH, DELETE), Django also requires a **CSRF token** — a security value that proves the request is coming from your app and not from a malicious third-party site. The backend sends this as a cookie called `csrftoken`. You must read it and send it back as a request header called `X-CSRFToken` on every non-GET request.

**What you must do in Axios:**

There are two settings you absolutely must have on your Axios instance:

1. `withCredentials: true` — This tells the browser to include cookies (the `sessionid` and `csrftoken` cookies) on every cross-origin request. Without this, the browser strips the cookies and Django sees an anonymous user on every request.

2. Before every non-GET request, read the `csrftoken` cookie and attach it as the `X-CSRFToken` header. Django will reject every POST, PUT, PATCH, and DELETE request without this header — it returns a 403 Forbidden.

**How to read the csrftoken cookie:**
The `csrftoken` cookie is set by Django after the first request. You read it by parsing `document.cookie`. Write a small helper function that splits `document.cookie` by semicolons, finds the entry that starts with `csrftoken=`, and returns the value after the `=`. Put this helper in `src/utils/csrf.js` and use it in your Axios interceptor.

**What this replaces from the original guide:**
- There is no token stored in `localStorage`.
- There is no `Authorization: Token <value>` header.
- There is no token-based 401 response interceptor that clears `localStorage`.
- The session cookie handles all of this automatically — the browser manages it. Your only job is `withCredentials: true` and the CSRF header.

---

---

# DAY 1 — Foundation
**Goal: Register and login work. Session cookie is set. Authenticated requests work. Role-based routing works.**

---

## Step 1 — Project Setup

**What to build:** A new React project using Vite with the core dependencies installed.

**What it needs:**
- Create the project with Vite for a faster dev server.
- Install your two core dependencies: `axios` and `react-router-dom`.
- Delete all Vite boilerplate — default CSS, counter component, Vite logo. Start clean.
- Set up your folder structure before writing any component:
  - `src/pages/` — full page components (one per route)
  - `src/components/` — reusable pieces used across pages (navbar, cards, modals)
  - `src/api/` — all Axios calls, grouped by feature
  - `src/context/` — React context for auth state
  - `src/utils/` — small helper functions (CSRF reader, Naira formatter, etc.)

**Watch out for:**
- Django runs on port 8000. React runs on port 5173. Always use the full URL in your `baseURL`: `http://localhost:8000`. Never use just `/api/` — that would be a relative URL pointing at port 5173 where Django isn't running.

---

## Step 2 — Axios Setup (Central API Utility)

**What to build:** A configured Axios instance that handles session cookies and CSRF automatically for every request.

**What it needs:**
- Create `src/api/axiosInstance.js`.
- Set `baseURL` to `http://localhost:8000`.
- Set `withCredentials: true` at the instance level. This must be on the instance, not on individual requests — if you forget it on even one request, that request will fail auth.
- Add a **request interceptor** that runs before every request goes out. In this interceptor:
  - Check if the request method is anything other than GET (i.e., POST, PUT, PATCH, DELETE).
  - If yes, call your CSRF helper function to read the `csrftoken` cookie.
  - Add it to the request headers as `X-CSRFToken: <value>`.
  - If the method is GET, do nothing — GET requests don't need the CSRF token.
- Add a **response interceptor** that runs after every response comes back. If the response status is 401, the user's session has expired or they're not logged in — redirect them to the login page. Use `window.location.href = '/login'` for simplicity.

**Why this matters:** Every API call you make through this instance automatically sends the session cookie and the CSRF token. You set this up once and never think about it again for individual calls.

**Watch out for:**
- Always import and use this configured instance throughout your app — never import Axios directly. If you import raw Axios somewhere, `withCredentials` won't be set and that request will fail auth silently.
- The `csrftoken` cookie is only available after the first response from Django. If you try to read it before any request has been made, it won't exist yet. In practice this isn't a problem because the user makes a GET request (like loading the login page) before any POST request (like submitting the login form).

---

## Step 3 — CSRF Helper Utility

**What to build:** A small utility function that reads the `csrftoken` cookie.

**What it needs:**
- Create `src/utils/csrf.js`.
- Write a function called `getCsrfToken` that reads `document.cookie`, splits it into individual cookies, finds the one named `csrftoken`, and returns its value.
- If the cookie doesn't exist yet, return an empty string — don't crash.
- This function is called inside the Axios request interceptor (Step 2) before every non-GET request.

**Why it's a separate file:** The interceptor is already doing several things. Keeping the cookie-reading logic in its own utility keeps the code readable. Also, if you ever need the CSRF token somewhere else, it's already extracted into a reusable function.

---

## Step 4 — API Call Files

**What to build:** Separate files in `src/api/` for each feature area. Create all of them on Day 1 even if most are empty — filling them out is Day 2 and 3 work.

**The files and what they map to:**

| File | Endpoints it covers |
|------|---------------------|
| `authApi.js` | `/api/auth/register/`, `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/` |
| `productsApi.js` | `/api/products/`, `/api/products/<id>/`, `/api/cafeterias/`, `/api/cafeterias/<id>/menu/` |
| `cartApi.js` | `/api/student/cart/`, `/api/student/cart/add/`, `/api/student/cart/update/<id>/`, `/api/student/cart/remove/<id>/`, `/api/student/cart/clear/` |
| `ordersApi.js` | `/api/student/orders/checkout/`, `/api/student/orders/`, `/api/student/orders/<id>/`, `/api/student/orders/spending/` |
| `vendorApi.js` | `/api/student/vendor/` and sub-endpoints |
| `cafeteriaApi.js` | `/api/cafeteria/menu/`, `/api/cafeteria/orders/`, and sub-endpoints |
| `adminApi.js` | `/api/admin/overview/`, `/api/admin/users/`, `/api/admin/orders/` |
| `aiApi.js` | `/api/student/ai/meal-recommender/`, `/api/cafeteria/ai/assistant/`, `/api/admin/ai/assistant/` |

Each function uses the `axiosInstance`, calls one endpoint, and returns the full Axios response. The component that calls it decides what to do with the data.

**Why separate files:** When Victor changes an endpoint URL, you update it in one place. The 10 components calling that function don't need to change.

---

## Step 5 — Auth Context

**What to build:** A React context that holds the current user's session state and shares it across every component.

**What it needs:**
- Create `src/context/AuthContext.jsx`.
- The context holds: `user` (the user object — `id`, `username`, `role`, `full_name`) and `isLoading` (whether the app is still verifying the session on startup).
- Note: there is no `token` in the context. The session cookie is managed by the browser, not by your JavaScript. You don't store or read the session ID — Django handles that transparently.
- Provide these functions through the context:
  - `login(userData)` — receives the user object returned by the login endpoint and sets it in state. No localStorage involved.
  - `logout()` — calls the logout API endpoint (Django destroys the session server-side), then clears the user from state and redirects to `/login`.
  - `isAuthenticated()` — returns true if `user` is not null.
- **On app startup** (a `useEffect` that runs once when the context mounts): call GET `/api/auth/me/`. This endpoint uses the `sessionid` cookie to identify the user. If the session is still valid, it returns the user's data — set it in state. If it returns 401, the session is gone — leave `user` as null. Either way, set `isLoading` to false when done.
- This startup check is how the app remembers a logged-in user after a page refresh. The session cookie persists in the browser — you just confirm it's still valid by calling `me`.
- Wrap your entire app in `AuthContext.Provider`.

**Watch out for:**
- While the `me` check is running on startup, set `isLoading` to true and don't render any routes yet. If you skip this, your `ProtectedRoute` will see `user = null` for a split second and redirect to login — even for a fully logged-in user. The `isLoading` flag is what prevents this flash.

---

## Step 6 — React Router Setup

**What to build:** All your routes defined in one place, with role-based protection.

**What it needs:**
- Define all routes in `src/App.jsx` using React Router v6's `<Routes>` and `<Route>`.
- Create a `ProtectedRoute` wrapper component. It checks the auth context. If `isLoading` is true, show a spinner — don't redirect yet. If the user is not logged in, redirect to `/login`. If a required role is provided and the user's role doesn't match, redirect to their correct dashboard. If everything is fine, render the child page.
- Define placeholder routes for every page on Day 1, even if each just shows the page name. This lets you and Victor test navigation early without broken routes.

**Routes you'll need:**

Public: `/login`, `/register`

Student: `/student/dashboard`, `/student/products`, `/student/cafeterias`, `/student/cafeteria/:id`, `/student/cart`, `/student/checkout`, `/student/orders`, `/student/orders/:id`, `/student/spending`, `/student/vendor`, `/student/ai-recommender`

Cafeteria: `/cafeteria/dashboard`, `/cafeteria/menu`, `/cafeteria/orders`, `/cafeteria/ai-assistant`

Admin: `/admin/dashboard`, `/admin/users`, `/admin/orders`, `/admin/ai-assistant`

- After a successful login, redirect the user to the correct dashboard based on their role. A student goes to `/student/dashboard`. A cafeteria goes to `/cafeteria/dashboard`. An admin goes to `/admin/dashboard`.

**Watch out for:**
- React Router v6 uses `<Navigate>` instead of `<Redirect>` — the old v5 component no longer exists.
- The `ProtectedRoute` must check `isLoading` first, before checking `isAuthenticated`. If you check auth before loading finishes, you'll always get a false negative on page refresh.

---

## Step 7 — Navigation Bar

**What to build:** A navbar that adapts to who is logged in.

**What it needs:**
- Read the `user` from auth context.
- If no user: show Login and Register links only.
- If `user.role === 'student'`: show Browse Products, Cafeterias, Cart (with item count badge), My Orders, Spending History, My Shop (vendor products), AI Meal Recommender, and Logout.
- If `user.role === 'cafeteria'`: show Menu Management, Orders Dashboard, AI Assistant, and Logout.
- If `user.role === 'admin'`: show Overview, Users, All Orders, AI Assistant, and Logout.
- Logout button calls the `logout()` function from context.

---

## Step 8 — Register and Login Pages

### Register Page
**What it needs:**
- Fields: `username`, `password`, `role` (dropdown: Student or Cafeteria — do not offer Admin as a register option), `full_name`, and `matric_number` (show this field only when role is "student", hide it otherwise).
- On submit, call POST `/api/auth/register/`. On success, the backend returns user data and sets the session cookie automatically. Call `login(userData)` from context and redirect to the correct dashboard based on role.
- Show backend errors inline (not alert popups). The error comes from `response.data.error`.

### Login Page
**What it needs:**
- Fields: `username`, `password`.
- On submit, call POST `/api/auth/login/`. On success, call `login(userData)` from context and redirect to the role-specific dashboard.
- Inline error display for wrong credentials.
- A link to the register page.

**Watch out for:**
- The login and register endpoints are POST requests. Your Axios interceptor will automatically attach the CSRF token header. But the `csrftoken` cookie must already exist in the browser before this happens. Django sets it during the first GET request. Make sure a GET request (like loading the login page itself, or the `me` check on startup) happens before any POST. In practice, the `me` startup call guarantees this.

---

**End of Day 1 Check — Before you sleep:**
- [ ] Register works for student and cafeteria roles. Matric number field appears only for students.
- [ ] After registering, the user is on the correct dashboard for their role.
- [ ] Login works and redirects to the correct role dashboard.
- [ ] After a page refresh, a logged-in user stays logged in (the `me` call on startup restores their session).
- [ ] Logout destroys the session and redirects to `/login`.
- [ ] A student cannot access a cafeteria route. A cafeteria cannot access a student route.
- [ ] Open browser DevTools → Network tab → confirm `withCredentials` is true on requests (you'll see cookies being sent). Confirm the `X-CSRFToken` header is present on POST requests.

---

---

# DAY 2 — Core Commerce
**Goal: Full shopping flow works. Browse → Cart → Checkout → Order status.**

---

## Step 9 — Product Browsing Pages

### All Products Page (`/student/products`)
**What it needs:**
- On mount, call GET `/api/products/`. Show a loading spinner while waiting.
- Display products as cards: image, name, Naira-formatted price, seller name, "Add to Cart" button.
- Empty state if no products are returned.

### Cafeteria List Page (`/student/cafeterias`)
**What it needs:**
- Call GET `/api/cafeterias/` on mount.
- Show each cafeteria as a clickable card with their name and profile image.
- Clicking navigates to `/student/cafeteria/:id`.

### Cafeteria Menu Page (`/student/cafeteria/:id`)
**What it needs:**
- Read the cafeteria ID from the URL with `useParams()`.
- Call GET `/api/cafeterias/:id/menu/` on mount. Note: this is under `/api/cafeterias/`, not `/api/student/` — it's a public endpoint.
- Show ALL items — available and unavailable. Unavailable items must be visually distinct: greyed out, with a clear label like "Not Available Today." They must not have an "Add to Cart" button.
- Available items show normally with an "Add to Cart" button.
- This page is the core demo feature — make the unavailable state obvious and clear.

---

## Step 10 — Add to Cart Flow

**What it needs:**
- "Add to Cart" button calls POST `/api/student/cart/add/` with `{ product_id: X, quantity: 1 }`.
- Two possible outcomes:
  - **Success:** Item added. Update the cart badge count in the navbar. Show a brief toast notification: "Added to cart!"
  - **400 error (seller-lock):** The backend returns an error like `"Your cart already has items from Mama Nkechi's Kitchen. Clear your cart first to order from a different seller."` Display this exact message to the user — not a generic error. Show a "Clear Cart" button alongside it. This is a required feature — judges will test it.
- Disable the "Add to Cart" button while the request is in flight to prevent double-clicks.

---

## Step 11 — Cart Page (`/student/cart`)

**What it needs:**
- Call GET `/api/student/cart/` on mount.
- Display: each item's image, name, price, quantity, subtotal (price × quantity). Show the cart total at the bottom.
- Show the locked seller name: "You are ordering from [Seller Name]."
- For each item:
  - Quantity controls (+ and − buttons or number input). On change, call PUT `/api/student/cart/update/:item_id/` with the new quantity. If quantity is reduced to 0, the item disappears from the cart — update the UI.
  - A "Remove" button that calls DELETE `/api/student/cart/remove/:item_id/`.
- A "Clear Cart" button that calls DELETE `/api/student/cart/clear/`. After success, show the empty cart state.
- A "Proceed to Checkout" button — only visible if the cart has at least one item.
- Empty cart state with a link to browse products.

**Watch out for:**
- Disable quantity controls and remove buttons while their individual request is in flight. A user clicking + twice quickly will send two requests and get a wrong quantity. Disable the control immediately on click, re-enable when the response comes back.

---

## Step 12 — Checkout Page (`/student/checkout`)

**What it needs:**
- Call GET `/api/student/cart/` on mount to show the order summary (what they're about to buy).
- Delivery type selection: "Pickup" or "Delivery." Default to Pickup.
- When Delivery is selected, show the delivery fee and the updated total. Ask Victor for the exact fee value — it comes from his `.env` file.
- "Place Order" button calls POST `/api/student/orders/checkout/` with `{ delivery_type: "pickup" }` or `{ delivery_type: "delivery" }`.
- On success: redirect to `/student/orders` or to `/student/orders/:id` using the returned order ID. Show "Your order has been placed!"
- On error: show the error message inline.
- Disable the button the moment it's clicked. Do not let the user submit twice — double-submit creates two orders.

**Watch out for:**
- The delivery fee preview you show is informational. The backend calculates the real total and returns it. Always display what the backend returns, not what you calculated on the frontend.

---

## Step 13 — Student Orders Pages

### Orders List Page (`/student/orders`)
**What it needs:**
- Call GET `/api/student/orders/` on mount.
- Show each order: seller name, date, Naira-formatted total, delivery type, and a colored status badge.
- Status badge colors: `pending` = amber, `processing` = blue, `ready` = green, `delivered` = grey, `cancelled` = red.
- Each order is clickable — navigates to `/student/orders/:id`.
- Poll every 30 seconds: re-call the endpoint silently, update state. The status badge updates without a full page reload.
- Clean up the poll interval when the component unmounts.

### Order Detail Page (`/student/orders/:id`)
**What it needs:**
- Call GET `/api/student/orders/:id/` on mount.
- Show: all order items (product name, quantity, price at time, subtotal), delivery type, delivery fee, total, status badge.
- Same 30-second polling as the list page.

### Spending History Page (`/student/spending`)
**What it needs:**
- Call GET `/api/student/orders/spending/` on mount.
- Display headline numbers at the top: total amount spent, total orders placed — both large and clear.
- Below that, a per-seller breakdown: seller name and total spent there, sorted by highest amount first.
- All amounts formatted as Naira.

---

## Step 14 — Cafeteria Menu Management (`/cafeteria/menu`)

**What it needs:**
- Call GET `/api/cafeteria/menu/` on mount.
- Show all items (available and unavailable) with clear availability status on each.

**Adding a new item:**
- A form with `name`, `price`, and `image` (file input).
- **Critical:** Send this as `FormData`, not JSON. Django's image upload requires `multipart/form-data`. To do this: create a `new FormData()` object, `append` each field to it, and pass it to Axios. Do NOT manually set the `Content-Type` header — let Axios detect it automatically from the FormData object. If you set `Content-Type: multipart/form-data` yourself, the browser won't include the boundary string and Django won't be able to parse the upload.
- Call POST `/api/cafeteria/menu/`. On success, add the new item to the local list without refetching everything.

**Editing an item:**
- Inline edit or a modal. Call PUT `/api/cafeteria/menu/:id/`. If a new image is included, send as FormData again. If no new image, you can send as JSON — ask Victor how he handles this case.

**Toggling availability:**
- A toggle switch or button on each item. On click, call PATCH `/api/cafeteria/menu/:id/toggle/`.
- Update the toggle state immediately in the UI (optimistic update) — don't wait for the server response. If the request fails, flip it back and show an error.

**Deleting an item:**
- A delete button with a confirmation step. Call DELETE `/api/cafeteria/menu/:id/`. On success, remove from the list.

---

## Step 15 — Cafeteria Orders Dashboard (`/cafeteria/orders`)

**What it needs:**
- Call GET `/api/cafeteria/orders/` on mount.
- Filter tabs at the top: All / Pending / Processing / Ready / Delivered. Clicking a tab appends `?status=pending` (or whichever) to the request URL. Update the list.
- For each order: buyer name, order items with quantities, delivery type, Naira total, status badge, time placed.
- Status action buttons based on current status:
  - `pending` → "Start Processing" button + "Cancel Order" button
  - `processing` + delivery type `pickup` → "Mark as Ready" button
  - `processing` + delivery type `delivery` → "Mark as Delivered" button
  - `ready`, `delivered`, `cancelled` → no buttons (order is done)
- Each button calls PATCH `/api/cafeteria/orders/:id/status/` with the appropriate new status string.
- Poll every 30 seconds — new orders come in without the cafeteria refreshing. Clean up on unmount.

**Watch out for:**
- The status strings must be exactly: `pending`, `processing`, `ready`, `delivered`, `cancelled`. All lowercase, no variation. These must match what the backend stores — a mismatch means the backend returns a 400 and the status won't update.

---

## Step 16 — Student Vendor Product Management (`/student/vendor`)

**What it needs:**
- Structurally identical to the cafeteria menu management page (Step 14).
- Calls `/api/student/vendor/` instead of `/api/cafeteria/menu/`.
- Page heading is something like "My Shop" or "My Listings."
- Same four operations: add (with image as FormData), edit, toggle, delete.

---

**End of Day 2 Check — Before you sleep:**
- [ ] Products page loads with correctly formatted Naira prices and working images.
- [ ] Cafeteria menu page clearly distinguishes available and unavailable items.
- [ ] Add to Cart works. Seller-lock error shows the seller name and a "Clear Cart" button.
- [ ] After clearing the cart, adding from a new seller works.
- [ ] Cart shows items, quantities, subtotals, total. Quantity controls and removal work.
- [ ] Checkout creates an order and redirects. Delivery fee shows in the total when delivery is selected.
- [ ] Student orders page polls every 30 seconds — confirm with browser DevTools (Network tab).
- [ ] Cafeteria orders dashboard shows new orders and status updates work through the full lifecycle.
- [ ] Image upload works on the cafeteria menu page — an item with a real image saves and displays correctly.

---

---

# DAY 3 — AI Features + Admin Dashboard
**Goal: All three AI features have working UI. Admin dashboard shows real data.**

---

## Step 17 — AI Meal Recommender Page (`/student/ai-recommender`)

**What it needs:**
- Two inputs:
  - A number input for the budget. Label: "How much do you have? (₦)"
  - An optional dropdown for cafeteria selection. On mount, call GET `/api/cafeterias/` and populate the options. Add "Any Cafeteria" as the default first option — when selected, send no `cafeteria_id` in the request body.
- "Get Recommendations" button. On click, call POST `/api/student/ai/meal-recommender/` with `{ amount: X }` or `{ amount: X, cafeteria_id: Y }`.
- **Loading state:** AI responses take 2–5 seconds. While waiting, disable the button and show something like "Finding the best meal combos for you..." — a spinner with text. This makes the wait feel intentional, not broken.
- **Response display:** Show the AI text in a styled card below the form. The response is plain English with meal combos and math — preserve line breaks when displaying it.
- A new submission replaces the previous response.
- Error state: if the request fails, show the error message in the same area.

**Watch out for:**
- The AI response for a very low budget will be a humorous roast. The AI response for ₦10,000+ starts with investment advice before giving food combos. These are intentional behaviors from the backend prompt — display whatever text comes back without filtering it.

---

## Step 18 — Admin Overview Dashboard (`/admin/dashboard`)

**What it needs:**
- Call GET `/api/admin/overview/` on mount. Show skeletons or a spinner while loading — an empty dashboard with no numbers looks broken.
- Display in clearly labeled stat cards:
  - Total students and total cafeterias (user counts by role)
  - Total orders by status (show all five: pending, processing, ready, delivered, cancelled)
  - Total platform revenue (formatted as Naira)
  - Count of active products
- Below the stats, the AI assistant input:
  - A text input with placeholder: "Ask anything about platform activity..."
  - An "Ask" button that calls POST `/api/admin/ai/assistant/` with `{ question: "..." }`.
  - Show the AI response in a styled panel below the input.
  - Loading state while the AI processes the question.

---

## Step 19 — Admin Users List Page (`/admin/users`)

**What it needs:**
- Call GET `/api/admin/users/` on mount. The response is paginated — it includes `total_count`, `total_pages`, `current_page`, and a list of users for that page.
- Display a table with: Full Name, Username, Role (as a colored badge), Date Joined.
- Pagination controls at the bottom: Previous / Next buttons and "Page X of Y" display.
- Clicking Previous/Next calls GET `/api/admin/users/?page=N` and updates the table.
- Disable Previous on page 1. Disable Next on the last page.

---

## Step 20 — Admin Orders List Page (`/admin/orders`)

**What it needs:**
- Call GET `/api/admin/orders/` on mount. Also paginated.
- Table with: buyer name, seller name, Naira total, status badge, delivery type, date.
- Status filter tabs at the top (same pattern as cafeteria orders dashboard). Append `?status=X` to the request.
- Pagination controls (same pattern as users list).
- If both a status filter and a page number are active, include both query params: `?status=pending&page=2`.

---

## Step 21 — Cafeteria AI Assistant (`/cafeteria/ai-assistant` or section on `/cafeteria/orders`)

**What it needs:**
- A text input and "Ask" button. On submit, call POST `/api/cafeteria/ai/assistant/` with `{ question: "..." }`.
- Display the AI response in a panel below the input.
- Loading state while processing.
- Show example questions as placeholder text or clickable suggestion chips to prompt the cafeteria owner: "What's my best seller today?", "How much have I made?", "How many orders are pending?"
- You can put this on a dedicated `/cafeteria/ai-assistant` page or as a section on the orders dashboard — whichever fits your layout better.

---

## Step 22 — Spending History Polish Pass (`/student/spending`)

**What it needs:**
- You built this in Day 2. Now make it presentable for the demo.
- The headline numbers (total spent, total orders) should be big and prominent — not buried in a table.
- The per-seller breakdown should be clearly sorted (highest spend first).
- Consider a simple visual: a proportional bar next to each seller showing their share of the total spend. Even a CSS-only width trick works. It makes the page feel like an actual analytics view rather than a plain list.

---

**End of Day 3 Check — Before you sleep:**
- [ ] Meal recommender shows a real AI response with food combos and math.
- [ ] Testing with ₦50 triggers the roast response — display it as-is, don't filter it.
- [ ] Admin dashboard stat cards show real numbers from the database.
- [ ] Admin AI assistant returns an answer that references real platform figures.
- [ ] Cafeteria AI assistant answers correctly about that cafeteria's orders.
- [ ] All three AI inputs disable and show a loading state while the request is in flight.
- [ ] Admin user list is paginated and the Previous/Next buttons work.
- [ ] Admin orders list is filterable by status.

---

---

# DAY 4 — Polish & Demo Prep
**Goal: Every error state is handled, everything looks clean on mobile, demo flow is rehearsed.**

---

## Step 23 — Error State Audit

**Go through every page and ask: "What does this look like if the API call fails?"**

For every page that fetches data, you need three states:
1. **Loading** — spinner or skeleton. Never a blank white screen.
2. **Success** — the normal content.
3. **Error** — a message explaining what went wrong. Use `response.data.error` from the backend, or a generic fallback like "Something went wrong. Please try again."

**Specific error states to verify:**
- Cart page when empty → friendly empty state with "Browse Products" link.
- Student orders page with no orders → empty state (not a crash or blank page).
- Cafeteria orders dashboard filtered to a status with no orders → "No pending orders" message, not a blank list.
- Admin pages when the database has no data → empty state.
- Any form submission failure → error message appears near the form, not an alert popup.
- Add to Cart seller-lock → the specific seller name appears in the message, "Clear Cart" button is visible.
- Any 401 response → Axios interceptor redirects to login automatically (verify this works).

---

## Step 24 — Mobile Responsiveness

**Resize the browser to ~375px width and check every page.**

Minimum requirements:
- No horizontal scrolling on any page.
- Navbar collapses or simplifies on small screens — a hamburger menu or a simplified link list.
- Product cards stack into a single column.
- Cart page is fully usable: items readable, quantity controls tappable, checkout button reachable.
- Checkout page works on mobile — form fields and buttons accessible.
- All three AI input pages: text input and button readable and tappable.
- Admin stat cards stack vertically on small screens.

Judges will almost certainly test the app on a phone during the demo.

---

## Step 25 — Loading Indicators Audit

Go through every page that makes an API call:

- [ ] Products page — spinner while products load
- [ ] Cafeteria menu page — spinner while menu loads
- [ ] Cart page — spinner on initial load; controls disabled during individual item updates
- [ ] Checkout — "Place Order" button disabled and shows "Placing order..." while in flight
- [ ] Student orders list — spinner on load; silent refetch on poll (no jarring full reload)
- [ ] Order detail — spinner on load; silent refetch on poll
- [ ] Cafeteria orders dashboard — spinner on load; silent poll every 30 seconds
- [ ] Admin dashboard — skeleton or spinner while stats load
- [ ] Admin users list — spinner while page loads, spinner when changing pages
- [ ] Admin orders list — same as users list
- [ ] AI meal recommender — clear loading state with text while AI processes
- [ ] Admin AI assistant — loading state between question submission and answer
- [ ] Cafeteria AI assistant — loading state

---

## Step 26 — Demo Flow Rehearsal

**Practice this exact sequence at least twice with Victor. Know every click cold.**

1. Open the browser. You're on the login page.
2. Log in as the **demo student** account.
3. Go to Cafeterias. Click Mama Nkechi's Kitchen. Show the menu — point out at least one item tagged "Not Available Today."
4. Go to AI Meal Recommender. Enter ₦1,500. Submit. Wait for the AI response. Narrate: "The AI reads the live cafeteria menu and builds a budget meal plan with the math shown."
5. Go back to Mama Nkechi's menu. Add one available item to the cart.
6. Try to add an item from the other cafeteria. Show the seller-lock error with the seller name in the message and the "Clear Cart" button. Narrate: "The system enforces one seller per order. You can't mix cafeterias in one cart."
7. Go to the cart. Review the order. Click "Proceed to Checkout." Select Pickup. Place the order.
8. Go to the orders page. The new order appears with status "Pending."
9. Log out.
10. Log in as the **demo cafeteria** account (Mama Nkechi's).
11. Go to the orders dashboard. The student's order appears as Pending.
12. Click "Start Processing." Status updates to Processing.
13. Go to the AI assistant. Type: "What is my best selling item today?" Show the response.
14. Log out.
15. Log in as the **demo admin** account.
16. Show the overview dashboard — user counts, order totals, revenue.
17. In the AI assistant, type: "Give me a summary of today's activity." Show the response.
18. Done. Under 5 minutes total.

**Your job during the demo:** Drive the clicks. Know where every button is before the presentation starts. Don't read the screen during the demo — you should already know what's on it.

---

## Step 27 — Pre-Demo Checklist

Run through this on the morning of the presentation:

**Auth and session:**
- [ ] Register works for student and cafeteria roles
- [ ] Login works for all 3 demo accounts
- [ ] After page refresh, logged-in user stays logged in (session persists)
- [ ] Logout works and redirects to login

**Demo account credentials — get these from Victor on Day 3:**

| Account | Username | Password |
|---------|----------|----------|
| Demo Student | | |
| Demo Cafeteria (Mama Nkechi's) | | |
| Demo Admin | | |

**Shopping flow:**
- [ ] Products page loads with images and Naira-formatted prices
- [ ] Cafeteria menu shows unavailable items visually distinct
- [ ] Add to cart works
- [ ] Seller-lock error message includes the seller name and shows "Clear Cart" button
- [ ] Cart page shows items and total
- [ ] Checkout places order and redirects
- [ ] Delivery fee appears in total when delivery is selected

**Cafeteria flow:**
- [ ] New order appears in cafeteria dashboard after student checks out
- [ ] Status update buttons work through the full lifecycle

**AI features:**
- [ ] Meal recommender returns a real response (test with ₦1,500)
- [ ] Admin AI returns a response (verify numbers match what's in the database)
- [ ] Cafeteria AI returns a response about today's orders

**General:**
- [ ] All pages have loading states
- [ ] All pages have empty states
- [ ] No broken images — all product and profile images display
- [ ] App works on mobile (resize browser to ~375px)
- [ ] No red errors in the browser console on any page

---

---

# General Rules — Apply These Throughout

## Every Page Needs Three States

Before you call any page done, confirm it handles all three:
1. **Loading** — spinner, skeleton, or disabled button
2. **Success** — the main UI
3. **Error** — a message, not a blank screen or a crash

A page that goes blank on a failed API call destroys trust with judges instantly.

---

## Every Action Needs a Reaction

When a user does something, they need to know what happened:
- **Immediate:** Disable the button or show a spinner while the request is in flight.
- **Success:** A toast notification or a redirect with a success message.
- **Error:** The specific error from `response.data.error`, shown near the action that caused it. Never swallow errors silently.

---

## Naira Formatting — Everywhere, Always

Build a helper function in `src/utils/naira.js` and use it on every price across the entire app. Never show a raw number like `800` next to a price. Always `₦800` or `₦800.00` — pick one format and be consistent.

Use it on: product cards, cart subtotals, order totals, delivery fee, spending history, admin revenue stat card. Everywhere.

---

## FormData for Image Uploads

Any endpoint that accepts an image must receive `FormData`, not JSON. The two places this applies: cafeteria menu item creation/editing and student vendor product creation/editing.

Rules for FormData:
- Create `new FormData()`, then `append` each field individually.
- Pass the FormData object directly to Axios.
- Do NOT manually set `Content-Type: multipart/form-data`. Axios detects FormData automatically and sets the correct header including the required boundary string. If you set it manually, you break the boundary and Django can't parse the upload.

---

## Polling — Clean It Up

The app polls for order status updates every 30 seconds. Every time you use `setInterval` inside a `useEffect`, you must return a cleanup function from the `useEffect` that calls `clearInterval`. If you don't, the interval keeps running after the user navigates away from the page, firing requests in the background and potentially causing state updates on unmounted components.

Refetch silently — don't show a full loading spinner during polls. Just call the API, update state, and let React re-render only what changed.

---

## Communication With Victor

Ask Victor immediately whenever:
- You're unsure of the exact shape of an API response.
- An endpoint returns something unexpected.
- You need the demo account credentials (Day 3 at the latest).
- Victor changes an endpoint URL, request format, or response shape.

Do not guess. One wrong assumption about a response shape creates a bug that takes 30 minutes to trace.

---

## The Demo Is a Story

You are not demonstrating a feature list. You are telling the story of a real Elizade student who doesn't know what to eat today. Every click is a chapter of that story. Know it cold. Tell it the same way every time. Judges remember stories, not feature checklists.

---

*ByteNBite React Frontend Guide (Updated) · [Partner] · June 2026*