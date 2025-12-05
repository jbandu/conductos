# Railway Multi-Environment Deployment Guide

**Last Updated:** 2025-12-05

This guide explains how to deploy ConductOS to multiple Railway environments with different URLs for production and development.

---

## 🎯 Deployment Strategy

### **Option 1: Branch-Based Deployments (Recommended)**

Deploy different branches to different URLs within the same Railway project.

| Environment | Branch | URL | Purpose |
|------------|--------|-----|---------|
| **Production** | `production/stable` | conductos-prod.up.railway.app | Stable version for actual use |
| **Development** | `main` | conductos-dev.up.railway.app | Latest features, testing |

**Benefits:**
- Share the same project (easier management)
- Separate databases per environment
- Different environment variables
- Easy promotion: merge to production branch when ready

---

### **Option 2: Multiple Railway Projects**

Create completely separate Railway projects for each environment.

| Environment | Project | Branch | Database |
|------------|---------|--------|----------|
| **Production** | conductos-production | production/stable | Separate PostgreSQL |
| **Development** | conductos-development | main | Separate PostgreSQL |

**Benefits:**
- Complete isolation
- Separate billing/limits
- Can use different Railway teams/accounts
- More control over each environment

---

## 📋 Option 1 Setup: Branch-Based Deployments

### Step 1: Prepare Your Railway Project

1. **Login to Railway Dashboard**
   ```
   https://railway.app
   ```

2. **Go to your existing ConductOS project** (or create new)

3. **Click on your service** (conductos)

### Step 2: Add Production Service

1. **In your project, click "+ New"** → **"GitHub Repo"**

2. **Configure Production Service:**
   - Repository: `jbandu/conductos`
   - Branch: `production/stable`
   - Service Name: `conductos-production`

3. **Add PostgreSQL Database for Production:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Name it: `conductos-production-db`

4. **Configure Production Environment Variables:**

   Click on `conductos-production` → "Variables" tab:

   ```bash
   # Database (automatically set by Railway PostgreSQL plugin)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Server Configuration
   NODE_ENV=production
   PORT=3001

   # IMPORTANT: Generate a strong JWT secret
   # Run in terminal: openssl rand -base64 32
   JWT_SECRET=<paste-generated-secret-here>
   JWT_EXPIRES_IN=7d

   # Client URL (Railway will provide this after first deploy)
   CLIENT_URL=https://conductos-production.up.railway.app
   ```

5. **Deploy Production:**
   - Click "Deploy"
   - Wait for build to complete
   - Note the generated URL (e.g., `conductos-production.up.railway.app`)

### Step 3: Add Development Service

1. **In the same project, click "+ New"** → **"GitHub Repo"**

2. **Configure Development Service:**
   - Repository: `jbandu/conductos`
   - Branch: `main`
   - Service Name: `conductos-development`

3. **Add PostgreSQL Database for Development:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Name it: `conductos-development-db`

4. **Configure Development Environment Variables:**

   Click on `conductos-development` → "Variables" tab:

   ```bash
   # Database (automatically set by Railway PostgreSQL plugin)
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Server Configuration
   NODE_ENV=development
   PORT=3001

   # JWT Secret (can use simpler one for dev)
   JWT_SECRET=dev-secret-key-change-me
   JWT_EXPIRES_IN=7d

   # Client URL
   CLIENT_URL=https://conductos-development.up.railway.app
   ```

5. **Deploy Development:**
   - Click "Deploy"
   - Note the generated URL

### Step 4: Set Custom Domains (Optional)

Railway provides free `.up.railway.app` domains, but you can add custom domains:

1. **Production Domain:**
   - In `conductos-production` service → "Settings" → "Domains"
   - Click "Generate Domain" or add custom domain
   - Example: `app.conductos.com`

2. **Development Domain:**
   - In `conductos-development` service → "Settings" → "Domains"
   - Example: `dev.conductos.com` or keep Railway domain

---

## 📋 Option 2 Setup: Multiple Projects

### Step 1: Create Production Project

1. **Railway Dashboard** → **"New Project"**

2. **Select "Deploy from GitHub repo"**
   - Repository: `jbandu/conductos`
   - Branch: `production/stable`

3. **Add PostgreSQL:**
   - Click "+ New" → "Database" → "PostgreSQL"

4. **Configure Production Environment** (same as Option 1 Step 2)

5. **Deploy**

### Step 2: Create Development Project

1. **Railway Dashboard** → **"New Project"** (separate project)

2. **Select "Deploy from GitHub repo"**
   - Repository: `jbandu/conductos`
   - Branch: `main`

3. **Add PostgreSQL:**
   - Click "+ New" → "Database" → "PostgreSQL"

4. **Configure Development Environment** (same as Option 1 Step 3)

5. **Deploy**

---

## 🔄 Workflow: Pushing Changes

### For Development Features (main branch)

```bash
# Make changes in main branch
git checkout main

# Commit and push
git add .
git commit -m "Add new feature"
git push origin main
```

**Result:** Railway automatically deploys to development URL

### For Production Releases

```bash
# When development is stable, merge to production
git checkout production/stable
git merge main
git push origin production/stable
```

**Result:** Railway automatically deploys to production URL

### Emergency Hotfix to Production

```bash
# Make fix in production branch
git checkout production/stable

# Make changes, commit, push
git add .
git commit -m "Hotfix: critical bug"
git push origin production/stable

# Merge back to main
git checkout main
git merge production/stable
git push origin main
```

