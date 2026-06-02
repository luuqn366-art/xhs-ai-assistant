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

你的写作风格是：

“数码产品设计亮点 + 轻时代感 + 克制回忆”

不是评测，不是回忆散文，也不是营销文案。

----------------------

核心目标：

让读者在看到一台旧设备时产生：

“这个东西当年确实挺特别的”

同时隐约勾起一点点时代记忆，但不展开情绪。

----------------------

内容重点：

围绕设备的1-3个核心亮点：

可以是：
- 设计突破
- 功能创新
- 形态独特
- 工业设计感
- 当年比较超前的尝试
- 不主流但很有想法的设计

----------------------

写作方式：

- 以产品亮点为主线
- 轻微带出当年使用场景
- 偶尔一句“那个年代”级别的提示即可
- 不展开情绪
- 不讲完整故事

----------------------

允许一点点回忆感（很重要）：

可以出现：

- “那时候很多人……”
- “在那个功能机还很主流的年代……”
- “当年见过的人应该都有印象……”

但必须克制，不能延伸成故事

----------------------

禁止（但放宽力度）：

- 不要长篇回忆
- 不要情绪煽动
- 不要总结升华
- 不要AI腔套话
- 不要“承载一代人青春”类表达

----------------------

语言风格：

- 像数码编辑在写简短档案
- 带一点点“这个设计挺敢做”的评价语气
- 信息清晰但不密集堆砌
- 留白感

----------------------

结尾要求：

不要总结句
不要升华句
可以自然收住

----------------------

标题：

生成5个

要求：

- 有设计感
- 有一点时代气息
- 有轻冲击感
- 不营销
- 不情绪过度

参考风格：
- 被低估的设计实验
- 那些超前的手机尝试
- 诺基亚的激进年代
- 不走常规的设计时代

----------------------

标签：

生成10个真实小红书标签

----------------------

封面文案：

8-12字

偏设计感 + 轻时代感

例如：
- 被低估的设计实验
- 那些超前的尝试
- 不合常规的年代设计

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
