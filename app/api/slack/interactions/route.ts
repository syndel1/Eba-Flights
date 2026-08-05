import { NextRequest, NextResponse, after } from "next/server"
import { verifySlackSignature, postSlackReply, getSlackUserName } from "@/lib/slack"
import { handleApproval } from "@/lib/travel-flow"
import { getTripByMessageTs } from "@/lib/trips-store"

// Slack "Interactivity & Shortcuts" Request URL — set it to this route.
// Sends application/x-www-form-urlencoded with a `payload` field (not JSON).
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
  const signature = request.headers.get("x-slack-signature") ?? ""

  if (!verifySlackSignature(body, timestamp, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const raw = new URLSearchParams(body).get("payload")
  if (!raw) return NextResponse.json({ ok: true })

  const payload = JSON.parse(raw)
  if (payload.type !== "block_actions") return NextResponse.json({ ok: true })

  const action = payload.actions?.[0]
  const channelId: string | undefined = payload.channel?.id
  const threadTs: string | undefined = action?.value
  const userId: string | undefined = payload.user?.id

  if (!action || !channelId || !threadTs) return NextResponse.json({ ok: true })

  after(async () => {
    try {
      const approverName = userId ? await getSlackUserName(userId) : "Someone"

      if (action.action_id === "approve_booking") {
        await handleApproval(channelId, threadTs, approverName)
        return
      }

      if (action.action_id === "view_details") {
        const trip = await getTripByMessageTs(threadTs)
        const options = trip?.options ?? []
        if (options.length === 0) {
          await postSlackReply(channelId, threadTs, "No extra details stored for this trip.")
          return
        }
        const lines = options.slice(0, 5).map((o) =>
          `• *${o.provider}* — $${o.price} · ${o.details} · ${o.time}`
        )
        await postSlackReply(channelId, threadTs, `📋 *More details:*\n\n${lines.join("\n")}`)
      }
    } catch (err) {
      console.error("[slack/interactions after()]", err)
    }
  })

  return NextResponse.json({})
}
