// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserProfile from './UserProfile'; 
import BusinessProfileList from './BusinessProfileList';
import BusinessProfileDetail from './BusinessProfileDetail';
import BusinessProfileForm from './BusinessProfileForm';
import Register from './Register';
import Login from './Login';
import Header from './Header'; // 🛑 Assuming you move the header into its own component
import './App.css';
import RecordSaleForm from './RecordSaleForm'; // <-- IMPORT
import ShowroomDashboard from './ShowroomDashboard';


// 🛑 IMPORT THE NEW UTILITY 🛑
import { refreshAccessToken } from './utils/auth'; 

// Note: The redundant state (profiles, loading, error, fetchProfiles) 
// has been removed as BusinessProfileList now manages its own state for searching.

function App() {
    // Consolidated Auth State
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        accessToken: null,
        userId: null, 
    });

    // --- 1. Initial Load: Check for stored tokens ---
    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUserId = localStorage.getItem('user_id'); 
        if (storedToken && storedUserId) {
            setAuth({
                isAuthenticated: true,
                accessToken: storedToken,
                userId: parseInt(storedUserId),
            });
        }
    }, []);

    // --- 2. Logout Handler ---
    const handleLogout = () => {
        // Clear all user data from storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id'); 
        
        // Reset auth state
        setAuth({
            isAuthenticated: false,
            accessToken: null,
            userId: null,
        });
    };

    // --- 3. Profile Creation Stub (No longer needed for state in App.js) ---
    // The list component now fetches fresh data after create/update/delete.
    // The BusinessProfileForm component can simply navigate('/') after success.
    const handleProfileAction = (/* data */) => {
        // This function is now mostly a placeholder or can be removed if the form 
        // handles redirection fully on its own. We'll keep it simple and let the form redirect.
        console.log("Profile action completed. Redirecting to list.");
    };

    return (
        <Router>
            <div className="App">
                {/* 🛑 USING SEPARATE HEADER COMPONENT 🛑 */}
                <Header 
                    isAuthenticated={auth.isAuthenticated} 
                    handleLogout={handleLogout} 
                />

                <main className="App-main">
                    <Routes>
                        {/* 1. PUBLIC ROUTES (Home/List) */}
                        {/* 🛑 Keep only ONE route for the homepage 🛑 */}
                        <Route path="/" element={<BusinessProfileList />} /> 
                        
                        {/* 2. AUTHENTICATION ROUTES */}
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login setAuth={setAuth} />} />

                        {/* 3. CORE CRUD ROUTES */}
                        <Route path="/profiles/:id" element={<BusinessProfileDetail currentUserId={auth.userId} />} />
                        <Route 
                            path="/create-profile" 
                            element={<BusinessProfileForm 
                                onCreate={handleProfileAction} 
                                accessToken={auth.accessToken} 
                            />} 
                        />
                        <Route 
                            path="/profiles/edit/:id" 
                            element={<BusinessProfileForm 
                                onCreate={handleProfileAction} // Re-use
                                accessToken={auth.accessToken} 
                                isEditMode={true}
                            />} 
                        />

                        {/* 🛑 NEW: USER PROFILE MANAGEMENT ROUTE 🛑 */}
                        <Route 
                            path="/profile" 
                            element={
                                <UserProfile 
                                    accessToken={auth.accessToken} 
                                    setAuth={setAuth} 
                                />
                            } 
                        />
                        {/* 🛑 NEW SALES RECORDING ROUTE 🛑 */}
                        <Route 
                            path="/sales/record" 
                            element={<RecordSaleForm accessToken={auth.accessToken} />} 
                        />
                        <Route 
                        path="/sales/record" 
                        element={
                            <RecordSaleForm 
                                accessToken={auth.accessToken} 
                                // 🛑 PASS THE FUNCTION AS A PROP 🛑
                                refreshAccessToken={refreshAccessToken} 
                            />
                        } 
                    />
                        <Route 
                        path="/dashboard/showroom" 
                        element={<ShowroomDashboard accessToken={auth.accessToken} />} 
                    />
                    </Routes>
                </main>

                {/* 4. FOOTER (Moved here for clean separation from header) */}
                <footer className="App-footer">
                    <p>© {new Date().getFullYear()} Showpur. All rights reserved.</p>
                    <div className="social-links">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;
