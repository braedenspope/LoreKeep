import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from '../components/common/ToastNotification';
import ConfirmModal from '../components/common/ConfirmModal';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const timersRef = useRef({});

  const showNotification = useCallback((message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || (type === 'error' ? 5000 : 3000);

    const notification = {
      id,
      message,
      type,
      navigateTo: options.navigateTo || null,
    };

    setNotifications(prev => [...prev, notification]);

    // Navigate immediately if specified, then auto-dismiss the toast
    if (notification.navigateTo) {
      navigate(notification.navigateTo);
    }

    // Auto-dismiss
    timersRef.current[id] = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      delete timersRef.current[id];
    }, duration);

    return id;
  }, [navigate]);

  const handleDismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        onConfirm: () => {
          setConfirmState(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(null);
          resolve(false);
        },
      });
    });
  }, []);

  const value = { showNotification, showConfirm };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastNotification
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
      {confirmState && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={confirmState.onCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
