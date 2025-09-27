// frontend/src/ProfileCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import './ProfileCard.css';

// A simple reusable card component to display key info
function ProfileCard({ profile }) {
    
    // Fallback logo if none is provided
    const logoUrl = profile.logo || 'https://via.placeholder.com/150?text=No+Logo';

    return (
        <div className="profile-card">
            <Link to={`/profiles/${profile.id}`} className="card-link">
                
                <div className="card-logo-container">
                    {/* Display the logo */}
                    <img src={logoUrl} alt={`${profile.business_name} logo`} className="card-logo" />
                </div>
                
                <div className="card-content">
                    <h3 className="card-title">{profile.business_name}</h3>
                    
                    {/* Display the address or a shortened description */}
                    <p className="card-detail address">
                        {profile.address || profile.description.substring(0, 50) + '...'}
                    </p>
                    
                    {/* Simple contact info */}
                    <p className="card-detail email">
                        Email: {profile.contact_email}
                    </p>
                </div>
                
                <span className="view-details-btn">View Profile →</span>
            </Link>
        </div>
    );
}

export default ProfileCard;
