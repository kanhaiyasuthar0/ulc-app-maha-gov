import { DocumentModel, type IDocument } from "@/lib/models/document";
import cloudinary from "cloudinary";
import pdf from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
/**
 * We now import MongoDBAtlasVectorSearch
 */
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";

/**
 * Import the LangChain Document type to represent chunks
 */
import { Document as LangChainDoc } from "@langchain/core/documents";

class DocumentManagementService {
  private mongoClient: MongoClient;

  constructor() {
    // Cloudinary config
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log(process.env.MONGODB_URI, "process.env.MONGODB_URI");
    // Standard MongoClient pointing to your Atlas URI
    this.mongoClient = new MongoClient(process.env.MONGODB_URI!);
  }

  async uploadDocument(
    file: File,
    jurisdictionId: string,
    subAdminId: string,
    tags?: string[]
  ) {
    try {
      // 1. Upload to Cloudinary
      const cloudinaryResponse = await this.uploadToCloudinary(
        file,
        jurisdictionId
      );

      // 2. Extract PDF metadata if PDF
      let pageCount: number | undefined;
      if (file.type === "application/pdf") {
        const pdfBuffer = await file.arrayBuffer();
        const pdfData = await pdf(Buffer.from(pdfBuffer));
        pageCount = pdfData.numpages;
      }

      // 3. Create document record (in your Mongoose collection)
      const documentRecord = new DocumentModel({
        jurisdictionId,
        subAdminId,
        fileName: file.name,
        fileUrl: cloudinaryResponse.secure_url,
        fileType: file.type.split("/").pop(),
        cloudinaryPublicId: cloudinaryResponse.public_id,
        metadata: {
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date(),
          pageCount,
        },
        tags: tags || [],
      });

      // 4. Save the new record
      await documentRecord.save();

      // 5. Create embeddings in Atlas
      //    We only do this if it’s PDF text, but you can adapt for other doc types
      if (file.type === "application/pdf") {
        await this.createEmbeddings(file, jurisdictionId, subAdminId);
      }

      return documentRecord;
    } catch (error) {
      console.error("Document upload error:", error);
      throw error;
    }
  }

  private async uploadToCloudinary(file: File, jurisdictionId: string) {
    return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: `jurisdictions/${jurisdictionId}`,
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!);
        }
      );

      file
        .arrayBuffer()
        .then((arrayBuf) => {
          const nodeBuffer = Buffer.from(arrayBuf);
          uploadStream.end(nodeBuffer);
        })
        .catch((err) => reject(err));
    });
  }

  private async createEmbeddings(
    file: File,
    jurisdictionId: string,
    subAdminId: string
  ) {
    try {
      // 1. Extract text from PDF
      const pdfBuffer = await file.arrayBuffer();
      const pdfData = await pdf(Buffer.from(pdfBuffer));

      // 2. Split text into smaller chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const textChunks = await splitter.createDocuments([pdfData.text]);

      // 3. Convert each chunk into a LangChain `Document`
      const docsForEmbedding = textChunks.map(
        (chunk) =>
          new LangChainDoc({
            pageContent: chunk.pageContent,
            metadata: {
              // Include anything you need for future filtering
              jurisdictionId,
              subAdminId,
              source: "pdf-upload",
            },
          })
      );

      // 4. Connect to your MongoDB Atlas cluster
      await this.mongoClient.connect();
      const collection = this.mongoClient
        .db(process.env.MONGODB_DBNAME)
        .collection("vectors");

      // 5. Use MongoDBAtlasVectorSearch to store the documents
      await MongoDBAtlasVectorSearch.fromDocuments(
        docsForEmbedding,
        new OpenAIEmbeddings({
          // for example: "text-embedding-ada-002" is typical
          model: "text-embedding-ada-002",
        }),
        {
          collection,
          // The name of your Atlas Search index
          // if you named it "default", you can omit this
          indexName: "vector_index",
          // The field that stores the raw text; defaults to "text"
          textKey: "text",
          // The field that stores the embedding array; defaults to "embedding"
          embeddingKey: "embedding",
        }
      );
    } catch (error) {
      console.error("Embedding creation error:", error);
      throw error;
    } finally {
      // 6. Always close your MongoDB client
      await this.mongoClient.close();
    }
  }

  // ========== Other Methods (unchanged except for the DocumentModel name) ======

  async getDocumentsForSubAdmin(subAdminId: string, jurisdictionId?: string) {
    const query: any = {
      subAdminId,
      isActive: true,
    };
    if (jurisdictionId) {
      query.jurisdictionId = jurisdictionId;
    }
    return DocumentModel.find(query).sort({ createdAt: -1 });
  }

  async deleteDocument(documentId: string, subAdminId: string) {
    // Find the document
    const document = await DocumentModel.findOne({
      _id: documentId,
      subAdminId,
      isActive: true,
    });
    if (!document) {
      throw new Error("Document not found or already deleted");
    }

    // Delete from Cloudinary
    await cloudinary.v2.uploader.destroy(document.cloudinaryPublicId);

    // Soft delete from MongoDB
    return document.softDelete();
  }

  async updateDocumentTags(
    documentId: string,
    subAdminId: string,
    tags: string[]
  ) {
    return DocumentModel.findOneAndUpdate(
      {
        _id: documentId,
        subAdminId,
        isActive: true,
      },
      { tags },
      { new: true }
    );
  }
}

export default new DocumentManagementService();
