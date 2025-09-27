// frontend/src/utils/api.js

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // 1. If no refresh token exists, force user to log in
    if (!refreshToken) {
        throw new Error('No refresh token found. User must log in.');
    }

    try {
        // 2. Call Django endpoint to get a new access token
        const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            // 3. Store the new access token and return it
            localStorage.setItem('access_token', data.access);
            return data.access; 
        } else {
            // 4. If refresh fails, assume refresh token is expired/invalid
            throw new Error('Failed to refresh token.');
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear all tokens on failure to ensure a clean logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw error; // Re-throw the error to be caught by the calling function
    }
};

export default refreshAccessToken;
