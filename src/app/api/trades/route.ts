import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PositionStatus, PositionType } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const positions = await prisma.position.findMany({
      where: { userId },
      include: {
        operations: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { last_exit_date: 'desc' },
        { initial_entry_date: 'desc' },
      ]
    });

    return NextResponse.json(positions);
  } catch (error: any) {
    console.error("Failed to fetch trades:", error);
    return NextResponse.json(
      { message: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ticker, type, quantity, price, date, setup, observations } = body;

    if (!ticker || !type || !quantity || !price || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    
    const newPosition = await prisma.position.create({
      data: {
        user: { connect: { id: userId } },
        ticker,
        type: type === 'Buy' ? PositionType.Buy : PositionType.Sell,
        status: PositionStatus.Open,
        average_entry_price: price,
        current_quantity: quantity,
        initial_entry_date: new Date(date),
        setup,
        observations,
        operations: {
          create: {
            user: { connect: { id: userId } },
            operation_type: 'Entry',
            quantity,
            price,
            date: new Date(date),
          }
        }
      },
      include: {
        operations: true
      }
    });

    return NextResponse.json(newPosition, { status: 201 });

  } catch (error: any) {
    console.error("Failed to create trade:", error);
    return NextResponse.json(
      { message: "Failed to create trade" },
      { status: 500 }
    );
  }
} 