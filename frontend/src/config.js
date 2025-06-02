const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://lorekeep.onrender.com'  // Your production URL
    : 'http://localhost:5000',
  
  // File upload settings
  maxFileSize: 16 * 1024 * 1024, // 16MB
  allowedImageTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'],
  
  // Helper function to validate file
  validateImageFile: (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (file.size > config.maxFileSize) {
      return { valid: false, error: 'File too large (max 16MB)' };
    }
    
    if (!config.allowedImageTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please upload PNG, JPG, GIF, or WebP images.' };
    }
    
    return { valid: true };
  }
};

export default config;