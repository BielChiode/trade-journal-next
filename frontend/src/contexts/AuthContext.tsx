import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthCredentials } from '../types/auth';
import * as authService from '../services/authService';
import { jwtDecode } from 'jwt-decode';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuthCheck = () => {
            if (token) {
                try {
                    const decodedUser: User = jwtDecode(token);
                    setUser(decodedUser);
                } catch (error) {
                    console.error("Failed to decode token", error);
                    setToken(null);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        };

        handleAuthCheck();

        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [token]);

    const login = async (credentials: AuthCredentials) => {
        setLoading(true);
        const { data } = await authService.login(credentials);
        localStorage.setItem('token', data.token);
        setToken(data.token);
    };

    const register = async (credentials: AuthCredentials) => {
        await authService.register(credentials);
        // Opcional: fazer login automaticamente após o registro
        // await login(credentials);
    };

    const logout = () => {
        setLoading(true);
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 