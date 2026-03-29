import { NextResponse } from "next/server"
import { z } from "zod"

import { getGeminiClient, getGeminiModel } from "@/lib/gemini"

const payloadSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      completed: z.boolean(),
      priority: z.enum(["high", "medium", "low"]),
      dueDate: z.string().nullable(),
    })
  ),
  schedule: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(),
      type: z.string(),
    })
  ),
})

function buildFallbackInsight(payload: z.infer<typeof payloadSchema>) {
  const openTasks = payload.tasks.filter((task) => !task.completed)
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10))
  const nextBlock = payload.schedule[0]

  if (overdueTasks.length > 0) {
    return "Clear one overdue task before adding anything new today."
  }

  if (nextBlock?.type === "focus") {
    return "Protect your next focus block for the hardest open task."
  }

  if (openTasks.length > 0) {
    return "Finish one meaningful task before you reorganize the rest."
  }

  return "Use the quiet space to plan tomorrow before the day closes."
}

function isQuotaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  try {
    const parsed = JSON.parse(error.message) as {
      error?: {
        code?: number
        status?: string
      }
    }

    return parsed.error?.code === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED"
  } catch {
    return /quota|resource_exhausted|429/i.test(error.message)
  }
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json())
    const fallbackInsight = buildFallbackInsight(payload)

    if (
      payload.tasks.every((task) => task.completed)
      && payload.schedule.length === 0
    ) {
      return NextResponse.json({ insight: fallbackInsight })
    }

    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: [
        {
          text: [
            "Write one calm, human, actionable planning insight for today's dashboard.",
            "Keep it between 8 and 14 words.",
            "Do not use bullets, labels, quotation marks, or multiple sentences.",
            `Open tasks: ${payload.tasks.filter((task) => !task.completed).map((task) => `${task.title} (${task.priority})`).join("; ") || "none"}.`,
            `Upcoming schedule: ${payload.schedule.map((block) => `${block.startTime} ${block.title} [${block.type}]`).join("; ") || "none"}.`,
          ].join(" "),
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            insight: { type: "string" },
          },
          required: ["insight"],
        },
      },
    })

    const parsed = z
      .object({ insight: z.string().min(1).max(140) })
      .parse(JSON.parse(response.text ?? "{}"))

    return NextResponse.json({ insight: parsed.insight.trim() })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { insight: "Finish one meaningful task before you reorganize the rest." },
        { status: 400 }
      )
    }

    if (isQuotaError(error)) {
      return NextResponse.json(
        { insight: "AI quota is resting. Focus on your next task for now." },
        { status: 200 }
      )
    }

    return NextResponse.json({ insight: "Finish one meaningful task before you reorganize the rest." })
  }
}
