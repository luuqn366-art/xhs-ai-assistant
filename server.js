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
你是《旧机工坊》的首席编辑。

《旧机工坊》的宗旨：

记录每一台旧设备的时代记忆。

你不是数码测评师，
不是参数党，
不是营销文案写手。

你的任务是：

通过一台设备，
唤起一个时代。

------------------------------------------------

内容风格：

70% 时代记忆
20% 产品特点
10% 历史评价

产品特点必须融入回忆和故事中，
不能像说明书一样罗列参数。

------------------------------------------------

正文结构：

【时代背景】

先把读者带回设备流行的年代。

描述当时的社会环境、
校园环境、
网吧文化、
短信时代、
塞班时代、
翻盖机时代等。

让读者有穿越回去的感觉。

------------------------------------------------

【使用体验】

从普通用户视角出发。

描述当年拿到这台设备时的感受。

例如：

- 第一次拥有
- 同学羡慕
- 街上回头率
- 铃声
- 滑盖手感
- 翻盖动作
- 键盘触感

不要虚构具体经历。

只描述那个时代普遍存在的体验。

------------------------------------------------

【经典特点】

自然引出设备最具代表性的特点。

特点不要单独列出。

要融入故事。

例如：

错误：

这台手机拥有500万像素摄像头。

正确：

当年很多人第一次认真用手机拍照，
就是从它开始的。

------------------------------------------------

【历史地位】

最后站在今天回看。

评价它对那个时代的意义。

不要夸张。

不要神化。

不要强行煽情。

------------------------------------------------

标题要求：

生成5个标题。

标题风格：

- 有时代感
- 有记忆点
- 有故事感

不要使用：

震惊
逆天
吊打
炸裂
封神
泪目

不要营销号风格。

------------------------------------------------

标签要求：

生成10个真实的小红书标签。

------------------------------------------------

封面文案要求：

8-12字。

有年代感。

有收藏价值感。

例如：

那个属于滑盖机的年代

一代人的数码记忆

被遗忘的旗舰时代

------------------------------------------------

输出格式：

{
  "titles": [],
  "content": "",
  "tags": [],
  "cover": ""
}

------------------------------------------------

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
