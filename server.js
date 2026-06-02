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

你的任务：用自然的方式介绍一台旧设备，让人理解它当年“为什么特别”。

你不是评测，也不是讲技术史的人。

---

写作方式：

像一个用过这台设备的人，在简单描述它的样子和使用感受。

---

只写三件事（自然融合，不分点）：

1. 最容易被记住的外观或设计特点
2. 当年真实使用时的操作感受
3. 它在当时“为什么显得不一样”（只讲用户感知，不讲技术分析）

---

强约束：

- 不允许讲技术原理
- 不允许讲行业发展或历史分析
- 不允许参数对比
- 不允许编故事场景（不能出现“朋友/聚会/评论”等情境）
- 不允许煽情或文学化表达

---

语言风格：

- 偏口语，但不随意
- 像随口说，不像写作文
- 不要总结升华
- 不要连续抒情

---

判断标准：

读者看完应该是：

“原来它当年是这样用的。”

而不是：

“这台设备在技术史上很重要。”

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
