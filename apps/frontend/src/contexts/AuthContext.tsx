import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  userId: string | null;
  avatarId: string | null;
  isAuthenticated: boolean;
  login: (token: string, userId: string, avatarId?: string) => void;
  logout: () => void;
  setAvatarId: (avatarId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarId, setAvatarIdState] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedAvatarId = localStorage.getItem('avatarId');
    
    if (storedToken) {
      setToken(storedToken);
      setUserId(storedUserId);
      setAvatarIdState(storedAvatarId);
    }
  }, []);

  const login = (newToken: string, newUserId: string, newAvatarId?: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', newUserId);
    if (newAvatarId) {
      localStorage.setItem('avatarId', newAvatarId);
      setAvatarIdState(newAvatarId);
    }
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('avatarId');
    setToken(null);
    setUserId(null);
    setAvatarIdState(null);
  };

  const setAvatarId = (id: string) => {
    localStorage.setItem('avatarId', id);
    setAvatarIdState(id);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        avatarId,
        isAuthenticated: !!token,
        login,
        logout,
        setAvatarId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
