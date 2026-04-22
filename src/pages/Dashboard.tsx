import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF5555', '#55FF55', '#AA00FF'];

function computeYearlyCA(data) {
  const yearly = {};
  data.forEach((r) => {
    if (!r.date_vente) return;
    const year = new Date(r.date_vente).getFullYear();
    const ca = (r.quantite_vendue || 0) * (r.prix_unitaire || 0);
    yearly[year] = (yearly[year] || 0) + ca;
  });

  // Tri par année croissante
  return Object.entries(yearly)
    .map(([name, value]) => ({ name: name.toString(), value }))
    .sort((a, b) => a.name - b.name);
}

function topBySum(data, key, isCa = false, limit = 10) {
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

function pieStockData(data) {
  const group = {};
  data.forEach((r) => {
    group[r.produit] = (group[r.produit] || 0) + (r.quantite_stock || 0);
  });
  return Object.entries(group)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value: value as number }));
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

  const yearlyCA = computeYearlyCA(data);
  const topProductsSold = topBySum(data, 'produit', false, 5);
  const topProductsCA = topBySum(data, 'produit', true, 10);
  const topCategories = topBySum(data, 'categorie', true, 5);
  const pieData = pieStockData(data);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Dashboard VenteStock</h1>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Produits les plus vendus */}
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

          {/* Catégories les plus vendues */}
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

        {/* === GRAPHE CHIFFRE D'AFFAIRE PAR ANNÉE === */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">
            Chiffre d'Affaire par Année
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={yearlyCA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} Ar`, 'CA']} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={4} 
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* === GRAPHE CHIFFRE D'AFFAIRE PAR PRODUIT === */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-12">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">
            Chiffre d'Affaire par Produit
          </h3>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={topProductsCA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                height={100} 
                textAnchor="end"
              />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} Ar`, 'CA']} />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* === CAMEMBERT RÉPARTITION DU STOCK === */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-slate-900 mb-6">
            Répartition des Produits en Stock
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
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