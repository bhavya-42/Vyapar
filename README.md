# Vyapar Pro

A small shop billing and ledger application with a static HTML/CSS/JavaScript client and an Express/MySQL backend.

## Requirements

- Node.js 18 or newer
- MySQL 5.7.8 or newer (or a compatible MySQL server with JSON column support)

## Run locally

1. Create the database tables by running `Server/schema.sql` in MySQL.
2. Copy `Server/.env.example` to `Server/.env` and set your local MySQL credentials. Keep `.env` private; it is ignored by Git.
3. In a terminal, run `npm install` and then `npm start` from the `Server` folder.
4. Open `Client/FRONTEND.HTML` in a browser. The default API address is `http://localhost:5000`.
5. In development, the demo OTP is `123456` by default. Set `TEST_OTP` in `Server/.env` to change it.

To point the client at a different backend, define `window.VYAPAR_API_URL` before `FRONTEND.JS` loads in `Client/FRONTEND.HTML`, using the backend origin without `/api`.

## Before deployment

The current OTP endpoints are development-only and return an error when `NODE_ENV=production`. Real SMS OTP delivery, authentication/session security, database access controls, production CORS configuration, and HTTPS must be implemented before using this app with real accounts or data. Do not deploy with the demo OTP enabled.