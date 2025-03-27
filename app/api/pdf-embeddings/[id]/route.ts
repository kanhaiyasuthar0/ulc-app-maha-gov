import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { PDFEmbedding } from "@/lib/models/PDFEmbedding";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pdfId } = await params;

    await connectToDatabase();

    const result = await PDFEmbedding.deleteMany({ pdfId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "No documents found for this pdfId." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: `All chunks for pdfId="${pdfId}" deleted successfully.`,
        pdfId,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE pdfId error:", error);
    return NextResponse.json(
      { message: "Error deleting PDF/embeddings.", error: String(error) },
      { status: 500 }
    );
  }
}
