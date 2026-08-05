import { NextRequest, NextResponse, after } from "next/server"
import { addTrip, StoredTrip } from "@/lib/trips-store"
import { parseTripDateToISO } from "@/lib/duffel"
import { analyzeMessage } from "@/lib/eba-ai"
import { saveTraveler, findTravelerByName, updateTravelerById } from "@/lib/travelers-store"
import {
  verifySlackSignature,
  postSlackReply,
  addReaction,
  getSlackUserName,
  getChannelName,
  getThreadHistory,
  downloadSlackFile,
  approvalBlocks,
} from "@/lib/slack"
import {
  getInitials,
  resolvePassenger,
  searchAndUpdateTrip,
  handleApproval,
  handleCheckCredits,
} from "@/lib/travel-flow"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
  const signature = request.headers.get("x-slack-signature") ?? ""

  if (!verifySlackSignature(body, timestamp, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = JSON.parse(body)

  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge })
  }

  if (payload.type !== "event_callback") {
    return NextResponse.json({ ok: true })
  }

  const event = payload.event
  const isFileShare = event?.subtype === "file_share"
  if (!event || (event.subtype && !isFileShare) || event.bot_id || event.hidden) {
    return NextResponse.json({ ok: true })
  }

  if (event.type !== "message") {
    return NextResponse.json({ ok: true })
  }

  const text: string = (event.text ?? "").trim()
  const channelId: string = event.channel
  const userId: string = event.user
  const messageTs: string = event.ts
  const threadTs: string = event.thread_ts ?? event.ts
  const isDM: boolean = event.channel_type === "im"
  const isMentioned: boolean = text.includes(`<@${payload.authorizations?.[0]?.user_id}>`)
  const isThreadReply: boolean = !!event.thread_ts && event.ts !== event.thread_ts
  const imageFile = event.files?.find((f: any) => f.mimetype?.startsWith("image/"))

  const shouldProcess = isDM || isMentioned || !event.thread_ts || isThreadReply
  if (!shouldProcess && !imageFile) return NextResponse.json({ ok: true })

  // Return 200 immediately — all processing in after() to prevent Slack retries
  after(async () => {
    // Immediate visual feedback — user sees ⚡ before Claude finishes
    await addReaction(channelId, messageTs, "zap")

    try {
      const [userName, channelName, threadHistory] = await Promise.all([
        getSlackUserName(userId),
        isDM ? Promise.resolve("DM") : getChannelName(channelId),
        event.thread_ts ? getThreadHistory(channelId, threadTs) : Promise.resolve([]),
      ])

      let imageData: { data: string; mimeType: string } | undefined
      if (imageFile?.url_private) {
        imageData = (await downloadSlackFile(imageFile.url_private)) ?? undefined
      }

      const intent = await analyzeMessage(text, threadHistory, imageData?.data, imageData?.mimeType)

      // ── Passport reading → save traveler ────────────────────────────────────
      if (intent.action === "passport_read") {
        const pd = intent.passportData
        if (pd?.legal_name) {
          await saveTraveler({
            legal_name: pd.legal_name,
            first_name: pd.first_name ?? pd.legal_name.split(" ")[0],
            last_name: pd.last_name ?? pd.legal_name.split(" ").slice(-1)[0],
            date_of_birth: pd.date_of_birth,
            passport_number: pd.passport_number,
            nationality: pd.nationality,
            expiry_date: pd.expiry_date,
            type: "trial",
          })
        }
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Traveler update (phone/email after passport) ─────────────────────────
      if (intent.action === "traveler_update" && intent.travelerUpdate?.identifier) {
        const tu = intent.travelerUpdate
        const traveler = await findTravelerByName(tu.identifier!)
        if (traveler?.id) {
          await updateTravelerById(traveler.id, {
            ...(tu.phone && { phone: tu.phone }),
            ...(tu.email && { email: tu.email }),
          })
        }
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Approval → search Duffel (if needed) → book ─────────────────────────
      if (intent.action === "approve" && isThreadReply) {
        await handleApproval(channelId, threadTs, userName)
        return
      }

      // ── Credits check ────────────────────────────────────────────────────────
      if (intent.action === "check_credits") {
        await handleCheckCredits(channelId, threadTs)
        return
      }

      // ── Cancellation ─────────────────────────────────────────────────────────
      if (intent.action === "cancel_booking") {
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Not travel → ignore in channels, answer in DMs ──────────────────────
      if (intent.action === "not_travel" && !isDM) return

      // ── Search: screenshot with no traveler → just ask "who is this for?" ────
      if (intent.action === "search" && imageFile && !intent.flightParams?.travelerName) {
        // Claude extracted flight details but doesn't know who it's for.
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Search: we have flight + traveler name → look up DB, confirm, tag for approval
      if (intent.action === "search" && intent.flightParams?.destination && intent.flightParams?.travelerName) {
        const fp = intent.flightParams
        const travelerName = fp.travelerName!
        const passenger = await resolvePassenger(travelerName, userId)

        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined) ?? ""

        const trip: StoredTrip = {
          id: `${messageTs}-${userId}`,
          slackMessageTs: messageTs,
          slackChannelId: channelId,
          slackUserId: userId,
          slackUserName: userName,
          quote: text || (imageFile ? "[flight screenshot]" : ""),
          channel: channelName,
          status: "awaiting",
          route: `${fp.origin ?? "?"} → ${fp.destination}`,
          dates: departureDate,
          travelers: [{ initials: getInitials(travelerName), name: travelerName }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)

        if (!passenger) {
          // Traveler not in DB — inform and ask for their passport
          await postSlackReply(channelId, threadTs,
            `⚠️ I couldn't find *${travelerName}* in the database.\n\nCan you send me a photo of their passport so I can create their profile?`
          )
          return
        }

        // Confirm traveler data + tag for approval
        const passportLine = passenger.passportNumber
          ? `📋 Passport: \`${passenger.passportNumber}\` · Expires: ${passenger.passportExpiry ?? "n/a"}\n`
          : ""
        const dobLine = `🎂 DOB: ${passenger.dateOfBirth}\n`

        const confirmText =
          `✅ *${passenger.firstName} ${passenger.lastName}* found in the database.\n${dobLine}${passportLine}\n` +
          `✈️ *${fp.origin ?? "?"} → ${fp.destination}* · ${departureDate}\n\n` +
          `Shall we book this flight? — *Syndel*`

        await postSlackReply(channelId, threadTs, confirmText, approvalBlocks(confirmText, threadTs))
        return
      }

      // ── Search: text request (no image, no traveler name = booking for sender) ─
      if (intent.action === "search" && intent.flightParams?.destination) {
        const fp = intent.flightParams
        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined) ?? ""
        const travelerDisplay = fp.travelerName ?? userName

        const trip: StoredTrip = {
          id: `${messageTs}-${userId}`,
          slackMessageTs: messageTs,
          slackChannelId: channelId,
          slackUserId: userId,
          slackUserName: userName,
          quote: text,
          channel: channelName,
          status: "searching",
          route: `${fp.origin ?? "?"} → ${fp.destination}`,
          dates: departureDate,
          travelers: [{ initials: getInitials(travelerDisplay), name: travelerDisplay }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)
        await postSlackReply(channelId, threadTs, intent.message)
        await searchAndUpdateTrip(
          trip, fp.origin, fp.destination!, departureDate,
          fp.passengers ?? 1, fp.cabinClass ?? "economy", channelId, threadTs
        )
        return
      }

      // ── Conversational reply ─────────────────────────────────────────────────
      await postSlackReply(channelId, threadTs, intent.message)

    } catch (err) {
      console.error("[slack/events after()]", err)
    }
  })

  return NextResponse.json({ ok: true })
}
