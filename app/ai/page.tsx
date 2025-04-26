"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
} from "postprocessing";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  generateCubeSkin,
  adjustColorBrightness,
  generateProceduralTexture,
} from "../ai/aiService";
import { generateMusic, getMusicGenerationDetails } from "../ai/aiMusicService";
import { Connection } from "@solana/web3.js";
import {
  mockMintNFT,
  convertCubeToFile,
  mintRealNFT,
} from "@/lib/services/mockNftService";
import {
  getMusicNFTMetadata,
  getCubeNFTMetadata,
  mintNFT,
} from "@/lib/services/nftService";
import { useWallet } from "@solana/wallet-adapter-react";
import { convertGLBToFile } from "@/lib/services/modelExportService";

interface MaterialParams {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  displacementMap?: string;
  gradientColors?: string[];
  borderColor?: string;
  borderWidth?: number;
  transparent?: boolean;
  opacity?: number;
  bumpScale?: number;
  normalScale?: number;
  animateEmissive?: boolean;
  envMapIntensity?: number;
  iridescence?: number;
  showBorder?: boolean;
  texturePattern?: string;
  textureScale?: number;
  customEffects?: string[];
  sheen?: number;
  sheenColor?: string;
  clearcoat?: number;
  clearcoatRoughness?: number;
  anisotropy?: number;
  proceduralTexture?: string;
  animationType?: "none" | "pulse" | "flow" | "rotate";
  animationSpeed?: number;
  displacementScale?: number;
  transmission?: number;
  ior?: number;
  preview?: string;
  description?: string;
  secondaryColor?: string;
}

interface MusicGeneration {
  id: string;
  status: string;
  audio_url?: string;
  error?: string | null;
  style?: string;
}

