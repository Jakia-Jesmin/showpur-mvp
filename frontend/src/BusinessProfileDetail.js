// frontend/src/BusinessProfileDetail.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import api from './api/api'; // 🛑 Import the custom Axios client 🛑
import './BusinessProfileDetail.css';


function BusinessProfileDetail({ currentUserId }) { 
    const { id } = useParams(); // Get the profile ID from the URL
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. Fetch single profile data ---
    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use Axios for fetching. Since this is public data, no special headers needed.
            const response = await api.get(`profiles/${id}/`); 
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            const status = error.response?.status;
            
            if (status === 404) {
                setError('Business profile not found.');
            } else {
                setError(`Failed to load profile. (Status: ${status || 'Network Error'})`);
            }
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {fetchProfile();}, [fetchProfile]);


    // --- 2. Handle Delete (Authenticated DELETE access) ---
    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`profiles/${id}/`); 
            navigate('/', { state: { message: 'Profile deleted successfully.' } });
            
        } catch (error) {
            console.error("Error deleting profile:", error);
            const status = error.response?.status;
            
            if (status === 401) {
                alert("Session expired or unauthorized. Please log in.");
                navigate('/login');
            } else if (status === 403) {
                alert("Permission denied. You can only delete your own profile.");
            } else {
                alert(`Deletion failed. Status: ${status || 'Network Error'}.`);
            }
        }
    };

    // --- Core Logic: Determine User Role and Ownership ---
    // Note: You must ensure 'currentUserId' is an integer, matching 'profile.user'.
    const isOwner = profile && profile.user === currentUserId; 
    const isProducer = profile && profile.business_type === 'Producer';
    const isShowroom = profile && profile.business_type === 'Showroom';
    
    // --- Render Logic ---
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

            {/* ====================================================== */}
            {/* 🛑 IMPLEMENTATION: PRODUCT & SHOWROOM DASHBOARD LINKS 🛑 */}
            {/* ====================================================== */}
            {(isOwner && isProducer) && (
                <div className="dashboard-link-section">
                    <button 
                        onClick={() => navigate('/products')} 
                        className="button primary-dashboard-button"
                    >
                        🏭 Go to Product Management
                    </button>
                </div>
            )}

            {(isOwner && isShowroom) && (
                <div className="dashboard-link-section">
                    <button 
                        onClick={() => navigate('/dashboard/showroom')} 
                        className="button primary-dashboard-button"
                    >
                        🏬 View Showroom Dashboard
                    </button>
                </div>
            )}
            {/* ====================================================== */}


            <div className="profile-content">
                <div className="profile-info">
                    {/* ... (About Section) ... */}
                    <div className="info-section">
                        <h2>About</h2>
                        <p className="description">{profile.description}</p>
                    </div>

                    {/* ... (Contact Information Section) ... */}
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
                </div>
                
                {/* EDIT/DELETE BUTTONS ONLY SHOWN TO OWNER (KEPT FOR ACCOUNT ACTIONS) */}
                {isOwner && (
                    <div className="profile-actions-owner"> 
                        <Link to={`/profiles/edit/${id}`} className="button edit-button">Edit Profile</Link>
                        <button onClick={handleDelete} className="button delete-button">Delete Profile</button>
                    </div>
                )}
                
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
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Call Now
                            </a>
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
        </div>
    );
}

export default BusinessProfileDetail;