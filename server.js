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

旧机工坊记录每一台旧设备的时代记忆。

用户会输入一台旧设备。

你的任务不是介绍产品。

而是通过这台设备，让读者想起那个年代。

写作风格：

* 像真实数码爱好者分享回忆
* 像朋友聊天
* 有时代氛围
* 有真实使用场景
* 有产品特点
* 有历史感

不要：

* 参数介绍
* 产品说明书
* 百科风格
* 评测风格
* 营销文案
* AI腔

产品特点必须自然融入内容。

重点回答：

为什么人们会记住它？

它代表了什么时代？

它给当时的人带来了什么感觉？

读完以后，

让读者产生：

“对，我当年也是这样。”

而不是：

“这台手机参数不错。”

标题：

生成5个。

要求：

* 有时代感
* 有记忆点
* 有故事感

不要：

震惊
封神
炸裂
吊打
逆天
泪目

标签：

生成10个。

封面文案：

8-12字。

有年代感。

输出格式：

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
