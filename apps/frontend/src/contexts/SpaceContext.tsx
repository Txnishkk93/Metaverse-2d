import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SpaceElement {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  static?: boolean;
}

export interface SpaceUser {
  id: string;
  x: number;
  y: number;
  userId: string;
  avatarUrl?: string;
  username?: string;
}

export interface Space {
  id: string;
  name: string;
  thumbnail?: string;
  dimensions: string;
  elements: SpaceElement[];
}

interface SpaceContextType {
  currentSpace: Space | null;
  users: SpaceUser[];
  currentUserPosition: { x: number; y: number };
  setCurrentSpace: (space: Space | null) => void;
  setUsers: (users: SpaceUser[]) => void;
  addUser: (user: SpaceUser) => void;
  removeUser: (userId: string) => void;
  updateUserPosition: (userId: string, x: number, y: number) => void;
  setCurrentUserPosition: (x: number, y: number) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const SpaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [users, setUsers] = useState<SpaceUser[]>([]);
  const [currentUserPosition, setCurrentUserPositionState] = useState({ x: 0, y: 0 });

  const addUser = (user: SpaceUser) => {
    setUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev;
      return [...prev, user];
    });
  };

  const removeUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateUserPosition = (userId: string, x: number, y: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, x, y } : u))
    );
  };

  const setCurrentUserPosition = (x: number, y: number) => {
    setCurrentUserPositionState({ x, y });
  };

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        users,
        currentUserPosition,
        setCurrentSpace,
        setUsers,
        addUser,
        removeUser,
        updateUserPosition,
        setCurrentUserPosition,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};
