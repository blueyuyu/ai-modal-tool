import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
  HumanMessage,
  AIMessage,
  trimMessages,
} from "@langchain/core/messages";
import { getEncoding } from "js-tiktoken";

// ========== 1. 按消息数量截断 ==========

async function truncateByMessageCount() {
  const history = new InMemoryChatMessageHistory();
  const maxExample = 4;

  // 阶段四个样例

  const messages = [
    { type: "human", content: "我叫张三" },
    { type: "ai", content: "你好张三，很高兴认识你！" },
    { type: "human", content: "我今年25岁" },
    { type: "ai", content: "25岁正是青春年华，有什么我可以帮助你的吗？" },
    { type: "human", content: "我喜欢编程" },
    { type: "ai", content: "编程很有趣！你主要用什么语言？" },
    { type: "human", content: "我住在北京" },
    { type: "ai", content: "北京是个很棒的城市！" },
    { type: "human", content: "我的职业是软件工程师" },
    { type: "ai", content: "软件工程师是个很有前景的职业！" },
  ];

  // 数据输入 history

  messages.forEach(async (message) => {
    // 系统信息与ai 信息分开输入
    if (message.type === "human") {
      await history.addMessage(new HumanMessage(message.content));
    } else {
      await history.addMessage(new AIMessage(message.content));
    }
  });

  //   使用手动截断方法截断

  const allMessages = await history.getMessages();
  const truncatedMessages = allMessages.slice(-maxExample);
  console.log("truncatedMessages", truncatedMessages);
  console.log(`保留消息数量: ${truncatedMessages.length}`);
  console.log(
    "保留的消息:",
    truncatedMessages
      .map((m) => `${m.constructor.name}: ${m.content}`)
      .join("\n  ")
  );
}

// 计算消息数组的总 token 数量
function countTokens(messages, encoder) {
  let total = 0;
  for (const msg of messages) {
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);
    total += encoder.encode(content).length;
  }
  return total;
}
// 按照token 数量截断
async function truncateByTokenCount() {
  const history = new InMemoryChatMessageHistory();
  const maxToken = 1000;

  const enc = getEncoding("cl100k_base");

  const messages = [
    { type: "human", content: "我叫张三" },
    { type: "ai", content: "你好张三，很高兴认识你！" },
    { type: "human", content: "我今年25岁" },
    { type: "ai", content: "25岁正是青春年华，有什么我可以帮助你的吗？" },
    { type: "human", content: "我喜欢编程" },
    { type: "ai", content: "编程很有趣！你主要用什么语言？" },
  ];

  messages.forEach(async (message) => {
    if (message.type === "human") {
      await history.addMessage(new HumanMessage(message.content));
    } else {
      await history.addMessage(new AIMessage(message.content));
    }
  });

  const allMessages = await history.getMessages();

  console.log("allMessages", allMessages);
  // 使用 trimMessages API：使用 js-tiktoken 计算 token 数量
  const trimmedMessages = await trimMessages(allMessages, {
    maxTokens: maxToken,
    tokenCounter: async (msgs) => countTokens(msgs, enc),
    strategy: "last",
  });
  console.log("trimmedMessages", trimmedMessages);

  // 计算实际 token 数用于显示
  const totalTokens = countTokens(trimmedMessages, enc);

  console.log(`总 token 数: ${totalTokens}/${maxToken}`);
  console.log(`保留消息数量: ${trimmedMessages.length}`);
  console.log(
    "保留的消息:",
    trimmedMessages
      .map((m) => {
        const content =
          typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        const tokens = enc.encode(content).length;
        return `${m.constructor.name} (${tokens} tokens): ${content}`;
      })
      .join("\n  ")
  );
}

truncateByMessageCount();
truncateByTokenCount();
