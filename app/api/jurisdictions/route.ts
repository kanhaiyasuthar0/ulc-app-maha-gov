import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Jurisdiction } from "@/lib/models/jurisdiction"; // Assume you have this model

export async function GET() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Fetch all jurisdictions
    const jurisdictions = await Jurisdiction.find({}, "id name");

    return NextResponse.json(jurisdictions, { status: 200 });
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return NextResponse.json(
      { message: "Error fetching jurisdictions" },
      { status: 500 }
    );
  }
}
