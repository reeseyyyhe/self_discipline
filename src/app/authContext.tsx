import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from './types';

type AuthUser = User | null;

type LoginPayload = {
  identifier: string; // 邮箱或手机号
  password?: string;
  mode: 'password' | 'sms';
};

type RegisterPayload = {
  name: string;
  identifier: string; // 邮箱或手机号
  password?: string;
  mode: 'password' | 'sms';
};

type UpdateProfilePayload = Partial<Pick<User, 'name' | 'email' | 'phone' | 'bio'>>;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: UpdateProfilePayload) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'self_discipline_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
      } catch {
        // ignore parse error and clear bad data
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persistUser = (nextUser: AuthUser) => {
    setUser(nextUser);
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async ({ identifier }: LoginPayload) => {
    // 本地 mock：不区分邮箱/手机号，不做密码和验证码校验
    const isEmail = identifier.includes('@');
    const now = new Date().toISOString();
    const mockUser: User = {
      id: `local-${identifier}`,
      name: identifier.split('@')[0] || identifier || '用户',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(identifier),
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      createdAt: now,
      bio: '本地 Mock 登录用户',
    };
    // 模拟异步
    await new Promise((resolve) => setTimeout(resolve, 300));
    persistUser(mockUser);
  };

  const register = async ({ name, identifier }: RegisterPayload) => {
    const isEmail = identifier.includes('@');
    const now = new Date().toISOString();
    const mockUser: User = {
      id: `local-${identifier}`,
      name: name || identifier.split('@')[0] || '新用户',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=' + encodeURIComponent(name || identifier),
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      createdAt: now,
      bio: '本地 Mock 注册用户',
    };
    await new Promise((resolve) => setTimeout(resolve, 300));
    persistUser(mockUser);
  };

  const logout = () => {
    persistUser(null);
  };

  const updateProfile = (updates: UpdateProfilePayload) => {
    if (!user) return;
    const next: User = {
      ...user,
      ...updates,
    };
    persistUser(next);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return ctx;
}

