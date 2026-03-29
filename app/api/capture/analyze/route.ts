import { NextResponse } from "next/server"
import { z } from "zod"

import { getGeminiClient, getGeminiModel } from "@/lib/gemini"

const listSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})

const extractedTaskSchema = z.object({
  title: z.string().min(1).max(160),
  suggestedListId: z.string(),
  suggestedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  confidence: z.number().min(0).max(100),
})

function parseGeminiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      message: error.issues.map((issue) => issue.message).join(" "),
      status: 400,
    }
  }

  if (!(error instanceof Error)) {
    return {
      message: "Gemini could not process this image.",
      status: 500,
    }
  }

  try {
    const parsed = JSON.parse(error.message) as {
      error?: {
        code?: number
        message?: string
        status?: string
        details?: Array<{
          ["@type"]?: string
          retryDelay?: string
        }>
      }
    }
    const statusCode = parsed.error?.code ?? 500
    const retryDelay =
      parsed.error?.details?.find((detail) => detail["@type"]?.includes("RetryInfo"))?.retryDelay

    if (statusCode === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED") {
      return {
        message: retryDelay
          ? `Gemini free-tier quota is exhausted right now. Try again in about ${retryDelay.replace("s", " seconds")}.`
          : "Gemini free-tier quota is exhausted right now. Please wait and try again shortly.",
        status: 429,
      }
    }

    if (statusCode === 404) {
      return {
        message: `${parsed.error?.message ?? error.message} The configured Gemini model may not support image extraction with generateContent.`,
        status: 500,
      }
    }
  } catch {
    // Fall through to generic handling.
  }

  if (/model/i.test(error.message) && !/quota|resource_exhausted|429/i.test(error.message)) {
    return {
      message: `${error.message} The configured Gemini model may not support image extraction with generateContent.`,
      status: 500,
    }
  }

  return {
    message: error.message,
    status: 500,
  }
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const listsValue = formData.get("lists")
    const today = formData.get("today")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Add an image before analyzing." }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Use an image smaller than 10MB." }, { status: 400 })
    }

    if (typeof listsValue !== "string") {
      return NextResponse.json({ error: "Task lists are required for capture." }, { status: 400 })
    }

    const lists = z.array(listSchema).parse(JSON.parse(listsValue))
    const todayKey =
      typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)
        ? today
        : new Date().toISOString().slice(0, 10)

    const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64")
    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: [
        {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: [
            "Extract actionable tasks from this note image.",
            "Return concise tasks only. Ignore decorative text, headings, or incomplete fragments.",
            lists.length > 0
              ? `Use one of these list ids exactly: ${lists.map((list) => `${list.id} (${list.name})`).join(", ")}.`
              : 'There are no lists yet, so return an empty string for suggestedListId.',
            `Today is ${todayKey}. If the image implies today, tomorrow, or a specific date, convert it to YYYY-MM-DD; otherwise return null.`,
            "Confidence should be a number from 0 to 100.",
            "Return an empty array if no actionable tasks are visible.",
          ].join(" "),
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "array",
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              suggestedListId:
                lists.length > 0
                  ? {
                      type: "string",
                      enum: lists.map((list) => list.id),
                    }
                  : {
                      type: "string",
                    },
              suggestedDate: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 100,
              },
            },
            required: ["title", "suggestedListId", "suggestedDate", "confidence"],
          },
        },
      },
    })

    const parsedResponse = response.text?.trim() ? JSON.parse(response.text) : []
    const tasks = z
      .array(extractedTaskSchema)
      .parse(parsedResponse)
      .map((task) => ({
        ...task,
        title: task.title.trim(),
        confidence: Math.round(task.confidence),
        suggestedListId: lists.some((list) => list.id === task.suggestedListId)
          ? task.suggestedListId
          : lists[0]?.id ?? "",
      }))
      .filter((task) => task.title.length > 0)

    return NextResponse.json({ tasks })
  } catch (error) {
    const parsedError = parseGeminiError(error)
    return NextResponse.json(
      { error: parsedError.message },
      { status: parsedError.status }
    )
  }
}
