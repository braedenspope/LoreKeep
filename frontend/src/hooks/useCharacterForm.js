import { useState } from 'react';
import { getDefaultFormData, buildStatsFromCharacter } from '../utils/characterUtils';

const useCharacterForm = () => {
  const [formData, setFormData] = useState(getDefaultFormData());
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStatChange = (statName, value) => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        [statName]: parseInt(value, 10) || 0
      }
    });
  };

  const handleAddAction = () => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: [
          ...formData.stats.actions,
          { name: '', description: '' }
        ]
      }
    });
  };

  const handleActionChange = (index, field, value) => {
    const updatedActions = [...formData.stats.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value
    };

    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: updatedActions
      }
    });
  };

  const handleRemoveAction = (index) => {
    const updatedActions = formData.stats.actions.filter((_, i) => i !== index);

    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        actions: updatedActions
      }
    });
  };

  const resetForm = () => {
    setFormData(getDefaultFormData());
  };

  const startCreating = () => {
    setIsCreating(true);
    setIsEditing(false);
    resetForm();
  };

  const startEditing = (character) => {
    const stats = buildStatsFromCharacter(character);

    setFormData({
      name: character.name,
      character_type: character.character_type,
      description: character.description,
      stats: stats
    });

    setIsEditing(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    resetForm();
  };

  return {
    formData,
    isCreating,
    isEditing,
    setIsCreating,
    setIsEditing,
    handleFormChange,
    handleStatChange,
    handleAddAction,
    handleActionChange,
    handleRemoveAction,
    resetForm,
    startCreating,
    startEditing,
    cancelForm
  };
};

export default useCharacterForm;
