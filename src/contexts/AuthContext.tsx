// src/contexts/AuthContext.tsx
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConnected } from "../lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  console.log("[AuthProvider] Initializing...");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!isSupabaseConnected); // Start with loading=false in offline mode
  const navigate = useNavigate();
  const location = useLocation();

  // Log state changes
  useEffect(() => {
    console.log("[AuthProvider] State:", { user, loading });
  }, [user, loading]);

  // Fetch user data from Supabase `users` table or create a fallback
  const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User> => {
    if (!isSupabaseConnected) {
      console.warn("[AuthProvider] Supabase not connected, using fallback user data");
      return {
        id: 'offline-user',
        email: 'offline@example.com',
        name: 'Offline User',
        role: 'user'
      };
    }

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      if (error) {
        console.error("[AuthProvider] Error fetching user data:", error.message);
        // Return fallback if no row in users table
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.email?.split("@")[0] ||
            "User",
          role: "user",
        };
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name:
          userData.full_name ||
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.email?.split("@")[0] ||
          "User",
        role: userData.role || "user",
        avatar_url: supabaseUser.user_metadata?.avatar_url,
      };
    } catch (error) {
      console.error("[AuthProvider] Error in fetchUserData:", error);
      return {
        id: 'error-user',
        email: 'error@example.com',
        name: 'Error User',
        role: 'user'
      };
    }
  };

  // Auth subscription + initial session check
  useEffect(() => {
    let isMounted = true;
    
    // Handle both online and offline modes
    if (!isSupabaseConnected) {
      console.log("[AuthProvider] Running in offline mode, setting default user");
      setUser({
        id: 'offline-user',
        email: 'offline@example.com',
        name: 'Offline User',
        role: 'user',
      });
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    console.log("[AuthProvider] Setting up auth listener...");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthProvider] Auth state changed:", {
          event,
          hasSession: !!session,
          timestamp: new Date().toISOString(),
        });

        try {
          if (session?.user) {
            const userData = await fetchUserData(session.user);
            if (isMounted) setUser(userData);
          } else {
            if (isMounted) setUser(null);
          }
        } catch (err: any) {
          console.error("[AuthProvider] Auth listener error:", err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthProvider] Error getting session:", error);
          throw error;
        }
        
        if (session?.user) {
          const userData = await fetchUserData(session.user);
          if (isMounted) setUser(userData);
        }
      } catch (error: any) {
        console.error("[AuthProvider] Error checking session:", error.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConnected) {
      console.warn("[AuthProvider] Cannot login: Supabase not connected");
      throw new Error("Cannot login: Application is in offline mode");
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error("No session returned after login");

      const userData = await fetchUserData(data.user);
      setUser(userData);

      // Persist session token
      localStorage.setItem("supabase.auth.token", data.session.access_token);

      // Redirect after login
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("[AuthProvider] Login failed:", err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConnected) {
      try {
        await supabase.auth.signOut();
      } catch (err: any) {
        console.error("[AuthProvider] Logout failed:", err.message);
      }
    }
    
    // Always clear local state
    localStorage.removeItem("supabase.auth.token");
    setUser(null);
    navigate("/login");
  };

  const value: AuthContextType = {
    user: isSupabaseConnected ? user : {
      id: 'offline-user',
      email: 'offline@example.com',
      name: 'Offline User',
      role: 'user',
    },
    loading,
    login,
    logout,
    isAuthenticated: isSupabaseConnected ? !!user : true,
  };

  return (
    <AuthContext.Provider value={value}>
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