# Wireframe Void

An interactive 3D space built with Three.js — translucent cubes floating in an infinite wireframe grid.

## Controls

| Input | Action |
|-------|--------|
| Move mouse | Look around (first-person) |
| Scroll | Move up / down through the space |
| Pinch (trackpad) | Zoom in / out |
| Idle | Camera slowly drifts on its own |

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. No build settings needed — Vercel detects it as a static site automatically
4. Hit Deploy

## Local preview

Just open `index.html` directly in a browser — no build step or server needed.

## Stack

- [Three.js r128](https://threejs.org/) via CDN
- Vanilla JS, no framework
- Single HTML file, zero dependencies to install
