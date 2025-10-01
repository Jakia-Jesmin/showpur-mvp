// frontend/src/utils/auth.js

const REFRESH_TOKEN_URL = 'http://localhost:8000/api/auth/token/refresh/';
const REFRESH_TOKEN_KEY = 'refresh_token'; // Key used in localStorage

export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
        // No refresh token found, force full logout (clear tokens and return null)
        localStorage.removeItem('access_token');
        return null;
    }

    try {
        const response = await fetch(REFRESH_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Save the new access token and return it
            localStorage.setItem('access_token', data.access);
            return data.access;
        } else {
            // Refresh token is invalid/expired. Clear all tokens and log out.
            localStorage.removeItem('access_token');
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            return null;
        }
    } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
    }
};
