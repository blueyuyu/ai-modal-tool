// * 读文件
// * 写文件（包含创建目录了）
// * 读目录
// * 执行命令
import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

// 1. 读取文件工具
const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(
        `  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`
      );
      return `文件内容:\n${content}`;
    } catch (error) {
      console.log(
        `  [工具调用] read_file("${filePath}") - 错误: ${error.message}`
      );
      return `读取文件失败: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取指定路径的文件内容",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
    }),
  }
);

// 2. 写入文件工具
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      console.log(`  [工具调用] write_file("${filePath}") - 成功写入`);
      return `文件写入成功: ${filePath}`;
    } catch (error) {
      console.error(
        `  [工具调用] write_file("${filePath}") - 写入失败: ${error.message}`
      );
      return `文件写入失败: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "写入文件内容到指定路径，如果路径不存在则创建目录",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("文件内容"),
    }),
  }
);

// 3. 执行命令工具（带实时输出）
const executeCommandTool = tool(
  ({ workingDirectory, command }) => {
    // 执行命令
    const cwd = workingDirectory ? workingDirectory : process.cwd();
    console.log(
      `  [工具调用] execute_command("${command}") - 在 ${cwd} 目录下执行命令`
    );

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, { cwd, shell: true, stdio: "inherit" });

      child.on("error", (error) => {
        console.error(
          `  [工具调用] execute_command("${command}") - 执行失败: ${error.message}`
        );
        reject(error);
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log(`  [工具调用] execute_command("${command}") - 执行成功`);
          resolve(`命令执行成功，退出码: ${code}`);
        } else {
          reject(new Error(`命令执行失败，退出码: ${code}`));
        }
      });
    });
  },
  {
    name: "execute_command",
    description: "执行命令，并实时返回命令的输出结果",
    schema: z.object({
      command: z.string().describe("要执行的命令"),
      filePath: z.string().optional().describe("文件路径"),
    }),
  }
);

// 4. 列出目录内容工具
const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath);
      console.log(
        `  [工具调用] list_directory("${directoryPath}") - 成功列出 ${files.length} 个文件`
      );
      return `目录内容:\n${files.join("\n")}`;
    } catch (error) {
      console.error(
        `  [工具调用] list_directory("${directoryPath}") - 错误: ${error.message}`
      );
      return `无法列出目录内容: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出目录内容",
    schema: z.object({
      directoryPath: z.string().describe("要列出的目录路径"),
    }),
  }
);

export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };
