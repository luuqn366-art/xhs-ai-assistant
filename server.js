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
app.use(express.static(__dirname));

/* =======================
   🧠 输入清洗
======================= */
function cleanInput(input) {
  if (!input) return "";
  input = input.trim();
  if (!input.replace(/\s/g, "")) return "";
  return input;
}

/* =======================
   🧠 JSON解析
======================= */
function safeParseJSON(text) {
  if (!text) return null;

  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json|```/g, "");

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

/* =======================
   🧠 兜底
======================= */
function fallbackResponse(input) {
  return {
    titles: ["旧设备记录"],
    content: input || "生成失败，请重试",
    tags: ["旧设备", "数码", "旧机工坊"],
    cover: "旧设备的时代记忆"
  };
}

/* =======================
   🧠 AI调用
======================= */
async function callAI(prompt, API_KEY) {
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

  if (!text) return null;

  return safeParseJSON(text);
}

/* =======================
   API
======================= */
app.post("/api/generate", async (req, res) => {
  try {
    let input = cleanInput(req.body.input);

    if (!input) {
      return res.status(400).json({ error: "invalid input" });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "missing API key" });
    }

    const prompt = `
用一个自然、轻松的语气，介绍这台旧设备当年给人的感觉。

不要写评测，不要写技术分析，不要写行业历史。

只围绕三点：
1. 外观特点
2. 使用体验
3. 当时为什么特别

要求：
- 像随口说
- 不夸张
- 不煽情
- 不总结升华
- 不讲技术原理
- 不讲行业发展

必须输出 JSON：

{
  "titles": [],
  "content": "",
  "tags": [],
  "cover": ""
}

设备：
${input}
`;

    let result = await callAI(prompt, API_KEY);

    if (!result) {
      result = fallbackResponse(input);
    }

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});
