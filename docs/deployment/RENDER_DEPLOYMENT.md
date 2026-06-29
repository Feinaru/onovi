# Onovi Deployment Guide - Render.com

This guide covers deploying Onovi to Render.com using PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend API Deployment](#backend-api-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Tasks](#post-deployment-tasks)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- [x] Render.com account (free tier available)
- [x] GitHub repository with Onovi code
- [x] Access to push to `main` branch
- [x] PostgreSQL database credentials ready

## Database Setup

### Option 1: Using Render Blueprint (Recommended)

The `render.yaml` file in the project root will automatically create the database.

### Option 2: Manual Database Creation

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `onovi-db`
   - Database: `onovi_production`
   - User: `onovi`
   - Region: `Oregon (US West)`
   - Plan: `Starter` (or Free for testing)
   - Click "Create Database"

3. **Note Database Credentials**
   - Internal Database URL (for backend connection)
   - External Database URL (for local migrations)
   - Save these securely

## Backend API Deployment

### Step 1: Create Web Service

1. **Go to Render Dashboard** → "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Name: `onovi-api`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `server`

3. **Configure Build Settings**
   - **Environment**: `Node`
   - **Build Command**: `./build.sh` or `npm install && npx prisma generate`
   - **Start Command**: `./start.sh` or `npx prisma migrate deploy && npm start`

4. **Configure Instance**
   - **Plan**: `Starter` ($7/month) or `Free` (limited)
   - **Environment Variables**: See [Environment Variables](#environment-variables)

5. **Advanced Settings**
   - Health Check Path: `/`
   - Auto-Deploy: `Yes` (deploys on git push)

### Step 2: Connect Database

Add environment variable:
```
DATABASE_URL = [Internal Database URL from Database service]
```

### Step 3: Deploy

- Click "Create Web Service"
- Wait for initial deploy (2-5 minutes)
- Check logs for errors

## Frontend Deployment

### Step 1: Create Static Site

1. **Go to Render Dashboard** → "New +" → "Static Site"

2. **Connect Repository**
   - Select your GitHub repository
   - Name: `onovi-client`
   - Branch: `main`
   - Root Directory: `client`

3. **Configure Build Settings**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Configure Custom Routes** (for SPA)
   - Add rewrite rule:
     - Source: `/*`
     - Destination: `/index.html`

5. **Deploy**
   - Click "Create Static Site"
   - Wait for build (1-3 minutes)

## Environment Variables

### Backend API (onovi-api)

Required variables:

```env
# Database (from Render PostgreSQL service)
DATABASE_URL=[Internal Database URL]

# Server
NODE_ENV=production
PORT=3000

# Authentication (generate secure secret)
JWT_SECRET=[Generate: openssl rand -base64 32]
JWT_EXPIRES_IN=7d

# External APIs
NOMINATIM_USER_AGENT=Onovi-Israel-Address-App/1.0

# CORS (optional - add your frontend URL)
CORS_ORIGIN=https://onovi-client.onrender.com
```

### Frontend (onovi-client)

Optional - only if using environment variables:

```env
VITE_API_URL=https://onovi-api.onrender.com
```

**Note**: The frontend `src/api.js` is configured to use relative URLs, so this may not be needed if you configure CORS properly.

## Post-Deployment Tasks

### 1. Run Database Migrations

Migrations run automatically on startup via `start.sh`:
```bash
npx prisma migrate deploy
```

If migrations fail, check:
- Database connection string is correct
- Database is accessible from Render
- Prisma schema is valid

### 2. Seed Database (Optional)

Connect to your Render shell:

1. Go to Render Dashboard → `onovi-api` service
2. Click "Shell" tab
3. Run:
```bash
npm run db:seed
```

This will create:
- Admin user
- Sample categories
- Test data (if any)

### 3. Verify Deployment

**Backend Health Check:**
```bash
curl https://onovi-api.onrender.com/
# Expected: {"message":"Onovi API is running"}
```

**Frontend:**
- Visit: `https://onovi-client.onrender.com`
- Test login and registration
- Test booking flow

### 4. Configure Custom Domain (Optional)

**Backend:**
1. Go to `onovi-api` → Settings → Custom Domain
2. Add domain: `api.onovi.com`
3. Update DNS records as instructed
4. Wait for SSL certificate

**Frontend:**
1. Go to `onovi-client` → Settings → Custom Domain
2. Add domain: `onovi.com` or `www.onovi.com`
3. Update DNS records
4. Wait for SSL certificate

### 5. Update Frontend API URL

If using custom domain, update `client/src/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.onovi.com';
```

Or set environment variable in Render:
```env
VITE_API_URL=https://api.onovi.com
```

## Monitoring and Logs

### View Logs

**Backend:**
- Render Dashboard → `onovi-api` → Logs tab
- Real-time streaming logs
- Filter by log level

**Database:**
- Render Dashboard → `onovi-db` → Logs tab
- Connection logs
- Query performance

### Metrics

- Render Dashboard → Service → Metrics
- CPU usage
- Memory usage
- Request count
- Response times

### Alerts

Set up alerts in Render:
- Service health check failures
- High memory usage
- High CPU usage
- Deploy failures

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solutions:**
1. Verify `DATABASE_URL` is the **Internal Database URL**
2. Check database service is running
3. Check IP allowlist (should be empty for Render services)
4. Test connection in shell:
```bash
npx prisma db pull
```

### Migration Failures

**Error**: `Migration failed to apply`

**Solutions:**
1. Check Prisma schema syntax
2. Roll back and retry:
```bash
npx prisma migrate reset
npx prisma migrate deploy
```
3. Check for conflicting migrations
4. Manually fix database schema if needed

### Build Failures

**Backend build fails:**
- Check `build.sh` is executable: `chmod +x build.sh`
- Verify `package.json` has all dependencies
- Check Node.js version compatibility

**Frontend build fails:**
- Check Vite configuration
- Verify all imports are correct
- Check for TypeScript/JavaScript errors

### CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solutions:**
1. Add frontend URL to backend CORS:
```javascript
// server/src/app.js
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
```

2. Set `CORS_ORIGIN` environment variable in backend:
```env
CORS_ORIGIN=https://onovi-client.onrender.com,https://onovi.com
```

### 502 Bad Gateway

**Error**: `502 Bad Gateway`

**Solutions:**
1. Check backend service is running
2. Check health check endpoint returns 200
3. Verify `PORT` is set to 3000 (or matches what Express listens on)
4. Check logs for startup errors

### Out of Memory

**Error**: `JavaScript heap out of memory`

**Solutions:**
1. Upgrade to a paid plan (Starter or higher)
2. Optimize code to use less memory
3. Add Node.js memory flag in start command:
```bash
node --max-old-space-size=512 index.js
```

## Scaling and Performance

### Database

- **Starter Plan**: 1 GB storage, 1 connection
- **Standard Plan**: 10 GB storage, 5 connections
- **Pro Plan**: Custom storage, 20+ connections

### Backend API

- **Free**: 512 MB RAM, sleeps after 15 min inactivity
- **Starter**: 512 MB RAM, no sleep
- **Standard**: 2 GB RAM
- **Pro**: 4+ GB RAM, horizontal scaling

### Caching

Consider adding Redis for:
- Session storage
- API response caching
- Rate limiting

## Security Checklist

- [x] JWT_SECRET is randomly generated
- [x] DATABASE_URL is kept secret
- [x] HTTPS enabled (automatic on Render)
- [x] Environment variables not committed to git
- [x] CORS properly configured
- [x] SQL injection protection (Prisma)
- [x] Password hashing (bcrypt)
- [x] Input validation on API routes

## Backup and Disaster Recovery

### Database Backups

Render PostgreSQL includes:
- **Daily backups** (retained for 7 days on paid plans)
- Point-in-time recovery

To backup manually:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Code Backups

- Git repository serves as backup
- Tag releases:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Rollback Strategy

1. **Quick rollback**: Render Dashboard → Deploys → Rollback
2. **Git rollback**: Revert commit and push
3. **Database rollback**: Restore from backup

## Cost Estimate

### Free Tier (Testing Only)
- Database: Free (90 days, then $7/month)
- Backend: Free (with sleep)
- Frontend: Free
- **Total**: $0 (then $7/month)

### Production (Recommended)
- Database: Starter ($7/month)
- Backend: Starter ($7/month)
- Frontend: Free
- **Total**: $14/month

### Production + Custom Domains
- Database: Starter ($7/month)
- Backend: Starter ($7/month)
- Frontend: Free
- Custom Domain: Free (DNS only)
- **Total**: $14/month

## Next Steps

1. ✅ Database deployed
2. ✅ Backend API deployed
3. ✅ Frontend deployed
4. ✅ Migrations applied
5. ✅ Seed data loaded
6. ✅ Health checks passing
7. ⬜ Custom domain configured (optional)
8. ⬜ Monitoring alerts set up
9. ⬜ SSL certificates verified
10. ⬜ Performance testing

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Prisma Docs**: https://www.prisma.io/docs

---

**Last Updated**: 2026-06-29
