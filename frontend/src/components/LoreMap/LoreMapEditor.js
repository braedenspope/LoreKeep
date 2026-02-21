import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoreMap from './LoreMap';
import './LoreMapEditor.css';
import { useNotification } from '../../context/NotificationContext';
import config from '../../config';

const LoreMapEditor = ({ user }) => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loreMap, setLoreMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      setError('Failed to load campaign. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoreMap();
  }, [fetchLoreMap]);

  const handleUpdateLoreMap = (updatedMap) => {
    setLoreMap(updatedMap);
  };

  const handleSaveAndReturn = async () => {
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
      
      showNotification('Campaign saved successfully!', 'success', { navigateTo: '/dashboard' });

    } catch (err) {
      showNotification('Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSave = async () => {
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
      
      await fetchLoreMap();
      showNotification('Campaign saved successfully!', 'success');
    } catch (err) {
      showNotification('Failed to save changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Simple export for basic map data
  const handleBasicExport = () => {
    try {
      // Validate that we have a lore map to export
      if (!loreMap) {
        throw new Error('No campaign data to export');
      }
      
      const dataStr = JSON.stringify(loreMap, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      // Safe filename creation with fallback
      const safeTitle = (loreMap?.title || 'Untitled_Campaign').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}_map.json`;
      
      const exportLink = document.createElement('a');
      exportLink.setAttribute('href', dataUri);
      exportLink.setAttribute('download', filename);
      document.body.appendChild(exportLink);
      exportLink.click();
      document.body.removeChild(exportLink);
      
    } catch (err) {
      showNotification('Failed to export map. Please try again.', 'error');
    }
  };

  // Complete export with all related data
  const handleCompleteExport = async () => {
    try {
      setExporting(true);
      
      // Validate that we have a lore map to export
      if (!loreMap) {
        throw new Error('No campaign data to export');
      }
      
      // Fetch all related data
      const [charactersResponse] = await Promise.all([
        fetch(`${config.apiUrl}/api/characters`, { 
          method: 'GET',
          credentials: 'include' 
        })
      ]);
      
      if (!charactersResponse.ok) {
        throw new Error('Failed to fetch characters for export');
      }
      
      const characters = await charactersResponse.json();
      
      // Get event character associations
      const eventCharacterAssociations = {};
      for (const event of loreMap.events) {
        if (event.id && event.id <= 1000000) {
          try {
            const response = await fetch(`${config.apiUrl}/api/events/${event.id}/characters`, {
              method: 'GET',
              credentials: 'include'
            });
            
            if (response.ok) {
              const eventChars = await response.json();
              eventCharacterAssociations[event.id] = eventChars.map(ec => ec.character_id);
            }
          } catch (err) {
            // Could not fetch characters for this event
          }
        }
      }
      
      // Filter characters to include user's custom characters and any used in events
      const usedCharacterIds = new Set();
      Object.values(eventCharacterAssociations).forEach(charIds => {
        charIds.forEach(id => usedCharacterIds.add(id));
      });
      
      const relevantCharacters = characters.filter(char => 
        // Include user's custom characters
        !char.is_official || 
        // Include official characters used in events
        usedCharacterIds.has(char.id)
      );
      
      // Create complete export object
      const exportData = {
        metadata: {
          export_date: new Date().toISOString(),
          export_version: "1.0",
          lorekeep_version: "1.0.0",
          exported_by: user?.username || 'Unknown User'
        },
        campaign: {
          id: loreMap.id,
          title: loreMap.title,
          description: loreMap.description,
          created_at: loreMap.created_at,
          updated_at: loreMap.updated_at
        },
        events: loreMap.events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          position: event.position,
          is_party_location: event.is_party_location || event.isPartyLocation,
          conditions: event.conditions,
          battle_map_url: event.battle_map_url,
          // Include character associations
          characters: eventCharacterAssociations[event.id] || []
        })),
        connections: loreMap.connections.map(conn => ({
          id: conn.id,
          from: conn.from,
          to: conn.to,
          description: conn.description
        })),
        characters: relevantCharacters.map(char => ({
          id: char.id,
          name: char.name,
          character_type: char.character_type,
          description: char.description,
          is_official: char.is_official,
          // Include stats and abilities
          strength: char.strength,
          dexterity: char.dexterity,
          constitution: char.constitution,
          intelligence: char.intelligence,
          wisdom: char.wisdom,
          charisma: char.charisma,
          armor_class: char.armor_class,
          hit_points: char.hit_points,
          challenge_rating: char.challenge_rating,
          creature_type: char.creature_type,
          // Include action data if available
          actions: char.actions,
          legendary_actions: char.legendary_actions,
          special_abilities: char.special_abilities,
          reactions: char.reactions,
          // Include other monster data
          skills: char.skills,
          damage_resistances: char.damage_resistances,
          damage_immunities: char.damage_immunities,
          condition_immunities: char.condition_immunities,
          senses: char.senses,
          languages: char.languages
        })),
        statistics: {
          total_events: loreMap.events.length,
          total_connections: loreMap.connections.length,
          total_characters: relevantCharacters.length,
          custom_characters: relevantCharacters.filter(c => !c.is_official).length,
          official_monsters: relevantCharacters.filter(c => c.is_official).length
        }
      };
      
      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      // Safe filename creation with fallback
      const safeTitle = (loreMap?.title || 'Untitled_Campaign').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${safeTitle}_complete_export.json`;
      
      const exportLink = document.createElement('a');
      exportLink.setAttribute('href', dataUri);
      exportLink.setAttribute('download', filename);
      document.body.appendChild(exportLink);
      exportLink.click();
      document.body.removeChild(exportLink);
      
      showNotification('Campaign exported successfully!', 'success');

    } catch (err) {
      showNotification(`Failed to export campaign data: ${err.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
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
        <div className="header-left">
          <h2>{loreMap.title}</h2>
          <p>{loreMap.description}</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="editor-button secondary" 
            onClick={handleReturnToDashboard}
            title="Return to Dashboard without saving"
          >
            🏠 Dashboard
          </button>
          
          <button 
            className="editor-button secondary" 
            onClick={handleBasicExport}
            title="Export basic map data as JSON file"
          >
            📁 Basic Export
          </button>
          
          <button 
            className="editor-button secondary" 
            onClick={handleCompleteExport}
            disabled={exporting}
            title="Export complete campaign data including characters"
          >
            {exporting ? '📦 Exporting...' : '📦 Complete Export'}
          </button>
          
          <button 
            className="editor-button" 
            onClick={handleQuickSave}
            disabled={saving}
            title="Save changes and continue editing"
          >
            {saving ? '💾 Saving...' : '💾 Save'}
          </button>
          
          <button 
            className="editor-button primary" 
            onClick={handleSaveAndReturn}
            disabled={saving}
            title="Save and return to Dashboard"
          >
            {saving ? '✅ Saving...' : '✅ Save & Exit'}
          </button>
        </div>
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