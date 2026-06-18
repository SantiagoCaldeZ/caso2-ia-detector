import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from '../../shared/api/authApi';
import { toApiError, setAccessToken } from '../../shared/api/httpClient';
import { ApiError } from '../../shared/errors/apiError';
import { LoginRequestDTO, RegisterRequestDTO, UserDTO } from '../../shared/types/auth';

interface AuthContextValue {
  user: UserDTO | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequestDTO) => Promise<void>;
  register: (payload: RegisterRequestDTO) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((token: string | null, nextUser: UserDTO | null) => {
    setToken(token);
    setAccessToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (payload: LoginRequestDTO) => {
      const response = await loginUser(payload);
      applySession(response.accessToken, response.user);
    },
    [applySession],
  );

  const register = useCallback(async (payload: RegisterRequestDTO) => {
    await registerUser(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Backend logout may not be implemented yet in MVP backend.
    } finally {
      applySession(null, null);
    }
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async (): Promise<void> => {
      try {
        const refresh = await refreshSession();
        const me = await getCurrentUser();

        if (isMounted) {
          applySession(refresh.accessToken, me);
        }
      } catch (error) {
        const apiError = toApiError(error) as ApiError;

        if (isMounted) {
          // 404 means refresh endpoint is not ready yet; we continue as logged out.
          if (apiError.statusCode === 404 || apiError.statusCode === 401) {
            applySession(null, null);
          } else {
            applySession(null, null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      logout,
    }),
    [accessToken, isLoading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider.');
  }

  return context;
}
