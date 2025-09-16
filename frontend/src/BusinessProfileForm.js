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
        logo: null,  // Change to null
        cover_photo: null, // Change to null
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        for (const key in formData) {
            data.append(key, formData[key]);
        }
        await onSubmit(data);
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
            
            <label htmlFor="logo">Business Logo</label>
            <input type="file" name="logo" id="logo" onChange={handleChange} />
            
            <label htmlFor="cover_photo">Cover Photo</label>
            <input type="file" name="cover_photo" id="cover_photo" onChange={handleChange} />
            
            <button type="submit">Save Profile</button>
        </form>
    );
}

export default BusinessProfileForm;
