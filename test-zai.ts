import { ZAIProvider } from './src/providers/zai'

async function test() {
  const provider = new ZAIProvider({
    apiKey: process.env.ZAI_API_KEY
  })
  
  console.log("Testing ZAI provider...")
  console.log("Provider ID:", provider.id)
  
  const messages = [
    { role: "user" as const, content: "What is 2+2? Reply with just the number." }
  ]
  
  try {
    let response = ""
    for await (const chunk of provider.stream(messages, { model: "glm-5" })) {
      if (chunk.type === "text" && chunk.content) {
        process.stdout.write(chunk.content)
        response += chunk.content
      }
    }
    console.log("\n\nDone!")
  } catch (err: any) {
    console.error("Error:", err.message)
    console.error(err.stack)
  }
}

test()
