import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/baseApi';
import { useAuth } from '../../../context/AuthContext';

function Connections() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // active, pending, find
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [activeConnections, setActiveConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchConnectionsData = useCallback(async () => {
    try {
      const [requests, connections] = await Promise.all([
        api.get('/connections/requests/'),
        api.get('/connections/connections/')
      ]);
      
      const allRequests = requests.data.results || requests.data || [];
      setSentRequests(allRequests.filter(r => r.from_user === user?.id));
      setReceivedRequests(allRequests.filter(r => r.to_user === user?.id));
      setActiveConnections(connections.data.results || connections.data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConnectionsData();
  }, [fetchConnectionsData]);

  const handleAction = async (action, requestId) => {
    try {
      await api.post(`/connections/requests/${requestId}/${action}/`);
      fetchConnectionsData();
    } catch (err) {
      alert(`Action failed: ${err.response?.data?.error || 'Unknown error'}`);
    }
  };

  const searchBusinesses = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const targetRole = user?.role === 'producer' ? 'showroom' : 'producer';
      const response = await api.get(`/auth/business-profiles/all/?role=${targetRole}&search=${searchTerm}`);
      setSearchResults(response.data.results || response.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (targetUserId, businessName) => {
    const requestType = user?.role === 'producer' ? 'producer_to_showroom' : 'showroom_to_producer';
    try {
      await api.post('/connections/requests/', {
        to_user: targetUserId,
        request_type: requestType,
        message: `I'd like to connect with your business on ShowPur.`
      });
      setSearchTerm('');
      setSearchResults([]);
      fetchConnectionsData();
      setActiveTab('pending');
    } catch (err) {
      alert('Request already exists or failed.');
    }
  };

  if (loading) return <div className="loading-skeleton">Loading network...</div>;

  return (
    <div className="connections-container">
      <header className="page-header">
        <h1>My Network</h1>
        <div className="tab-navigation">
          <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>
            Active ({activeConnections.length})
          </button>
          <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
            Pending ({receivedRequests.filter(r => r.status === 'pending').length + sentRequests.filter(r => r.status === 'pending').length})
          </button>
          <button className={activeTab === 'find' ? 'active' : ''} onClick={() => setActiveTab('find')}>
            Find Partners
          </button>
        </div>
      </header>

      <div className="connections-content">
        
        {/* TAB: FIND PARTNERS */}
        {activeTab === 'find' && (
          <section className="find-section animate-fade-in">
            <div className="search-box-large">
              <input
                type="text"
                placeholder={`Search ${user?.role === 'producer' ? 'Showrooms' : 'Producers'} by name, location, or product...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchBusinesses()}
              />
              <button onClick={searchBusinesses} disabled={searching} className="btn-primary">
                {searching ? 'Searching...' : 'Search Network'}
              </button>
            </div>

            <div className="search-results-grid">
              {searchResults.map(business => (
                <div key={business.id} className="business-card">
                  <div className="card-top">
                    <h4>{business.business_name}</h4>
                    <span className="location-tag">{business.location}</span>
                  </div>
                  <p className="business-bio">{business.bio || 'No description provided.'}</p>
                  <div className="card-actions">
                    <Link to={`/business/${business.user.id}`} className="btn-outline">View Profile</Link>
                    <button onClick={() => sendConnectionRequest(business.user.id, business.business_name)} className="btn-connect">
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB: ACTIVE CONNECTIONS */}
        {activeTab === 'active' && (
          <section className="active-grid animate-fade-in">
            {activeConnections.length > 0 ? (
              activeConnections.map(conn => {
                const partner = user?.role === 'producer' ? conn.showroom_profile : conn.producer_profile;
                return (
                  <div key={conn.id} className="connection-item">
                    <div className="avatar-placeholder">{partner?.business_name?.[0]}</div>
                    <div className="details">
                      <h4>{partner?.business_name}</h4>
                      <p>{partner?.location} • Since {new Date(conn.started_at).toLocaleDateString()}</p>
                    </div>
                    <div className="actions">
                      <Link to={`/dashboard/messages/${conn.id}`} className="btn-msg">Message</Link>
                      <Link to={`/business/${partner?.user}`} className="btn-profile">Profile</Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No active connections. Start searching in the "Find Partners" tab.</p>
              </div>
            )}
          </section>
        )}

        {/* TAB: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="pending-flex animate-fade-in">
            <div className="received-col">
              <h3>Inbox</h3>
              {receivedRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="request-strip">
                  <div className="info">
                    <strong>{req.from_user_name}</strong>
                    <span>{req.message}</span>
                  </div>
                  <div className="btns">
                    <button onClick={() => handleAction('accept', req.id)} className="btn-accept">Accept</button>
                    <button onClick={() => handleAction('reject', req.id)} className="btn-reject">Decline</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="sent-col">
              <h3>Sent</h3>
              {sentRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="request-strip">
                  <div className="info">
                    <strong>{req.to_user_name}</strong>
                    <span className="status-badge">Waiting for response...</span>
                  </div>
                  <button onClick={() => handleAction('cancel', req.id)} className="btn-cancel">Cancel</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Connections;
