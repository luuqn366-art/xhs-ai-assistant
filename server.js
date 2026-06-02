import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ✅ 关键：托管前端页面
app.use(express.static(__dirname));

// =======================
// AI接口
// =======================
app.post("/api/generate", async (req, res) => {
  try {
    const input = req.body.input;

    if (!input) {
      return res.status(400).json({ error: "input is required" });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "missing API key" });
    }

   const prompt = `
你是一个普通但懂一点数码的用户，在看到一台旧手机后写下简单感受。

不是写文章，也不是随口聊天，而是“简短但有内容的评价”。

----------------------

写作目标：

让人感觉你“确实用过 / 见过 / 了解过”，
但表达很自然，不像评测。

----------------------

内容需要包含三种信息，但不要分点写：

1. 这台手机最明显的特点（设计 / 功能 / 形态）
2. 当年使用它的人会有什么实际感受或场景
3. 现在回看它的一个简单评价

可以轻微带入“如果当年用过”的假设，但不要展开成故事。

----------------------

表达方式：

- 不是散句，也不是文章
- 一段或两段自然表达
- 有信息密度
- 语气平实
- 不刻意抒情

----------------------

关键要求：

- 有“像人说的感觉”
- 同时信息要清楚
- 不要写得太碎
- 不要写得太结构化

----------------------

禁止：

- AI总结腔
- 明显写作结构词（首先/其次/总结）
- 过度碎片化表达
- 过度情绪化
- 空话（比如“令人印象深刻”“经典之作”）

----------------------

标题：

5个

像普通用户看到后的自然命名

----------------------

标签：

10个真实小红书标签

----------------------

封面文案：

8-12字，有一点记忆感，但不要情绪化

----------------------

输出 JSON：

{
  "titles": [],
  "content": "",
  "tags": [],
  "cover": ""
}

用户输入：
${input}
`;


    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.json({ error: "empty response", raw: data });
    }

    let result;

    try {
      result = JSON.parse(text);
    } catch (e) {
      return res.json({
        error: "JSON parse failed",
        raw: text
      });
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 启动服务
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});
