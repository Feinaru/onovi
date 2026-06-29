# Pre-Deployment Checklist

Complete this checklist before deploying Onovi to production.

## 🔐 Security

- [ ] **Environment Variables**
  - [ ] JWT_SECRET is randomly generated (use `openssl rand -base64 32`)
  - [ ] No secrets in git history
  - [ ] .env files are in .gitignore
  - [ ] .env.example files are up to date

- [ ] **Authentication**
  - [ ] Password hashing working (bcrypt)
  - [ ] JWT token generation working
  - [ ] JWT token validation working
  - [ ] Session persistence working
  - [ ] Role-based access control working (Customer, Business, Admin)

- [ ] **Database Security**
  - [ ] Database password is strong
  - [ ] Database URL is kept secret
  - [ ] SQL injection protection verified (using Prisma)
  - [ ] Database backups configured

- [ ] **API Security**
  - [ ] CORS properly configured
  - [ ] Input validation on all routes
  - [ ] Rate limiting considered (optional)
  - [ ] XSS protection in place

## 📊 Database

- [ ] **PostgreSQL Setup**
  - [ ] PostgreSQL database created
  - [ ] Database connection tested locally
  - [ ] Migrations run successfully
  - [ ] Seed data loaded (categories, admin user)

- [ ] **Schema Validation**
  - [ ] `npx prisma validate` passes
  - [ ] All models have proper indexes
  - [ ] Foreign keys are correct
  - [ ] Unique constraints verified

- [ ] **Migrations**
  - [ ] All migrations in `prisma/migrations/` folder
  - [ ] Migrations tested locally
  - [ ] Rollback strategy prepared
  - [ ] Migration history documented

## 🧪 Testing

- [ ] **Functionality Testing**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Customer can browse businesses
  - [ ] Customer can book appointments
  - [ ] Business can create services
  - [ ] Business can manage slots
  - [ ] Admin can approve businesses
  - [ ] CRM system works (leads, timeline, notes)

- [ ] **API Testing**
  - [ ] All API endpoints tested
  - [ ] Error handling works
  - [ ] Validation errors return proper messages
  - [ ] 404 errors handled
  - [ ] 500 errors handled gracefully

- [ ] **Address System**
  - [ ] GPS location works
  - [ ] Address search works
  - [ ] Map display works
  - [ ] Israeli address codes working
  - [ ] Geocoding working

- [ ] **Cross-Browser Testing**
  - [ ] Chrome/Edge tested
  - [ ] Firefox tested
  - [ ] Safari tested
  - [ ] Mobile browsers tested

- [ ] **RTL (Hebrew) Testing**
  - [ ] Text direction correct
  - [ ] Form layouts correct
  - [ ] Map controls positioned correctly
  - [ ] No layout breaks

## 🎨 Frontend

- [ ] **Build Verification**
  - [ ] `npm run build` succeeds in client/
  - [ ] No build warnings (or all reviewed)
  - [ ] dist/ folder created
  - [ ] Assets copied correctly
  - [ ] Logo displays correctly

- [ ] **Performance**
  - [ ] Page load time acceptable
  - [ ] Images optimized
  - [ ] Bundle size reasonable (<500KB gzipped)
  - [ ] Lazy loading considered for large components

- [ ] **Responsive Design**
  - [ ] Desktop (1920x1080) tested
  - [ ] Laptop (1366x768) tested
  - [ ] Tablet (768x1024) tested
  - [ ] Mobile (375x667) tested

- [ ] **Accessibility**
  - [ ] Forms have proper labels
  - [ ] Buttons have descriptive text
  - [ ] Error messages are clear
  - [ ] Keyboard navigation works

## 🔧 Backend

- [ ] **Build Verification**
  - [ ] All dependencies installed
  - [ ] Prisma client generated
  - [ ] Server starts without errors
  - [ ] Health check endpoint works (`GET /`)

