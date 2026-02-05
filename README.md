# agent 开发项目

学习demo 记录,   node 最低版本最好是20以上 ，需要使用 谷歌自动化插件版本：  node v20.19.0

## mini-cursor 项目运行code

```
node ./src/mini-cursor.mjs
```

## mcp 功能学习

```
node .\src\langchain-mcp-test.mjs
```

## mcp 使用高德的MCP 与 google 的 ChromeDevTools 完成查询到页面跳转功能

```
node  .\src\mcp-test.mjs
```

## RAG -向量化文档

引入文档，来解决大模型的幻觉问题，让大模型的回答更有依据。

RAG 就是根据用户的 prompt，去知识库查询相关文档，加到 prompt 里给到大模型作为背景知识来回答。

**基于嵌入模型把文档向量化，存入向量数据**库*()*，查询的时候把 prompt 向量化，根据余弦相似度，来检索最相近的向量，然后把相关文档放到 prompt 里。

```
cd rag-test
node .\src\hello-rag.mjs

```

## 关于训练的知识来源解析

基于知识来源的多样性： 视频，博客， 文本 ，文档 ，ppt ， 公众号， 小红书 ，微博 等

我们要把这些知识抽取出来，变成 大模型能够理解的数据格式。 这就需要借助到 loader 来 进行转换。

loader 会把这些资料进行转化， 先是把资料用 Splitter 进行拆分， 拆成一个个小型文档之后， 再给嵌入模型做向量化处理。
