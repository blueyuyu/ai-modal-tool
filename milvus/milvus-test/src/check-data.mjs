import "dotenv/config";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";

const COLLECTION_NAME = "ebook_collection1";

const client = new MilvusClient({
  address: "localhost:19530",
});

async function main() {
  try {
    console.log("Connecting to Milvus...");
    await client.connectPromise;
    console.log("✓ Connected\n");

    // 获取集合统计信息
    const stats = await client.getCollectionStatistics({
      collection_name: COLLECTION_NAME,
    });

    console.log(`集合统计:`, JSON.stringify(stats, null, 2));

    // 查询看看有多少条数据
    const queryResult = await client.query({
      collection_name: COLLECTION_NAME,
      filter: "book_id == '1'",
      limit: 10,
      output_fields: ["id", "book_id", "chapter_num", "content"],
    });

    console.log(`\n查询到 ${queryResult.data.length} 条数据 (前5条):`);
    queryResult.data.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Chapter: ${item.chapter_num}`);
      console.log(`   Content: ${item.content.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
