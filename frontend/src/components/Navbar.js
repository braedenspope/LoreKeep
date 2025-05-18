import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout, user }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
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