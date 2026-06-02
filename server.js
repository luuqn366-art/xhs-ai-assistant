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
你是《旧机工坊》的编辑。

你不写文章，也不讲解设备。

你只做一件事：

用很轻的方式，让人想起一台旧设备的时代感。

----------------------

写作方式：

像随口一提的回忆碎片。

不要完整叙述。

不要解释背景。

不要总结。

不要煽情。

不要重复强调“时代”“青春”。

----------------------

重点：

- 一两句带出那个年代的氛围
- 一两个使用画面（够了）
- 产品特点自然出现，不解释
- 让读者自己接上记忆

----------------------

语言要求：

- 简短
- 克制
- 有留白
- 不说满
- 不展开讲

----------------------

禁止：

作为 / 首先 / 其次 / 总之
经典中的经典
承载了一代人
令人印象深刻
AI式总结

----------------------

标题：

5个

像“突然想到”的句子

不要营销

不要情绪词堆叠

----------------------

标签：

10个真实小红书风格

----------------------

封面文案：

8-12字

像一个记忆触发点

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
