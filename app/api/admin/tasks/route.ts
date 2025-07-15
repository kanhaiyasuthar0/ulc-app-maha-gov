import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/lib/models/task";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 1) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  const { title, description, assignedTo, relatedDocumentId, jurisdictionId } = await req.json();
  if (!title || !assignedTo) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }
  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: session.user.id,
    relatedDocumentId,
    jurisdictionId,
    status: 'pending',
  });
  return NextResponse.json(task, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 1) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const filter: any = {};
  if (searchParams.get("assignedTo")) filter.assignedTo = searchParams.get("assignedTo");
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  if (searchParams.get("jurisdictionId")) filter.jurisdictionId = searchParams.get("jurisdictionId");
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(tasks);
} 