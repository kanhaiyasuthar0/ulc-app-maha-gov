import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { Jurisdiction } from "@/lib/models/jurisdiction";
import { auth } from "@/auth";
import { User } from "@/lib/models/user";
export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 1) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find all jurisdictions
    const jurisdictions = await Jurisdiction.find({});
    const subAdmins = await User.find({ role: 2 }).select("-password");

    return NextResponse.json({ jurisdictions, subAdmins });
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching jurisdictions" },
      { status: 500 }
    );
  }
}
