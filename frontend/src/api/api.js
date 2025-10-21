// C:\showpur-mvp\frontend\src\api\api.js

import axios from 'axios';
import { refreshAccessToken } from '../utils/auth'; 

const baseURL = 'http://127.0.0.1:8000/api/'; 

const api = axios.create({
    baseURL: baseURL,
    // 🛑 We must set headers outside, or define a fallback, 
    // but we'll manage Content-Type inside the interceptor.
    headers: {
        'Content-Type': 'application/json', 
    },
});

let isRefreshing = false;
let failedQueue = [];

// Remove the standalone line of code—it doesn't belong here:
// await api.patch(`profiles/${profileId}/`, formData);

// ... (processQueue function remains unchanged) ...
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// --- 1. REQUEST Interceptor: Attach Token and Handle File Header ---
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        
        // 1. Attach Authorization Token
        if (token) {
            // CRITICAL: Ensure 'Bearer ' is present with a trailing space.
            config.headers.Authorization = `Bearer ${token}`; 
        }

        // 2. ✅ CRITICAL FIX for File Uploads (FormData)
        // If the request body is FormData, remove the 'Content-Type' header 
        // to allow the browser to set 'multipart/form-data' correctly.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        return config;
    }
);

// --- 2. RESPONSE Interceptor: Handle 401 Unauthorized (Token Refresh) (UNCHANGED LOGIC) ---
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response && 
            error.response.status === 401 && 
            !originalRequest._retry &&
            !originalRequest.url.includes('/token/refresh/')
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // Request 401 while refresh is in progress: Queue it
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }
            
            // First 401: Start the refresh process
            isRefreshing = true;

            try {
                // Call the external utility to get a new token
                const newAccess = await refreshAccessToken(); 
                
                // Process the queue with the new token
                processQueue(null, newAccess);
                
                // Retry the original failed request
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                return api(originalRequest); 

            } catch (refreshError) {
                // Refresh failed: Clear queue, logout user
                processQueue(refreshError, null);
                
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');

                // Force hard redirect to login page
                window.location.href = '/login'; 
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;