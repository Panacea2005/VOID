import React from 'react';
import { motion } from 'framer-motion';

interface CubePreviewProps {
    colors: string[];
    size?: number;
    animate?: boolean;
}

const CubePreview: React.FC<CubePreviewProps> = ({
    colors,
    size = 100,
    animate = true
}) => {
    const cubeStyle = {
        width: size,
        height: size,
        transformStyle: 'preserve-3d' as 'preserve-3d',
        transform: 'rotateX(-20deg) rotateY(-20deg)'
    };

    const faceStyle = (color: string, transform: string) => ({
        position: 'absolute' as 'absolute',
        width: '100%',
        height: '100%',
        background: color,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transform
    });

    return (
        <motion.div
            style={cubeStyle}
            animate={animate ? {
                rotateX: [0, 360],
                rotateY: [0, 360]
            } : undefined}
            transition={animate ? {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
            } : undefined}
        >
            {/* Front face */}
            <div style={faceStyle(colors[0], `translateZ(${size / 2}px)`)} />

            {/* Back face */}
            <div style={faceStyle(colors[1], `translateZ(-${size / 2}px) rotateY(180deg)`)} />

            {/* Right face */}
            <div style={faceStyle(colors[2], `translateX(${size / 2}px) rotateY(90deg)`)} />

            {/* Left face */}
            <div style={faceStyle(colors[3] || colors[2], `translateX(-${size / 2}px) rotateY(-90deg)`)} />

            {/* Top face */}
            <div style={faceStyle(colors[4] || colors[0], `translateY(-${size / 2}px) rotateX(90deg)`)} />

            {/* Bottom face */}
            <div style={faceStyle(colors[5] || colors[1], `translateY(${size / 2}px) rotateX(-90deg)`)} />
        </motion.div>
    );
};

export default CubePreview; 