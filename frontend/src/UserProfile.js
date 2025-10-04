import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api/api'; // Use the custom Axios client with interceptors
import './UserProfile.css';

// Component receives setAuth function (for logout/password change)
function UserProfile({ setAuth }) {
    const navigate = useNavigate();
    const location = useLocation(); 

    // State to hold the user's business profile ID
    const [businessProfileId, setBusinessProfileId] = useState(null); 
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '', 
        confirmPassword: '' 
    });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    // --- 1. Fetch User Data & Check for Business Profile (GET) ---
    useEffect(() => {
        const fetchUserAndProfile = async () => {
            try {
                // 1. Fetch basic user data
                const userResponse = await api.get('auth/user/');
                const userData = userResponse.data;
                
                setFormData(prev => ({
                    ...prev,
                    username: userData.username,
                    email: userData.email,
                }));
                
                // 2. Fetch the user's associated business profile
                const profilesResponse = await api.get('profiles/?owner=current'); 
                const ownedProfiles = profilesResponse.data;

                if (ownedProfiles.length > 0) {
                    const profileId = ownedProfiles[0].id;
                    setBusinessProfileId(profileId);
                } else {
                    setBusinessProfileId(null); 
                }

            } catch (error) {
                // The interceptor handles 401 (token refresh/logout). 
                console.error("Error fetching user data or profile:", error);
                const status = error.response?.status;
                
                if (status !== 401) {
                    setMessage(`Failed to load profile data. Status: ${status || 'Network Error'}`);
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserAndProfile();
    }, [navigate, location.pathname]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- 2. Handle Profile Update (PATCH) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setMessage('');
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match.' });
            return;
        }

        const dataToSubmit = {
            username: formData.username,
            email: formData.email,
        };
        if (formData.password) {
            dataToSubmit.password = formData.password;
        }

        try {
            await api.patch('auth/user/', dataToSubmit);

            setMessage('Profile updated successfully!');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            
            if (dataToSubmit.password) {
                // Force re-login after password change for security
                alert("Password updated. Please log in again with your new credentials.");
                setAuth({ isAuthenticated: false, accessToken: null, userId: null });
                navigate('/login');
            }

        } catch (error) {
            console.error("Submission error:", error);
            const status = error.response?.status;
            const errorData = error.response?.data || {};
            
            if (status === 400) {
                setErrors(errorData);
            }
            setMessage(`Failed to update profile. Status: ${status || 'Network Error'}`);
        }
    };
    
    // RENDER: Loading State
    if (loading) return <div className="profile-container">Loading user data...</div>;

    // RENDER: No Business Profile (from the logic you wanted to include)
    if (businessProfileId === null) {
        return (
            <div className="profile-container">
                <h1>Welcome!</h1>
                <p>You don’t have a business profile yet. You should create one to use the full features of Showpur.</p>
                <Link to="/create-profile" className="login-button">Create Your Business Profile</Link>
                
                <h2 className="password-heading">Account Settings</h2>
                <p>You can still update your username and email below.</p>
                <UserProfileForm
                    formData={formData}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    errors={errors}
                    message={message}
                    setFormData={setFormData}
                />
            </div>
        );
    }


    // RENDER: User Profile & Account Settings
    return (
        <div className="profile-container">
            <h1>My Account Settings</h1>
            
            {/* Link to Business Profile */}
            {businessProfileId && (
                <p className="business-link-info">
                    You currently own a business profile. <Link to={`/profiles/${businessProfileId}`}>View/Edit your Business Profile.</Link>
                </p>
            )}
            
            <p className={`status-message ${message.includes('successfully') ? 'success' : message ? 'error' : ''}`}>{message}</p>
            
            <UserProfileForm
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                errors={errors}
                message={message}
                setFormData={setFormData}
            />

        </div>
    );
}

// Extract form into a sub-component for clarity and re-use
const UserProfileForm = ({ formData, handleChange, handleSubmit, errors, message, setFormData }) => (
    <form onSubmit={handleSubmit} className="user-profile-form">
        
        {/* Username Group */}
        <div className="form-group">
            <label>Username</label>
            <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
            />
            {errors.username && <p className="error">{errors.username}</p>}
        </div>
        
        {/* Email Group */}
        <div className="form-group">
            <label>Email</label>
            <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            {errors.email && <p className="error">{errors.email}</p>}
        </div>
        
        <hr />
        <h2 className="password-heading">Change Password (Optional)</h2>

        {/* New Password Group */}
        <div className="form-group">
            <label>New Password</label>
            <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
            />
            {errors.password && <p className="error">{errors.password}</p>}
        </div>

        {/* Confirm New Password Group */}
        <div className="form-group">
            <label>Confirm New Password</label>
            <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
            />
            {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}
        </div>
        
        <button type="submit">Update Profile</button>
    </form>
);


export default UserProfile;
