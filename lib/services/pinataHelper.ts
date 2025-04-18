import axios from 'axios';

export async function testPinataConnection(): Promise<{
    success: boolean;
    message: string;
    hasApiKey: boolean;
    hasSecretKey: boolean;
}> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

        // Kiểm tra xem API key và Secret key có tồn tại không
        if (!apiKey || !secretKey) {
            return {
                success: false,
                message: 'Thiếu Pinata API key hoặc Secret key',
                hasApiKey: !!apiKey,
                hasSecretKey: !!secretKey
            };
        }

        // Thử gọi một API đơn giản của Pinata để kiểm tra kết nối
        const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers: {
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': secretKey
            }
        });

        if (response.status === 200) {
            return {
                success: true,
                message: 'Kết nối thành công đến Pinata API',
                hasApiKey: true,
                hasSecretKey: true
            };
        } else {
            return {
                success: false,
                message: `Kết nối thất bại: Status ${response.status}`,
                hasApiKey: true,
                hasSecretKey: true
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: `Lỗi kết nối: ${error.message || 'Không xác định'}`,
            hasApiKey: !!process.env.NEXT_PUBLIC_PINATA_API_KEY,
            hasSecretKey: !!process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
        };
    }
}

export async function getStoredPinList(): Promise<any[]> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
        const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

        if (!apiKey || !secretKey) {
            console.error('Thiếu Pinata API key hoặc Secret key');
            return [];
        }

        const response = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned', {
            headers: {
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': secretKey
            }
        });

        if (response.status === 200) {
            return response.data.rows || [];
        } else {
            console.error('Không thể lấy danh sách pin:', response.status);
            return [];
        }
    } catch (error: any) {
        console.error('Lỗi khi lấy danh sách pin:', error.message);
        return [];
    }
} 