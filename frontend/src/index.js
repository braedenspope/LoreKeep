import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './DnDTheme.css'; // Add this line
import App from './App';
import reportWebVitals from './utils/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();