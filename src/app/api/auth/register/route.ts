import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db/database";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password)
      VALUES ($1, $2)
    `;
    await pool.query(query, [email, hashedPassword]);

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    let status = 500;
    let message = "Internal server error";

    // O driver pg para PostgreSQL lança um erro com um `code` específico para violações de constraint unique.
    if (error.code === '23505') { 
      status = 409;
      message = "User with this email already exists";
    }

    return NextResponse.json({ message }, { status });
  }
} 