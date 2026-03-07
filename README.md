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

demo1:  将掘金文章获取解析，将文章分割，变成向量， 并提问，让ai获取相似度最高的两个片段，依据此回答。

```
node .\src\loader-and-splitter.mjs
```

## 关于知识片段的切割方式

可以使用多种片段切割方式，但是使用最多的是 RecursiveCharacterTextSplitter 切割

其支持 MarkdownTextSpllitter 和 LatexTextSplitter 且可以按照代码语言对文本进行切割处理。

## Milvus 向量数据库

Milvus 里查询知识，是根据语义匹配的，你可以用自然语言来检索。

```
cd  /milvus/milvus-test
```

插入 Milvus 向量

```
node  node .\src\insert.mjs
```

安装 [https://github.com/zilliztech/attu/releases](https://github.com/zilliztech/attu/releases)     Attu 工具

对存储的向量数据，进行查询

```apache
node .\src\query.mjs
```

**MySQL 数据库只能根据 id、关键词去检索，涉及到语义检索的，我们都会存到 Milvus 里。**

**我们用 docker compose 跑了 Milvus 数据库，然后在 attu （GUI 工具） 和 node 代码里连上，并做了增删改查。**

**Milvus 分为 database、collection、entity 这三级，collection 要指定数据结构也就是 schema。**

**vector 向量字段需要做索引，用来快速检索。**

**我们把 Milvus 接入了 RAG 流程，实现了 AI 日记本的功能。可以根据自然语言去做语义检索，查出最相关的日记。**

把小说写入 Milvus 数据库, 需要把 docker 容器打开，然后开启 Attu 查看

```
node .\src\ebook-writer.mjs
```

这里需要花费大量token, 应该谨慎使用。

把数据分析进入数据库之后，再来 进行数据库查询。 这里要注意，先不换模型（没钱也不换模型，还是得充点钱，或者用别人的同平台模型）， 因为每一个模型 的 向量维度不一样， 且分析之后生成的数据，和查询的时候的向量维度一定要保持一致才能查到数据。

demo1:  让ai 阅读文本，写入milvus 向量数据库，再让ai 模型阅读回答。

```html
node .\src\ebook-reader-rag.mjs
```

## 关于Memory 的策略

memory 策略， 截断、总结、检索

将对话存储在文件内,实现持续对话的功能.

memory-test/     文件下

第一次对话

```
node .\history-test2.mjs
```

第二次对话

```
node .\history-test3.mjs
```
