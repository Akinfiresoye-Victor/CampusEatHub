# ByteNBite — React Frontend Developer Guide
### Elizade TechFest Hackathon 2026 · Frontend Build Reference

> This guide walks you through every frontend responsibility from project setup to demo prep.
> No code. Pure step-by-step thinking so you always know what to build, in what order, and why.

---

## How to Use This Guide

Work through it top to bottom, day by day. Each section tells you:
- **What to build** — the specific page, component, or utility you're making
- **What it needs to know / do** — the logic and UX rules to have in your head before you start
- **Watch out for** — common traps that will waste your time if you hit them

Do not skip ahead. Day 2's work depends on Day 1 being solid.

---

## Your Relationship With the Backend

You never touch the database. You never calculate totals, generate tokens, or decide what's allowed. The Django backend does all of that. Your job is to:

1. Send the right request (right URL, right method, right data shape, right token in the header).
2. Handle whatever comes back — success or error — and show it to the user clearly.
3. Never guess what the backend returns. Ask Victor whenever you are unsure of the response shape.

Every response from the backend follows one of two shapes:

**Success:** `{ "success": true, "data": { ... } }`
**Error:** `{ "success": false, "error": "Human readable message" }`

Your code must always check `response.data.success` before trying to use `response.data.data`. If `success` is false, show `response.data.error` to the user.

---

## The Token System — Understand This First

This platform uses custom token auth. Here is exactly how it works:

- When a user registers or logs in, the backend returns a token — a 40-character random string.
- You store that token in `localStorage` immediately.
- Every request you make after that must include this header: `Authorization: Token <the_token>`.
- When the user logs out, you call the logout endpoint and then delete the token from `localStorage`.
- If the token is missing or invalid, the backend returns 401. When you see a 401, redirect the user to the login page and clear `localStorage`.

This token is how the backend knows who is making every request. Without it, protected endpoints return 401. You must attach it to every request to a protected endpoint. You will set this up as a centralized utility on Day 1 so you never forget it.

---

---

# DAY 1 — Foundation
**Goal: Register and login work. Token is stored. Authenticated requests work. Role-based routing works.**

---

## Step 1 — Project Setup

**What to build:** A new React project using Vite with the core dependencies installed.

**What it needs:**
- Create the project with Vite. This gives you a faster dev server than Create React App.
- Install your dependencies: `axios` (for all HTTP requests to Django), `react-router-dom` (for page navigation).
- Delete all the Vite boilerplate — the default CSS, the counter component, the Vite logo. Start clean.
- Set up your folder structure before writing any component. A clean structure now saves confusion at 2am on Day 3. Suggested structure:
  - `src/pages/` — full page components (one per route)
  - `src/components/` — reusable pieces used across pages (navbar, buttons, cards)
  - `src/api/` — all Axios calls, grouped by feature
  - `src/context/` — React context (for auth state)
  - `src/utils/` — helper functions that don't belong anywhere else

**Watch out for:**
- The Django backend runs on port 8000. Your React app runs on port 5173. These are different origins — this is exactly why Victor configured CORS. You don't need to configure anything for CORS on your side, but you must always use the full URL when calling the API: `http://localhost:8000/api/...`, never just `/api/...`.

---

## Step 2 — Axios Setup (Central API Utility)

**What to build:** A configured Axios instance that automatically attaches the auth token to every request.

**What it needs:**
- Create a file — something like `src/api/axiosInstance.js` — that creates and exports a pre-configured Axios instance.
- Set the `baseURL` to `http://localhost:8000`. This means everywhere else in your code, you write `/api/auth/login/` instead of the full URL.
- Add a request interceptor. An interceptor is a function that runs automatically before every request goes out. In this interceptor, read the token from `localStorage`. If it exists, add it to the request headers as `Authorization: Token <token>`. If it doesn't exist, send the request without the header (it's a public endpoint).
- Also add a response interceptor. This one runs automatically after every response comes back. If the response status is 401, the user's token is invalid or expired — clear `localStorage` and redirect to the login page.

**Why this matters:** Without this, you'd have to manually attach the token in every single API call. With this, you write it once and forget about it. Every Axios call you make through this instance automatically handles auth.

