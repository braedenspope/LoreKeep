import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import config from '../config';

const Dashboard = ({ user }) => {
  const [loreMaps, setLoreMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewMapForm, setShowNewMapForm] = useState(false);
  const [newMapData, setNewMapData] = useState({ title: '', description: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Dashboard mounted, user:', user);
    fetchLoreMaps();
  }, []); // Remove location dependency for now

  // Update the fetchLoreMaps function in Dashboard.js
  const fetchLoreMaps = async () => {
    console.log('Fetching lore maps...');
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.apiUrl}/api/loremaps`, {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log('Lore maps response status:', response.status);
      
      if (response.status === 401) {
        // User is not authenticated, clear localStorage and redirect
        console.log('User not authenticated, clearing session');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Force full page reload to login
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns (${response.status})`);
      }
      
      const data = await response.json();
      console.log('Fetched lore maps:', data);
      setLoreMaps(data);
    } catch (err) {
      console.error('Failed to fetch lore maps:', err);
      
      // Check if it's a network error
      if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
      } else {
        setError('Failed to load your campaigns. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update handleCreateMap in Dashboard.js
  const handleCreateMap = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${config.apiUrl}/api/loremaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newMapData.title,
          description: newMapData.description,
        })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }
      
      const data = await response.json();
      setLoreMaps([...loreMaps, data]);
      setShowNewMapForm(false);
      setNewMapData({ title: '', description: '' });
      
      // Navigate to the new map
      navigate(`/loremap/${data.id}`);
    } catch (err) {
      console.error('Failed to create lore map:', err);
      setError('Failed to create new campaign. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMapData({ ...newMapData, [name]: value });
  };

  const handleDeleteMap = async (id, title) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/loremaps/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.status === 401) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete campaign');
      }
      
      // Remove from local state
      setLoreMaps(loreMaps.filter(map => map.id !== id));
      
      console.log('Campaign deleted successfully');
      
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  // Check if backend is reachable
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/api/test`);
      if (response.ok) {
        alert('Backend is reachable! ✅');
        fetchLoreMaps(); // Retry fetching data
      } else {
        alert('Backend responded but with an error');
      }
    } catch (err) {
      alert('Backend is not reachable. Make sure it\'s running on http://localhost:5000');
    }
  };

  if (loading) {
    return <div className="loading">Loading your campaigns...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Campaigns</h2>
        <div>
          <button 
            className="new-map-btn"
            onClick={() => setShowNewMapForm(true)}
          >
            Create New Campaign
          </button>
          {/* Debug button */}
          <button 
            className="new-map-btn"
            onClick={checkBackendHealth}
            style={{ marginLeft: '10px', backgroundColor: '#666' }}
          >
            Test Backend
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={fetchLoreMaps} 
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="lore-maps-grid">
        {loreMaps.length === 0 ? (
          <div className="no-maps-message">
            <p>You don't have any campaigns yet. Create your first one to get started!</p>
          </div>
        ) : (
          loreMaps.map(map => (
            <div className="lore-map-card" key={map.id}>
              <h3>{map.title}</h3>
              <p>{map.description}</p>
              <div className="map-dates">
                <span>Created: {new Date(map.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(map.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="map-actions">
                <Link to={`/loremap/${map.id}`} className="edit-map-btn">
                  Open Campaign
                </Link>
                <button 
                  className="delete-map-btn"
                  onClick={() => handleDeleteMap(map.id, map.title)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showNewMapForm && (
        <div className="modal-overlay">
          <div className="create-map-modal">
            <h3>Create New Campaign</h3>
            <form onSubmit={handleCreateMap}>
              <div className="form-group">
                <label htmlFor="title">Campaign Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newMapData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter a title for your campaign"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newMapData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your campaign (optional)"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="create-btn">Create Campaign</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowNewMapForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;