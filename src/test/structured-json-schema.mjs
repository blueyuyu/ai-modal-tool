import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// 定义数据库表的类型
const scientistSchema = z.object({
  name: z.string().describe("科学家名称"),
  gender: z.string().describe("性别（男/女）"),
  achievements: z.string().describe("主要成就"),
});

// 将zod schema转换为原生的 JSON Schema 格式

const jsonSchema = zodToJsonSchema(scientistSchema);

// 定义model

const model = new ChatOpenAI({
  apliKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  modelName: process.env.MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  modelKwargs: {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "people-info",
        schema: jsonSchema,
      },
    },
  },
});

// 定义测试方法

const testNativeJsonSchema = async () => {
  const res = await model.invoke([
    new SystemMessage("你是一个信息提取助手，请直接返回 JSON 数据。"),
    new HumanMessage("介绍一下杨振宁"),
  ]);

  console.log(chalk.green("模型返回结果："), res);

  const data = JSON.parse(res.content);
  console.log(chalk.cyan("\n📋 解析后的对象:"));
  console.log(data);
};

testNativeJsonSchema().catch(console.error);
