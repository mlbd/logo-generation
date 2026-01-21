# Deploying Logo Generation App to Coolify

This guide walks you through deploying the Smart Logo Generator from GitHub to Coolify.

## Why this setup works
The application is configured to run as a **single resource**:
- **One Server**: Your Express backend handles API requests (`/api/...`) AND serves the React frontend.
- **Auto-Config**: The frontend automatically connects to the backend in production—no manual code changes needed.

## Prerequisites

- Coolify instance running (self-hosted or cloud)
- GitHub repository connected
- FTP server credentials

---

## Step 1: Create a New Project

1. Open Coolify Dashboard
2. Click **"+ New Project"**
3. Name it: `logo-generation` or similar
4. Click **"New Resource"** > **"Application"**
5. Select **"GitHub"** as source

---

## Step 2: Configure Repository

1. Select your repository: `mlbd/logo-generation`
2. Branch: `main`
3. Click **"Continue"**

---

## Step 3: Build Settings (Important!)

Coolify will detect it as a Node.js app. Verify these settings:

| Setting | Value |
|---------|-------|
| **Build Pack** | Nixpacks (default) |
| **Base Directory** | `/` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server.js` |
| **Publish Directory** | `.` |

> **Explanation**: 
> - `npm run build` compiles the React app into the `dist/` folder.
> - `node server.js` starts the backend, which serves both the API and that `dist/` folder.

---

## Step 4: Environment Variables

Click the **"Environment Variables"** tab and add these secrets:

| Variable | Value |
|----------|-------|
| `FTP_HOST` | `ftp.lukpaluk.xyz` |
| `FTP_USER` | `your-ftp-username` |
| `FTP_PASS` | `your-ftp-password` |
| `FTP_PATH` | `/uploads` |
| `FTP_BASE_URL` | `https://lukpaluk.xyz/smart-logo-versions/uploads` |

---

## Step 5: Port & Domain

1. Go to **"Settings"** or **"Network"**
2. **Exposed Port**: `3001` (This is where your Express server runs)
3. **Domain**: Set your desired domain (e.g., `https://logos.yourdomain.com`)

---

## Step 6: Deploy

1. Click **"Deploy"**
2. Wait for the build logs to finish

**That's it!** You do NOT need to deploy the frontend separately. The single `node server.js` process handles everything.
