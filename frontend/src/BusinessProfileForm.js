import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback for future function stabilization
import { useNavigate, useParams } from 'react-router-dom';
import api from './api/api'; 
import './BusinessProfileForm.css';

// Define the role options for the dropdown
const ROLE_OPTIONS = [
    { value: 'PRODUCER', label: 'Producer/Product Owner' },
    { value: 'STORE', label: 'Showroom/Store' },
]

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
        role: 'STORE',
        // Null is correct for files that haven't been selected yet
        logo: null, 
        cover_photo: null
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true); 
    
    // Stores initial data (especially image URLs) for preview and hints
    const [initialProfile, setInitialProfile] = useState(null); 

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            // If files exist (i.e., it's a file input), store the File object (files[0]).
            // Otherwise, store the string value.
            [name]: files ? files[0] : value
        }));
    };
    
    // --- 1. Load Data for Editing ---
    const fetchProfileData = useCallback(async () => {
        if (!isEditMode || !id) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const response = await api.get(`profiles/${id}/`);
            const data = response.data;
            
            setInitialProfile(data);

            setFormData({
                business_name: data.business_name || '',
                description: data.description || '',
                contact_email: data.contact_email || '',
                phone_number: data.phone_number || '',
                address: data.address || '',
                website: data.website || '',
                facebook_page: data.facebook_page || '',
                role: data.role || 'STORE',
                // Initialize state with the fetched image URLs (strings) or null
                logo: data.logo_url || null, 
                cover_photo: data.cover_photo_url || null 
            });
            
        } catch (error) {
            console.error("Failed to fetch profile for editing:", error);
            navigate('/'); 
        } finally {
            setLoading(false);
        }
    }, [isEditMode, id, navigate]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]); // Using fetchProfileData as a dependency (stabilized by useCallback)

    // --- 2. Handle Submission (POST/PATCH with FormData) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const submissionFormData = new FormData(); 
        
        for (const key in formData) {
            const value = formData[key];
            
            // Skip undefined, null, and empty string values for PATCH/POST requests
            if (value === null || value === undefined) {
                continue;
            }

            const isImageField = key === 'logo' || key === 'cover_photo';

            // A. Handle NEW FILE UPLOADS (The File object)
            if (value instanceof File) {
                submissionFormData.append(key, value);
            } 
            
            // B. Handle Text Fields (and SKIP existing image URLs in EDIT mode)
            else if (typeof value === 'string') {
                const trimmedValue = value.trim();

                // CRITICAL: If in edit mode, and this is an image field, and the value is a string (URL), SKIP it.
                // We only send a field if it's a NEW file (File object) or a text value.
                if (isEditMode && isImageField) {
                    continue; 
                }
                
                // Append all non-file, non-URL string values, including empty strings for optional fields in POST mode
                submissionFormData.append(key, trimmedValue);
            } 
            
            // C. Handle other types (like numbers, though you don't have them here)
            else {
                 submissionFormData.append(key, value);
            }
        }
        
        // 3. Determine method and URL
        const method = isEditMode ? 'patch' : 'post';
        const url = isEditMode ? `profiles/${id}/` : 'profiles/'; 
        
        try {
            const response = await api({
                method: method, 
                url: url,
                data: submissionFormData,
                // Axios automatically sets 'Content-Type': 'multipart/form-data' for FormData
            });

            const resultProfile = response.data;
            
            if (onCreate) onCreate(resultProfile);
            navigate(`/profiles/${resultProfile.id}`); 
            
        } catch (error) {
            console.error('Submission error:', error.response || error);
            const status = error.response?.status;
            const errorData = error.response?.data;

            if (status === 400 && errorData) {
                setErrors(errorData); 
            } else if (status === 401 || status === 403) {
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
            {/* The encType is technically redundant because of FormData/Axios, but harmless for clarity */}
            <form className="profile-form" onSubmit={handleSubmit}> 
                {errors.general && <p className="form-error">{errors.general}</p>}
                
                {/* 🛑 NEW ROLE SELECTION INPUT 🛑 */}
                <div className="form-group">
                    <label>Business Role</label>
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        required
                    >
                        {ROLE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {errors.role && <p className="form-error">{errors.role}</p>}
                </div>

                {/* --- Text fields (Business Name, Description, etc.) --- */}
                
                <div className="form-group">
                    <label>Business Name</label>
                    <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} required />
                    {errors.business_name && <p className="form-error">{errors.business_name}</p>}
                </div>
                
                {/* ... other text/url inputs ... */}
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} />
                    {errors.description && <p className="form-error">{errors.description}</p>}
                </div>
                
                <div className="form-group">
                    <label>Contact Email</label>
                    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} required />
                    {errors.contact_email && <p className="form-error">{errors.contact_email}</p>}
                </div>

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


                {/* --- Logo File with Preview --- */}
                <div className="form-group file-upload-group">
                    <label>Business Logo</label>
                    {/* Key change: When clicking 'clear,' the value must be reset to allow re-upload */}
                    <input type="file" name="logo" onChange={handleChange} accept="image/*" />
                    {errors.logo && <p className="form-error">{errors.logo}</p>}
                    
                    {/* Preview Logic */}
                    {(formData.logo || initialProfile?.logo_url) && (
                        <div className="image-preview-container">
                            <img
                                // If it's a File object (new selection), create a temporary URL. If not, use the fetched URL (initialProfile)
                                src={formData.logo instanceof File ? URL.createObjectURL(formData.logo) : initialProfile?.logo_url}
                                alt="Logo Preview" // Corrected redundancy in alt tag
                                className="preview-image"
                                style={{ maxWidth: '150px', maxHeight: '150px' }}
                            />
                            {isEditMode && initialProfile?.logo_url && !(formData.logo instanceof File) && <p className="file-hint">Current Logo</p>}
                        </div>
                    )}
                </div>

                {/* --- Cover Photo File with Preview --- */}
                <div className="form-group file-upload-group">
                    <label>Cover Photo</label>
                    <input type="file" name="cover_photo" onChange={handleChange} accept="image/*" />
                    {errors.cover_photo && <p className="form-error">{errors.cover_photo}</p>}

                    {(formData.cover_photo || initialProfile?.cover_photo_url) && (
                        <div className="image-preview-container">
                            <img
                                src={formData.cover_photo instanceof File ? URL.createObjectURL(formData.cover_photo) : initialProfile?.cover_photo_url}
                                alt="Business Profile Logo" // Corrected redundancy in alt tag
                                className="preview-image"
                                style={{ maxWidth: '100%', maxHeight: '300px' }}
                            />
                            {isEditMode && initialProfile?.cover_photo_url && !(formData.cover_photo instanceof File) && <p className="file-hint">Current Cover Photo</p>}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Update Profile' : 'Save Profile')}
                </button>
            </form>
        </div>
    );
}

export default BusinessProfileForm;