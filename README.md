# Telegram Business Archive Mini App

Set `VITE_API_BASE_URL` to the public backend URL, then run:

```sh
npm install
npm run dev
```

For production, use `npm run build` and deploy `dist/` over HTTPS. The backend `FRONTEND_ORIGIN` must exactly match this origin.

## GitHub Pages

Pushes to `main` deploy automatically through GitHub Actions. In the GitHub repository, enable **Settings → Pages → Source: GitHub Actions**. Add a repository variable named `VITE_API_BASE_URL` with the public backend URL before deploying a working Mini App.

## Optimized archive browsing

Chats and older messages load in pages. Photos load near the viewport; documents,
including image documents, load on click. Shared media downloads use an authenticated
32-MiB in-memory cache and release object URLs on unmount or expiry. Cancelled chat
and search requests cannot replace the current view.

Run `npm test` and `npm run build` before deploying through the existing GitHub Pages
workflow. Deploy the backend migrations/API before publishing this frontend: opaque
`next_cursor` values are sent through the `cursor` query parameter.
