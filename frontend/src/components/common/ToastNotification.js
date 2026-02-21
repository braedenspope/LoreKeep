import React from 'react';
import './ToastNotification.css';

const ToastNotification = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="toast-stack">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
        >
          <span className="toast-icon">
            {notification.type === 'success' ? '\u2714' : '\u2716'}
          </span>
          <span className="toast-message">{notification.message}</span>
          <button
            className="toast-close"
            onClick={() => onDismiss(notification.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
