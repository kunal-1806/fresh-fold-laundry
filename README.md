# 🫧 FreshFold — Laundry Service Web App

A complete, responsive front end for an on-demand laundry service. Built with plain
HTML, CSS and JavaScript — no build step, no dependencies, no backend required.

## Features

- **Marketing site** — hero, services, how-it-works, pricing plans, testimonials, FAQ
- **Booking form** — validated fields, service picker, pickup date & slot, express
  add-on, and a live price estimate
- **Order tracking** — look up an order by ID and see a status timeline with progress
- **Persistence** — orders are saved in `localStorage`, so booking → tracking works
  end-to-end with no server
- **Demo order** — `FF-482913` is seeded automatically; use the *Advance status* button
  to walk it through the pipeline during a demo
- **Responsive** — mobile nav, fluid grids, sensible breakpoints
- **Accessible** — semantic landmarks, focus styles, labelled inputs, reduced-motion support

## Files

```
index.html     markup for the whole site
styles.css     design system + all styling
app.js         booking, validation, storage, tracking, nav
404.html       friendly not-found page
netlify.toml   publish config + security/cache headers
```

## Run locally

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Deploy to Netlify

**Option A — drag & drop (fastest)**

1. Go to <https://app.netlify.com/drop>
2. Drag this folder onto the page
3. Done — you get a live URL in seconds

**Option B — Git**

1. Push this folder to GitHub/GitLab
2. Netlify → *Add new site* → *Import an existing project*
3. Pick the repo. Build command: *(empty)*. Publish directory: `.`
4. Deploy

`netlify.toml` already sets `publish = "."`, so no dashboard tweaking is needed.

## Notes

Orders live in the visitor's browser. For a real product you'd swap `readOrders` /
`writeOrders` in `app.js` for API calls — the rest of the UI stays the same.
