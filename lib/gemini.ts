import "server-only"

import { GoogleGenAI } from "@google/genai"

let geminiClient: GoogleGenAI | null = null

const MODEL_ALIASES: Record<string, string> = {
  "gemini-3.1-flash-live-preview": "gemini-3-flash-preview",
}

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY")
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey })
  }

  return geminiClient
}

export function getGeminiModel() {
  const configuredModel = process.env.GEMINI_MODEL?.trim()

  if (!configuredModel) {
    return "gemini-2.5-flash-lite"
  }

  return MODEL_ALIASES[configuredModel] ?? configuredModel
}
