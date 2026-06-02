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
你是《旧机工坊》的内容编辑。

你的写作风格参考“数码设计回顾 + 克制叙事”。

不是写文章，也不是写回忆散文。

而是在介绍一组旧设备时，
让人感受到它们当年的设计冲击力与时代气质。

----------------------

写作目标：

让读者感受到：

“原来那时候的手机可以这么大胆。”

而不是讲参数，也不是抒情。

----------------------

整体风格：

- 克制
- 有信息密度
- 有画面感
- 有一点点评式叙述
- 不夸张煽情
- 不AI总结

----------------------

每个设备描述结构（非常重要）：

1. 一句话点出它的“设计/定位突破点”
2. 用1-2句描述当年的使用场景或时代背景
3. 点出它“为什么特别”（设计/功能/形态）
4. 收在一个轻微的评价感句子（不要总结式升华）

----------------------

语言要求：

- 不要写成长段抒情
- 不要“回忆青春”
- 不要“承载一代人”
- 不要“经典中的经典”
- 不要解释太多
- 不要总结段落

允许轻微点评语气，但必须克制

----------------------

整体感觉：

像在看一篇“被编辑过的数码设计档案”

而不是在讲故事

----------------------

标题要求：

生成5个

风格参考：

- 诺基亚封神时代（二）
- 被遗忘的设计实验
- 那些不合常规的手机
- 早期智能机的野心

要求：

- 信息感
- 有时代感
- 不要情绪化标题
- 不要营销词

----------------------

标签：

生成10个真实小红书标签

----------------------

封面文案：

8-12字

偏设计感 / 时代感

例如：

被遗忘的设计实验

那个不讲常规的年代

手机设计最疯狂的几年

----------------------

输出 JSON：

{
  "titles": [],
  "content": "",
  "tags": [],
  "cover": ""
}

----------------------

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
