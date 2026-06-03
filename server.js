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
   🧠 JSON解析增强版（防 no json / parse fail）
======================= */
function safeParseJSON(text) {
  if (!text) return null;

  let cleaned = text
    .replace(/```json|```/g, "")
    .trim();

  // 优先抓 JSON 块
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

/* =======================
   🧠 兜底（永不崩）
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

    /* =======================
       🧠 风格约束（你现在最关键的部分）
    ======================= */
    const prompt = `
你是《旧机工坊》的内容编辑。

你的任务：用“真实用过的人随口说”的方式介绍旧设备。

不要写评测，不要写百科，不要写技术史。

------------------------------------------------

参考风格（非常重要）：

【示例1】
诺基亚N72最容易让人记住的不是配置，而是那种“精致感”。
黑色镜面 + 银色装饰，在当年很突出。

拿在手里按键很扎实，塞班系统虽然慢，但可以装主题、听歌、折腾。

它不像商务机，也不像便宜机，更像一个“有点品味的选择”。

------------------------------------------------

【示例2】
诺基亚N8第一眼还是那个蔡司镜头最明显。

金属机身很沉，手感很实。
系统不流畅，但拍照在当年很能打。

现在看它，不是参数厉害，而是它代表了诺基亚最后冲高端的一次尝试。

------------------------------------------------

你是《旧机工坊》的内容编辑。

你的任务是：用一个“真实用过旧设备的人”的口吻，简单聊聊这台设备当年的使用感觉。

不是写评测，不是写百科，不是写技术文章。

---

写作方式：

像随口说出来的，不需要刻意组织结构。

可以有一点点跳跃，但整体要自然。

---

内容重点（自然出现即可，不需要分点）：

1. 这台设备最容易被记住的外观或设计特点
2. 当年实际用起来的感觉（手感 / 操作 / 日常体验）
3. 放在当时，它为什么会让人觉得有点特别

---

表达风格：

- 像一个真的用过的人在聊天
- 可以轻微口语化
- 可以轻微总结，但不要升华
- 不要写成文章结构
- 不要刻意分段逻辑

---

严格避免：

- 技术分析
- 行业历史
- 参数讲解
- 评测口吻
- 文学化煽情
- 总结升华
- “承载青春 / 泪目 / 时代 / 传奇 / 神机”等词

---

允许出现：

- 一点点自然评价
- 一点点轻微总结
- 一点点当年使用感受

但必须克制，不要变成文章。

---

判断标准：

读完应该是：

“哦，原来当年用起来是这种感觉。”

而不是：

“这是一篇分析文章 / 技术文章 / 情绪文章。”

---

输出必须是 JSON：

{
  "titles": [],
  "content": "",
  "tags": [],
  "cover": ""
}

---

设备：

${input}
`;

    let result = await callAI(prompt, API_KEY);

    /* =======================
       🧠 兜底
    ======================= */
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
