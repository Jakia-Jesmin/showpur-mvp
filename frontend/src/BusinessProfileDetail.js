// frontend/src/BusinessProfileDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BusinessProfileDetail.css';

function BusinessProfileDetail() {
  const { id } = useParams(); // Get the profile ID from the URL
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch single profile data
  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/profiles/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else if (response.status === 404) {
        setError('Business profile not found');
      } else {
        setError('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="profile-detail-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-detail-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/" className="back-link">← Back to All Profiles</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="profile-detail-container">
        {/* Added the cover photo and logo sections */}
        {profile.cover_photo && (
          <div className="cover-photo" style={{ backgroundImage: `url(${profile.cover_photo})` }}></div>
        )}
        <div className="profile-images-container">
            {profile.logo && (
                <img src={profile.logo} alt="Business Logo" className="business-logo" />
            )}
        </div>
        
      <div className="profile-header">
        <Link to="/" className="back-link">← Back to All Profiles</Link>
        <h1>{profile.business_name}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <div className="info-section">
            <h2>About</h2>
            <p className="description">{profile.description}</p>
          </div>

          <div className="info-section">
            <h2>Contact Information</h2>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Email:</strong>
                <a href={`mailto:${profile.contact_email}`} className="contact-link">
                  {profile.contact_email}
                </a>
              </div>

              {profile.phone_number && (
                <div className="contact-item">
                  <strong>Phone:</strong>
                  <a href={`tel:${profile.phone_number}`} className="contact-link">
                    {profile.phone_number}
                  </a>
                </div>
              )}

              {profile.address && (
                <div className="contact-item">
                  <strong>Address:</strong>
                  <span>{profile.address}</span>
                </div>
              )}

              {profile.website && (
                <div className="contact-item">
                  <strong>Website:</strong>
                  <a 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contact-link"
                  >
                    {profile.website}
                  </a>
                </div>
              )}

              {profile.facebook_page && (
                <div className="contact-item">
                  <strong>Facebook:</strong>
                  <a 
                    href={profile.facebook_page.startsWith('http') ? profile.facebook_page : `https://facebook.com/${profile.facebook_page}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contact-link"
                  >
                    Visit Facebook Page
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="info-section">
            <h2>Profile Details</h2>
            <div className="meta-info">
              <p><strong>Profile ID:</strong> #{profile.id}</p>
              <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Placeholder for future features */}
        <div className="profile-actions">
          <h2>Get in Touch</h2>
          <div className="action-buttons">
            <a 
              href={`mailto:${profile.contact_email}?subject=Inquiry about ${profile.business_name}`}
              className="action-button primary"
            >
              Send Email
            </a>
            {profile.phone_number && (
              <a 
                href={`tel:${profile.phone_number}`}
                className="action-button secondary"
              >
                Call Now
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessProfileDetail;
