import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoreMap from './LoreMap';
import './LoreMapEditor.css';
import config from '../../config';

const LoreMapEditor = ({ user }) => {
  const { id } = useParams();
  const [loreMap, setLoreMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Use useCallback to memoize the fetchLoreMap function
  const fetchLoreMap = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiUrl}/api/loremaps/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load campaign');
      }
      
      const data = await response.json();
      setLoreMap(data);
    } catch (err) {
      console.error('Failed to fetch lore map:', err);
      setError('Failed to load campaign. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]); // id is the only dependency for this function

  // Now use fetchLoreMap in the effect
  useEffect(() => {
    fetchLoreMap();
  }, [fetchLoreMap]); // fetchLoreMap is stable and won't cause unnecessary re-renders

  const handleUpdateLoreMap = (updatedMap) => {
    setLoreMap(updatedMap);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Save each event that doesn't have an ID (new events)
      for (const event of loreMap.events.filter(e => !e.id || e.id > 1000000)) {
        await fetch(`${config.apiUrl}/api/loremaps/${id}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            location: event.location,
            position: {
              x: event.position.x,
              y: event.position.y
            },
            is_party_location: event.isPartyLocation
          })
        });
      }
      
      // Update existing events
      for (const event of loreMap.events.filter(e => e.id && e.id <= 1000000)) {
        await fetch(`${config.apiUrl}/api/events/${event.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            location: event.location,
            position: {
              x: event.position.x,
              y: event.position.y
            },
            is_party_location: event.isPartyLocation
          })
        });
      }
      
      // Save each connection that doesn't have an ID (new connections)
      for (const conn of loreMap.connections.filter(c => !c.id || c.id > 1000000)) {
        await fetch(`${config.apiUrl}/api/loremaps/${id}/connections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            from: conn.from,
            to: conn.to,
            description: conn.description || ''
          })
        });
      }
      
      // Refresh the map data
      await fetchLoreMap();
      
      alert('Campaign saved successfully!');
    } catch (err) {
      console.error('Failed to save changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportMap = () => {
    try {
      // Create a data URL for a JSON file
      const dataStr = JSON.stringify(loreMap, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      // Create a download link and trigger it
      const exportLink = document.createElement('a');
      exportLink.setAttribute('href', dataUri);
      exportLink.setAttribute('download', `${loreMap.title.replace(/\s+/g, '_')}_map.json`);
      document.body.appendChild(exportLink);
      exportLink.click();
      document.body.removeChild(exportLink);
      
    } catch (err) {
      console.error('Failed to export map:', err);
      alert('Failed to export map. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading campaign...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="loremap-editor">
      <div className="editor-header">
        <h2>{loreMap.title}</h2>
        <p>{loreMap.description}</p>
      </div>
      
      <div className="editor-toolbox">
        <button 
          className="editor-button" 
          onClick={handleSaveChanges}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button 
          className="editor-button secondary" 
          onClick={handleExportMap}
        >
          Export Map
        </button>
        <button 
          className="editor-button secondary" 
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="editor-content">
        <LoreMap 
          initialEvents={loreMap.events}
          initialConnections={loreMap.connections}
          onChange={handleUpdateLoreMap}
          loreMapId={id}
        />
      </div>
    </div>
  );
};

export default LoreMapEditor;