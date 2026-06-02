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
   🧠 工具层：输入清洗
======================= */
function cleanInput(input) {
  if (!input) return "";

  // 去空格 + 去换行
  input = input.trim();

  // 防纯空格
  if (!input.replace(/\s/g, "")) return "";

  return input;
}

/* =======================
   🧠 工具层：JSON解析修复
======================= */
function safeParseJSON(text) {
  if (!text) return null;

  let cleaned = text.trim();

  // 去掉 markdown 包裹
  cleaned = cleaned.replace(/```json|```/g, "");

  // 提取 JSON
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

/* =======================
   🧠 兜底结构（永不崩）
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
   AI接口
======================= */
app.post("/api/generate", async (req, res) => {
  try {
    let input = cleanInput(req.body.input);

    // ① 输入校验
    if (!input) {
      return res.status(400).json({ error: "invalid input" });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "missing API key" });
    }

    const prompt = `
你是《旧机工坊》的内容编辑。

你的任务：介绍一台旧设备，让人理解它当年为什么“让人觉得特别”。

重点不是技术分析，也不是评测，更不是参数说明。

---

写作方式：

像一个用过这台设备的人，在简单回忆和描述它的特点。

---

内容只围绕三点展开（自然写，不要分点）：

1. 它最明显、最容易被记住的特点是什么（外观 / 设计 / 功能）
2. 当年实际使用时的感受（操作体验、手感、便利性）
3. 当时人们为什么会觉得它不一样（时代背景下的位置）

---

强制限制：

- 不要讲技术原理
- 不要讲行业分析
- 不要做参数对比
- 不要写“领先/落后/行业影响链”
- 不要写论文式解释

---

语言风格：

- 轻一点
- 自然一点
- 像在随口说
- 不要连续抒情
- 不要刻意煽情
- 不要青春文学

---

禁止词：

承载青春 / 泪目 / 自带BGM / 回忆杀 / 最靓的仔 / 时代眼泪

---

判断标准：

读者看完应该觉得：

“哦，原来它当年是这样用的。”

而不是：

“原来它在技术史上很重要。”

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
      return res.json({
        error: "empty response",
        raw: data
      });
    }

    /* =======================
       ② JSON修复层
    ======================= */
    let result = safeParseJSON(text);

    /* =======================
       ③ 兜底层（永不崩）
    ======================= */
    if (!result) {
      console.log("⚠️ JSON fallback triggered");
      result = fallbackResponse(text);
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
