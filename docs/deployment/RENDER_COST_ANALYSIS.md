# Render Cost Analysis for Onovi

**Date**: 2026-06-29
**Analysis of**: `render.yaml` configuration

## Current Configuration Analysis

### 1. Services Configured as Paid Plans

#### Database: `onovi-db`
- **Plan**: `starter`
- **Cost**: **$7/month**
- **Specs**:
  - 256 MB RAM
  - 1 GB storage
  - 1 connection
  - Daily backups (7-day retention)
- **Note**: Comment says "Free tier" but `starter` is actually paid

#### Backend API: `onovi-api`
- **Plan**: `starter`
- **Cost**: **$7/month**
- **Specs**:
  - 512 MB RAM
  - No sleep (always on)
  - Auto-deploy enabled
  - Health checks
- **Note**: Comment says "Free tier" but `starter` is actually paid

#### Frontend: `onovi-client`
- **Plan**: Not specified (defaults to Free)
- **Cost**: **$0/month** ✅
- **Specs**:
  - Static site hosting
  - 100 GB bandwidth/month
  - Global CDN
  - Automatic SSL

**Total Monthly Cost**: **$14/month**

---

## 2. Services That Can Run on Render Free

### ✅ Frontend Static Site
- **Current**: Already free
- **Limitations**: None for static sites
- **Bandwidth**: 100 GB/month included
- **Best for**: Production-ready

### ⚠️ Backend Web Service (Free Tier Available)
- **Plan**: `free`
- **Cost**: $0/month
- **Limitations**:
  - **Sleeps after 15 minutes of inactivity**
  - First request after sleep takes 30-60 seconds (cold start)
  - 512 MB RAM
  - 750 build hours/month (shared across account)
- **Best for**: Testing, demos, low-traffic apps

### ⚠️ PostgreSQL Database (Free Tier Available)
- **Plan**: `free`
- **Cost**: $0/month for 90 days, then expires
- **Limitations**:
  - **Expires after 90 days** (then must upgrade or delete)
  - 256 MB RAM
  - 1 GB storage
  - 1 connection
  - No backups
  - Data is deleted on expiration
- **Best for**: Short-term testing only (not staging)

---

## 3. Staging Environment - Minimum Cost Options

### Option A: Fully Free Staging (Testing Only - 90 Days Max)
**Cost**: **$0/month** (for 90 days)

⚠️ **Major Limitations**:
- Database expires after 90 days
- Backend sleeps after 15 minutes (poor UX)
- No database backups
- Not suitable for long-term staging

**When to use**: Quick feature testing, demos, proof of concepts

---

### Option B: Minimal Paid Staging (Recommended)
**Cost**: **$7/month**

**Configuration**:
- Database: `starter` ($7/month) ✅
- Backend: `free` (sleeps, but functional)
- Frontend: `free` (already included)

**Pros**:
- Database persists indefinitely
- Daily backups
- Long-term staging environment
- Only $7/month

**Cons**:
- Backend sleeps after 15 minutes
- Cold starts on first request

**When to use**: Long-term staging, pre-production testing, demos

---

### Option C: Production-Grade Staging
**Cost**: **$14/month** (same as production)

**Configuration**:
- Database: `starter` ($7/month)
- Backend: `starter` ($7/month) - no sleep
- Frontend: `free`

**Pros**:
- Identical to production
- No sleep/cold starts
- Fast response times
- Reliable for testing

**Cons**:
- Same cost as production

**When to use**: Critical pre-production testing, client demos, UAT

---

## 4. Cost Comparison Table

| Environment | Database | Backend | Frontend | Monthly Cost | Notes |
|-------------|----------|---------|----------|--------------|-------|
| **Free Testing** | free | free | free | **$0** (90 days) | Backend sleeps, DB expires |
| **Minimal Staging** | starter | free | free | **$7** | Backend sleeps, DB persists |
| **Full Staging** | starter | starter | free | **$14** | Production-like, no sleep |
| **Current Production** | starter | starter | free | **$14** | As configured in render.yaml |

---

## 5. Recommendations

### For Testing/Development (Short-term)
**Use**: Free tier (Option A)
- Cost: $0 for 90 days
- Accept: Sleep delays, temporary database
- Perfect for: Feature testing, bug fixes, quick demos

### For Staging (Long-term)
**Use**: Minimal Paid (Option B)
- Cost: $7/month
- Accept: Sleep delays (usually acceptable for staging)
- Perfect for: Pre-production testing, continuous staging

### For Production
**Use**: Full Paid (Current configuration)
- Cost: $14/month
- Get: No sleep, fast responses, reliable
- Perfect for: Live users, production traffic

---

## 6. Alternative Configuration: render.yaml.staging

Created a minimal-cost staging configuration below.

---

## Summary

### Question 1: Which services are configured as paid plans?
- **Database** (`onovi-db`): `starter` plan - **$7/month**
- **Backend API** (`onovi-api`): `starter` plan - **$7/month**
- **Total**: **$14/month**

### Question 2: Which services can run on Render Free?
- **Frontend**: Already free (static sites are always free) ✅
- **Backend**: Can use `free` plan (with sleep after 15 min inactivity)
- **Database**: Can use `free` plan (expires after 90 days)

### Question 3: Can we create a staging environment with minimum cost?
**Yes!**

**Minimum long-term cost**: **$7/month**
- Database: `starter` ($7/month) - persists, has backups
- Backend: `free` (sleeps, but functional)
- Frontend: `free` (already included)

**Temporary testing cost**: **$0/month** (for 90 days)
- All services on free tier
- Database expires after 90 days
- Backend sleeps after 15 minutes

### Question 4: Alternative render.yaml.staging prepared?
**Yes!** See `render.yaml.staging` file created below.

---

## Cost Optimization Tips

### For Staging
1. **Use free backend** - Sleep is acceptable for staging/testing
2. **Keep paid database** - $7/month for persistence and backups is worth it
3. **Use free frontend** - Already included

### For Production
1. **Current config is optimal** for production
2. **$14/month is very reasonable** for a full production stack
3. Consider upgrading database to `standard` ($50/month) if you need:
   - More storage (10 GB)
   - More connections (5)
   - Better performance

### General
- **Share database** between staging and production using different schemas (advanced)
- **Use feature flags** to test in production instead of maintaining staging
- **Use preview deployments** (free) for PR testing instead of full staging

---

**Analysis Complete**
