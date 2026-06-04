import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "ADMIN" | "DOCTOR" | "PATIENT";
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  hasProfile: boolean | null;
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const checkProfile = async (userId: number, role: string) => {
    if (role !== "PATIENT") {
      setHasProfile(true);
      return;
    }
    try {
      await api.get(`/api/patients/${userId}`);
      setHasProfile(true);
    } catch {
      setHasProfile(false);
    }
  };

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then(async (res) => {
        const userData = res.data.data;
        setUser(userData);
        await checkProfile(userData.id, userData.role);
      })
      .catch(() => {
        setUser(null);
        setHasProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    if (rememberMe) {
      formData.append("remember-me", "on");
    }

    await api.post("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const res = await api.get("/api/auth/me");
    const userData = res.data.data;
    setUser(userData);
    await checkProfile(userData.id, userData.role);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    setHasProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await checkProfile(user.id, user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasProfile,
        login,
        logout,
        isAuthenticated: !!user,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
