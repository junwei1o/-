// 一次性 smoke 测试：用真实 GROQ_API_KEY 调一次 Groq Chat Completions。
// 不进入项目代码，避免污染；只验证 key + 端点 + 中文能力。
// 注意：key 必须由环境变量 GROQ_API_KEY 注入；脚本不写死任何 key，
// 也不接受命令行参数传入，避免被 secret scanner 抓到。
import { ENV } from "../server/_core/env";
import { invokeLLM } from "../server/_core/llm";

if (!ENV.groqApiKey) {
  console.error("GROQ_API_KEY missing — set env var before running");
  process.exit(2);
}
console.log("[smoke] using groq key prefix:", ENV.groqApiKey.slice(0, 8) + "...");

const startedAt = Date.now();
const result = await invokeLLM({
  messages: [
    {
      role: "system",
      content: "你是台灣國小學習陪伴者，使用繁體中文，語氣溫和簡潔。",
    },
    {
      role: "user",
      content: "請用一句話鼓勵一個剛答錯數學題的國小三年級學生，不要責備。",
    },
  ],
  max_tokens: 200,
  responseFormat: { type: "json_schema", json_schema: {
    name: "smoke",
    strict: true,
    schema: {
      type: "object",
      properties: { line: { type: "string" } },
      required: ["line"],
      additionalProperties: false,
    },
  }},
});

const elapsed = Date.now() - startedAt;
console.log("[smoke] took", elapsed, "ms");
console.log("[smoke] model:", result.model);
console.log("[smoke] content:", result.choices[0]?.message.content);
console.log("[smoke] usage:", JSON.stringify(result.usage));