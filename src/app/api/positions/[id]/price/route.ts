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
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const positionId = parseInt(params.id, 10);

    const position = await prisma.position.findFirst({
      where: { id: positionId, userId },
      // Tipos podem estar desatualizados até rodar prisma generate
      select: ({ id: true, last_price: true } as any),
    } as any);

    if (!position) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const p: any = position as any;
    return NextResponse.json({ positionId: p.id, last_price: p.last_price });
  } catch (error: any) {
    console.error("Failed to get last price:", error);
    return NextResponse.json({ message: "Failed to get last price" }, { status: 500 });
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
    const { price } = body ?? {};

    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (typeof numericPrice !== "number" || !isFinite(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ message: "Invalid price" }, { status: 400 });
    }

    const existing = await prisma.position.findFirst({
      where: { id: positionId, userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const updated = (await prisma.position.update({
      where: { id: positionId },
      data: ({ last_price: numericPrice } as any),
      select: ({ id: true, last_price: true } as any),
    } as any)) as any;

    return NextResponse.json({ positionId: updated.id, last_price: updated.last_price });
  } catch (error: any) {
    console.error("Failed to set last price:", error);
    return NextResponse.json({ message: "Failed to set last price" }, { status: 500 });
  }
}


