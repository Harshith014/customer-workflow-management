"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  setStoredToken,
  setStoredUser,
} from "../lib/auth";

import api from "../lib/api";

const AuthContext =
  createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    const initializeAuth =
      async () => {
        const token =
          getStoredToken();

        const storedUser =
          getStoredUser();

        if (!token) {
          setLoading(false);
          return;
        }

        /*
         * We use the stored user immediately
         * for UI rendering.
         */
        if (storedUser) {
          setUser(storedUser);
          setAuthenticated(true);
        }

        /*
         * Validate the token against backend.
         */
        try {
          const response =
            await api.get(
              "/auth/me"
            );

          const currentUser =
            response.data.user;

          setUser(currentUser);
          setStoredUser(
            currentUser
          );
          setAuthenticated(true);
        } catch {
          removeStoredToken();
          setUser(null);
          setAuthenticated(false);
        } finally {
          setLoading(false);
        }
      };

    initializeAuth();
  }, []);

  const login = async (
    email,
    password
  ) => {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

    const {
      token,
      user,
    } = response.data;

    setStoredToken(token);
    setStoredUser(user);

    setUser(user);
    setAuthenticated(true);

    return response;
  };

  const logout = () => {
    removeStoredToken();

    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth =
  () => {
    const context =
      useContext(
        AuthContext
      );

    if (!context) {
      throw new Error(
        "useAuth must be used inside AuthProvider"
      );
    }

    return context;
  };