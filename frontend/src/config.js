const config = {
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://lorekeep.onrender.com'  // You'll replace this later
    : 'http://localhost:5000'
};

export default config;