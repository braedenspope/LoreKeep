import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, onLogout, user }) => {
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
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/characters">Characters</Link>
            <div className="navbar-user">
              <span>Welcome, {user.username}</span>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;