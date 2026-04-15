import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider — manages JWT auth state + project info.
 * Token + user are persisted in localStorage so sessions survive page refreshes.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid credentials. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role, inviteCode) => {
    try {
      setLoading(true);
      const payload = { name, email, password, role };
      if (inviteCode) payload.inviteCode = inviteCode;
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
        errors: err.response?.data?.errors || [],
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  /**
   * Refresh user data from the server (e.g., after joining a project).
   * Updates both state and localStorage.
   */
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const updated = {
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        projectId: data.user.projectId?._id || data.user.projectId,
        createdAt: data.user.createdAt,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        hasProject: !!user?.projectId,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
