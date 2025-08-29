import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PositionStatus, PositionType, OperationType } from "@/generated/prisma";

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
    const { 
      ticker, 
      type, 
      quantity, 
      price, 
      date, 
      setup, 
      observations, 
      stop_gain, 
      stop_loss,
      exit_price,
      exit_date,
      is_closed
    } = body;

    if (!ticker || !type || !quantity || !price || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Se for posição fechada, validar campos de saída
    if (is_closed && (!exit_price || !exit_date)) {
      return NextResponse.json({ message: "Missing exit fields for closed position" }, { status: 400 });
    }
    
    const newPosition = await prisma.position.create({
      data: {
        user: { connect: { id: userId } },
        ticker,
        type: type === 'Buy' ? PositionType.Buy : PositionType.Sell,
        status: is_closed ? PositionStatus.Closed : PositionStatus.Open,
        average_entry_price: price,
        current_quantity: is_closed ? 0 : quantity,
        total_realized_pnl: is_closed ? (type === 'Buy' ? (exit_price - price) * quantity : (price - exit_price) * quantity) : 0,
        initial_entry_date: new Date(date),
        last_exit_date: is_closed ? new Date(exit_date) : null,
        setup,
        observations,
        stop_gain: stop_gain ? parseFloat(stop_gain) : null,
        stop_loss: stop_loss ? parseFloat(stop_loss) : null,
        operations: {
          create: [
            {
              userId,
              operation_type: OperationType.Entry,
              quantity,
              price,
              date: new Date(date),
            },
            ...(is_closed ? [{
              userId,
              operation_type: OperationType.PartialExit,
              quantity,
              price: parseFloat(exit_price),
              date: new Date(exit_date),
              result: type === 'Buy' ? (exit_price - price) * quantity : (price - exit_price) * quantity,
            }] : [])
          ]
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