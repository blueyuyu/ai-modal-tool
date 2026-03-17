import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import mysql from "mysql2/promise";

// 初始化模型
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 定义单个好友信息的 zod schema，匹配 friends 表结构
const friendSchema = z.object({
  name: z.string().describe("姓名"),
  gender: z.string().describe("性别（男/女）"),
  birth_date: z
    .string()
    .describe("出生日期，格式：YYYY-MM-DD，如果无法确定具体日期，根据年龄估算"),
  company: z.string().nullable().describe("公司名称，如果没有则返回 null"),
  title: z.string().nullable().describe("职位/头衔，如果没有则返回 null"),
  phone: z.string().nullable().describe("手机号，如果没有则返回 null"),
  wechat: z.string().nullable().describe("微信号，如果没有则返回 null"),
});

// 定义好友数组

const friendSchemaList = z.array(friendSchema).describe("好友列表");

// 使用 withStructuredOutput 方法

const structuredModel = await model.withStructuredOutput(friendSchemaList);

// 创建数据库连接配置
const connectionConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "123456",
  multipleStatements: true,
};

async function extractAndInsert(text) {
  // 连接数据库
  const connection = await mysql.createConnection(connectionConfig);
  // 切换数据库
  try {
    await connection.query(`USE hello;`);
    // 书写prompt，调用模型进行信息抽取
    const prompt = `请从以下文本中提取所有好友信息，文本中可能包含一个或多个人的信息。请将每个人的信息分别提取出来，返回一个数组。

${text}

要求：
1. 如果文本中包含多个人，请为每个人创建一个对象
2. 每个对象包含以下字段：
   - 姓名：提取文本中的人名
   - 性别：提取性别信息（男/女）
   - 出生日期：如果能找到具体日期最好，否则根据年龄描述估算（格式：YYYY-MM-DD）
   - 公司：提取公司名称
   - 职位：提取职位/头衔信息
   - 手机号：提取手机号码
   - 微信号：提取微信号
3. 如果某个字段在文本中找不到，请返回 null
4. 返回格式必须是一个数组，即使只有一个人也要放在数组中`;

    const friends = await structuredModel.invoke(prompt);
    console.log("抽取结果：", friends);
    // 批量插入数据库
    const insertSql = `INSERT INTO friends (
      name,
      gender,
      birth_date,
      company,
      title,
      phone,
      wechat
    ) VALUES ?;`;

    // 将好友信息转换为二维数组，准备批量插入 将对象数组 转化为 纯数组
    const values = friends.map((friend) => [
      friend.name,
      friend.gender || null,
      friend.birth_date || null,
      friend.company || null,
      friend.title || null,
      friend.phone || null,
      friend.wechat || null,
    ]);

    const [result] = await connection.query(insertSql, [values]);
    console.log("成功插入好友信息，插入ID：", result);
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  const sampleText = `我最近认识了几个新朋友。第一个是张总，女的，看起来30出头，在腾讯做技术总监，手机13800138000，微信是zhangzong2024。第二个是李工，男，大概28岁，在阿里云做架构师，电话15900159000，微信号lee_arch。还有一个是陈经理，女，35岁左右，在美团做产品经理，手机号是18800188000，微信chenpm2024。`;

  try {
    const result = await extractAndInsert(sampleText);
    console.log("处理完成--返回数据为：", result);
  } catch (error) {
    console.error("❌ 处理失败：", error.message);
    process.exit(1);
  }
}

main();