**Watch out for:**
- Import this configured instance (`axiosInstance`) everywhere, not Axios directly. If you import Axios directly somewhere and forget the token, that request will get a 401 and you'll spend 20 minutes confused about why.
- The response interceptor for 401 needs access to the router to redirect. Handling this redirect inside the interceptor cleanly requires some thought — one simple approach is to just do `window.location.href = '/login'` inside the interceptor. It's not the cleanest React pattern but it works under hackathon time pressure.

---

## Step 3 — API Call Files

**What to build:** Separate files in `src/api/` for each feature area that contain the actual Axios function calls.

**What it needs:**
- Create these files on Day 1 even if most of them are empty. Filling them out is Day 2's work. Having the files there keeps the structure clean:
  - `authApi.js` — register, login, logout, me
  - `productsApi.js` — public product browsing, cafeteria menus
  - `cartApi.js` — all cart operations
  - `ordersApi.js` — checkout, order history, spending summary
  - `vendorApi.js` — student vendor product management
  - `cafeteriaApi.js` — cafeteria menu management and order management
  - `adminApi.js` — admin overview, user list, order list
  - `aiApi.js` — all three AI endpoints

- Each function in these files should use the `axiosInstance` you built in Step 2, call one endpoint, and return the full Axios response object. The calling component decides what to do with the data.

**Why separate files:** When Victor changes an endpoint URL or response shape, you update it in one place. The component that calls it doesn't need to change.

---

## Step 4 — Auth Context

**What to build:** A React context that holds the current user's auth state and makes it available to every component.

**What it needs:**
- Create `src/context/AuthContext.jsx`.
- The context should hold: `user` (the user object — id, username, role, full_name), `token` (the raw token string), and `isLoading` (a boolean for whether the app is still checking if the user is logged in).
- Provide these functions through the context: `login(userData, token)` — saves the token to `localStorage`, sets the user state; `logout()` — calls the logout API endpoint, clears `localStorage`, clears the user state, redirects to login; `isAuthenticated()` — returns true/false based on whether a user is currently in state.
- On app startup (use `useEffect` inside the context provider that runs once), check `localStorage` for an existing token. If one exists, call the `/api/auth/me/` endpoint to verify it's still valid and get the user's data. This is how the app "remembers" a logged-in user after a page refresh. If the `me` call returns 401, the token is expired — clear it and treat the user as logged out.
- Wrap your entire app in this `AuthContext.Provider` so every page and component can access it with `useContext(AuthContext)`.

**Watch out for:**
- While the `me` check is loading on startup, show a loading screen (even just a blank screen or a spinner). If you don't, your protected routes might flash to the login page for half a second before realizing the user is actually logged in. The `isLoading` boolean in the context is how you handle this.

---

## Step 5 — React Router Setup

**What to build:** All your routes defined in one place, with role-based protection.

**What it needs:**
- In `src/App.jsx` (or a dedicated `src/router.jsx`), define all your routes using React Router v6's `<Routes>` and `<Route>` components.
- Create a `ProtectedRoute` wrapper component. This component checks the auth context. If the user is not logged in, it redirects to `/login`. If a required role is specified and the user's role doesn't match, it redirects to their correct dashboard. If everything checks out, it renders the child page.
- Define placeholder routes for every page on Day 1, even if the page just says "Coming soon." This way you and Victor can test navigation without pages being broken.
- The routes you'll need:

  Public (no login needed): `/login`, `/register`

  Student routes: `/student/dashboard`, `/student/products`, `/student/cafeterias`, `/student/cafeteria/:id`, `/student/cart`, `/student/checkout`, `/student/orders`, `/student/orders/:id`, `/student/spending`, `/student/vendor`, `/student/ai-recommender`

  Cafeteria routes: `/cafeteria/dashboard`, `/cafeteria/menu`, `/cafeteria/orders`, `/cafeteria/ai-assistant`

  Admin routes: `/admin/dashboard`, `/admin/users`, `/admin/orders`, `/admin/ai-assistant`

- After login, redirect the user to the correct dashboard based on their role. Don't send everyone to the same place — a cafeteria landing on the student dashboard is confusing.

