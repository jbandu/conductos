# Render.com Deployment Guide - MVP Snapshot

This guide explains how to deploy the **stable MVP snapshot** of KelpHR ConductOS to Render.com.

## Deployment Strategy

- **Render.com**: Deploys `production/stable` branch - stable MVP snapshot
- **Railway**: Deploys `main` branch - incremental development updates

This separation allows you to maintain a stable production URL on Render while continuing active development on Railway.

## Prerequisites

1. Render.com account (free tier available)
2. GitHub repository connected to Render
3. `production/stable` branch created and pushed to GitHub

## Step 1: Create Production Stable Branch

If you haven't already created the checkpoint:

```bash
# Create and push the production/stable branch
git checkout -b production/stable
git push origin production/stable

# Return to main for continued development
git checkout main
```

## Step 2: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` in your repository

## Step 3: Configure Blueprint

Render will read your `render.yaml` file which defines:

### Web Service Configuration
- **Name**: `conductos-mvp`
- **Environment**: Node.js
- **Region**: Oregon
- **Plan**: Free
- **Branch**: `production/stable`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Database Configuration
- **Type**: PostgreSQL
- **Name**: `conductos-mvp-db`
- **Plan**: Free
- **Database Name**: `conductos`
- **Database User**: `conductos_user`

## Step 4: Environment Variables

Most environment variables are auto-configured via `render.yaml`, but you'll need to set `CLIENT_URL` after first deploy:

### Auto-Generated Variables
- `NODE_ENV` = production
- `PORT` = 3001
- `JWT_SECRET` = (auto-generated secure value)
- `JWT_EXPIRES_IN` = 7d
- `DATABASE_URL` = (auto-linked from database)

### Manual Configuration Required

After your first successful deploy:

1. Go to your web service in Render Dashboard
2. Navigate to "Environment" tab
3. Find the `CLIENT_URL` variable
4. Set it to your Render URL (e.g., `https://conductos-mvp.onrender.com`)
5. Save changes (this will trigger a redeploy)

## Step 5: Deploy

1. Click "Apply" to create all services
2. Render will:
   - Create PostgreSQL database
   - Create web service
   - Install dependencies
   - Build frontend
   - Start server
3. Initial deploy takes 5-10 minutes

## Step 6: Initialize Database

After first successful deploy, you need to run database migrations:

### Option A: Using Render Shell

1. Go to your web service
2. Click "Shell" tab
3. Run initialization commands:

```bash
# Check database connection
node -e "import('./server/db/pg-init.js').then(m => m.initializeDatabase())"

# Seed demo data (optional)
npm run seed:demo
```

### Option B: Connect Locally

1. Get database connection string from Render Dashboard:
   - Go to your PostgreSQL database
   - Copy "External Database URL"

2. Run migrations locally:

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://..."

# Run initialization
npm run db:init

# Seed demo data
npm run seed:demo
```

## Step 7: Verify Deployment

1. Visit your Render URL (e.g., `https://conductos-mvp.onrender.com`)
2. You should see the KelpHR ConductOS landing page
3. Test key features:
   - Employee signup/login
   - Case creation
   - Admin login
   - IC composition

## Monitoring and Logs

### View Logs
1. Go to your web service in Render Dashboard
2. Click "Logs" tab
3. Real-time logs show server activity

### Health Check
- Endpoint: `https://conductos-mvp.onrender.com/api/health`
- Should return: `{"status": "ok", "message": "KelpHR ConductOS API is running"}`

## Updating the Stable Deployment

When you want to update the production/stable branch with new stable features:

```bash
# On main branch, ensure all features are stable
git checkout main
git pull origin main

# Merge into production/stable
git checkout production/stable
git merge main

# Push to trigger Render redeploy
git push origin production/stable

# Return to main for continued development
git checkout main
```

Render will automatically detect the push and redeploy.

## Free Tier Limitations

### Render Free Tier
- **Web Service**: 750 hours/month (enough for 24/7 uptime for 1 app)
- **PostgreSQL**: 1GB storage, 1GB RAM
- **Sleep**: Services sleep after 15 minutes of inactivity
- **Cold Start**: First request after sleep takes 30-60 seconds

### Important Notes
- Your app will "wake up" on the first request (cold start)
- Subsequent requests are fast
- Database never sleeps (always available)

## Troubleshooting

### Build Fails

Check build logs for errors:
```bash
# Common issues:
# 1. Missing dependencies - check package.json
# 2. Environment variables - check render.yaml
# 3. Build command - should be: npm install && npm run build
```

### Database Connection Errors

1. Verify `DATABASE_URL` is set correctly
2. Check database is running (should show "Available" status)
3. Ensure database and web service are in same region

### Frontend Not Loading

1. Check if build succeeded:
   - Build creates `/client/dist` directory
   - Server should serve static files from there
2. Verify `startCommand` is `npm start`
3. Check server logs for file serving issues

### App Shows API Page Instead of Frontend

This means the client build is missing:
1. Check build command includes: `npm run build`
2. Verify `package.json` has build script
3. Check build logs for frontend build errors

## Support

### Render Documentation
- [Render Docs](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Deploy from GitHub](https://render.com/docs/deploy-from-github)

### KelpHR ConductOS
- Check `RAILWAY_DEPLOYMENT_GUIDE.md` for Railway-specific setup
- Check `RECOVERY_GUIDE.md` for checkpoint restoration

## Cost Optimization

### Staying on Free Tier
1. Use only 1 web service (this app)
2. Use only 1 PostgreSQL database
3. Monitor usage in Render Dashboard

### Upgrading (Optional)
If you need:
- No cold starts
- More database storage
- Custom domains
- More concurrent connections

Consider upgrading to Starter plan ($7/month for web, $7/month for database)

## Multi-Environment Workflow

### Development Flow
1. Work on `main` branch
2. Push to `main` → Railway auto-deploys (development environment)
3. Test features on Railway
4. When stable, merge to `production/stable` → Render auto-deploys (production environment)

### Example Workflow
```bash
# Daily development work
git checkout main
git add .
git commit -m "Add new feature"
git push origin main
# Railway deploys automatically

# When feature is stable and tested
git checkout production/stable
git merge main
git push origin production/stable
# Render deploys automatically

# Continue development
git checkout main
```

This keeps your Render production environment stable while Railway tracks your latest development work.
