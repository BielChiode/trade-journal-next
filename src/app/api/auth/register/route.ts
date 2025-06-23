import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db/database";

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

    const query = "INSERT INTO users (email, password) VALUES (?, ?)";
    const a = await new Promise((resolve, reject) => {
        db.run(query, [email, hashedPassword], function (err) {
            if (err) {
              if (err.message.includes("UNIQUE constraint failed")) {
                reject(new Error("User already exists"));
              }
              reject(err);
            } else {
              resolve(this.lastID);
            }
          });
    })


    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    let status = 500;
    let message = "Internal server error";

    if (error.message === "User already exists") {
      status = 409;
      message = "User with this email already exists";
    }

    return NextResponse.json({ message }, { status });
  }
} 