**Watch out for:**
- With React Router v6, `<Redirect>` no longer exists. Use the `<Navigate>` component or the `useNavigate()` hook instead.
- The `ProtectedRoute` must also handle the `isLoading` state from context. If the app is still verifying the token on startup, don't redirect anywhere yet — wait until loading is false.

---

## Step 6 — Navigation Bar

**What to build:** A navbar that shows different links depending on who is logged in.

**What it needs:**
- Read the `user` from auth context.
- If no user is logged in: show Login and Register links only.
- If user is a **student**: show links to browse products, view their cart (with an item count badge if cart has items), their orders, spending history, their vendor products, and the AI recommender.
- If user is a **cafeteria**: show links to their menu management, their orders dashboard, and their AI assistant.
- If user is an **admin**: show links to the overview dashboard, user list, order list, and AI assistant.
- Always show a Logout button for logged-in users. Clicking it calls the `logout()` function from context.

---

## Step 7 — Register and Login Pages

**What to build:** Two public-facing auth pages.

### Register Page
**What it needs:**
- A form with fields: `username`, `password`, `role` (a dropdown or radio buttons with options: Student, Cafeteria), `full_name`, and `matric_number` (only show this field when role is "student" — hide it for cafeteria).
- On submit, call the register API function. On success, the backend returns a token and user data. Call `login(userData, token)` from context and redirect to the appropriate dashboard.
- If the backend returns an error (e.g., username already taken), display the error message from `response.data.error` near the form, not in an alert popup. Inline errors are better UX.

### Login Page
**What it needs:**
- A form with `username` and `password`.
- On submit, call the login API function. On success, call `login(userData, token)` from context, then redirect to the role-specific dashboard.
- Show errors inline if credentials are wrong.
- Include a link to the register page for new users.

**Watch out for:**
- Never store the password anywhere after you've sent it to the API. The response from login/register never includes the password — and your app should never hold onto it either.

---

**End of Day 1 Check — Before you sleep:**
- [ ] Register works for all 3 roles. The matric number field appears only for students.
- [ ] Login works and the user is redirected to the right dashboard based on role.
- [ ] After page refresh, the logged-in user stays logged in (token is read from localStorage on startup).
- [ ] The navbar shows the right links for each role.
- [ ] Logout clears the session and redirects to login.
- [ ] A student cannot access a cafeteria route. A cafeteria cannot access a student route.
- [ ] All Axios calls go through the configured instance with the token attached automatically.

---

---

# DAY 2 — Core Commerce
**Goal: Full shopping flow works. Browse → Cart → Checkout → Order status.**

---

## Step 8 — Product Browsing Pages

### All Products Page (`/student/products`)
**What it needs:**
- On mount, call the GET `/api/products/` endpoint. Show a loading spinner while waiting.
- Display all returned products as cards. Each card shows: product image, name, price in Naira (format all prices as `₦X,XXX` — never show raw numbers), seller name, and an "Add to Cart" button.
- If the products array is empty, show a clear empty state message — not a blank page.

### Cafeteria List Page (`/student/cafeterias`)
**What it needs:**
- Call GET `/api/cafeterias/` on mount. Show each cafeteria's name and profile image as a clickable card.
- Clicking a cafeteria card navigates to that cafeteria's menu page.

### Cafeteria Menu Page (`/student/cafeteria/:id`)
**What it needs:**
- Read the cafeteria ID from the URL params using `useParams()`.
- Call GET `/api/cafeterias/:id/menu/` on mount.
- Display ALL items — including unavailable ones. Unavailable items must be visually distinct: greyed out, with a clear label like "Not Available Today." They should NOT have an "Add to Cart" button. This is the key feature that solves the "walk there for nothing" problem — make it obvious.
- Available items show normally with an "Add to Cart" button.

**Watch out for:**
- Naira formatting: use JavaScript's `Intl.NumberFormat` or just a simple helper function. Showing `₦800.00` is fine. Showing `800` with no currency symbol or formatting is not demo-ready.

---

## Step 9 — Add to Cart Flow

