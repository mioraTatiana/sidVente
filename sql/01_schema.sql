-- SID Data Warehouse schema (PostgreSQL)

CREATE SCHEMA IF NOT EXISTS sid_dw;

CREATE TABLE IF NOT EXISTS sid_dw.dim_date (
  date_key INTEGER PRIMARY KEY,
  full_date DATE NOT NULL,
  month_label VARCHAR(10) NOT NULL,
  month_number SMALLINT NOT NULL,
  quarter_number SMALLINT NOT NULL,
  year_number SMALLINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sid_dw.dim_product (
  product_key SERIAL PRIMARY KEY,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  product_label VARCHAR(120) NOT NULL,
  family VARCHAR(50) NOT NULL,
  standard_cost NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sid_dw.dim_store (
  store_key SERIAL PRIMARY KEY,
  store_code VARCHAR(50) UNIQUE NOT NULL,
  store_label VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  region VARCHAR(80) NOT NULL
);

CREATE TABLE IF NOT EXISTS sid_dw.fact_sales_stock (
  fact_key BIGSERIAL PRIMARY KEY,
  date_key INTEGER NOT NULL REFERENCES sid_dw.dim_date(date_key),
  product_key INTEGER NOT NULL REFERENCES sid_dw.dim_product(product_key),
  store_key INTEGER NOT NULL REFERENCES sid_dw.dim_store(store_key),
  quantity_sold INTEGER NOT NULL,
  net_sales NUMERIC(14,2) NOT NULL,
  stock_on_hand INTEGER NOT NULL,
  reorder_point INTEGER NOT NULL,
  loaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_date ON sid_dw.fact_sales_stock(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_product ON sid_dw.fact_sales_stock(product_key);
CREATE INDEX IF NOT EXISTS idx_fact_store ON sid_dw.fact_sales_stock(store_key);