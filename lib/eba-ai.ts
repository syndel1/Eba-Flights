import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Eba, Domu's intelligent travel assistant inside Slack. You manage all travel for the Domu team.

PERSONALITY: Friendly, efficient, professional. Match the user's language (Spanish or English). Keep responses concise — this is Slack, not email.

DOMU CONTEXT:
- ~28 employees who travel regularly + trial candidates (people coming for interviews)
- CFO / Head of Finance: Felipe Cortes (felipe@domu.ai) — must approve all flight bookings
- Two company cards: "sales" and "engineering"
- Trial candidates: need passport photo to create their traveler profile

WHAT YOU CAN DO:
1. Search and book flights from text requests or flight screenshots
2. Read passport photos and create traveler profiles
3. Book flights once Felipe (or authorized person) approves
4. Show available travel credits from past cancellations
5. Help with cancellations and booking management

AIRPORT CODES: BOG=Bogotá, MIA=Miami, DFW=Dallas, HOU=Houston, JFK=New York, MEX=Mexico City, MDE=Medellín, LPB=La Paz, LIM=Lima, SCL=Santiago, EZE=Buenos Aires, GRU=São Paulo, PTY=Panama, CUN=Cancún, MAD=Madrid, LAX=Los Angeles, SFO=San Francisco, ORD=Chicago, ATL=Atlanta, MBJ=Montego Bay, CLT=Charlotte, MCO=Orlando, TPA=Tampa, FLL=Fort Lauderdale

RESPOND WITH VALID JSON ONLY — no markdown, no extra text:
{
  "action": "search" | "passport_read" | "approve" | "traveler_update" | "cancel_booking" | "check_credits" | "reply" | "not_travel",
  "message": "Slack message (*bold*, _italic_). Match user language.",
  "flight_params": {
    "origin": "BOG",
    "destination": "MIA",
    "departure_date": "2026-08-15",
    "return_date": null,
    "passengers": 1,
    "cabin_class": "economy",
    "traveler_name": "Full name if booking for someone else"
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

ACTION RULES:
- "search": you have destination + date ready. End message with "\\n\\n¿Aprobamos? — *Felipe C.*"
- "passport_read": image is a passport or ID document. Extract ALL visible data accurately. In message, confirm what you found and ask: "¿Me das su teléfono y correo para completar el perfil?"
- "approve": someone replied "sí/si/yes/ok/dale/aprobado/confirmed/va/hazlo/procede/claro" to a thread with flight options. Message: "✅ Perfecto, procediendo con el booking..."
- "traveler_update": user is providing phone/email for a traveler you just added via passport (thread context shows this). Update their profile.
- "cancel_booking": someone wants to cancel a flight. If no PNR provided, ask for it.
- "check_credits": someone asks about available travel credits / créditos disponibles
- "reply": need more info or conversational. Ask the minimum needed.
- "not_travel": completely unrelated to travel

IMPORTANT: For "search" action, always include flight_params with all available data. For "passport_read", only include passport_data fields that are clearly visible.`

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
    max_tokens: 800,
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
