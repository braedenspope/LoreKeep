import { useState } from 'react';
import config from '../config';

const useBattleMap = () => {
  const [battleMapFile, setBattleMapFile] = useState(null);
  const [battleMapPreview, setBattleMapPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const handleBattleMapUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file using config utility
    const validation = config.validateImageFile(file);

    if (!validation.valid) {
      alert(`Upload failed: ${validation.error}`);
      e.target.value = ''; // Reset file input
      return;
    }

    setBattleMapFile(file);
    setUploadProgress(true);

    // Show loading state while creating preview
    setBattleMapPreview(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setBattleMapPreview(e.target.result);
      setUploadProgress(false);
    };
    reader.onerror = () => {
      alert('Failed to read image file. Please try again.');
      setBattleMapFile(null);
      setUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBattleMap = async (editingEvent, setEditingEvent) => {
    if (editingEvent && editingEvent.id && editingEvent.id <= 1000000) {
      try {
        const response = await fetch(`${config.apiUrl}/api/events/${editingEvent.id}/battle-map`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          setBattleMapFile(null);
          setBattleMapPreview(null);
          setEditingEvent({
            ...editingEvent,
            battle_map_url: null
          });
        } else {
          throw new Error('Failed to remove battle map from server');
        }
      } catch (err) {
        alert(`Failed to remove battle map: ${err.message}`);
      }
    } else {
      setBattleMapFile(null);
      setBattleMapPreview(null);
      if (editingEvent) {
        setEditingEvent({
          ...editingEvent,
          battle_map_url: null
        });
      }
    }
  };

  const initPreview = (url) => {
    setBattleMapPreview(url ? `${config.apiUrl}${url}` : null);
  };

  const reset = () => {
    setBattleMapFile(null);
    setBattleMapPreview(null);
    setUploadProgress(false);
  };

  return {
    battleMapFile,
    battleMapPreview,
    uploadProgress,
    setBattleMapFile,
    handleBattleMapUpload,
    handleRemoveBattleMap,
    initPreview,
    reset
  };
};

export default useBattleMap;
