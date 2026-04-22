import React from 'react';

import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';

function App() {
  return (
    <Router>
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                VenteStock
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700 shadow-md' 
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/upload"
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-100 text-indigo-700 shadow-md' 
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50'
                  }`
                }
              >
                Upload CSV
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;