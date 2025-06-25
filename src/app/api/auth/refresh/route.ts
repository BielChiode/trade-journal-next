import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, createAccessToken } from "@/lib/jwt";
import pool from "@/lib/db/database";
import { User } from "@/types/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Refresh token not found" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 401 });
  }

  const { rows } = await pool.query<User>("SELECT * FROM users WHERE id = $1", [
    payload.id,
  ]);
  const user = rows[0];

  if (!user || user.token_version !== payload.tokenVersion) {
    const response = NextResponse.json(
      { message: "Invalid refresh token" },
      { status: 401 }
    );
    // Limpa o cookie inválido
    response.cookies.delete("refreshToken");
    return response;
  }

  // Se o refresh token é válido, cria um novo access token
  const newAccessToken = createAccessToken(user);

  return NextResponse.json({ accessToken: newAccessToken });
}