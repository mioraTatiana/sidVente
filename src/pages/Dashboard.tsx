import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF5555', '#55FF55', '#AA00FF'];

function getMonthKey(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function computeMonthlyCA(data) {
  const monthly = {};
  data.forEach((r) => {
    const key = getMonthKey(r.date_vente);
    const ca = (r.quantite_vendue || 0) * (r.prix_unitaire || 0);
    monthly[key] = (monthly[key] || 0) + ca;
  });

  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months.map((m) => ({ name: m, value: monthly[m] || 0 }));
}

function topBySum(data, key, isCa = false, limit = 5) {
  const group = {};
  data.forEach((r) => {
    const k = r[key];
    const val = isCa 
      ? (r.quantite_vendue || 0) * (r.prix_unitaire || 0) 
      : (r.quantite_vendue || 0);
    group[k] = (group[k] || 0) + val;
  });

  return Object.entries(group)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function outOfStockProducts(data) {
  const minStocks = {};
  data.forEach((r) => {
    const p = r.produit;
    minStocks[p] = Math.min(minStocks[p] || Infinity, r.quantite_stock || 0);
  });
  return Object.keys(minStocks).filter((p) => minStocks[p] <= 0);
}

function pieStockData(data) {
  const group = {};
  data.forEach((r) => {
    group[r.produit] = (group[r.produit] || 0) + (r.quantite_stock || 0);
  });
  return Object.entries(group)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/data');
        setData(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center text-2xl mt-10">Chargement des données...</div>;

  const monthlyCA = computeMonthlyCA(data);
  const topProductsSold = topBySum(data, 'produit', false, 5);
  const topProductsCA = topBySum(data, 'produit', true, 5);
  const topCategories = topBySum(data, 'categorie', true, 5);
  const ruptureStock = outOfStockProducts(data);
  const pieData = pieStockData(data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Dashboard VenteStock</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Produits les plus vendus</h3>
            <ul className="space-y-2">
              {topProductsSold.map((p, i) => (
                <li key={i} className="flex justify-between text-lg">
                  <span>{p.name}</span>
                  <span className="font-bold text-green-600">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>

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

        {/* Line Chart */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Chiffre d'affaire global (12 derniers mois)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyCA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} Ar`, 'CA']} />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">Produits les plus/moins vendus (Quantité)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topBySum(data, 'produit', false, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">CA par produits</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProductsCA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} height={80} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} Ar`, 'CA']} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">Répartition du stock</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
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