import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import './App.css';
import config from './config';

// Import auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Import other components
import LoreMapEditor from './components/LoreMap/LoreMapEditor';
import CharacterManager from './components/characters/CharacterManager';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');

        if (savedUser) {
          const userData = JSON.parse(savedUser);

          try {
            const response = await fetch(`${config.apiUrl}/api/validate-session`, {
              method: 'GET',
              credentials: 'include'
            });

            if (response.ok) {
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (fetchError) {
            // If server is not running, use saved user data for development
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch(`${config.apiUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Logout endpoint failed, but we still clear local state
    }

    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
        <div className="content">
          <Routes>
            <Route path="/login" element={
              !isAuthenticated ? 
                <Login onLogin={handleLogin} /> : 
                <Navigate to="/dashboard" replace />
            } />
            <Route path="/register" element={
              !isAuthenticated ? 
                <Register /> : 
                <Navigate to="/dashboard" replace />
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? 
                <Dashboard user={user} /> : 
                <Navigate to="/login" replace />
            } />
            <Route path="/loremap/:id" element={
              isAuthenticated ? 
                <LoreMapEditor user={user} /> : 
                <Navigate to="/login" replace />
            } />
            <Route path="/characters" element={
              isAuthenticated ? 
                <CharacterManager user={user} /> : 
                <Navigate to="/login" replace />
            } />
            <Route path="/" element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;