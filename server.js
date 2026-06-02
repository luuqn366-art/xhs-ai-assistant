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
你是《旧机工坊》的内容编辑。

你的任务：介绍一台旧设备，让人理解它为什么在当年特别。

不要写评测，不要写怀旧散文，不要写参数说明书。

用“数码爱好者随口分享”的方式写。

---

内容结构（自然出现，不要分点）：

1. 先说它最有代表性的地方（外观 / 设计 / 功能）
2. 再说当年用起来是什么感觉（真实使用体验，不要编具体故事）
3. 最后轻轻带一句：放到当时，它为什么重要

---

表达要求：

- 句子不要太工整
- 可以偶尔有一点口语感
- 不要连续抒情
- 不要总结口号
- 不要“青春”“泪目”“回忆杀”等词

允许出现轻微不完美表达，但不要混乱。

---

判断标准：

读者看完应该是：

“原来它当年是这样的。”

而不是：

“这是一段故事/情绪。”

---

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
