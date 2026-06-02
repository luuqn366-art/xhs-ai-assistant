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

// 前端静态托管
app.use(express.static(__dirname));

// =======================
// AI接口
// =======================
app.post("/api/generate", async (req, res) => {
  try {
    const input = req.body.input || "";

    if (!input) {
      return res.status(400).json({ error: "input is required" });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "missing API key" });
    }

    const prompt = `
你是《旧机工坊》的编辑。

你的任务是描述一台旧设备为什么值得被记住。

只输出严格 JSON，不要任何解释，不要代码块，不要多余文字。

输出格式必须是：

{
  "titles": ["..."],
  "content": "...",
  "tags": ["..."],
  "cover": "..."
}

写作要求：
- 特点 + 使用体验 + 历史位置
- 不要青春文学
- 不要参数说明
- 不要煽情词
- 不要总结口号

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
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      return res.json({ error: "empty response", raw: data });
    }

    // =======================
    // 🔥 安全解析 JSON（关键修复）
    // =======================
    let result;

    try {
      // 提取 JSON（避免模型乱加解释）
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        return res.json({
          error: "no json found",
          raw: text
        });
      }

      result = JSON.parse(match[0]);

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
