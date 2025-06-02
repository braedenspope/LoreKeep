import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout, user }) => {
  // Use window.location for reliable navigation
  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    window.location.href = path;
  };

  // Alternative approach with React Router fallback
  const handleNavigationWithFallback = (path) => {
    console.log('Trying to navigate to:', path);
    
    // Check if we're already on the target page
    if (window.location.pathname === path) {
      console.log('Already on target page, forcing refresh');
      window.location.reload();
      return;
    }
    
    // Try to navigate immediately
    window.location.href = path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <h1>LoreKeep</h1>
        </Link>
      </div>
      
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/dashboard')}
            >
              Dashboard
            </button>
            
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/characters')}
            >
              Characters
            </button>
            
            <div className="navbar-user">
              <span>Welcome, {user.username}</span>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          </>
        ) : (
          <>
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/login')}
            >
              Login
            </button>
            
            <button 
              className="nav-button" 
              onClick={() => handleNavigation('/register')}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;