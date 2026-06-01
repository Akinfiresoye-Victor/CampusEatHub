# ByteNBite — Django Backend Developer Guide
### Elizade TechFest Hackathon 2026 · Victor's Build Reference

> This guide walks you through every backend responsibility from project setup to demo prep.
> No code. Pure step-by-step thinking so you always know what to build, in what order, and why.

---

## How to Use This Guide

Work through it top to bottom, day by day. Each section tells you:
- **What to build** — the specific thing you're making
- **What it needs to know / do** — the logic and rules to have in your head before you touch the keyboard
- **Watch out for** — common traps that will waste your time if you hit them

Do not skip ahead. Day 2's work depends on Day 1 being solid.

---

---

# DAY 1 — Foundation
**Goal: Register, login, and logout work. The token system works. Your partner can make authenticated requests.**

---

## Step 1 — Project Setup & Configuration

**What to build:** A new Django project with the correct settings from the start.

**What it needs:**
- Create a virtual environment before you install anything. Keep your dependencies clean.
- Install all your packages at once on Day 1: `django`, `django-cors-headers`, `pillow`, `python-dotenv`, `groq`. Install them all now so you don't get interrupted later.
- Your project should have one app. Call it something clear like `api` or `core`. All your models, views, and URLs live there.
- In `settings.py`, you need to point `INSTALLED_APPS` at your new app AND at `corsheaders`.
- Add `corsheaders.middleware.CorsMiddleware` to your `MIDDLEWARE` list. It must come **before** Django's `CommonMiddleware` — order matters here. CORS middleware intercepts requests before Django processes them, so if it comes after, it's too late.
- Set `CORS_ALLOW_ALL_ORIGINS = True` for now. You can tighten this after the hackathon.
- Configure `MEDIA_URL` and `MEDIA_ROOT`. `MEDIA_URL` is the URL prefix (e.g., `/media/`). `MEDIA_ROOT` is the folder path on your machine where uploaded images actually get saved (e.g., `BASE_DIR / 'media'`). Both must be set, and you must add a URL pattern that serves media files during development.
- Set up your `.env` file immediately. Load it in `settings.py` using `python-dotenv`. Your `.env` needs: `DJANGO_SECRET_KEY`, `GROQ_API_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DELIVERY_FEE`.
- Add `.env` to `.gitignore` before your first commit. Do this now — not later.

**Watch out for:**
- If you forget to add `corsheaders` to `INSTALLED_APPS`, the CORS headers won't be sent even if the middleware is there.
- If `MEDIA_ROOT` folder doesn't exist, Django will error on the first image upload. Create the folder or let Django create it — but confirm it exists before Day 2.

---

## Step 2 — Custom User Model

**What to build:** A `User` model that extends Django's `AbstractUser` and adds role, full name, matric number, phone, and profile image.

**What it needs:**
- You must use `AbstractUser`, not `AbstractBaseUser`. `AbstractUser` gives you `username`, `password`, `email`, `date_joined`, `is_active`, and all of Django's auth machinery for free. You just add extra fields on top.
- The extra fields are: `role` (a CharField limited to the choices `student`, `cafeteria`, `admin`), `full_name` (a CharField), `matric_number` (a CharField that is nullable — only students have this), `phone` (nullable CharField), and `profile_image` (an ImageField that is nullable).
- After defining the model, set `AUTH_USER_MODEL = 'yourappname.User'` in `settings.py`. Django needs to know which model is the "official" user model for the whole project.
- Run migrations immediately after defining this model. **Do this before building anything else.** Changing `AUTH_USER_MODEL` after migrations have been applied is painful. Get it right on Day 1.
- Think about role validation: the `role` field should only accept exactly those three strings. Use `choices` on the CharField to enforce this at the model level.

**Watch out for:**
- Never change `AUTH_USER_MODEL` after you've run your first migration in a project. It requires a complete database wipe. Set it correctly now.
- `matric_number` should be `null=True, blank=True` — `null=True` makes the database column accept NULL, `blank=True` makes the Django form validator accept an empty string. You need both for truly optional fields.
- `ImageField` requires `Pillow` to be installed. You installed it in Step 1, so you're fine.

---

## Step 3 — AuthToken Model

**What to build:** A model that stores one login token per user.

**What it needs:**
- Fields: `user` (a OneToOneField pointing to your User — one user, one token, always), `key` (a CharField storing the actual token string — 40 random characters), `created_at` (a DateTimeField set automatically on creation).
- OneToOneField means if a user already has a token and logs in again, you don't create a second one — you update the existing one. This is by design.
- The token string itself is generated in the login view, not in the model. The model just stores whatever is given to it.
- For generating a 40-character token, Python's `secrets` module (built into Python's standard library — no install needed) has a method for this. Know where to look when you get there.

