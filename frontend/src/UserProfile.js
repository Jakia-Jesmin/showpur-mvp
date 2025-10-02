import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api/api'; // Use the custom Axios client with interceptors
import './UserProfile.css';

// Component receives setAuth function (for logout/password change)
function UserProfile({ setAuth }) {
    const navigate = useNavigate();
    const location = useLocation(); // To check the current path
    
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
            // No need to check for accessToken here; the api interceptor handles the 401/redirect
            try {
                // Fetch basic user data using the authenticated API client
                const userResponse = await api.get('auth/user/');
                const userData = userResponse.data;
                
                setFormData(prev => ({
                    ...prev,
                    username: userData.username,
                    email: userData.email,
                }));
                
                // Fetch the user's associated business profile (assuming a dedicated endpoint or filtered list)
                // Assuming RidaBadam owns a profile, this will return it.
                const profilesResponse = await api.get('profiles/?owner=current'); 
                const ownedProfiles = profilesResponse.data;

                if (ownedProfiles.length > 0) {
                    const profileId = ownedProfiles[0].id;
                    setBusinessProfileId(profileId);
                    
                    // 🛑 NEW: CONDITIONAL REDIRECT LOGIC 🛑
                    // If the user is on the specific /profile route AND owns a profile,
                    // redirect them to their business profile detail page immediately.
                    // This resolves the ambiguity of 'My Account'.
                    if (location.pathname === '/profile') {
                        navigate(`/profiles/${profileId}`, { replace: true });
                        return; // Stop execution
                    }
                }

            } catch (error) {
                // The interceptor should handle 401 (token refresh/logout). 
                // This catch handles network errors or other propagated non-401 errors.
                console.error("Error fetching user data or profile:", error);
                const status = error.response?.status;
                if (status !== 401) { // 401 is handled, others may need user feedback
                    setMessage(`Failed to load profile data. Status: ${status || 'Network Error'}`);
                    // Optionally, redirect home if a critical error occurs
                    // navigate('/'); 
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUserAndProfile();
    }, [navigate, location.pathname]); // Dependency on path is crucial for conditional redirect


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
            // 🛑 Use api.patch() for the update 🛑
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
                // Handle validation errors from Django
                setErrors(errorData);
            }
            setMessage(`Failed to update profile. Status: ${status || 'Network Error'}`);
        }
    };
    
    // The redirect logic above should stop rendering if a redirect occurs.
    if (loading) return <div className="profile-container">Loading user data...</div>;

    return (
        <div className="profile-container">
            {/* If the user is on /profile but has a business, they are redirected, 
                so this component only renders for users without a business profile 
                or in case the redirect logic above is removed. */}
            <h1>My Account Settings</h1>
            {businessProfileId && (
                <p className="business-link-info">
                    You currently own a business profile. <Link to={`/profiles/${businessProfileId}`}>View/Edit your Business Profile.</Link>
                </p>
            )}
            <p className={`status-message ${message.includes('successfully') ? 'success' : message ? 'error' : ''}`}>{message}</p>
            
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
        </div>
    );
}

export default UserProfile;
