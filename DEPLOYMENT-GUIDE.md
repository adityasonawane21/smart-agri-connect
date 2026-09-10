# Smart Agri Connect — Deployment & Database Guide

This guide walks you through deploying your application online with a live cloud MySQL database in **under 5 minutes** completely for free.

---

## Architecture Summary

- **Frontend**: React + Vite (compiled to static files).
- **Backend**: Express / Node.js (serves API endpoints + static frontend files).
- **Database**: Cloud MySQL (100% free via TiDB Cloud Serverless or Aiven).
- **Auto-Initialization**: The backend automatically reads `database/database_complete.sql` upon first startup on any new cloud database. All 10 tables and demo records are created automatically.

---

## Step 1: Create a Free Cloud MySQL Database (2 Minutes)

Because a local database running on your personal computer cannot be reached by cloud servers, you need a free cloud MySQL database.

### Recommended: TiDB Cloud Serverless (Free Forever, No Credit Card)
1. Go to [https://tidbcloud.com](https://tidbcloud.com) and sign up (or sign in with Google / GitHub).
2. Click **Create Cluster** and select **Serverless (Free)**.
3. Click **Create**. Your cluster is ready in ~15 seconds!
4. Click **Connect** in your cluster dashboard:
   - Select **Connection Method**: **General Connection** or **Node.js**.
   - Note down:
     - **Host** (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`)
     - **Port** (usually `4000`)
     - **User** (e.g. `xxxxxx.root`)
     - **Password** (the password you created)
     - **Database Name** (e.g. `test` or create `smart_agri_connect`)

*(Alternatively, you can use [Aiven for MySQL](https://aiven.io) or [Railway](https://railway.app)).*

---

## Step 2: Deploy to Render (Free Web Service)

1. Go to [https://render.com](https://render.com) and sign up / log in with your GitHub account.
2. Click **New +** and choose **Web Service**.
3. Select your GitHub repository: `https://github.com/adityasonawane21/smart-agri-connect`.
4. Fill in the settings:
   - **Name**: `smart-agri-connect`
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, or Oregon).
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && cd backend && npm install`
   - **Start Command**: `node backend/server.js`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following keys with values from Step 1:
   - `NODE_ENV` = `production`
   - `DB_HOST` = `<your cloud DB host>`
   - `DB_PORT` = `4000` *(or `3306` if using Aiven/Railway)*
   - `DB_USER` = `<your cloud DB user>`
   - `DB_PASSWORD` = `<your cloud DB password>`
   - `DB_NAME` = `<your cloud DB name>`
   - `DB_SSL` = `true`
   *(Or, if your provider gave you a single `DATABASE_URL`, just set `DATABASE_URL` instead!)*
6. Click **Deploy Web Service**.

---

## What Happens Automatically on Deploy?

1. Render builds your frontend React application into `dist/`.
2. The Express server starts and connects to your cloud database.
3. The server checks if tables exist. If empty, it **automatically runs `database/database_complete.sql`**, creating all 10 tables and inserting all sample data.
4. Render gives you a public live URL (e.g. `https://smart-agri-connect.onrender.com`).
5. Open the URL in your browser — your full-stack app and database are live!
