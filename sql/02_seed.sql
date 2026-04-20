-- Seed SID dimensions and sample facts

INSERT INTO sid_dw.dim_date (date_key, full_date, month_label, month_number, quarter_number, year_number)
VALUES
  (20250101, '2025-01-01', 'Jan', 1, 1, 2025),
  (20250201, '2025-02-01', 'Fev', 2, 1, 2025),
  (20250301, '2025-03-01', 'Mar', 3, 1, 2025),
  (20250401, '2025-04-01', 'Avr', 4, 2, 2025),
  (20250501, '2025-05-01', 'Mai', 5, 2, 2025),
  (20250601, '2025-06-01', 'Juin', 6, 2, 2025),
  (20250701, '2025-07-01', 'Juil', 7, 3, 2025),
  (20250801, '2025-08-01', 'Aout', 8, 3, 2025),
  (20250901, '2025-09-01', 'Sep', 9, 3, 2025),
  (20251001, '2025-10-01', 'Oct', 10, 4, 2025),
  (20251101, '2025-11-01', 'Nov', 11, 4, 2025),
  (20251201, '2025-12-01', 'Dec', 12, 4, 2025)
ON CONFLICT (date_key) DO NOTHING;

INSERT INTO sid_dw.dim_product (product_code, product_label, family, standard_cost)
VALUES
  ('P-100', 'Smartphone X', 'Electronique', 250.00),
  ('P-200', 'Cereales Bio', 'Alimentaire', 2.50),
  ('P-300', 'T-Shirt Premium', 'Textile', 7.00)
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO sid_dw.dim_store (store_code, store_label, city, region)
VALUES
  ('S-001', 'Magasin Centre', 'Casablanca', 'Casa-Settat'),
  ('S-002', 'Magasin Nord', 'Rabat', 'Rabat-Sale-Kenitra')
ON CONFLICT (store_code) DO NOTHING;

INSERT INTO sid_dw.fact_sales_stock
  (date_key, product_key, store_key, quantity_sold, net_sales, stock_on_hand, reorder_point)
SELECT
  d.date_key,
  p.product_key,
  s.store_key,
  (80 + (random() * 120)::INTEGER) AS quantity_sold,
  (25000 + (random() * 20000))::NUMERIC(14,2) AS net_sales,
  (400 + (random() * 500)::INTEGER) AS stock_on_hand,
  350 AS reorder_point
FROM sid_dw.dim_date d
CROSS JOIN sid_dw.dim_product p
CROSS JOIN sid_dw.dim_store s
WHERE d.year_number = 2025;