import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Component Imports
import UserProfile from './UserProfile';
import BusinessProfileList from './BusinessProfileList';
import BusinessProfileDetail from './BusinessProfileDetail';
import BusinessProfileForm from './BusinessProfileForm';
import Register from './Register';
import Header from './Header';
import Login from './Login';
import Footer from './Footer';
import RecordSaleForm from './RecordSaleForm';
import ShowroomDashboard from './ShowroomDashboard';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import ProductDetail from './ProductDetail';
import './App.css';

// RequireAuth Component - Redirects unauthenticated users to login
const RequireAuth = ({ isAuthenticated, children }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        accessToken: null,
        userId: null,
    });

    // Check for stored tokens on initial load
    useEffect(() => {
        const storedAccess = localStorage.getItem('access_token');
        const storedUserId = localStorage.getItem('user_id');

        if (storedAccess && storedUserId) {
            setAuth({
                isAuthenticated: true,
                accessToken: storedAccess,
                userId: parseInt(storedUserId),
            });
        }
    }, []);

    // Logout Handler
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');

        setAuth({
            isAuthenticated: false,
            accessToken: null,
            userId: null,
        });
    };

    // Profile Action Handler
    const handleProfileAction = () => {
        console.log("Profile action completed.");
    };

    return (
        <Router>
           
            {/* ✅ Header 1: This is the ONLY header you need. */}
            <Header isAuthenticated={auth.isAuthenticated} handleLogout={handleLogout} /> 
                <div className="App">

                <main className="App-main">
                    <Routes>
                        {/* PUBLIC ROUTES */}
                        <Route path="/" element={<BusinessProfileList />} />
                        <Route path="/profiles/:id" element={<BusinessProfileDetail currentUserId={auth.userId} />} />

                        {/* AUTHENTICATION ROUTES */}
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login setAuth={setAuth} />} />

                        {/* PROTECTED ROUTES - Dashboard & Profile */}
                        <Route path="/dashboard" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ShowroomDashboard/>
                            </RequireAuth>
                        } />
                        <Route path="/profile" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <UserProfile setAuth={setAuth}/>
                            </RequireAuth>
                        } />

                        {/* BUSINESS PROFILE ROUTES */}
                        <Route path="/create-profile" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <BusinessProfileForm 
                                    onCreate={handleProfileAction} 
                                />
                            </RequireAuth>
                        } />
                        <Route path="/profiles/edit/:id" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <BusinessProfileForm 
                                    onCreate={handleProfileAction} 
                                    isEditMode={true} 
                                />
                            </RequireAuth>
                        } />

                        {/* PRODUCT MANAGEMENT ROUTES */}
                        <Route path="/products" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ProductList />
                            </RequireAuth>
                        } />
                        <Route path="/products/create" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ProductForm />
                            </RequireAuth>
                        } />
                        <Route path="/products/:id" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ProductDetail/>
                            </RequireAuth>
                        } />
                        <Route path="/products/:id/edit" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ProductForm isEditMode={true} />
                            </RequireAuth>
                        } />
                        
                        {/* SALES/INVENTORY ROUTES */}
                        <Route path="/sales/record/:inventoryId" element={ 
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <RecordSaleForm/>
                            </RequireAuth>
                        } />
                        <Route path="/dashboard/showroom" element={
                            <RequireAuth isAuthenticated={auth.isAuthenticated}>
                                <ShowroomDashboard/>
                            </RequireAuth>
                        } />

                        {/* Fallback route */}
                        <Route path="*" element={
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <h1>404 - Page Not Found</h1>
                                <Link to="/">Go back home</Link>
                            </div>
                        } />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
