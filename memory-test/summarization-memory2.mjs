import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  getBufferString,
} from "@langchain/core/messages";
import { getEncoding } from "js-tiktoken";

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
// ========== 总结策略演示（基于 token 计数） ==========
async function summarizationMemoryDemo() {
  const history = new InMemoryChatMessageHistory();
  const maxTokens = 200;
  const keepRecentTokens = 80; // 保留最近消息的 token 数量（约占总数的 40%）
  const encoder = getEncoding("cl100k_base");

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
  // 添加所有消息
  for (const msg of messages) {
    if (msg.type === "human") {
      await history.addMessage(new HumanMessage(msg.content));
    } else {
      await history.addMessage(new AIMessage(msg.content));
    }
  }

  let allMessages = await history.getMessages();
  const totalTokens = countTokens(allMessages, enc);

  // 如果 token 数超过阈值，触发总结
  if (totalTokens >= maxTokens) {
    // 从后往前累加消息，保留最近的消息直到达到 keepRecentTokens
    const recentMessages = [];
    let recentTokens = 0;

    for (let i = allMessages.length - 1; i >= 0; i--) {
      const msg = allMessages[i];
      const content =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);
      const msgTokens = enc.encode(content).length;

      if (recentTokens + msgTokens <= keepRecentTokens) {
        recentMessages.unshift(msg);
        recentTokens += msgTokens;
      } else {
        break;
      }
    }

    const messagesToSummarize = allMessages.slice(
      0,
      allMessages.length - recentMessages.length
    );
    const summarizeTokens = countTokens(messagesToSummarize, enc);

    console.log("\n💡 Token 数量超过阈值，开始总结...");
    console.log(
      `📝 将被总结的消息数量: ${messagesToSummarize.length} (${summarizeTokens} tokens)`
    );
    console.log(
      `📝 将被保留的消息数量: ${recentMessages.length} (${recentTokens} tokens)`
    );

    // 总结将被丢弃的旧消息
    const summary = await summarizeHistory(messagesToSummarize);

    // 清空历史消息，只保留最近的消息
    await history.clear();
    for (const msg of recentMessages) {
      await history.addMessage(msg);
    }
    console.log(`\n保留消息数量: ${recentMessages.length}`);
    console.log(
      "保留的消息:",
      recentMessages
        .map((m) => {
          const content =
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content);
          const tokens = enc.encode(content).length;
          return `${m.constructor.name} (${tokens} tokens): ${m.content}`;
        })
        .join("\n  ")
    );
    console.log(`\n总结内容（不包含保留的消息）: ${summary}`);
  } else {
    console.log(
      `\nToken 数量 (${totalTokens}) 未超过阈值 (${maxTokens})，无需总结`
    );
  }
}

summarizationMemoryDemo().catch(console.error);

// 总结历史对话的函数
async function summarizeHistory(messages) {
  if (messages.length === 0) return "";

  const conversationText = getBufferString(messages, {
    humanPrefix: "用户",
    aiPrefix: "助手",
  });

  const summaryPrompt = `请总结以下对话的核心内容，保留重要信息：
  
  ${conversationText}
  
  总结：`;

  const summaryResponse = await model.invoke([
    new SystemMessage(summaryPrompt),
  ]);
  return summaryResponse.content;
}
