import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret";

interface DecodedToken {
  id: number;
  email: string;
  iat: number;
  exp: number;
}

export function getUserIdFromRequest(request: NextRequest): number | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    console.error("Authorization header missing");
    return null;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("Token missing from Authorization header");
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded.id;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
} 