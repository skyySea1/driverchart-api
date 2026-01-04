# Deploying Fastify API to Vercel

This guide outlines the steps to deploy the `driverchart-api` (Fastify) to Vercel as Serverless Functions.

## Prerequisites

1. **Vercel CLI**: Ensure you have the Vercel CLI installed and authenticated.

    ```bash
    npm i -g vercel
    vercel login
    ```

2. **Firebase Credentials**: You will need your Firebase Service Account private key content.

## Deployment Steps

### 1. Initialize Vercel Project

Navigate to the `driverchart-api` folder and link it to a Vercel project:

```bash
cd driverchart-api
vercel
```

Follow the prompts:

- **Set up and deploy?** `Y`
- **Which scope?** (Select your user/team)
- **Link to existing project?** `N` (Create a new one, e.g., `driverchart-api`)
- **In which directory is your code located?** `./` (Current directory)
- **Want to modify these settings?** `N`

### 2. Configure Environment Variables

You **MUST** set the production environment variables in Vercel.

**Note on FIREBASE_PRIVATE_KEY:**
To avoid newline issues, it is recommended to encode your key in Base64:
`echo -n "YOUR_KEY" | base64 -w 0`
Then set `FIREBASE_PRIVATE_KEY` to that Base64 string. The code handles both formats.

**FIREBASE_WEB_API_KEY:** Required for the `/api/auth/login` endpoint.
`vercel env add FIREBASE_WEB_API_KEY production`
(Use the value from `VITE_FIREBASE_API_KEY` in `vuebus/.env`).

### 3. Deploy to Production

Once environment variables are set, trigger a production deployment:

```bash
vercel --prod
```

## Common Issues & Troubleshooting

### 1. "Invalid export found in module /var/task/src/app.js"

**Symptom:** Your endpoints work, but you see errors in the Vercel Build/Runtime logs.
**Cause:** Vercel's scanner automatically identifies `.js` or `.ts` files in the root or `src/` directory and tries to treat them as independent Serverless Functions. If these files don't have a `default export` that returns a handler, Vercel throws an error.
**Fix:**

- Ensure `vercel.json` has `rewrites` pointing all traffic to `/api/index`.
- If logs remain "noisy", rename the `src/` directory to `lib/` (and update `tsconfig` and `api/index.ts` imports). Vercel ignores the `lib/` directory when searching for functions.

### 2. "ReferenceError: exports is not defined"

**Cause:** You have `"type": "module"` in `package.json` but your `tsconfig.json` is generating CommonJS code (`exports/require`).
**Fix:** Remove `"type": "module"` from `package.json` or update `tsconfig.json` to use `"module": "NodeNext"`.

### 3. "Invalid PEM formatted message"

**Cause:** The `FIREBASE_PRIVATE_KEY` is being mangled during the environment variable injection (usually missing `\n` characters).
**Fix:** Use the Base64 encoding method mentioned in Step 2.
