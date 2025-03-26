import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return user data from session
    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    });
  } catch (error) {
    console.error("User API error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching user data" },
      { status: 500 }
    );
  }
}
