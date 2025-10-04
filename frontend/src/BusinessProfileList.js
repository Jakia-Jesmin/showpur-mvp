import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BusinessProfileList.css';
import api from './api/api';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

function BusinessProfileList() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liveSearchTerm, setLiveSearchTerm] = useState('');
    
    const searchTerm = useDebounce(liveSearchTerm, 500);

    const fetchProfiles = async () => {
        setLoading(true); 
        setError(null);
        
        const query = searchTerm 
            ? `?search=${encodeURIComponent(searchTerm)}` 
            : '';

        try {
            const response = await api.get(`profiles/${query}`); 
            setProfiles(response.data);
        } catch (err) {
            console.error("API Error fetching profiles:", err);
            
            const status = err.response?.status;

            if (status === 401) {
                setError("Failed to load profiles. Please ensure you are logged in.");
            } else {
                setError(`Failed to load profiles (Status: ${status || 'Network Error'}).`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, [searchTerm]);

    const handleSearchChange = (e) => {
        setLiveSearchTerm(e.target.value);
    };
    
    if (loading && profiles.length === 0) {
        return <div className="profile-list-container loading-message">Loading business profiles...</div>;
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

    if (profiles.length === 0 && !loading) {
        return (
            <div className="profile-list-container no-profiles">
                <h2>No profiles found {liveSearchTerm && `for "${liveSearchTerm}"`}.</h2>
                {!liveSearchTerm && <Link to="/create-profile" className="button create-button">Create the First Profile</Link>}
                {liveSearchTerm && <button className="button reset-button" onClick={() => setLiveSearchTerm('')}>Clear Search</button>}
            </div>
        );
    }

    return (
        <div className="profile-list-container">
            <h1 className="list-heading">Browse Local Businesses</h1>
            
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name, description, or address..."
                    value={liveSearchTerm} 
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>
            
            <div className="profile-grid">
                {profiles.map(profile => (
                    <Link to={`/profiles/${profile.id}`} key={profile.id} className="profile-card-link">
                        <div className="profile-card">
                            <div 
                                className="profile-cover" 
                                style={{ 
                                    backgroundImage: profile.cover_photo 
                                        ? `url(${profile.cover_photo})` 
                                        : 'linear-gradient(to top right, #f8f9fa, #e9ecef)' 
                                }}
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
                                <p className="profile-description">
                                    {profile.description.substring(0, 70)}...
                                </p>
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
