# Quick Setup Guide - Without Docker

Since Docker isn't installed, here are the easiest ways to get your backend running:

## Option 1: Use Supabase (Recommended - Free & Fast) ⭐

Supabase provides free PostgreSQL hosting:

1. Go to https://supabase.com
2. Create a free account
3. Create a new project
4. Copy your database connection string (found in Settings > Database)
5. Update your `.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

## Option 2: Use Neon.tech (Free PostgreSQL)

1. Go to https://neon.tech
2. Sign up and create a project
3. Copy the connection string
4. Update your `.env` file with the connection string

## Option 3: Install PostgreSQL Manually

### Install PostgreSQL:
1. Download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Install PostgreSQL 16
3. During installation:
   - Set password for postgres user: `palyrenet123`
   - Default port: `5432`
4. After installation, create a database:

```powershell
# Open PostgreSQL SQL Shell (psql) from Start menu
# Then run:
CREATE DATABASE palyrenet_db;
CREATE USER palyrenet WITH PASSWORD 'palyrenet123';
GRANT ALL PRIVILEGES ON DATABASE palyrenet_db TO palyrenet;
```

## Skip Redis for Now

Redis is optional for initial development. Comment out Redis-related code if you're not using it yet.

## Next Steps

Once you have a database URL:

1. Update `.env` with your DATABASE_URL
2. Run migrations:
```powershell
npx prisma generate
npx prisma migrate dev --name init
```
3. Start the server:
```powershell
npm run start:dev
```

## Free Cloud Database Options Comparison

| Service | PostgreSQL | Free Tier | Setup Time |
|---------|-----------|-----------|------------|
| Supabase | ✅ | 500MB, 2GB bandwidth | 2 minutes |
| Neon | ✅ | 3GB storage | 2 minutes |
| Railway | ✅ | $5 free credit/month | 3 minutes |
| Render | ✅ | Expires after 90 days | 3 minutes |

**Recommendation**: Use Supabase - it's the easiest and includes additional features you might use later.
