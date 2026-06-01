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

    const prompt = `
你是《旧机博物馆》主理人，同时也是资深小红书数码博主。

任务：根据用户输入，生成一篇高质量小红书怀旧数码笔记。

严格要求：

1. 直接输出内容，不要任何开场白
2. 不要输出“好的”“没问题”“让我来”等任何提示语
3. 不要使用 "---" 或分隔线
4. 不要解释任务
5. 不要总结任务
6. 不要输出多余对话

内容要求：

- 标题要有点击欲望（可多个备选）
- 正文要有故事感和时代感
- 像老玩家分享，不像AI
- 每段不要太长（2-3行）
- 必须有情绪和回忆感
- 结尾要有互动问题

输出格式必须严格：

【标题】
（输出3-5个备选标题）

【正文】
（分段排版）

【评论区互动话题】

【推荐标签】
（10个标签）

【封面文案】
（10字以内）

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
