# Django + React Integration Guide
## For Victor (Django Dev) & React Developer

> **The golden rule**: Django gives data as JSON. React fetches that JSON and displays it. That's it.

**Project Structure:**
```
your-project/
├── backend/          ← Django (runs on port 8000)
│   ├── manage.py
│   ├── yourapp/
│   └── ...
├── frontend/         ← React App (runs on port 3000)
│   ├── package.json
│   ├── src/
│   └── ...
```

---

## TABLE OF CONTENTS
1. [How They Talk to Each Other](#how-they-talk-to-each-other)
2. [Django Side — Returning JSON](#django-side--returning-json)
3. [Handling CORS (Critical — Do This First!)](#handling-cors-critical--do-this-first)
4. [React Side — Fetching the JSON](#react-side--fetching-the-json)
5. [Sending Data FROM React TO Django (POST)](#sending-data-from-react-to-django-post)
6. [CSRF Tokens — Why POST Fails & How to Fix It](#csrf-tokens--why-post-fails--how-to-fix-it)
7. [Environment Variables](#environment-variables)
8. [Running Both Servers](#running-both-servers)
9. [Debugging Checklist](#debugging-checklist)
10. [Complete Working Example End-to-End](#complete-working-example-end-to-end)

---

## HOW THEY TALK TO EACH OTHER

```
User opens browser → React loads at http://localhost:3000
                                │
                User clicks a button (e.g., "Load Properties")
                                │
              React sends HTTP request to Django:
          "GET http://localhost:8000/api/properties/"
                                │
              Django processes it, hits the database,
              and returns JSON data like:
              {"properties": [{...}, {...}]}
                                │
                React receives the JSON
                                │
              React updates the UI — user sees the data
```

**Key terms explained simply:**

- **HTTP Request** — A message React sends to Django asking for data. Like knocking on a door and asking for something.
- **JSON** — The format both sides use to pass data. Think of it as a standardized box that both Django and React know how to open.
- **Endpoint / URL** — The specific address React hits. e.g. `/api/properties/` is an endpoint.
- **GET** — "Give me data." No data sent in the request body.
- **POST** — "Here's some data, do something with it." Sends data in the request body.

---

## DJANGO SIDE — RETURNING JSON

You don't need Django REST Framework. You just use Django's built-in `JsonResponse`.

### Import It

```python
from django.http import JsonResponse
```

### Basic GET View — Return a List of Items

```python
# yourapp/views.py

from django.http import JsonResponse
from .models import Property  # your model, whatever it is

def get_properties(request):
    """
    Returns a list of all properties as JSON.
    React hits: GET /api/properties/
    """
    properties = Property.objects.all().values(
        'id', 'title', 'price', 'location', 'description'
    )
    # .values() gives you a queryset of dicts — perfect for JSON
    return JsonResponse({'properties': list(properties)})
```

**What `.values()` does:** Instead of returning full Python model objects (which can't be converted to JSON directly), `.values()` gives you plain dictionaries with only the fields you name. Django can convert those to JSON easily.

**Why `list(...)`?** `JsonResponse` needs a list, not a queryset object. Wrapping in `list()` converts it.

### GET View — Return a Single Item

```python
def get_property(request, property_id):
    """
    Returns one property by ID.
    React hits: GET /api/properties/5/
    """
    try:
        prop = Property.objects.values(
            'id', 'title', 'price', 'location', 'description'
        ).get(id=property_id)
        return JsonResponse({'property': prop})
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Property not found'}, status=404)
```

### GET View — With Query Parameters (Filtering)

React can pass filters in the URL like: `/api/properties/?city=Lagos&max_price=50000000`

```python
def get_properties(request):
    """
    Returns properties, optionally filtered.
    React hits: GET /api/properties/?city=Lagos
    """
    queryset = Property.objects.all()

    # Read query params from the URL
    city = request.GET.get('city')          # None if not provided
    max_price = request.GET.get('max_price')

    if city:
        queryset = queryset.filter(location__icontains=city)

    if max_price:
        queryset = queryset.filter(price__lte=max_price)

    properties = queryset.values('id', 'title', 'price', 'location', 'description')
    return JsonResponse({'properties': list(properties)})
```

**`request.GET.get('city')`** — This reads query parameters from the URL. It returns `None` if the parameter isn't there, so your filter only applies when the React dev actually sends it.

### Register URLs

In `yourapp/urls.py`:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.get_properties, name='get_properties'),
    path('properties/<int:property_id>/', views.get_property, name='get_property'),
]
```

In your main `project/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('yourapp.urls')),  # all API routes live under /api/
]
```

So now:
- `GET /api/properties/` → calls `get_properties`
- `GET /api/properties/5/` → calls `get_property` with `property_id=5`

### Testing Your Endpoint Without React

Before even touching React, test your endpoint directly:

```bash
# Start the server
python manage.py runserver

# In another terminal, test with curl
curl http://localhost:8000/api/properties/

# Or just open this in your browser
# http://localhost:8000/api/properties/
```

If you see JSON data in the browser or terminal — your Django side is working. ✅

---

## HANDLING CORS (CRITICAL — DO THIS FIRST!)

**CORS = Cross-Origin Resource Sharing.**

By default, browsers block React (port 3000) from talking to Django (port 8000) because they're on different "origins" (different ports count as different origins). Without fixing this, every React request to Django will silently fail.

This is the #1 reason the connection doesn't work. Fix it before anything else.

### Install the CORS Package

```bash
pip install django-cors-headers
```

### Update `settings.py`

```python
INSTALLED_APPS = [
    # ... your existing apps ...
    'corsheaders',   # Add this
]

MIDDLEWARE = [
    # Add this NEAR THE TOP — before Django's CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... rest of your middleware ...
]

# At the bottom of settings.py — allow React to talk to Django
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**Why order matters in MIDDLEWARE:** Django processes middleware top-to-bottom on every request. CORS headers need to be added before Django processes anything else — so it must be near the top.

After this, restart Django (`Ctrl+C` → `python manage.py runserver`). CORS errors should disappear.

---

## REACT SIDE — FETCHING THE JSON

The React developer handles this part. This section explains it so both of you are on the same page.

### Using `fetch` (built into JavaScript, no install needed)

```javascript
// Fetch all properties
fetch('http://localhost:8000/api/properties/')
  .then(response => response.json())    // parse the JSON
  .then(data => {
    console.log(data.properties);       // array of property objects
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Using `axios` (popular library, cleaner syntax)

```bash
# React developer installs this once
npm install axios
```

```javascript
import axios from 'axios';

// Get all properties
axios.get('http://localhost:8000/api/properties/')
  .then(response => {
    console.log(response.data.properties);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Get properties filtered by city
axios.get('http://localhost:8000/api/properties/', {
  params: { city: 'Lagos', max_price: 50000000 }
  // this becomes: /api/properties/?city=Lagos&max_price=50000000
})
  .then(response => console.log(response.data));
```

### Full React Component Example

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Runs once when the component loads
    axios.get('http://localhost:8000/api/properties/')
      .then(response => {
        setProperties(response.data.properties);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load properties. Is Django running?');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <ul>
      {properties.map(prop => (
        <li key={prop.id}>
          <strong>{prop.title}</strong> — ₦{prop.price} — {prop.location}
        </li>
      ))}
    </ul>
  );
}

export default PropertyList;
```

**What `useEffect` is:** It's React's way of saying "run this code after the component appears on screen." You use it for things like fetching data.

---

## SENDING DATA FROM REACT TO DJANGO (POST)

### Django View for POST

```python
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Property

@csrf_exempt  # explained in next section
def create_property(request):
    """
    Creates a new property from data React sends.
    React hits: POST /api/properties/create/
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        # React sends JSON in the request body — parse it
        data = json.loads(request.body)

        title = data.get('title')
        price = data.get('price')
        location = data.get('location')
        description = data.get('description', '')

        # Basic validation
        if not title or not price or not location:
            return JsonResponse({'error': 'title, price, and location are required'}, status=400)

        # Create in database
        prop = Property.objects.create(
            title=title,
            price=price,
            location=location,
            description=description,
        )

        return JsonResponse({
            'success': True,
            'property': {
                'id': prop.id,
                'title': prop.title,
                'price': str(prop.price),
                'location': prop.location,
            }
        }, status=201)  # 201 = Created

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
```

**`request.body`** — This is where React's POST data lands. It's raw bytes, so you use `json.loads()` to convert it into a Python dictionary.

**`status=201`** — HTTP status 201 means "resource created successfully." 200 means OK, 400 means bad request, 404 means not found, 500 means server error.

### Add to URLs

```python
# yourapp/urls.py
urlpatterns = [
    path('properties/', views.get_properties),
    path('properties/<int:property_id>/', views.get_property),
    path('properties/create/', views.create_property),   # new
]
```

### React POST Request

```javascript
axios.post('http://localhost:8000/api/properties/create/', {
  title: 'Luxury Duplex in Lekki',
  price: 85000000,
  location: 'Lekki, Lagos',
  description: '4 bedroom duplex with BQ',
})
  .then(response => {
    console.log('Created:', response.data.property);
  })
  .catch(error => {
    console.error('Failed:', error.response.data);
  });
```

---

## CSRF TOKENS — WHY POST FAILS & HOW TO FIX IT

**CSRF (Cross-Site Request Forgery)** is a Django security feature. By default Django demands a special token on every POST, PUT, or DELETE request. React doesn't know to send this token — so POST requests fail with a `403 Forbidden` error.

You have two options:

---

### Option A — `@csrf_exempt` (Simplest for Development)

Just add the decorator to views that React will POST to:

```python
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def create_property(request):
    # Django skips CSRF check for this view
    ...
```

**When to use this:** During development and for internal APIs. Fine as long as you add proper authentication later.

---

### Option B — Send the CSRF Token from React (Proper Way)

If you want CSRF protection enabled, React needs to read the CSRF token from Django's cookie and send it in every request header.

**Step 1: Django must send the cookie.**

Django sends a `csrftoken` cookie automatically when you use its CSRF middleware. Make sure this is in your MIDDLEWARE (it usually is by default):

```python
# settings.py MIDDLEWARE
'django.middleware.csrf.CsrfViewMiddleware',
```

Also add this to `settings.py` so the cookie is readable by JavaScript:

```python
CSRF_COOKIE_HTTPONLY = False  # default is False, just confirm it's not True
```

**Step 2: React reads the cookie and sends it.**

```javascript
// Helper function to read Django's CSRF token cookie
function getCookie(name) {
  let value = null;
  if (document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const [key, val] = cookie.trim().split('=');
      if (key === name) value = decodeURIComponent(val);
    });
  }
  return value;
}

// Use it in every POST request
axios.post('http://localhost:8000/api/properties/create/', data, {
  headers: {
    'X-CSRFToken': getCookie('csrftoken'),
  },
  withCredentials: true,  // needed so the browser sends cookies
});
```

**Also add to `settings.py`:**

```python
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
```

**Recommendation for your workflow:** Use `@csrf_exempt` during development. Before going to production, switch to Option B or use token-based authentication.

---

## ENVIRONMENT VARIABLES

Hard-coding URLs like `http://localhost:8000` everywhere is a problem — when you deploy, you'd have to change it in 50 places.

### Django Side

Create a `.env` file in your backend folder:

```
# backend/.env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

Install `python-decouple`:

```bash
pip install python-decouple
```

Use it in `settings.py`:

```python
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
```

### React Side

Create a `.env` file in your frontend folder:

```
# frontend/.env
REACT_APP_API_URL=http://localhost:8000/api
```

**React rules for env variables:**
- Must start with `REACT_APP_`
- Restart the React dev server after changing `.env`

Use it in your code:

```javascript
const API_URL = process.env.REACT_APP_API_URL;

axios.get(`${API_URL}/properties/`)
```

### `.gitignore`

Both `.env` files must be in `.gitignore` — never commit them:

```
# .gitignore
.env
backend/.env
frontend/.env
```

---

## RUNNING BOTH SERVERS

You need two terminals open at all times:

**Terminal 1 — Django:**
```bash
cd backend
# Activate virtual environment
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

python manage.py runserver
# → Running on http://127.0.0.1:8000/
```

**Terminal 2 — React:**
```bash
cd frontend
npm start
# → Running on http://localhost:3000/
```

They run simultaneously. Django handles data. React handles the UI.

---

## DEBUGGING CHECKLIST

When things don't work, go through this list in order:

### ✅ Check 1: Is Django running?
Open `http://localhost:8000/api/properties/` in your browser.
- Sees JSON? Django is fine.
- "Connection refused"? Django isn't running — start it.
- "404"? The URL is wrong — check `urls.py`.

### ✅ Check 2: Is React running?
Open `http://localhost:3000/` in your browser.
- Sees the app? React is fine.
- "This site can't be reached"? Run `npm start` in the frontend folder.

### ✅ Check 3: CORS error?
Open browser DevTools → Console tab (F12).
If you see: `Access to XMLHttpRequest... blocked by CORS policy`
- Make sure `django-cors-headers` is installed.
- Make sure `corsheaders.middleware.CorsMiddleware` is at the top of MIDDLEWARE.
- Make sure `http://localhost:3000` is in `CORS_ALLOWED_ORIGINS`.
- Restart Django.

### ✅ Check 4: 403 Forbidden on POST?
- Add `@csrf_exempt` to the Django view.
- Or follow Option B above to send the CSRF token from React.

### ✅ Check 5: Data comes through but React shows nothing?
React developer: add a `console.log` to see what's actually in the response:

```javascript
axios.get('http://localhost:8000/api/properties/')
  .then(response => {
    console.log('Full response:', response.data);  // check the shape
    setProperties(response.data.properties);        // make sure key name matches
  })
```

Django developer: confirm the key name in your JsonResponse matches what React is expecting. If Django returns `{'properties': [...]}` then React must use `response.data.properties`, not `response.data.items`.

### ✅ Check 6: 500 Internal Server Error?
Django side is crashing. Check the Django terminal — it will show a full Python traceback telling you exactly what went wrong.

---

## COMPLETE WORKING EXAMPLE END-TO-END

Here is a minimal but complete example both developers can run together to confirm the integration works.

---

### Django — `yourapp/models.py`

```python
from django.db import models

class Property(models.Model):
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=200)
    description = models.TextField(default='')

    def __str__(self):
        return self.title
```

---

### Django — `yourapp/views.py`

```python
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Property


def get_properties(request):
    city = request.GET.get('city')
    queryset = Property.objects.all()

    if city:
        queryset = queryset.filter(location__icontains=city)

    data = list(queryset.values('id', 'title', 'price', 'location', 'description'))
    return JsonResponse({'properties': data})


def get_property(request, property_id):
    try:
        prop = Property.objects.values(
            'id', 'title', 'price', 'location', 'description'
        ).get(id=property_id)
        return JsonResponse({'property': prop})
    except Property.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)


@csrf_exempt
def create_property(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST only'}, status=405)

    data = json.loads(request.body)
    prop = Property.objects.create(
        title=data['title'],
        price=data['price'],
        location=data['location'],
        description=data.get('description', ''),
    )
    return JsonResponse({
        'success': True,
        'property': {'id': prop.id, 'title': prop.title}
    }, status=201)
```

---

### Django — `yourapp/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('properties/', views.get_properties),
    path('properties/<int:property_id>/', views.get_property),
    path('properties/create/', views.create_property),
]
```

---

### Django — `project/urls.py`

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('yourapp.urls')),
]
```

---

### Django — `settings.py` additions

```python
INSTALLED_APPS = [
    # ... existing ...
    'corsheaders',
    'yourapp',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',   # ← top of list
    # ... rest unchanged ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

---

### Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Add some test data via Django shell:

```bash
python manage.py shell
```
```python
from yourapp.models import Property
Property.objects.create(title="Bungalow Ibadan", price=35000000, location="Bodija, Ibadan")
Property.objects.create(title="Flat Lagos Island", price=120000000, location="Lagos Island")
exit()
```

---

### React — `src/api/propertyService.js`

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const getProperties = (city = null) => {
  const params = city ? { city } : {};
  return axios.get(`${API_URL}/properties/`, { params });
};

export const getProperty = (id) => {
  return axios.get(`${API_URL}/properties/${id}/`);
};

export const createProperty = (data) => {
  return axios.post(`${API_URL}/properties/create/`, data);
};
```

---

### React — `src/components/PropertyList.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { getProperties } from '../api/propertyService';

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProperties()
      .then(response => {
        setProperties(response.data.properties);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load. Is Django running on port 8000?');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading properties...</p>;
  if (error)   return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Properties</h2>
      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <ul>
          {properties.map(prop => (
            <li key={prop.id}>
              <strong>{prop.title}</strong> — ₦{Number(prop.price).toLocaleString()} — {prop.location}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PropertyList;
```

---

### React — `src/App.jsx`

```javascript
import PropertyList from './components/PropertyList';

function App() {
  return (
    <div>
      <PropertyList />
    </div>
  );
}

export default App;
```

---

## QUICK REFERENCE CARD

| What React wants to do | URL to hit | Django method |
|---|---|---|
| Get all items | `GET /api/properties/` | `JsonResponse({'properties': list(...)})` |
| Get one item | `GET /api/properties/5/` | `JsonResponse({'property': {...}})` |
| Filter items | `GET /api/properties/?city=Lagos` | `request.GET.get('city')` |
| Create item | `POST /api/properties/create/` | `json.loads(request.body)` |
| Read POST body | — | `data = json.loads(request.body)` |
| Read URL param | `?key=value` | `request.GET.get('key')` |

**Status codes to know:**
- `200` — OK
- `201` — Created (use after successful POST)
- `400` — Bad request (missing or wrong data)
- `403` — Forbidden (CSRF issue)
- `404` — Not found
- `405` — Method not allowed (e.g., GET on a POST-only view)
- `500` — Django crashed — check the terminal

---

**Version**: 2.0 — Plain Django Edition | **Date**: June 2026