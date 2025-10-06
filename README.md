# GAT Sport - Product Authentication System

Static + serverless deployment of the GAT Sport product authentication site.

## Overview
- Frontend: static files under `public/`
- API: serverless functions under `api/`
- QR redirect: `/api/qr?c=CODE` (add redirect from `/GS26/QR` if your labels use that path)

## Quick Start
- Serve the `public/` directory as static assets (e.g., Vercel/Netlify/Cloudflare Pages)
- Deploy `api/` as serverless functions (supported natively on Vercel/Netlify)

## Endpoints
- `POST /api/verify` — validates a product code against a hardcoded list and returns product info
- `GET /api/qr?c=CODE` — redirects to `/?c=CODE`
- `GET /api/random-code` — returns a random valid code and a QR URL to `/api/qr`

## Redirects
If your existing QR labels point to `/GS26/QR?c=CODE`, add a static redirect rule:
- Source: `/GS26/QR`
- Destination: `/?c=:c`
- Status: 302 or 308

Example (Vercel, vercel.json):
```json
{
  "routes": [
    {"src": "/GS26/QR", "dest": "/api/qr"}
  ]
}
```

## Notes
- This static+serverless variant removes the Node/Express server and PostgreSQL.
- If you need live DB validation or verification stats, reintroduce a serverless DB-backed API.


