import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; address: string }) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("wt_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.profile(token)
        .then((data) => setUser(data.user || data))
        .catch(() => { setToken(null); localStorage.removeItem("wt_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    const t = data.token;
    localStorage.setItem("wt_token", t);
    setToken(t);
    setUser(data.user);
  };

  const register = async (body: { name: string; email: string; phone: string; password: string; address: string }) => {
    const data = await authApi.register(body);
    const t = data.token;
    localStorage.setItem("wt_token", t);
    setToken(t);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("wt_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
};