**What it needs:**
- When the user clicks "Add to Cart" on any product, call POST `/api/cart/add/` with `{ product_id: X, quantity: 1 }`.
- Two possible outcomes from the backend:
  - **Success:** The item was added. Update the cart item count in the navbar badge. Show a brief success notification (a small toast message — "Added to cart!" — is better UX than an alert popup).
  - **400 error with seller-lock message:** The backend returns `"Your cart already has items from [seller name]. Clear your cart first to order from a different seller."` You must display this message to the user clearly, and you must show a "Clear Cart" button alongside it. This is a required feature per the spec — do not just show a generic error.

**Watch out for:**
- The cart item count in the navbar should update in real time when items are added or removed. One way to handle this: store the cart item count in a state or context, update it after every cart operation.

---

## Step 10 — Cart Page (`/student/cart`)

**What it needs:**
- On mount, call GET `/api/cart/` to load the cart contents.
- Display each cart item: product image, name, quantity, price per item, and subtotal (price × quantity).
- Show the cart total at the bottom.
- For each item, provide:
  - A quantity control (+ and − buttons, or a number input). On change, call PUT `/api/cart/update/:item_id/` with the new quantity. If quantity is reduced to 0, the item is removed — update the UI accordingly.
  - A "Remove" button that calls DELETE `/api/cart/remove/:item_id/`.
- Show a "Clear Cart" button at the top or bottom that calls DELETE `/api/cart/clear/`. After clearing, show the empty cart state.
- Show a "Proceed to Checkout" button at the bottom. Only show it if the cart has at least one item.
- If the cart is empty, show a friendly empty state with a link to browse products.
- Show the locked seller information: "You are ordering from [Seller Name]." This reinforces the one-seller-per-order rule to the user.

**Watch out for:**
- Every quantity update or item removal is an API call. Show a loading state on the control that was just interacted with (e.g., disable the + button while the request is in flight). Otherwise a fast user might click multiple times and send duplicate requests.

---

## Step 11 — Checkout Page (`/student/checkout`)

