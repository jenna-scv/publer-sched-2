import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'clients.json')

function ensureFile() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]')
}

export async function GET() {
  try {
    ensureFile()
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFile()
    const client = await req.json()
    const clients = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const existing = clients.findIndex((c: { id: string }) => c.id === client.id)
    if (existing >= 0) {
      clients[existing] = client
    } else {
      client.id = Date.now().toString()
      clients.push(client)
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2))
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureFile()
    const { id } = await req.json()
    const clients = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    const filtered = clients.filter((c: { id: string }) => c.id !== id)
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
