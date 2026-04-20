# Setup Local - Projet SID Reporting

Ce projet contient 4 blocs:

1. Frontend React/Vite/Tailwind (`src/`)
2. Backend API Node.js (`backend/`)
3. Scripts SQL Data Warehouse (`sql/`)
4. Blueprint Apache NiFi (`nifi/`)

## 1) Lancer le frontend

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## 2) Lancer le backend API

Dans un second terminal:

```bash
node backend/server.mjs
```

Backend: `http://localhost:4000`

Test rapide:

```bash
curl http://localhost:4000/api/health
curl "http://localhost:4000/api/reports/summary?months=6&family=Global"
```

## 3) Initialiser le Data Warehouse (PostgreSQL)

Dans ta base PostgreSQL:

```bash
psql -U sid_user -d sid -f sql/01_schema.sql
psql -U sid_user -d sid -f sql/02_seed.sql
psql -U sid_user -d sid -f sql/03_kpi_views.sql
```

## 4) Reproduire le flow NiFi

1. Ouvre Apache NiFi.
2. Cree un Process Group `sid-sales-stock-reporting`.
3. Ajoute les processors selon `nifi/flow-template.json`.
4. Configure le pool JDBC PostgreSQL.
5. Connecte les processors dans l ordre indique.

## Arborescence utile

- `src/App.tsx`: dashboard SID connecte a l API
- `backend/server.mjs`: endpoints reporting
- `sql/*.sql`: schema + seed + vues KPI
- `nifi/flow-template.json`: blueprint pipeline