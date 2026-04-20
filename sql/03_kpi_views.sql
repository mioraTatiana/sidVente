-- KPI views used by reporting API or BI tools

CREATE OR REPLACE VIEW sid_dw.v_monthly_sales_stock AS
SELECT
  d.month_label,
  d.month_number,
  p.family,
  SUM(f.net_sales) AS total_sales,
  AVG(f.stock_on_hand) AS avg_stock,
  SUM(CASE WHEN f.stock_on_hand < f.reorder_point THEN 1 ELSE 0 END) AS low_stock_events
FROM sid_dw.fact_sales_stock f
JOIN sid_dw.dim_date d ON d.date_key = f.date_key
JOIN sid_dw.dim_product p ON p.product_key = f.product_key
GROUP BY d.month_label, d.month_number, p.family;

CREATE OR REPLACE VIEW sid_dw.v_global_summary AS
SELECT
  family,
  SUM(total_sales) AS total_sales,
  AVG(avg_stock) AS average_stock,
  SUM(low_stock_events) AS low_stock_events
FROM sid_dw.v_monthly_sales_stock
GROUP BY family;

-- Example query for dashboard
-- SELECT * FROM sid_dw.v_monthly_sales_stock WHERE family = 'Electronique' ORDER BY month_number DESC LIMIT 6;