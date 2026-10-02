# Telegram Business Archive Mini App

Set `VITE_API_BASE_URL` to the public backend URL, then run:

```sh
npm install
npm run dev
```

For production, use `npm run build` and deploy `dist/` over HTTPS. The backend `FRONTEND_ORIGIN` must exactly match this origin.

## GitHub Pages

Pushes to `main` deploy automatically through GitHub Actions. In the GitHub repository, enable **Settings → Pages → Source: GitHub Actions**. Add a repository variable named `VITE_API_BASE_URL` with the public backend URL before deploying a working Mini App.
