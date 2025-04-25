export class AIPixelService {
  static async generatePixelArt(
    prompt: string,
    canvasSize: number = 128
  ): Promise<Blob> {
    const apiKey = process.env.STABILITY_API_KEY
    if (!apiKey) {
      throw new Error('Stability API key is not configured')
    }

    const validSizes = [64, 128, 256, 512, 1024]
    if (!validSizes.includes(canvasSize)) {
      throw new Error('Invalid canvas size. Must be 64, 128, 256, 512, or 1024.')
    }

    const imageSize = canvasSize
    const enhancedPrompt = `${prompt}, pixel art, retro, 8-bit style, vibrant colors, detailed, ${canvasSize}x${canvasSize} resolution, sharp edges, clean palette`

    try {
      console.log('Sending request to Stability AI:', {
        prompt: enhancedPrompt,
        width: imageSize,
        height: imageSize,
      })

      const formData = new FormData()
      formData.append('prompt', enhancedPrompt)
      formData.append('output_format', 'png')
      formData.append('width', imageSize.toString())
      formData.append('height', imageSize.toString())
      formData.append('negative_prompt', 'blurry, low quality, distorted, extra pixels, oversaturated')
      formData.append('model', 'sd3.5-large')
      formData.append('cfg_scale', '4')
      formData.append('style_preset', 'pixel-art')
      formData.append('seed', '0')
      formData.append('stability-client-id', 'pixel-art-app')
      formData.append('stability-client-version', '1.0.0')

      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Stability API error: ${response.status} ${response.statusText} - ${errorData.message || errorData.errors?.join(', ') || 'Unknown error'}`)
      }

      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) {
        throw new Error('Received non-image response from API')
      }

      return blob
    } catch (error: any) {
      console.error('Error calling Stability API:', error)
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Authentication error. Please verify your API key and permissions.')
      }
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.message.includes('413')) {
        throw new Error('Request size exceeds 10MiB limit.')
      }
      throw new Error(`Failed to generate pixel art: ${error.message}`)
    }
  }
}