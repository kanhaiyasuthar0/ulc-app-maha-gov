// vectorStore.ts
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoClient } from "mongodb";

export async function getVectorStore() {
  // 1. Create a MongoClient
  const client = new MongoClient(process.env.MONGODB_ATLAS_URI || "");

  // 2. Get a reference to your DB collection
  const collection = client
    .db(process.env.MONGODB_ATLAS_DB_NAME)
    .collection(process.env.MONGODB_ATLAS_COLLECTION_NAME);

  // 3. Define the embeddings
  const embeddings = new OpenAIEmbeddings({
    // Example: "text-embedding-ada-002" or your chosen model
    model: "text-embedding-ada-002",
  });

  // 4. Instantiate the MongoDBAtlasVectorSearch store
  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    // The name of your Atlas Search index; defaults to "default"
    indexName: "vector_index",
    // The name of the field in MongoDB containing your text
    textKey: "text",
    // The name of the field in MongoDB containing your embedding
    embeddingKey: "embedding",
  });

  return { client, vectorStore };
}
