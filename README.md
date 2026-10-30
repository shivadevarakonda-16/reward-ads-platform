# RewardAds Platform (MERN Stack Prototype)

A full-stack, reward-based advertising and shopping prototype built on the MERN stack (MongoDB, Express, React, Node.js). It connects **Consumers** (watch sponsored reels, discover products, share referral links, complete promo activities, and earn simulated rewards into their wallet), **Sponsors** (brands that fund campaigns and products), and **Admins** (create campaigns, monitor budgets, verify promotional evidence, and guard against fraud).

> **Prototype Disclaimer:** All ads, campaigns, coupons, and wallet earnings are **SIMULATED**. No real monetary transactions or bank payouts occur. Rewards strictly originate from funded sponsor campaign budgets.

---

## 🏗️ Architecture & Tech Stack

- **Backend:** Node.js (ES modules), Express, Mongoose (MongoDB), JWT, BcryptJS, Express-Validator, Helmet, CORS, Express-Rate-Limit, Nanoid.
- **Frontend:** React 18, Vite, Tailwind CSS (OnePlus OxygenOS design system with True-Dark surfaces and `#EB0028` red accent), Framer Motion, Lucide-React, Recharts, React-Hot-Toast.
- **Database:** MongoDB 8.0+ with indexed schemas and atomic transaction ledger.

---

## 📁 Repository Structure

```text
reward-ads-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (Mongoose connection), env.js (Validated env loader)
│   │   ├── models/          # User, Sponsor, Product, Campaign, AdView, Activity,
│   │   │                    # ReferralLink, ReferralVisit, Reward, Transaction, Coupon,
│   │   │                    # CouponRedemption, AuditLog, Notification
│   │   ├── controllers/     # Modular business logic for all REST endpoints
│   │   ├── routes/          # Express route definitions with express-validator
│   │   ├── middleware/      # auth, roleGuard (admin), rateLimiter, errorHandler, validation
│   │   ├── services/        # rewardService (atomic wallet math), fraudService, referralService
│   │   ├── seed/            # seed.js (wipes & populates realistic Indian sample data)
│   │   ├── utils/           # test-journey.js (automated 33-step E2E verification suite)
│   │   ├── app.js           # Express app setup, CORS, Helmet, rate-limiting
│   │   └── server.js        # Server listener and graceful shutdown
│   ├── .env                 # Live environment configuration
│   ├── .env.example         # Template with placeholder instructions
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # client.js (Axios instance + modular API functions)
│   │   ├── components/      # Navbar, BottomNav, Sidebar, AdminSidebar, RewardBadgeRing, etc.
│   │   ├── pages/           # Home, WatchFeed (Reels), CampaignDetail, Promote, Deals, Wallet, Profile
│   │   │   └── admin/       # Overview, Campaigns, Activities, Rewards, Products, Sponsors, Fraud, Audit, Users
│   │   ├── context/         # AuthContext (session + device fingerprint), ThemeContext (Light/Dark)
│   │   ├── styles/          # index.css (Reels scroll-snap, OxygenOS glassmorphism)
│   │   ├── App.jsx          # Protected route setup & admin role guard
│   │   └── main.jsx
│   ├── .env                 # VITE_API_URL=http://localhost:5000/api
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Prerequisites & Environment Setup

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **MongoDB:** Local MongoDB instance running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster.

### 1. Connecting MongoDB Atlas or Local MongoDB

Open `backend/.env` in your text editor:

```env
# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
# For Local MongoDB (Default):
MONGODB_URI=mongodb://127.0.0.1:27017/reward_ads_platform
DB_NAME=reward_ads_platform

# For MongoDB Atlas:
# 1. Sign in to cloud.mongodb.com
# 2. Click "Connect" -> "Drivers" -> Node.js
# 3. Paste your Atlas connection string below, replacing <username> and <password>:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/reward_ads_platform?retryWrites=true&w=majority
```

---

## 🚀 Installation & Running

### Step 1: Install Dependencies

```bash
# In backend folder
cd backend
npm install

# In frontend folder
cd ../frontend
npm install
```

### Step 2: Seed the Database

Wipes the database and populates realistic Indian sample data (1 Admin, 60 Users, 55 Sponsors, 80 Products, 60 Campaigns, 320 AdViews, 110 Activities, 85 Referral Links, 195 Rewards, 140 Transactions, 45 Deals):

```bash
cd backend
npm run seed
```

### Step 3: Start the Backend & Frontend Servers

Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5174 (or 5173)
```

---

## 🔑 Demo Credentials

