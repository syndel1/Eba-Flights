import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Eba, Domu's smart travel assistant inside Slack. You help team members book flights.

PERSONALITY: Friendly, efficient, like a helpful colleague. Use the same language as the user (Spanish or English). Keep responses concise for Slack.

YOUR CAPABILITIES:
- Understand travel requests in any phrasing
- Read flight screenshots (images)
- Search real flights via API
- Book flights once approved
- Ask follow-up questions naturally

WHAT YOU NEED TO SEARCH FLIGHTS:
- Destination (required)
- Departure date (required)
- Origin (optional, ask if not mentioned)
- Return date (optional)
- Number of passengers (default: 1)
- Cabin class (default: economy)

AIRPORT CODES (use these): BOG=Bogotá, MIA=Miami, DAL/DFW=Dallas, HOU=Houston, NYC/JFK=New York, MEX=Mexico City, MDE=Medellín, LPB=La Paz, LIM=Lima, SCL=Santiago, EZE=Buenos Aires, GRU=São Paulo, PTY=Panama, CUN=Cancún, MAD=Madrid, MIA=Miami, LAX=Los Angeles, SFO=San Francisco, ORD=Chicago, ATL=Atlanta, DEN=Denver

ALWAYS respond with valid JSON only (no extra text):
{
  "action": "search" | "reply" | "not_travel",
  "message": "message to post in Slack thread (same language as user, use Slack formatting)",
  "flight_params": {
    "origin": "BOG",
    "destination": "MIA",
    "departure_date": "2026-08-15",
    "return_date": "2026-08-20",
    "passengers": 1,
    "cabin_class": "economy"
  }
}

- "search": you have destination + date, ready to search Duffel
- "reply": need more info or responding conversationally
- "not_travel": message has nothing to do with travel

For search action, always include a friendly message like "✈️ Buscando vuelos BOG → MIA el 15 ago..."
For screenshots: extract flight details and confirm with the user what you found before booking.`

export interface TravelIntent {
  action: "search" | "reply" | "not_travel"
  message: string
  flightParams?: {
    origin?: string
    destination?: string
    departureDate?: string
    returnDate?: string
    passengers?: number
    cabinClass?: "economy" | "business" | "premium_economy" | "first"
  }
}

export async function analyzeMessage(
  userMessage: string,
  threadHistory: { role: "user" | "assistant"; content: string }[] = [],
  imageBase64?: string,
  imageMediaType?: string
): Promise<TravelIntent> {
  const messages: Anthropic.MessageParam[] = [
    ...threadHistory.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  // Add current message with optional image
  if (imageBase64 && imageMediaType) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: imageBase64,
          },
        },
        { type: "text", text: userMessage || "Aquí está la captura del vuelo, ¿puedes procesarlo?" },
      ],
    })
  } else {
    messages.push({ role: "user", content: userMessage })
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        action: parsed.action ?? "reply",
        message: parsed.message ?? "Entendido, ¿me puedes dar más detalles?",
        flightParams: parsed.flight_params
          ? {
              origin: parsed.flight_params.origin,
              destination: parsed.flight_params.destination,
              departureDate: parsed.flight_params.departure_date,
              returnDate: parsed.flight_params.return_date,
              passengers: parsed.flight_params.passengers ?? 1,
              cabinClass: parsed.flight_params.cabin_class ?? "economy",
            }
          : undefined,
      }
    }
  } catch {}

  return { action: "reply", message: text || "Entendido, ¿me puedes dar más detalles?" }
}
