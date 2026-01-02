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
- **Want to modify these settings?** `N` (Defaults are usually fine, but see "Build Settings" below if needed)

### 2. Configure Environment Variables

You **MUST** set the production environment variables in Vercel.

**Option A: Using Vercel CLI (Recommended)**
Run these commands in the terminal (replace values with your actual secrets):

```bash
vercel env add JWT_SECRET production
# Enter value: your-super-secure-secret

vercel env add FIREBASE_PROJECT_ID production
# Enter value: your-project-id

vercel env add FIREBASE_CLIENT_EMAIL production
# Enter value: firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

vercel env add FIREBASE_PRIVATE_KEY production
# Enter value: -----BEGIN PRIVATE KEY-----\n... (Paste the entire key including newlines)
# Note: Vercel handles newlines in the UI, or you can use "text" input in CLI.

vercel env add APP_ID production
# Enter value: dot-compliance-app
```

**Option B: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project `driverchart-api`.
3. Go to **Settings** > **Environment Variables**.
4. Add the keys listed in `.env.example`.

### 3. Deploy to Production

Once environment variables are set, trigger a production deployment:

```bash
vercel --prod
```

### 4. Verify Deployment

After deployment, Vercel will provide a URL (e.g., `https://driverchart-api.vercel.app`).

Test the health check:

```bash
curl https://driverchart-api.vercel.app/health
```

Test the swagger documentation:

```bash
https://driverchart-api.vercel.app/documentation
```

## Troubleshooting

- **Cold Starts**: Vercel Serverless Functions sleep after inactivity. The first request might take 1-2 seconds.
- **Firebase Auth Error**: If you see "Credential implementation provided to initializeApp() via the "credential" property failed", check your `FIREBASE_PRIVATE_KEY`. It must contain the `\n` characters exactly as provided by Google, or real newlines. The current code (`serverless.ts` -> `firebaseService.ts`) handles replaced `\n` strings:

    ```ts
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    ```
