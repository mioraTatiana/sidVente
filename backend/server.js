require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ventestock",
  password: process.env.DB_PASS || "miorapost12",
  port: process.env.DB_PORT || 5432,
});

const upload = multer({ dest: "nifi/input/" });

// /api/data - all records for dashboard
app.get("/api/data", async (req, res) => {
  try {
    app.get("/api/data", async (req, res) => {
      try {
        const result = await pool.query(`
      SELECT 
        id_ventestoque,
        date_vente,
        produit,
        categorie,
        CAST(quantite_vendue AS INTEGER) AS quantite_vendue,
        CAST(prix_unitaire AS NUMERIC) AS prix_unitaire,
        CAST(quantite_stock AS INTEGER) AS quantite_stock
      FROM ventestockes 
      WHERE date_vente IS NOT NULL 
      ORDER BY date_vente DESC 
      LIMIT 1000
    `);
        res.json(result.rows);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/upload - process CSV
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const fileId = uuidv4();
    const inputPath = req.file.path;
    const outputPath = `nifi/output/processed-${fileId}.csv`;

    // Parse et insert DB
    const results = [];
    fs.createReadStream(inputPath)
      .pipe(
        csv([
          "date_vente",
          "produit",
          "categorie",
          "quantite_vente",
          "prix_unitaire",
          "quantite_stock",
        ]),
      )
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        for (const row of results) {
          await pool.query(
            `
            INSERT INTO public.ventestockes (date_vente, produit, categorie, quantite_vendue, prix_unitaire, quantite_stock)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
            [
              row.date_vente,
              row.produit,
              row.categorie,
              parseInt(row.quantite_vente),
              parseFloat(row.prix_unitaire),
              parseInt(row.quantite_stock),
            ],
          );
        }
        // Create fake output file (NiFi simu)
        await fs.writeFile(
          outputPath,
          `Processed ${results.length} rows for ${fileId}`,
        );
        res.json({ success: true, fileId, count: results.length });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/status/:fileId - poll for NiFi done
app.get("/api/status/:fileId", (req, res) => {
  const outputPath = `nifi/output/processed-${req.params.fileId}.csv`;
  fs.pathExists(outputPath, (err, exists) => {
    res.json({ done: exists });
  });
});

app.listen(3001, () => console.log("Backend on http://localhost:3001"));
