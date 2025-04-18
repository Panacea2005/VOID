import { NextApiRequest, NextApiResponse } from 'next';
import { testPinataConnection } from '@/lib/services/pinataHelper';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        // Kiểm tra các biến môi trường quan trọng
        const envStatus = {
            pinata: {
                api_key: !!process.env.NEXT_PUBLIC_PINATA_API_KEY,
                secret_key: !!process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
                api_key_value: process.env.NEXT_PUBLIC_PINATA_API_KEY?.substring(0, 5) + '...',
                connection: await testPinataConnection()
            },
            solana: {
                network: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
                rpc_host: process.env.NEXT_PUBLIC_SOLANA_RPC_HOST
            }
        };

        res.status(200).json({
            success: true,
            message: 'Environment variables checked successfully',
            data: envStatus
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: `Error checking environment variables: ${error.message}`,
            error: error.toString()
        });
    }
} 