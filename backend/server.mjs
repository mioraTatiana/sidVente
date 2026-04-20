import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.join(__dirname, "data", "sales_stock.json");
const port = Number(process.env.PORT ?? 4000);

const families = {
  Global: { salesFactor: 1, stockFactor: 1 },
  Electronique: { salesFactor: 1.16, stockFactor: 0.93 },
  Alimentaire: { salesFactor: 0.92, stockFactor: 1.09 },
  Textile: { salesFactor: 0.81, stockFactor: 1.12 },
};

const readJsonDataset = async () => {
  const raw = await readFile(datasetPath, "utf8");
  return JSON.parse(raw);
};

const normalizeQuery = (url) => {
  const months = Math.max(1, Math.min(12, Number(url.searchParams.get("months") ?? "6")));
  const familyParam = url.searchParams.get("family") ?? "Global";
  const family = Object.hasOwn(families, familyParam) ? familyParam : "Global";
  return { months, family };
};

const adaptRows = (rows, family) => {
  const factor = families[family];
  return rows.map((row) => ({
    month: row.month,
    sales: Math.round(row.sales * factor.salesFactor),
    stock: Math.round(row.stock * factor.stockFactor),
    reorderPoint: row.reorderPoint,
  }));
};

const buildSummary = (rows, months, family) => {
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  const averageStock = rows.reduce((sum, row) => sum + row.stock, 0) / rows.length;
  const salesPerMonth = totalSales / rows.length;
  const stockCoverageDays = averageStock / (salesPerMonth / 30);
  const lowStockEvents = rows.filter((row) => row.stock < row.reorderPoint).length;
  const salesTrendPct = ((rows.at(-1).sales - rows[0].sales) / rows[0].sales) * 100;

  return {
    months,
    family,
    totalSales,
    averageStock,
    stockCoverageDays,
    lowStockEvents,
    salesTrendPct,
  };
};

const writeJson = (response, code, payload) => {
  response.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
};

createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 400, { error: "Request URL manquante" });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (url.pathname === "/api/health") {
      writeJson(response, 200, { status: "ok", service: "sid-reporting-api" });
      return;
    }

    if (url.pathname === "/api/reports/summary" || url.pathname === "/api/reports/monthly") {
      const { months, family } = normalizeQuery(url);
      const dataset = await readJsonDataset();
      const limitedRows = dataset.slice(-months);
      const rows = adaptRows(limitedRows, family);

      if (url.pathname === "/api/reports/monthly") {
        writeJson(response, 200, { months, family, data: rows });
      } else {
        writeJson(response, 200, buildSummary(rows, months, family));
      }
      return;
    }

    writeJson(response, 404, { error: "Route inconnue" });
  } catch (error) {
    writeJson(response, 500, {
      error: "Erreur interne API",
      details: error instanceof Error ? error.message : "Erreur non identifiee",
    });
  }
}).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SID API disponible sur http://localhost:${port}`);
});