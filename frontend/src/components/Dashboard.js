import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [loreMaps, setLoreMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewMapForm, setShowNewMapForm] = useState(false);
  const [newMapData, setNewMapData] = useState({ title: '', description: '' });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoreMaps();
  }, []);

  const fetchLoreMaps = async () => {
    try {
      // In a real application, you would fetch from your API
      // For now, we'll use sample data
      const sampleData = [
        {
          id: 1,
          title: 'Waterdeep Campaign',
          description: 'Urban adventure in the City of Splendors',
          created_at: '2025-02-15T10:30:00',
          updated_at: '2025-02-20T14:45:00'
        },
        {
          id: 2,
          title: 'Lost Mine of Phandelver',
          description: 'Classic starter adventure in the Sword Coast',
          created_at: '2025-01-10T08:20:00',
          updated_at: '2025-02-18T11:15:00'
        }
      ];
      
      setLoreMaps(sampleData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch lore maps:', err);
      setError('Failed to load your campaigns. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreateMap = async (e) => {
    e.preventDefault();
    
    try {
      // In a real application, you would send this to your API
      // For now, we'll just simulate it
      const newMap = {
        id: loreMaps.length + 1,
        title: newMapData.title,
        description: newMapData.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setLoreMaps([...loreMaps, newMap]);
      setShowNewMapForm(false);
      setNewMapData({ title: '', description: '' });
      
      // Navigate to the new map
      navigate(`/loremap/${newMap.id}`);
    } catch (err) {
      console.error('Failed to create lore map:', err);
      setError('Failed to create new campaign. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMapData({ ...newMapData, [name]: value });
  };

  const handleDeleteMap = async (id) => {
    try {
      // In a real application, you would call your API
      // For now, we'll just update the state
      setLoreMaps(loreMaps.filter(map => map.id !== id));
    } catch (err) {
      console.error('Failed to delete lore map:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading your campaigns...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Campaigns</h2>
        <button 
          className="new-map-btn"
          onClick={() => setShowNewMapForm(true)}
        >
          Create New Campaign
        </button>
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
                  onClick={() => handleDeleteMap(map.id)}
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