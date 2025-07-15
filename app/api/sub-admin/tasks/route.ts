import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/lib/models/task";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 2) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  const tasks = await Task.find({ assignedTo: session.user.id }).sort({ createdAt: -1 });
  return NextResponse.json(tasks);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== 2) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  const { taskId, status } = await req.json();
  if (!taskId || !status) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }
  const task = await Task.findOneAndUpdate(
    { _id: taskId, assignedTo: session.user.id },
    { status },
    { new: true }
  );
  if (!task) {
    return NextResponse.json({ message: "Task not found or not authorized" }, { status: 404 });
  }
  return NextResponse.json(task);
} 