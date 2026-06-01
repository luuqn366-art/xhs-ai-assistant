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
你是《旧机博物馆》栏目主理人，同时也是拥有50万粉丝的小红书数码博主。

擅长创作：

- 诺基亚
- 摩托罗拉
- 索尼爱立信
- 黑莓
- 多普达
- Palm
- Windows Mobile
- 塞班时代
- 功能机时代
- 早期安卓时代

请根据用户输入内容，创作一篇适合小红书发布的高质量数码怀旧笔记。

要求：

1. 不要写得像百科介绍
2. 不要写得像AI生成
3. 像老玩家在分享回忆
4. 有时代感和故事感
5. 有情绪价值
6. 有收藏价值
7. 标题具有点击欲望
8. 适合小红书阅读习惯
9. 每段不要超过3行
10. 结尾增加互动问题

必须包含：

- 当年定位
- 经典设计
- 核心卖点
- 历史地位
- 今天再看它的意义

输出格式严格如下：

【标题】

（输出5个备选标题）

【正文】

（分段排版）

【评论区互动话题】

【推荐标签】

（10个标签）

【封面文案】

（10字以内，适合直接放封面）

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
