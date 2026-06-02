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
   🧠 JSON安全解析
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
   🧠 兜底结构
======================= */
function fallbackResponse(rawText) {
  return {
    titles: ["旧设备记录"],
    content: rawText || "生成失败，请重试",
    tags: ["旧设备", "数码", "旧机工坊"],
    cover: "旧设备的时代记忆"
  };
}

/* =======================
   🧠 风格检测（关键新增）
======================= */
function styleCheck(text) {
  const badPatterns = [
    /技术/,
    /行业/,
    /分析/,
    /对比/,
    /领先/,
    /发展/,
    /历史/,
    /证明/,
    /传感器/,
    /CMOS/,
    /像素/,
    /卡片机/,
  ];

  let score = 0;

  for (const p of badPatterns) {
    if (p.test(text)) score++;
  }

  return score;
}

/* =======================
   🧠 自动修复 Prompt
======================= */
function rewritePrompt(input) {
  return `
请用更自然、更像真实用户的方式描述这台旧设备。

要求：
- 只说外观特点 + 使用感受
- 不要技术分析
- 不要行业评价
- 不要历史分析
- 不要总结升华

设备：${input}
`;
}

/* =======================
   🧠 AI调用封装（含重试）
======================= */
async function callAI(prompt, API_KEY, retry = 0) {
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

  const parsed = safeParseJSON(text);

  if (parsed) {
    // 风格检测
    const score = styleCheck(parsed.content || "");

    if (score >= 2 && retry < 1) {
      console.log("⚠️ style drift detected, retrying...");

      const newPrompt = rewritePrompt(prompt);
      return await callAI(newPrompt, API_KEY, retry + 1);
    }

    return parsed;
  }

  if (retry < 2) {
    console.log("🔁 retry JSON parsing...");
    return await callAI(prompt, API_KEY, retry + 1);
  }

  return null;
}

/* =======================
   API接口
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

重点只说三件事：

1. 最容易被记住的外观或设计特点
2. 当年实际使用时的感受（手感、操作、体验）
3. 放在那个年代，它为什么会显得有点特别

---

表达要求：

- 像一个用过的人在随口说
- 不要夸张
- 不要煽情
- 不要总结升华
- 不要“神机 / 传奇 / 倔强”这种词
- 不要讲技术原理
- 不要讲行业发展

---

判断标准：

读者看完应该是：

“哦，原来当年是这种感觉。”

而不是：

“它在技术上很厉害。”
${input}
`;

    let result = await callAI(prompt, API_KEY);

    if (!result) {
      console.log("⚠️ fallback triggered");
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
