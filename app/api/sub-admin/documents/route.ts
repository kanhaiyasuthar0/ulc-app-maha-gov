//@ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import DocumentManagementService from "@/lib/documents/DocumentManagementService";
import formidable from "formidable";
import fs from "fs";
// import path from "path";
import Busboy from "busboy";
// import { File } from "undici";

// Disable body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Utility function to parse form data
// async function parseForm(
//   req: NextRequest
// ): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
//   return new Promise((resolve, reject) => {
//     const form = new formidable.IncomingForm();

//     form.parse(req as any, (err, fields, files) => {
//       if (err) reject(err);
//       else resolve({ fields, files });
//     });
//   });
// }

// GET: List documents
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jurisdictionId = searchParams.get("jurisdictionId");

  try {
    const documents = await DocumentManagementService.getDocumentsForSubAdmin(
      session.user.id,
      jurisdictionId || ""
    );

    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST: Upload document
export async function POST(request: NextRequest) {
  // 1. Check content type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  try {
    // 2. Parse the request with Busboy
    const formData = await parseMultipartForm(request);
    // formData will have { fields, fileBuffers } or however you design it

    // 3. Extract your data
    const { jurisdictionId, tags } = formData.fields;
    const fileBuffer = formData.fileBuffers[0]?.buffer; // e.g. if you expect only one file
    const originalFilename = formData.fileBuffers[0]?.filename || "unnamed.pdf";
    const mimeType = formData.fileBuffers[0]?.mimeType || "application/pdf";

    // 4. Convert to a Web File (if your service expects a `File`)
    // const webFile = new File([fileBuffer], originalFilename, {
    //   type: mimeType,
    // });

    // jurisdictionId: string,
    // subAdminId: string,
    // tags?: string[]

    // await DocumentManagementService.uploadDocument(
    //   webFile,
    //   jurisdictionId,
    //   originalFilename,
    //   [mimeType]
    // );
    // const file = new File([fileBuffer], "filename.pdf", { type: "application/pdf" });

    // 5. Pass `webFile` to your DocumentManagementService
    // (and handle your logic for `jurisdictionId` and `tags`).
    // ...
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Busboy parse error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function parseMultipartForm(request: NextRequest) {
  return new Promise<{
    fields: Record<string, string>;
    fileBuffers: Array<{
      fieldname: string;
      filename: string;
      mimeType: string;
      buffer: Buffer;
    }>;
  }>((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        "content-type": request.headers.get("content-type") || "",
      },
    });

    const fields: Record<string, string> = {};
    const fileBuffers: Array<{
      fieldname: string;
      filename: string;
      mimeType: string;
      buffer: Buffer;
    }> = [];

    busboy.on("file", (fieldname, file, filename, encoding, mimeType) => {
      const chunks: Buffer[] = [];
      file.on("data", (chunk) => {
        chunks.push(chunk);
      });
      file.on("end", () => {
        fileBuffers.push({
          fieldname,
          filename,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("field", (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on("error", (err) => {
      reject(err);
    });

    busboy.on("finish", () => {
      resolve({ fields, fileBuffers });
    });

    // Convert the request's ReadableStream into Node stream for Busboy
    const reader = request.body?.getReader();

    if (!reader) {
      reject(new Error("No request body"));
      return;
    }

    async function read() {
      const { done, value } = await reader.read();
      if (done) {
        busboy.end();
        return;
      }
      busboy.write(value);
      await read();
    }

    read();
  });
}

// DELETE: Remove document
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "Document ID is required" },
      { status: 400 }
    );
  }

  try {
    await DocumentManagementService.deleteDocument(documentId, session.user.id);

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

// PATCH: Update document tags
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");

  try {
    const body = await req.json();
    const { tags } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const updatedDocument = await DocumentManagementService.updateDocumentTags(
      documentId,
      session.user.id,
      tags
    );

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update document tags" },
      { status: 500 }
    );
  }
}