**What it needs:**
- On mount, call GET `/api/cart/` to show the order summary (what they're about to pay for).
- Provide a delivery type selection: "Pickup" or "Delivery." Default to Pickup.
- When Delivery is selected, show the delivery fee (₦200 — get this from the backend response or hardcode it only if Victor confirms the value). Show the updated total including the fee.
- A "Place Order" button that calls POST `/api/orders/checkout/` with `{ delivery_type: "pickup" }` or `{ delivery_type: "delivery" }`.
- On success: redirect the user to their orders page (or to the specific new order's detail page using the returned order ID). Show a success message: "Your order has been placed!"
- On error: display the error message inline.

**Watch out for:**
- Do not let the user click "Place Order" twice. Disable the button immediately after the first click (while the request is in flight). A double-submit creates two orders.
- The backend calculates the total. You display what the backend says, not your own calculation. Your displayed total is just a preview — the backend's number is final.

---

## Step 12 — Student Orders Pages

### Orders List Page (`/student/orders`)
**What it needs:**
- Call GET `/api/orders/` on mount. Show all orders, newest first.
- For each order: seller name, order date, total amount, delivery type, and a colored status badge.
- Status badge colors should be visually distinct and clear:
  - `pending` — yellow/amber
  - `processing` — blue
  - `ready` — green
  - `delivered` — grey (completed)
  - `cancelled` — red
- Each order should be clickable, navigating to the order detail page.
- Since the frontend polls for status updates (no WebSockets), refetch this list automatically every 30 seconds using `setInterval` inside a `useEffect`. Clear the interval on component unmount to avoid memory leaks.

### Order Detail Page (`/student/orders/:id`)
**What it needs:**
- Call GET `/api/orders/:id/` on mount.
- Show full order details: all items (product name, quantity, price at time of order, subtotal per item), delivery type, delivery fee, total, and the current status badge.
- Same 30-second polling as the list page — the status might update while the student is watching.

### Spending History Page (`/student/spending`)
**What it needs:**
- Call GET `/api/orders/spending/` on mount.
- Display at the top: total amount spent overall, total number of orders placed.
- Below that, a breakdown table or list showing: seller name and how much was spent at that seller, sorted by highest amount.
- Format all amounts as Naira.

---

## Step 13 — Cafeteria Menu Management Page (`/cafeteria/menu`)

**What it needs:**
- On mount, call GET `/api/cafeteria/menu/` to load the cafeteria's own full menu.
- Display all items (available and unavailable). Show availability status clearly on each item.
- **Add new item:** A form (or a modal) with fields for `name`, `price`, and `image` (a file input). On submit, send as `multipart/form-data` using `FormData`, not as JSON. This is critical — image uploads require FormData. Do NOT set the `Content-Type` header manually when using FormData; let Axios set it automatically. On success, add the new item to the list without refetching the whole list.
- **Edit item:** Allow editing name and price in place (inline edit) or via a modal. Image can optionally be updated. Send as PUT. On success, update the item in the list.
- **Toggle availability:** A toggle switch or button on each item. On click, call PATCH `/api/cafeteria/menu/:id/toggle/`. Update the toggle state immediately in the UI (optimistic update — don't wait for the server response to flip the switch). If the request fails, flip it back and show an error.
- **Delete item:** A delete button with a confirmation step ("Are you sure?") before calling DELETE. On success, remove the item from the list.

**Watch out for:**
- For image uploads, build the request like this: create a `new FormData()` object, use `formData.append('name', value)` for each field, and `formData.append('image', fileInputRef.current.files[0])` for the image file. Pass the FormData object directly to Axios. Do not JSON.stringify it.

---

## Step 14 — Cafeteria Orders Dashboard (`/cafeteria/orders`)

**What it needs:**
- On mount, call GET `/api/cafeteria/orders/` to load all incoming orders.
- Display orders as cards or rows. For each order: buyer name, order items (product name + quantity), delivery type, total amount, current status, and time placed.
- Status filter tabs at the top: All / Pending / Processing / Ready / Delivered. Clicking a tab calls GET `/api/cafeteria/orders/?status=pending` (or whichever status). Update the list based on the response.
- For each order, show a status update button based on the current status:
  - If `pending`: show "Start Processing" button and a "Cancel Order" button.
  - If `processing` and delivery type is `pickup`: show "Mark as Ready" button.
  - If `processing` and delivery type is `delivery`: show "Mark as Delivered" button.
  - If `ready` or `delivered` or `cancelled`: no action buttons (order is done).
- Clicking a status button calls PATCH `/api/cafeteria/orders/:id/status/` with the new status. On success, update that order's status in the UI.
- Poll this page every 30 seconds (same pattern as student orders) — new orders come in without the cafeteria refreshing.

**Watch out for:**
- The allowed status strings are exactly: `pending`, `processing`, `ready`, `delivered`, `cancelled`. These must match the backend exactly. No capitalization, no abbreviation.

---

## Step 15 — Student Vendor Product Management Page (`/student/vendor`)

**What it needs:**
- This page is structurally identical to the Cafeteria Menu Management page (Step 13). The only differences:
  - It calls `/api/vendor/products/` instead of `/api/cafeteria/menu/`.
  - The page header says something like "My Shop" or "My Listings" instead of "Menu."
- Same CRUD operations: add (with image via FormData), edit, toggle availability, delete.
- Consider reusing the same component structure if you built the cafeteria menu page first — parameterize it by role.

---

**End of Day 2 Check — Before you sleep:**
- [ ] All products page loads and displays product cards with Naira-formatted prices.
- [ ] Cafeteria menu page shows both available and unavailable items — unavailable items are visually distinct.
- [ ] Add to Cart works. Seller-lock error shows the seller name and a "Clear Cart" button.
- [ ] Cart page shows items, quantities, subtotals, and the total. Quantity updates and item removal work.
- [ ] Checkout creates an order and redirects to the orders page.
- [ ] Student orders page polls for status updates every 30 seconds.
- [ ] Cafeteria sees incoming orders and can update their status through the full lifecycle.
- [ ] Cafeteria menu management — add, edit, toggle, and delete all work including image upload.

---

---

# DAY 3 — AI Features + Admin Dashboard
**Goal: All three AI features have working UI. Admin dashboard shows real data.**

---

## Step 16 — AI Meal Recommender Page (`/student/ai-recommender`)

**What it needs:**
- Two inputs:
  - A number input for the budget amount (label: "How much do you have to spend?" — in Naira).
  - An optional dropdown for cafeteria selection. On mount, call GET `/api/cafeterias/` and populate the dropdown options. Add a "Any Cafeteria" option at the top as the default (sends no cafeteria_id to the backend).
- A "Get Recommendations" button. On click, call POST `/api/ai/meal-recommender/` with `{ amount: X }` or `{ amount: X, cafeteria_id: Y }`.
- **Loading state:** AI responses take 2–5 seconds. While waiting, disable the button and show a loading indicator. A spinner with text like "Finding the best meal combos for you..." makes the wait feel intentional rather than broken.
- **Response display:** Show the AI's recommendation text in a styled card or box below the form. The text comes back as a plain English paragraph with meal combos and math. Display it with proper whitespace — preserve line breaks from the response.
- If the response is an error, show the error message in the same area.
- The recommendation replaces the previous one on each new submission (don't stack multiple responses).

**Watch out for:**
- The AI response for a very low amount will be a humorous roast. The AI response for ₦10,000+ will first warn about spending too much on food. These are intentional — don't strip them out or treat them as errors. Display whatever text the backend sends back.

---

## Step 17 — Admin Overview Dashboard (`/admin/dashboard`)

**What it needs:**
- On mount, call GET `/api/admin/overview/`. While loading, show skeletons or a spinner — this is a metrics dashboard and empty boxes look broken.
- Display the overview stats in clear cards:
  - Total students / Total cafeterias (user counts by role)
  - Total orders by status (pending, processing, ready, delivered, cancelled — show all of them)
  - Total platform revenue (format as Naira)
  - Count of active products
- Below the stats, an AI assistant chat section:
  - A text input with placeholder: "Ask anything about platform activity..."
  - A "Ask" button.
  - On submit, call POST `/api/ai/admin-assistant/` with `{ question: "..." }`.
  - Show the AI response below the input in a styled panel.
  - Loading state while the AI is processing — same pattern as the meal recommender.

---

## Step 18 — Admin Users List Page (`/admin/users`)

**What it needs:**
- On mount, call GET `/api/admin/users/` (returns paginated results).
- Display a table with columns: Full Name, Username, Role, Date Joined.
- Role should be displayed with a colored badge (student = one color, cafeteria = another).
- Pagination controls at the bottom: Previous / Next buttons, and "Page X of Y" display. On clicking next/previous, call GET `/api/admin/users/?page=2` and update the table.

---

## Step 19 — Admin Orders List Page (`/admin/orders`)

**What it needs:**
- On mount, call GET `/api/admin/orders/`.
- Display a table: buyer name, seller name, total amount, status badge, delivery type, date.
- Status filter at the top — same tab pattern as the cafeteria orders dashboard. Filter by appending `?status=X` to the request.
- Pagination controls (same as users list).

---

## Step 20 — Cafeteria AI Assistant Section (`/cafeteria/orders` or `/cafeteria/dashboard`)

**What it needs:**
- Add an AI assistant input section to the cafeteria dashboard or orders page — whichever makes more sense in your layout.
- A text input and an "Ask" button. On submit, call POST `/api/ai/cafeteria-assistant/` with `{ question: "..." }`.
- Display the AI response in a panel below the input.
- Loading state while processing.
- Example questions to show as placeholder text or suggestion chips: "What's selling the most today?", "How much have I made?", "How many orders are pending?"

---

## Step 21 — Spending History Page (`/student/spending`) — Polish Pass

**What it needs:**
- You built this in Day 2. Now make it presentable.
- The total amount spent and total orders should be the headline numbers — big, clear, Naira-formatted.
- The per-seller breakdown should be sorted — highest spend at the top.
- Consider adding a simple visual representation: a basic proportional bar for each seller showing their share of total spend, even if it's just a CSS width trick. It makes the page feel more like an analytics view and less like a plain list.

---

**End of Day 3 Check — Before you sleep:**
- [ ] AI meal recommender shows a real response with meal combos and Naira math when tested.
- [ ] Asking with a tiny budget triggers the funny response (display it as-is).
- [ ] Admin dashboard shows real platform stats from the database.
- [ ] Admin AI assistant returns a relevant, data-grounded answer.
- [ ] Cafeteria AI assistant answers questions about today's orders.
- [ ] All three AI inputs have loading states while the request is in flight.
- [ ] Admin users list is paginated and functional.
- [ ] Admin orders list is filterable by status.

---

---

# DAY 4 — Polish & Demo Prep
**Goal: Everything looks clean, every error state is handled, the demo flow runs without friction.**

---

## Step 22 — Error State Audit

**What to do:** Go through every page and ask: "What does this look like if the API call fails?" 

**For every page that fetches data, handle these three states:**

1. **Loading state:** Show a spinner or skeleton layout. Never show a blank white screen while data loads.
2. **Success state:** The normal content.
3. **Error state:** A message explaining what went wrong. Use the `error` field from the backend response if available, or a generic fallback like "Something went wrong. Please try again."

**Specific error states to verify:**
- Cart page when cart is empty → friendly empty state with a "Browse Products" link.
- Orders page when the student has no orders → friendly empty state.
- Cafeteria orders dashboard when there are no orders → friendly empty state (especially important for filtered views like "No pending orders").
- Admin pages when the database has no records → empty state, not a crash.
- Any form submission that fails → the error message appears near the form, not in an alert popup.
- Add to Cart seller-lock error → the specific seller name appears in the error, and a "Clear Cart" button is visible.

---

## Step 23 — Mobile Responsiveness

**What to do:** Resize the browser to mobile width (375px or similar) and check every page.

**Minimum requirements for demo day:**
- No horizontal scrolling. If any page causes the user to scroll sideways on mobile, fix it.
- Navigation works. If you have a desktop navbar with many links, it should either collapse to a hamburger menu or simplify to just the most important links on mobile.
- The product cards should stack into a single column on mobile.
- The cart page should be fully usable on a small screen.
- The checkout flow should work on mobile.
- The AI input pages should be usable on mobile — text input and button readable and tappable.

**Why this matters:** Judges will almost certainly pull out a phone during the demo.

---

## Step 24 — Loading Indicators Across the App

**What to do:** Audit every single page that makes an API call and confirm it shows something while loading.

**Checklist:**
- [ ] Products page — spinner while products load
- [ ] Cafeteria menu page — spinner while menu loads
- [ ] Cart page — spinner on initial load; loading state on individual item controls
- [ ] Checkout — button disabled and shows "Placing order..." while request is in flight
- [ ] Orders list — spinner; "Refreshing..." indicator during polls
- [ ] Order detail — spinner
- [ ] Cafeteria orders dashboard — spinner; indicator during polls
- [ ] Admin dashboard — skeleton or spinner
- [ ] All three AI pages — clear loading state between submitting a question and getting a response

---

## Step 25 — Demo Flow Rehearsal

**What to build:** A clear mental model of the exact sequence you'll perform during the judging presentation.

**Know this flow by heart. Practice it at least twice with Victor:**

1. Open the browser. Navigate to the app. You're on the login page.
2. Log in as the **demo student** account.
3. Navigate to Cafeterias. Click on Mama Nkechi's Kitchen. Show the menu — point out that at least one item is tagged "Not Available Today."
4. Navigate to the AI Meal Recommender. Enter ₦1,500. Hit submit. Wait for the response. Narrate: "The AI pulls live menu data and recommends what they can actually order within budget — with the math shown."
5. Go back to the cafeteria menu. Add one available item to the cart.
6. Try to add an item from the **other** cafeteria (or a student vendor product). Show the seller-lock error message with the "Clear Cart" button. Narrate: "The system enforces one seller per order — this prevents split orders that a cafeteria can't fulfill."
7. Go to the cart. Proceed to checkout. Select Pickup. Place the order.
8. Go to the orders page. Show the new order with status "Pending."
9. Log out.
10. Log in as the **demo cafeteria** account (Mama Nkechi's).
11. Show the cafeteria orders dashboard. The new order from the student appears as Pending.
12. Click "Start Processing." Status updates to Processing.
13. Go to the cafeteria AI assistant. Type: "What is my best selling item today?" Show the response.
14. Log out.
15. Log in as the **demo admin** account.
16. Show the overview dashboard — user counts, order counts, total revenue.
17. In the AI assistant, type: "Give me a summary of today's activity." Show the response.
18. Done. Total time: under 5 minutes.

**Your job during the demo:** Drive the clicks. Know where every button is. Don't pause to read the screen — you should already know what's on it. Let Victor explain the technical decisions if judges ask.

---

## Step 26 — Pre-Demo Checklist

Run through this on the morning of the presentation:

**Auth flow:**
- [ ] Register works for student and cafeteria roles
- [ ] Login works for all 3 demo accounts
- [ ] Token persists after page refresh

**Demo account credentials — confirm with Victor and write them down:**
- Demo Student: username `___________` password `___________`
- Demo Cafeteria (Mama Nkechi's): username `___________` password `___________`
- Demo Admin: username `___________` password `___________`

**Shopping flow:**
- [ ] Products page loads with images
- [ ] Cafeteria menu shows unavailable items correctly
- [ ] Add to cart works
- [ ] Seller-lock error triggers and shows correct seller name
- [ ] Cart shows items and total
- [ ] Checkout places order and redirects correctly

**Cafeteria flow:**
- [ ] New order appears in cafeteria dashboard
- [ ] Status update works

**AI features:**
- [ ] Meal recommender returns a real response (test with ₦1,500)
- [ ] Admin AI assistant returns a real response
- [ ] Cafeteria AI assistant returns a real response

**General:**
- [ ] All pages have loading states
- [ ] All pages have empty states
- [ ] No broken images
- [ ] App works on mobile (resize browser to check)
- [ ] No console errors visible on any page

---

---

# General Rules to Follow Throughout

## Every Page You Build Needs These Three States

Never ship a page that only handles the success case. Before you call a page done, ask yourself:

1. **What does it look like while loading?** → spinner, skeleton, or disabled button
2. **What does it look like when it succeeds?** → the main UI
3. **What does it look like when it fails?** → an error message, not a blank screen

A page that crashes or goes blank on a failed API call loses trust with judges immediately.

---

## User Feedback — Every Action Needs a Reaction

When a user does something, they need to know what happened. For every action:
- **Immediate feedback:** Disable the button or show a spinner while the request is in flight.
- **Success feedback:** A brief success message ("Order placed!" / "Item added!" / "Status updated!"). A small toast notification is clean. A full page redirect also works for major actions like checkout.
- **Error feedback:** The specific error from the backend, shown near the action that caused it. Never swallow errors silently.

---

## Naira Formatting — Everywhere, Always

Every price on every page must be formatted as Naira. Build a helper function on Day 1 and use it everywhere:

- `₦800` for whole numbers or `₦800.00` if you want to be consistent — pick one format and stick to it
- Never show a raw number like `800` next to a price field
- Use it on product cards, cart subtotals, order totals, spending history, admin revenue — everywhere

---

## Polling vs Real-Time

The platform uses polling (calling the API every 30 seconds) for order status updates instead of WebSockets. This is intentional — simpler to build under time pressure. When you implement polling:
- Use `setInterval` inside `useEffect`.
- Clean up the interval by returning a cleanup function from `useEffect` that calls `clearInterval`. If you skip this, the interval keeps running even after the user navigates away from the page, causing stale requests and potential bugs.
- Don't show a jarring full reload every 30 seconds. Refetch the data silently and update the state — React will re-render only what changed.

---

## Communication With Victor

These are the things you must ask Victor to confirm before building the feature that depends on them:

- The exact shape of every API response — what fields come back, what types they are.
- The delivery fee amount (what value is in his `.env` — the spec says ₦200 but confirm).
- The demo account credentials before Day 4.
- Any time a new endpoint is added or an existing one changes URL, request body, or response shape.

Do not guess. Ask immediately. A wrong assumption about a response shape leads to silent bugs that are painful to trace.

---

## The Demo Is a Story

You are not demonstrating features. You are telling a story about a real student at Elizade University who doesn't know what to eat today. Every click in the demo is a chapter. Know the story cold. Tell it the same way every time.

---

*ByteNBite React Frontend Guide · [Partner] · June 2026*