# Neon + Vercel Setup - Quick Reference

## Current Status
✅ Code updated for environment variables  
✅ No hard-coded ports  
✅ Database URL from Neon  
✅ Vercel configs added  

---

## Your Neon Connection String
```
postgresql://neondb_owner:npg_f5weT3iGojCh@ep-rough-sound-aq7ejks9.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## What Changed

### Files Updated
| File | Change |
|------|--------|
| `.env` | Now uses `DATABASE_URL` from Neon, removed `POSTGRES_*` vars |
| `docker-compose.yml` | Removed local DB, added DNS config for Neon |
| `backend/Dockerfile` | Uses `PORT` env var instead of hard-coded 8000 |
| `backend/vercel.json` | Added for Vercel Python deployment |
| `frontend/vercel.json` | Added for Vercel Next.js-style deployment |

### Environment Variables Summary

**Backend (set in Vercel)**:
```
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://your-frontend.vercel.app
LOW_STOCK_THRESHOLD=10
```

**Frontend (set in Vercel)**:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## Local Testing (Optional)

If Docker DNS issues persist, test your Neon connection directly:
```bash
# Install psql, then test
psql "postgresql://neondb_owner:npg_f5weT3iGojCh@ep-rough-sound-aq7ejks9.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Should connect to Neon database
```

---

## Deployment Steps

### 1. Backend to Vercel
```bash
cd backend
vercel --prod
```

Or: Import from GitHub → Set Root Dir to `backend/` → Add env vars

### 2. Frontend to Vercel
```bash
cd frontend
vercel --prod
```

Or: Import from GitHub → Set Root Dir to `frontend/` → Add env vars

### 3. Set Vercel Environment Variables

**Backend project**:
- `DATABASE_URL` = your Neon connection string
- `CORS_ORIGINS` = your frontend Vercel URL

**Frontend project**:
- `VITE_API_URL` = your backend Vercel URL + `/api`

---

## Expected URLs After Deployment

- **Frontend**: `https://my-inventory-app.vercel.app`
- **Backend**: `https://inventory-api.vercel.app`
- **Database**: Neon managed (no public URL)

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| API returns 404 | Check `VITE_API_URL` in frontend env vars |
| CORS error | Verify `CORS_ORIGINS` includes frontend URL |
| Database connection error | Verify `DATABASE_URL` in backend env vars |
| Local Docker DNS fails | See DEPLOYMENT_GUIDE.md troubleshooting section |

---

## Next: Push to GitHub & Deploy

```bash
git add .
git commit -m "Setup Neon + Vercel deployment"
git push origin main
```

Then import repos into Vercel Dashboard → both will auto-deploy!

---

For detailed setup, see: `DEPLOYMENT_GUIDE.md`
