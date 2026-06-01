# Two-Developer Collaboration Guide
## Django + React Project on Single Repository

**Project Structure:**
```
cafeteria-ecommerce/
├── backend/          ← Django developer works here
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
├── frontend/         ← React developer works here
│   ├── package.json
│   ├── src/
│   └── ...
└── .gitignore
```

**Important Principle**: Each developer works in their own folder (backend or frontend). This minimizes conflicts because you're rarely changing the same files.

---

# TABLE OF CONTENTS
1. [Initial Setup (Do This First!)](#initial-setup-do-this-first)
2. [Django Developer Workflow](#django-developer-workflow)
3. [React Developer Workflow](#react-developer-workflow)
4. [Working Together (Frontend-Backend Integration)](#working-together-frontend-backend-integration)
5. [Common Issues & Solutions](#common-issues--solutions)

---

---

# INITIAL SETUP (Do This First!)

## Current Situation
✅ You created an empty GitHub repository  
✅ You created `backend/` and `frontend/` folders locally in VS Code  
❌ You haven't pushed anything yet  

## Step 1: Initialize Git and Make Your First Commit

You only need to do this ONCE. The Django developer should do this now.

### 1.1 Open Terminal in Your Project Root

In VS Code, open the terminal at the root level (where `backend/` and `frontend/` folders are).

```bash
# Check you're in the right location
pwd
# Output should show: .../cafeteria-ecommerce (or your project name)

# Check git is initialized
git status
# If it says "Not a git repository", run: git init
```

### 1.2 Create a `.gitignore` File

This tells Git which files to ignore (don't track). This is CRITICAL—otherwise you'll commit node_modules, `.pyc` files, and other garbage.

Create a file called `.gitignore` in the project root (same level as `backend/` and `frontend/`):

```
# Python
backend/__pycache__/
backend/*.py[cod]
backend/*.so
backend/.env
backend/venv/
backend/env/
backend/.vscode/
backend/*.log

# Django
backend/db.sqlite3
backend/staticfiles/
backend/media/

# Node/React
frontend/node_modules/
frontend/dist/
frontend/build/
frontend/.env
frontend/.env.local
frontend/.env.development.local
frontend/.env.test.local
frontend/.env.production.local
frontend/npm-debug.log*
frontend/yarn-debug.log*
frontend/yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment files
.env
.env.local
```

**Why this matters**: If you don't have `.gitignore`:
- `backend/` will track virtual environment files (500MB+)
- `frontend/` will track `node_modules/` (200MB+)
- Your repository becomes bloated and slow
- Collaborators' machines will have conflicts

### 1.3 Add Files and Make First Commit

```bash
# Stage everything except what's in .gitignore
git add .

# Verify what you're adding
git status
# You should see:
# - .gitignore (new file)
# - backend/
# - frontend/

# Create your first commit
git commit -m "chore: Initial project structure with backend and frontend folders"
```

### 1.4 Connect to GitHub and Push

```bash
# Add your GitHub repository as the remote
# Replace YOUR-USERNAME and YOUR-REPO-NAME
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Verify the connection
git remote -v
# Output should show:
# origin  https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git (fetch)
# origin  https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git (push)

# Push to GitHub
git branch -M main
git push -u origin main
```

**Breaking this down:**
- `git remote add origin` = Connect your local repo to the GitHub repository URL
- `git branch -M main` = Rename your default branch to `main` (GitHub standard)
- `git push -u origin main` = Upload everything to GitHub and track this branch

### 1.5 Share the Repository with Your React Developer

1. Go to your GitHub repository → **Settings → Collaborators**
2. Click **Add people**
3. Enter their GitHub username
4. They'll get an email invitation

They should then clone the repository:

```bash
# React developer runs this
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd cafeteria-ecommerce
```

**After cloning**, the React developer has the exact same code locally.

---

# DJANGO DEVELOPER WORKFLOW

## Phase 1: Before Work Starts (Beginning of Day/Session)

### Step 1.1: Switch to Main Branch

Always start from `main`, which is your production-ready code.

```bash
# Switch to main
git checkout main

# Download latest changes from GitHub (if your React partner pushed something)
git pull origin main
```

**What this does:**
- `git checkout main` = Switch your working directory to the main branch
- `git pull origin main` = Fetch + merge any new commits from GitHub

**Why this matters**: Your React developer might have pushed changes to the API integration or dependencies. You need the latest code before starting.

### Step 1.2: Create Your Feature Branch

Never work on `main` directly. Create a branch for your specific feature.

```bash
# Create and switch to a new branch
git checkout -b feature/meal-recommendation-api
```

**Branch naming for Django (backend):**
- `feature/meal-recommender` (new feature)
- `feature/user-authentication` (new feature)
- `bugfix/fix-menu-filtering` (bug fix)
- `refactor/optimize-database-queries` (code improvement)

**Example branches for your hackathon:**
```
feature/meal-recommender-api
feature/budget-filtering
feature/vendor-menu-endpoint
bugfix/api-error-handling
refactor/database-optimization
```

**Important**: Create a new branch for each feature/bug. Don't reuse old branches.

```bash
# Verify you're on the correct branch
git status
# Output: On branch feature/meal-recommendation-api
```

---

## Phase 2: First Time Commit (Starting Your Work)

### Step 2.1: Make Your First Code Change

Write your Django code as normal. For example, create a new API endpoint or model.

```bash
# After writing some code, check what changed
git status

# Output example:
# Changes not staged for commit:
#   modified:   backend/models.py
#   modified:   backend/views.py
#   new file:   backend/serializers.py
```

### Step 2.2: Stage Your Changes

Staging means selecting which files to include in your commit.

```bash
# Option A: Stage all changes in backend/
git add backend/

# Option B: Stage everything (backend + frontend changes if you made any)
git add .

# Verify what you staged
git status
# You should see green "Changes to be committed:" section
```

**Pro Tip**: If you make changes in the frontend folder (integration work), only stage the backend changes:

```bash
git add backend/
# This stages only backend files, leaves frontend unstaged
```

### Step 2.3: Make Your First Commit

```bash
git commit -m "feat(backend): Implement meal recommendation API endpoint

- Created GET /api/recommend-meals/ endpoint
- Integrates Claude API for meal suggestions
- Filters by user budget and dietary preferences
- Includes error handling for API failures"
```

**Commit message breakdown:**
- `feat(backend):` = This is a new feature in the backend
- First line is the summary (under 72 characters)
- Blank line separates summary from body
- Body has bullet points explaining WHAT and WHY

**One logical change per commit**: If you created a model, serializer, and API endpoint, that's ONE change. If you fixed a database bug AND added error logging, that's TWO commits.

### Step 2.4: Push to GitHub (First Time)

```bash
# Push your branch to GitHub
git push -u origin feature/meal-recommendation-api
```

**Breaking it down:**
- `git push` = Upload commits to GitHub
- `-u` = Set upstream (remember this branch for next time)
- `origin` = GitHub (the remote server)
- `feature/meal-recommendation-api` = The branch name

**After first push**, you can simplify to just `git push`.

**At this point:**
- ✅ Your code is backed up on GitHub
- ✅ Your React developer can see what you're building
- ✅ You're ready for code review

---

## Phase 3: During Development (Daily Work)

### Step 3.1: Making Additional Changes

After your first commit, keep working and making more commits as you build features.

```bash
# Make changes to your code
# (edit files, create new files, etc.)

# Stage your changes
git add backend/

# Commit with clear message
git commit -m "feat(backend): Add pagination to menu endpoint

- Implemented limit and offset query parameters
- Tests for pagination boundary conditions"

# Push to GitHub
git push
```

**Frequency**: Commit and push daily (or multiple times a day). This prevents data loss and lets your partner see progress.

### Step 3.2: Syncing with Your React Partner's Changes

If your React developer pushed changes to `main` (they might have added new API requirements or fixed bugs), sync your feature branch:

```bash
# Fetch latest changes from GitHub
git fetch origin

# Merge main into your feature branch
git merge origin/main
```

**Or in one command:**
```bash
git pull origin main
```

**What happens**: If there are conflicts (unlikely since you work in separate folders), Git will tell you. See [Conflict Resolution](#handling-merge-conflicts) section.

---

## Phase 4: When Done Programming (Preparing to Merge)

### Step 4.1: Final Code Review

Before submitting for review, do a self-check:

```bash
# See all commits on your branch
git log --oneline origin/main..HEAD

# Example output:
# a3f5d2e feat(backend): Add pagination to menu endpoint
# 7b2c1f9 feat(backend): Implement meal recommendation API endpoint
```

```bash
# See all changes from main
git diff origin/main

# Or see just the files that changed
git diff origin/main --name-only
```

**Questions to ask yourself:**
- ✅ Does every commit have a clear message?
- ✅ Did you test this locally?
- ✅ Are there any debugging statements left (print(), console.log())?
- ✅ Did you update any relevant documentation?

### Step 4.2: Ensure Your Branch is Up to Date

Before merging, sync with latest main (in case React developer pushed):

```bash
# Fetch latest
git fetch origin

# Merge main into your feature branch
git merge origin/main

# If there are conflicts, resolve them (see Conflict Resolution section)

# Push the merge commit
git push
```

### Step 4.3: Create a Pull Request (PR) on GitHub

This is where code review happens. Your React developer will review your code.

**Steps:**
1. Go to GitHub → Your Repository
2. You'll see a banner: "feature/meal-recommendation-api had recent pushes"
3. Click **"Compare & pull request"**
4. Fill in the PR template (below)
5. Click **"Create pull request"**

**PR Description Template:**

```markdown
## Description
Implements the meal recommendation API endpoint that suggests meals based on user budget.

## Changes Made
- Created GET /api/recommend-meals/ endpoint
- Integrated Claude API for meal generation
- Added budget and dietary preference filtering
- Implemented error handling for API failures

## How to Test
1. Pull this branch: `git checkout feature/meal-recommendation-api`
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Run migrations: `python backend/manage.py migrate`
4. Start server: `python backend/manage.py runserver`
5. Test endpoint: `curl http://localhost:8000/api/recommend-meals/?budget=5000`

## Related Issues
Closes #3 (meal recommendation feature)

## Checklist
- [x] Code tested locally
- [x] No console/debug statements left
- [x] Docstrings added to new functions
- [x] Updated requirements.txt if needed
- [ ] Breaking changes (if any)
```

### Step 4.4: Handle PR Feedback

Your React developer might request changes. Here's how to handle it:

```bash
# You'll get a comment like:
# "Can you add error handling for when the API fails?"

# Make the requested change
# (edit your code)

# Stage and commit
git add backend/
git commit -m "fix(backend): Add fallback for Claude API failures

- Returns cached meals if API is unavailable
- Logs API errors for debugging"

# Push (GitHub automatically updates the PR)
git push
```

**Important**: Don't force-push or create a new branch. Just commit and push normally. GitHub will add the new commits to the same PR.

### Step 4.5: Merge Your PR

Once your React developer approves:

1. Click **"Merge pull request"** button on GitHub
2. Click **"Confirm merge"**
3. GitHub will show: "Pull request successfully merged and closed"

**Or merge via command line:**
```bash
# Switch to main
git checkout main

# Pull latest main
git pull origin main

# Merge your feature branch
git merge feature/meal-recommendation-api

# Push to GitHub
git push origin main
```

### Step 4.6: Delete Your Feature Branch (IMPORTANT!)

After merging, delete the feature branch to keep the repository clean.

```bash
# Delete locally
git branch -d feature/meal-recommendation-api

# Delete on GitHub
git push -d origin feature/meal-recommendation-api

# Verify it's deleted
git branch -a
# Should not show feature/meal-recommendation-api anymore
```

**Why delete?**
- Keeps repository clean and organized
- Prevents accidental work on old branches
- Makes it easy to see active work
- Standard practice in professional teams

**After deletion:**
```bash
# Go back to main for next feature
git checkout main
git pull origin main

# Create new branch for next feature
git checkout -b feature/next-feature
```

---

# REACT DEVELOPER WORKFLOW

## Phase 1: Before Work Starts (Beginning of Day/Session)

### Step 1.1: Clone the Repository (First Time Only)

If you haven't cloned yet, the Django developer will send you the repository link.

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Navigate into the project
cd cafeteria-ecommerce

# Verify you have both folders
ls -la
# Output should show: backend/ frontend/
```

### Step 1.2: Switch to Main Branch

Before starting work, always start from the latest `main`.

```bash
# Switch to main
git checkout main

# Download latest changes from GitHub (Django developer might have pushed)
git pull origin main
```

**What this does:**
- `git checkout main` = Switch to main branch
- `git pull origin main` = Download + merge any new code from GitHub

**Why this matters**: Your Django developer might have pushed new API endpoints or changes. You need the latest code before building the UI.

### Step 1.3: Create Your Feature Branch

Never work on `main` directly. Create a branch for your specific component/feature.

```bash
# Create and switch to a new branch
git checkout -b feature/meal-recommendation-ui
```

**Branch naming for React (frontend):**
- `feature/login-form` (new component)
- `feature/meal-recommendation-ui` (new feature)
- `bugfix/fix-cart-calculation` (bug fix)
- `refactor/optimize-bundle-size` (code improvement)

**Example branches for your hackathon:**
```
feature/meal-recommendation-ui
feature/budget-input-form
feature/checkout-page
feature/vendor-menu-display
bugfix/cart-state-management
refactor/component-styling
```

```bash
# Verify you're on the correct branch
git status
# Output: On branch feature/meal-recommendation-ui
```

---

## Phase 2: First Time Commit (Starting Your Work)

### Step 2.1: Make Your First Code Change

Write your React code as normal. Create components, styling, hooks, etc.

```bash
# After writing some code, check what changed
git status

# Output example:
# Changes not staged for commit:
#   modified:   frontend/package.json
#   new file:   frontend/src/components/MealRecommender.jsx
#   new file:   frontend/src/styles/MealRecommender.css
```

### Step 2.2: Stage Your Changes

Stage only your frontend changes (not backend).

```bash
# Stage all changes in frontend/
git add frontend/

# Verify what you staged
git status
# You should see green "Changes to be committed:" with frontend files
```

**Pro Tip**: If you made changes in both frontend and backend (integration work), stage them separately:

```bash
# Stage only frontend
git add frontend/

# If you also modified backend files, stage those too
git add backend/

# Or if only frontend
git add frontend/
```

### Step 2.3: Make Your First Commit

```bash
git commit -m "feat(frontend): Create meal recommendation UI component

- Built MealRecommender component with form inputs
- Displays API response as meal cards
- Includes loading and error states
- Responsive design for mobile/desktop"
```

**Commit message breakdown:**
- `feat(frontend):` = This is a new feature in the frontend
- First line is the summary (under 72 characters)
- Blank line separates summary from body
- Body has bullet points explaining WHAT and WHY

### Step 2.4: Push to GitHub (First Time)

```bash
# Push your branch to GitHub
git push -u origin feature/meal-recommendation-ui
```

**After first push**, you can simplify to just `git push`.

---

## Phase 3: During Development (Daily Work)

### Step 3.1: Making Additional Changes

Keep working and making commits as you build components.

```bash
# Make changes to your code

# Stage changes
git add frontend/

# Commit with clear message
git commit -m "feat(frontend): Add meal filtering and sorting

- Filter meals by price range
- Sort by nutritional value
- Update UI to show filters"

# Push to GitHub
git push
```

**Frequency**: Commit and push daily. Multiple commits per day is normal.

### Step 3.2: Syncing with Your Django Developer's Changes

If your Django developer pushed changes (new API endpoints, changes to responses), sync your feature branch:

```bash
# Fetch latest changes
git fetch origin

# Merge main into your feature branch
git merge origin/main
```

**Or in one command:**
```bash
git pull origin main
```

**If API response format changed**, you might need to update your component to match the new structure.

---

## Phase 4: When Done Programming (Preparing to Merge)

### Step 4.1: Final Code Review

Before submitting for review:

```bash
# See all commits on your branch
git log --oneline origin/main..HEAD

# See all changes
git diff origin/main

# See just the files that changed
git diff origin/main --name-only
```

**Self-check:**
- ✅ Does every commit have a clear message?
- ✅ Did you test this locally?
- ✅ No console.log() statements left?
- ✅ No hardcoded API URLs (should use environment variables)?

### Step 4.2: Ensure Your Branch is Up to Date

```bash
# Fetch latest
git fetch origin

# Merge main into your feature branch
git merge origin/main

# Push the merge commit
git push
```

### Step 4.3: Create a Pull Request (PR) on GitHub

1. Go to GitHub → Your Repository
2. Click **"Compare & pull request"** (appears when you push)
3. Fill in the description
4. Click **"Create pull request"**

**PR Description Template:**

```markdown
## Description
Implements the meal recommendation UI that connects to the backend API.

## Changes Made
- Built MealRecommender React component
- Integrates with GET /api/recommend-meals/ endpoint
- Added form for budget and preferences input
- Error handling for API failures
- Loading states and animations

## How to Test
1. Pull this branch: `git checkout feature/meal-recommendation-ui`
2. Install dependencies: `cd frontend && npm install`
3. Start the dev server: `npm start`
4. Ensure Django backend is running on http://localhost:8000
5. Navigate to meal recommendation page and test the form

## Related Issues
Closes #5 (meal recommendation UI)

## Checklist
- [x] Component tested locally
- [x] No console.log() left in code
- [x] API endpoint URL uses environment variables
- [x] Responsive design tested on mobile
- [ ] Breaking changes (if any)
```

### Step 4.4: Handle PR Feedback

Django developer might request changes:

```bash
# Make the requested change
# (edit your code)

# Stage and commit
git add frontend/
git commit -m "fix(frontend): Handle API errors better

- Show specific error message to user
- Retry button when API fails
- Log errors to console for debugging"

# Push (GitHub automatically updates the PR)
git push
```

### Step 4.5: Merge Your PR

Once Django developer approves:

1. Click **"Merge pull request"** on GitHub
2. Click **"Confirm merge"**

**Or merge via command line:**
```bash
git checkout main
git pull origin main
git merge feature/meal-recommendation-ui
git push origin main
```

### Step 4.6: Delete Your Feature Branch (IMPORTANT!)

After merging, delete the feature branch to keep the repo clean.

```bash
# Delete locally
git branch -d feature/meal-recommendation-ui

# Delete on GitHub
git push -d origin feature/meal-recommendation-ui

# Verify deletion
git branch -a
# Should not show your old branch
```

**After deletion:**
```bash
# Go back to main for next feature
git checkout main
git pull origin main

# Create new branch for next feature
git checkout -b feature/next-feature
```

---

# WORKING TOGETHER (Frontend-Backend Integration)

## Scenario 1: Django Developer Fixed an API Bug

**Situation**: Your Django developer pushed a fix to the `meal-recommender` endpoint. The response format changed slightly.

**React Developer Should:**

```bash
# Fetch latest changes
git fetch origin

# See what changed in main
git log origin/main --oneline -5

# If your feature branch is behind, sync it
git merge origin/main

# If API response format changed, update your component
# (edit MealRecommender.jsx to match new response)

# Commit the update
git add frontend/
git commit -m "fix(frontend): Update component to match new API response format

- API now returns 'meal_name' instead of 'name'
- Updated useState and component rendering"

# Push
git push
```

---

## Scenario 2: React Developer Needs to Test an In-Progress Django Feature

**Situation**: Django developer is building the meal recommender API but hasn't merged to main yet. React developer wants to test it early.

**Django Developer:**
```bash
# They share their branch name with you (e.g., feature/meal-recommender-api)
```

**React Developer:**
```bash
# Checkout the Django developer's branch
git fetch origin
git checkout feature/meal-recommender-api

# Now you have their code locally, can test the API
```

**After testing**, React developer goes back to their own branch:
```bash
git checkout feature/meal-recommendation-ui
```

---

## Scenario 3: You Both Need to Fix a Bug Together (Integration Issue)

**Situation**: The meal recommendation isn't working end-to-end. The API is returning data, but the React component isn't displaying it.

**How to collaborate:**

**Step 1: Both Developers Check Out Main**
```bash
git checkout main
git pull origin main
```

**Step 2: Create a Shared Investigation Branch**

Django developer creates a branch for the fix:
```bash
git checkout -b bugfix/meal-recommendation-integration
```

**Step 3: Django Developer Makes Backend Changes**
```bash
# Django dev makes changes in backend/
git add backend/
git commit -m "fix(backend): Add missing field to API response"
git push -u origin bugfix/meal-recommendation-integration
```

**Step 4: React Developer Tests and Makes Frontend Changes**

React developer checks out the same branch:
```bash
# React dev gets the latest
git fetch origin
git checkout bugfix/meal-recommendation-integration

# React dev makes changes in frontend/
git add frontend/
git commit -m "fix(frontend): Handle new field from API"
git push
```

**Step 5: Both Developers Verify the Fix**
- Django dev runs backend tests
- React dev tests the UI
- Both confirm bug is fixed

**Step 6: Create PR and Merge**
```bash
# On GitHub, create PR from bugfix/meal-recommendation-integration to main
# Both developers approve
# Merge to main
```

**Step 7: Delete the Branch**
```bash
git checkout main
git pull origin main
git branch -d bugfix/meal-recommendation-integration
git push -d origin bugfix/meal-recommendation-integration
```

---

## Scenario 4: You Want to Push Backend Changes from Your Frontend Branch

**Situation**: You found a bug in the Django code while testing integration. You fixed it on your local machine. How do you push it without breaking your feature branch?

**DO NOT** stage both frontend and backend changes together.

**Instead:**

```bash
# You're on your feature branch with both frontend and backend changes
git status

# See your changes
# Changes not staged:
#   backend/views.py (modified)
#   frontend/src/MealComponent.jsx (modified)
```

**Option 1: Create a Separate Bugfix Branch (RECOMMENDED)**

```bash
# Create a new branch for the backend fix
git checkout -b bugfix/fix-api-response

# Stage only backend changes
git add backend/

# Verify only backend is staged
git status

# Commit
git commit -m "fix(backend): Handle null values in API response"

# Push
git push -u origin bugfix/fix-api-response

# Switch back to your feature branch
git checkout feature/meal-recommendation-ui

# Stage your frontend changes
git add frontend/
git commit -m "feat(frontend): Display meal recommendations"
git push
```

**Option 2: Discard Backend Changes and Let Django Dev Fix It**

```bash
# Reset backend changes (discard them)
git checkout backend/

# Now only your frontend changes are modified
git status
# Should only show frontend/ files

# Stage and commit
git add frontend/
git commit -m "feat(frontend): Add UI component"
git push

# Tell Django developer about the bug
# They create their own branch and fix it
```

**Why Option 1 is better**: You get credit for the bugfix, and the Django developer can review it and give feedback.

---

## Communication Tips for Smooth Collaboration

### Daily Standup (Even if 2 People)
```
Django Developer:
"Today I'll implement the menu filtering API endpoint. 
I'll push by 2 PM so you can test it."

React Developer:
"I'll build the UI components for meal display.
I'll need the API response format by 12 PM."
```

### Before Major Changes
**Don't silently change an API endpoint format.** Tell your partner:
```
"Hey, I'm changing the meal endpoint response to include 
'dietary_info' field. I'll push it in 30 mins."
```

### Share Your Branch Names
```
"I pushed feature/meal-recommender-api, go ahead and test it"
```

### Code Review Comments
```
"Can you add error handling if the API times out?
Also, the response has 'meal_name' not 'name'."
```

---

# COMMON ISSUES & SOLUTIONS

## Issue 1: "Merge Conflict" Appears

A merge conflict happens when both developers changed the same file in incompatible ways.

**Likely in your case**: You both modified the same API endpoint or same component.

### How to Resolve:

```bash
# When you see conflict message
git merge origin/main

# Git will show something like:
# CONFLICT (content): Merge conflict in backend/views.py
# Automatic merge failed; fix conflicts and then commit the result.
```

**Open the conflicted file in VS Code:**

```python
# views.py
def get_meals(request):
<<<<<<< HEAD
    # Your version (your feature branch)
    meals = Meal.objects.filter(available=True, price__lt=5000)
=======
    # Their version (main branch)
    meals = Meal.objects.filter(available=True)
>>>>>>> main
    return Response(meals)
```

**How to fix:**
1. Decide which version is correct (or combine both)
2. Delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Save the file

**In this example**, you probably want both filters:
```python
# Fixed version
meals = Meal.objects.filter(available=True, price__lt=5000)
```

**After fixing:**
```bash
# Stage the resolved file
git add backend/views.py

# Complete the merge
git commit -m "Merge origin/main into feature/meal-recommender"

# Push
git push
```

**Prevention**: Talk to each other about which files you're editing!

---

## Issue 2: "You're Behind Main by 5 Commits"

This means the `main` branch has new commits, and your feature branch is based on an older version.

```bash
# Sync your feature branch with latest main
git fetch origin
git merge origin/main

# Or pull and merge in one command
git pull origin main

# Push the merge commit
git push
```

---

## Issue 3: Accidentally Committed to Main Instead of Feature Branch

```bash
# You made commits on main instead of a feature branch
git log --oneline -5
# a3f5d2e feat: something
# 7b2c1f9 feat: something else
# (these are on main, not good!)

# Undo the last 2 commits but keep the changes
git reset --soft HEAD~2

# Create a proper feature branch
git checkout -b feature/what-you-were-building

# Stage and commit on the feature branch
git add .
git commit -m "feat: what you were building"

# Push
git push -u origin feature/what-you-were-building

# Now go back to main and fix it
git checkout main
git pull origin main
```

---

## Issue 4: "The File I Need From My Partner's Branch Isn't in Main Yet"

```bash
# Your partner is still working on feature/payment-integration
# You need to test their code early

# Fetch their branch
git fetch origin

# Check it out temporarily
git checkout feature/payment-integration

# You can now test their code, run their branch locally

# When done, go back to your branch
git checkout feature/your-feature
```

---

## Issue 5: Large `.gitignore` Issues (Files Keep Showing Up)

If `.gitignore` doesn't work (files like `node_modules/` keep appearing):

```bash
# Remove all tracked files
git rm -r --cached .

# Re-add everything (respecting .gitignore now)
git add .

# Commit
git commit -m "chore: Remove node_modules and other ignored files from tracking"

# Push
git push
```

---

## Issue 6: You Pushed Something You Shouldn't Have (Secrets, Passwords, etc.)

**IMMEDIATE ACTION** (don't delay!):

```bash
# Remove the file from history
git filter-branch --tree-filter 'rm -f path/to/secret/file.py' HEAD

# Force push to overwrite history
git push -f origin your-branch

# Change any exposed secrets/passwords immediately
```

**Prevention**: Add to `.gitignore` BEFORE committing:
```
backend/.env
backend/secrets.py
frontend/.env.local
```

---

## Issue 7: Can't Remember Which Branch I'm On

```bash
# Check current branch
git status
# Output: On branch feature/meal-recommender

# List all local branches (current one has *)
git branch

# List all branches including remote
git branch -a

# Quick check
git rev-parse --abbrev-ref HEAD
# Output: feature/meal-recommender
```

---

## Issue 8: Want to See What Your Partner Pushed Recently

```bash
# See commits on main that you don't have yet
git fetch origin
git log origin/main --oneline -10

# See commits your partner made
git log origin/main --oneline --author="Teammate Name" -10
```

---

## Issue 9: Accidental `git add .` Added Files You Didn't Want

```bash
# You staged everything but didn't mean to
git status
# Shows lots of files staged

# Unstage everything
git reset

# Manually stage only what you want
git add backend/models.py
git add backend/views.py

# Verify
git status

# Then commit
git commit -m "feat(backend): add new models"
```

---

# QUICK REFERENCE CHECKLIST

## Before Starting Work
- [ ] `git checkout main`
- [ ] `git pull origin main`
- [ ] `git checkout -b feature/what-you-are-building`

## While Working
- [ ] Make code changes
- [ ] `git status` (see what changed)
- [ ] `git add backend/` (or `git add frontend/`)
- [ ] `git commit -m "clear message"`
- [ ] `git push` (after first push with `-u`)

## When Done
- [ ] `git fetch origin && git merge origin/main` (sync with latest)
- [ ] Create PR on GitHub
- [ ] Ask partner to review
- [ ] Make requested changes (commit + push)
- [ ] Partner approves → click "Merge" on GitHub
- [ ] `git branch -d feature/name` (delete locally)
- [ ] `git push -d origin feature/name` (delete on GitHub)
- [ ] `git checkout main && git pull origin main`

## Daily Sync (Even If Not Pushing)
```bash
git fetch origin
git log origin/main --oneline -3  # See what your partner pushed
```

---

# EXAMPLE: Complete Workflow for Hackathon

**Day 1 (Monday):**

Django Developer:
```bash
git checkout main
git pull origin main
git checkout -b feature/cafeteria-api
# ... write code ...
git add backend/
git commit -m "feat(backend): Create cafeteria API structure"
git push -u origin feature/cafeteria-api
```

React Developer:
```bash
git clone https://github.com/user/cafeteria-ecommerce.git
cd cafeteria-ecommerce
git checkout -b feature/login-page
# ... write code ...
git add frontend/
git commit -m "feat(frontend): Build login form"
git push -u origin feature/login-page
```

**Day 2 (Tuesday):**

Both sync with latest main:
```bash
git fetch origin
git merge origin/main
```

Django Developer finishes and creates PR:
```bash
git push
# Click "Create pull request" on GitHub
```

React Developer tests Django's API:
```bash
git fetch origin
git checkout feature/cafeteria-api
# Test the API endpoint
git checkout feature/login-page
```

**Day 3 (Wednesday):**

Django Developer's PR merged:
```bash
# Approved and merged on GitHub
git checkout main
git pull origin main
git branch -d feature/cafeteria-api
git push -d origin feature/cafeteria-api
```

React Developer updates UI based on API changes:
```bash
git fetch origin
git merge origin/main
# Update components to use new API
git add frontend/
git commit -m "fix(frontend): Update to use new API response format"
git push
```

**Day 4 (Thursday) - Final Day:**

Both developers finish, create final PRs, merge, clean up:
```bash
# Final PR review and merge
# Delete all feature branches
git branch -a  # Verify all branches deleted
```

---

# FINAL TIPS FOR SUCCESS

1. **Communicate**: Tell each other what you're working on
2. **Commit Often**: Multiple small commits are better than one huge commit
3. **Pull Before Push**: Always `git pull` before `git push`
4. **One Feature Per Branch**: Don't mix multiple features in one branch
5. **Delete After Merging**: Keep the repo clean
6. **Review Code**: Have your partner review before merging
7. **Test Integration**: Run both frontend + backend together regularly
8. **Use Descriptive Commits**: Future you will be grateful
9. **Ask Questions**: If confused, ask your partner
10. **Backup Daily**: Push to GitHub every day

---

**Remember**: Git is designed for collaboration. The tools are there to prevent disaster. Use them!

---

**Version**: 1.0 | **For**: First-Time Two-Developer Collaboration | **Date**: June 2026