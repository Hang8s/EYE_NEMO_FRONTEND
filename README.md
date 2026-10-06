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

Messages show the original followed by every archived edit, with an edit label,
date/time and that version's media. Searches include historical text and captions;
reply previews show the current target. Missing originals, incomplete legacy
history and files with an unknown historical version are labeled explicitly.
Expired media stays in the history as unavailable. Deploy backend migrations
`0006_message_snapshots` and `0007_version_search_indexes` before this frontend.
Older backend responses without `versions` still render a single message.

Chats and older messages load in pages. Photos load near the viewport; documents,
including image documents, load on click. Shared media downloads use an authenticated
32-MiB in-memory cache and release object URLs on unmount or expiry. Cancelled chat
and search requests cannot replace the current view.

Run `npm test` and `npm run build` before deploying through the existing GitHub Pages
workflow. Deploy the backend migrations/API before publishing this frontend: opaque
`next_cursor` values are sent through the `cursor` query parameter.
