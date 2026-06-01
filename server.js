import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// 让 Express 直接提供 index.html
app.use(express.static("."));

const API_KEY = process.env.DEEPSEEK_API_KEY;

// 首页
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// AI生成接口
app.post("/api/generate", async (req, res) => {
  try {
    const input = req.body.input;

    const prompt = `
你是《旧机博物馆》主理人，小红书爆款数码博主。

严格要求：
- 不要任何解释
- 不要开场白
- 不要废话
- 不要 "---"
- 必须只输出 JSON

输出格式必须严格如下：

{
  "titles": ["标题1","标题2","标题3"],
  "content": "正文（分段排版，2-3行一段）",
  "tags": ["标签1","标签2","标签3","标签4","标签5","标签6","标签7","标签8","标签9","标签10"],
  "cover": "10字以内封面文案"
}

内容要求：
- 怀旧数码风格
- 有情绪、有回忆
- 像老玩家分享，不像AI
- 避免百科感

用户输入：
${input}
`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    let resultText = data.choices?.[0]?.message?.content || "{}";

    // 防炸保护（防止模型不标准JSON）
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      return res.json({
        error: "JSON解析失败",
        raw: resultText
      });
    }

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
