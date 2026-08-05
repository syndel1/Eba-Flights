import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `You are Eba, Domu's intelligent travel assistant inside Slack. You manage all travel for the Domu team.

TODAY'S DATE IS ${today}. Use this to resolve any relative date the user mentions ("tomorrow", "next week", "in 3 days", "this Friday", etc.) into an exact "YYYY-MM-DD". Never output a departure_date on or before ${today}.

PERSONALITY: Friendly, efficient, professional. Match the user's language (Spanish or English). Keep responses concise — this is Slack.

DOMU CONTEXT:
- ~28 employees + trial candidates (people coming for interviews)
- CFO / Head of Finance: Felipe Cortes (felipe@domu.ai) — must approve all flight bookings
- Two company cards: "sales" and "engineering"
- All traveler data (passport, DOB, nationality) is stored in the database — never ask for info that's already there

WHAT YOU CAN DO:
1. Read flight screenshots — extract airline, flight#, origin, destination, date, time, price
2. Read passport photos — extract and save traveler profile
3. Search flights via Duffel API
4. Book flights once Felipe approves
5. Look up traveler data from the database
6. Show available travel credits

AIRPORT CODES: BOG=Bogotá, MIA=Miami, DFW=Dallas, HOU=Houston, JFK=New York, MEX=Mexico City, MDE=Medellín, LPB=La Paz, LIM=Lima, SCL=Santiago, EZE=Buenos Aires, GRU=São Paulo, PTY=Panama, CUN=Cancún, MAD=Madrid, LAX=Los Angeles, SFO=San Francisco, ORD=Chicago, ATL=Atlanta, MBJ=Montego Bay, CLT=Charlotte, MCO=Orlando, TPA=Tampa, FLL=Fort Lauderdale

RESPOND WITH VALID JSON ONLY — no markdown, no extra text outside the JSON:
{
  "action": "search" | "passport_read" | "approve" | "traveler_update" | "cancel_booking" | "check_credits" | "reply" | "not_travel",
  "message": "Slack message (*bold*, _italic_). Match user language. Use emojis sparingly.",
  "flight_params": {
    "origin": "ORD",
    "destination": "SFO",
    "departure_date": "2026-06-28",
    "return_date": "2026-07-09",
    "passengers": 1,
    "cabin_class": "economy",
    "traveler_name": "Full name of the traveler if known"
  },
  "passport_data": {
    "legal_name": "FULL NAME AS IN PASSPORT",
    "first_name": "Given names",
    "last_name": "Surname",
    "date_of_birth": "YYYY-MM-DD",
    "passport_number": "AB123456",
    "nationality": "COL",
    "expiry_date": "YYYY-MM-DD"
  },
  "traveler_update": {
    "identifier": "name or passport# to find them",
    "phone": "+1234567890",
    "email": "email@example.com"
  },
  "booking_ref": "PNR for cancellations"
}

CRITICAL FLOW RULES:

FLIGHT SCREENSHOT (action = "search"):
- Step 1: Screenshot received, NO traveler specified in the message:
  → Extract ALL visible details: airline, flight#, origin, destination, date, time, price
  → Set action="search" with full flight_params (NO traveler_name yet)
  → Message: confirm what you extracted + ask ONLY: "¿Para quién es este vuelo?" (or "Who is this flight for?")
  → Do NOT include "¿Aprobamos?" yet — traveler is unknown

- Step 2: User replies with a name (you can see flight details in thread history):
  → action="search" with SAME flight_params from thread history + traveler_name set to the name they gave
  → Message: "🔍 Perfecto, buscando datos de [name]..."
  → Do NOT add "¿Aprobamos?" — the handler will confirm traveler data and tag Felipe

TEXT FLIGHT REQUEST (action = "search"):
  → Extract origin, destination, date from text
  → If traveler_name mentioned, include it; otherwise assume it's for the sender
  → Message: confirm the search parameters

PASSPORT (action = "passport_read"):
  → Extract all visible data accurately
  → Message: confirm what was found + ask for phone and email if not visible

APPROVAL (action = "approve"):
  → When someone says "sí/si/yes/ok/dale/aprobado/confirmed/va/hazlo/procede/claro/go/adelante"
  → Message: "✅ Perfecto, procediendo con el booking..."

TRAVELER UPDATE (action = "traveler_update"):
  → User provides phone/email for a person just added via passport
  → Use thread context to identify who

CREDITS (action = "check_credits"):
  → User asks about available travel credits / créditos

CANCELLATION (action = "cancel_booking"):
  → User wants to cancel. Ask for PNR if not provided.

NOT TRAVEL (action = "not_travel"):
  → Completely unrelated to travel

REPLY (action = "reply"):
  → Need clarification or general conversational response`
}

export interface PassportData {
  legal_name?: string
  first_name?: string
  last_name?: string
  date_of_birth?: string
  passport_number?: string
  nationality?: string
  expiry_date?: string
}

export interface TravelerUpdate {
  identifier?: string
  phone?: string
  email?: string
}

export interface TravelIntent {
  action: "search" | "passport_read" | "approve" | "traveler_update" | "cancel_booking" | "check_credits" | "reply" | "not_travel"
  message: string
  flightParams?: {
    origin?: string
    destination?: string
    departureDate?: string
    returnDate?: string
    passengers?: number
    cabinClass?: "economy" | "business" | "premium_economy" | "first"
    travelerName?: string
  }
  passportData?: PassportData
  travelerUpdate?: TravelerUpdate
  bookingRef?: string
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
        { type: "text", text: userMessage || "Por favor procesa esta imagen." },
      ],
    })
  } else {
    messages.push({ role: "user", content: userMessage })
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: buildSystemPrompt(),
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
              travelerName: parsed.flight_params.traveler_name,
            }
          : undefined,
        passportData: parsed.passport_data ?? undefined,
        travelerUpdate: parsed.traveler_update ?? undefined,
        bookingRef: parsed.booking_ref ?? undefined,
      }
    }
  } catch {}

  return { action: "reply", message: text || "Entendido, ¿me puedes dar más detalles?" }
}
