import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoreMap from './LoreMap';
import './LoreMapEditor.css';

const LoreMapEditor = ({ user }) => {
  const { id } = useParams();
  const [loreMap, setLoreMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLoreMap();
  }, [id]);

  const fetchLoreMap = async () => {
    try {
      // In a real app, you would fetch this from your API
      // For now, we'll simulate a fetch with a timeout
      setTimeout(() => {
        const sampleMap = {
          id: parseInt(id),
          title: `Campaign #${id}`,
          description: 'A sample campaign for development',
          events: [
            {
              id: 1,
              title: 'Campaign Start',
              description: 'The party meets at a tavern in Waterdeep',
              location: 'Waterdeep',
              position: { x: 300, y: 100 },
              isPartyLocation: true,
            },
            {
              id: 2,
              title: 'Meeting the Quest Giver',
              description: 'Lord Neverember offers a quest to investigate strange happenings',
              location: 'Castle Ward',
              position: { x: 400, y: 200 },
              isPartyLocation: false,
            },
          ],
          connections: [
            { id: 1, from: 1, to: 2 }
          ]
        };
        
        setLoreMap(sampleMap);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error('Failed to fetch lore map:', err);
      setError('Failed to load campaign. Please try again later.');
      setLoading(false);
    }
  };

  const handleUpdateLoreMap = (updatedMap) => {
    setLoreMap(updatedMap);
    // In a real app, you would save this to your API
    console.log('LoreMap updated:', updatedMap);
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
        <button className="editor-button">Save Changes</button>
        <button className="editor-button secondary">Export Map</button>
      </div>
      
      <div className="editor-content">
        <LoreMap 
          initialEvents={loreMap.events}
          initialConnections={loreMap.connections}
          onChange={handleUpdateLoreMap}
        />
      </div>
    </div>
  );
};

export default LoreMapEditor;