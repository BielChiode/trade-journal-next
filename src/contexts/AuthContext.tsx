"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { AuthCredentials } from "@/types/auth";
import * as authService from "@/services/authService";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/services/apiClient";

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
  register: (credentials: AuthCredentials) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decodedUser = jwtDecode<User>(storedToken);
        setUser(decodedUser);
        setToken(storedToken);
        apiClient.defaults.headers.Authorization = `Bearer ${storedToken}`;
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      const { data } = await authService.login(credentials);
      const token = data.accessToken;
      localStorage.setItem("token", token);
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      const decodedUser = jwtDecode<User>(token);
      setUser(decodedUser);
      setToken(token);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: AuthCredentials) => {
    setLoading(true);
    try {
      await authService.register(credentials);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        user,
        login,
        logout,
        register,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
