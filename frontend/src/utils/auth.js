// frontend/src/utils/auth.js

import axios from 'axios';

const REFRESH_TOKEN_URL = 'http://127.0.0.1:8000/api/auth/jwt/refresh/'; // Use 127.0.0.1 for consistency
const REFRESH_TOKEN_KEY = 'refresh_token'; 
const ACCESS_TOKEN_KEY = 'access_token'; 
const USER_ID_KEY = 'user_id'; 

/**
 * Attempts to refresh the JWT Access Token using the stored Refresh Token.
 * @returns {string | null} The new access token if successful, or null/throws if failed.
 */
export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
        // No refresh token found. Clear access token and throw error for interceptor to handle logout.
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        // We throw an error here to signal the calling interceptor that a full logout is necessary.
        throw new Error("No refresh token available. Must re-login.");
    }

    try {
        // Use axios for consistency with the rest of the application
        const response = await axios.post(
            REFRESH_TOKEN_URL,
            { refresh: refreshToken }
        );

        // Success: response.data will contain the new 'access' token
        const newAccessToken = response.data.access;
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        
        return newAccessToken;

    } catch (error) {
        // If the refresh request itself fails (e.g., 401 response from server, meaning 
        // the refresh token is expired or invalid), we clear all tokens.
        console.error("JWT Refresh failed. Server rejected refresh token.", error);
        
        // Clear all authentication-related tokens/data
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
        
        // Propagate the error. The calling Axios interceptor (in api.js) 
        // will catch this and handle the browser redirection to the /login page.
        throw error;
    }
};
