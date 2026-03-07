import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import path from "node:path";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function fileSystemDemo() {
  const filePath = path.join(process.cwd(), "history.json");
  const sessionId = "userId-1";

  const history = new FileSystemChatMessageHistory({
    filePath: filePath,
    sessionId: sessionId,
  });

  const systemMessage = new SystemMessage(
    "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
  );

  const userMessage = new HumanMessage("你今天吃的什么？");
  await history.addMessage(userMessage);

  const messages = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages);
  await history.addMessage(response1);

  const userMessage2 = new HumanMessage("好吃吗");
  await history.addMessage(userMessage2);

  const messages2 = [systemMessage, ...(await history.getMessages())];
  const response2 = await model.invoke(messages2);
  await history.addMessage(response2);

  console.log("userMessage", userMessage.content);
  console.log("response1", response1.content);
  console.log("userMessage2", userMessage2.content);
  console.log("response2", response2.content);
}

fileSystemDemo();
