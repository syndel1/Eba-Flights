import crypto from "crypto"

// ─── Signature verification ───────────────────────────────────────────────────

export function verifySlackSignature(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(`v0:${timestamp}:${body}`)
  const expected = `v0=${hmac.digest("hex")}`
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// ─── Slack API helpers ────────────────────────────────────────────────────────

export async function slackGet(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`https://slack.com/api/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
  })
  return res.json()
}

export async function postSlackReply(channelId: string, threadTs: string, text: string, blocks?: unknown[]) {
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: channelId, thread_ts: threadTs, text, ...(blocks ? { blocks } : {}) }),
    })
  } catch {}
}

export async function addReaction(channelId: string, messageTs: string, emoji: string) {
  try {
    await fetch("https://slack.com/api/reactions.add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: channelId, timestamp: messageTs, name: emoji }),
    })
  } catch {}
}

export async function getSlackUserName(userId: string): Promise<string> {
  try {
    const data = await slackGet("users.info", { user: userId })
    return data.user?.real_name || data.user?.name || userId
  } catch {
    return userId
  }
}

export async function getChannelName(channelId: string): Promise<string> {
  try {
    const data = await slackGet("conversations.info", { channel: channelId })
    return `#${data.channel?.name ?? "travel"}`
  } catch {
    return "#travel"
  }
}

export async function getThreadHistory(channelId: string, threadTs: string) {
  try {
    const data = await slackGet("conversations.replies", {
      channel: channelId,
      ts: threadTs,
      limit: "10",
    })
    const messages: any[] = data.messages ?? []
    return messages
      .filter((m) => m.ts !== threadTs)
      .slice(-8)
      .map((m) => ({
        role: (m.bot_id ? "assistant" : "user") as "user" | "assistant",
        content: m.text ?? "",
      }))
  } catch {
    return []
  }
}

export async function downloadSlackFile(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    })
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const mimeType = res.headers.get("content-type") ?? "image/jpeg"
    return { data: base64, mimeType }
  } catch {
    return null
  }
}

// ─── Interactive approval buttons ────────────────────────────────────────────

export function approvalBlocks(text: string, threadTs: string) {
  return [
    { type: "section", text: { type: "mrkdwn", text } },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View more details" },
          action_id: "view_details",
          value: threadTs,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Yes! Book it! ✅" },
          style: "primary",
          action_id: "approve_booking",
          value: threadTs,
        },
      ],
    },
  ]
}
