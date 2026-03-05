import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function inMemoryDemo() {
  const history = new InMemoryChatMessageHistory();

  const systemMessage = new SystemMessage(
    "你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。"
  );
  // 第一轮对话
  console.log("[第一轮对话]");
  const userMessage1 = new HumanMessage("你今天吃的什么？");
  await history.addMessage(userMessage1);

  const messages1 = [systemMessage, ...(await history.getMessages())];
  const response1 = await model.invoke(messages1);
  await history.addMessage(response1);

  // 第二轮对话
  const userMessage = new HumanMessage(
    "好吃吗"
  );

  await history.addMessage(userMessage);

  const messages2 = [systemMessage, ...await history.getMessages()];
  const response2 = await model.invoke(messages2);

  await history.addMessage(response2);

  console.log('userMessage', userMessage.content);
  console.log('response2', response2.content);

  // 展示所有历史消息

  const allMessage = await history.getMessages();
  console.log("allMessage", allMessage);

  allMessage.forEach((msg, index) => {
    console.log(`第${index + 1}轮对话`);
    console.log("------");
    console.log(index + 1, 轮, "------", msg.type === "human" ? '用户' : 'AI', msg.content);
  })
}

inMemoryDemo();
