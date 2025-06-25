import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getOperationsByPositionId } from "@/lib/db/position-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    console.error(`Failed to get operations for position ${params.id}:`, error);
    return NextResponse.json(
      { message: error.message || "Failed to get operations" },
      { status: 500 }
    );
  }
} 