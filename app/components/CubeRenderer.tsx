import React, { useEffect, useRef } from 'react';

interface CubeRendererProps {
    colors: string[];
    size?: number;
    onRender?: (canvas: HTMLCanvasElement) => void;
}

const CubeRenderer: React.FC<CubeRendererProps> = ({
    colors,
    size = 800,
    onRender
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Thiết lập kích thước canvas
        canvas.width = size;
        canvas.height = size;

        // Xoá canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Vẽ nền
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Tính toán kích thước và vị trí của cube
        const cubeSize = size * 0.6;
        const centerX = size / 2;
        const centerY = size / 2;

        // Góc xoay mặc định để nhìn thấy 3 mặt của cube
        const angleX = Math.PI / 6; // 30 độ
        const angleY = -Math.PI / 4; // -45 độ

        // Định nghĩa các đỉnh của cube
        const vertices = [
            [-1, -1, -1], // 0: Back-bottom-left
            [1, -1, -1],  // 1: Back-bottom-right
            [1, 1, -1],   // 2: Back-top-right
            [-1, 1, -1],  // 3: Back-top-left
            [-1, -1, 1],  // 4: Front-bottom-left
            [1, -1, 1],   // 5: Front-bottom-right
            [1, 1, 1],    // 6: Front-top-right
            [-1, 1, 1]    // 7: Front-top-left
        ];

        // Định nghĩa các mặt của cube (đỉnh nào tạo thành mặt nào)
        const faces = [
            [0, 1, 2, 3], // Mặt sau
            [4, 5, 6, 7], // Mặt trước
            [0, 4, 7, 3], // Mặt trái
            [1, 5, 6, 2], // Mặt phải
            [3, 2, 6, 7], // Mặt trên
            [0, 1, 5, 4]  // Mặt dưới
        ];

        // Màu cho từng mặt
        const faceColors = colors.length >= 6
            ? colors
            : [...colors, ...Array(6 - colors.length).fill(colors[0])];

        // Hàm để xoay điểm trong không gian 3D
        const rotatePoint = (point: number[], angleX: number, angleY: number) => {
            const [x, y, z] = point;

            // Xoay quanh trục X
            const y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
            const z1 = y * Math.sin(angleX) + z * Math.cos(angleX);

            // Xoay quanh trục Y
            const x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
            const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

            return [x2, y1, z2];
        };

        // Chuyển đổi từ tọa độ 3D sang tọa độ 2D trên canvas
        const projectPoint = (point: number[]) => {
            const [x, y, z] = point;
            const scale = cubeSize / 2;
            return [
                centerX + x * scale,
                centerY + y * scale
            ];
        };

        // Vẽ cube
        const rotatedVertices = vertices.map(v => rotatePoint(v, angleX, angleY));

        // Tính độ sâu trung bình của từng mặt để vẽ theo thứ tự từ xa đến gần
        const faceDepths = faces.map((face, i) => {
            const avgZ = face.reduce((sum, vIndex) => sum + rotatedVertices[vIndex][2], 0) / face.length;
            return { index: i, depth: avgZ };
        });

        // Sắp xếp các mặt theo độ sâu (từ xa đến gần)
        faceDepths.sort((a, b) => a.depth - b.depth);

        // Vẽ từng mặt theo thứ tự đã sắp xếp
        faceDepths.forEach(({ index }) => {
            const face = faces[index];
            const color = faceColors[index];

            // Vẽ mặt
            ctx.beginPath();
            const firstPoint = projectPoint(rotatedVertices[face[0]]);
            ctx.moveTo(firstPoint[0], firstPoint[1]);

            for (let i = 1; i < face.length; i++) {
                const point = projectPoint(rotatedVertices[face[i]]);
                ctx.lineTo(point[0], point[1]);
            }

            ctx.closePath();

            // Tô màu cho mặt
            ctx.fillStyle = color;
            ctx.fill();

            // Viền cho mặt
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Thêm hiệu ứng ánh sáng/bóng
        ctx.globalCompositeOperation = 'overlay';
        const gradient = ctx.createRadialGradient(
            centerX - cubeSize / 4, centerY - cubeSize / 4, 0,
            centerX, centerY, cubeSize
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        // Thêm hiệu ứng glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors[0];
        ctx.lineWidth = 3;
        ctx.strokeRect(size / 2 - cubeSize / 2 - 10, size / 2 - cubeSize / 2 - 10,
            cubeSize + 20, cubeSize + 20);
        ctx.shadowBlur = 0;

        // Thêm watermark VOID
        ctx.font = `${size / 20}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.textAlign = 'center';
        ctx.fillText('VOID CUBE', centerX, size - 20);

        // Gọi callback sau khi render hoàn tất
        if (onRender) {
            onRender(canvas);
        }
    }, [colors, size, onRender]);

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
            }}
        />
    );
};

export default CubeRenderer; 