import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TONE_MAP: Record<string, string> = {
  professional: 'professional and trustworthy',
  friendly: 'friendly and warm',
  luxury: 'luxury and aspirational',
  community: 'community-focused and welcoming',
  urgent: 'urgent and promotional',
  educational: 'educational and helpful',
}

const CTA_LABEL_MAP: Record<string, string> = {
  BOOK: 'Book a tour',
  LEARN_MORE: 'Learn more',
  SIGN_UP: 'Sign up',
  ORDER_ONLINE: 'Order online',
  CALL: 'Call now',
  GET_OFFER: 'Get offer',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientName, location, description, promos, ctaType, tone, postCount, keywords } = body

    if (!clientName || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const keywordSection = keywords && keywords.length > 0
      ? `Target keywords to naturally weave into posts (do NOT force them awkwardly — use naturally): ${keywords.join(', ')}`
      : ''

    const prompt = `You are a Google Business Profile social media expert specializing in real estate and property management. Generate exactly ${postCount} unique, high-quality Google Business Posts for the following property.

Property: ${clientName}
Location: ${location || 'Not specified'}
Description: ${description}
Promotions / Special offers: ${promos || 'None'}
CTA button label: ${CTA_LABEL_MAP[ctaType] || ctaType}
Tone: ${TONE_MAP[tone] || tone}
${keywordSection}

Rules:
- Each post must be between 100–300 characters (Google's strict limit — count carefully)
- Vary the topics across posts: amenities highlights, lifestyle benefits, location perks, leasing specials, community atmosphere, seasonal content, resident experience
- Do NOT include hashtags
- Do NOT include URLs in the post body text (the CTA button handles the URL)
- Each post must feel distinct — no repeated phrases or structures
- If keywords are provided, use them naturally in the post text where they fit
- Write naturally for the specified tone
- End each post with a subtle, natural call to action aligned with the CTA button label

Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble. Format exactly:
[{"post":"Post text here."},{"post":"Another post here."}]`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
    const clean = raw.replace(/```json|```/g, '').trim()
    const posts = JSON.parse(clean)

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Generate posts error:', err)
    return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 })
  }
}
