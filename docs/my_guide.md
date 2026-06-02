# ByteNBite — Django Backend Developer Guide
### Elizade TechFest Hackathon 2026 · Victor's Build Reference (Updated)

> Tailored to your actual project structure. Picks up from where you stopped.
> You already have: members app with the User model done using normal Django auth.
> You still need: shop app, admin_panel app, all remaining models, all views, AI features, seeding.

---

## Your App Structure (Final)

| App | Owns |
|-----|------|
| `members` | User model, login, logout, register, profile (`/api/auth/`) |
| `student` | Student-specific views — browsing, cart, orders, AI recommender, spending (`/api/student/`) |
| `cafeteria` | Cafeteria-specific views — menu management, order management, AI assistant (`/api/cafeteria/`) |
| `shop` | Shared models only — Product, Cart, CartItem, Order, OrderItem. Also the public product browsing endpoints (`/api/products/`, `/api/cafeterias/`) |
| `admin_panel` | Admin-only views — overview stats, user list, order list, Admin AI assistant (`/api/admin/`) |

---

## Session Auth — What Your Partner Needs To Know

You're keeping Django's built-in session auth. This works differently from token auth. Here is what must happen so the React frontend can use it:

- Django's session auth uses a **session cookie** (`sessionid`) and a **CSRF token** to identify users. Both must be sent with every request from React.
- In `settings.py`, you must set `SESSION_COOKIE_SAMESITE = 'None'` and `SESSION_COOKIE_SECURE = False` (for development over HTTP). Without `SameSite=None`, the browser will block the session cookie from being sent cross-origin.
- Set `CSRF_COOKIE_SAMESITE = 'None'` and `CSRF_COOKIE_SECURE = False` as well.
- Set `CORS_ALLOW_CREDENTIALS = True` in settings. This tells Django to allow cookies in cross-origin requests.
- Set `CORS_ALLOWED_ORIGINS = ['http://localhost:5173']` — your partner's React dev server. Do NOT use `CORS_ALLOW_ALL_ORIGINS = True` when credentials are involved; they are mutually exclusive.
- Your partner on the React side must set `withCredentials: true` on every Axios request. This is what makes the browser send the session cookie and CSRF token cross-origin. Make sure Victor communicates this clearly on Day 1.
- For CSRF: your partner must read the `csrftoken` cookie and send it as the `X-CSRFToken` header on every non-GET request (POST, PUT, PATCH, DELETE). Django's `@csrf_exempt` on views is a shortcut but is a security hole — the right approach is sending the token properly.

Write all of this down and share it with your partner today so they set up Axios correctly from the start.

---

## How to Use This Guide

Work through it top to bottom, day by day. Each section tells you:
- **What to build** — the specific thing you're making
- **What it needs to know / do** — the logic and rules before you touch the keyboard
- **Watch out for** — traps that will waste your time

---

---

# WHERE YOU ARE NOW

You have completed:
- `members` app created and registered in `INSTALLED_APPS`
- Custom `User` model built (extends `AbstractUser`, has `role`, `full_name`, `matric_number`, `phone`, `profile_image`)
- `AUTH_USER_MODEL` set in `settings.py`
- Migrations run for the User model

---

# FINISH DAY 1 — Remaining Foundation Work

---

## Step 1 — Create the Two Missing Apps

