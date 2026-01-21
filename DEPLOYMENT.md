# Deploying Logo Generation App to Coolify

This guide walks you through deploying the Smart Logo Generator from GitHub to Coolify.

## Prerequisites

- Coolify instance running (self-hosted or cloud)
- GitHub repository: `https://github.com/mlbd/logo-generation.git`
- FTP server credentials

---

## Step 1: Access Coolify Dashboard

1. Open your Coolify dashboard (e.g., `https://your-coolify-domain.com`)
2. Login with your admin credentials

---

## Step 2: Create a New Project

1. Click **"Projects"** in the sidebar
2. Click **"+ New Project"** or **"Add New"**
3. Enter project name: `logo-generation`
4. Click **"Create"**

---

## Step 3: Add a New Resource

1. Inside your project, click **"+ New Resource"** or **"Add Resource"**
2. Select **"Application"**
3. Choose **"GitHub"** as the source

---

## Step 4: Connect GitHub Repository

1. If not already connected, authorize Coolify to access your GitHub
2. Select repository: `mlbd/logo-generation`
3. Select branch: `main`
4. Click **"Continue"**

---

## Step 5: Configure Build Settings

Since this app has both a Vite frontend and Express backend, you have two options:

### Option A: Deploy as Nixpacks (Recommended)

Coolify will auto-detect Node.js. Configure:

| Setting | Value |
|---------|-------|
| Build Pack | Nixpacks |
| Base Directory | `/` |
| Build Command | `npm install && npm run build` |
| Start Command | `node server.js` |
| Publish Directory | `dist` |

### Option B: Deploy with Dockerfile

Create a `Dockerfile` in your repo:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "server.js"]
```

---

## Step 6: Configure Environment Variables

1. Go to **"Environment Variables"** tab
2. Add the following variables:

| Variable | Value |
|----------|-------|
| `FTP_HOST` | `ftp.lukpaluk.xyz` |
| `FTP_USER` | `your-ftp-username` |
| `FTP_PASS` | `your-ftp-password` |
| `FTP_PATH` | `/uploads` |
| `FTP_BASE_URL` | `https://lukpaluk.xyz/smart-logo-versions/uploads` |

> ⚠️ **Important**: Never commit `.env` to GitHub. Add variables directly in Coolify.

---

## Step 7: Configure Port & Domain

1. In **"Settings"** or **"Network"** tab:
   - Set **Exposed Port**: `3001`
   - Set **Domain**: `logo-gen.yourdomain.com` (or your preferred subdomain)

2. Enable **HTTPS** if using your own domain

---

## Step 8: Update Frontend API URL

Before deploying, update `src/services/uploadService.js`:

```javascript
// Change from localhost to your deployed server URL
const API_BASE_URL = 'https://logo-gen.yourdomain.com'
```

Commit and push this change:

```bash
git add .
git commit -m "Update API URL for production"
git push origin main
```

---

## Step 9: Deploy

1. Click **"Deploy"** button in Coolify
2. Wait for the build to complete (2-5 minutes)
3. Check the **Logs** tab for any errors

---

## Step 10: Verify Deployment

1. Visit your domain: `https://logo-gen.yourdomain.com`
2. Test image upload functionality
3. Verify FTP connection works

---

## Troubleshooting

### Build Fails
- Check Coolify build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### FTP Connection Errors
- Verify FTP credentials in environment variables
- Check if FTP server allows connections from Coolify's IP
- Ensure `basic-ftp` package is installed

### CORS Issues
- Update `server.js` to include your production domain in CORS origins:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://logo-gen.yourdomain.com'],
  methods: ['GET', 'POST', 'DELETE']
}))
```

---

## Alternative: Separate Frontend & Backend

For better scalability, you can deploy:

1. **Frontend (Vite)** → Vercel/Netlify (free static hosting)
2. **Backend (Express)** → Coolify

This separates concerns and allows independent scaling.

---

## Quick Reference

| What | Where |
|------|-------|
| GitHub Repo | https://github.com/mlbd/logo-generation.git |
| Frontend Port | 5173 (dev) |
| Backend Port | 3001 |
| Build Command | `npm run build` |
| Start Command | `node server.js` |

---

**Your app is now deployed! 🚀**
