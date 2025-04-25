// Place this file in your api directory, e.g., app/api/mint-pixel-art/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadToPinata } from '@/lib/services/pinataService';

export async function POST(req: NextRequest) {
  try {
    // Check if request is multipart form data
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    
    // Extract data from form
    const imageBlob = formData.get('image') as Blob;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const prompt = formData.get('prompt') as string;
    const canvasSizeStr = formData.get('canvasSize') as string;
    const canvasSize = canvasSizeStr ? parseInt(canvasSizeStr) : 128; // Default to 128
    const attributesJson = formData.get('attributes') as string;
    const attributes = attributesJson ? JSON.parse(attributesJson) : [];

    // Validate required fields
    if (!imageBlob || !name) {
      return NextResponse.json({ error: 'Missing required fields: image and name' }, { status: 400 });
    }

    // Convert blob to File
    const pixelArtFile = new File(
      [imageBlob], 
      `pixel-art-${Date.now()}.png`, 
      { type: imageBlob.type || 'image/png' }
    );

    // Upload to IPFS via Pinata
    console.log('Uploading pixel art to IPFS...');
    try {
      const ipfsHash = await uploadToPinata(pixelArtFile, {
        name,
        description,
        // Include pixel art metadata
        pixelArtParams: JSON.stringify({
          prompt,
          canvasSize,
          createdAt: new Date().toISOString()
        })
      });

      // Return success with IPFS hash
      return NextResponse.json({ 
        success: true, 
        ipfsHash,
        imageUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        name,
        description,
        prompt,
        canvasSize
      });
    } catch (pinataError: any) {
      console.error('Pinata upload failed:', pinataError);
      return NextResponse.json({ 
        error: `IPFS upload failed: ${pinataError.message || 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in mint-pixel-art API route:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}