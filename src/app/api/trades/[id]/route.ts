import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { updatePositionDetails } from "@/lib/db/position-helpers";
import { PositionModel } from "@/models/position";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const positionId = parseInt(id, 10);
    // Lógica para buscar um único trade (position) foi removida,
    // pois o GET de /api/trades já retorna todas as posições.
    // Se a busca de uma posição individual for necessária, ela precisa ser implementada.
    return NextResponse.json({ message: `GET method for position ${positionId} not implemented` }, { status: 404 });

  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch trade" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    const body = await request.json();
    
    // Adicionar validação do body aqui se necessário

    await updatePositionDetails(positionId, userId, body);

    return NextResponse.json({ message: "Position updated successfully" });
  } catch (error: any) {
    console.error("Failed to update position:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update position" },
      { status: error.message.includes("not found") ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positionId = parseInt(params.id, 10);
    
    await new Promise<void>((resolve, reject) => {
      PositionModel.delete(positionId, userId, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    return NextResponse.json({ message: "Position deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete position:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete position" },
      { status: error.message.includes("not found") ? 404 : 500 }
    );
  }
}
