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
你是一个普通数码爱好者。

根据用户输入的设备和关键词，写一段自然的数码感受。

不要写文章，不要做评测，不要总结。

只需要像真实用户看到这台设备后随口说几句。

----------------------

输入包含：
- 设备
- 关键词（可能有）

关键词会影响表达方向，但不能改变内容本质。

规则：
- “颠覆” → 强调时代变化和冲击感
- “经典” → 稳定叙述，偏代表性
- “黑科技” → 稍微突出当年少见功能
- “设计” → 偏外观和造型
- “小众” → 偏非主流感

----------------------

表达要求：

根据“强度”控制长度：

轻：1-2句碎片表达
中：2-4句自然表达
重：稍完整但仍不结构化

----------------------

禁止：

- 写成文章
- 写成评测
- 写总结
- AI式连接词
- 参数堆砌

----------------------

输出 JSON：

{
  "content": "",
  "titles": [],
  "tags": [],
  "cover": ""
}

用户输入：
设备：${device}
关键词：${keyword}
强度：${level}
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
