import jwt from "jsonwebtoken";
import { User } from "@/types/auth";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "your-access-secret";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";

// A interface para o payload do token de acesso
interface AccessTokenPayload {
  id: number;
  email: string;
}

// A interface para o payload do token de atualização
interface RefreshTokenPayload {
  id: number;
  tokenVersion: number;
}

export const createAccessToken = (user: User): string => {
  const payload: AccessTokenPayload = { id: user.id, email: user.email };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const createRefreshToken = (user: User): string => {
  const payload: RefreshTokenPayload = {
    id: user.id,
    tokenVersion: user.token_version,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}; 