export default function AIPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [cubePrompt, setCubePrompt] = useState("");
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicStyle, setMusicStyle] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [isGeneratingCube, setIsGeneratingCube] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [activeTab, setActiveTab] = useState("cube");
  const [materialParams, setMaterialParams] = useState<MaterialParams | null>(
    null
  );
  const [musicGeneration, setMusicGeneration] =
    useState<MusicGeneration | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const bloomEffectRef = useRef<BloomEffect | null>(null);
  const timeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [variantPreviews, setVariantPreviews] = useState<MaterialParams[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    publicKey,
    connected,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  } = useWallet();
  const [walletStatus, setWalletStatus] = useState<{
    exists: boolean;
    isConnected: boolean;
    publicKey: string | null;
  }>({
    exists: false,
    isConnected: false,
    publicKey: null,
  });

  // Floating particles component - add this near the top of your file
  const FloatingParticles = () => {
    interface Particle {
      id: string;
      width: number;
      height: number;
      backgroundColor: string;
      boxShadow: string;
      opacity: number;
      initialX: number;
      initialY: number;
      destinationX: number;
      destinationY: number;
    }

    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
      // Generate random particles after component mounts
      const generatedParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: `particle-${i}`,
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        backgroundColor:
          i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
        boxShadow: `0 0 ${Math.random() * 3 + 2}px ${
          i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"
        }`,
        opacity: Math.random() * 0.5 + 0.2,
        initialX: Math.random() * 100,
        initialY: Math.random() * 100,
        destinationX: Math.random() * 100,
        destinationY: Math.random() * 100,
      }));

      setParticles(generatedParticles);
    }, []);

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              backgroundColor: particle.backgroundColor,
              boxShadow: particle.boxShadow,
              opacity: particle.opacity,
            }}
            animate={{
              x: [particle.initialX + "vw", particle.destinationX + "vw"],
              y: [particle.initialY + "vh", particle.destinationY + "vh"],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
    );
  };

  // 3D Banner for Creator Page
  const Creator3DBanner = () => {
    // Use useRef instead of useState to prevent re-renders on mouse movement
    const mousePositionRef = useRef({ x: 0, y: 0 });

    // For tracking mouse movement
    useEffect(() => {
      const handleMouseMove = (e: { clientX: number; clientY: number }) => {
        // Calculate mouse position relative to the center of the viewport
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        mousePositionRef.current = { x, y };

        // Apply the transform directly using DOM methods instead of re-rendering
        const grid = document.querySelector(".creator-grid-3d") as HTMLElement;
        if (grid) {
          grid.style.transform = `rotateX(${y * 5}deg) rotateY(${-x * 5}deg)`;
        }
      };

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }, []);

    return (
      <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background gradient and particles */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black z-0"></div>

        {/* 3D rotating grid */}
        <motion.div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="creator-grid-3d w-full h-full grid grid-cols-12 grid-rows-12 gap-4"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {Array.from({ length: 144 }).map((_, i) => (
              <motion.div
                key={`grid-${i}`}
                className="border border-purple-500/30"
                style={{
                  translateZ: Math.sin(i * 0.1) * 20,
                }}
                animate={{
                  opacity: [0.1, i % 10 === 0 ? 0.5 : 0.2, 0.1],
                  borderColor: [
                    "rgba(168, 85, 247, 0.3)",
                    "rgba(236, 72, 153, 0.3)",
                    "rgba(168, 85, 247, 0.3)",
                  ],
                }}
                transition={{
                  duration: 4 + Math.random() * 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[100, 200, 300, 400].map((size, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute border border-purple-500/20 rounded-full"
              style={{
                width: size,
                height: size,
                borderRadius: "50%",
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                rotate: {
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 3 + i,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
                opacity: {
                  duration: 4 + i,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            />
          ))}
        </div>

        {/* Main title with parallax effect */}
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{
              textShadow: "0 0 30px rgba(168, 85, 247, 0.5)",
            }}
          >
            <PixelHeading
              text="CREATOR"
              className="text-8xl sm:text-9xl font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              animate
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative"
          >
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-lg"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <PixelHeading
              text="UNIQUE DIGITAL ASSETS"
              className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300 relative"
              animate
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-10 mb-12 font-light"
          >
            Create and mint custom 3D cubes or music with realistic textures and
            animations
          </motion.p>

          {/* Decorative elements */}
          <motion.div
            className="flex items-center justify-center gap-4 mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={`decoration-${i}`}
                className="w-3 h-3 bg-purple-500"
                animate={{
                  scale: [1, i % 2 === 0 ? 1.5 : 0.7, 1],
                  opacity: [0.5, 1, 0.5],
                  backgroundColor: ["#a855f7", "#ec4899", "#a855f7"],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2 font-pixel">
              SCROLL TO DISCOVER
            </p>
            <motion.div className="relative">
              <svg
                width="24"
                height="40"
                viewBox="0 0 24 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="40"
                  rx="12"
                  stroke="#a855f7"
                  strokeWidth="2"
                />
                <motion.rect
                  animate={{ y: [4, 28, 4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  x="8"
                  width="8"
                  height="8"
                  rx="4"
                  fill="#ec4899"
                />
              </svg>

              {/* Glow effect */}
              <motion.div
                className="absolute -inset-4 bg-purple-500 opacity-20 blur-xl rounded-full"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  };

  useEffect(() => {
    // Update wallet status whenever connection state changes
    setWalletStatus({
      exists: true, // The wallet adapter is always available when using useWallet()
      isConnected: connected,
      publicKey: publicKey?.toString() || null,
    });

    console.log("Wallet status updated:", {
      exists: true,
      isConnected: connected,
      publicKey: publicKey?.toString() || undefined,
    });
  }, [connected, publicKey]);

  useEffect(() => {
    console.log("Current isInstrumental state:", isInstrumental);
  }, [isInstrumental]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const hologramShader = {
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normal;
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 baseColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      // Cải tiến hàm nhiễu
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      
      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = p.x + p.y * 157.0 + 113.0 * p.z;
        return mix(
          mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
              mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
          mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
              mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
      }
      
      void main() {
        vec3 normal = normalize(vNormal);
        
        // Hiệu ứng Fresnel cải tiến - mạnh hơn tại các cạnh
        float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 3.0);
        
        // Hiệu ứng lớp trong suốt chuyển động - sóng chuyển động
        float waves = 0.1 * sin(vPosition.x * 10.0 + time * 2.0) * 
                     sin(vPosition.y * 10.0 + time * 1.7) * 
                     sin(vPosition.z * 10.0 + time * 1.5);
        
        // Hiệu ứng nhiễu động lớp trong
        float innerNoise = noise(vec3(vUv * 5.0, time * 0.5)) * 0.6;
        
        // Hiệu ứng quét - đường quét sáng
        float scanLine = 0.5 + 0.5 * sin(vPosition.y * 20.0 - time * 5.0);
        scanLine = pow(scanLine, 15.0) * 0.7;
        
        // Hiệu ứng cầu vồng phức tạp hơn
        vec3 rainbow = 0.5 + 0.5 * cos(12.0 * (vPosition.x + vPosition.y + vPosition.z + time) + vec3(0.0, 2.0, 4.0));
        
        // Màu tổng hợp - kết hợp tất cả hiệu ứng
        vec3 hologramColor = mix(baseColor * 1.8, rainbow, fresnel * 0.7 + waves);
        
        // Thêm hiệu ứng viền sáng lấp lánh
        float edgeGlow = pow(fresnel, 1.5) * (0.8 + 0.4 * sin(time * 3.0));
        hologramColor += edgeGlow * vec3(0.3, 0.7, 1.0) * 2.0;
        
        // Thêm đường quét sáng
        hologramColor += scanLine * vec3(0.5, 0.8, 1.0) * 3.0;
        
        // Thêm nhiễu động trong suốt
        hologramColor += innerNoise * vec3(0.2, 0.5, 1.0);
        
        // Tăng độ sáng cho thêm phần nổi bật
        hologramColor *= 1.5;
        
        // Tính toán độ trong suốt - viền ít trong suốt hơn (solid hơn)
        float alpha = 0.3 + fresnel * 0.5 + waves * 0.2 + scanLine * 0.3;
        alpha = min(alpha, 0.95); // Giới hạn độ trong suốt để vẫn nhìn thấy
        
        gl_FragColor = vec4(hologramColor, alpha);
      }
    `,
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color("#7dd3fc") },
    },
  };

  const gradientShader = {
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float opacity;
      varying vec3 vPosition;
      varying vec3 vNormal;
      void main() {
        float mixFactor = (vPosition.y + 0.5) * 0.5;
        vec3 color = mix(color1, color2, mixFactor);
        float lighting = max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0);
        color *= (0.5 + 0.5 * lighting);
        gl_FragColor = vec4(color, opacity);
      }
    `,
    uniforms: {
      color1: { value: new THREE.Color("#ffffff") },
      color2: { value: new THREE.Color("#000000") },
      opacity: { value: 1.0 },
    },
  };

  const flowShader = {
    vertexShader: `
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vPosition;
      varying vec2 vUv;
      
      // Hàm nhiễu Perlin cải tiến
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        // Tạo hiệu ứng chảy phức tạp hơn với nhiều lớp noise
        float flow1 = snoise(vec2(vUv.x * 3.0 + time * 0.5, vUv.y * 3.0));
        float flow2 = snoise(vec2(vUv.x * 5.0 - time * 0.3, vUv.y * 5.0 + time * 0.2));
        float combinedFlow = (flow1 + flow2) * 0.5;
        
        // Tạo hiệu ứng xoáy
        float swirl = snoise(vec2(
          vUv.x * 2.0 + sin(time * 0.5) * 0.5,
          vUv.y * 2.0 + cos(time * 0.5) * 0.5
        ));
        
        // Kết hợp các hiệu ứng
        float mixFactor = 0.5 + 0.5 * (combinedFlow + swirl * 0.3);
        
        // Tăng độ tương phản màu
        mixFactor = pow(mixFactor, 1.2);
        
        vec3 color = mix(color1 * 1.3, color2 * 1.3, mixFactor);
        
        // Thêm hiệu ứng phát sáng tại các vùng chuyển tiếp
        float glow = abs(mixFactor - 0.5) * 2.0;
        color += glow * 0.5 * mix(color2, color1, mixFactor);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color("#ffffff") },
      color2: { value: new THREE.Color("#000000") },
    },
  };

  // Hàm helper để tạo material từ params
  const createMaterialFromParams = (params: MaterialParams): THREE.Material => {
    if (params.texturePattern === "stripes") {
      const material = new THREE.MeshPhysicalMaterial({
        color: params.color || "#666666",
        metalness: params.metalness ?? 0.5,
        roughness: params.roughness ?? 0.5,
        emissive: params.emissive || "#000000",
        emissiveIntensity: params.emissiveIntensity ?? 0,
        transparent: params.transparent ?? false,
        opacity: params.opacity ?? 1.0,
        envMapIntensity: params.envMapIntensity ?? 0.5,
      });

      if (params.map) {
        const texture = new THREE.TextureLoader().load(params.map);
        texture.repeat.set(params.textureScale || 1, params.textureScale || 1);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material.map = texture;
      }
      return material;
    } else if (params.customEffects?.includes("hologram")) {
      return new THREE.ShaderMaterial({
        vertexShader: hologramShader.vertexShader,
        fragmentShader: hologramShader.fragmentShader,
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color(params.color || "#7dd3fc") },
        },
        transparent: true,
        opacity: params.opacity ?? 0.6,
      });
    } else if (params.animationType === "flow") {
      return new THREE.ShaderMaterial({
        vertexShader: flowShader.vertexShader,
        fragmentShader: flowShader.fragmentShader,
        uniforms: {
          ...flowShader.uniforms,
          color1: {
            value: new THREE.Color(
              params.gradientColors?.[0] || params.color || "#ffffff"
            ),
          },
          color2: {
            value: new THREE.Color(params.gradientColors?.[1] || "#000000"),
          },
        },
      });
    } else if (params.gradientColors && params.gradientColors.length >= 2) {
      return new THREE.ShaderMaterial({
        vertexShader: gradientShader.vertexShader,
        fragmentShader: gradientShader.fragmentShader,
        uniforms: {
          color1: { value: new THREE.Color(params.gradientColors[0]) },
          color2: { value: new THREE.Color(params.gradientColors[1]) },
          opacity: { value: params.opacity ?? 1.0 },
        },
        transparent: params.transparent ?? false,
      });
    } else {
      const material = new THREE.MeshPhysicalMaterial({
        color: params.color || "#666666",
        metalness: params.metalness ?? 0.5,
        roughness: params.roughness ?? 0.5,
        emissive: params.emissive || "#000000",
        emissiveIntensity: params.emissiveIntensity ?? 0,
        transparent: params.transparent ?? false,
        opacity: params.opacity ?? 1.0,
        envMapIntensity: params.envMapIntensity ?? 0.5,
        bumpScale: params.bumpScale ?? 0.0,
        normalScale: params.normalScale
          ? new THREE.Vector2(params.normalScale, params.normalScale)
          : new THREE.Vector2(1, 1),
        clearcoat: params.clearcoat ?? 0,
        clearcoatRoughness: params.clearcoatRoughness ?? 0.1,
        anisotropy: params.anisotropy ?? 0,
        displacementScale: params.displacementScale ?? 0,
        transmission: params.transmission ?? 0,
        sheen: params.sheen ?? 0,
        sheenColor: params.sheenColor
          ? new THREE.Color(params.sheenColor)
          : new THREE.Color("#ffffff"),
      });

      if (params.map) {
        const texture = new THREE.TextureLoader().load(params.map);
        texture.repeat.set(params.textureScale || 1, params.textureScale || 1);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material.map = texture;
      }

      if (params.displacementMap) {
        const texture = new THREE.TextureLoader().load(params.displacementMap);
        texture.repeat.set(params.textureScale || 1, params.textureScale || 1);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        material.displacementMap = texture;
        material.displacementScale = params.displacementScale || 0.1;
      }

      return material;
    }
  };

  const generateVariants = async () => {
    if (!cubePrompt.trim()) return;

    setIsGeneratingCube(true);

    try {
      const response = await generateCubeSkin({ prompt: cubePrompt });
      const baseParams = response.materialParams;

      // Tạo màu bổ sung từ màu cơ bản để tăng độ khác biệt
      const baseColor = baseParams.color || "#0000ff"; // Mặc định xanh dương nếu không xác định
      const complementaryColor = adjustColorBrightness(baseColor, -0.5); // Màu đối lập
      const brightColor = adjustColorBrightness(baseColor, 1.5); // Màu sáng hơn
      const darkColor = adjustColorBrightness(baseColor, 0.3); // Màu tối hơn

      // Cách tính màu bổ sung thực sự
      const rgbToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0,
          s,
          l = (max + min) / 2;

        if (max === min) {
          h = s = 0; // grayscale
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h /= 6;
        }

        return [h, s, l];
      };

      const hslToRgb = (h: number, s: number, l: number) => {
        let r, g, b;

        if (s === 0) {
          r = g = b = l; // grayscale
        } else {
          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
        }

        const toHex = (x: number) => {
          const hex = Math.round(x * 255).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      // Tính màu đối xứng
      const [h, s, l] = rgbToHsl(baseColor);
      const complementaryColorTrue = hslToRgb((h + 0.5) % 1, s, l);
      const analogousColor1 = hslToRgb((h + 0.1) % 1, s, l);
      const analogousColor2 = hslToRgb((h - 0.1 + 1) % 1, s, l);

      // Kiểm tra nếu prompt có từ "stripes" thì đảm bảo texture được áp dụng
      if (cubePrompt.toLowerCase().includes("stripes") && !baseParams.map) {
        const secondaryColor = cubePrompt
          .toLowerCase()
          .includes("white stripes")
          ? "#ffffff"
          : cubePrompt.toLowerCase().includes("black stripes")
          ? "#000000"
          : cubePrompt.toLowerCase().includes("red stripes")
          ? "#ff0000"
          : cubePrompt.toLowerCase().includes("gold stripes")
          ? "#ffcc00"
          : "#808080"; // Default gray stripes if no color specified

        baseParams.texturePattern = "stripes";
        baseParams.map = generateProceduralTexture("stripes", 1024, {
          // Tăng resolution texture
          color: baseParams.color,
          secondaryColor: secondaryColor,
        });

        // Ghi đè lên secondaryColor trong baseParams để các variants có thể sử dụng
        baseParams.secondaryColor = secondaryColor;
      }

      // Tạo các biến thể với sự khác biệt rõ ràng về texture và animation
      const variantsBase: MaterialParams[] = [
        // Biến thể 1: Crystal - Trong suốt với màu từ prompt
        {
          ...baseParams,
          roughness: 0.05, // Bề mặt cực nhẵn
          metalness: 0.1, // Chút kim loại cho phản chiếu
          transmission: 0.8, // Trong suốt
          ior: 1.8, // Chỉ số khúc xạ cao như pha lê
          clearcoat: 1.0, // Lớp phủ trong
          clearcoatRoughness: 0.05,
          opacity: 0.8,
          transparent: true,
          // Sử dụng màu từ prompt mạnh hơn
          color: adjustColorBrightness(baseColor, 1.3),
          gradientColors: [adjustColorBrightness(brightColor, 1.4), baseColor],
          // Tăng cường phát sáng
          emissive: adjustColorBrightness(brightColor, 1.5),
          emissiveIntensity: 0.6,
          animationType: "pulse",
          animateEmissive: true,
          envMapIntensity: 2.5,
          showBorder: true,
          borderColor: "#ffffff",
          borderWidth: 1,
          description: "Crystal",
        },

        // Biến thể 2: Metallic - Bề mặt kim loại sáng bóng
        {
          ...baseParams,
          gradientColors: [brightColor, baseColor],
          roughness: 0.05, // Bề mặt cực nhẵn
          metalness: 1.0, // Hoàn toàn kim loại
          clearcoat: 0.8, // Lớp phủ sáng
          anisotropy: 0.7, // Hiệu ứng kim loại đánh bóng theo hướng
          clearcoatRoughness: 0.1,
          emissive: brightColor,
          emissiveIntensity: 0.3,
          envMapIntensity: 2.2,
          showBorder: true,
          borderColor: brightColor,
          borderWidth: 1,
          description: "Chrome",
        },

        // Biến thể 3: Plasma - Phát sáng mạnh, hiệu ứng chảy plasma
        {
          ...baseParams,
          texturePattern: "plasma",
          map:
            baseParams.map ||
            generateProceduralTexture("plasma", 1024, { color: baseColor }),
          normalScale: 1.5,
          roughness: 0.4,
          metalness: 0.6,
          emissive: brightColor,
          emissiveIntensity: 2.5, // Tăng cường phát sáng
          textureScale: 2.0,
          animationType: "flow",
          animationSpeed: 0.08, // Tăng tốc độ animation
          showBorder: false,
          customEffects: ["energy"],
          description: "Plasma",
        },

        // Biến thể 4: Hologram - Cải tiến hoàn toàn
        {
          ...baseParams,
          customEffects: ["hologram"],
          transparent: true,
          opacity: 0.8,
          color: adjustColorBrightness(analogousColor1, 1.8), // Màu cơ bản sáng hơn
          gradientColors: [
            adjustColorBrightness(brightColor, 1.6),
            analogousColor1,
          ],
          roughness: 0.1,
          metalness: 0.9,
          emissive: adjustColorBrightness(brightColor, 2.0),
          emissiveIntensity: 3.0, // Tăng mạnh độ phát sáng
          animationType: "rotate",
          animationSpeed: 0.04, // Tốc độ xoay phù hợp hơn
          showBorder: true,
          borderColor: adjustColorBrightness(brightColor, 2.0), // Viền sáng hơn
          borderWidth: 1.5, // Viền đậm hơn
          description: "Hologram",
        },

        // Biến thể 5: Carbon Fiber - Cải tiến hoàn toàn
        {
          ...baseParams,
          texturePattern: "carbon",
          // Sử dụng màu cơ bản sáng hơn nhiều cho texture
          map:
            baseParams.map ||
            generateProceduralTexture("carbon", 1024, {
              color: adjustColorBrightness(darkColor, 2.2),
            }),
          // Tạo normal map mạnh hơn cho hiệu ứng 3D sâu hơn
          normalMap: generateProceduralTexture("carbon_normal", 1024, {
            color: adjustColorBrightness(darkColor, 1.8),
          }),
          // Tạo displacement map mạnh hơn
          displacementMap: generateProceduralTexture("carbon_disp", 1024, {
            color: adjustColorBrightness(baseColor, 1.4),
          }),
          displacementScale: 0.15, // Tăng độ nổi cao hơn
          roughness: 0.2, // Giảm roughness để bóng hơn
          metalness: 0.8, // Tăng metalness
          // Sử dụng màu emissive nổi bật hơn
          emissive: adjustColorBrightness(baseColor, 1.2),
          emissiveIntensity: 0.5, // Tăng cường độ phát sáng
          textureScale: 3.0, // Mẩu carbon nhỏ hơn, chi tiết hơn
          clearcoat: 1.5, // Tăng mạnh độ bóng của lớp phủ
          clearcoatRoughness: 0.1, // Làm mịn lớp phủ
          anisotropy: 0.3, // Thêm hiệu ứng anisotropic cho carbon
          animationType: "pulse", // Giữ hiệu ứng nhịp đập
          animationSpeed: 0.06, // Tốc độ phù hợp
          animateEmissive: true,
          envMapIntensity: 2.0, // Tăng mạnh phản xạ môi trường
          showBorder: true,
          borderColor: adjustColorBrightness(brightColor, 1.2), // Viền sáng
          borderWidth: 1.2, // Viền vừa phải
          description: "Carbon",
        },

        // Biến thể 6: Nebula - Hiệu ứng không gian màu sắc
        {
          ...baseParams,
          gradientColors: [analogousColor1, complementaryColorTrue],
          texturePattern: "nebula",
          map:
            baseParams.map ||
            generateProceduralTexture("nebula", 1024, { color: baseColor }),
          roughness: 0.4,
          metalness: 0.7,
          emissive: complementaryColorTrue,
          emissiveIntensity: 1.5, // Tăng cường phát sáng
          animationType: "pulse",
          animationSpeed: 0.08, // Tăng tốc độ nhịp
          animateEmissive: true,
          showBorder: true,
          borderColor: analogousColor2,
          borderWidth: 2,
          description: "Nebula",
        },
      ];

      // Đảm bảo rằng các khác biệt về rotation rõ ràng hơn
      const rotationSettings = [
        { x: 0.2, y: 0.4, z: 0 },
        { x: 0.5, y: 0.2, z: 0.1 },
        { x: 0.4, y: 0.6, z: 0 },
        { x: 0.3, y: 0.5, z: 0.2 },
        { x: 0.6, y: 0.3, z: 0.1 },
        { x: 0.4, y: 0.4, z: 0.1 },
      ];

      // Tạo previews cho từng biến thể với độ chi tiết cao
      const variants = await Promise.all(
        variantsBase.map(async (variant, index) => {
          // Tạo preview cho biến thể với canvas lớn hơn và hỗ trợ độ phân giải cao
          const previewCanvas = document.createElement("canvas");
          previewCanvas.width = 400; // Tăng kích thước để nét hơn
          previewCanvas.height = 400;
          const previewRenderer = new THREE.WebGLRenderer({
            canvas: previewCanvas,
            alpha: true,
            antialias: true,
            precision: "highp",
          });
          previewRenderer.setPixelRatio(2); // Tăng pixel ratio cho sắc nét
          previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
          previewRenderer.toneMappingExposure = 1.2;

          const previewScene = new THREE.Scene();
          // Thêm background gradient cho từng preview
          const colors = [
            ["#000000", "#1a0033"], // Crystal
            ["#000000", "#0d0d1a"], // Chrome
            ["#0a001a", "#1a0033"], // Plasma
            ["#000033", "#001a33"], // Hologram
            ["#0d0d0d", "#1a1a1a"], // Carbon
            ["#000022", "#1a0033"], // Nebula
          ];

          // Tạo background gradient bằng shader
          const bgGeometry = new THREE.PlaneGeometry(20, 20);
          const bgMaterial = new THREE.ShaderMaterial({
            vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
            fragmentShader: `
            uniform vec3 colorA;
            uniform vec3 colorB;
            varying vec2 vUv;
            void main() {
              vec3 color = mix(colorA, colorB, vUv.y);
              gl_FragColor = vec4(color, 1.0);
            }
          `,
            uniforms: {
              colorA: { value: new THREE.Color(colors[index][0]) },
              colorB: { value: new THREE.Color(colors[index][1]) },
            },
          });
          const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
          bgMesh.position.z = -10;
          previewScene.add(bgMesh);

          const previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
          previewCamera.position.z = 2.2;

          // Tạo cube với độ chi tiết cao hơn
          const geometry = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
          const material = createMaterialFromParams(variant);
          const previewCube = new THREE.Mesh(geometry, material);

          // Thêm wireframe cho cube nếu có border
          if (variant.showBorder) {
            const wireGeometry = new THREE.EdgesGeometry(geometry, 15);
            const wireMaterial = new THREE.LineBasicMaterial({
              color: variant.borderColor || "#ffffff",
              linewidth: 1,
              transparent: true,
              opacity: 0.7,
            });
            const wireframe = new THREE.LineSegments(
              wireGeometry,
              wireMaterial
            );
            previewCube.add(wireframe);
          }

          // Thêm ánh sáng cho scene preview
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
          previewScene.add(ambientLight);

          const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
          directionalLight.position.set(5, 5, 5);
          previewScene.add(directionalLight);

          // Thêm point light để làm nổi bật các texture
          const pointLight = new THREE.PointLight(0xffffff, 1.0);
          pointLight.position.set(-2, 1, 3);
          previewScene.add(pointLight);

          // Thêm ánh sáng màu để tạo hiệu ứng đặc biệt cho từng loại
          const accentColorLight = new THREE.PointLight(
            variant.emissive || variant.color || "#ffffff",
            variant.texturePattern === "plasma" ? 2.0 : 0.8,
            10
          );
          accentColorLight.position.set(2, -1, 1);
          previewScene.add(accentColorLight);

          previewScene.add(previewCube);

          // Áp dụng rotation khác nhau cho từng biến thể
          const rotation = rotationSettings[index % rotationSettings.length];
          previewCube.rotation.x = rotation.x * Math.PI;
          previewCube.rotation.y = rotation.y * Math.PI;
          previewCube.rotation.z = rotation.z * Math.PI;

          // Thêm hiệu ứng hậu kỳ cho preview
          const composer = new EffectComposer(previewRenderer);
          const renderPass = new RenderPass(previewScene, previewCamera);
          composer.addPass(renderPass);

          // Thêm bloom cho các preview
          const bloomStrength = variant.emissiveIntensity ? 1.0 : 0.5;
          const bloomEffect = new BloomEffect({
            luminanceThreshold: 0.2,
            luminanceSmoothing: 0.9,
            intensity: bloomStrength,
            radius:
              variant.description === "Crystal" ||
              variant.description === "Hologram"
                ? 1.0
                : 0.8, // Tăng radius cho Crystal và Hologram
          });
          const bloomPass = new EffectPass(previewCamera, bloomEffect);
          composer.addPass(bloomPass);

          // Render vài frame để hiệu ứng bloom hiện rõ
          for (let i = 0; i < 3; i++) {
            composer.render();
          }

          // Lưu preview vào variant với mô tả
          return {
            ...variant,
            preview: previewCanvas.toDataURL("image/png", 0.95), // Tăng chất lượng export
            description: variant.description || "Custom", // Sử dụng mô tả đã có
          };
        })
      );

      setMaterialParams(variants[0]);
      setVariantPreviews(variants);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCube(false);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Cải thiện camera với gốc nhìn tốt hơn
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 2.2); // Đặt camera xa hơn một chút để thấy rõ hơn
    cameraRef.current = camera;

    // Cải thiện renderer với chất lượng cao hơn
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      precision: "highp",
      powerPreference: "high-performance",
    });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5)); // Tăng pixel ratio cho sắc nét
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Tăng độ sáng
    renderer.shadowMap.enabled = true; // Bật đổ bóng
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Bóng mềm cho thực tế hơn
    rendererRef.current = renderer;

    // Cải thiện HDR environment map
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      "/textures/studio_small_08_1k.hdr",
      (texture: THREE.DataTexture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = new THREE.Color("#000000"); // Đảm bảo nền đen hoàn toàn
      }
    );

    // Tăng độ chi tiết của geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1, 128, 128, 128); // Tăng phân mảnh
    const material = new THREE.MeshPhysicalMaterial({
      color: "#666666",
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 1.0, // Tăng cường phản chiếu môi trường
      clearcoat: 0.3, // Thêm lớp phủ bóng
      clearcoatRoughness: 0.2,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true; // Bật đổ bóng
    cube.receiveShadow = true; // Nhận bóng
    cubeRef.current = cube;
    scene.add(cube);

    // Cải thiện khung wireframe
    const wireframeGeometry = new THREE.EdgesGeometry(geometry, 15); // Thêm tham số threshold
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: "#ffffff",
      linewidth: 1,
      transparent: true,
      opacity: 0.5,
    });
    const wireframe = new THREE.LineSegments(
      wireframeGeometry,
      wireframeMaterial
    );
    wireframeRef.current = wireframe;
    scene.add(wireframe);

    // Cải thiện hiệu ứng hậu kỳ với bloom đẹp hơn
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom effect với các tham số đẹp hơn
    const bloomEffect = new BloomEffect({
      luminanceThreshold: 0.2,
      luminanceSmoothing: 0.9,
      intensity: 0.6,
      radius: 0.8,
    });
    bloomEffectRef.current = bloomEffect;

    const effectPass = new EffectPass(camera, bloomEffect);
    composer.addPass(effectPass);

    // Cải thiện ánh sáng
    // Ánh sáng môi trường
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Ánh sáng chính từ trên cao
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Ánh sáng điểm bên phải
    const pointLight1 = new THREE.PointLight(0x7d5fff, 1.5, 10);
    pointLight1.position.set(3, 1, 2);
    scene.add(pointLight1);

    // Ánh sáng điểm bên trái
    const pointLight2 = new THREE.PointLight(0x00cec9, 1.5, 10);
    pointLight2.position.set(-3, -1, 2);
    scene.add(pointLight2);

    // Ánh sáng phía sau
    const backLight = new THREE.PointLight(0xff7675, 1.0, 10);
    backLight.position.set(0, 0, -3);
    scene.add(backLight);

    // Ánh sáng tập trung cho hiệu ứng thật hơn
    const spotLight = new THREE.SpotLight(
      0xffffff,
      1.5,
      15,
      Math.PI / 6,
      0.5,
      1
    );
    spotLight.position.set(0, 5, 3);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    // Cải thiện animation cho mượt mà và hấp dẫn hơn
    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.01;

      if (cubeRef.current && wireframeRef.current) {
        // Chuyển động lơ lửng phức tạp hơn
        cubeRef.current.position.y = Math.sin(timeRef.current) * 0.15;
        cubeRef.current.position.x = Math.sin(timeRef.current * 0.8) * 0.05;

        if (!isDraggingRef.current) {
          // Giảm mạnh tốc độ xoay, gần như đứng yên, chỉ xoay rất nhẹ
          cubeRef.current.rotation.y += 0.0003;
          cubeRef.current.rotation.x += 0.0002;
          cubeRef.current.rotation.z += 0.0001;
        }

        // Đồng bộ wireframe với cube
        wireframeRef.current.position.copy(cubeRef.current.position);
        wireframeRef.current.rotation.copy(cubeRef.current.rotation);

        // Hiệu ứng hologram cải tiến
        if (materialParams?.customEffects?.includes("hologram")) {
          // Thay thế toàn bộ material để đảm bảo màu được áp dụng đúng
          if (cubeRef.current) {
            // Tạo material hologram mới với màu đúng
            const newHologramMaterial = new THREE.ShaderMaterial({
              vertexShader: hologramShader.vertexShader,
              fragmentShader: hologramShader.fragmentShader,
              uniforms: {
                time: { value: timeRef.current },
                baseColor: {
                  value: new THREE.Color(
                    materialParams.color ||
                      materialParams.gradientColors?.[0] ||
                      "#ffffff"
                  ),
                },
              },
              transparent: true,
              opacity: materialParams.opacity || 0.8,
            });

            // Áp dụng material mới
            if (cubeRef.current.material instanceof THREE.ShaderMaterial) {
              // Chỉ cập nhật uniforms nếu đã là shader material
              cubeRef.current.material.uniforms.time.value =
                timeRef.current * 0.5;
              cubeRef.current.material.uniforms.baseColor.value =
                new THREE.Color(
                  materialParams.color ||
                    materialParams.gradientColors?.[0] ||
                    "#ffffff"
                );
            } else {
              // Thay thế hoàn toàn nếu chưa phải là shader material
              cubeRef.current.material = newHologramMaterial;
            }
          }

          // Điều chỉnh wireframe để hiển thị rõ hơn
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current
              .material as THREE.LineBasicMaterial;

            // Màu viền trắng hoặc theo màu được chỉ định
            wireMaterial.color.set(materialParams.borderColor || "#ffffff");

            // Tăng độ đậm của viền
            wireMaterial.linewidth = materialParams.borderWidth || 2;
            wireMaterial.opacity = 0.8;
          }
        }

        // Hiệu ứng đặc biệt cho Carbon
        if (materialParams?.description === "Carbon") {
          if (cubeRef.current.material instanceof THREE.MeshPhysicalMaterial) {
            // Đặt trực tiếp màu cơ bản
            cubeRef.current.material.color.set(
              materialParams.color || "#ffea00"
            );

            // Đặt màu phát sáng
            if (materialParams.emissive) {
              cubeRef.current.material.emissive.set(materialParams.emissive);
              cubeRef.current.material.emissiveIntensity =
                materialParams.emissiveIntensity || 0.5;
            }

            // Tăng cường hiệu ứng clearcoat để làm nổi bật màu sắc
            cubeRef.current.material.clearcoat =
              materialParams.clearcoat || 1.0;
            cubeRef.current.material.clearcoatRoughness = 0.1;

            // Đảm bảo độ bóng được áp dụng
            cubeRef.current.material.roughness =
              materialParams.roughness || 0.2;
            cubeRef.current.material.metalness =
              materialParams.metalness || 0.8;
          }

          // Điều chỉnh wireframe cho carbon
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current
              .material as THREE.LineBasicMaterial;
            wireMaterial.color.set(materialParams.borderColor || "#ffffee");
            wireMaterial.opacity = 0.8;
          }
        }

        // Hiệu ứng nhịp đập cải tiến
        if (
          materialParams?.animationType === "pulse" &&
          materialParams.animateEmissive
        ) {
          const material = cubeRef.current
            .material as THREE.MeshPhysicalMaterial;
          // Nhịp đập mạnh hơn với tần số cao
          const pulseValue = Math.sin(timeRef.current * 4) * 0.5 + 0.5;
          material.emissiveIntensity =
            (materialParams.emissiveIntensity || 0.2) *
            (0.7 + pulseValue * 1.2);

          // Thêm hiệu ứng scale theo nhịp
          const scaleValue = 1 + pulseValue * 0.03;
          cubeRef.current.scale.set(scaleValue, scaleValue, scaleValue);

          // Làm cho wireframe cũng nhấp nháy
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current
              .material as THREE.LineBasicMaterial;
            wireMaterial.opacity = 0.3 + pulseValue * 0.7;
          }
        }

        // Hiệu ứng flow cải tiến
        if (
          materialParams?.animationType === "flow" &&
          cubeRef.current.material instanceof THREE.ShaderMaterial
        ) {
          const material = cubeRef.current.material;
          material.uniforms.time.value = timeRef.current * 0.5; // Giảm tốc độ flow

          // Giảm tốc độ xoay thêm cho kiểu flow
          cubeRef.current.rotation.y += 0.0001;
          cubeRef.current.rotation.z += 0.0001;
        }

        // Hiệu ứng xoay cải tiến
        if (materialParams?.animationType === "rotate") {
          const speed = (materialParams.animationSpeed || 0.05) * 0.2; // Giảm tốc độ xoay xuống 20%
          cubeRef.current.rotation.y += speed;
          cubeRef.current.rotation.x += speed * 0.5;
          cubeRef.current.rotation.z += speed * 0.3;

          // Thêm hiệu ứng pulsing cho rotation
          const pulseScale = 1 + 0.02 * Math.sin(timeRef.current * 3);
          cubeRef.current.scale.set(pulseScale, pulseScale, pulseScale);
        }

        // Thêm hiệu ứng rung nhẹ cho khối 3D
        if (
          materialParams?.texturePattern === "noise" ||
          materialParams?.displacementScale
        ) {
          const vibrationAmount = 0.005; // Tăng cường độ rung
          cubeRef.current.scale.x =
            1 + Math.sin(timeRef.current * 12) * vibrationAmount;
          cubeRef.current.scale.y =
            1 + Math.sin(timeRef.current * 14) * vibrationAmount;
          cubeRef.current.scale.z =
            1 + Math.sin(timeRef.current * 16) * vibrationAmount;
        }

        // Hiệu ứng đặc biệt cho Crystal
        if (materialParams?.description === "Crystal") {
          // Hiệu ứng tỏa sáng từ bên trong
          const pulseValue = Math.sin(timeRef.current * 2.5) * 0.5 + 0.5;
          if (cubeRef.current.material instanceof THREE.MeshPhysicalMaterial) {
            // Tăng cường hiển thị màu
            cubeRef.current.material.emissiveIntensity =
              (materialParams.emissiveIntensity || 0.4) *
              (0.6 + pulseValue * 1.8);
            // Điều chỉnh transmission theo thời gian
            cubeRef.current.material.transmission =
              (materialParams.transmission || 0.8) * (0.85 + pulseValue * 0.15);

            // Đảm bảo màu phát sáng cực mạnh theo màu của prompt
            if (materialParams.emissive) {
              const color = new THREE.Color(materialParams.emissive);
              // Làm sáng màu emissive dần dần theo thời gian
              const hsl = { h: 0, s: 0, l: 0 };
              color.getHSL(hsl);
              // Tăng độ sáng nhưng giữ nguyên màu sắc
              color.setHSL(
                hsl.h,
                hsl.s,
                Math.min(0.8, hsl.l + 0.2 * pulseValue)
              );
              cubeRef.current.material.emissive.copy(color);
            }
          }
        }
      }

      // Cập nhật hiệu ứng bloom tùy theo material
      if (bloomEffectRef.current && materialParams) {
        if (
          materialParams.emissiveIntensity ||
          materialParams.customEffects?.includes("hologram")
        ) {
          bloomEffectRef.current.intensity = 1.4; // Tăng cường bloom cho các material phát sáng
        } else {
          bloomEffectRef.current.intensity = 0.6; // Tăng nhẹ bloom cho các material không phát sáng
        }
      }

      composerRef.current?.render();
    };

    const onMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !cubeRef.current) return;

      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      cubeRef.current.rotation.y += deltaX * 0.005;
      cubeRef.current.rotation.x += deltaY * 0.005;
      cubeRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, cubeRef.current.rotation.x)
      );

      if (wireframeRef.current) {
        wireframeRef.current.rotation.copy(cubeRef.current.rotation);
      }

      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    animate();

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!cubeRef.current || !wireframeRef.current || !materialParams) return;

    const cube = cubeRef.current;
    const wireframe = wireframeRef.current;

    const textureLoader = new THREE.TextureLoader();
    let newMaterial: THREE.Material;

    // Xử lý đặc biệt cho texture stripes
    if (materialParams.texturePattern === "stripes") {
      newMaterial = new THREE.MeshPhysicalMaterial({
        color: materialParams.color || "#666666",
        metalness: materialParams.metalness ?? 0.5,
        roughness: materialParams.roughness ?? 0.5,
        emissive: materialParams.emissive || "#000000",
        emissiveIntensity: materialParams.emissiveIntensity ?? 0,
        transparent: materialParams.transparent ?? false,
        opacity: materialParams.opacity ?? 1.0,
        envMapIntensity: materialParams.envMapIntensity ?? 0.5,
      });

      if (materialParams.map) {
        const texture = new THREE.TextureLoader().load(materialParams.map);
        texture.repeat.set(
          materialParams.textureScale || 1,
          materialParams.textureScale || 1
        );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        (newMaterial as THREE.MeshPhysicalMaterial).map = texture;
      }
    } else if (materialParams.customEffects?.includes("hologram")) {
      newMaterial = new THREE.ShaderMaterial({
        vertexShader: hologramShader.vertexShader,
        fragmentShader: hologramShader.fragmentShader,
        uniforms: {
          time: { value: 0 },
          baseColor: {
            value: new THREE.Color(materialParams.color || "#7dd3fc"),
          },
        },
        transparent: true,
        opacity: materialParams.opacity ?? 0.6,
      });
    } else if (materialParams.animationType === "flow") {
      newMaterial = new THREE.ShaderMaterial({
        vertexShader: flowShader.vertexShader,
        fragmentShader: flowShader.fragmentShader,
        uniforms: {
          ...flowShader.uniforms,
          color1: {
            value: new THREE.Color(
              materialParams.gradientColors?.[0] ||
                materialParams.color ||
                "#ffffff"
            ),
          },
          color2: {
            value: new THREE.Color(
              materialParams.gradientColors?.[1] || "#000000"
            ),
          },
        },
      });
    } else if (
      materialParams.gradientColors &&
      materialParams.gradientColors.length >= 2
    ) {
      newMaterial = new THREE.ShaderMaterial({
        vertexShader: gradientShader.vertexShader,
        fragmentShader: gradientShader.fragmentShader,
        uniforms: {
          color1: { value: new THREE.Color(materialParams.gradientColors[0]) },
          color2: { value: new THREE.Color(materialParams.gradientColors[1]) },
          opacity: { value: materialParams.opacity ?? 1.0 },
        },
        transparent: materialParams.transparent ?? false,
      });
    } else {
      newMaterial = new THREE.MeshPhysicalMaterial({
        color: materialParams.color || "#666666",
        metalness: materialParams.metalness ?? 0.5,
        roughness: materialParams.roughness ?? 0.5,
        emissive: materialParams.emissive || "#000000",
        emissiveIntensity: materialParams.emissiveIntensity ?? 0,
        transparent: materialParams.transparent ?? false,
        opacity: materialParams.opacity ?? 1.0,
        envMapIntensity: materialParams.envMapIntensity ?? 0.5,
        bumpScale: materialParams.bumpScale ?? 0.0,
        normalScale: materialParams.normalScale
          ? new THREE.Vector2(
              materialParams.normalScale,
              materialParams.normalScale
            )
          : new THREE.Vector2(1, 1),
        clearcoat: materialParams.clearcoat ?? 0,
        clearcoatRoughness: materialParams.clearcoatRoughness ?? 0.1,
        anisotropy: materialParams.anisotropy ?? 0,
        displacementScale: materialParams.displacementScale ?? 0,
        transmission: materialParams.transmission ?? 0,
        sheen: materialParams.sheen ?? 0,
        sheenColor: materialParams.sheenColor
          ? new THREE.Color(materialParams.sheenColor)
          : new THREE.Color("#ffffff"),
      });

      if (materialParams.map) {
        textureLoader.load(materialParams.map, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).map = texture;
          texture.repeat.set(
            materialParams.textureScale || 1,
            materialParams.textureScale || 1
          );
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.normalMap) {
        textureLoader.load(materialParams.normalMap, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).normalMap = texture;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.roughnessMap) {
        textureLoader.load(materialParams.roughnessMap, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).roughnessMap = texture;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.displacementMap) {
        textureLoader.load(materialParams.displacementMap, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).displacementMap = texture;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.proceduralTexture) {
        textureLoader.load(materialParams.proceduralTexture, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).map = texture;
          texture.repeat.set(
            materialParams.textureScale || 1,
            materialParams.textureScale || 1
          );
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          newMaterial.needsUpdate = true;
        });
      }
    }

    cube.material = newMaterial;

    const wireframeMaterial = wireframe.material as THREE.LineBasicMaterial;
    wireframeMaterial.color.set(materialParams.borderColor || "#ffffff");
    wireframeMaterial.linewidth = materialParams.borderWidth || 5;
    wireframeMaterial.needsUpdate = true;
    wireframe.visible = materialParams.showBorder ?? false;

    if (bloomEffectRef.current) {
      bloomEffectRef.current.intensity = materialParams.emissiveIntensity
        ? materialParams.emissiveIntensity * 0.8
        : 0;
    }
  }, [materialParams]);

  const handleGenerateCube = async () => {
    if (!cubePrompt.trim()) return;

    setIsGeneratingCube(true);

    try {
      // Generate cube based on prompt
      const response = await generateCubeSkin({ prompt: cubePrompt });

      // Create preview for main material
      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = 200;
      previewCanvas.height = 200;
      const previewRenderer = new THREE.WebGLRenderer({
        canvas: previewCanvas,
        alpha: true,
      });
      const previewScene = new THREE.Scene();
      const previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      previewCamera.position.z = 2;

      const previewCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        createMaterialFromParams(response.materialParams)
      );
      previewScene.add(previewCube);
      previewRenderer.render(previewScene, previewCamera);

      // Save preview to material params
      const mainMaterialParams = {
        ...response.materialParams,
        preview: previewCanvas.toDataURL(),
      };

      // Set main material params
      setMaterialParams(mainMaterialParams);

      // Wait a bit for material to be applied
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then generate variants
      await generateVariants();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCube(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (
      !musicTitle.trim() ||
      !musicStyle.trim() ||
      (!isInstrumental && !musicPrompt.trim())
    )
      return;

    setIsGeneratingMusic(true);
    setMusicGeneration(null); // Reset music generation state

    try {
      // First, clear any previous error state
      setMusicGeneration((prev) => (prev ? { ...prev, error: null } : null));

      console.log("isInstrumental value:", isInstrumental);
      const params = {
        prompt: musicPrompt,
        style: musicStyle,
        title: musicTitle,
        instrumental:
          isInstrumental === null || isInstrumental === undefined
            ? false
            : isInstrumental,
        customMode: true,
      };
      console.log("Calling generateMusic with params:", params);

      const response = await generateMusic(params);

      if (!response.id) {
        throw new Error(
          "Failed to retrieve task ID from music generation response"
        );
      }

      setMusicGeneration({ ...response, style: musicStyle });

      // Improved polling mechanism with better fallbacks
      const pollStatus = async () => {
        try {
          // First, check the callback endpoint for the audio_url
          const callbackRes = await fetch(
            `/api/music/callback?taskId=${response.id}`,
            {
              headers: {
                Accept: "application/json",
              },
            }
          );

          // Check if response is ok before proceeding
          if (!callbackRes.ok) {
            const errorText = await callbackRes.text();
            console.error(
              `Callback endpoint returned ${callbackRes.status}:`,
              errorText
            );
            throw new Error(
              `Callback endpoint returned status ${callbackRes.status}`
            );
          }

          // Check content type to ensure we're getting JSON
          const contentType = callbackRes.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const responseText = await callbackRes.text();
            console.error(
              "Callback endpoint returned non-JSON response:",
              responseText
            );
            throw new Error("Callback endpoint returned non-JSON response");
          }

          // Parse JSON response
          const callbackData = await callbackRes.json();
          console.log("Fetched callback data:", callbackData);

          // Check if we have audio URL from callback
          if (callbackData.audio_url) {
            // If the callback has the audio_url, use it and stop polling
            setMusicGeneration((prev) =>
              prev
                ? {
                    ...prev,
                    ...callbackData,
                    style: musicStyle,
                  }
                : null
            );
            clearInterval(pollingInterval);
            return;
          }

          // Fallback to getMusicGenerationDetails if the callback doesn't have the audio_url yet
          try {
            const details = await getMusicGenerationDetails(response.id);
            console.log("Polled music generation details:", details);

            // Extract audio URL from response using a more comprehensive approach
            let audioUrl = details.audio_url;

            // If status is success but no audio URL, search deeper
            if (
              (details.status === "SUCCESS" ||
                details.status === "completed") &&
              !audioUrl
            ) {
              console.log(
                "SUCCESS status but no audio_url, searching for URL in raw response..."
              );

              // Attempt to fetch raw details again to do deep inspection
              try {
                const rawResponse = await fetch(
                  `/api/music/callback?taskId=${response.id}&full=true`,
                  {
                    headers: { Accept: "application/json" },
                  }
                );

                if (rawResponse.ok) {
                  const rawData = await rawResponse.json();
                  console.log(
                    "Raw callback data for deep inspection:",
                    rawData
                  );

                  // Look for audio URLs in common places
                  const possibleUrlFields = [
                    "audio_url",
                    "audioUrl",
                    "url",
                    "fileUrl",
                    "mp3_url",
                    "audio",
                    "music_url",
                    "result_url",
                    "output_url",
                  ];

                  // Check all top-level fields
                  for (const field of possibleUrlFields) {
                    if (
                      rawData[field] &&
                      typeof rawData[field] === "string" &&
                      rawData[field].includes("http")
                    ) {
                      audioUrl = rawData[field];
                      console.log(
                        `Found audio URL in field: ${field}`,
                        audioUrl
                      );
                      break;
                    }
                  }

                  // Check nested fields - data, payload, result
                  const nestedObjects = ["data", "payload", "result", "output"];
                  for (const nestedField of nestedObjects) {
                    if (
                      !audioUrl &&
                      rawData[nestedField] &&
                      typeof rawData[nestedField] === "object"
                    ) {
                      for (const field of possibleUrlFields) {
                        if (
                          rawData[nestedField][field] &&
                          typeof rawData[nestedField][field] === "string" &&
                          rawData[nestedField][field].includes("http")
                        ) {
                          audioUrl = rawData[nestedField][field];
                          console.log(
                            `Found audio URL in ${nestedField}.${field}`,
                            audioUrl
                          );
                          break;
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn("Failed deep inspection for audio URL:", err);
              }
            }

            // Update state with the results
            setMusicGeneration((prev) => ({
              ...(prev || {}),
              ...details,
              audio_url: audioUrl, // Use our extracted URL
              style: musicStyle,
            }));

            // Map API-specific status codes to user-friendly statuses
            if (
              details.status === "SUCCESS" ||
              details.status === "completed"
            ) {
              clearInterval(pollingInterval);
              if (!audioUrl) {
                console.error(
                  "No audio URL found despite SUCCESS status. Falling back to error state."
                );
                setMusicGeneration((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "failed",
                        error: "Audio URL missing after successful generation",
                        style: musicStyle,
                      }
                    : null
                );
              }
            } else if (
              details.status === "failed" ||
              details.status === "GENERATE_AUDIO_FAILED" ||
              details.status?.includes("FAILED")
            ) {
              clearInterval(pollingInterval);

              // Extract error message from various possible locations
              let errorMessage =
                details.error ||
                details.errorMessage ||
                details.response?.errorMessage ||
                "Music generation failed";

              // Handle specific error codes with user-friendly messages
              if (details.errorCode === 500) {
                errorMessage =
                  "The music service is experiencing technical difficulties. Please try again later or try a different style/prompt.";
              }

              console.error(
                `Music generation failed: ${errorMessage}`,
                details
              );

              setMusicGeneration((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "failed",
                      error: errorMessage,
                      style: musicStyle,
                    }
                  : null
              );
            }
          } catch (detailsError) {
            console.error(
              "Error fetching music generation details:",
              detailsError
            );

            // If we already have some data from the callback, use that instead of failing completely
            if (callbackData && callbackData.status) {
              setMusicGeneration((prev) =>
                prev
                  ? {
                      ...prev,
                      ...callbackData,
                      style: musicStyle,
                      error: `Details API error: ${
                        detailsError instanceof Error
                          ? detailsError.message
                          : String(detailsError)
                      }`,
                    }
                  : null
              );
            } else {
              throw detailsError;
            }
          }
        } catch (error) {
          console.error("Error polling music generation status:", error);
          clearInterval(pollingInterval);
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          setMusicGeneration((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  error:
                    errorMessage || "Failed to fetch music generation details",
                  style: musicStyle,
                }
              : null
          );
        }
      };

      // Poll more frequently at the beginning
      const pollingInterval = setInterval(pollStatus, 5000);

      // Start polling immediately
      pollStatus();

      return () => clearInterval(pollingInterval);
    } catch (error) {
      console.error("Error generating music:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMusicGeneration({
        id: "",
        status: "failed",
        error: errorMessage || "Failed to generate music",
        style: musicStyle,
      });
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Enhanced handleMint function with perfect material properties preservation
  const handleMint = async () => {
    if (activeTab === "cube" && materialParams) {
      try {
        setIsGeneratingCube(true);

        console.log(
          "Starting mint process with complete material parameters:",
          JSON.stringify(materialParams, null, 2)
        );

        // Check wallet connection
        if (!connected || !publicKey) {
          alert("Please connect your wallet first to mint real NFTs");
          throw new Error("Wallet not connected");
        }

        // Check canvas exists
        if (!canvasRef.current) {
          throw new Error("Canvas doesn't exist");
        }

        // Get name and description for NFT
        const cubeId = Math.floor(Math.random() * 900000 + 100000).toString();
        const nftName = `VOID Cube ${cubeId}`;
        const nftDescription =
          materialParams.description ||
          `A unique cube with ${
            materialParams.color ||
            materialParams.gradientColors?.[0] ||
            "custom"
          } color and ${
            materialParams.texturePattern || "special"
          } texture pattern.`;

        // *** CRITICAL FIX: Create a deep clone of material parameters to prevent any modification ***
        const completeParams = JSON.parse(JSON.stringify(materialParams));
        console.log("Deep cloned material parameters to prevent modification");

        // Convert canvas to image file
        const imageFile = await convertCubeToFile(canvasRef.current, nftName);
        console.log("Created image file:", imageFile.name, imageFile.size);

        // Prepare complete attributes for NFT including all material properties
        const attributes = [
          { trait_type: "Type", value: "Cube" },
          {
            trait_type: "Color",
            value:
              materialParams.color ||
              materialParams.gradientColors?.[0] ||
              "#5d4fff",
          },
          {
            trait_type: "Texture",
            value: materialParams.texturePattern || "None",
          },
          {
            trait_type: "Animation",
            value: materialParams.animationType || "None",
          },
        ];

        // Add special effects if present
        const effects = [];
        if (materialParams.customEffects?.includes("hologram"))
          effects.push("Hologram");
        if ((materialParams.emissiveIntensity ?? 0) > 0)
          effects.push("Glowing");
        if (materialParams.animationType === "pulse") effects.push("Pulsing");
        if (materialParams.animationType === "flow") effects.push("Flowing");
        if (materialParams.animationType === "rotate") effects.push("Rotating");

        if (effects.length > 0) {
          attributes.push({ trait_type: "Effects", value: effects.join(", ") });
        }

        // Get colors information to create 3D model
        const colors = materialParams.gradientColors || [
          materialParams.color || "#FFFFFF",
        ];

        // Create Solana connection
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
            "https://api.devnet.solana.com",
          "confirmed"
        );
        console.log("Solana connection created:", connection.rpcEndpoint);

        try {
          // *** CRITICAL FIX: Create and upload the 3D model file with EXACT SAME material parameters ***
          console.log("Creating 3D GLB file with EXACT material parameters...");
          const glbFile = await convertGLBToFile(
            colors,
            nftName,
            completeParams
          );
          console.log(
            "Created 3D model GLB file:",
            glbFile.name,
            glbFile.size,
            "bytes"
          );

          // If we couldn't create a GLB file or it's too small, throw error
          if (!glbFile || glbFile.size < 500) {
            throw new Error("Generated 3D model file is invalid or too small");
          }

          // *** CRITICAL FIX: Prepare cube NFT metadata with FULL material parameters ***
          const cubeMetadata = await getCubeNFTMetadata(
            nftName,
            nftDescription,
            imageFile,
            glbFile, // Pass the actual GLB file
            attributes,
            {
              // Include COMPLETE material parameters to preserve all visual properties
              materialParams: completeParams,
              // Also include colors separately for easier access
              colors: materialParams.gradientColors || [
                materialParams.color || "#FFFFFF",
              ],
            }
          );

          // *** CRITICAL FIX: Add verification step to ensure metadata has all properties ***
          console.log("Verifying metadata includes all material properties...");
          if (!cubeMetadata.properties?.materialParams) {
            console.error("Material parameters missing from metadata!");

            // Re-add material parameters if they're missing
            cubeMetadata.properties.materialParams = completeParams;
            console.log("Material parameters re-added to metadata.");
          }

          // Try primary minting method
          console.log(
            "Starting real NFT minting on Solana with complete metadata:",
            cubeMetadata.name,
            "and 3D model:",
            cubeMetadata.model ? "yes" : "no"
          );

          // Pass the wallet adapter functions
          const mintedAddress = await mintNFT(
            connection,
            {
              publicKey,
              signTransaction,
              signAllTransactions,
              sendTransaction,
            },
            cubeMetadata
          );

          console.log("NFT minted successfully with address:", mintedAddress);
          alert(
            `NFT has been minted successfully! Address: ${mintedAddress}. Check your Profile or Phantom wallet.`
          );
          return; // Exit on success
        } catch (mintError) {
          console.error("Detailed error during Metaplex minting:", mintError);

          // *** CRITICAL FIX: Try alternative minting method with SAME material parameters ***
          console.log(
            "Falling back to alternative minting method with complete parameters"
          );
          try {
            const alternativeAddress = await mintRealNFT(
              connection,
              {
                publicKey,
                signTransaction,
                signAllTransactions,
                sendTransaction,
              },
              {
                name: nftName,
                description: nftDescription,
                attributes,
                colors,
                // *** CRITICAL FIX: Pass complete material parameters ***
                // Ensure the type definition includes materialParams
                // Ensure the type definition includes materialParams
                ...(completeParams && { materialParams: completeParams }),
              },
              imageFile
            );

            console.log(
              "NFT minted with alternative method:",
              alternativeAddress
            );
            alert(
              `NFT has been minted! Check your Profile and Phantom wallet.`
            );
            return; // Exit on success
          } catch (altMintError) {
            console.error("Alternative minting failed:", altMintError);
            throw new Error(
              `Both minting methods failed: ${
                mintError instanceof Error
                  ? mintError.message
                  : String(mintError)
              }, ${
                altMintError instanceof Error
                  ? altMintError.message
                  : String(altMintError)
              }`
            );
          }
        }
      } catch (error) {
        console.error("Complete error trace for minting:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        alert(`Error minting NFT: ${errorMessage}. Check console for details.`);

        // Store locally if explicitly requested as fallback
        if (confirm("Would you like to store this NFT locally instead?")) {
          try {
            // *** CRITICAL FIX: Generate model file with EXACT material parameters ***
            const colors = materialParams.gradientColors || [
              materialParams.color || "#FFFFFF",
            ];

            // Create deep clone of material parameters
            const exactParams = JSON.parse(JSON.stringify(materialParams));

            const glbFile = await convertGLBToFile(
              colors,
              `VOID Cube Local`,
              exactParams
            );
            console.log(
              "Created local model file:",
              glbFile.name,
              glbFile.size
            );

            // Convert canvas to image
            if (!canvasRef.current) {
              throw new Error("Canvas element is not available");
            }
            const imageFile = await convertCubeToFile(
              canvasRef.current,
              `VOID Cube Local`
            );

            // Create NFT data for local storage
            const cubeId = Math.floor(
              Math.random() * 900000 + 100000
            ).toString();
            const nftName = `VOID Cube ${cubeId} (Local)`;
            const imageReader = new FileReader();
            const modelReader = new FileReader();

            // First read the image
            imageReader.readAsDataURL(imageFile);
            imageReader.onload = () => {
              const imageDataUrl = imageReader.result as string;

              // Then read the model
              modelReader.readAsDataURL(glbFile);
              modelReader.onload = () => {
                const modelDataUrl = modelReader.result as string;

                // *** CRITICAL FIX: Create local NFT object with COMPLETE material parameters ***
                const localNft = {
                  id: `local-cube-${Date.now()}`,
                  name: nftName,
                  description: `A locally stored cube with ${
                    materialParams.texturePattern || "special"
                  } texture`,
                  image: imageDataUrl,
                  model3d: modelDataUrl,
                  modelViewerUrl: `https://modelviewer.dev/editor/index.html`,
                  // Store complete material parameters at multiple levels
                  materialParams: exactParams,
                  originalMaterialParams: exactParams,
                  attributes: [
                    { trait_type: "Type", value: "Cube" },
                    {
                      trait_type: "Color",
                      value:
                        materialParams.color ||
                        materialParams.gradientColors?.[0] ||
                        "#5d4fff",
                    },
                    {
                      trait_type: "Texture",
                      value: materialParams.texturePattern || "None",
                    },
                    {
                      trait_type: "Animation",
                      value: materialParams.animationType || "None",
                    },
                    { trait_type: "Collection", value: "VOID Cube Collection" },
                  ],
                  mintedAt: new Date().toISOString(),
                  type: "cube",
                  shapeType: "complex",
                  local: true, // Mark as locally stored
                  colors: colors,
                  texture: materialParams.texturePattern,
                  animation: materialParams.animationType,
                  // Store properties object as well
                  properties: {
                    materialParams: exactParams,
                    colors: colors,
                    texture: materialParams.texturePattern,
                    animation: materialParams.animationType,
                    customEffects: materialParams.customEffects,
                    emissive: materialParams.emissive,
                    emissiveIntensity: materialParams.emissiveIntensity,
                    showBorder: materialParams.showBorder,
                    borderColor: materialParams.borderColor,
                    borderWidth: materialParams.borderWidth,
                  },
                };

                // Save to localStorage
                const userNfts = JSON.parse(
                  localStorage.getItem("userNfts") || "[]"
                );
                userNfts.push(localNft);
                localStorage.setItem("userNfts", JSON.stringify(userNfts));

                alert(
                  "Cube has been stored locally with ALL properties preserved. View it in your Profile page."
                );
              };
            };
          } catch (localError) {
            console.error("Error with local storage:", localError);
            alert(
              "Failed to store NFT locally as well. Please try again later."
            );
          }
        }
      } finally {
        setIsGeneratingCube(false);
      }
    } else if (activeTab === "music" && musicGeneration?.audio_url) {
      // Music minting code - unchanged as it's not part of the cube properties issue
      try {
        // Show minting status
        setIsGeneratingMusic(true);

        // Create metadata for music NFT
        const nftName = `VOID Music: ${musicTitle || "Untitled"}`;
        const nftDescription = `${musicStyle} music track${
          musicPrompt
            ? `: ${musicPrompt.substring(0, 100)}${
                musicPrompt.length > 100 ? "..." : ""
              }`
            : ""
        }`;

        // Prepare attributes
        const attributes = [
          { trait_type: "Type", value: "Music" },
          { trait_type: "Style", value: musicStyle || "Custom" },
          { trait_type: "Instrumental", value: isInstrumental ? "Yes" : "No" },
        ];

        // Create display image for music
        const audioName = nftName.replace(/\s+/g, "-").toLowerCase();

        // Create display image from empty canvas with music waveform
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 800;
        tempCanvas.height = 800;
        const ctx = tempCanvas.getContext("2d");

        if (ctx) {
          // Create nice gradient background
          const gradient = ctx.createLinearGradient(0, 0, 800, 800);
          gradient.addColorStop(0, "#5d4fff");
          gradient.addColorStop(0.5, "#c42bb4");
          gradient.addColorStop(1, "#1e58af");

          // Draw background
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 800);

          // Draw music waveform
          ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 3;

          const waveHeight = 200;
          const centerY = 400;

          ctx.beginPath();
          for (let i = 0; i < 800; i += 10) {
            const amplitude = Math.random() * waveHeight;
            const y = centerY + Math.sin(i * 0.02) * amplitude;
            if (i === 0) {
              ctx.moveTo(i, y);
            } else {
              ctx.lineTo(i, y);
            }
          }
          ctx.stroke();

          // Draw title and info
          ctx.fillStyle = "white";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "center";
          ctx.fillText(musicTitle || "VOID Music", 400, 300);

          ctx.font = "32px Arial";
          ctx.fillText(musicStyle, 400, 350);

          // Draw VOID logo
          ctx.font = "bold 24px Arial";
          ctx.fillText("VOID RESONANCE", 400, 720);
        }

        // Convert canvas to image file
        const imageBlob = await new Promise<Blob>((resolve) => {
          tempCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(new Blob([]));
          }, "image/png");
        });

        const imageFile = new File([imageBlob], `${audioName}-cover.png`, {
          type: "image/png",
        });

        // Get audio URL
        const audioUrl = musicGeneration.audio_url;
        console.log("Audio URL for minting:", audioUrl);

        // Check if wallet is connected
        if (!connected || !publicKey) {
          alert("Please connect your wallet first to mint music NFTs");
          throw new Error("Wallet not connected");
        }

        try {
          // Create Solana connection
          console.log("Creating Solana connection for music NFT");
          const connection = new Connection(
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
              "https://api.devnet.solana.com",
            "confirmed"
          );

          // Get metadata from helper function
          const musicMetadata = await getMusicNFTMetadata(
            nftName,
            nftDescription,
            imageFile,
            audioUrl,
            attributes
          );

          // Mint real NFT on Solana
          console.log("Starting music NFT minting with wallet adapter");
          const mintedAddress = await mintNFT(
            connection,
            {
              publicKey,
              signTransaction,
              signAllTransactions,
              sendTransaction,
            },
            musicMetadata
          );

          console.log("Music NFT minted successfully, address:", mintedAddress);
          alert(
            `Music NFT has been minted successfully! Address: ${mintedAddress}. Check your Profile or Phantom wallet.`
          );
        } catch (mintingError) {
          console.error("Music NFT minting failed:", mintingError);
          // Alternative minting methods and fallbacks...
        }
      } catch (error: any) {
        console.error("Error when minting music NFT:", error);
        alert(`Error minting music NFT: ${error.message}`);
      } finally {
        setIsGeneratingMusic(false);
      }
    }
  };

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
      {/* Custom cursor */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
        animate={{
          x: cursorPosition.x - 16,
          y: cursorPosition.y - 16,
          scale: cursorHover ? 1.5 : 1,
        }}
        transition={{ type: "spring", damping: 10, mass: 0.1, stiffness: 100 }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect
            x="12"
            y="12"
            width="8"
            height="8"
            fill={cursorHover ? "#ec4899" : "#a855f7"}
          />
        </svg>
      </motion.div>

      <Navigation />

      {/* Enhanced 3D Banner */}
      <Creator3DBanner />

      {/* Creator Section */}
      <section id="creator" className="relative py-20">
        {/* Floating particles background */}
        <FloatingParticles />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <Tabs
              defaultValue="cube"
              className="w-full"
              onValueChange={(value) => setActiveTab(value)}
            >
              <div className="flex justify-center mb-10">
                <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                  <TabsTrigger
                    value="cube"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-8 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    3D CUBE GENERATOR
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-8 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MUSIC GENERATOR
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/50 rounded-lg p-8 shadow-lg shadow-purple-500/10">
                  {activeTab === "cube" ? (
                    <>
                      <PixelHeading
                        text="DESIGN YOUR CUBE"
                        className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />

                      <div className="mb-6">
                        <label className="block text-gray-300 mb-2 font-pixel">
                          ENTER YOUR PROMPT
                        </label>
                        <Input
                          value={cubePrompt}
                          onChange={(e) => setCubePrompt(e.target.value)}
                          placeholder="A glossy cube with a blue-to-purple gradient and pulsing glow..."
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full h-32 resize-none"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        />
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          onClick={handleGenerateCube}
                          disabled={isGeneratingCube || !cubePrompt.trim()}
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          {isGeneratingCube ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 012H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              GENERATING...
                            </>
                          ) : (
                            "CREATE 3D CUBE"
                          )}
                        </Button>

                        <Button
                          onClick={handleMint}
                          disabled={isGeneratingCube || !materialParams}
                          className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          MINT
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <PixelHeading
                        text="GENERATE MUSIC"
                        className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />

                      <div className="space-y-6">
                        <div>
                          <Label className="block text-gray-300 mb-2 font-pixel">
                            MUSIC TITLE
                          </Label>
                          <Input
                            value={musicTitle}
                            onChange={(e) => setMusicTitle(e.target.value)}
                            placeholder="Enter music title (max 80 characters)"
                            className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                            maxLength={80}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          />
                        </div>

                        <div>
                          <Label className="block text-gray-300 mb-2 font-pixel">
                            MUSIC STYLE
                          </Label>
                          <Input
                            value={musicStyle}
                            onChange={(e) => setMusicStyle(e.target.value)}
                            placeholder="Enter music style (e.g., ambient, electronic, max 200 characters)"
                            className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                            maxLength={200}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="instrumental"
                            checked={isInstrumental}
                            onCheckedChange={(checked) => {
                              console.log("Switch onCheckedChange:", checked);
                              setIsInstrumental(Boolean(checked));
                            }}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          />
                          <Label
                            htmlFor="instrumental"
                            className="text-gray-300 font-pixel"
                          >
                            Instrumental
                          </Label>
                        </div>

                        {!isInstrumental && (
                          <div>
                            <Label className="block text-gray-300 mb-2 font-pixel">
                              MUSIC PROMPT
                            </Label>
                            <Input
                              value={musicPrompt}
                              onChange={(e) => setMusicPrompt(e.target.value)}
                              placeholder="An ambient electronic track with a futuristic vibe..."
                              className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full h-32 resize-none"
                              maxLength={3000}
                              onMouseEnter={() => setCursorHover(true)}
                              onMouseLeave={() => setCursorHover(false)}
                            />
                          </div>
                        )}

                        <div className="flex space-x-4">
                          <Button
                            onClick={handleGenerateMusic}
                            disabled={
                              isGeneratingMusic ||
                              !musicTitle.trim() ||
                              !musicStyle.trim() ||
                              (!isInstrumental && !musicPrompt.trim())
                            }
                            className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            {isGeneratingMusic ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 012H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                GENERATING...
                              </>
                            ) : (
                              "GENERATE MUSIC"
                            )}
                          </Button>

                          <Button
                            onClick={handleMint}
                            disabled={
                              isGeneratingMusic || !musicGeneration?.audio_url
                            }
                            className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            MINT
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "cube" && materialParams && (
                    <div className="mt-6">
                      <PixelHeading
                        text="MATERIAL PROPERTIES"
                        className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />
                      <div className="text-gray-400 font-pixel text-sm grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-bold text-purple-400 mb-1">
                            APPEARANCE:
                          </p>
                          <p>
                            Type: {materialParams.description || "Standard"}
                          </p>
                          <p>
                            Color:{" "}
                            {materialParams.gradientColors
                              ? `Gradient (${materialParams.gradientColors[0]} → ${materialParams.gradientColors[1]})`
                              : materialParams.color || "#FFFFFF"}
                          </p>
                          <p>
                            Smoothness:{" "}
                            {materialParams.roughness
                              ? (1 - Number(materialParams.roughness)).toFixed(
                                  2
                                )
                              : "0.50"}
                          </p>
                          <p>
                            Metalness:{" "}
                            {materialParams.metalness
                              ? (
                                  Number(materialParams.metalness) * 100
                                ).toFixed(0) + "%"
                              : "50%"}
                          </p>
                          <p>
                            Clearcoat:{" "}
                            {materialParams.clearcoat
                              ? Number(materialParams.clearcoat).toFixed(1)
                              : "0.0"}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-purple-400 mb-1">
                            EFFECTS:
                          </p>
                          <p>
                            Texture:{" "}
                            {materialParams.texturePattern === "circuit"
                              ? "Circuit"
                              : materialParams.texturePattern === "marble"
                              ? "Marble"
                              : materialParams.texturePattern === "noise"
                              ? "Noise"
                              : materialParams.texturePattern === "stripes"
                              ? "Stripes"
                              : materialParams.texturePattern === "plasma"
                              ? "Plasma"
                              : materialParams.texturePattern === "rust"
                              ? "Rust"
                              : materialParams.proceduralTexture
                              ? "Auto-generated"
                              : "None"}
                          </p>
                          <p>
                            Displacement:{" "}
                            {materialParams.displacementScale || "0.0"}
                          </p>
                          <p>
                            Animation:{" "}
                            {materialParams.animationType === "pulse"
                              ? "Pulse"
                              : materialParams.animationType === "flow"
                              ? "Flow"
                              : materialParams.animationType === "rotate"
                              ? "Rotate"
                              : "None"}
                          </p>
                          <p>
                            Emissive:{" "}
                            {materialParams.emissiveIntensity
                              ? (
                                  Number(materialParams.emissiveIntensity) * 100
                                ).toFixed(0) + "%"
                              : "0%"}
                          </p>
                          <p>
                            Border:{" "}
                            {materialParams.showBorder
                              ? `${materialParams.borderWidth}px ${materialParams.borderColor}`
                              : "None"}
                          </p>
                        </div>
                      </div>
                      {materialParams.customEffects?.includes("hologram") && (
                        <p className="mt-2 text-purple-400 font-pixel text-sm">
                          Special Effect: Hologram
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black border border-purple-900/50 p-8">
                  {activeTab === "cube" ? (
                    <>
                      <PixelHeading
                        text="3D PREVIEW"
                        className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />

                      <div className="w-full aspect-square bg-black/50 flex items-center justify-center">
                        <canvas ref={canvasRef} className="w-full h-full" />
                        {!materialParams && !isGeneratingCube && (
                          <div className="absolute text-center">
                            <p className="text-gray-400 font-pixel">
                              ENTER A PROMPT AND CLICK GENERATE
                            </p>
                          </div>
                        )}
                        {isGeneratingCube && (
                          <AbstractShape
                            className="w-32 h-32 text-purple-500 absolute"
                            type="loading"
                            animate
                          />
                        )}
                      </div>

                      {activeTab === "cube" && variantPreviews.length > 0 && (
                        <div className="mt-6">
                          <PixelHeading
                            text="VARIATIONS"
                            className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                          />
                          <div className="grid grid-cols-3 gap-4">
                            {variantPreviews.map((variant, index) => (
                              <div
                                key={index}
                                className={`relative border-2 cursor-pointer transition-all ${
                                  materialParams === variant
                                    ? "border-purple-500 scale-105"
                                    : "border-purple-900/30"
                                }`}
                                onClick={() => setMaterialParams(variant)}
                                onMouseEnter={() => setCursorHover(true)}
                                onMouseLeave={() => setCursorHover(false)}
                              >
                                <img
                                  src={variant.preview}
                                  alt={`Variant ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {variant.description && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-xs text-center font-pixel text-white">
                                    {variant.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
    <PixelHeading
      text="MUSIC PREVIEW"
      className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
    />
    <div className="w-full aspect-square bg-black relative overflow-hidden flex items-center justify-center">
      {/* Enhanced Pixelated Gradient Border */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Pixelated Border - Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 flex">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`pixel-top-${i}`}
              className="h-full flex-1"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
          ))}
        </div>
        
        {/* Pixelated Border - Right */}
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-blue-500 via-pink-500 to-purple-600 flex flex-col">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`pixel-right-${i}`}
              className="w-full flex-1"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
          ))}
        </div>
        
        {/* Pixelated Border - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 flex">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`pixel-bottom-${i}`}
              className="h-full flex-1"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
          ))}
        </div>
        
        {/* Pixelated Border - Left */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 via-pink-500 to-purple-600 flex flex-col">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`pixel-left-${i}`}
              className="w-full flex-1"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
          ))}
        </div>
      </motion.div>

      {isGeneratingMusic ? (
        // ENHANCED LOADING ANIMATION - Replace the old loading state
        <div className="flex flex-col items-center justify-center h-full relative">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Pixelated Grid Background */}
          <div className="absolute inset-0 grid grid-cols-16 grid-rows-16 opacity-20 pointer-events-none">
            {[...Array(256)].map((_, i) => (
              <motion.div
                key={`grid-${i}`}
                className={`border border-purple-500/10 ${i % 7 === 0 ? 'bg-pink-500/5' : i % 13 === 0 ? 'bg-purple-500/5' : ''}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.001 }}
              />
            ))}
          </div>
          
          {/* Sound Wave Animation */}
          <div className="relative h-16 w-64 flex items-center justify-center mb-8">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                className="w-2 mx-0.5 bg-gradient-to-t from-purple-600 to-pink-500 rounded-sm"
                animate={{
                  height: [
                    `${Math.random() * 20 + 5}px`,
                    `${Math.random() * 60 + 20}px`,
                    `${Math.random() * 20 + 5}px`
                  ]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.05,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          <motion.div 
            className="relative z-10 px-6 py-4 bg-black border border-purple-500/50 rounded-md shadow-lg shadow-purple-500/20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="absolute -inset-px rounded-md bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-sm"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <div className="relative z-10">
              <div className="mb-3 flex items-center">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse mr-2"/>
                <p className="text-lg font-pixel text-white">GENERATING MUSIC</p>
              </div>
              
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 12, repeat: Infinity }}
                />
              </div>
              
              <p className="mt-3 text-sm text-gray-400 font-pixel">
                Crafting "{musicTitle}" for you...
              </p>
            </div>
          </motion.div>
        </div>
      ) : musicGeneration ? (
        (musicGeneration.status === "SUCCESS" ||
          musicGeneration.status === "completed") &&
        musicGeneration.audio_url ? (
          // ENHANCED MUSIC PLAYER WITH ALBUM COVER - Replace success state
          <motion.div
            className="w-full h-full flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Dynamic Album Cover */}
            <div className="relative w-3/4 aspect-square mb-6 overflow-hidden">
              {/* Pixelated Backdrop */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none">
                {[...Array(144)].map((_, i) => (
                  <motion.div
                    key={`album-grid-${i}`}
                    className={`
                      ${(i % 7 === 0) ? 'bg-purple-900/40' : 
                        (i % 11 === 0) ? 'bg-pink-900/30' : 
                        (i % 13 === 0) ? 'bg-blue-900/20' : ''}
                    `}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.002 }}
                  />
                ))}
              </div>
              
              {/* Album Cover */}
              <motion.div 
                className="absolute inset-0 z-10 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 1 }}
              >
                {/* Audio Visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {audioRef.current && [...Array(20)].map((_, i) => (
                    <motion.div
                      key={`viz-${i}`}
                      className="absolute h-full w-1 bg-white/30"
                      style={{ 
                        left: `${(i / 20) * 100}%`,
                        transformOrigin: "bottom" 
                      }}
                      animate={{
                        scaleY: [0.1, 0.5, 0.8, 0.3, 0.1],
                        opacity: [0.3, 0.8, 0.3]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
                
                {/* Waveform Overlay */}
                <svg 
                  className="absolute inset-0 w-full h-full z-20 opacity-70"
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M0,50 Q25,30 50,50 T100,50"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.5"
                    fill="none"
                    animate={{
                      d: [
                        "M0,50 Q25,30 50,50 T100,50",
                        "M0,50 Q25,70 50,50 T100,50",
                        "M0,50 Q25,30 50,50 T100,50",
                      ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  />
                  <motion.path
                    d="M0,50 Q25,45 50,50 T100,50"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="0.5"
                    fill="none"
                    animate={{
                      d: [
                        "M0,50 Q25,45 50,50 T100,50",
                        "M0,50 Q25,55 50,50 T100,50",
                        "M0,50 Q25,45 50,50 T100,50",
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </svg>
                
                {/* Music Title & Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-30">
                  {/* Pixelated Title */}
                  <div className="mb-2 relative">
                    {musicTitle.split('').map((char, i) => (
                      <motion.span
                        key={`char-${i}`}
                        className="inline-block font-pixel text-3xl text-white font-black"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </motion.span>
                    ))}
                  </div>
                  
                  <motion.div
                    className="text-sm text-white/70 font-pixel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {musicStyle || "Ambient"}
                  </motion.div>
                  
                  {/* VOID Resonance Logo */}
                  <motion.div
                    className="absolute bottom-4 w-full text-center font-pixel text-xs text-white/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    VOID RESONANCE
                  </motion.div>
                </div>
                
                {/* Pixelated Scanlines */}
                <div className="absolute inset-0 z-40 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={`scanline-${i}`}
                      className="absolute w-full h-px bg-white/10"
                      style={{ top: `${(i / 20) * 100}%` }}
                      animate={{ opacity: [0.05, 0.1, 0.05] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1
                      }}
                    />
                  ))}
                </div>
                
                {/* Grain Texture */}
                <div 
                  className="absolute inset-0 z-50 mix-blend-overlay opacity-30"
                  style={{ 
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    backgroundSize: '120px'
                  }}
                />
              </motion.div>
              
              {/* Pixelated Border */}
              <div className="absolute inset-0 z-60 border-4 border-transparent pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 flex">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={`border-top-${i}`}
                      className="h-full flex-1"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.1, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 flex">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={`border-bottom-${i}`}
                      className="h-full flex-1"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.1, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
                <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-b from-blue-500 via-pink-500 to-purple-600 flex flex-col">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={`border-left-${i}`}
                      className="w-full flex-1"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.1, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
                <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-b from-blue-500 via-pink-500 to-purple-600 flex flex-col">
                  {[...Array(16)].map((_, i) => (
                    <motion.div
                      key={`border-right-${i}`}
                      className="w-full flex-1"
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ 
                        duration: 2, 
                        delay: i * 0.1, 
                        repeat: Infinity 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Pixelated Audio Player */}
            <div className="w-3/4 relative">
              {/* Glowing Background for Player */}
              <motion.div
                className="absolute -inset-1 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 opacity-70 blur-sm"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Custom Audio Player */}
              <div className="relative bg-black border border-purple-500/50 p-4 rounded-md">
                <audio
                  ref={audioRef}
                  src={musicGeneration.audio_url}
                  controls
                  className="w-full rounded-none appearance-none custom-audio-player"
                  style={{
                    background: 'transparent',
                    height: '40px',
                    // Add custom properties for the audio player styling
                    ['--seek-before-width' as string]: '0%',
                    ['--volume-before-width' as string]: '100%',
                    ['--buffered-width' as string]: '0%',
                  }}
                  onTimeUpdate={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    const percent = (audio.currentTime / audio.duration) * 100;
                    document.documentElement.style.setProperty('--seek-before-width', `${percent}%`);
                  }}
                  onLoadedMetadata={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    // Update duration display if you have one
                  }}
                />
                
                {/* Track Info Below Player */}
                <div className="mt-2 flex justify-between items-center text-xs text-purple-300 font-pixel">
                  <span>{musicTitle}</span>
                  <span>{musicStyle}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : musicGeneration.status === "failed" ? (
          // ENHANCED ERROR STATE
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="relative mb-4 mx-auto w-16 h-16 flex items-center justify-center"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full border-2 border-red-500 opacity-20"></div>
              <div className="absolute inset-2 rounded-full border-2 border-red-400 opacity-40"></div>
              <div className="absolute inset-4 rounded-full border-2 border-red-300 opacity-60"></div>
              <div className="w-6 h-6 bg-red-500 rounded-md rotate-45"></div>
            </motion.div>
            
            <h3 className="text-xl text-red-400 font-pixel mb-3">GENERATION FAILED</h3>
            <p className="text-gray-400 font-pixel px-8 max-w-md mx-auto">
              {musicGeneration.error || "Something went wrong with the music generation. Please try again with different parameters."}
            </p>
            <motion.button
              className="mt-4 px-4 py-2 bg-transparent border border-red-500 text-red-400 font-pixel"
              whileHover={{ scale: 1.05, borderColor: "#f43f5e", color: "#f43f5e" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMusicGeneration(null)}
            >
              TRY AGAIN
            </motion.button>
          </motion.div>
        ) : (
          // ENHANCED PROCESSING STATE - Better than showing "processing" text
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative mb-6">
              <motion.div 
                className="w-20 h-20 mx-auto border-2 border-transparent rounded-full"
                style={{
                  borderRightColor: "#a855f7",
                  borderTopColor: "#ec4899"
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              
              <motion.div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-transparent rounded-full"
                style={{
                  borderLeftColor: "#3b82f6",
                  borderBottomColor: "#a855f7"
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            <motion.div
              className="font-pixel text-xl bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PROCESSING MUSIC
            </motion.div>
            
            <div className="mt-4 font-pixel text-gray-400 text-sm">
              Status: {musicGeneration.status || "Generating"}
            </div>
            
            {/* Pixelated progress bar */}
            <div className="w-64 h-2 bg-gray-800 mx-auto mt-4 flex">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`progress-${i}`}
                  className="h-full flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    delay: i * 0.1, 
                    duration: 0.3, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 3
                  }}
                />
              ))}
            </div>
          </motion.div>
        )
      ) : (
        // ENHANCED INITIAL STATE - Empty state with better styling
        <div className="flex flex-col items-center justify-center h-full relative">
          {/* Animated Background Grid */}
          <div className="absolute inset-0 grid grid-cols-16 grid-rows-16 opacity-20">
            {[...Array(256)].map((_, i) => (
              <motion.div
                key={`empty-grid-${i}`}
                className="border border-purple-500/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.001 }}
              />
            ))}
          </div>
          
          {/* Animated Circles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute rounded-full border-2 border-purple-500/20"
              style={{ 
                width: 150 + (i * 50), 
                height: 150 + (i * 50),
              }}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.2, 0.4, 0.2],
                rotate: 360,
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                opacity: { duration: 3, repeat: Infinity },
                rotate: { duration: 20 + (i * 5), repeat: Infinity, ease: "linear" },
                scale: { duration: 4 + i, repeat: Infinity }
              }}
            />
          ))}
          
          {/* Central Content */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 font-pixel mb-4">
              CRAFT YOUR SOUND
            </h2>
            
            <p className="text-lg text-gray-300 font-pixel">
              Generate unique music for your collection
            </p>
            
            {/* Animated Waveform */}
            <div className="mt-8 h-16 flex items-center justify-center">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`startup-wave-${i}`}
                  className="w-2 mx-0.5 bg-gradient-to-t from-purple-600 to-pink-500 rounded-sm"
                  style={{ height: i % 2 === 0 ? "20px" : "10px" }}
                  animate={{
                    height: [
                      i % 2 === 0 ? "20px" : "10px",
                      i % 2 === 0 ? "8px" : "16px",
                      i % 2 === 0 ? "20px" : "10px"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            
            {/* Pixel art music note */}
            <div className="mt-8 mx-auto w-16 h-16 relative">
              <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500 rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-4 h-12 bg-purple-500"></div>
              <div className="absolute bottom-0 left-4 w-12 h-4 bg-purple-500"></div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  </>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      {/* How it works section - Enhanced with pixel styling and animations */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="mt-20 mb-20 container mx-auto px-4"
      >
        <div className="text-center mb-12">
          <PixelHeading
            text="HOW IT WORKS"
            className="text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6 font-pixel"
          />
          {/* Pixelated separator line */}
          <div className="flex justify-center space-x-1 mb-4">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`pixel-separator-${i}`}
                className="w-2 h-2 bg-purple-500"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 * i }}
              />
            ))}
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto font-pixel text-sm">
            Follow these steps to create your unique digital assets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative">
          {/* Connecting dot line in background (only visible on md and larger screens) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 transform -translate-y-1/2 z-0">
            {/* Animated particle moving along the line */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 top-1/2 transform -translate-y-1/2"
              animate={{
                x: ["0%", "100%"],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Step 1 */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="bg-black/50 border border-purple-500/40 p-6 rounded-lg relative overflow-hidden group z-10"
            onMouseEnter={() => setCursorHover(true)}
            onMouseLeave={() => setCursorHover(false)}
          >
            {/* Pixel border animation */}
            <div className="absolute inset-0 border border-purple-500/0 group-hover:border-purple-500/30 transition-colors duration-300">
              <motion.div
                className="absolute top-0 right-0 w-8 h-[2px] bg-purple-500"
                animate={{
                  x: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.1,
                }}
              />
              <motion.div
                className="absolute top-0 right-0 h-8 w-[2px] bg-purple-500"
                animate={{
                  y: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.2,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-8 h-[2px] bg-purple-500"
                animate={{
                  x: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.3,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-8 w-[2px] bg-purple-500"
                animate={{
                  y: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.4,
                }}
              />
            </div>

            {/* Step number with pixelated background */}
            <div className="relative mb-6">
              <div className="absolute -top-2 -left-2 w-16 h-16 grid grid-cols-4 grid-rows-4 gap-[2px]">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={`pixel-bg-1-${i}`}
                    className={`w-full h-full ${
                      i % 2 === 0 ? "bg-purple-900/30" : "bg-transparent"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  />
                ))}
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-purple-900/70 relative">
                <motion.span
                  className="text-2xl text-purple-400 font-pixel z-10"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  1
                </motion.span>
              </div>
            </div>

            <motion.h4
              className="text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-pixel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              DESCRIBE
            </motion.h4>

            <motion.p
              className="text-gray-400 text-sm font-pixel leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Enter a detailed prompt for your 3D cube or music track. The more
              specific you are, the better the AI will understand your vision.
            </motion.p>

            {/* Decorative pixels */}
            <div className="absolute bottom-2 right-2 grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`decor-1-${i}`}
                  className="bg-purple-500"
                  animate={{
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="bg-black/50 border border-pink-500/40 p-6 rounded-lg relative overflow-hidden group z-10"
            onMouseEnter={() => setCursorHover(true)}
            onMouseLeave={() => setCursorHover(false)}
          >
            {/* Pixel border animation */}
            <div className="absolute inset-0 border border-pink-500/0 group-hover:border-pink-500/30 transition-colors duration-300">
              <motion.div
                className="absolute top-0 right-0 w-8 h-[2px] bg-pink-500"
                animate={{
                  x: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.15,
                }}
              />
              <motion.div
                className="absolute top-0 right-0 h-8 w-[2px] bg-pink-500"
                animate={{
                  y: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.25,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-8 h-[2px] bg-pink-500"
                animate={{
                  x: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.35,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-8 w-[2px] bg-pink-500"
                animate={{
                  y: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.45,
                }}
              />
            </div>

            {/* Step number with pixelated background */}
            <div className="relative mb-6">
              <div className="absolute -top-2 -left-2 w-16 h-16 grid grid-cols-4 grid-rows-4 gap-[2px]">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={`pixel-bg-2-${i}`}
                    className={`w-full h-full ${
                      i % 2 === 0 ? "bg-pink-900/30" : "bg-transparent"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  />
                ))}
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-pink-900/70 relative">
                <motion.span
                  className="text-2xl text-pink-400 font-pixel z-10"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  2
                </motion.span>
              </div>
            </div>

            <motion.h4
              className="text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-pixel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              GENERATE
            </motion.h4>

            <motion.p
              className="text-gray-400 text-sm font-pixel leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Our AI technology transforms your ideas into stunning 3D cubes
              with advanced textures and animations, or unique music tracks
              based on your specifications.
            </motion.p>

            {/* Animated cube simulation */}
            <div className="absolute bottom-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
              <motion.div
                className="w-10 h-10 border-[1px] border-pink-500 relative"
                animate={{
                  rotateY: [0, 180, 360],
                  rotateX: [0, 45, 0],
                  boxShadow: [
                    "0 0 0px rgba(236, 72, 153, 0)",
                    "0 0 8px rgba(236, 72, 153, 0.8)",
                    "0 0 0px rgba(236, 72, 153, 0)",
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <motion.div
                  className="absolute inset-2 bg-pink-500/30"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            className="bg-black/50 border border-blue-500/40 p-6 rounded-lg relative overflow-hidden group z-10"
            onMouseEnter={() => setCursorHover(true)}
            onMouseLeave={() => setCursorHover(false)}
          >
            {/* Pixel border animation */}
            <div className="absolute inset-0 border border-blue-500/0 group-hover:border-blue-500/30 transition-colors duration-300">
              <motion.div
                className="absolute top-0 right-0 w-8 h-[2px] bg-blue-500"
                animate={{
                  x: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.2,
                }}
              />
              <motion.div
                className="absolute top-0 right-0 h-8 w-[2px] bg-blue-500"
                animate={{
                  y: [100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.3,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 w-8 h-[2px] bg-blue-500"
                animate={{
                  x: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.4,
                }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-8 w-[2px] bg-blue-500"
                animate={{
                  y: [-100, 0],
                  opacity: [0, 1],
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.5,
                }}
              />
            </div>

            {/* Step number with pixelated background */}
            <div className="relative mb-6">
              <div className="absolute -top-2 -left-2 w-16 h-16 grid grid-cols-4 grid-rows-4 gap-[2px]">
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={`pixel-bg-3-${i}`}
                    className={`w-full h-full ${
                      i % 2 === 0 ? "bg-blue-900/30" : "bg-transparent"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  />
                ))}
              </div>
              <div className="w-12 h-12 flex items-center justify-center bg-blue-900/70 relative">
                <motion.span
                  className="text-2xl text-blue-400 font-pixel z-10"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  3
                </motion.span>
              </div>
            </div>

            <motion.h4
              className="text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-pixel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              MINT & COLLECT
            </motion.h4>

            <motion.p
              className="text-gray-400 text-sm font-pixel leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Mint your creation as an NFT to add to your collection. Own unique
              digital assets that can be displayed, traded, or used within the
              VOID ecosystem.
            </motion.p>

            {/* Animated coin/NFT icon */}
            <div className="absolute bottom-3 right-3 opacity-60 group-hover:opacity-100 transition-opacity">
              <motion.div
                className="w-10 h-10 border-2 border-blue-500 relative"
                animate={{
                  rotateY: [0, 360],
                  boxShadow: [
                    "0 0 0px rgba(59, 130, 246, 0)",
                    "0 0 8px rgba(59, 130, 246, 0.8)",
                    "0 0 0px rgba(59, 130, 246, 0)",
                  ],
                }}
                transition={{
                  rotateY: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <motion.div
                  className="absolute inset-1 bg-blue-500/30"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-400 font-pixel text-[8px]">
                    NFT
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Interactive hint */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
        </motion.div>
      </motion.div>

      <Footer />
    </div>
  );
}
