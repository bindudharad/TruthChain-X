# TruthChain-X Deployment Guide

## Recommended deployment patterns

### Lowest-risk demo deployment

Deploy the entire Next.js app as one service:

- Vercel for the fullstack app, or
- Render as a Node web service

This is the cleanest path because the current repo contains both frontend pages and backend API routes.

### Split deployment

If you want frontend on Vercel and backend on Render:

1. Keep the backend API on Render
2. Set `NEXT_PUBLIC_API_URL` on the frontend
3. Point client-side fetches to the Render backend
4. Avoid server components that require direct database access from the frontend-only deployment

For this repo today, the fullstack deployment is the simplest production path.

## Vercel

1. Push the repo to GitHub
2. Import the project in Vercel
3. Framework preset: Next.js
4. Add environment variables from `.env.example`
5. Redeploy after saving variables

Official references:

- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment variables](https://vercel.com/docs/environment-variables)

## Render

1. Create a new Web Service
2. Connect the repo
3. Runtime: Node
4. Build Command: `npm ci && npm run build`
5. Start Command: `npm run start -- --hostname 0.0.0.0 --port $PORT`
6. Health Check Path: `/api/health`
7. Add environment variables from `.env.example`

Or use the included [`render.yaml`](C:\Programs\codex\TruthChain%20AI\render.yaml).

Official references:

- [Deploy a Next.js App](https://render.com/docs/deploy-nextjs-app)
- [Web Services](https://render.com/docs/web-services)

## MongoDB Atlas

1. Create a cluster
2. Create a database user
3. Allow network access for your deployment platform
4. Copy the SRV connection string into `MONGODB_URI`

For demo use, temporary `0.0.0.0/0` access is acceptable. Lock this down before real launch.

## Polygon Amoy deployment

1. Fund the deployer wallet with Amoy testnet MATIC
2. Set:
   - `CHAIN_RPC_URL`
   - `CHAIN_PRIVATE_KEY`
3. Run:

```bash
npm run chain:compile
npm run chain:deploy
```

4. Copy the emitted contract address into:
   - `CHAIN_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_BLOCKCHAIN_CONTRACT`

## Live test checklist

1. `GET /api/health`
2. Upload content and verify result
3. Confirm MongoDB persistence
4. Re-upload same content and check cache hit behavior
5. Confirm blockchain queue or confirmed transaction
6. Check `/analytics`, `/reports`, and `/api-hub`

## Troubleshooting

### Build fails on deployment

- Ensure all required env vars are set
- Run `npm run build` locally first

### Backend cannot connect to MongoDB

- Check Atlas IP allowlist
- Check username and password encoding in `MONGODB_URI`

### Blockchain writes stay queued

- Missing or invalid `CHAIN_RPC_URL`, `CHAIN_PRIVATE_KEY`, or `CHAIN_CONTRACT_ADDRESS`

### Frontend cannot reach backend

- Set `NEXT_PUBLIC_API_URL` to the deployed backend origin
- Make sure the backend URL is HTTPS
