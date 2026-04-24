import React, { useState } from 'react';
import api from '../../../api/baseApi';

function ConnectionModal({ targetUser, onClose, onSuccess }) {
  const [message, setMessage] = useState(`Hi ${targetUser.business_name}, I'm interested in discussing a partnership on ShowPur.`);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await api.post('/connections/requests/', {
        to_user: targetUser.user_id || targetUser.id,
        message: message,
        // The backend should infer request_type from the user's role
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "You've already sent a request to this business.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content animate-slide-up">
        <header className="modal-header">
          <h3>Connect with {targetUser.business_name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="modal-body">
          <p className="hint-text">
            Producers and Showrooms are more likely to connect when you include a brief introduction.
          </p>
          
          <div className="form-group">
            <label>Introduction Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="5"
              placeholder="Tell them why you'd like to partner..."
            />
          </div>

          {error && <div className="error-banner">{error}</div>}
        </div>

        <footer className="modal-footer">
          <button className="btn-outline" onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSend} 
            disabled={sending || !message.trim()}
          >
            {sending ? 'Sending...' : 'Send Request'}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default ConnectionModal;