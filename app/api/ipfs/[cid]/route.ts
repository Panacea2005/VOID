// app/api/ipfs/[cid]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Trusted IPFS gateways in priority order - reordered for better reliability
const IPFS_GATEWAYS = [
    'https://nftstorage.link/ipfs/',      // Often more reliable
    'https://cloudflare-ipfs.com/ipfs/',  // Good CDN performance 
    'https://dweb.link/ipfs/',            // Protocol Labs gateway
    'https://w3s.link/ipfs/',             // Web3.Storage gateway
    'https://ipfs.io/ipfs/',              // Standard gateway
    'https://gateway.pinata.cloud/ipfs/', // Pinata public gateway
    'https://ipfs.filebase.io/ipfs/',     // Filebase (which has been failing)
    'https://ipfs.4everland.io/ipfs/',
    'https://ipfs.eth.aragon.network/ipfs/',
    'https://hardbin.com/ipfs/',
];

// Pinata Gateway key and JWT token
const PINATA_GATEWAY_KEY = process.env.NEXT_PINATA_GATEWAY_TOKEN || '';
const PINATA_JWT = process.env.NEXT_PINATA_JWT || '';

// Default models for VOID Cube Collection - map texture to model
const VOID_CUBE_MODELS: Record<string, string> = {
    'default': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
    'nebula': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
    'glass': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
    'metal': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
    'pulse': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
    'holographic': 'https://modelviewer.dev/shared-assets/models/Cube.glb',
};

