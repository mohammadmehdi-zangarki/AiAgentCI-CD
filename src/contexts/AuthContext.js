import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from './axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                setUser(JSON.parse(userData)); // ابتدا کاربر را ست کنید
                try {
                    await axios.get('/verify-token');
                    // اگر درخواست موفق بود، توکن معتبر است
                } catch (error) {
                    console.error('Token verification failed:', error);
                    // فقط در صورت خطای 401 (توکن نامعتبر) پاک کنید
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        delete axios.defaults.headers.common['Authorization'];
                        setUser(null);
                    }
                    // در صورت خطاهای دیگر (مثل مشکلات شبکه)، توکن را نگه دارید
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // در صورت خطای کلی، توکن را نگه دارید
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await axios.post('/login', credentials);
            const { token, user: userData } = response.data;

            // Store token and user data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Set axios default header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setUser(userData);
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;