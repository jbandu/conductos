# Railway Environment Variables - Quick Reference

## Required Environment Variables

Set these in your Railway Dashboard → Service → **Variables** tab:

### 1. DATABASE_URL
```
postgresql://postgres:pVgteNleXyCzWWXMKyGcTAhzKmoBBGWe@nozomi.proxy.rlwy.net:48424/railway
```
**Note**: This should be automatically set when you add the PostgreSQL database service to your Railway project. Verify it matches your database connection string.

### 2. NODE_ENV
```
production
```
**Important**: Must be set to `production` for Railway deployment. This ensures:
- Server serves static client files from `client/dist`
- CORS allows your Railway domain
- Production optimizations enabled

### 3. PORT
```
3001
```
**Note**: Railway may override this with its own `$PORT` variable. Keep this for consistency with local setup.

### 4. CLIENT_URL
```
https://your-app-name.railway.app
```
**Important**: Update this AFTER your first deployment with your actual Railway URL.

To find your Railway URL:
1. Deploy your app first
2. Railway will assign a URL like: `https://conductos-production-xxxx.up.railway.app`
3. Copy that URL and set it as `CLIENT_URL`
4. Redeploy for CORS to work correctly

---

## Railway Service Configuration

### Root Directory
```
(leave empty)
```

### Build Command
```
npm run railway:build
```

### Start Command
```
npm run railway:start
```

### Install Command
```
npm install
```

---

## Current Database Status

✅ **Schema Initialized**: Tables `cases` and `status_history` created
✅ **Test Data Seeded**: 12 cases added
✅ **Special Cases Configured**:
- 2 Overdue cases: `KELP-2025-0003`, `KELP-2025-0004` (5 days past deadline)
- 1 Due today: `KELP-2025-0012`

---

## Deployment Checklist

Before deploying to Railway:

- [ ] Create Railway project
- [ ] Add PostgreSQL database service
- [ ] Copy `DATABASE_URL` from Railway database
- [ ] Set all 4 environment variables in Railway dashboard
- [ ] Connect GitHub repo (or use Railway CLI)
- [ ] Deploy
- [ ] Copy the Railway-assigned URL
- [ ] Update `CLIENT_URL` with that URL
- [ ] Redeploy
- [ ] Test the application

---

## Testing After Deployment

1. **Open your app**: `https://your-app-name.railway.app`
2. **Test Health Check**: Visit `/api/health`
3. **Test Employee Mode**: Type "What is PoSH?"
4. **Test IC Mode**:
   - Click "IC Mode"
   - Click "Show All Cases" → Should show 12 cases
   - Click "Overdue" → Should show 2 overdue cases with alert
   - Type `status KELP-2025-0001` → Should show case details

---

## Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Your connection details:
- **User**: `postgres`
- **Password**: `pVgteNleXyCzWWXMKyGcTAhzKmoBBGWe`
- **Host**: `nozomi.proxy.rlwy.net`
- **Port**: `48424`
- **Database**: `railway`

---

## Common Issues & Solutions

### "CORS Error" in browser console
**Solution**: Make sure `CLIENT_URL` matches your Railway URL exactly (including `https://`)

### "Cannot connect to database"
**Solution**: Verify `DATABASE_URL` is set correctly in Railway variables

### Blank page / no UI
**Solution**: Check that:
1. `NODE_ENV=production` is set
2. Build command ran successfully (check Railway logs)
3. `client/dist` directory exists after build

### API works but UI doesn't
**Solution**: Ensure the build command completed successfully. Check Railway build logs for errors.

---

## Quick Deploy Commands

```bash
# Using Railway CLI
railway login
railway init
railway up

# Or connect GitHub and auto-deploy from Railway Dashboard
```

---

**Status**: Ready to deploy!

Database is initialized and seeded with 12 test cases including overdue scenarios.
