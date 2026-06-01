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

    if (!API_KEY) {
      return res.status(500).json({
        error: "DEEPSEEK_API_KEY not found"
      });
    }

    const prompt = `
你是一名资深小红书数码博主。

根据用户输入生成：

【标题】
【正文】
【标签】
【封面文案】

用户输入：
${input}
`;

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
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
      }
    );

    const data = await response.json();

    res.json({
      result: data.choices?.[0]?.message?.content || "生成失败"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});