---

## 🔐 Security: Environment-Specific Secrets

### Production Secrets (Generate Unique)

```bash
# Generate strong JWT secret
openssl rand -base64 32

# Use Railway's built-in secret management
# Never commit secrets to git!
```

### Development Secrets

Can use simpler values for local dev, but still don't commit them.

---

## 📊 Managing Databases

### Seed Production Database

```bash
# Connect to production database via Railway CLI
railway login
railway link  # Select production project
railway run npm run seed:admin
```

### Seed Development Database

```bash
# Connect to development database
railway link  # Select development project
railway run npm run seed:admin
railway run npm run seed:users  # Add test users
```

### Database Backups

**Important:** Set up automatic backups in Railway:

1. Go to PostgreSQL service → "Data" tab
2. Enable automatic backups
3. Download backup: `railway pg:dump > backup-$(date +%Y%m%d).sql`

---

## 🚀 Deployment Checklist

### Before First Production Deploy

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (use openssl)
- [ ] Configure `CLIENT_URL` to production domain
- [ ] Review all environment variables
- [ ] Test database connection
- [ ] Run database migrations
- [ ] Seed admin user
- [ ] Test login with admin credentials
- [ ] Verify HTTPS is enabled

### Before Each Production Release

- [ ] Test in development environment
- [ ] Run security tests: `npm test`
- [ ] Review changelog/commits
- [ ] Create git tag for release
- [ ] Merge to `production/stable` branch
- [ ] Monitor deployment logs
- [ ] Test critical flows post-deploy
- [ ] Verify admin panel works
- [ ] Check IC composition compliance

---

## 🔍 Monitoring & Logs

### View Live Logs

**Railway Dashboard:**
1. Go to service (production or development)
2. Click "Deployments" tab
3. Click on active deployment
4. View real-time logs

**Railway CLI:**
```bash
# Production logs
railway link  # Select production service
railway logs

# Development logs
railway link  # Select development service
railway logs
```

### Common Issues

#### "Database connection failed"
```bash
# Check DATABASE_URL is set
railway variables

# Test connection
railway run npm run db:test
```

#### "Client build not found"
```bash
# Ensure build command runs
# Check railway.json or package.json scripts
railway logs --deployment <deployment-id>
```

#### "Port already in use"
```bash
# Railway auto-assigns PORT
# Make sure server uses process.env.PORT
```

---

## 📖 Branch Strategy Summary

```
production/stable (STABLE - deployed to productos-prod.up.railway.app)
    ↑
    │ (merge when tested)
    │
main (ACTIVE DEVELOPMENT - deployed to conductos-dev.up.railway.app)
    ↑
    │ (merge feature branches)
    │
feature/* (new features)
hotfix/* (urgent fixes)
```

### Example Flow

```bash
# 1. Develop new feature
git checkout -b feature/audit-log
# ... make changes ...
git commit -m "Add audit log viewer"

# 2. Merge to main (deploys to dev)
git checkout main
git merge feature/audit-log
git push origin main
# → Auto-deploys to development URL

# 3. Test in development
# Visit https://conductos-dev.up.railway.app
# Test thoroughly

# 4. Release to production
git checkout production/stable
git merge main
git tag v0.2-audit-log
git push origin production/stable
git push origin v0.2-audit-log
# → Auto-deploys to production URL

# 5. Verify production
# Visit https://conductos-prod.up.railway.app
```

---

## 🎯 Current URLs (Example)

After setup, you'll have:

| Environment | URL | Purpose | Branch |
|------------|-----|---------|--------|
| **Local Dev** | http://localhost:5174 | Your machine | any |
| **Railway Dev** | https://conductos-dev.up.railway.app | Testing | main |
| **Railway Prod** | https://conductos-prod.up.railway.app | Live users | production/stable |

---

## 💰 Railway Pricing Considerations

**Free Tier:**
- $5 USD free credit/month
- Good for 1-2 small services
- May need paid plan for multiple environments

**Paid Tier** ($5/month):
- $5 credit included
- Pay only for usage beyond credit
- Better for production + development setup

**Cost Optimization:**
- Share database between services (not recommended for prod)
- Use development service only when testing
- Scale down development when not in use

---

## 🆘 Troubleshooting

### "Service failed to deploy"

1. Check build logs in Railway dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`

### "Can't connect to database"

1. Check DATABASE_URL format in Railway
2. Verify PostgreSQL service is running
3. Check service can reach database (Railway handles this)

### "Application not loading"

1. Check if build completed successfully
2. Verify NODE_ENV and PORT are set
3. Check server logs for errors
4. Test API health: `https://your-url.railway.app/api/health`

---

## 📝 Quick Reference Commands

```bash
# Create new branch from checkpoint
git checkout v0.1-mvp-foundation -b production/stable

# Deploy to production
git checkout production/stable
git merge main
git push origin production/stable

# Rollback production
git checkout production/stable
git reset --hard v0.1-mvp-foundation
git push origin production/stable --force

# View Railway logs
railway logs --tail 100

# Run command in Railway environment
railway run npm run seed:admin

# Open deployed app
railway open
```

---

## ✅ Next Steps

1. Choose Option 1 (branch-based) or Option 2 (separate projects)
2. Set up Railway deployments following steps above
3. Configure environment variables for each environment
4. Deploy and test both environments
5. Document your production URL for team
6. Set up monitoring/alerts (optional)

---

**Questions or Issues?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/jbandu/conductos/issues
