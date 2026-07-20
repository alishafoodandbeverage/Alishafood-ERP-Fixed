<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8fd40810-56c9-4dab-a170-5a0ba2dae3fd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Security and deployment notes

- Authentication is server-side and uses an HttpOnly session cookie. Browser localStorage is no longer used as an authentication mechanism.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the server. Do not commit `.env` files or real credentials.
- Application state writes require an authenticated session. Password fields in branch state are removed from API responses and hashed before persistence when present.
- The password-reset endpoint intentionally does not claim to send email unless a real email provider is configured.
- For production deployments with multiple server instances, replace the in-memory session store with a shared session store such as Redis.
- Run `npm run lint` and `npm run build` before deployment.
