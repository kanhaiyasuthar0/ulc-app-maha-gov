import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { auth } from "@/auth";
import { User } from "@/lib/models/user";
import { Jurisdiction } from "@/lib/models/jurisdiction";

// GET /api/sub-admin/jurisdictions
export async function GET() {
  try {
    // 1) Authenticate user
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2) Check if user is a sub-admin (role=2)
    if (session.user.role !== 2) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 3) Connect to DB
    await connectToDatabase();

    // 4) Fetch the current user from DB to get the 'jurisdictions' array
    const user = await User.findById(session.user.id).lean();
    console.log("🚀 ~ GET ~ user:", user);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 5) Find only the Jurisdiction docs corresponding to user.jurisdictions
    const jurisdictions = await Jurisdiction.find({
      _id: { $in: user.jurisdictions || [] },
    }).lean();

    return NextResponse.json(jurisdictions, { status: 200 });
  } catch (error) {
    console.error("Error fetching sub-admin jurisdictions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
