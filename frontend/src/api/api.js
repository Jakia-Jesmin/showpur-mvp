// C:\showpur-mvp\frontend\src\api\api.js

import axios from 'axios';
// 🛑 CRITICAL CHECK: Ensure this path is correct relative to the utility file 🛑
import { refreshAccessToken } from '../utils/auth'; 

const baseURL = 'http://127.0.0.1:8000/api/'; 

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue = [];

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


// 1. REQUEST Interceptor: Attach Access Token (UNCHANGED)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. RESPONSE Interceptor: Handle 401 Unauthorized (Token Refresh) (UNCHANGED LOGIC)
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
