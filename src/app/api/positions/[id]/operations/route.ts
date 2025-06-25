import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { message: "Invalid position ID" },
        { status: 400 }
      );
    }

    // Busca as operações garantindo que a posição pertence ao usuário
    const operations = await prisma.operation.findMany({
      where: {
        positionId: positionId,
        userId: userId, // Importante para segurança
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(operations);
  } catch (error: any) {
    console.error(`Failed to get operations for position ${params.id}:`, error);
    return NextResponse.json(
      { message: "Failed to get operations" },
      { status: 500 }
    );
  }
} 