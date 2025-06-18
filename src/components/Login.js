import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import NetworkBackground3D from './NetworkBackground3D';

const Login = () => {
  const { login: authLogin, user } = useAuth();
  const [formData, setFormData] = React.useState({
    email: 'admin@example.com',
    password: '123456789',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      console.log('User is already logged in, redirecting to /chat');
      navigate('/chat', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Initializing Google Sign-In');
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          context: 'signin',
        });

        const googleButtonDiv = document.getElementById('googleSignInButton');
        if (googleButtonDiv) {
          console.log('Rendering Google Sign-In button');
          window.google.accounts.id.renderButton(googleButtonDiv, {
            theme: 'filled_blue',
            size: 'large',
            width: '350',
            text: 'signin_with',
          });
          console.log('Google button rendered successfully');
        } else {
          console.error('Google Sign-In button div not found');
          setTimeout(initializeGoogleSignIn, 100); // Retry after 100ms
        }
      } else {
        console.error('Google Identity Services not available, retrying...');
        setTimeout(initializeGoogleSignIn, 100); // Retry after 100ms
      }
    };

    script.onload = () => {
      console.log('Google script loaded');
      initializeGoogleSignIn();
    };

    script.onerror = () => {
      console.error('Error loading Google Identity Services script');
      setError('خطا در بارگذاری اسکریپت گوگل');
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    const credential = response.credential;
    console.log('Google Credential:', credential);

    try {
      const decodedToken = jwtDecode(credential);
      console.log('Decoded User Info:', decodedToken);

      console.log('Sending request to:', `${process.env.REACT_APP_PYTHON_APP_API_URL}/auth/google`);
      const backendResponse = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credential }),
      });

      console.log('Backend Response Status:', backendResponse.status);
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.error('Backend Response Error:', errorData);
        throw new Error(errorData.detail || 'Backend Google login failed');
      }

      const backendData = await backendResponse.json();
      console.log('Backend Response Data:', backendData);

      if (backendData.token) {
        console.log('Storing token:', backendData.token);
        localStorage.setItem('token', backendData.token);
        localStorage.setItem('user', JSON.stringify(backendData.user));
        await authLogin({ token: backendData.token, user: backendData.user });
        navigate('/chat', { replace: true });
      } else {
        throw new Error('Backend did not return an authentication token');
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'خطا در ورود با گوگل');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authLogin(formData);
      navigate('/chat', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <NetworkBackground3D />
        <div className="relative z-10 max-w-md w-full space-y-8 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-gray-700/50 animate-fade-in">
          <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-white">
            ورود به سیستم
          </h2>
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  ایمیل
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none relative block w-full px-4 py-2 border border-gray-600/50 bg-gray-800/50 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-300"
                    placeholder="ایمیل"
                    value={formData.email}
                    onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  رمز عبور
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none relative block w-full px-4 py-2 border border-gray-600/50 bg-gray-800/50 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-300"
                    placeholder="رمز عبور"
                    value={formData.password}
                    onChange={handleChange}
                />
              </div>
            </div>

            {error && (
                <div className="text-red-400 text-sm text-center animate-pulse">{error}</div>
            )}

            <div className="space-y-4">
              <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-100'}`}
              >
                {loading ? (
                    <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle
                          className="opacity-50"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                      ></circle>
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.272A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                ) : (
                    'ورود'
                )}
              </button>

              <div className="flex justify-center">
                <div id="googleSignInButton" className="w-full flex justify-center transition-all duration-300 hover:scale-100"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Login;