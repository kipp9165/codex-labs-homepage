# Codex Q/A v2.0 — Deployment Guide

## Render Deployment
1. Push repo to GitHub.
2. Create new Web Service in Render.
3. Use Dockerfile OR build/start commands:
   - Build: npm install && npm run build
   - Start: npm start
4. Add environment variables from .env.example.
5. Deploy.

## Vercel Deployment (Optional)
- vercel.json included.
- Run: vercel --prod

## Production Notes
- Tailwind is fully configured.
- Next.js is production-ready.
- All pages and components included.
- Deterministic build.