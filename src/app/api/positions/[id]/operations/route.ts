import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getOperationsByPositionId } from "@/lib/db/position-helpers";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    if (isNaN(positionId)) {
      return NextResponse.json({ message: "Invalid position ID" }, { status: 400 });
    }
    
    const operations = await getOperationsByPositionId(positionId, userId);
    
    return NextResponse.json(operations);
  } catch (error: any) {
    const paramsForError = 'params' in context ? (await context.params).id : 'unknown';
    console.error(`Failed to get operations for position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: error.message || "Failed to get operations" },
      { status: 500 }
    );
  }
} 