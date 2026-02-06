import "dotenv/config";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const cheerioLoader = new CheerioWebBaseLoader(
  "https://juejin.cn/post/7233327509919547452",
  {
    selector: ".main-area p",
  }
);

const documents = await cheerioLoader.load();

console.log(documents);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400, // 每个分块的字符数
  chunkOverlap: 50, // 分块之间的重叠字符数
  separators: ["。", "!", "?"], // 分割符
});

const splitDocuments = await textSplitter.splitDocuments(documents);
console.log(splitDocuments);

console.log(`文档分割完成，共 ${splitDocuments.length} 个分块\n`);
console.log("正在创建向量存储...");
const vectorStore = new MemoryVectorStore.fromDocuments({
  splitDocuments,
  embeddings,
});

console.log("向量存储创建完成\n");

const retriever = vectorStore.asRetriever({
  k: 2,
}); // 设置返回的相似文档数量

const questions = ["父亲的去世对作者的人生态度产生了怎样的根本性逆转？"];

for (const question of questions) {
  const retrievedDocs = await retriever.getRelevantDocuments(question);
}
