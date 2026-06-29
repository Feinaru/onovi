# Local PostgreSQL Setup Guide

This guide covers setting up PostgreSQL locally for Onovi development.

## Table of Contents

1. [Install PostgreSQL](#install-postgresql)
2. [Configure Database](#configure-database)
3. [Update Environment Variables](#update-environment-variables)
4. [Run Migrations](#run-migrations)
5. [Seed Database](#seed-database)
6. [Verify Setup](#verify-setup)
7. [Troubleshooting](#troubleshooting)

## Install PostgreSQL

### macOS

**Using Homebrew (Recommended):**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
psql --version
```

**Using Postgres.app:**
1. Download from https://postgresapp.com
2. Move to Applications folder
3. Open Postgres.app
4. Initialize (creates default server)

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Windows

1. Download installer from https://www.postgresql.org/download/windows/
2. Run installer
3. Follow installation wizard
4. Note down password for `postgres` user
5. Add PostgreSQL bin to PATH

## Configure Database

### Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Or on Linux:
sudo -u postgres psql
```

```sql
-- Create database user
CREATE USER onovi WITH PASSWORD 'your_secure_password';

-- Create development database
CREATE DATABASE onovi_dev OWNER onovi;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE onovi_dev TO onovi;

-- Exit psql
\q
```

### Test Connection

```bash
# Test connection
psql -U onovi -d onovi_dev -h localhost

# If successful, you'll see:
# onovi_dev=>

# Exit
\q
```

## Update Environment Variables

### Server Environment

1. **Navigate to server directory:**
```bash
cd server
```

2. **Update `.env` file:**
```bash
# Copy from example if not exists
cp .env.example .env

# Edit .env
nano .env  # or use your preferred editor
```

3. **Set DATABASE_URL:**
```env
DATABASE_URL="postgresql://onovi:your_secure_password@localhost:5432/onovi_dev"
PORT=3000
NODE_ENV=development
JWT_SECRET="change-this-secret-in-production"
```

**Connection String Format:**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Example:**
- User: `onovi`
- Password: `mypassword`
- Host: `localhost`
- Port: `5432` (default)
- Database: `onovi_dev`

Result:
```
postgresql://onovi:mypassword@localhost:5432/onovi_dev
```

## Run Migrations

### Generate Prisma Client

```bash
cd server
npx prisma generate
```

This creates the Prisma Client based on your schema.

### Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This will:
1. Create a new migration file
2. Apply the migration to your database
3. Generate Prisma Client

**Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "onovi_dev" at "localhost:5432"

Applying migration `20260629120000_init`

The following migration(s) have been applied:

migrations/
  └─ 20260629120000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Verify Migration

```bash
# View database schema
npx prisma studio

# Or inspect with psql
psql -U onovi -d onovi_dev
```

```sql
-- List tables
\dt

-- Should see tables:
-- User, Category, Business, Service, Slot, Booking, Lead, TimelineEvent, LeadNote

-- Describe a table
\d "User"

-- Exit
\q
```

## Seed Database

### Run Seed Script

```bash
cd server
npm run db:seed
```

**What gets seeded:**
- Admin user (for testing)
- Categories (e.g., רופאים, מספרות, מכוני כושר)
- Sample businesses (optional)

**Default Admin Credentials:**
Check `server/prisma/seed.js` for default credentials.

### Verify Seeded Data

```bash
npx prisma studio
```

Or with SQL:
```bash
psql -U onovi -d onovi_dev
```

```sql
-- Count users
SELECT COUNT(*) FROM "User";

-- Count categories
SELECT COUNT(*) FROM "Category";

-- View categories
SELECT id, name FROM "Category";

\q
```

## Verify Setup

### Start Backend Server

```bash
cd server
npm run dev
```

**Expected output:**
```
[nodemon] starting `node index.js`
✅ Onovi API running on port 3000
✅ Connected to database
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/
# Expected: {"message":"Onovi API is running"}

# Get categories
curl http://localhost:3000/api/categories
# Expected: JSON array of categories
```

### Start Frontend

```bash
cd client
npm run dev
```

**Expected output:**
```
VITE v8.1.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.100:5173/
```

### Test Full Application

1. Open browser: http://localhost:5173
2. Register a new account
3. Browse businesses
4. Test booking flow

## Troubleshooting

### "Connection refused"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Check if PostgreSQL is running:
```bash
# macOS (Homebrew)
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# All platforms
pg_isready
```

2. Start PostgreSQL if not running:
```bash
# macOS (Homebrew)
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services app
```

### "Password authentication failed"

**Symptoms:**
```
Error: password authentication failed for user "onovi"
```

**Solutions:**
1. Verify password in `.env` matches database
2. Reset password:
```bash
psql postgres
ALTER USER onovi WITH PASSWORD 'new_password';
\q
```
3. Update `.env` with new password

### "Database does not exist"

**Symptoms:**
```
Error: database "onovi_dev" does not exist
```

**Solutions:**
```bash
# Create database
createdb -U onovi onovi_dev

# Or with psql
psql postgres
CREATE DATABASE onovi_dev OWNER onovi;
\q
```

### "Prisma Client not generated"

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solutions:**
```bash
cd server
npx prisma generate
```

### "Migration failed"

**Symptoms:**
```
Error: Migration failed to apply cleanly to the shadow database
```

**Solutions:**

1. **Reset database (WARNING: deletes all data):**
```bash
npx prisma migrate reset
```

2. **Or manually fix:**
```bash
# Drop and recreate database
psql postgres
DROP DATABASE onovi_dev;
CREATE DATABASE onovi_dev OWNER onovi;
\q

# Re-run migrations
npx prisma migrate dev
```

### Port 5432 already in use

**Symptoms:**
```
Error: port 5432 is already in use
```

**Solutions:**
1. Stop existing PostgreSQL instance
2. Change port in PostgreSQL config
3. Use different port in DATABASE_URL:
```env
DATABASE_URL="postgresql://onovi:password@localhost:5433/onovi_dev"
```

### Permission denied

**Symptoms:**
```
Error: permission denied for database "onovi_dev"
```

**Solutions:**
```bash
psql postgres
GRANT ALL PRIVILEGES ON DATABASE onovi_dev TO onovi;
\q
```

## Database Management

### Useful Commands

```bash
# Open Prisma Studio (GUI)
cd server
npx prisma studio

# View current database schema
npx prisma db pull

# Reset database (deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name description_of_change

# Apply migrations (production)
npx prisma migrate deploy

# Format Prisma schema
npx prisma format

# Validate Prisma schema
npx prisma validate
```

### Backup Database

```bash
# Backup to file
pg_dump -U onovi onovi_dev > backup.sql

# Backup with custom format (smaller)
pg_dump -U onovi -Fc onovi_dev > backup.dump
```

### Restore Database

```bash
# Restore from SQL file
psql -U onovi -d onovi_dev < backup.sql

# Restore from custom format
pg_restore -U onovi -d onovi_dev backup.dump
```

## Development Workflow

### Making Schema Changes

1. **Edit Prisma schema:**
```bash
# Edit server/prisma/schema.prisma
code server/prisma/schema.prisma
```

2. **Create migration:**
```bash
cd server
npx prisma migrate dev --name add_new_field
```

3. **Verify changes:**
```bash
npx prisma studio
```

### Switching Databases

**Development → Test:**
```env
# .env.test
DATABASE_URL="postgresql://onovi:password@localhost:5432/onovi_test"
```

**Development → Production:**
```env
# .env.production
DATABASE_URL="postgresql://user:pass@prod-host:5432/onovi_prod"
NODE_ENV=production
```

## Performance Optimization

### Connection Pooling

Prisma automatically manages connection pooling. Configure in schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Optional: connection pooling
  // connection_limit = 10
}
```

### Indexes

Already defined in schema for common queries:
- `Lead.status`
- `Lead.nextActionAt`
- `Lead.createdAt`
- `TimelineEvent.[leadId, createdAt]`
- `LeadNote.[leadId, createdAt]`

### Query Optimization

Use Prisma's query logging:
```typescript
// In development
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

## Next Steps

- [x] PostgreSQL installed
- [x] Database created
- [x] Migrations applied
- [x] Seed data loaded
- [x] Application running locally
- [ ] Review database schema
- [ ] Configure backup strategy
- [ ] Set up development database snapshots

## Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Prisma Docs**: https://www.prisma.io/docs
- **pg_dump Manual**: https://www.postgresql.org/docs/current/app-pgdump.html

---

**Last Updated**: 2026-06-29
