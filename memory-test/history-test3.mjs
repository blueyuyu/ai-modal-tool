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

// 阅读之前的 history.json 文件，再接着对话
async function ReadfileSystemDemo() {
  const filePath = path.join(process.cwd(), "history.json");
  const sessionId = "userId-1";

  const history = new FileSystemChatMessageHistory({
    filePath: filePath,
    sessionId: sessionId,
  });
  const systemMessage = new SystemMessage(
    "你是一个暴躁的做菜助手，心直口快,说话简单明了,不喜欢用表情符号"
  );

  const historyMessages = await history.getMessages();
  console.log("historyMessages", historyMessages.length);

  //   第三轮对话
  const userMessage3 = new HumanMessage(
    "我当然愿意分享啦,你最想听哪一个部分呢"
  );
  await history.addMessage(userMessage3);
  //   此处注意一个细节,这里 userMessage3 已经存入history 了
  // 在下面应继续使用 history.getMessages() 获取最新的消息
  const messages3 = [systemMessage, ...(await history.getMessages())];
  const response3 = await model.invoke(messages3);
  await history.addMessage(response3);

  console.log("userMessage3", userMessage3.content);
  console.log("response3", response3.content);
}

ReadfileSystemDemo();
