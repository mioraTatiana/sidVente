# Backend SID API

API locale sans dependance externe (Node.js natif).

## Run

```bash
node backend/server.mjs
```

## Endpoints

- `GET /api/health`
- `GET /api/reports/summary?months=6&family=Global`
- `GET /api/reports/monthly?months=12&family=Electronique`

## Data source

- `backend/data/sales_stock.json`