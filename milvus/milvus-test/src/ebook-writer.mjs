// 关于使用ai检索电子书，并生成问答
// * 连接 Milvus
// * 创建 ebook 的集合
// * 加载 epub 文件用 splitter 分块存入 Milvus

import "dotenv/config";
import { parse } from "path";
import {
  MilvusClient,
  DataType,
  MetricType,
  IndexType,
} from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const COLLECTION_NAME = "ebook_collection";
const VECTOR_DIM = 1024;
const CHUNK_SIZE = 500; // 拆分到 500 个字符
const EPUB_FILE = "./src/天龙八部.epub";

const BOOK_NAME = parse(EPUB_FILE).name;

// 初始化 Embeddings 模型
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIM,
});

// 初始化 Milvus 客户端
const client = new MilvusClient({
  address: "localhost:19530",
});

/**
 * 获取文本的向量嵌入
 */
async function getEmbedding(text) {
  const result = await embeddings.embedQuery(text);
  return result;
}
/**
 * 创建或者获取集合
 */
async function ensureCollection(bookId) {
  try {
    // 检查集合是否存在
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    });

    console.log(`集合 ${COLLECTION_NAME} 存在: ${hasCollection}`);
    if (!hasCollection.value) {
      // 没有集合，应该创建集合
      //   id、book\_id、book\_name、chapter\_num（第几章）、index（第几个分块）、content（内容）、vector（向量）
      await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          {
            name: "id",
            data_type: DataType.VarChar,
            max_length: 50,
            is_primary_key: true,
          },
          {
            name: "book_id",
            data_type: DataType.VarChar,
            max_length: 50,
          },
          {
            name: "book_name",
            data_type: DataType.VarChar,
            max_length: 50,
          },
          {
            name: "chapter_num",
            data_type: DataType.Int32,
          },
          {
            name: "index",
            data_type: DataType.Int32,
          },
          {
            name: "content",
            data_type: DataType.VarChar,
            max_length: 10000,
          },
          {
            name: "vector",
            data_type: DataType.FloatVector,
            dim: VECTOR_DIM,
          },
        ],
      });

      console.log(`集合 ${COLLECTION_NAME} 创建成功`);
      //   创建索引
      console.log(`创建索引...`);

      await client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: "vector",
        index_type: IndexType.IVF_FLAT,
        metric_type: MetricType.COSINE,
        params: { nlist: 1024 },
      });
      console.log(`索引创建成功`);

      try {
        await client.loadCollection({ collection_name: COLLECTION_NAME });
      } catch (error) {
        console.error(`加载集合失败:`, error.message);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}
/**
 * 将文档块批量插入到 Milvus（流式处理）
 */
async function insertChunksBatch(chunks, bookId, chapterNum) {
  try {
    if (chunks.length === 0) {
      return 0;
    }

    // 为每个文档块生成向量并构建插入数据
    const insertData = await Promise.all(
      chunks.map(async (chunk, chunkIndex) => {
        const vector = await getEmbedding(chunk);
        // 手动生成 ID：book_id_chapterNum_index
        return {
          id: `${bookId}_${chapterNum}_${chunkIndex}`,
          book_id: bookId,
          book_name: BOOK_NAME,
          chapter_num: chapterNum,
          index: chunkIndex,
          content: chunk,
          vector: vector,
        };
      })
    );

    // 批量插入到 Milvus
    const insertResult = await client.insert({
      collection_name: COLLECTION_NAME,
      data: insertData,
    });

    return Number(insertResult.insert_cnt) || 0;
  } catch (error) {
    console.error(`插入章节 ${chapterNum} 的数据时出错:`, error.message);
    console.error("错误详情:", error);
    throw error;
  }
}

/**
 * 加载 EPUB 文件并进行流式处理（边处理边插入）
 */
async function loadAndProcessEPubStreaming(bookId) {
  try {
    const loader = new EPubLoader(EPUB_FILE, {
      splitChapters: true,
    });

    const documents = await loader.load();
    console.log(`加载 ${EPUB_FILE} 完成，共 ${documents.length} 章节`);

    // 创建文本拆分器，拆分到 500 个字符
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: 50, // 重叠50个字符
    });

    let totalInserted = 0;

    for (
      let chapterIndex = 0;
      chapterIndex < documents.length;
      chapterIndex++
    ) {
      const chapter = documents[chapterIndex];
      const chapterContent = chapter.pageContent;

      console.log(`处理第 ${chapterIndex + 1}/${documents.length} 章...`);

      // 使用splitter进行二次拆分
      const chunks = await textSplitter.splitText(chapterContent);

      if (chunks.length === 0) {
        console.log(`  跳过空章节\n`);
        continue;
      }

      console.log(`  生成向量并插入中...`);

      const insertedCount = await insertChunksBatch(
        chunks,
        bookId,
        chapterIndex + 1
      );

      totalInserted += insertedCount;
      console.log(
        `  ✓ 已插入 ${insertedCount} 条记录（累计: ${totalInserted}）\n`
      );
    }
    console.log(`\n总共插入 ${totalInserted} 条记录\n`);
    return totalInserted;
  } catch (error) {
    console.error(`加载 EPUB 文件失败:`, error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log("=".repeat(80));
    console.log("电子书处理程序");
    console.log("=".repeat(80));

    // 连接 Milvus
    console.log("\n连接 Milvus...");
    await client.connectPromise;
    console.log("✓ 已连接\n");

    // 设置 book_id（
    const bookId = 1;

    // 确保集合存在
    await ensureCollection(bookId);

    // 加载和处理 EPUB 文件（流式处理，边处理边插入）
    await loadAndProcessEPubStreaming(bookId);

    console.log("=".repeat(80));
    console.log("处理完成！");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("\n错误:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
