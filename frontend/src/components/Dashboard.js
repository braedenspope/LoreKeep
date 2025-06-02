import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css';
import config from '../config';

const Dashboard = ({ user }) => {
  const [loreMaps, setLoreMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewMapForm, setShowNewMapForm] = useState(false);
  const [newMapData, setNewMapData] = useState({ title: '', description: '' });
  
  const navigate = useNavigate();
  const location = useLocation();

  // Force refresh when component mounts or location changes
  useEffect(() => {
    console.log('Dashboard mounted or location changed:', location.pathname);
    fetchLoreMaps();
  }, [location.pathname]); // Add location.pathname as dependency

  // Update the fetchLoreMaps function in Dashboard.js
  const fetchLoreMaps = async () => {
    console.log('Fetching lore maps...');
    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`${config.apiUrl}/api/loremaps`, {
        method: 'GET',
        credentials: 'include',
        // Add cache-busting parameter to ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      
      const data = await response.json();
      console.log('Fetched lore maps:', data);
      setLoreMaps(data);
    } catch (err) {
      console.error('Failed to fetch lore maps:', err);
      setError('Failed to load your campaigns. Please try again later.');
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

  // Replace the handleDeleteMap function in Dashboard.js with this:

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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete campaign');
      }
      
      // Remove from local state
      setLoreMaps(loreMaps.filter(map => map.id !== id));
      
      // Optional: Show success message
      console.log('Campaign deleted successfully');
      
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  // Add a manual refresh button for debugging
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    fetchLoreMaps();
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
          {/* Temporary debug button */}
          <button 
            className="new-map-btn"
            onClick={handleManualRefresh}
            style={{ marginLeft: '10px', backgroundColor: '#666' }}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
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
      
      {/* Debug info */}
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '10px', 
        fontSize: '12px',
        borderRadius: '4px'
      }}>
        Debug: {loreMaps.length} campaigns loaded
        <br />
        Current path: {location.pathname}
        <br />
        Loading: {loading.toString()}
      </div>
    </div>
  );
};

export default Dashboard;