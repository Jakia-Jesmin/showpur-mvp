// frontend/src/BusinessProfileForm.js

import React, { useState, useEffect } from 'react'; // <-- ADDED useEffect
import { useNavigate, useParams } from 'react-router-dom'; // <-- ADDED useParams
import refreshAccessToken from './utils/api'; 
import './BusinessProfileForm.css';

// Component now accepts the new 'isEditMode' prop
function BusinessProfileForm({ onCreate, accessToken, isEditMode }) { 
    const { id } = useParams(); // Get the profile ID from the URL (only available in edit mode)
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        contact_email: '',
        phone_number: '',
        address: '',
        website: '',
        facebook_page: '',
        logo: null,
        cover_photo: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: files ? files[0] : value
        }));
    };
    
// --- 1. Load Data for Editing (useEffect) ---
    useEffect(() => {
        // Only run this logic if we are in edit mode and have an ID
        if (isEditMode && id) {
            const fetchProfileData = async () => {
                try {
                    const response = await fetch(`http://localhost:8000/api/profiles/${id}/`);
                    if (response.ok) {
                        const data = await response.json();
                        
                        // Set the form data, handling null/undefined URL fields returned from Django
                        setFormData({
                            business_name: data.business_name || '',
                            description: data.description || '',
                            contact_email: data.contact_email || '',
                            phone_number: data.phone_number || '',
                            address: data.address || '',
                            website: data.website || '',
                            facebook_page: data.facebook_page || '',
                            // File inputs (logo, cover_photo) must be reset to null to avoid console warnings
                            logo: null,
                            cover_photo: null
                        });
                    } else {
                        // If profile is not found (404), redirect away
                        navigate('/'); 
                    }
                } catch (error) {
                    console.error("Failed to fetch profile for editing:", error);
                }
            };
            fetchProfileData();
        }
    }, [isEditMode, id, navigate]); // Dependencies for useEffect


// --- 2. Centralized Request Helper ---
    // This helper now accepts method and url, making it reusable for POST and PATCH
    const makeRequest = async (token, method, url) => {
        const form = new FormData();
        // Append form data, only sending non-null/non-empty fields 
        // (Crucial for PATCH requests with FormData)
        for (const key in formData) {
            // Skip the file fields if they are null (user didn't select a new file)
            if (formData[key] !== null) {
                 // For text fields, ensure we don't send empty strings if they're optional
                if (typeof formData[key] === 'string' && formData[key].trim() === '' && !formData[key]) {
                    continue; 
                }
                form.append(key, formData[key]);
            }
        }
        
        return fetch(url, {
            method: method, // Use the determined method (POST or PATCH)
            body: form,
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });
    };


// --- 3. Handle Submit with Refresh Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Determine method and URL based on edit mode
        const method = isEditMode ? 'PATCH' : 'POST';
        const url = isEditMode ? `http://localhost:8000/api/profiles/${id}/` : 'http://localhost:8000/api/profiles/';
        
        let currentAccessToken = accessToken;

        try {
            // Attempt 1: Try the request with the current access token
            let response = await makeRequest(currentAccessToken, method, url);

            // --- TOKEN REFRESH LOGIC ---
            if (response.status === 401) {
                console.log("Access token expired. Attempting refresh...");
                
                // Try to get a new access token and update the local variable
                const newAccessToken = await refreshAccessToken();
                currentAccessToken = newAccessToken;
                
                // Attempt 2: Retry the request with the new token
                response = await makeRequest(currentAccessToken, method, url);
            }
            // --- END TOKEN REFRESH LOGIC ---


            if (response.ok) {
                const resultProfile = await response.json();
                onCreate(resultProfile); // Notify App.js of creation/update
                
                // Navigate to the detail view of the new/updated profile
                navigate(`/profiles/${resultProfile.id}`); 
            } else {
                // Handle errors after retry (400, 403, or 401 fail)
                const errorData = await response.json();
                
                if (response.status === 401) {
                    // If it's STILL 401 after refresh, the refresh token failed
                    navigate('/login'); 
                    console.error('Both tokens expired. Please log in again.');
                } else {
                    setErrors(errorData); // Display validation errors for 400
                }
            }
        } catch (error) {
            console.error('Submission error or refresh error:', error);
            
            if (String(error).includes('log in')) {
                 navigate('/login'); // Redirect if refresh failed
            } else {
                setErrors({ general: 'Failed to save profile. Please check your network connection.' });
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="profile-form-container">
            <h1 className="form-heading">{isEditMode ? 'Edit Business Profile' : 'Create Your Business Profile'}</h1>
            <form className="profile-form" onSubmit={handleSubmit}>
                {errors.general && <p className="form-error">{errors.general}</p>}
                
                {/* --- Business Name --- */}
                <div className="form-group">
                    <label>Business Name</label>
                    <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleChange}
                        required
                    />
                    {errors.business_name && <p className="form-error">{errors.business_name}</p>}
                </div>
                
                {/* --- Description --- */}
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                    {errors.description && <p className="form-error">{errors.description}</p>}
                </div>
                
                {/* --- Contact Email --- */}
                <div className="form-group">
                    <label>Contact Email</label>
                    <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        required
                    />
                    {errors.contact_email && <p className="form-error">{errors.contact_email}</p>}
                </div>

                {/* --- Phone Number --- */}
                <div className="form-group">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                    />
                    {errors.phone_number && <p className="form-error">{errors.phone_number}</p>}
                </div>

                {/* --- Address --- */}
                <div className="form-group">
                    <label>Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />
                    {errors.address && <p className="form-error">{errors.address}</p>}
                </div>

                {/* --- Website --- */}
                <div className="form-group">
                    <label>Website</label>
                    <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                    />
                    {errors.website && <p className="form-error">{errors.website}</p>}
                </div>

                {/* --- Facebook Page --- */}
                <div className="form-group">
                    <label>Facebook Page</label>
                    <input
                        type="url"
                        name="facebook_page"
                        value={formData.facebook_page}
                        onChange={handleChange}
                    />
                    {errors.facebook_page && <p className="form-error">{errors.facebook_page}</p>}
                </div>
                
                {/* --- Logo File --- */}
                <div className="form-group file-upload-group">
                    <label>Business Logo</label>
                    <input
                        type="file"
                        name="logo"
                        onChange={handleChange}
                    />
                    {errors.logo && <p className="form-error">{errors.logo}</p>}
                    {/* Add visual cue that a file is already uploaded if in edit mode */}
                    {isEditMode && <p className="file-hint">Leave blank to keep existing logo.</p>}
                </div>

                {/* --- Cover Photo File --- */}
                <div className="form-group file-upload-group">
                    <label>Cover Photo</label>
                    <input
                        type="file"
                        name="cover_photo"
                        onChange={handleChange}
                    />
                    {errors.cover_photo && <p className="form-error">{errors.cover_photo}</p>}
                    {isEditMode && <p className="file-hint">Leave blank to keep existing photo.</p>}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Profile' : 'Save Profile')}
                </button>
            </form>
        </div>
    );
}

export default BusinessProfileForm;
