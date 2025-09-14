// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css'; // Keep the styling if you want to
import BusinessProfileForm from './BusinessProfileForm';

function App() {
  const [profiles, setProfiles] = useState([]); // Use an array for multiple profiles
  const [loading, setLoading] = useState(true);

  // Fetch all existing profiles
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

  // Submit a new profile
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
        setProfiles([...profiles, newProfile]); // Add the new profile to the list
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
      <h1>Showpur Business Profiles</h1>
      {profiles.length > 0 ? (
        <ul>
          {profiles.map(profile => (
            <li key={profile.id}>
              <h2>{profile.business_name}</h2>
              <p>Email: {profile.contact_email}</p>
              <p>Description: {profile.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No profiles found. Create the first one!</p>
      )}
      <BusinessProfileForm onSubmit={submitProfile} />
    </div>
  );
}

export default App;
