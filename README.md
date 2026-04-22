# Ventes Stock Dashboard - Full Stack

## Frontend (React/Vite)
```bash
npm install
npm run dev  # http://localhost:5173
```

## Backend (Express/Postgres)
```bash
cd backend
cp .env.example .env  # edit creds
npm install
npm start  # http://localhost:3001
```

## Postgres
- psql: `\\i init.sql` ou pgAdmin import.

## NiFi (optionnel)
- Config flow dans nifi/README.md

## Prod
`npm run build` → serve dist/
Backend PM2/upstart.

Upload CSV → backend → DB + nifi/output → dashboard auto-update !