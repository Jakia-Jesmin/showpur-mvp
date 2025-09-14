// frontend/src/BusinessProfileForm.js

import React, { useState } from 'react';

function BusinessProfileForm({ onSubmit }) {
    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        contact_email: '',
        phone_number: '',
        address: '',
        website: '',
        facebook_page: '',
        // New fields for images
        logo_url: '',
        cover_photo_url: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData);
        setFormData({
            business_name: '',
            description: '',
            contact_email: '',
            phone_number: '',
            address: '',
            website: '',
            facebook_page: '',
            logo_url: '',
            cover_photo_url: '',
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Your Business Profile</h2>
            <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} placeholder="Business Name" required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description"></textarea>
            <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="Contact Email" required />
            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone Number" />
            <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
            <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="Website URL" />
            <input type="url" name="facebook_page" value={formData.facebook_page} onChange={handleChange} placeholder="Facebook Page URL" />
            <input type="url" name="logo_url" value={formData.logo_url} onChange={handleChange} placeholder="Logo Image URL" />
            <input type="url" name="cover_photo_url" value={formData.cover_photo_url} onChange={handleChange} placeholder="Cover Photo URL" />
            <button type="submit">Save Profile</button>
        </form>
    );
}

export default BusinessProfileForm;
