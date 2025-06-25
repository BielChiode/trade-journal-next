import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { updatePositionDetails } from "@/lib/db/position-helpers";
import { PositionModel } from "@/models/position";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const positionId = parseInt(id, 10);
    return NextResponse.json(
      { message: `GET method for position ${positionId} not implemented` },
      { status: 404 }
    );
  } catch (error: any) {
    const paramsForError =
      "params" in context ? (await context.params).id : "unknown";
    console.error(`Failed to fetch trade ${paramsForError}:`, error);
    return NextResponse.json(
      { message: "Failed to fetch trade" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    const body = await request.json();

    await updatePositionDetails(positionId, userId, body);

    return NextResponse.json({ message: "Position updated successfully" });
  } catch (error: any) {
    const paramsForError =
      "params" in context ? (await context.params).id : "unknown";
    console.error(`Failed to update position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: error.message || "Failed to update position" },
      { status: error.message.includes("not found") ? 404 : 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);

    await PositionModel.delete(positionId, userId);

    return NextResponse.json(
      { message: "Position deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    const paramsForError =
      "params" in context ? (await context.params).id : "unknown";
    console.error(`Failed to delete position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: error.message || "Failed to delete position" },
      { status: error.message.includes("not found") ? 404 : 500 }
    );
  }
}
