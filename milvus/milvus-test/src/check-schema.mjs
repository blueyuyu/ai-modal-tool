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

    // 获取集合描述
    const describe = await client.describeCollection({
      collection_name: COLLECTION_NAME,
    });

    console.log("集合信息:");
    console.log(`  名称: ${describe.collection_name}`, describe);
    console.log(
      `  向量维度: ${describe.fields.find((f) => f.name === "vector").dim}`
    );
    console.log(`  副本文本: ${describe.collection_name}\n`);

    // 获取索引信息
    const indexInfo = await client.describeIndex({
      collection_name: COLLECTION_NAME,
    });

    console.log("索引信息:");
    console.log(JSON.stringify(indexInfo, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
