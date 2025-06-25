import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

export function getUserIdFromRequest(request: NextRequest): number | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    // Silencioso em produção, mas pode logar em dev
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAccessToken(token);
    return decoded ? decoded.id : null;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
} 