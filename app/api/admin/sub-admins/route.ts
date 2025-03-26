import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/user";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 1) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find all sub-admins (role 2)
    const subAdmins = await User.find({ role: 2 }).select("-password");

    return NextResponse.json(subAdmins);
  } catch (error) {
    console.error("Error fetching sub-admins:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching sub-admins" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 1) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, email, password, jurisdictions } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create sub-admin
    const subAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 2,
      jurisdictions,
    });

    // Return success without exposing password
    return NextResponse.json(
      {
        id: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        role: subAdmin.role,
        jurisdictions: subAdmin.jurisdictions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sub-admin:", error);
    return NextResponse.json(
      { message: "An error occurred while creating sub-admin" },
      { status: 500 }
    );
  }
}
