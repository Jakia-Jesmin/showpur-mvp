// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// All component imports are correct
import UserProfile from './UserProfile'; 
import BusinessProfileList from './BusinessProfileList';
import BusinessProfileDetail from './BusinessProfileDetail';
import BusinessProfileForm from './BusinessProfileForm';
import Register from './Register';
import Login from './Login';
import Header from './Header'; 
import Footer from './Footer';
import RecordSaleForm from './RecordSaleForm'; 
import ShowroomDashboard from './ShowroomDashboard';
import './App.css';

// 🛑 OPTIMIZATION: Removed the unused 'refreshAccessToken' import. 
// Components should rely on the global api.js interceptor. 
// import { refreshAccessToken } from './utils/auth'; 

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

    // --- 3. Profile Action Stub (kept for form use, though simpler components could handle it) ---
    const handleProfileAction = (/* data */) => {
        console.log("Profile action completed. Redirecting to list.");
    };

    return (
        <Router>
            <div className="App">
                <Header 
                    isAuthenticated={auth.isAuthenticated} 
                    handleLogout={handleLogout} 
                />

                <main className="App-main">
                    <Routes>
                        {/* 1. PUBLIC ROUTES (Home/List) - Correct */}
                        <Route path="/" element={<BusinessProfileList />} /> 
                        
                        {/* 2. AUTHENTICATION ROUTES - Correct */}
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login setAuth={setAuth} />} />

                        {/* 3. CORE CRUD ROUTES - Correct */}
                        <Route path="/profiles/:id" element={<BusinessProfileDetail currentUserId={auth.userId} />} />
                        <Route 
                            path="/create-profile" 
                            element={<BusinessProfileForm 
                                onCreate={handleProfileAction} 
                                // accessToken prop is still required if the form needs to manually 
                                // handle file uploads (which Axios interceptors can complicate).
                                // However, if the form uses the 'api' client, this prop should be removed. 
                                // Assuming 'api' client is used in BusinessProfileForm:
                                // accessToken={auth.accessToken} 
                            />} 
                        />
                        <Route 
                            path="/profiles/edit/:id" 
                            element={<BusinessProfileForm 
                                onCreate={handleProfileAction} 
                                // accessToken prop removed (see note above)
                                isEditMode={true}
                            />} 
                        />

                        {/* 4. USER & DASHBOARD ROUTES */}
                        <Route 
                            path="/profile" 
                            element={<UserProfile setAuth={setAuth} />} 
                        />
                        
                        {/* 🛑 CORRECTION: Removed the redundant /sales/record route 
                           and the unnecessary refreshAccessToken prop 🛑 */}
                        <Route 
                            path="/sales/record" 
                            element={<RecordSaleForm accessToken={auth.accessToken} />} 
                        />

                        <Route 
                            path="/dashboard/showroom" 
                            element={<ShowroomDashboard accessToken={auth.accessToken} />} 
                        />
                    </Routes>
                </main>

                <Footer /> 
            </div>
        </Router>
    );
}

export default App;
