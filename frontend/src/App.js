import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import LoreMapEditor from './components/LoreMap/LoreMapEditor';
import CharacterManager from './components/characters/CharacterManager';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Here you would typically make an API call to verify the token
        // For now, we'll just check if there's a user in localStorage
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication error:', error);
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

  const handleLogout = () => {
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
                <Navigate to="/dashboard" />
            } />
            <Route path="/register" element={
              !isAuthenticated ? 
                <Register /> : 
                <Navigate to="/dashboard" />
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? 
                <Dashboard user={user} /> : 
                <Navigate to="/login" />
            } />
            <Route path="/loremap/:id" element={
              isAuthenticated ? 
                <LoreMapEditor user={user} /> : 
                <Navigate to="/login" />
            } />
            <Route path="/characters" element={
              isAuthenticated ? 
                <CharacterManager user={user} /> : 
                <Navigate to="/login" />
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;