// Main handler for both path and query parameters
export async function GET(
    request: NextRequest,
    { params }: { params: { cid?: string } }
): Promise<NextResponse> {
    // Handle both direct cid parameter and URL parameter
    let cid = params.cid;
    const url = request.nextUrl.searchParams.get('url');
    
    // Get any texture parameter (for VOID Cube specific handling)
    const texture = request.nextUrl.searchParams.get('texture') || 'default';
    
    // If URL is provided directly
    if (url && !cid) {
        console.log(`Proxying direct URL: ${url}`);
        return await proxyDirectUrl(url);
    }

    if (!cid) {
        return NextResponse.json(
            { error: 'IPFS CID is required' },
            { status: 400 }
        );
    }

    // Handle special cases for default cube models
    if (cid === 'default-cube' || cid === 'default-model') {
        try {
            console.log(`Serving default cube model, texture: ${texture}`);
            
            // Check if we have a custom default model in public/models
            const fileName = texture === 'default' ? 'default-cube.glb' : `${texture}-cube.glb`;
            const publicPath = path.join(process.cwd(), 'public', 'models', fileName);
            
            // If we have a local model file, serve it
            if (fs.existsSync(publicPath)) {
                console.log(`Serving local model file: ${publicPath}`);
                const fileBuffer = fs.readFileSync(publicPath);
                return new NextResponse(fileBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'model/gltf-binary',
                        'Cache-Control': 'public, max-age=86400',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
            
            // If no local file, check our texture-to-model mapping
            if (VOID_CUBE_MODELS[texture]) {
                console.log(`Redirecting to specific model for texture: ${texture}`);
                return NextResponse.redirect(VOID_CUBE_MODELS[texture]);
            }

            if (cid.includes('Cube') || request.headers.get('referer')?.includes('cube')) {
                // Extract color from cid or use default
                let color = 'ff66cc'; // Default pink color
                let texture = 'default';
                let animation = 'none';
                
                // Get these from query params if provided
                color = request.nextUrl.searchParams.get('color') || color;
                texture = request.nextUrl.searchParams.get('texture') || texture;
                animation = request.nextUrl.searchParams.get('animation') || animation;
                
                console.log(`Generating procedural cube with: color=${color}, texture=${texture}, animation=${animation}`);
                
                // Redirect to our cube generator API
                return NextResponse.redirect(
                    new URL(`/api/cube/${color}?texture=${texture}&animation=${animation}`, request.url)
                );
            }
            
            // Final fallback to generic cube model
            console.log(`No specific model for texture ${texture}, using default cube`);
            return NextResponse.redirect('https://modelviewer.dev/shared-assets/models/Cube.glb');
        } catch (error) {
            console.error('Error serving default cube model:', error);
            // Fallback to a known public model
            return NextResponse.redirect('https://modelviewer.dev/shared-assets/models/Cube.glb');
        }
    }

    // Check for file extension to set content type later
    const hasFileExtension = /\.\w+$/.test(cid);
    const isGlb = cid.endsWith('.glb');
    
    // Clean cid if it has query parameters
    if (cid.includes('?')) {
        cid = cid.split('?')[0];
    }

    // If PINATA_GATEWAY_KEY exists, try Pinata first
    if (PINATA_GATEWAY_KEY) {
        try {
            const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`;
            console.log(`Trying Pinata authenticated gateway: ${pinataUrl}`);

            const headers: HeadersInit = {
                'User-Agent': 'VOID-NFT-App/1.0',
            };
            
            if (PINATA_JWT) {
                headers['Authorization'] = `Bearer ${PINATA_JWT}`;
            }

            const response = await fetch(pinataUrl, {
                method: 'GET',
                headers,
                cache: 'no-store',
            });

            if (response.ok) {
                const contentType = response.headers.get('Content-Type') || '';
                const data = await response.arrayBuffer();

                // Set appropriate content type based on file extension
                let finalContentType = contentType;
                if ((!contentType || contentType === 'application/octet-stream') && isGlb) {
                    finalContentType = 'model/gltf-binary';
                }

                return new NextResponse(data, {
                    status: 200,
                    headers: {
                        'Content-Type': finalContentType,
                        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        } catch (error) {
            console.error(`Error fetching from Pinata gateway for CID ${cid}:`, error);
            // Continue with other gateways
        }
    }

    // Try each gateway in parallel with a race condition
    const fetchPromises = IPFS_GATEWAYS.map(async (gateway) => {
        try {
            const url = `${gateway}${cid}`;
            console.log(`Trying IPFS gateway: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'VOID-NFT-App/1.0',
                },
                cache: 'no-store',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (response.ok) {
                return { response, url };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching from gateway ${gateway} for CID ${cid}:`, error);
            return null;
        }
    });

    // Wait for the first successful response
    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            try {
                const { response, url } = result.value;
                console.log(`Successfully fetched from ${url}`);

                const contentType = response.headers.get('Content-Type') || '';
                const data = await response.arrayBuffer();

                // Set appropriate content type based on file extension
                let finalContentType = contentType;
                if ((!contentType || contentType === 'application/octet-stream') && isGlb) {
                    finalContentType = 'model/gltf-binary';
                }

                return new NextResponse(data, {
                    status: 200,
                    headers: {
                        'Content-Type': finalContentType,
                        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } catch (error) {
                console.error(`Error processing response from gateway for CID ${cid}:`, error);
                // Continue with the next result
            }
        }
    }

    if (isGlb || cid.includes('Cube') || cid.includes('cube') || cid.includes('VOID') || request.headers.get('referer')?.includes('cube')) {
        // Extract color, texture and animation if provided as query parameters
        const color = request.nextUrl.searchParams.get('color') || 'ff66cc'; // Default pink
        const texture = request.nextUrl.searchParams.get('texture') || 'default';
        const animation = request.nextUrl.searchParams.get('animation') || 'none';
        
        console.log(`Cube model not found, redirecting to dynamic cube generator: color=${color}, texture=${texture}, animation=${animation}`);
        
        // Redirect to our cube generator API
        return NextResponse.redirect(
            new URL(`/api/cube/${color}?texture=${texture}&animation=${animation}`, request.url)
        );
    }

    // If it's an image request for a VOID Cube, try to serve a placeholder
    if (cid.includes('VOID') || cid.includes('Cube') || request.headers.get('referer')?.includes('cube')) {
        console.log(`Potentially a VOID Cube image request, checking for placeholders`);
        
        // Check for placeholder images that match the CID pattern
        try {
            const publicPath = path.join(process.cwd(), 'public', 'placeholder-cubes', 'default.png');
            if (fs.existsSync(publicPath)) {
                console.log(`Serving placeholder cube image`);
                const fileBuffer = fs.readFileSync(publicPath);
                return new NextResponse(fileBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': 'image/png',
                        'Cache-Control': 'public, max-age=86400',
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        } catch (error) {
            console.error('Error checking for placeholder cube image:', error);
        }
    }

    // If all gateways fail, return 404
    return NextResponse.json(
        { error: `Content with CID ${cid} not found on any IPFS gateway` },
        { status: 404 }
    );
}

// Helper function to proxy any direct URL
async function proxyDirectUrl(url: string) {
    if (!url) {
        return NextResponse.json(
            { error: 'URL parameter is required' },
            { status: 400 }
        );
    }

    try {
        console.log(`Proxying direct URL: ${url}`);
        
        // Check if it's an IPFS URL in different format
        if (url.includes('/ipfs/')) {
            const cid = url.split('/ipfs/')[1];
            return GET(
                new NextRequest(`/api/ipfs/${cid}`),
                { params: { cid } }
            );
        } else if (url.startsWith('ipfs://')) {
            const cid = url.replace('ipfs://', '');
            return GET(
                new NextRequest(`/api/ipfs/${cid}`),
                { params: { cid } }
            );
        }
        
        // For non-IPFS URLs
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'VOID-NFT-App/1.0',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch content from ${url}: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('Content-Type') || '';
        const data = await response.arrayBuffer();

        // Auto-detect content type for GLB files
        let finalContentType = contentType;
        if ((!contentType || contentType === 'application/octet-stream') && url.endsWith('.glb')) {
            finalContentType = 'model/gltf-binary';
        }

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': finalContentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 1 day
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error(`Error proxying URL ${url}:`, error);
        return NextResponse.json(
            { error: `Failed to proxy content from ${url}: ${error}` },
            { status: 500 }
        );
    }
}