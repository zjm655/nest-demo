export interface User {
  id: number;
  email: string;
  role: string;
}

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpAt: Date;
  refreshToken: string;
  refreshTokenExpAt: Date;
}

export interface Session {
  id: string;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  user: User;
}
