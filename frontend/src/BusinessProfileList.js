// frontend/src/BusinessProfileList.js

import React from 'react';
import { Link } from 'react-router-dom';
import './BusinessProfileList.css';

function BusinessProfileList({ profiles, loading, error }) {
    if (loading) {
        return <div className="profile-list-container">Loading profiles...</div>;
    }

    if (error) {
        return (
            <div className="profile-list-container">
                <div className="error-message">
                    <p>Failed to load profiles: {error}</p>
                </div>
            </div>
        );
    }

    if (!profiles || profiles.length === 0) {
        return (
            <div className="profile-list-container no-profiles">
                <h2>No profiles found. Create the first one!</h2>
            </div>
        );
    }

    return (
        <div className="profile-list-container">
            <h1 className="list-heading">Showpur Business Pages</h1>
            <div className="profile-grid">
                {profiles.map(profile => (
                    <Link to={`/profiles/${profile.id}`} key={profile.id} className="profile-card-link">
                        <div className="profile-card">
                            <div 
                                className="profile-cover" 
                                style={{ backgroundImage: profile.cover_photo ? `url(${profile.cover_photo})` : 'none' }}
                            >
                                {profile.logo && (
                                    <img 
                                        src={profile.logo} 
                                        alt={`${profile.business_name} logo`} 
                                        className="profile-logo"
                                    />
                                )}
                            </div>
                            <div className="profile-info">
                                <h2 className="profile-name">{profile.business_name}</h2>
                                <p className="profile-description">{profile.description}</p>
                                <span className="profile-view-more">View Profile →</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default BusinessProfileList;