**What to do:**
- Run `python manage.py startapp shop` and `python manage.py startapp admin_panel`.
- Register both in `INSTALLED_APPS` in `settings.py` immediately. Django ignores apps that aren't registered — models won't migrate, URLs won't be found.
- Create a `urls.py` file inside both new apps manually (Django doesn't create it for you with `startapp`).

---

## Step 2 — Auth Views in the `members` App

**What to build:** Register, login, logout, and profile views. These live in `members/views.py` and are served under `/api/auth/`.

**Understanding session auth flow:**
- When a user logs in, Django creates a session record in the database and sends a `sessionid` cookie to the browser. Every subsequent request from that browser automatically includes this cookie. Django reads it, looks up the session, and knows who the user is.
- `request.user` is Django's way of giving you the logged-in user inside any view. If the user is not logged in, `request.user` is an `AnonymousUser` object — it has no `role`, no `id`, nothing useful. Always check `request.user.is_authenticated` before trusting `request.user`.

### Register View
**What it needs:**
- Accept POST with: `username`, `password`, `role`, `full_name`, `matric_number` (only required if role is student).
- Validate that `role` is one of the three exact strings: `student`, `cafeteria`, `admin`. Return 400 if not.
- Check if the username already exists. Return 400 with a clear message if it does — don't let Django crash with a raw database integrity error.
- Create the user using `User.objects.create_user(username=..., password=...)`. This is mandatory — `create_user` hashes the password. Plain `create(...)` stores it as raw text and login will never work.
- After creating the user, log them in immediately using Django's `login(request, user)` function. This creates a session so the user is authenticated right after registration without needing to log in separately.
- Return the user's `id`, `role`, and `full_name` as JSON. Return 201.

### Login View
**What it needs:**
- Accept POST with `username` and `password`.
- Use Django's `authenticate(request, username=..., password=...)`. This checks the hashed password for you. Returns the user object if correct, `None` if wrong.
- If `authenticate` returns `None`, return 401 with `"Invalid username or password"`.
- If it returns a user, call `login(request, user)` to create the session. Return the user's `id`, `role`, and `full_name`.

### Logout View
**What it needs:**
- Call Django's `logout(request)`. This destroys the session.
- Return 200 success.
- No auth check needed — logging out when not logged in should just return 200.

### Profile (Me) View
**What it needs:**
- Check `request.user.is_authenticated`. If not, return 401.
- Return: `id`, `username`, `full_name`, `role`, `matric_number`, `phone`, and the profile image URL.
- For image URL: use `request.build_absolute_uri(request.user.profile_image.url)` if the image exists. If `profile_image` is null, return `null` in the JSON — don't crash.
- Never return the `password` field. Ever.

**Watch out for:**
- `login` and `logout` are imported from `django.contrib.auth` — not from your models file. `from django.contrib.auth import authenticate, login, logout`.
- The `me` endpoint must be GET only. If someone sends a POST to it, return 405 (Method Not Allowed).

---

## Step 3 — Role Guard Helper

**What to build:** A reusable helper function (put it in a `utils.py` file inside `members` or a top-level `utils.py`) that you call at the top of every protected view.

**What it needs:**
- A function that takes `request` and an optional `required_role`.
- First checks `request.user.is_authenticated`. If not → return a 401 JsonResponse.
- If `required_role` is provided, checks `request.user.role == required_role`. If not → return a 403 JsonResponse.
- If everything passes → returns `None` (meaning "no error, proceed").

**How you use it in every view:**
- Call the guard at the very top of the view function.
- If it returns something (a JsonResponse), immediately return that from your view.
- If it returns `None`, continue with the rest of the view logic.

This replaces writing the same auth check 20 times across every view. Write it once, use it everywhere.

---

## Step 4 — Standard Response Format

**What to build:** A mental pattern for all your JSON responses.

Every response follows one of two shapes:
- Success: `{"success": true, "data": {...}}`
- Error: `{"success": false, "error": "Human readable message"}`

Use `JsonResponse` from `django.http`. Pass a dict. Set `status=` to the correct HTTP code.

**Status codes to use:**

| Code | When |
|------|------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST that created something |
| 400 | Bad input, missing fields, business rule violation |
| 401 | Not logged in |
| 403 | Logged in but wrong role |
| 404 | Resource not found |
| 405 | Wrong HTTP method |
| 500 | Something broke — should not happen in demo |

**Watch out for:**
- `JsonResponse` only serializes dicts by default. If you need to return a list directly, pass `safe=False`. You'll hit this when returning lists of products or orders.
- Always parse the request body with `json.loads(request.body)` for JSON requests. Wrap it in a try/except — if the body is malformed JSON, `json.loads` throws and you should return 400.
- Exception: image upload views use `multipart/form-data`. In those views, use `request.POST` for text fields and `request.FILES` for the file. Do NOT call `json.loads` there.

---

## Step 5 — URL Configuration

**What to build:** Wire up all app URL files into the main project `urls.py`.

**What it needs:**
- Each app (`members`, `student`, `cafeteria`, `shop`, `admin_panel`) has its own `urls.py`. The main project `urls.py` includes all of them with `include()`.
- URL prefix structure:
  - `members` urls → `/api/auth/`
  - `shop` urls → `/api/` (public browsing endpoints like `/api/products/` and `/api/cafeterias/`)
  - `student` urls → `/api/student/`
  - `cafeteria` urls → `/api/cafeteria/`
  - `admin_panel` urls → `/api/admin/`
- Add the media files URL pattern in the main `urls.py` for serving uploaded images during development: `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.

**Watch out for:**
- The main project `urls.py` is in the project folder (same folder as `settings.py`), not inside any app. Don't confuse the two.
- Django matches URL patterns top to bottom and stops at the first match. If you have overlapping prefixes, order matters.

---

**End of Day 1 Check — Before you sleep:**
- [ ] All 5 apps created and registered in `INSTALLED_APPS`
- [ ] Session auth settings configured (`SESSION_COOKIE_SAMESITE`, `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOWED_ORIGINS`)
- [ ] Register, login, logout, and profile views work — test with a browser or Postman
- [ ] After login, hitting the profile endpoint without logging out returns the right user data
- [ ] After logout, hitting the profile endpoint returns 401
- [ ] `.env` is in `.gitignore` and not committed
- [ ] Your partner knows to set `withCredentials: true` on all Axios requests

---

---

# DAY 2 — Models and Core Commerce
**Goal: All remaining models built. Full shopping flow works end to end.**

---

## Step 6 — Product Model (in `shop` app)

**What to build:** `shop/models.py` — the `Product` model.

**What it needs:**
- `seller` — ForeignKey to `settings.AUTH_USER_MODEL`. Use `settings.AUTH_USER_MODEL` (the string `'members.User'`), not a direct import of your User class, to avoid circular import issues across apps.
- `name` — CharField.
- `price` — DecimalField. Set `max_digits=10, decimal_places=2`. This handles prices up to ₦99,999,999.99.
- `image` — ImageField. Required — no nullable. Every product must have a photo for the demo to look good.
- `is_available` — BooleanField. Default `True`.
- `seller_type` — CharField. Only two valid values: `cafeteria` or `student_vendor`. Use `choices` to enforce this at the model level.
- `created_at` — DateTimeField with `auto_now_add=True`. Sets itself when the record is created, never changes.

**Understanding ForeignKey across apps:**
- Because `Product` is in `shop` and `User` is in `members`, the ForeignKey string is `'members.User'` (appname.ModelName). Django resolves this at startup. Using the string instead of importing the class directly avoids circular imports.
- `product.seller` gives you the full User object. `product.seller_id` gives you just the integer ID (cheaper — no extra database query).

**Watch out for:**
- Run `python manage.py makemigrations shop` after defining this model. Then `python manage.py migrate`. Do this after every new model or field change.
- `ImageField` needs `Pillow` installed. You should have it from Day 1. If not: `pip install Pillow`.

---

## Step 7 — Cart and CartItem Models (in `shop` app)

**What to build:** Two models in `shop/models.py` that together represent a student's active cart.

### Cart Model
**What it needs:**
- `student` — OneToOneField to `settings.AUTH_USER_MODEL`. One student, one cart. If you try to create a second cart for the same student, Django will throw an integrity error.
- `seller` — ForeignKey to `settings.AUTH_USER_MODEL`, with `null=True, blank=True`. This is the "locked seller." It starts as null (empty cart) and gets set the moment the first item is added. Both `null=True` and `blank=True` are needed — `null=True` allows the database column to be NULL, `blank=True` tells Django's validation layer to also accept an empty value.
- `updated_at` — DateTimeField with `auto_now=True`. Updates every time the cart is saved.

**Understanding OneToOneField:**
- This means one Cart row per student, always. You use `Cart.objects.get_or_create(student=request.user)` in cart views — this either fetches the existing cart or creates a new one in a single atomic operation. It's the cleanest way to "get a student's cart."

### CartItem Model
**What it needs:**
- `cart` — ForeignKey to `Cart`. When a cart is deleted, its items should be deleted too — use `on_delete=models.CASCADE`.
- `product` — ForeignKey to `Product`.
- `quantity` — PositiveIntegerField. Default 1. `PositiveIntegerField` rejects zero and negative values at the database level.

---

## Step 8 — Order and OrderItem Models (in `shop` app)

**What to build:** Two models in `shop/models.py` that represent placed orders.

### Order Model
**What it needs:**
- `buyer` — ForeignKey to `settings.AUTH_USER_MODEL`. The student who placed the order.
- `seller` — ForeignKey to `settings.AUTH_USER_MODEL`. The cafeteria or vendor fulfilling the order. Use `related_name` on both ForeignKeys to avoid a clash — Django can't have two ForeignKeys to the same model on the same model without them having distinct `related_name` values. Example: `related_name='orders_as_buyer'` and `related_name='orders_as_seller'`.
- `total_amount` — DecimalField. The final total including any delivery fee. Calculated at checkout, stored permanently.
- `delivery_type` — CharField. Exactly `pickup` or `delivery`. Use choices.
- `delivery_fee` — DecimalField. `₦0.00` for pickup. Flat fee for delivery. Stored on the record so even if you change the fee later, old orders are unaffected.
- `status` — CharField. Five valid values: `pending`, `processing`, `ready`, `delivered`, `cancelled`. Use choices.
- `created_at` — DateTimeField with `auto_now_add=True`.
- `updated_at` — DateTimeField with `auto_now=True`.

### OrderItem Model
**What it needs:**
- `order` — ForeignKey to `Order`, `on_delete=models.CASCADE`.
- `product` — ForeignKey to `Product`.
- `quantity` — PositiveIntegerField.
- `price_at_time` — DecimalField. **This is a price snapshot.** When an order is placed, you read `product.price` at that moment and store it here. If the cafeteria changes the price of Jollof Rice tomorrow, this order still correctly shows what the student paid today. You never recalculate this from the current product price — once stored, it stays.

**Watch out for:**
- The `related_name` clash: if you have `buyer = ForeignKey(User)` and `seller = ForeignKey(User)` on the same model without distinct `related_name` values, Django will refuse to run migrations. Add `related_name='orders_placed'` to `buyer` and `related_name='orders_received'` to `seller`.

---

## Step 9 — Run All Migrations

After defining all four models (Product, Cart, CartItem, Order, OrderItem):
- `python manage.py makemigrations shop`
- `python manage.py migrate`

Confirm in the Django shell (`python manage.py shell`) that you can import and use each model without errors. If something is wrong, fix it now before building views on top of broken models.

---

## Step 10 — Public Product Browsing Views (in `shop` app)

**What to build:** Four endpoints anyone can access — no login required. These live in `shop/views.py` and are routed under `/api/`.

**No auth check on any of these. They are fully public.**

### GET `/api/products/`
- Query all `Product` objects where `is_available=True`.
- For each product, return: `id`, `name`, `price`, `image URL`, `is_available`, `seller_type`, `seller_id`, `seller_full_name`.
- Image URL: use `request.build_absolute_uri(product.image.url)`. This builds the full `http://localhost:8000/media/...` URL. Your partner needs the full URL to display images.

### GET `/api/products/<id>/`
- Look up a single product by ID. Return 404 if it doesn't exist.
- Return full product details including all seller info.

### GET `/api/cafeterias/`
- Query all `User` objects where `role='cafeteria'`.
- Return: `id`, `full_name`, and the profile image URL for each.

### GET `/api/cafeterias/<id>/menu/`
- Look up the User by ID. If their `role` is not `cafeteria`, return 404.
- Return ALL products where `seller=that_user` — both available and unavailable items. Include `is_available` in every product object. This is the feature that solves "walking to the cafeteria for nothing" — unavailable items are shown so students know what exists but isn't ready today.

**Watch out for:**
- When querying `User` objects from the `shop` app, import the User model as `from django.contrib.auth import get_user_model` and call `User = get_user_model()` at the top of the file. This is the correct cross-app way to reference the User model — cleaner than a direct import from `members.models`.

---

## Step 11 — Cafeteria Menu Management Views (in `cafeteria` app)

**What to build:** Full CRUD for a cafeteria's own menu. These live in `cafeteria/views.py` under `/api/cafeteria/menu/`.

**Every view here:** Call the role guard helper → confirm `cafeteria` role → proceed.

### GET `/api/cafeteria/menu/`
- Return all products where `seller=request.user`. Both available and unavailable.

### POST `/api/cafeteria/menu/`
- Accept: `name` and `price` from `request.POST`, and `image` from `request.FILES`.
- Create the product with `seller=request.user` and `seller_type='cafeteria'`.
- Return the created product with status 201.

### PUT `/api/cafeteria/menu/<id>/`
- Look up the product by ID. If it doesn't exist → 404. If `product.seller != request.user` → 403. A cafeteria cannot edit another cafeteria's menu items.
- Accept updated `name`, `price`, and optionally a new `image`. If no new image is provided in `request.FILES`, keep the existing one — don't overwrite it with nothing.
- Save and return the updated product.

### PATCH `/api/cafeteria/menu/<id>/toggle/`
- Look up and verify ownership (same as PUT).
- Flip `is_available`: `product.is_available = not product.is_available`. Save.
- Return the updated product. The frontend uses the returned `is_available` value to update the toggle button state.

### DELETE `/api/cafeteria/menu/<id>/`
- Look up and verify ownership.
- Delete. Return 200 success.

**Watch out for:**
- Image uploads arrive in `request.FILES`, not `request.POST`. They only appear there if the request was sent as `multipart/form-data` (which your partner handles using `FormData` in JavaScript). Make sure you communicate this to your partner — they must NOT send image uploads as JSON.

---

## Step 12 — Cafeteria Order Views (in `cafeteria` app)

**What to build:** Two views. These live in `cafeteria/views.py` under `/api/cafeteria/orders/`.

### GET `/api/cafeteria/orders/`
- Role guard → `cafeteria`.
- Return all orders where `seller=request.user`, ordered by `created_at` descending (newest first).
- Optional status filter: check `request.GET.get('status')`. If provided, add `.filter(status=that_value)` to the query.
- For each order, include: `id`, `buyer full_name`, `delivery_type`, `total_amount`, `status`, `created_at`, and a list of all order items (product name, quantity, price at time).

### PATCH `/api/cafeteria/orders/<id>/status/`
- Role guard → `cafeteria`.
- Look up the order. If `order.seller != request.user` → 403.
- Parse the request body for `{"status": "processing"}`.
- Validate the transition. Build this as a dict mapping each current status to what it's allowed to move to:
  - `pending` can move to → `processing` or `cancelled`
  - `processing` can move to → `ready` or `delivered`
  - `ready`, `delivered`, `cancelled` → no further transitions allowed
- If the requested status is not in the allowed list for the current status, return 400 with a specific message explaining what transitions are valid.
- Update, save, return the updated order.

---

## Step 13 — Student Vendor Product Views (in `student` app)

**What to build:** Full CRUD for a student's own product listings. Lives in `student/views.py` under `/api/student/vendor/`.

**Every view:** Role guard → `student`.

The structure is identical to the cafeteria menu management (Step 11). The differences:
- Role check is `student` instead of `cafeteria`.
- When creating, set `seller_type='student_vendor'`.
- Ownership check is the same — only the seller can edit their own listings.

Don't copy-paste blindly. Keep the role check and seller_type correct.

---

## Step 14 — Cart Views (in `student` app)

**What to build:** Five cart endpoints in `student/views.py` under `/api/student/cart/`.

**Every view:** Role guard → `student`.

### GET `/api/student/cart/`
- `Cart.objects.get_or_create(student=request.user)` — get or create the cart.
- Fetch all `CartItem` objects for this cart using `CartItem.objects.filter(cart=cart).select_related('product')`. The `select_related('product')` fetches product data in the same query instead of one query per item.
- Return: list of items (cart_item_id, product_id, product_name, image_url, price, quantity, subtotal), cart total (sum of all subtotals, calculated in Python), and seller info if the cart is locked.

### POST `/api/student/cart/add/`
- Parse body for `product_id` and `quantity`.
- Look up the product. If not found → 404. If `is_available` is False → return 400: "This item is not currently available."
- Get or create the cart.
- **Seller-lock check — the most important logic in this view:**
  - If `cart.seller` is not None (cart already has items), compare `product.seller_id` with `cart.seller_id`.
  - If they differ → return 400 with: `"Your cart already has items from [cart.seller.full_name]. Clear your cart first to order from a different seller."`
  - If `cart.seller` is None (empty cart) → set `cart.seller = product.seller`, save the cart.
- Check if a `CartItem` already exists for this product in this cart. If yes → increment its quantity. If no → create a new `CartItem`.
- Return the updated cart contents.

### PUT `/api/student/cart/update/<item_id>/`
- Look up the `CartItem`. Confirm it belongs to `request.user`'s cart — check `item.cart.student == request.user`. If not → 403.
- Parse body for `quantity`.
- If `quantity` is 0 → delete the item.
- Otherwise → update quantity, save.
- After any deletion, check if the cart now has zero items. If yes → set `cart.seller = None`, save the cart (remove the seller lock).
- Return the updated cart.

### DELETE `/api/student/cart/remove/<item_id>/`
- Look up, verify ownership, delete the item.
- Check if cart is now empty → clear seller lock if so.
- Return 200 success.

### DELETE `/api/student/cart/clear/`
- Get the cart.
- `CartItem.objects.filter(cart=cart).delete()` — deletes all items in one query.
- Set `cart.seller = None`, save.
- Return 200 success.

**Watch out for:**
- The seller-lock error message must include the seller's name dynamically — not a hardcoded string. Your partner must display this exact message and show a "Clear Cart" button alongside it. Confirm this with your partner.
- After deleting the last item, always clear the seller lock. A cart with zero items but a locked seller will block the student from adding anything — the lock should only exist when there are actual items in the cart.

---

## Step 15 — Checkout View (in `student` app)

**What to build:** The most important single view in the whole project. Lives in `student/views.py` at `/api/student/orders/checkout/`.

**What it needs:**
- Role guard → `student`.
- Get the cart. If it has no items → return 400: "Your cart is empty."
- Parse body for `delivery_type`. Must be exactly `pickup` or `delivery`. Return 400 if anything else.
- Calculate `delivery_fee`: if `pickup` → `Decimal('0.00')`. If `delivery` → read from `os.getenv('DELIVERY_FEE')`, convert to `Decimal`. Use `Decimal` (from Python's `decimal` module), not `float`, for all monetary math. Floats have rounding errors — Decimal does not.
- Calculate subtotal: loop through all CartItems, sum `item.product.price * item.quantity`.
- `total_amount = subtotal + delivery_fee`.
- **Wrap everything from here in `transaction.atomic()`:** This means either all of the following saves succeed together, or none of them do. If an OrderItem fails to create halfway through, the Order is also rolled back automatically. This prevents partial/broken orders in the database.
  - Create the `Order` record: `buyer=request.user`, `seller=cart.seller`, `total_amount`, `delivery_type`, `delivery_fee`, `status='pending'`.
  - Loop through CartItems again. For each one, create an `OrderItem` with `price_at_time=item.product.price` — snapshot the price right now.
  - Clear the cart: `CartItem.objects.filter(cart=cart).delete()`. Set `cart.seller = None`, save.
- Return the new order's full details with status 201.

**Watch out for:**
- `transaction.atomic()` is imported from `django.db`. It's used as a context manager: `with transaction.atomic(): ...`. Everything indented inside the `with` block is part of the transaction.
- Never calculate the total on the frontend and send it to the backend. The backend calculates it. The frontend can display a preview, but the backend's number is the real one that gets stored.

---

## Step 16 — Student Order Viewing Views (in `student` app)

**All views:** Role guard → `student`.

### GET `/api/student/orders/`
- Return all orders where `buyer=request.user`, ordered by `-created_at` (newest first).
- For each order: `id`, `seller full_name`, `total_amount`, `delivery_type`, `delivery_fee`, `status`, `created_at`.

### GET `/api/student/orders/<id>/`
- Look up the order. If `order.buyer != request.user` → 403. A student must never see another student's order.
- Return full order detail: all OrderItems (product name, quantity, price_at_time, subtotal per item), plus order-level fields.

### GET `/api/student/orders/spending/`
- Query all orders where `buyer=request.user`.
- Calculate: `total_spent` (aggregate sum of `total_amount`), `total_orders` (count).
- Per-seller breakdown: use Django ORM's `values('seller__full_name').annotate(amount_spent=Sum('total_amount'))`. This groups orders by seller and sums the total per seller in a single query. Return the result as a list.
- Return all three pieces of data together.

**Watch out for:**
- `Sum` is imported from `django.db.models`. `values()` + `annotate()` is Django's equivalent of SQL `GROUP BY`. It's one of the most useful ORM patterns — know how it works.

---

**End of Day 2 Check — Before you sleep:**
- [ ] All 5 models exist and are migrated — no migration errors
- [ ] Public products endpoint returns data with full image URLs
- [ ] Cafeteria menu page shows both available and unavailable items
- [ ] Cafeteria can add a menu item with an image (test this specifically — image uploads are tricky)
- [ ] Add to cart works — seller-lock triggers and returns the correct seller name in the message
- [ ] Clearing cart removes the seller lock — a new item from a different seller can then be added
- [ ] Checkout creates an order, snapshots prices, clears the cart, returns 201
- [ ] Cafeteria sees the new order in their dashboard
- [ ] Cafeteria can transition an order through its full status lifecycle

---

---

# DAY 3 — AI Features + Admin
**Goal: All three AI endpoints return real, database-grounded responses. Admin dashboard works.**

---

## Step 17 — Groq SDK Setup

**What to build:** Configure the Groq client before writing any AI view.

**What it needs:**
- Your `GROQ_API_KEY` is in `.env`. Load it in `settings.py` using `python-dotenv`. Access it in views via `from django.conf import settings` and `settings.GROQ_API_KEY` — keep settings centralized, don't call `os.getenv` directly inside views.
- In your AI views file, instantiate the Groq client once at module level (outside any function). This creates one client object that all requests share, rather than creating a new one on every request.
- Model to use for all three features: `llama-3.3-70b-versatile`.
- Every call to Groq follows the same pattern: send a list of messages with two entries — a `system` message (your instructions + database context) and a `user` message (the actual question). The `system` message is what shapes the AI's behavior. The `user` message is what triggers the response.

**Watch out for:**
- Groq calls can fail — network issues, rate limits, API errors. Wrap every Groq call in a try/except. If it fails, return a 500 with `"AI service temporarily unavailable"`. Never let a Groq exception crash your view.

---

## Step 18 — Student Budget Meal Recommender (in `student` app)

**Endpoint:** POST `/api/student/ai/meal-recommender/`

**What it needs:**
- Role guard → `student`.
- Parse body for `amount` (required) and `cafeteria_id` (optional).
- If `amount` is missing or not a number → return 400.

**Database step — do this before calling Groq:**
- Query all Products where `is_available=True` and `seller_type='cafeteria'`.
- If `cafeteria_id` was provided, also filter by `seller_id=cafeteria_id`. If that cafeteria doesn't exist or has no available items, return 400 before calling Groq — don't send an empty menu to the AI.
- Format the menu as a readable text block, grouped by cafeteria. Example format: `"Mama Nkechi's Kitchen: Jollof Rice ₦800, Fried Rice ₦700, Chicken ₦500 | Campus Corner: Beans ₦400, Bread ₦200"`. The AI reads this text, so clarity in your formatting directly affects the quality of the response.

**System prompt — include ALL of these rules:**
- Only recommend food from ONE cafeteria per response. Never mix items from different cafeterias in a single meal plan.
- Always show the math: list each recommended item with its price, add them up, show how much of the budget is left over.
- If the budget is less than the cheapest available item in the entire menu, humorously roast the student. Funny, not cruel. Suggested direction: something about garri being more realistic.
- If the budget is ₦10,000 or above, first advise the student to reconsider spending that much on food or think about investing it — then proceed to give food combinations anyway.
- Offer 2–3 different combination options where the budget allows so the student has choices.
- Use ONLY the prices from the menu data provided. Do not invent any prices.

**User message:** Keep it simple — `"I have ₦[amount] to spend on food. What can I get?"`. The system prompt carries all the rules.

- Call Groq, extract the text from the response content, return it as `{"success": true, "recommendation": "..."}`.

---

## Step 19 — Admin AI Dashboard Assistant (in `admin_panel` app)

**Endpoint:** POST `/api/admin/ai/assistant/`

**What it needs:**
- Role guard → `admin`.
- Parse body for `question`.

**Database snapshot — fetch all of this before calling Groq:**
- User counts by role: how many students, how many cafeterias.
- Order counts by status: pending, processing, ready, delivered, cancelled — use `values('status').annotate(count=Count('id'))`.
- Total platform revenue: `Order.objects.aggregate(total=Sum('total_amount'))`.
- Top 3 cafeterias by order count: group orders by seller, count them, sort by count descending, take the top 3.
- Top 5 most ordered products: group OrderItems by product name, sum quantities, sort descending, take top 5.
- Orders created today: filter by `created_at__date=timezone.now().date()`.

Format all of this as a clean, readable block of plain text. This is the AI's briefing document for the question it's about to answer.

**System prompt:**
- You are a data assistant for the Vice Chancellor of Elizade University.
- You have been given a snapshot of the campus commerce platform's current data.
- Answer the question using ONLY the data provided. Do not invent any numbers or make assumptions beyond the data.
- Be professional, clear, and concise. Deliver insights like a sharp briefing, not a casual chat.

Return `{"success": true, "answer": "..."}`.

**Watch out for:**
- Use `from django.utils import timezone` for timezone-aware date comparisons. `timezone.now().date()` is the correct way to get today's date in Django — not `datetime.now()`, which is timezone-naive and can give wrong results.

---

## Step 20 — Cafeteria AI Order Analytics Assistant (in `cafeteria` app)

**Endpoint:** POST `/api/cafeteria/ai/assistant/`

**What it needs:**
- Role guard → `cafeteria`.
- Parse body for `question`.

**Database snapshot — fetch THIS cafeteria's data only:**
- All orders today where `seller=request.user` and `created_at__date=today`. Count them and sum their `total_amount`.
- Order count by status for today (filter to today's orders, group by status).
- Item-level breakdown: query `OrderItem.objects.filter(order__seller=request.user, order__created_at__date=today)` — this uses Django's double-underscore notation to filter across related models (from OrderItem, reach into its related Order, then check that Order's fields). Group by product name, sum quantities, sort descending.

Format as a readable text block. Example: `"Today's orders: 23 total. Revenue: ₦47,500. By status: 3 pending, 8 processing, 12 delivered. Top items: Jollof Rice x31, Fried Rice x22, Chicken x18."`

**System prompt:**
- You are an order analytics assistant for a campus cafeteria.
- You have today's order data for this specific cafeteria.
- Answer the question using only the provided data.
- Be practical and direct. The cafeteria owner is busy — give clear, actionable answers.

Return `{"success": true, "answer": "..."}`.

**Watch out for:**
- The double-underscore lookup `order__seller=request.user` is how Django traverses relationships in queries. `order__` means "go into the related Order model," then `seller` is the field on that Order. `order__created_at__date` means "the `date` part of the `created_at` field on the related Order." This is one of Django's most powerful ORM features.

---

## Step 21 — Admin Overview and List Views (in `admin_panel` app)

**All views:** Role guard → `admin`.

### GET `/api/admin/overview/`
- Aggregate and return in one response:
  - User counts by role (query User, group by role, count each)
  - Order counts by status (query Order, group by status, count each)
  - Total platform revenue (aggregate sum of `total_amount` across all orders)
  - Count of active products (`Product.objects.filter(is_available=True).count()`)

### GET `/api/admin/users/`
- Return a paginated list of all users: `id`, `username`, `full_name`, `role`, `date_joined`.
- Use Django's built-in `Paginator` class: `Paginator(queryset, per_page=20)`. Accept `?page=N` query param via `request.GET.get('page', 1)`.
- Return: `total_count`, `total_pages`, `current_page`, and the list of users for that page.

### GET `/api/admin/orders/`
- Return a paginated list of all orders: `id`, `buyer full_name`, `seller full_name`, `total_amount`, `status`, `delivery_type`, `created_at`.
- Optional status filter via `?status=pending`.
- Same pagination pattern as the users list.

---

## Step 22 — Begin Database Seeding

**What to build:** A Django management command that populates the database with demo data.

**Why a management command and not a script:**
- A management command is run with `python manage.py seed_demo`. You can run it as many times as you want — just wipe the database and run it again.
- To create one: inside any app (e.g., `members`), create a folder called `management/`, inside that `commands/`, inside that a file called `seed_demo.py`. This file contains a class that extends `BaseCommand` with a `handle` method. Everything in `handle` runs when you call the management command.

**What to seed (start with this today, finalize tomorrow):**
- 1 admin user
- 2 cafeteria users with distinct names
- 5 food items for Cafeteria 1, 5 food items for Cafeteria 2 (at least one item per cafeteria marked `is_available=False`)
- 2 student users
- A few sample orders with mixed statuses

**Use `get_or_create` for everything in the seed command.** This way running it twice doesn't crash or create duplicates. The pattern: `User.objects.get_or_create(username='demo_student', defaults={...})` — if the username exists, it returns it; if not, it creates it with the given defaults.

**Watch out for:**
- For seeded users, still use `set_password('yourpassword')` and then `.save()` after creating the user object — or use `create_user()` from the start. Plain assignment to the `password` field won't hash it.

---

**End of Day 3 Check — Before you sleep:**
- [ ] Meal recommender returns a real response with food combos and math
- [ ] Asking with a low budget (₦50) triggers the roast response
- [ ] Asking with ₦10,000+ triggers the investment warning before the food combos
- [ ] Admin AI assistant uses real database numbers in its answer — verify by checking the counts yourself
- [ ] Cafeteria AI assistant gives accurate answers about today's order data
- [ ] Admin overview returns correct aggregated stats
- [ ] Basic seeding works — demo accounts and products exist in the database

---

---

# DAY 4 — Polish + Demo Prep
**Goal: Bulletproof demo data, all integration bugs fixed, demo flow rehearsed.**

---

## Step 23 — Complete Database Seeding

**Finalize the seed command so the demo database looks real.**

**Minimum final state:**
- 1 admin account — credentials agreed with your partner
- 2 cafeteria accounts — "Mama Nkechi's Kitchen" and one other. Both have full menus. At least one unavailable item per cafeteria.
- 3 student accounts — at least one with existing order history so the spending page isn't empty
- 10+ food items total across both cafeterias with realistic Nigerian food names and prices
- 5+ orders with mixed statuses across both cafeterias
- At least 1 pending order at each cafeteria so the demo can show the live status update flow

**Write down the demo credentials. Share them with your partner today. Both of you must know them cold before the presentation.**

| Account | Username | Password |
|---------|----------|----------|
| Demo Student | | |
| Demo Cafeteria (Mama Nkechi's) | | |
| Demo Admin | | |

---

## Step 24 — Integration Bug Fixes

**What to do:** Sit with your partner and run the full demo flow together. Watch the network requests while they drive the frontend.

**Specifically verify:**
- Images display correctly in the browser. If broken image icons appear, check that `MEDIA_URL` and `MEDIA_ROOT` are configured correctly and that the media URL pattern is in the main `urls.py`.
- The seller-lock error message contains the seller's full name, not a generic message.
- Checkout calculates the correct total when delivery is selected — confirm the fee from `.env` is being loaded.
- Order status updates from the cafeteria dashboard reflect correctly when the student checks their orders page.
- All three AI responses are coherent and reference real numbers from the database.
- Admin overview stats match what's actually in the database.

---

## Step 25 — Final Endpoint Verification

Go through every endpoint once. Hit it with the right credentials. Confirm the response shape is correct.

**Auth (members):**
Register (student) → Register (cafeteria) → Login → Profile → Logout → Confirm profile returns 401 after logout.

**Public (shop):**
All products → Single product → Cafeteria list → Cafeteria menu (confirm unavailable items appear).

**Cafeteria (cafeteria):**
Menu list → Add item with image → Edit item → Toggle availability → Delete item → Order list → Order list filtered by status → Update order through full lifecycle.

**Student — vendor (student):**
Vendor products list → Add product → Toggle → Delete.

**Student — cart (student):**
Add item → Trigger seller-lock error (add from second seller) → Update quantity → Remove item → Clear cart → Confirm seller lock is gone → Add from new seller successfully.

**Student — orders (student):**
Checkout with pickup → Checkout with delivery (confirm fee in total) → Order list → Single order detail → Spending summary.

**Admin (admin_panel):**
Overview stats → User list (page 1) → User list (page 2) → Order list → Order list filtered by status.

**AI:**
Meal recommender (₦1,500, specific cafeteria) → Meal recommender (₦50, expect roast) → Meal recommender (₦15,000, expect investment warning first) → Admin assistant (ask a real question, verify numbers) → Cafeteria assistant (ask about today's sales).

---

## Step 26 — Know Your Role in the Demo

**You are driving the backend.** During the demo, your partner drives the frontend. Your job is to be ready to explain the technical decisions if a judge asks.

**Things judges commonly ask — know these answers:**

- **"Why not use Django REST Framework?"** — Time constraint. Manual JSON views gave us full control without learning DRF's abstractions under hackathon pressure.
- **"How does the one-seller-per-cart restriction work?"** — The Cart model stores a locked seller field. When the first item is added, the seller is saved to the cart. Every subsequent add-to-cart checks that the new product's seller matches the locked one. If not, the backend rejects it with a clear message.
- **"How do the AI features work?"** — Before calling Groq, we fetch live data from the database and format it as text. We inject that text into the system prompt as context. The model reasons over real numbers from our database — it never invents data.
- **"Why is price_at_time stored separately on each order item?"** — Product prices can change after an order is placed. By snapping the price at order time and storing it permanently, old orders always reflect what the student actually paid.
- **"What happens if two students order the same last item?"** — The database handles concurrency at the query level. For a hackathon demo with SQLite, this is acceptable. In production you'd use `select_for_update()` inside a transaction.

---

---

# General Rules — Apply These Throughout

## Every View Follows This Checklist (In Order)

1. Is the request method what this view expects? (GET vs POST etc.) → Return 405 if wrong.
2. Is the user authenticated? → Run role guard. Return 401 if not.
3. Does the user have the right role? → Return 403 if wrong role.
4. Does the resource exist? → Query it. Return 404 if not found.
5. Does the user own this resource? → Check ownership. Return 403 if not.
6. Is the request body valid? → Check required fields, correct types. Return 400 with a specific message if not.
7. Do the business rules allow this? → Seller-lock, valid status transition, budget check etc. Return 400 if not.
8. Do the database operation.
9. Return 200 or 201 with the correct data shape.

Never skip steps. Never assume. Every view should be defensive.

---

## Cross-App Model Imports

Because your models are spread across apps, you will import them across app boundaries. The right patterns:

- To reference the User model in any app's `models.py`: use `settings.AUTH_USER_MODEL` (a string) as the ForeignKey target — not a direct import.
- To get the User class in a view or anywhere outside `models.py`: `from django.contrib.auth import get_user_model` then `User = get_user_model()`.
- To import Product, Cart, Order etc. in views: direct import is fine — `from shop.models import Product, Cart, Order, OrderItem, CartItem`.

---

## Image URLs — Always Build the Full URL

Never return a raw image field value. `product.image` returns something like `products/jollof.jpg` — a relative path. Your partner's React app on port 5173 can't display that.

Always use `request.build_absolute_uri(product.image.url)` to get the full URL: `http://localhost:8000/media/products/jollof.jpg`. Use this pattern everywhere you return an image — products, user profile images, everywhere.

---

## Use Decimal for All Money Math

Python's `float` type has floating point rounding errors. `800.0 + 200.0` might give `999.9999999` in float arithmetic. For prices and totals, always use Python's `Decimal` type: `from decimal import Decimal`. When reading the delivery fee from `.env` (which comes in as a string), convert with `Decimal(os.getenv('DELIVERY_FEE'))`.

---

## The Most Important Thing

**The AI features win the hackathon.** Every other team will have a product listing and a cart. Not every team will have three AI assistants returning database-grounded, context-aware answers in plain English.

If commerce features are running behind on Day 2, simplify them — but do not cut into Day 3 AI time. Protect it.

---

*ByteNBite Django Backend Guide (Updated) · Victor · June 2026*