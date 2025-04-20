import { NextRequest, NextResponse } from 'next/server';

// Danh sách các gateway IPFS đáng tin cậy với thứ tự ưu tiên
const IPFS_GATEWAYS = [
    'https://ipfs.filebase.io/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://ipfs.4everland.io/ipfs/',
    'https://w3s.link/ipfs/',
    'https://ipfs.eth.aragon.network/ipfs/',
    'https://hardbin.com/ipfs/',
];

// Pinata Gateway key 
const PINATA_GATEWAY_KEY = process.env.PINATA_GATEWAY_KEY || '';

export async function GET(
    request: NextRequest,
    { params }: { params: { cid: string } }
) {
    const cid = params.cid;

    if (!cid) {
        return NextResponse.json(
            { error: 'IPFS CID is required' },
            { status: 400 }
        );
    }

    // Nếu có PINATA_GATEWAY_KEY, ưu tiên sử dụng Pinata Gateway
    if (PINATA_GATEWAY_KEY) {
        try {
            const pinataUrl = `https://gateway.pinata.cloud/ipfs/${cid}?pinataGatewayToken=${PINATA_GATEWAY_KEY}`;
            console.log(`Trying Pinata authenticated gateway: ${pinataUrl}`);

            const response = await fetch(pinataUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'VOID-NFT-App/1.0',
                },
                cache: 'no-store',
            });

            if (response.ok) {
                const contentType = response.headers.get('Content-Type') || '';
                const data = await response.arrayBuffer();

                return new NextResponse(data, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=86400', // Lưu cache 1 ngày
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        } catch (error) {
            console.error(`Error fetching from Pinata gateway for CID ${cid}:`, error);
            // Tiếp tục với các gateway khác
        }
    }

    // Thử từng gateway theo thứ tự cho đến khi tìm thấy một gateway hoạt động
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
                signal: AbortSignal.timeout(5000), // 5 giây timeout
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

    // Sử dụng Promise.race để nhận kết quả từ gateway đầu tiên thành công
    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            try {
                const { response, url } = result.value;
                console.log(`Successfully fetched from ${url}`);

                const contentType = response.headers.get('Content-Type') || '';
                const data = await response.arrayBuffer();

                return new NextResponse(data, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=86400', // Lưu cache 1 ngày
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            } catch (error) {
                console.error(`Error processing response from gateway for CID ${cid}:`, error);
                // Tiếp tục với kết quả tiếp theo
            }
        }
    }

    // Nếu tất cả các gateway đều không hoạt động, trả về 404
    return NextResponse.json(
        { error: `Content with CID ${cid} not found on any IPFS gateway` },
        { status: 404 }
    );
} 