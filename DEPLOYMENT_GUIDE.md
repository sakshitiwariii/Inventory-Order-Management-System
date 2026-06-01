# Deployment Guide: Neon PostgreSQL + Vercel

This guide explains how to deploy your Inventory Management System with Neon (PostgreSQL) and Vercel.

## Architecture
- **Database**: Neon PostgreSQL Cloud (managed)
- **Backend API**: Vercel (Python/FastAPI)
- **Frontend**: Vercel (React/Vite)
- **Environment Variables**: No hard-coded ports or database credentials

---

## Prerequisites

1. **Neon Account & Database**
   - Sign up at [https://neon.tech](https://neon.tech)
   - Create a PostgreSQL database
   - Copy your connection string: `postgresql://user:password@host/dbname?sslmode=require`

2. **Vercel Account**
   - Sign up at [https://vercel.com](https://vercel.com)
   - Connect your GitHub repository

3. **GitHub Repository**
   - Push your code to GitHub
   - Ensure `.env` is in `.gitignore`

---

## Local Testing with Neon

### 1. Update `.env` file
```
# .env - DO NOT commit sensitive values
DATABASE_URL=postgresql://neondb_owner:npg_f5weT3iGojCh@ep-rough-sound-aq7ejks9.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require

BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8000/api

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOW_STOCK_THRESHOLD=10
```

### 2. Run Locally with Docker Compose
```bash
docker-compose up -d
```

### Troubleshooting Docker DNS Issues
If you get "Temporary failure in name resolution", your Docker network can't reach Neon. Fix it:

**On Windows (Docker Desktop)**:
1. Right-click Docker Desktop → Settings
2. Go to Resources → Network
3. DNS Server: Set to `8.8.8.8`
4. Click Apply & Restart

**Alternative**: Use WSL 2 backend (Settings → General → WSL 2)

Or manually test the connection:
```bash
# From your machine (not Docker)
psql "postgresql://neondb_owner:npg_f5weT3iGojCh@ep-rough-sound-aq7ejks9.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

---

## Backend Deployment (Vercel)

### 1. Create `vercel.json` in backend root
```json
{
  "builds": [
    {
      "src": "app/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app/main.py"
    }
  ]
}
```

### 2. Add to `requirements.txt`
Ensure these are included (already should be):
```
fastapi==0.115.6
uvicorn[standard]==0.32.1
sqlalchemy==2.0.36
psycopg2-binary==2.9.10
pydantic==2.10.3
python-dotenv==1.0.1
```

### 3. Update backend code for Vercel
Edit `backend/app/main.py` to use Vercel's PORT env var:

Already updated in Dockerfile:
```bash
sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
```

### 4. Deploy to Vercel
```bash
cd backend
vercel --prod
```

Or deploy from GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Set Root Directory to `backend/`
5. Add Environment Variables (see below)
6. Click Deploy

### 5. Set Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` |
| `LOW_STOCK_THRESHOLD` | `10` |

Your backend URL will be: `https://your-project.vercel.app`

---

## Frontend Deployment (Vercel)

### 1. Update Frontend for Production API
The frontend already reads `VITE_API_URL` from environment variables.

### 2. Create `frontend/.vercelignore` (optional)
```
node_modules
```

### 3. Deploy to Vercel
```bash
cd frontend
vercel --prod
```

Or from GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Set Root Directory to `frontend/`
5. Add Build Command: `npm run build`
6. Add Output Directory: `dist`
7. Add Environment Variables (see below)
8. Click Deploy

### 4. Set Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` |

Your frontend URL will be: `https://your-project.vercel.app`

---

## Complete Environment Variables Reference

### Backend (Vercel)
```
DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require
CORS_ORIGINS=https://your-frontend.vercel.app,https://www.your-domain.com
LOW_STOCK_THRESHOLD=10
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## Testing Deployment

### Test Backend API
```bash
curl https://your-backend.vercel.app/health
# Expected response: {"status":"ok"}

curl https://your-backend.vercel.app/api/products
# Expected response: {"items":[],"total":0,"page":1,"page_size":10}
```

### Test Frontend
Visit `https://your-frontend.vercel.app` and check:
1. Dashboard loads without errors
2. Click Products → API calls work
3. Open DevTools Console → no CORS errors
4. Add a product → saves to Neon

---

## Database Management

### Access Neon Dashboard
1. Go to [neon.tech](https://neon.tech)
2. Select your project
3. View tables, run SQL queries, monitor usage

### Create Tables Manually (if needed)
The backend creates tables on startup via SQLAlchemy. If tables don't exist:

```python
# Run this once from your machine
from app.database import engine, Base
from app.models import customer, order, product

Base.metadata.create_all(bind=engine)
```

---

## CI/CD with GitHub

### Auto-deploy on Push
Both Vercel deployments can be set to auto-deploy on push to `main`:

1. Vercel Dashboard → Settings → Git
2. Enable "Deploy on Push"
3. Set Production Branch to `main`

Now every push to main automatically deploys!

---

## Rollback & Monitoring

### Vercel Deployments
- Dashboard shows all deployments
- Click any previous deployment to promote to Production
- View logs in "Deployments" tab

### Neon Database
- Backups available in Neon Dashboard
- Monitor query performance in Analytics
- Scale compute as needed

---

## Troubleshooting

### CORS Error: "Access to XMLHttpRequest blocked"
- Check `CORS_ORIGINS` env var includes your frontend URL
- Ensure frontend is using correct `VITE_API_URL`

### 502/503 Errors on Backend
- Check Vercel logs: Deployments → select deployment → Logs
- Verify `DATABASE_URL` is set in Vercel environment
- Ensure Neon database is running (check neon.tech dashboard)

### Frontend shows "Not Found" on API calls
- Verify `VITE_API_URL` is set correctly
- Check that it includes `/api` prefix
- Test backend directly: `curl $VITE_API_URL/products`

### Database Connection Timeout
- Verify Neon connection string is correct
- Check Neon dashboard for active connections limit
- Ensure SSL mode is `require` in connection string

---

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] Never commit `DATABASE_URL` to GitHub
- [ ] Use strong Neon password
- [ ] Enable Neon IP allowlist (if available)
- [ ] CORS_ORIGINS is restricted to your domain
- [ ] Backend requires HTTPS (automatic with Vercel)

---

## Cost Optimization

**Neon**: Free tier includes
- 3 projects
- Autoscaling storage
- 1 branch

**Vercel**: Free tier includes
- Unlimited deployments
- Fast preview deploys
- $0 after 100GB bandwidth/month

---

## Next Steps

1. ✅ Update `.env` with Neon connection string
2. ✅ Test locally with `docker-compose up -d`
3. ✅ Push code to GitHub
4. ✅ Deploy backend to Vercel
5. ✅ Set backend environment variables in Vercel
6. ✅ Deploy frontend to Vercel
7. ✅ Set frontend environment variables in Vercel
8. ✅ Test production URLs
9. ✅ Enable auto-deploy on GitHub push

For questions, check Vercel docs: https://vercel.com/docs
For Neon questions: https://neon.tech/docs
