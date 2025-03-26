import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { Jurisdiction } from "@/lib/models/jurisdiction";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== 1) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find all jurisdictions
    const jurisdictions = await Jurisdiction.find({});

    return NextResponse.json(jurisdictions);
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching jurisdictions" },
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

    const { name, subAdmins = [] } = await request.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: "Jurisdiction name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if jurisdiction already exists
    const existingJurisdiction = await Jurisdiction.findOne({ name });
    if (existingJurisdiction) {
      return NextResponse.json(
        { message: "Jurisdiction with this name already exists" },
        { status: 409 }
      );
    }

    // Create jurisdiction
    const jurisdiction = await Jurisdiction.create({
      name,
      subAdmins,
    });

    return NextResponse.json(jurisdiction, { status: 201 });
  } catch (error) {
    console.error("Error creating jurisdiction:", error);
    return NextResponse.json(
      { message: "An error occurred while creating jurisdiction" },
      { status: 500 }
    );
  }
}
