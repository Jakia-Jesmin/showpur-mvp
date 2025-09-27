// frontend/src/BusinessProfileList.js

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './BusinessProfileList.css';

// Custom hook to handle debouncing logic
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timeout to update the debounced value
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function: Clear the timeout if value changes (user keeps typing)
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Only re-call effect if value or delay changes

    return debouncedValue;
};


function BusinessProfileList() {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🛑 1. State for the user's immediate input (no API call dependency) 🛑
    const [liveSearchTerm, setLiveSearchTerm] = useState('');

    // 🛑 2. The actual search term, delayed by 500ms 🛑
    const searchTerm = useDebounce(liveSearchTerm, 500);

    // --- Data Fetching Logic (Now dependent on the DEBOUNCED 'searchTerm') ---
    const fetchProfiles = useCallback(async () => {
        // Only fetch if a search term exists or if we are doing the initial load
        // We can skip the fetch if the debounced term is empty and we already have data
        if (!searchTerm && profiles.length > 0 && !loading) return; 

        setLoading(true); 
        setError(null);
        
        const baseUrl = 'http://localhost:8000/api/profiles/';
        const url = searchTerm 
            ? `${baseUrl}?search=${encodeURIComponent(searchTerm)}` 
            : baseUrl;

        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setProfiles(data);
            } else {
                console.error("API response not OK:", response.status);
                setError(`Failed to load profiles (Status: ${response.status}).`);
            }
        } catch (err) {
            console.error("Network error fetching profiles:", err);
            setError('Network error. Could not connect to the API.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]); // Dependency: Only runs when the DEBOUNCED term changes

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]); 

    // Handler for search input changes: updates the IMMEDIATE state
    const handleSearchChange = (e) => {
        setLiveSearchTerm(e.target.value);
    };
    
    // --- Render Logic ---
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
            
            {/* 🛑 INPUT USES the IMMEDIATE state (liveSearchTerm) 🛑 */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name, description, or address..."
                    value={liveSearchTerm} // Binds to the immediate state
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