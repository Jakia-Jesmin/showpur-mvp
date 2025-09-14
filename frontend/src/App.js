// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css'; 
import './BusinessProfile.css'; // Add this for new styling
import BusinessProfileForm from './BusinessProfileForm';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      } else {
        console.error('Failed to fetch profiles:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async (formData) => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const newProfile = await response.json();
        setProfiles([...profiles, newProfile]);
      } else {
        console.error('Failed to submit profile:', response.statusText);
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <h1>Showpur Business Pages</h1>
      {profiles.length > 0 ? (
        <div className="profiles-container">
          {profiles.map(profile => (
            <div key={profile.id} className="business-page">
              <div className="cover-photo" style={{ backgroundImage: `url(${profile.cover_photo_url})` }}></div>
              <div className="profile-header">
                <img src={profile.logo_url} alt="Business Logo" className="business-logo" />
                <div className="business-info">
                  <h2>{profile.business_name}</h2>
                  <p className="business-contact">
                    <a href={`mailto:${profile.contact_email}`}>{profile.contact_email}</a> | {profile.phone_number}
                  </p>
                </div>
              </div>
              <div className="business-details">
                <p>{profile.description}</p>
                <div className="links">
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">Website</a>
                  <a href={profile.facebook_page} target="_blank" rel="noopener noreferrer">Facebook</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p>No profiles found. Create the first one!</p>
          <BusinessProfileForm onSubmit={submitProfile} />
        </>
      )}
    </div>
  );
}

export default App;
