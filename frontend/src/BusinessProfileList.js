import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './BusinessProfileList.css';
import api from './api/api'; // Correctly importing the custom Axios client

// Custom hook to handle debouncing logic (No changes needed here)
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

    // --- Data Fetching Logic (Now uses the authenticated 'api' client) ---
    const fetchProfiles = useCallback(async () => {
        // Optimization: skip fetch if the debounced term is empty and we already have data
        if (!searchTerm && profiles.length > 0 && !loading) return; 

        setLoading(true); 
        setError(null);
        
        // Build the query string for the GET request
        const query = searchTerm 
            ? `?search=${encodeURIComponent(searchTerm)}` 
            : '';

        try {
            // 🛑 CRITICAL FIX: Use api.get() instead of fetch() 🛑
            // Axios handles the URL construction (base URL + 'profiles/' + query)
            // and automatically includes the JWT token via the interceptor.
            const response = await api.get(`profiles/${query}`); 

            // Axios automatically parses JSON, so data is at response.data
            setProfiles(response.data);
            
        } catch (err) {
            // Axios throws an error for 4xx/5xx status codes, which is where 
            // the 401 Unauthorized error will be caught.
            console.error("API Error fetching profiles:", err);
            
            const status = err.response?.status;

            if (status === 401) {
                // If the interceptor failed to refresh or redirect, display a prompt
                // The interceptor should ideally handle the full logout/redirect.
                setError("Failed to load profiles. Please ensure you are logged in.");
            } else {
                setError(`Failed to load profiles (Status: ${status || 'Network Error'}).`);
            }
        } finally {
            setLoading(false);
        }
    }, [searchTerm, profiles.length, loading]); // Added dependencies for safety

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]); 

    // Handler for search input changes
    const handleSearchChange = (e) => {
        setLiveSearchTerm(e.target.value);
    };
    
    // --- Render Logic (No changes) ---
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
