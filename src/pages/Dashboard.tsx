import React from 'react';
import { useData } from '../context/DataContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { SalesRecord } from '../types';

interface ChartDataPoint {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF5555', '#55FF55', '#AA00FF'];

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function computeMonthlyCA(data: SalesRecord[]): ChartDataPoint[] {
  const monthly: Record<string, number> = {};
  data.forEach((r) => {
    const key = getMonthKey(r.date_vente);
    const ca = r.quantite_vente * r.prix_unitaire;
    monthly[key] = (monthly[key] || 0) + ca;
  });

  const now = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months.map((m) => ({ name: m, value: monthly[m] || 0 }));
}

function topBySum(data: SalesRecord[], key: keyof SalesRecord, isCa = false, limit = 5): { name: string; value: number }[] {
  const group: Record<string, number> = {};
  data.forEach((r) => {
    const k = r[key] as string;
    const val = isCa ? r.quantite_vente * r.prix_unitaire : r.quantite_vente;
    group[k] = (group[k] || 0) + val;
  });
  return Object.entries(group)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function outOfStockProducts(data: SalesRecord[]): string[] {
  const minStocks: Record<string, number> = {};
  data.forEach((r) => {
    const p = r.produit;
    minStocks[p] = Math.min(minStocks[p] || Infinity, r.quantite_stock);
  });
  return Object.keys(minStocks).filter((p) => minStocks[p] <= 0);
}

function pieStockData(data: SalesRecord[]): ChartDataPoint[] {
  const group: Record<string, number> = {};
  data.forEach((r) => {
    group[r.produit] = (group[r.produit] || 0) + r.quantite_stock;
  });
  return Object.entries(group)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value: value as number }));
}

const Dashboard: React.FC = () => {
  const { data } = useData();

  const monthlyCA = computeMonthlyCA(data);
  const topProductsQty = topBySum(data, 'produit', false, 10);
  const topProductsCA = topBySum(data, 'produit', true, 5);
  const topCategories = topBySum(data, 'categorie', true, 5);
  const ruptureStock = outOfStockProducts(data);
  const pieData = pieStockData(data);
  const topProductsSold = topBySum(data, 'produit', false, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Dashboard VenteStock</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Produits plus vendus */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Produits les plus vendus</h3>
            <ul className="space-y-2">
              {topProductsSold.slice(0, 5).map((p, i) => (
                <li key={i} className="flex justify-between text-lg">
                  <span>{p.name}</span>
                  <span className="font-bold text-green-600">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Rupture stock */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Produits en rupture</h3>
            {ruptureStock.length === 0 ? (
              <p className="text-green-600 font-medium">Aucun produit en rupture !</p>
            ) : (
              <ul className="space-y-2">
                {ruptureStock.slice(0, 5).map((p, i) => (
                  <li key={i} className="text-red-600">{p}</li>
                ))}
              </ul>
            )}
          </div>
          {/* Categories plus vendues */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Catégories les plus vendues</h3>
            <ul className="space-y-2">
              {topCategories.map((c, i) => (
                <li key={i} className="flex justify-between text-lg">
                  <span>{c.name}</span>
                  <span className="font-bold text-blue-600">{Math.round(c.value).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Line Chart CA Global */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Chiffre d'affaire global (12 derniers mois)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyCA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'CA']} />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Histogramme produits +vendus / moins vendus */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">Produits les plus/moins vendus (Qte)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProductsQty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Diagramme CA par produits */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">CA par produits</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProductsCA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`€${value.toLocaleString()}`, 'CA']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camembert stock */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Produits en stock</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;