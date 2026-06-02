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
    const input = req.body.input || "";

const device = input;
const keyword = "";
const level = "中";

    if (!input) {
      return res.status(400).json({ error: "input is required" });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "missing API key" });
    }

   const prompt = `
假如你是一个小红书有50万粉丝的数码博主。

看到一台旧手机后，写一段自然的分享内容。

要求像真实博主发笔记，而不是AI生成内容。

内容需要包含：

1. 简单说一下这台手机最有特点的地方（设计/功能/外观即可，不要参数堆砌）
2. 描述一点使用它时的感受或印象（真实、具体、生活化）
3. 最后说说在那个年代，拥有这样一台手机意味着什么（地位/体验/时代感）

表达要求：

- 不要写成评测
- 不要说明书式介绍
- 不要分点写
- 不要刻意煽情
- 语气自然，像在发小红书

可以稍微有一点回忆感，但不要过度“怀旧文学”。

输出格式：

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
