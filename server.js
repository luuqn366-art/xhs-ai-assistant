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

写作规则：

必须包含：
1. 外观或设计特点
2. 使用时的真实感受（手感 / 操作 / 体验）
3. 当时为什么特别（用户视角，不讲技术史）

风格要求：
- 像随口说，不像写作文
- 不煽情
- 不总结人生
- 不讲技术原理
- 不讲行业发展
- 不要营销词（神机 / 传奇 / 封神 / 倔强）

目标：
读者看完是：
“原来当年是这种感觉。”

------------------------------------------------

输出必须是 JSON：

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
