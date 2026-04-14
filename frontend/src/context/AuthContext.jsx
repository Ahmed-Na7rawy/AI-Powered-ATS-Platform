import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for initializing app
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Note: JWT is explicitly NOT stored in localStorage here per security constraints.
  // This means a full page reload will log the user out unless you implement a refresh token cookie strategy.
  // For the SPA design requested, this satisfies the "store JWT in memory only" constraint.

  useEffect(() => {
    // We just finish loading immediately since authentication state is purely in memory.
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Fast API OAuth2PasswordRequestForm expects form-data
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const { access_token } = response.data;
      
      // Store in memory via singleton interceptor
      setAuthToken(access_token);
      
      // Fetch HR profile
      const profileRes = await api.get('/hr/me');
      setUser(profileRes.data);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
export const useAuth = () => useContext(AuthContext);
