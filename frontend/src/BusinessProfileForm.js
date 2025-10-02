// frontend/src/BusinessProfileForm.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from './api/api'; // 🛑 Import the custom Axios client 🛑
import './BusinessProfileForm.css';

// Removed 'accessToken' prop as the 'api' client handles it internally
function BusinessProfileForm({ onCreate, isEditMode }) { 
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        contact_email: '',
        phone_number: '',
        address: '',
        website: '',
        facebook_page: '',
        // File fields start as null to differentiate from empty strings
        logo: null,
        cover_photo: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true); // Start loading in edit mode
    
    // Add a separate state to store the initial profile data (for visual hints if needed)
    const [initialProfile, setInitialProfile] = useState(null); 

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: files ? files[0] : value
        }));
    };
    
// --- 1. Load Data for Editing (useEffect) ---
    const fetchProfileData = useCallback(async () => {
        if (!isEditMode || !id) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            // Use api.get for fetching profile data
            const response = await api.get(`profiles/${id}/`);
            const data = response.data;
            
            // Store the initial profile data for context/hints
            setInitialProfile(data);

            // Set the form data from the fetched data
            setFormData({
                business_name: data.business_name || '',
                description: data.description || '',
                contact_email: data.contact_email || '',
                phone_number: data.phone_number || '',
                address: data.address || '',
                website: data.website || '',
                facebook_page: data.facebook_page || '',
                // File inputs must be reset to null when loading to avoid console warnings
                logo: null, 
                cover_photo: null
            });
            
        } catch (error) {
            console.error("Failed to fetch profile for editing:", error);
            // If fetching fails, redirect away
            navigate('/'); 
        } finally {
            setLoading(false);
        }
    }, [isEditMode, id, navigate]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);


// --- 2. Handle Submission (POST/PATCH with Axios and FormData) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // 🛑 Convert the React state to FormData for submission 🛑
        const form = new FormData();
        
        for (const key in formData) {
            const value = formData[key];
            
            // Crucial: Only append values that are not null. 
            // This prevents sending `null` for optional text fields or `null` for files the user didn't select.
            if (value !== null && value !== undefined) {
                // If it's a string and empty, and we are PATCHing, skip it entirely 
                // to prevent Django from treating it as a change to an empty string.
                // NOTE: If the user explicitly wants to clear a field, they'll send an empty string, 
                // which might be fine depending on the backend model requirements.
                
                // For robustness, we skip file fields that are null/undefined (user didn't choose a new file)
                if (key === 'logo' || key === 'cover_photo') {
                    if (value instanceof File) {
                        form.append(key, value);
                    }
                } else if (typeof value === 'string' && value.trim() !== '') {
                    form.append(key, value);
                } else if (typeof value === 'string' && value.trim() === '' && !isEditMode) {
                    // In POST (create) mode, send empty strings if necessary for required fields
                    form.append(key, value);
                } else if (typeof value !== 'string') {
                     // For non-string fields (like numbers, which you don't have here)
                    form.append(key, value);
                }
            }
        }
        
        // Determine method and URL
        const method = isEditMode ? 'patch' : 'post';
        const url = isEditMode ? `profiles/${id}/` : 'profiles/';
        
        try {
            // 🛑 Use the api client: it handles the Authorization header and token refresh automatically. 🛑
            const response = await api({
                method: method, // 'post' or 'patch'
                url: url,
                data: form, // Send the FormData object
                // Axios automatically sets 'Content-Type': 'multipart/form-data'
            });

            const resultProfile = response.data;
            onCreate(resultProfile); // Notify App.js 
            
            // Navigate to the detail view of the new/updated profile
            navigate(`/profiles/${resultProfile.id}`); 
            
        } catch (error) {
            console.error('Submission error:', error.response || error);
            const status = error.response?.status;
            const errorData = error.response?.data;

            if (status === 400 && errorData) {
                // Display validation errors
                setErrors(errorData); 
            } else if (status === 401 || status === 403) {
                 // Interceptor should handle 401/403 (e.g., redirect to login)
                navigate('/login', { state: { message: "Session expired or unauthorized. Please log in." } });
            } else {
                setErrors({ general: 'Failed to save profile. Please check your network connection.' });
            }
        } finally {
            setLoading(false);
        }
    };


    if (isEditMode && loading) {
        return <div className="profile-form-container"><p>Loading profile for editing...</p></div>;
    }


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

                {/* ... (Other Text Fields: Phone, Address, Website, Facebook) ... */}

                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                    {errors.phone_number && <p className="form-error">{errors.phone_number}</p>}
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} />
                    {errors.address && <p className="form-error">{errors.address}</p>}
                </div>
                <div className="form-group">
                    <label>Website</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} />
                    {errors.website && <p className="form-error">{errors.website}</p>}
                </div>
                <div className="form-group">
                    <label>Facebook Page</label>
                    <input type="url" name="facebook_page" value={formData.facebook_page} onChange={handleChange} />
                    {errors.facebook_page && <p className="form-error">{errors.facebook_page}</p>}
                </div>

                
                {/* --- Logo File --- */}
                <div className="form-group file-upload-group">
                    <label>Business Logo</label>
                    <input
                        type="file"
                        name="logo"
                        onChange={handleChange}
                        // accept="image/*" // Optional: restrict file types
                    />
                    {errors.logo && <p className="form-error">{errors.logo}</p>}
                    {isEditMode && initialProfile?.logo && <p className="file-hint">Current file is uploaded. Leave blank to keep existing logo.</p>}
                </div>

                {/* --- Cover Photo File --- */}
                <div className="form-group file-upload-group">
                    <label>Cover Photo</label>
                    <input
                        type="file"
                        name="cover_photo"
                        onChange={handleChange}
                        // accept="image/*" // Optional: restrict file types
                    />
                    {errors.cover_photo && <p className="form-error">{errors.cover_photo}</p>}
                    {isEditMode && initialProfile?.cover_photo && <p className="file-hint">Current file is uploaded. Leave blank to keep existing photo.</p>}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Profile' : 'Save Profile')}
                </button>
            </form>
        </div>
    );
}

export default BusinessProfileForm;
