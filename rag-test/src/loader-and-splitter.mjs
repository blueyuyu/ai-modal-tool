import "dotenv/config";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const model = new ChatOpenAI({
  temperature: 0,
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const cheerioLoader = new CheerioWebBaseLoader(
  "https://juejin.cn/post/7233327509919547452",
  {
    selector: ".main-area p",
  }
);

const documents = await cheerioLoader.load();

console.log(documents);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // 每个分块的字符数
  chunkOverlap: 50, // 分块之间的重叠字符数
  separators: ["。", "!", "?"], // 分割符
});

const splitDocuments = await textSplitter.splitDocuments(documents);
console.log(splitDocuments);

console.log(`文档分割完成，共 ${splitDocuments.length} 个分块\n`);
console.log("正在创建向量存储...");
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocuments,
  embeddings
);

console.log("向量存储创建完成\n");

const retriever = vectorStore.asRetriever({
  k: 2,
}); // 设置返回的相似文档数量

const questions = ["父亲的去世对作者的人生态度产生了怎样的根本性逆转？"];

for (const question of questions) {
  console.log(`问题: ${question}`);
  const retrievedDocs = await retriever.invoke(question);

  // 使用 similaritySearchWithScore 获取相似度评分
  const scoredResults = await vectorStore.similaritySearchWithScore(question);
  console.log("scoredResult", scoredResults);

  retrievedDocs.forEach((doc, i) => {
    const scoredResult = scoredResults.find(
      ([scoredDoc]) => scoredDoc.pageContent === doc.pageContent
    );

    const score = scoredResult ? scoredResult[1] : null;
    const similarity = score !== null ? (1 - score).toFixed(4) : "N/A";

    console.log(`\n[文档 ${i + 1}] 相似度: ${similarity}`);
    console.log(`内容: ${doc.pageContent}`);
    if (doc.metadata) {
      console.log(
        `元数据: 章节=${doc.metadata.chapter}, 角色=${doc.metadata.character}, 类型=${doc.metadata.type}, 心情=${doc.metadata.mood}`
      );
    }
  });

  // 构建 prompt
  const context = retrievedDocs
    .map((doc, i) => `[片段 ${i + 1}]    ${doc.pageContent}`)
    .join("\n\n ---- \n\n");

  const prompt = `请根据以下内容回答问题：\n\n${context}\n\n问题：${question}\n\n答案：`;

  const response = await model.invoke(prompt);

  console.log(`\n答案: ${response.content}\n`);
  console.log("\n");
}
