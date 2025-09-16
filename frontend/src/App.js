// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import './BusinessProfile.css';
import Header from './Header';
import Footer from './Footer';
import BusinessProfileForm from './BusinessProfileForm';

// You will create this component next
import BusinessProfileDetail from './BusinessProfileDetail';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch all existing profiles from the backend
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

  // Function to submit a new profile, including file uploads
  const submitProfile = async (formData) => {
    try {
      const response = await fetch('http://localhost:8000/api/profiles/', {
        method: 'POST',
        body: formData, // Send formData directly for file uploads
      });
      if (response.ok) {
        const newProfile = await response.json();
        setProfiles([...profiles, newProfile]);
      } else {
        const errorData = await response.json();
        console.error('Failed to submit profile:', errorData);
      }
    } catch (error) {
      console.error('Error submitting profile:', error);
    }
  };

  // The useEffect hook runs once when the component mounts
  useEffect(() => {
    fetchProfiles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <h1>Showpur Business Pages</h1>
                {profiles.length > 0 ? (
                  <div className="profiles-container">
                    {profiles.map(profile => (
                      <div key={profile.id} className="business-page">
                        <Link to={`/profiles/${profile.id}`}>
                          <h2>{profile.business_name}</h2>
                        </Link>
                        <p>{profile.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p>No profiles found. Create the first one!</p>
                    <BusinessProfileForm onSubmit={submitProfile} />
                  </>
                )}
              </>
            } />
            <Route path="/profiles/:id" element={<BusinessProfileDetail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