All test users share the demo password: `User@12345`

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rewardads.test` | `Admin@12345` | Full administrative control & review queue |
| **User 1** | `aarav.sharma1@rewardads.test` | `User@12345` | Active wallet balance, referral code: `USR-AAR100` |
| **User 2** | `vivaan.malhotra2@rewardads.test`| `User@12345` | Active wallet balance |
| **User 3** | `aditya.mehta3@rewardads.test` | `User@12345` | Active wallet balance |
| **Suspended**| `advik.mehta13@rewardads.test` | `User@12345` | Suspended due to fraud flag |

---

## ⏱️ 5-Minute End-to-End Demo Script

Follow this step-by-step walkthrough to experience the entire user and admin journey:

1. **Sign In as Consumer:**
   - Go to `http://localhost:5174/login`
   - Click the quick-fill button **"Demo User 1"** (or enter `aarav.sharma1@rewardads.test` / `User@12345`).
   - Notice the current live wallet balance displayed in the top navbar chip.

2. **Watch & Earn (Reels-Style Feed):**
   - Click **"Watch & Earn"** in the sidebar or bottom navigation (`/watch`).
   - The feed opens in native full-screen mode with CSS scroll-snap.
   - Tap anywhere on the video to pause/play, or use the top right audio button to unmute.
   - Watch the video ad: observe the circular progress ring around the `+₹4` badge fill smoothly as heartbeats are sent to the server every 2 seconds.
   - Once the server verifies $\ge 90\%$ completion, the ring completes with a satisfying green check animation, and a toast confirms: *"Reward unlocked! ₹X credited."*
   - Scroll down to the next reel using swipe or the `ArrowDown` key on your keyboard. Notice completed ads indicate *"Already earned"*.

3. **Generate Referral Link & Share:**
   - Tap the **"Share"** button on any reel overlay, or navigate to **"Promote & Refer"** (`/promote`).
   - Select a campaign (e.g., *boAt Lifestyle - Share & Promote*).
   - Click **"Generate Link"** to create a unique referral URL (e.g., `http://localhost:5000/api/r/REF-XYZ123`).
   - Copy the link or open it in a new browser tab. Notice it logs a deduplicated unique visit and forwards directly to the target product.

4. **Submit Promotional Proof:**
   - On the `/promote` page under *"Submit Evidence of Promotion"*, enter a screenshot URL or description (e.g., *"Shared on WhatsApp status with 150 views"*).
   - Click **"Submit Proof for Verification"**.
   - Notice a pending reward is created and visible in *"My Promotional Proofs History"*.

5. **Admin Verification & Approval:**
   - Sign in as Admin (`admin@rewardads.test` / `Admin@12345`) or open `/admin/activities` in an incognito window.
   - Under **"Activity Queue"**, view the pending submission with the user's proof text and referral metrics.
   - Click **"Approve"**: enter the required audit reason (*"Valid social engagement confirmed"*).
   - The server atomically credits the user's wallet, updates the transaction ledger, increments the campaign's `spentBudget`, logs an `AuditLog`, and sends an in-app notification.

6. **Simulated Payout (Withdrawal):**
   - Switch back to the consumer app and open **"Rewards Wallet"** (`/wallet`).
   - Observe the live Recharts area graph, the newly credited transaction, and the updated redeemable balance.
   - Click **"Withdraw Simulated Funds"**: enter an amount $\ge ₹100$, select *UPI*, enter your VPA (`user@upi`), and click **"Confirm"**.
   - The wallet balance immediately decrements, creating a debit withdrawal transaction record.

7. **Coupon / Deal Redemption:**
   - Go to **"Deals & Coupons"** (`/deals`).
   - Notice expired deals are displayed greyed out.
   - Click **"Reveal Voucher Code"** on any active deal to unlock the unique promo code.

8. **Fraud & Security Sentinel:**
   - Go to `/admin/fraud` to inspect the suspicious activity sentinel.
   - View flagged AdViews (e.g., fast skips or velocity anomalies) and multi-account device collisions.
   - Test one-click **"Suspend User"** to immediately block policy violators.

---

## 🧪 Automated Verification Test Suite

You can execute the built-in end-to-end test suite at any time:

```bash
cd backend
node src/utils/test-journey.js
```

**Results:**
```text
====================================================
TEST SUITE RESULTS: 33 PASSED, 0 FAILED
====================================================
```

---

## 🛡️ Key Platform Protections & Quality Standards

- **Server-Decided Completion:** Video progress is computed strictly on the server from heartbeat timestamps. Seeking ahead, fast-forwarding, or client spoofing is rejected and flagged.
- **Duplicate Prevention:** Unique compound MongoDB indexes ensure no user can ever claim duplicate rewards on the same ad campaign (`{ userId: 1, campaignId: 1, sourceType: 'AD_VIEW' }`).
- **Budget Integrity:** Campaigns cannot exceed their total funded budget. Admin activation is blocked if the budget is insufficient.
- **Audit Trails:** Every admin decision requires a mandatory reason and writes an immutable record to the `AuditLog` collection.