**Watch out for:**
- The `key` field should be unique. Two users should never have the same token string. Add `unique=True` to the field.

---

## Step 4 — The Token Helper (Reusable Auth Logic)

**What to build:** A helper function you write once and reuse in every protected view.

**What it needs:**
- This helper receives a Django `request` object and returns either the authenticated `User` or `None`.
- Its job: look at the `Authorization` header of the request. The header format is `Token <40-character-string>`. Split on the space, grab the second part (the actual token), look it up in the `AuthToken` table, and return the user attached to that token.
- If the header is missing, malformed, or the token doesn't exist in the database, return `None`.
- Every protected view starts with: call this helper → if it returns `None`, immediately return a 401 JSON response → if it returns a user, continue.
- You will also want a role-check pattern: after confirming the user exists, check `user.role == 'student'` (or whichever role the view requires). If wrong role, return a 403.

**Watch out for:**
- The `Authorization` header is accessed in Django as `request.META.get('HTTP_AUTHORIZATION')`. Django transforms all headers — it prefixes them with `HTTP_` and uppercases them and replaces hyphens with underscores.
- Always handle the case where the header exists but has an unexpected format (e.g., it's missing the space, or has extra spaces). A simple check before splitting will prevent a crash.

---

## Step 5 — Standard Response Format

**What to build:** A mental pattern (or a tiny helper function) for all your JSON responses.

**What it needs:**
- Every response from every view must follow one of two shapes. Success: `{"success": true, "data": {...}}`. Error: `{"success": false, "error": "Human readable message"}`.
- Pair this with the right HTTP status code: 200 for successful GET/PATCH/DELETE, 201 for successful POST that creates something, 400 for bad input, 401 for missing/invalid token, 403 for wrong role, 404 for not found.
- Using `JsonResponse` from `django.http` is your tool here. You can pass a dict directly to it. Remember to set `status=` to the right code when it's not 200.

**Watch out for:**
- `JsonResponse` by default only serializes dicts. If you pass a list directly, you need `safe=False`. You'll hit this when returning lists of products or orders.

---

## Step 6 — Auth Views

**What to build:** Four views — register, login, logout, me.

### Register
**What it needs:**
- Accept POST with: `username`, `password`, `role`, `full_name`, `matric_number` (if the role is student).
- Validate that `role` is one of the three allowed values. Return a clear 400 error if it's not.
- Check if the `username` already exists. If it does, return 400 with a clear message — don't let Django crash with a raw database error.
- Create the user. Use `User.objects.create_user(username=..., password=...)` — not `User.objects.create(...)`. `create_user` hashes the password automatically. Plain `create` stores the password as raw text and login will never work.
- After creating the user, immediately generate a token and save it to `AuthToken`. This way registration logs the user in automatically — no need to make two requests.
- Return the token, user ID, role, and full name. Same shape as the login response.

### Login
**What it needs:**
- Accept POST with `username` and `password`.
- Use Django's `authenticate(username=..., password=...)` function. This is Django's built-in login checker — it checks the hashed password for you. It returns the user object if correct, or `None` if wrong.
- If `authenticate` returns `None`, return a 401 with `"Invalid username or password"`.
- If the user exists, look up their `AuthToken`. If they already have one, update the key. If they don't have one, create it. This handles the case where someone is logging in for the first time after registering (they should already have a token from registration, but be defensive).
- Return: `token`, `user_id`, `role`, `full_name`.

### Logout
**What it needs:**
- Requires a valid token in the header. Run the token helper first.
- Simply delete the `AuthToken` row for this user.
- Return 200 success.

### Me
**What it needs:**
- Requires a valid token. Run the token helper first.
- Return the user's profile data: `id`, `username`, `full_name`, `role`, `matric_number`, `phone`, and the profile image URL.
- For the image URL: `ImageField` objects in Django have a `.url` property. Use that. If the field is null, return `null` in the JSON — don't crash.

**Watch out for:**
- Never return the `password` field in any response. Django stores it hashed, but it should still never leave the backend.
- When returning image URLs, they'll look like `/media/profile_images/filename.jpg`. Your partner's React app needs to prepend `http://localhost:8000` to display them. Make sure you both know this.

---

## Step 7 — URL Configuration

**What to build:** The URL routing for all auth endpoints.

**What it needs:**
- In your app's `urls.py`, define URL patterns for all four auth views under `/api/auth/`.
- In the project's main `urls.py`, include your app's URLs with `include()`.
- Also in the main `urls.py`, add the pattern that serves media files during development — Django doesn't serve media files automatically in dev mode. You need to explicitly add `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)` to your URL patterns.

---

**End of Day 1 Check — Before you sleep:**
- [ ] All four auth endpoints return correct JSON
- [ ] Register returns a token in the response
- [ ] Login returns a token
- [ ] The token from login/register can be used to hit the `/me` endpoint and get back the right user
- [ ] Wrong credentials on login return 401
- [ ] `.env` is in `.gitignore` and not committed
- [ ] Your partner can make a request to your endpoints from their React app without a CORS error

---

---

# DAY 2 — Core Commerce
**Goal: Full shopping flow. Student browses → adds to cart → checks out. Cafeteria sees and updates the order.**

---

## Step 8 — Product Model

**What to build:** The `Product` model that represents both cafeteria food items and student vendor products.

**What it needs:**
- Fields: `seller` (ForeignKey to User — the cafeteria or student who listed this), `name` (CharField), `price` (DecimalField with max_digits=10, decimal_places=2), `image` (ImageField — required, not nullable), `is_available` (BooleanField, default True), `seller_type` (CharField limited to `cafeteria` or `student_vendor`), `created_at` (DateTimeField, auto-set on creation with `auto_now_add=True`).
- The `seller_type` field is important — it's how you filter "show only cafeteria food" vs "show only vendor products" without complicated joins.
- Understand `ForeignKey`: when `seller` is a ForeignKey to User, one user can have many products. In Python, `product.seller` gives you the full User object. `product.seller_id` gives you just the ID (useful for comparisons without hitting the database again).

**Watch out for:**
- `DecimalField` must have `max_digits` and `decimal_places` set. `max_digits` is the total number of digits including the decimal part. For Nigerian prices, `max_digits=10, decimal_places=2` handles up to ₦99,999,999.99 which is more than enough.
- `auto_now_add=True` sets the field to the current time when the record is first created and never changes it after. `auto_now=True` updates the field every time the record is saved. Use `auto_now_add` for `created_at` and `auto_now` for `updated_at` fields.

---

## Step 9 — Public Product Browsing Endpoints

**What to build:** Four endpoints anyone can access without logging in.

### GET `/api/products/`
**What it needs:**
- Query all `Product` objects where `is_available=True`.
- For each product, return: `id`, `name`, `price`, `image URL`, `is_available`, `seller_type`, `seller.id`, `seller.full_name`.
- No auth check — this is public. Any request hits this, you return the data.

### GET `/api/products/<id>/`
**What it needs:**
- Look up a single product by the ID in the URL.
- If it doesn't exist, return 404.
- Return full product details including all seller info.

### GET `/api/cafeterias/`
**What it needs:**
- Query all `User` objects where `role='cafeteria'`.
- Return a list with: `id`, `full_name`, `profile_image URL` for each cafeteria.
- This powers the cafeteria listing page on the frontend.

### GET `/api/cafeterias/<id>/menu/`
**What it needs:**
- Look up the User by ID and confirm their role is `cafeteria`. If not, return 404.
- Return ALL products where `seller=that_user` — both available and unavailable. The frontend will show unavailable items greyed out or tagged "Not Available Today". This is the core feature that solves the "walk there for nothing" problem.
- Include `is_available` in every product object so the frontend can act on it.

---

## Step 10 — Cafeteria Menu Management Endpoints

**What to build:** Full CRUD for a cafeteria's own menu items.

**Before each view:** Run the token helper. Confirm the user exists. Confirm `user.role == 'cafeteria'`. Otherwise return 401 or 403.

### GET `/api/cafeteria/menu/`
- Return all products where `seller=current_user`. Both available and unavailable.

### POST `/api/cafeteria/menu/`
- Accept: `name`, `price`, `image` (uploaded file).
- The image comes in `request.FILES`, not `request.POST`. `request.POST` has text fields. `request.FILES` has uploaded files. You need both.
- Create the product with `seller=current_user` and `seller_type='cafeteria'`.
- Return the created product with 201.

### PUT `/api/cafeteria/menu/<id>/`
- Look up the product by ID. Confirm it belongs to `current_user`. If someone else's product, return 403.
- Accept updated `name`, `price`, `image`. Update and save.
- Return the updated product.

### PATCH `/api/cafeteria/menu/<id>/toggle/`
- Look up the product. Confirm ownership.
- Flip `is_available`: if it was True, set to False. If it was False, set to True. Save.
- Return the updated product. The frontend uses this to update the toggle button state.

### DELETE `/api/cafeteria/menu/<id>/`
- Look up the product. Confirm ownership.
- Delete it. Return 200 success.

**Watch out for:**
- For image uploads, Django's `request.FILES` is only populated if the request's content type is `multipart/form-data`. Your partner must send the image using `FormData` in JavaScript, not as JSON. Make sure you communicate this clearly.
- When handling a PUT with a new image, check if a new image was provided before trying to update the image field. If no new image was sent, keep the existing one.

---

## Step 11 — Student Vendor Product Management Endpoints

**What to build:** Same CRUD structure as cafeteria menu, but for students selling their own products.

**Before each view:** Token helper → confirm user exists → confirm `user.role == 'student'`.

The endpoints are structurally identical to the cafeteria menu endpoints. The key differences:
- Role check is `student` instead of `cafeteria`.
- When creating, set `seller_type='student_vendor'` instead of `cafeteria`.
- Ownership check is the same — only the seller can edit or delete their own product.

---

## Step 12 — Cart and CartItem Models

**What to build:** Two models that together store a student's current cart.

**Cart model:**
- `student` — OneToOneField to User. One student, one cart.
- `seller` — ForeignKey to User, nullable. This is the "locked seller." It starts as null (empty cart) and gets set when the first item is added.
- `updated_at` — DateTimeField with `auto_now=True`.

**CartItem model:**
- `cart` — ForeignKey to Cart.
- `product` — ForeignKey to Product.
- `quantity` — PositiveIntegerField, default 1.

**Understanding the OneToOneField on Cart:** This means when you want a student's cart in a view, you do `Cart.objects.get_or_create(student=current_user)`. `get_or_create` is a Django ORM method that returns an existing record or creates a new one atomically — it's perfect here because students start with no cart and you want to create one the moment they need it.

---

## Step 13 — Cart Endpoints

**What to build:** Five endpoints managing a student's cart.

**Before each cart view:** Token helper → confirm `user.role == 'student'`.

### GET `/api/cart/`
- Get or create the student's Cart.
- Fetch all CartItems related to this cart.
- For each item, return: `cart_item_id`, `product_id`, `product_name`, `product_image_url`, `price`, `quantity`, `subtotal` (price × quantity).
- Also return the cart total (sum of all subtotals), the locked seller info (`seller.id`, `seller.full_name`), and whether the cart is empty.

### POST `/api/cart/add/`
- Accept: `product_id`, `quantity`.
- Look up the product. If it doesn't exist, return 404. If `is_available` is False, return 400 with a message saying the item is not currently available.
- Get or create the student's Cart.
- **Seller-lock check — this is critical:** If the cart's `seller` field is not null (cart has items), compare `product.seller_id` with `cart.seller_id`. If they're different sellers, return 400 with the message: `"Your cart already has items from [seller name]. Clear your cart first to order from a different seller."` This is non-negotiable — enforce it here, in the backend.
- If the cart is empty (seller is null), set `cart.seller = product.seller` and save the cart.
- Check if a CartItem for this product already exists in this cart. If yes, increase its quantity by the requested amount. If no, create a new CartItem.
- Return the updated cart contents.

### PUT `/api/cart/update/<item_id>/`
- Look up the CartItem. Confirm it belongs to this student's cart.
- If the new quantity is 0, delete the item entirely (same as removing it).
- Otherwise, update the quantity and save.
- If updating quantity to 0 removes the last item, also clear the cart's seller lock (set seller to null).
- Return the updated cart.

### DELETE `/api/cart/remove/<item_id>/`
- Look up the CartItem. Confirm it belongs to this student's cart.
- Delete the item.
- Check if the cart is now empty. If it is, clear the seller lock from the Cart.
- Return success.

### DELETE `/api/cart/clear/`
- Get the student's cart.
- Delete all CartItems in this cart.
- Set `cart.seller = null` and save.
- Return success.

**Watch out for:**
- The seller-lock check is the #1 demo feature for this section. Test it manually before calling Day 2 done. Add an item from Cafeteria A. Try to add from Cafeteria B. Confirm you get the 400 error with the seller name in the message.
- When returning the cart total, calculate it in Python, not in a template or on the frontend. Backend owns the math.

---

## Step 14 — Order and OrderItem Models

**What to build:** Two models that store placed orders.

**Order model:**
- `buyer` — ForeignKey to User (the student).
- `seller` — ForeignKey to User (the cafeteria or vendor).
- `total_amount` — DecimalField (total including delivery fee, calculated at checkout).
- `delivery_type` — CharField, either `pickup` or `delivery`.
- `delivery_fee` — DecimalField (₦0 for pickup, the flat fee from `.env` for delivery).
- `status` — CharField, one of: `pending`, `processing`, `ready`, `delivered`, `cancelled`.
- `created_at` — DateTimeField, `auto_now_add=True`.
- `updated_at` — DateTimeField, `auto_now=True`.

**OrderItem model:**
- `order` — ForeignKey to Order.
- `product` — ForeignKey to Product.
- `quantity` — PositiveIntegerField.
- `price_at_time` — DecimalField. **This is the product's price at the moment the order was placed, stored permanently.** If the cafeteria changes Jollof Rice from ₦800 to ₦900 tomorrow, orders placed today must still show ₦800. This field is how that works.

---

## Step 15 — Checkout Endpoint

**What to build:** The most complex endpoint. Converts the cart into an order.

**What it needs:**
- Token helper → confirm `student` role.
- Get the student's cart. If the cart is empty (no CartItems), return 400: "Your cart is empty."
- Read `delivery_type` from the request body. Must be exactly `pickup` or `delivery`. If neither, return 400.
- Calculate `delivery_fee`: if `pickup`, fee = ₦0. If `delivery`, fee = the value from your `.env` file (e.g., ₦200). Load this from `settings.py` using `os.getenv`.
- Calculate the order subtotal: loop through all CartItems, for each one multiply `item.product.price × item.quantity`. Sum them all.
- Add the delivery fee to get `total_amount`.
- Create the `Order` record with all calculated values, `seller=cart.seller`, `status='pending'`.
- Loop through the CartItems again and create one `OrderItem` for each. Set `price_at_time=item.product.price` — snapshot the price right now.
- Clear the cart: delete all CartItems, set `cart.seller = null`, save the cart.
- Return the new order's ID, total, status, delivery type, and all order items.

**Watch out for:**
- Do all of this in a database transaction if you can. The idea: if creating the Order succeeds but creating one of the OrderItems fails, you don't want a partial order in the database. Wrap the whole creation block in `transaction.atomic()`. This is Django's built-in way to say "either all of this saves, or none of it does."
- You calculate the total in Python. Never calculate it on the frontend and send it to the backend — the backend always owns financial calculations.

---

## Step 16 — Student Order Viewing Endpoints

### GET `/api/orders/`
- Return all orders where `buyer=current_user`, ordered by `created_at` descending (newest first).
- For each order: `id`, `seller name`, `total_amount`, `delivery_type`, `status`, `created_at`.

### GET `/api/orders/<id>/`
- Look up the order by ID. Confirm `order.buyer == current_user`. If not, return 403 — a student should never be able to see another student's order.
- Return full order details including each OrderItem: `product_name`, `quantity`, `price_at_time`, `subtotal`.

### GET `/api/orders/spending/`
- Query all orders where `buyer=current_user`.
- Calculate: `total_spent` (sum of all `total_amount`), `total_orders` (count).
- For the per-seller breakdown: group orders by seller, sum `total_amount` per seller. The result is a list like `[{seller_name: "Mama Nkechi's", amount_spent: 4500}, ...]`.
- Django ORM's `values()` and `annotate()` with `Sum()` are perfect for this grouping. Know they exist — look up the pattern when you get there.

---

## Step 17 — Cafeteria Order Management Endpoints

### GET `/api/cafeteria/orders/`
- Token helper → confirm `cafeteria` role.
- Return all orders where `seller=current_user`, newest first.
- Optional filter: if `?status=pending` is in the URL, filter by that status. Access query params with `request.GET.get('status')`.
- For each order, include buyer name, delivery type, total amount, status, and all order items.

### PATCH `/api/cafeteria/orders/<id>/status/`
- Token helper → confirm `cafeteria` role.
- Look up the order. Confirm `order.seller == current_user`.
- Accept `{"status": "processing"}` in the request body.
- Validate the transition. The allowed status transitions are:
  - `pending` → `processing` ✓
  - `pending` → `cancelled` ✓
  - `processing` → `ready` ✓
  - `processing` → `delivered` ✓
  - Anything else → return 400 with a clear message about what transition is not allowed.
- Update the status, save, return the updated order.

**Watch out for:**
- Build the transition validation as a simple dict or if/else block. The key insight: you're validating both the **current** status AND the **requested** status. Just checking the requested status is not enough — you must also confirm the current status allows that transition.

---

**End of Day 2 Check — Before you sleep:**
- [ ] Public browsing works — all products return, single product returns, cafeteria list works, cafeteria menu shows available and unavailable items
- [ ] Cafeteria can add, edit, toggle, and delete menu items
- [ ] Student can add items to cart, and the seller-lock blocks adding from a second seller
- [ ] Clear cart removes the lock and lets the student add from a new seller
- [ ] Checkout creates an order, captures `price_at_time`, and clears the cart
- [ ] Cafeteria sees the new order in their dashboard
- [ ] Cafeteria can move the order through its status stages

---

---

# DAY 3 — AI Features + Admin
**Goal: All three AI endpoints work with real database context injected into the prompt. Admin dashboard shows live stats.**

---

## Step 18 — Groq SDK Setup

**What to build:** Configure and verify the Groq client before writing any AI view.

**What it needs:**
- Install the Groq Python SDK (already done in Step 1).
- Your `GROQ_API_KEY` is in `.env` and loaded in `settings.py`. In your AI views, load it from Django's settings (not directly from `os.getenv` in the view — keep settings centralized).
- Instantiate the Groq client at the top of your AI views file (module level, not inside the function). This way it's created once, not on every request.
- The model to use for all three AI features: `llama-3.3-70b-versatile`.
- Understand how a Groq call works: you send a list of messages with `role` and `content`. Two roles matter here — `system` and `user`. The `system` message gives the AI its instructions and the database context. The `user` message is the actual question. This two-message structure is the pattern for all three AI endpoints.

**Watch out for:**
- Groq API calls can fail (network issues, rate limits). Wrap every Groq call in a try/except. If it fails, return a 500 with `"AI service temporarily unavailable"` rather than crashing.

---

## Step 19 — Student Budget Meal Recommender

**Endpoint:** POST `/api/ai/meal-recommender/`

**What it needs:**
- Token helper → confirm `student` role.
- Accept: `amount` (required) and `cafeteria_id` (optional).
- **Database step:** Fetch all Products where `is_available=True` and `seller_type='cafeteria'`. If `cafeteria_id` was provided in the request, also filter by `seller=cafeteria_id`. Format this as a readable text block, like: `"Mama Nkechi's Kitchen: Jollof Rice ₦800, Fried Rice ₦700, Egusi Soup ₦600 | The Second Cafeteria: Beans ₦400, Bread ₦200"`. Be intentional about how you format this — the AI reads this text, so clarity helps it reason better.
- **System prompt rules to include (enforce each one):**
  - Only recommend from ONE cafeteria. Never mix items from different cafeterias in a single meal combo.
  - Show the math explicitly: list each item and its price, add them up, show how much of the budget remains.
  - If the budget is less than the cheapest item in the menu data, humorously roast the student. Tone: funny, not mean.
  - If the budget is ₦10,000 or above, first tell the student to consider investing or not spending it all on food, then give food combinations anyway.
  - Offer 2–3 different combinations where the budget allows.
  - Use only the prices from the provided menu data — never invent prices.
- **User message:** `"I have ₦[amount] to spend on food. What can I eat?"` — keep it simple. The system prompt has all the rules.
- Call Groq, get the response, extract the text content, return it as `{"success": true, "recommendation": "..."}`.

**Watch out for:**
- The quality of the AI output depends entirely on the quality of your system prompt. Spend real time on this. Write it, test it with different amounts, refine it.
- If no cafeteria products are found in the database (e.g., `cafeteria_id` doesn't exist), return a 404 before calling Groq. Don't send an empty menu to the AI.

---

## Step 20 — Admin AI Dashboard Assistant

**Endpoint:** POST `/api/ai/admin-assistant/`

**What it needs:**
- Token helper → confirm `admin` role.
- Accept: `question` (a plain English string from the admin/VC).
- **Database snapshot — fetch all of this before calling Groq:**
  - Total users by role (how many students, how many cafeterias).
  - Total orders by status (how many pending, processing, ready, delivered, cancelled).
  - Total platform revenue: sum of `total_amount` across all orders.
  - Top 3 cafeterias by order count (seller name + order count).
  - Top 5 most ordered products (product name + how many times it appears in OrderItems).
  - Count of orders created today (filter by `created_at__date=today`).
- Format all of this as a clean, readable text block. This is the AI's "briefing document."
- **System prompt:** Tell the AI it is an assistant for a university's Vice Chancellor. It has access to the platform data snapshot provided. It must answer the question using ONLY the provided data. It must not invent figures. It must be professional, clear, and concise.
- **User message:** The admin's question verbatim.
- Return `{"success": true, "answer": "..."}`.

**Watch out for:**
- For "today's orders," use Django's `timezone.now().date()` to get today's date and filter accordingly. This handles timezone awareness correctly.
- The AI sometimes hallucinates numbers if the prompt doesn't firmly instruct it to use only the provided data. Your system prompt must be explicit: "You must only reference figures from the data snapshot provided. Do not invent any numbers."

---

## Step 21 — Cafeteria AI Order Analytics Assistant

**Endpoint:** POST `/api/ai/cafeteria-assistant/`

**What it needs:**
- Token helper → confirm `cafeteria` role.
- Accept: `question` (plain English).
- **Database snapshot — fetch this cafeteria's own data:**
  - All orders today where `seller=current_user`. Count them and sum their totals.
  - Order count by status for today (how many pending, processing, ready, delivered).
  - Item-level breakdown: for today's orders, count how many times each product was ordered. This requires going through OrderItems for today's orders and counting per product. Return: `[(product_name, total_quantity_ordered), ...]` sorted by quantity descending.
- Format as a readable text block.
- **System prompt:** Tell the AI it is an order analytics assistant for a campus cafeteria. It has today's order data. It must answer the cafeteria's question using only this data. It must be helpful, clear, and practical.
- Return `{"success": true, "answer": "..."}`.

**Watch out for:**
- The item-level aggregation (how many of each product was ordered today) requires you to filter OrderItems where the related order is from today AND the order's seller is the current cafeteria. Think through this query carefully — it spans two models (OrderItem → Order). Use Django's double-underscore notation to filter across related models: `OrderItem.objects.filter(order__seller=current_user, order__created_at__date=today)`.

---

## Step 22 — Admin Overview + User/Order List Endpoints

### GET `/api/admin/overview/`
- Token helper → confirm `admin` role.
- Return a single object with: user counts by role, order counts by status, total revenue, count of active products (where `is_available=True`).
- All of this is pure database aggregation — `count()`, `filter()`, and `aggregate(Sum())`.

### GET `/api/admin/users/`
- Token helper → confirm `admin` role.
- Return a paginated list of all users. For each user: `id`, `username`, `full_name`, `role`, `date_joined`.
- Pagination: Django has a built-in `Paginator` class. Use it. Accept a `?page=1` query param. Return `total_count`, `total_pages`, `current_page`, and the list of users.

### GET `/api/admin/orders/`
- Token helper → confirm `admin` role.
- Return a paginated list of all orders on the platform. For each order: `id`, `buyer name`, `seller name`, `total_amount`, `status`, `delivery_type`, `created_at`.
- Optional filter: `?status=pending` — same pattern as the cafeteria orders endpoint.

---

## Step 23 — Database Seeding (Begin Today)

**What to build:** A Django management command that populates the database with demo data.

**Why a management command:** You'll need to run this multiple times (resetting the database, testing, etc.). A management command is cleaner than a script — you run it with `python manage.py seed_demo_data` and it does everything.

**What to seed (minimum):**
- 1 admin account (seed directly — no UI for creating admins)
- 2 cafeteria accounts with distinct names (e.g., "Mama Nkechi's Kitchen" and "Campus Corner Cafeteria")
- 5 food items for Cafeteria 1, 5 food items for Cafeteria 2. At least one item per cafeteria should be marked `is_available=False` to demonstrate the availability feature.
- 2–3 student accounts
- 3–5 sample orders with varying statuses (`pending`, `processing`, `ready`, `delivered`) so the admin dashboard and cafeteria dashboard show non-empty data

**Watch out for:**
- Use `get_or_create` or `if not User.objects.filter(username=...).exists()` in your seed command. This way running the command twice doesn't crash or duplicate data.
- Food item images for seeding: use placeholder images or create simple test images. You can also skip the image field for seeded items if your views handle null images gracefully, but be honest with yourself — the demo needs images.

---

**End of Day 3 Check — Before you sleep:**
- [ ] AI meal recommender returns a real Groq response with food combos and math when tested
- [ ] Asking the AI recommender with a very low amount triggers the funny roast response
- [ ] Admin AI assistant uses live database numbers in its answer (verify by checking the numbers)
- [ ] Cafeteria AI assistant answers questions about today's orders correctly
- [ ] Admin overview returns real counts from the database
- [ ] Seeding is partially done — at least accounts and products exist

---

---

# DAY 4 — Polish & Demo Prep
**Goal: Clean demo, bulletproof seeded data, all integration bugs fixed.**

---

## Step 24 — Complete Database Seeding

**What to build:** Finish and finalize the seed command so the demo database looks real.

**Minimum final state of the database:**
- 1 admin account — credentials agreed upon with your partner
- 2 cafeteria accounts — both have a full menu, at least one item per cafeteria is unavailable
- 3 student accounts — at least one with order history so the spending page isn't empty
- 10+ food items total across both cafeterias, with realistic Nigerian food names and prices
- 5+ orders with mixed statuses across both cafeterias
- At minimum 1 pending order at each cafeteria, so the demo can show the status update flow live

**Write down the demo credentials and share them with your partner today.** Both of you must know them cold before the presentation.

---

## Step 25 — Integration Bug Fixes

**What to do:** Sit with your partner and walk through the full demo flow together. You watch the network requests; they drive the frontend.

**Specifically verify:**
- Image URLs are fully formed and images actually display in the browser (if they show a broken image icon, the media serving is misconfigured).
- The cart seller-lock error message reaches the frontend correctly and has the seller name filled in.
- Checkout returns the right total including the delivery fee when delivery is selected.
- Order status updates from the cafeteria dashboard reflect correctly when the student refreshes their orders page.
- All three AI endpoints return coherent, database-accurate responses.
- The admin overview numbers match what's actually in the database (count them manually if unsure).

---

## Step 26 — Final Endpoint Verification Checklist

Go through every single endpoint one time before you declare the backend done.

**Auth:** Register (all 3 roles) → Login → Me → Logout.
**Public browsing:** All products → Single product → Cafeteria list → Cafeteria menu (available + unavailable items).
**Cafeteria menu management:** Add item (with image) → Edit item → Toggle availability → Delete item.
**Vendor product management:** Add product → Edit → Toggle → Delete.
**Cart:** Add item → Check seller lock triggers → Update quantity → Remove item → Clear cart → Add from new seller after clear.
**Checkout:** Pickup (fee = 0) → Delivery (fee = flat amount). Confirm cart clears after both.
**Student orders:** Order list → Single order detail → Spending summary.
**Cafeteria orders:** Order list with no filter → Filter by status → Update order through full status lifecycle.
**Admin:** Overview stats → User list (paginated) → Order list (paginated, filtered by status).
**AI:** Meal recommender (normal amount) → Meal recommender (very low amount, expect roast) → Meal recommender (₦10,000+, expect investment warning) → Admin assistant (ask a real question) → Cafeteria assistant (ask about today's orders).

---

## Step 27 — Demo Script Responsibilities (Victor's Part)

**Know these cold:**

- The demo student account username and password.
- The demo cafeteria account username and password (Mama Nkechi's).
- The demo admin account username and password.
- What food items are in Mama Nkechi's menu and which one is marked unavailable.
- What happens when the AI recommender is asked for ₦1,500 (know roughly what it will say).
- What the admin AI answers when asked "Give me a summary of today's activity."

**Your job during the demo:** Be ready to explain the backend architecture if a judge asks. Specifically:
- Why custom token auth instead of sessions (cross-origin setup, faster to implement under time pressure).
- How the seller-lock works and why it's enforced on the backend not the frontend.
- How the AI features work — you fetch live data, inject it into the prompt as context, and the model reasons over real numbers, not invented ones.
- The `price_at_time` design decision — prices can change after an order, so you snapshot the price at order time.

---

---

# General Rules to Follow Throughout

## Thinking About Requests

Every view you write follows the same mental checklist in order:

1. Is the request method what I expect? (GET vs POST vs PATCH etc.) If not, return 405.
2. Is there a valid token? Run the helper. If not, return 401.
3. Does the user have the right role? Check it. If not, return 403.
4. Does the resource they're asking for exist? Query it. If not, return 404.
5. Do they own this resource? Check ownership. If not, return 403.
6. Is the request body valid? Are required fields present? Are values the right type? If not, return 400 with a specific message.
7. Do the business rules allow this action? (e.g., seller-lock, valid status transition, budget check.) If not, return 400 with a specific message.
8. Do the database operation(s).
9. Return a 200 or 201 with the right data shape.

Never skip steps. Never assume. Every view should be defensive.

---

## Handling Request Bodies

Django does not automatically parse JSON request bodies. You must call `json.loads(request.body)` manually at the start of views that accept JSON. Wrap it in a try/except — if the body is not valid JSON, `json.loads` will throw and you should return a 400.

Exception: for file upload views (adding a product with an image), the body is `multipart/form-data`, not JSON. In those views, use `request.POST` for text fields and `request.FILES` for files. You cannot use `json.loads` there.

---

## Returning Image URLs

Never return just the image field's raw value from the database. That's a relative path like `products/jollof.jpg`. Your partner's React app running on port 5173 needs the full URL: `http://localhost:8000/media/products/jollof.jpg`.

Inside a Django view, if you have a product object, do: `request.build_absolute_uri(product.image.url)`. This builds the full URL using the current request's host. This is the correct pattern during development. Use it consistently.

---

## Database Query Performance

You have SQLite and a demo database. Performance is not a real concern for the hackathon. But one habit to build now: avoid querying inside a loop. If you're building a list of orders and you need seller info for each order, use `select_related('seller')` on the initial query so Django fetches the user data in one query instead of hitting the database once per order. It's a one-word change and it matters at scale.

---

## The Most Important Thing

The AI features are the primary differentiator. If the demo comes down to "our app has three AI endpoints that give real, database-grounded answers in plain English" vs any other team, you win that argument.

Protect time for the AI features. If commerce features are taking longer than expected on Day 2, simplify them — but do not let that eat into Day 3 AI work.

---

*ByteNBite Django Backend Guide · Victor · June 2026*