export type User = {
  name: string;
  id: string;
  email: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  loading: boolean;
  error: string | null;
};
