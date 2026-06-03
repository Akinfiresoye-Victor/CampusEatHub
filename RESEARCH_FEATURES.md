# ByteNBite - Research & Feature Insights
## Elizade TechFest Hackathon 2026

This document outlines the research-backed features integrated into **ByteNBite**, a campus e-commerce platform built to solve the unique dining and shopping challenges faced by students at Elizade University.

---

## 1. Problem Statement & Research
Our research identified three primary challenges for campus commerce:
1. **Inefficient Ordering:** Students spend too much time queuing for food at cafeterias between classes.
2. **Budget Management:** Students often struggle to track daily spending and budget their meals accurately.
3. **Vendor Visibility:** Student entrepreneurs have limited reach, relying mostly on fragmented WhatsApp statuses and group chats.

## 2. Core Features & Solutions

### 🛒 Multi-Vendor Marketplace
- **Centralized Platform:** A unified marketplace where both official cafeterias and student vendors can list their products.
- **Role-Based Workflows:** Distinct interfaces for students (buyers) and cafeterias/vendors (sellers) ensuring tailored user experiences.
- **Seller-Lock Cart:** To simplify fulfillment and delivery, carts are locked to a single seller per order. This reduces the logistical nightmare of multi-vendor fulfillment on a closed campus.

### 💳 Budgeting & Spending Analytics
- **Spending Dashboard:** A dedicated interface where students can track their spending history, view total orders, and analyze their average spend.
- **Visual Breakdowns:** Categorized spending charts help students see exactly where their money is going (e.g., specific cafeterias vs. student vendors).

### 🤖 AI-Powered Assistant & Meal Recommender
We integrated Claude 3.5 Sonnet to provide intelligent assistance tailored for campus life:
- **Student AI (CampusConnect / ByteNBite AI):** 
  - Acts as a smart assistant that helps students find products.
  - Suggests meals based on a strictly defined Naira (₦) budget.
  - Capable of playful interactions (e.g., lightly roasting users with a ₦200 budget while still offering realistic options).
- **Cafeteria AI:**
  - Provides business insights to cafeteria owners (e.g., top-selling items, revenue analysis, pending orders).
  - Helps vendors optimize their menus based on daily performance.

### 🚚 Delivery & Fulfillment Options
- **Flexible Options:** Users can choose between standard campus delivery or direct pickup to save on the ₦200 delivery fee.
- **Real-Time Status Tracking:** Orders transition smoothly through `Pending` ➔ `Processing` ➔ `Ready` ➔ `Delivered`, providing transparency to both buyers and sellers.

## 3. Technical Implementation Choices

1. **Session Auth over Tokens:** To improve security and simplify state management, the application relies exclusively on secure, HttpOnly Django session cookies rather than local storage tokens.
2. **Zustand State Management:** Adopted over traditional Context API for better performance and easier global state tracking (Auth, Cart, Orders, Products).
3. **Axios Interceptors:** Used to seamlessly inject `X-CSRFToken` headers for all non-GET requests to comply with Django's CSRF protection mechanism.

---
**Goal:** Deliver a seamless, premium, and functional campus marketplace that empowers both students and local campus businesses.