- [ ] **API Routes**
  - [ ] /api/auth/* working
  - [ ] /api/businesses/* working
  - [ ] /api/categories/* working
  - [ ] /api/services/* working
  - [ ] /api/slots/* working
  - [ ] /api/bookings/* working
  - [ ] /api/leads/* (CRM) working
  - [ ] /api/address/* working

- [ ] **Error Handling**
  - [ ] Try-catch blocks in place
  - [ ] Errors logged properly
  - [ ] User-friendly error messages
  - [ ] No sensitive info in error responses

- [ ] **Logging**
  - [ ] Request logging enabled
  - [ ] Error logging enabled
  - [ ] Log level configured (info, warn, error)
  - [ ] Logs don't contain sensitive data

## 📦 Deployment Configuration

- [ ] **Render Configuration**
  - [ ] `render.yaml` reviewed
  - [ ] Build commands verified
  - [ ] Start commands verified
  - [ ] Environment variables documented

- [ ] **Build Scripts**
  - [ ] `server/build.sh` executable
  - [ ] `server/start.sh` executable
  - [ ] `client/build.sh` executable
  - [ ] Scripts tested locally

- [ ] **Environment Files**
  - [ ] `server/.env.example` complete
  - [ ] `client/.env.example` complete
  - [ ] All required variables documented
  - [ ] Optional variables documented

## 📝 Documentation

- [ ] **Code Documentation**
  - [ ] README.md complete
  - [ ] API endpoints documented
  - [ ] Database schema documented
  - [ ] Deployment guide complete

- [ ] **Deployment Docs**
  - [ ] Render deployment guide (`docs/deployment/RENDER_DEPLOYMENT.md`)
  - [ ] Local PostgreSQL setup (`docs/deployment/LOCAL_POSTGRESQL_SETUP.md`)
  - [ ] Pre-deployment checklist (this file)
  - [ ] Troubleshooting guide

- [ ] **Architecture Docs**
  - [ ] Project structure documented
  - [ ] Data flow documented
  - [ ] Authentication flow documented
  - [ ] CRM system documented

## 🚀 Render Setup

- [ ] **Account Ready**
  - [ ] Render.com account created
  - [ ] Payment method added (if using paid tier)
  - [ ] GitHub connected
  - [ ] Repository access granted

- [ ] **Database Service**
  - [ ] PostgreSQL database created
  - [ ] Database region selected (Oregon recommended)
  - [ ] Database plan selected (Starter minimum)
  - [ ] Connection strings saved

- [ ] **Backend Service**
  - [ ] Web service created
  - [ ] Repository connected
  - [ ] Build command configured
  - [ ] Start command configured
  - [ ] Environment variables added
  - [ ] Health check path set (`/`)

- [ ] **Frontend Service**
  - [ ] Static site created
  - [ ] Build command configured
  - [ ] Publish directory set (`dist`)
  - [ ] SPA routing configured (/* → /index.html)
  - [ ] Custom headers configured (optional)

## 🔄 Continuous Integration

- [ ] **Git Workflow**
  - [ ] main branch protected
  - [ ] develop branch for staging
  - [ ] Feature branches used
  - [ ] Pull requests required

- [ ] **Auto-Deploy**
  - [ ] Auto-deploy enabled on Render
  - [ ] Deploy from main branch only
  - [ ] Manual deploy for production
  - [ ] Rollback strategy documented

## 🌐 Domain Configuration (Optional)

- [ ] **Custom Domain**
  - [ ] Domain purchased
  - [ ] DNS records prepared
  - [ ] SSL certificate ready (Render auto-provisions)
  - [ ] api.domain.com for backend
  - [ ] domain.com for frontend

- [ ] **DNS Records**
  - [ ] A record or CNAME for frontend
  - [ ] A record or CNAME for backend
  - [ ] MX records for email (if needed)
  - [ ] TXT records for verification

## 📊 Monitoring

- [ ] **Logging Strategy**
  - [ ] Log aggregation considered
  - [ ] Error tracking considered (e.g., Sentry)
  - [ ] Performance monitoring considered

- [ ] **Health Checks**
  - [ ] Backend health check endpoint
  - [ ] Database health check
  - [ ] External API health check

- [ ] **Alerts**
  - [ ] Service down alerts
  - [ ] High memory usage alerts
  - [ ] High CPU usage alerts
  - [ ] Database connection alerts

## 💰 Cost Review

- [ ] **Render Costs**
  - [ ] Database plan: $____/month
  - [ ] Backend plan: $____/month
  - [ ] Frontend plan: $____/month
  - [ ] Total: $____/month

- [ ] **Additional Services**
  - [ ] Domain registration: $____/year
  - [ ] Email service: $____/month (if needed)
  - [ ] SMS service: $____/month (if needed)
  - [ ] Monitoring: $____/month (if needed)

## 🎯 Post-Deployment

After deployment, complete these tasks:

- [ ] **Verification**
  - [ ] Backend health check passes
  - [ ] Frontend loads correctly
  - [ ] Test user registration
  - [ ] Test user login
  - [ ] Test booking flow
  - [ ] Test admin functions

- [ ] **Performance**
  - [ ] Check response times
  - [ ] Check page load times
  - [ ] Verify database query performance
  - [ ] Check memory usage

- [ ] **Monitoring Setup**
  - [ ] Configure alerts in Render
  - [ ] Set up uptime monitoring
  - [ ] Configure error tracking
  - [ ] Set up log retention

- [ ] **Backups**
  - [ ] Verify automatic database backups
  - [ ] Test backup restoration
  - [ ] Document backup retention policy
  - [ ] Create manual backup procedure

## 📞 Emergency Contacts

Prepare contact list for deployment:

- [ ] **Technical Contacts**
  - [ ] Lead developer: _______________
  - [ ] DevOps: _______________
  - [ ] Database admin: _______________

- [ ] **Service Providers**
  - [ ] Render support: support@render.com
  - [ ] Domain registrar: _______________
  - [ ] Email provider: _______________

## 🔒 Secrets Management

- [ ] **Production Secrets**
  - [ ] JWT_SECRET generated and saved securely
  - [ ] Database password saved securely
  - [ ] API keys saved securely (if any)
  - [ ] Access to secret management tool

- [ ] **Access Control**
  - [ ] Render account access list
  - [ ] GitHub repository access list
  - [ ] Database access list
  - [ ] Admin account list

## ✅ Final Sign-Off

Before clicking "Deploy":

- [ ] All items in this checklist completed
- [ ] Technical lead approval
- [ ] Stakeholder approval
- [ ] Emergency rollback plan ready
- [ ] Support team briefed

---

**Deployment Date**: __________
**Deployed By**: __________
**Approved By**: __________

---

## Notes

_Use this section for any deployment-specific notes, issues, or considerations:_

```
[Add notes here]
```

---

**Last Updated**: 2026-06-29
