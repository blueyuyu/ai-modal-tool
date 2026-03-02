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

    // 检查集合是否存在
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    });

    if (!hasCollection.value) {
      console.log(`集合 ${COLLECTION_NAME} 不存在，无需删除\n`);
      return;
    }

    // 先释放集合
    console.log(`释放集合 ${COLLECTION_NAME}...`);
    try {
      await client.releaseCollection({ collection_name: COLLECTION_NAME });
      console.log("✓ 集合已释放\n");
    } catch (e) {
      console.log("  集合未被加载，直接删除\n");
    }

    // 删除集合
    console.log(`删除集合 ${COLLECTION_NAME}...`);
    await client.dropCollection({ collection_name: COLLECTION_NAME });
    console.log("✓ 集合已删除\n");

    console.log("✅ 删除成功！现在可以重新运行 ebook-writer.mjs 创建新集合");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
