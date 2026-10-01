# Wide City Smart Digital Homes

Full-stack e-commerce website for home & kitchen appliances, computer accessories and electronics. Built with a responsive human-centered UI, product search/filtering, product details, persistent cart, contact/services sections and M-Pesa Daraja STK Push backend.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm start
```

Open http://localhost:5000

## M-Pesa setup

Copy `.env.example` to `.env` and add your Daraja credentials. Keep `.env` out of GitHub.

`DARAJA_CALLBACK_URL` must be a publicly reachable HTTPS URL for production.

## Vercel

Push this folder to GitHub and import the repository into Vercel. The project uses Express in `server.js` and static assets in `public/`, which is the supported Vercel layout for Express/static files.

Set the Daraja environment variables in Vercel Project Settings → Environment Variables. Use production Daraja credentials only for a production deployment.
