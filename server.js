import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   防止 Render 空跑 / 崩溃
========================= */
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});

/* =========================
   健康检查接口
========================= */
app.get("/", (req, res) => {
  res.send("XHS AI Assistant is running");
});

/* =========================
   AI生成接口
========================= */
app.post("/api/generate", async (req, res) => {
  try {
    const input = req.body.input;

    if (!input) {
      return res.status(400).json({
        error: "input is required"
      });
    }

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({
        error: "DEEPSEEK_API_KEY not set"
      });
    }

    const prompt = `
你是《旧机博物馆》主理人，小红书数码博主。

严格要求：
- 只输出 JSON
- 不要任何解释
- 不要废话
- 不要 "---"
- 不要对话

输出格式：

{
  "titles": ["标题1","标题2","标题3"],
  "content": "分段正文，每段2-3行，有情绪、有回忆感",
  "tags": ["标签1","标签2","标签3","标签4","标签5","标签6","标签7","标签8","标签9","标签10"],
  "cover": "10字以内封面文案"
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
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
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

    let result;

    try {
      result = JSON.parse(text);
    } catch (err) {
      return res.json({
        error: "JSON parse failed",
        raw: text
      });
    }

    res.json(result);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

/* =========================
   启动服务（关键）
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});
