// In App.js, check your routing setup
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
        // Check if there's a user in localStorage
        const savedUser = JSON.parse(localStorage.getItem('user'));
        
        if (savedUser) {
          // Validate the session with the server
          const response = await fetch(`${config.apiUrl}/api/validate-session`, {
            method: 'GET',
            credentials: 'include' // Include cookies for session-based auth
          }).catch(() => {
            // If the server is not running, we'll just use the saved user data
            // This helps during development when backend might not be running
            return { ok: true };
          });
          
          if (response && response.ok) {
            setUser(savedUser);
            setIsAuthenticated(true);
          } else {
            // Session is invalid, remove from localStorage
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('user');
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
      // Call the logout endpoint
      await fetch(`${config.apiUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Regardless of server response, clear the local state
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