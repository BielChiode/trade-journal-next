import { NextRequest, NextResponse } from "next/server";
import { verifyRefreshToken, createAccessToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: "Refresh token not found" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    return NextResponse.json({ message: "Invalid refresh token" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 403 });
  }

  if (user.token_version !== payload.tokenVersion) {
    return NextResponse.json({ message: "Token has been revoked" }, { status: 403 });
  }

  const newAccessToken = createAccessToken(user);

  return NextResponse.json({ accessToken: newAccessToken });
}