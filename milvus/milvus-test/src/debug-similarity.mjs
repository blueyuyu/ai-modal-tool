import "dotenv/config";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "ebook_collection1";
const VECTOR_DIM = 256;

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIM,
});

const client = new MilvusClient({
  address: "localhost:19530",
});

async function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

async function main() {
  try {
    console.log("Connecting to Milvus...");
    await client.connectPromise;
    console.log("✓ Connected\n");

    // 获取集合描述
    const describe = await client.describeCollection({
      collection_name: COLLECTION_NAME,
    });
    const storedDim = describe.fields.find(f => f.name === "vector").dim;
    console.log(`集合向量维度: ${storedDim}`);
    console.log(`代码向量维度: ${VECTOR_DIM}\n`);

    // 查询一条数据，获取存储的向量
    const queryResult = await client.query({
      collection_name: COLLECTION_NAME,
      filter: "book_id == '1'",
      limit: 1,
      output_fields: ["id", "content", "vector"],
    });

    if (queryResult.data.length === 0) {
      console.log("没有数据！");
      return;
    }

    const storedItem = queryResult.data[0];
    const storedVector = storedItem.vector;
    console.log(`存储的数据 ID: ${storedItem.id}`);
    console.log(`存储的内容: ${storedItem.content.substring(0, 50)}...`);
    console.log(`存储的向量维度: ${storedVector.length}\n`);

    // 生成查询向量
    const queryText = "阿紫是谁？";
    const queryVector = await embeddings.embedQuery(queryText);
    console.log(`查询文本: "${queryText}"`);
    console.log(`查询向量维度: ${queryVector.length}\n`);

    // 手动计算相似度
    const similarity = await cosineSimilarity(queryVector, storedVector);
    console.log(`手动计算的余弦相似度: ${similarity.toFixed(4)}\n`);

    // 使用 Milvus 搜索
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: 3,
      output_fields: ["id", "content", "score"],
    });

    console.log("Milvus 搜索结果:");
    searchResult.results.forEach((item, index) => {
      console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Content: ${item.content.substring(0, 50)}...\n`);
    });
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  }
}

main();

