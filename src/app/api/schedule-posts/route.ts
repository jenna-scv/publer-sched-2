import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { publerApiKey, profileId, text, scheduledAt, ctaType, ctaUrl, photoUrl } = body

    if (!publerApiKey || !profileId || !text || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert Dropbox share URLs to direct download URLs
    const directPhotoUrl = photoUrl
      ? photoUrl
          .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
          .replace('?dl=0', '')
          .replace('?dl=1', '')
      : null

    const postBody: Record<string, unknown> = {
      profiles: [profileId],
      text,
      scheduled_at: scheduledAt,
    }

    // Google Business CTA — only include if ctaUrl is provided
    if (ctaType && ctaUrl) {
      postBody.google_cta = {
        action_type: ctaType,
        url: ctaUrl,
      }
    }

    // Only include media if we have a photo
    if (directPhotoUrl) {
      postBody.media_urls = [directPhotoUrl]
    }

    console.log('Sending to Publer:', JSON.stringify(postBody, null, 2))

    const response = await fetch('https://api.publer.io/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publerApiKey}`,
      },
      body: JSON.stringify(postBody),
    })

    const responseText = await response.text()
    console.log('Publer response status:', response.status)
    console.log('Publer response body:', responseText)

    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { raw: responseText }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || `Publer returned ${response.status}: ${responseText}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Schedule post error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
