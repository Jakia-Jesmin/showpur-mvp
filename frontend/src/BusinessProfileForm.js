// frontend/src/BusinessProfileForm.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessProfileForm.css';

function BusinessProfileForm({ onCreate, accessToken }) {
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
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const form = new FormData();
        for (const key in formData) {
            if (formData[key]) {
                form.append(key, formData[key]);
            }
        }

        try {
            const response = await fetch('http://localhost:8000/api/profiles/', {
                method: 'POST',
                body: form,
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const newProfile = await response.json();
                onCreate(newProfile);
                navigate('/');
            } else {
                const errorData = await response.json();
                if (response.status === 401) {
                    // Redirect to login if token is expired
                    navigate('/login');
                    console.error('Authentication failed: Please log in again.');
                } else {
                    setErrors(errorData);
                }
            }
        } catch (error) {
            console.error('Submission error:', error);
            setErrors({ general: 'Failed to create profile. Please check your network connection.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-form-container">
            <h1 className="form-heading">Create Your Business Profile</h1>
            <form className="profile-form" onSubmit={handleSubmit}>
                {errors.general && <p className="form-error">{errors.general}</p>}

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

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                    {errors.description && <p className="form-error">{errors.description}</p>}
                </div>
                
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
                
                <div className="form-group file-upload-group">
                    <label>Business Logo</label>
                    <input
                        type="file"
                        name="logo"
                        onChange={handleChange}
                    />
                    {errors.logo && <p className="form-error">{errors.logo}</p>}
                </div>

                <div className="form-group file-upload-group">
                    <label>Cover Photo</label>
                    <input
                        type="file"
                        name="cover_photo"
                        onChange={handleChange}
                    />
                    {errors.cover_photo && <p className="form-error">{errors.cover_photo}</p>}
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
        </div>
    );
}

export default BusinessProfileForm;
