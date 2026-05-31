import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "sk-2691ac666b914bb6ba0dd69a4d6d38e6";

app.post("/api/generate", async (req, res) => {
  try {

    const input = req.body.input;

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
      result: data.choices[0].message.content
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
});

app.listen(3001, () => {
  console.log("server running on port 3001");
});