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
        console.log('Checking authentication...');
        
        // Check if there's a user in localStorage
        const savedUser = localStorage.getItem('user');
        console.log('Saved user in localStorage:', savedUser);
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Validate the session with the server
          console.log('Validating session with server...');
          
          try {
            const response = await fetch(`${config.apiUrl}/api/validate-session`, {
              method: 'GET',
              credentials: 'include'
            });
            
            console.log('Session validation response:', response.status);
            
            if (response.ok) {
              console.log('Session is valid, setting user');
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              console.log('Session invalid, clearing localStorage');
              // Session is invalid, remove from localStorage
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (fetchError) {
            console.log('Session validation failed (network error):', fetchError);
            // If server is not running, we'll just use the saved user data
            // This helps during development when backend might not be running
            console.log('Using saved user data due to network error');
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else {
          console.log('No saved user found');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    console.log('Handling login for user:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    console.log('Handling logout...');
    
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

  // Add debug logging for state changes
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user: user?.username, loading });
  }, [isAuthenticated, user, loading]);

  if (loading) {
    console.log('App is loading...');
    return <div className="loading">Loading...</div>;
  }

  console.log('Rendering App with auth state:', { isAuthenticated, user: user?.username });

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