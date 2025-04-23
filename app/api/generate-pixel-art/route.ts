import { NextResponse } from 'next/server'
import { AIPixelService } from '../../gacha/aiPixelService'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const canvasSize = Number(formData.get('canvasSize'))
    const mode = formData.get('mode') as 'text-to-image' | 'image-to-image'
    const image = formData.get('image') as File | null
    const strength = formData.get('strength') ? Number(formData.get('strength')) : undefined

    if (!prompt || isNaN(canvasSize)) {
      return NextResponse.json({ error: 'Invalid prompt or canvas size' }, { status: 400 })
    }
    if (mode === 'image-to-image' && (!image || strength === undefined)) {
      return NextResponse.json({ error: 'Image and strength are required for image-to-image mode' }, { status: 400 })
    }

    const blob = await AIPixelService.generatePixelArt(prompt, canvasSize, mode, image || undefined, strength)

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': blob.type,
        'Content-Length': blob.size.toString(),
      },
    })
  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate pixel art' }, { status: 500 })
  }
}