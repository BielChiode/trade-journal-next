import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const positionId = parseInt(params.id, 10);
    const body = await request.json();
    const { setup, observations, stop_gain, stop_loss, ticker } = body;

    const updatedPosition = await prisma.position.update({
      where: {
        id: positionId,
        userId: userId,
      },
      data: {
        setup,
        observations,
        stop_gain: stop_gain ? parseFloat(stop_gain) : null,
        stop_loss: stop_loss ? parseFloat(stop_loss) : null,
        ...(ticker ? { ticker } : {}),
      },
    });

    return NextResponse.json(updatedPosition);

  } catch (error: any) {
    const paramsForError = 'params' in context ? (await context.params).id : 'unknown';
    console.error(`Failed to update position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: "Failed to update position" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const positionId = parseInt(params.id, 10);

    await prisma.position.delete({
      where: {
        id: positionId,
        userId: userId,
      },
    });

    return NextResponse.json({ message: "Position deleted successfully" });
    
  } catch (error: any) {
    const paramsForError = 'params' in context ? (await context.params).id : 'unknown';
    console.error(`Failed to delete position ${paramsForError}:`, error);
    return NextResponse.json(
      { message: "Failed to delete position" },
      { status: 500 }
    );
  }
}
