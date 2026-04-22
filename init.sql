-- Run in Postgres psql or pgAdmin
CREATE TABLE IF NOT EXISTS public.ventestockes (
  id_ventestocke SERIAL PRIMARY KEY,
  date_vente DATE NOT NULL,
  produit VARCHAR(150),
  categorie VARCHAR(100),
  quantite_vente INTEGER,
  prix_unitaire NUMERIC(10,2),
  quantite_stock INTEGER
);

-- Sample data
INSERT INTO public.ventestockes (date_vente, produit, categorie, quantite_vendue, prix_unitaire, quantite_stock) VALUES
('2026-01-15', 'Laptop Dell', 'Electronique', 5, 1200.50, 10),
('2026-01-20', 'iPhone Apple', 'Electronique', 8, 900.00, 3),
('2026-02-05', 'Chaise Office', 'Meuble', 12, 150.75, 0);