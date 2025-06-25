import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const positionId = parseInt(params.id, 10);
    if (isNaN(positionId)) {
      return NextResponse.json({ message: "Invalid position ID" }, { status: 400 });
    }
    
    // Busca as operações garantindo que a posição pertence ao usuário
    const operations = await prisma.operation.findMany({
      where: {
        positionId: positionId,
        userId: userId, // Importante para segurança
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    return NextResponse.json(operations);
  } catch (error: any) {
    const paramsForError = 'params' in context ? (await context.params).id : 'unknown';
    console.error(`Failed to get operations for position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: "Failed to get operations" },
      { status: 500 }
    );
  }
} 