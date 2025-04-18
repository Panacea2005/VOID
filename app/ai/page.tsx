// page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Navigation from "@/components/navigation";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { generateCubeSkin, adjustColorBrightness, generateProceduralTexture } from "../ai/aiService";
import { Connection } from "@solana/web3.js";
import { mockMintNFT, convertCubeToFile, mintRealNFT } from "@/lib/services/mockNftService";

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
}

export default function AIPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("cube");
  const [materialParams, setMaterialParams] = useState<MaterialParams | null>(null);
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
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [variantPreviews, setVariantPreviews] = useState<MaterialParams[]>([]);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await generateCubeSkin({ prompt });

      // Tạo preview cho material chính
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 200;
      previewCanvas.height = 200;
      const previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, alpha: true });
      const previewScene = new THREE.Scene();
      const previewCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      previewCamera.position.z = 2;

      const previewCube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        createMaterialFromParams(response.materialParams)
      );
      previewScene.add(previewCube);
      previewRenderer.render(previewScene, previewCamera);

      // Lưu preview vào material params
      const mainMaterialParams = {
        ...response.materialParams,
        preview: previewCanvas.toDataURL()
      };

      // Cập nhật material params chính
      setMaterialParams(mainMaterialParams);

      // Đợi một chút để đảm bảo material được áp dụng
      await new Promise(resolve => setTimeout(resolve, 100));

      // Sau đó mới tạo các variants
      await generateVariants();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Hàm helper để tạo material từ params
  const createMaterialFromParams = (params: MaterialParams): THREE.Material => {
    if (params.texturePattern === 'stripes') {
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
          color1: { value: new THREE.Color(params.gradientColors?.[0] || params.color || "#ffffff") },
          color2: { value: new THREE.Color(params.gradientColors?.[1] || "#000000") },
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
        normalScale: params.normalScale ? new THREE.Vector2(params.normalScale, params.normalScale) : new THREE.Vector2(1, 1),
        clearcoat: params.clearcoat ?? 0,
        clearcoatRoughness: params.clearcoatRoughness ?? 0.1,
        anisotropy: params.anisotropy ?? 0,
        displacementScale: params.displacementScale ?? 0,
        transmission: params.transmission ?? 0,
        sheen: params.sheen ?? 0,
        sheenColor: params.sheenColor ? new THREE.Color(params.sheenColor) : new THREE.Color("#ffffff"),
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
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await generateCubeSkin({ prompt });
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
        let h = 0, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0; // grayscale
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
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
          return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      // Tính màu đối xứng
      const [h, s, l] = rgbToHsl(baseColor);
      const complementaryColorTrue = hslToRgb((h + 0.5) % 1, s, l);
      const analogousColor1 = hslToRgb((h + 0.1) % 1, s, l);
      const analogousColor2 = hslToRgb((h - 0.1 + 1) % 1, s, l);

      // Kiểm tra nếu prompt có từ "stripes" thì đảm bảo texture được áp dụng
      if (prompt.toLowerCase().includes("stripes") && !baseParams.map) {
        const secondaryColor = prompt.toLowerCase().includes("white stripes") ? "#ffffff" :
          prompt.toLowerCase().includes("black stripes") ? "#000000" :
            prompt.toLowerCase().includes("red stripes") ? "#ff0000" :
              prompt.toLowerCase().includes("gold stripes") ? "#ffcc00" :
                "#808080"; // Default gray stripes if no color specified

        baseParams.texturePattern = "stripes";
        baseParams.map = generateProceduralTexture("stripes", 1024, { // Tăng resolution texture
          color: baseParams.color,
          secondaryColor: secondaryColor
        });

        // Ghi đè lên secondaryColor trong baseParams để các variants có thể sử dụng
        baseParams.secondaryColor = secondaryColor;
      }

      // Tạo các biến thể với sự khác biệt rõ ràng về texture và animation
      const variantsBase: MaterialParams[] = [
        // Biến thể 1: Crystal - Trong suốt với màu từ prompt
        {
          ...baseParams,
          roughness: 0.05,  // Bề mặt cực nhẵn
          metalness: 0.1,   // Chút kim loại cho phản chiếu
          transmission: 0.8, // Trong suốt
          ior: 1.8,         // Chỉ số khúc xạ cao như pha lê
          clearcoat: 1.0,   // Lớp phủ trong
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
          description: "Crystal"
        },

        // Biến thể 2: Metallic - Bề mặt kim loại sáng bóng
        {
          ...baseParams,
          gradientColors: [brightColor, baseColor],
          roughness: 0.05,  // Bề mặt cực nhẵn
          metalness: 1.0,   // Hoàn toàn kim loại
          clearcoat: 0.8,   // Lớp phủ sáng
          anisotropy: 0.7,  // Hiệu ứng kim loại đánh bóng theo hướng
          clearcoatRoughness: 0.1,
          emissive: brightColor,
          emissiveIntensity: 0.3,
          envMapIntensity: 2.2,
          showBorder: true,
          borderColor: brightColor,
          borderWidth: 1,
          description: "Chrome"
        },

        // Biến thể 3: Plasma - Phát sáng mạnh, hiệu ứng chảy plasma
        {
          ...baseParams,
          texturePattern: "plasma",
          map: baseParams.map || generateProceduralTexture("plasma", 1024, { color: baseColor }),
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
          description: "Plasma"
        },

        // Biến thể 4: Hologram - Cải tiến hoàn toàn
        {
          ...baseParams,
          customEffects: ["hologram"],
          transparent: true,
          opacity: 0.8,
          color: adjustColorBrightness(analogousColor1, 1.8), // Màu cơ bản sáng hơn
          gradientColors: [adjustColorBrightness(brightColor, 1.6), analogousColor1],
          roughness: 0.1,
          metalness: 0.9,
          emissive: adjustColorBrightness(brightColor, 2.0),
          emissiveIntensity: 3.0, // Tăng mạnh độ phát sáng
          animationType: "rotate",
          animationSpeed: 0.04, // Tốc độ xoay phù hợp hơn
          showBorder: true,
          borderColor: adjustColorBrightness(brightColor, 2.0), // Viền sáng hơn
          borderWidth: 1.5, // Viền đậm hơn
          description: "Hologram"
        },

        // Biến thể 5: Carbon Fiber - Cải tiến hoàn toàn
        {
          ...baseParams,
          texturePattern: "carbon",
          // Sử dụng màu cơ bản sáng hơn nhiều cho texture
          map: baseParams.map || generateProceduralTexture("carbon", 1024, {
            color: adjustColorBrightness(darkColor, 2.2)
          }),
          // Tạo normal map mạnh hơn cho hiệu ứng 3D sâu hơn
          normalMap: generateProceduralTexture("carbon_normal", 1024, {
            color: adjustColorBrightness(darkColor, 1.8)
          }),
          // Tạo displacement map mạnh hơn
          displacementMap: generateProceduralTexture("carbon_disp", 1024, {
            color: adjustColorBrightness(baseColor, 1.4)
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
          description: "Carbon"
        },

        // Biến thể 6: Nebula - Hiệu ứng không gian màu sắc
        {
          ...baseParams,
          gradientColors: [analogousColor1, complementaryColorTrue],
          texturePattern: "nebula",
          map: baseParams.map || generateProceduralTexture("nebula", 1024, { color: baseColor }),
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
          description: "Nebula"
        }
      ];

      // Đảm bảo rằng các khác biệt về rotation rõ ràng hơn
      const rotationSettings = [
        { x: 0.2, y: 0.4, z: 0 },
        { x: 0.5, y: 0.2, z: 0.1 },
        { x: 0.4, y: 0.6, z: 0 },
        { x: 0.3, y: 0.5, z: 0.2 },
        { x: 0.6, y: 0.3, z: 0.1 },
        { x: 0.4, y: 0.4, z: 0.1 }
      ];

      // Tạo previews cho từng biến thể với độ chi tiết cao
      const variants = await Promise.all(variantsBase.map(async (variant, index) => {
        // Tạo preview cho biến thể với canvas lớn hơn và hỗ trợ độ phân giải cao
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 400; // Tăng kích thước để nét hơn
        previewCanvas.height = 400;
        const previewRenderer = new THREE.WebGLRenderer({
          canvas: previewCanvas,
          alpha: true,
          antialias: true,
          precision: 'highp'
        });
        previewRenderer.setPixelRatio(2); // Tăng pixel ratio cho sắc nét
        previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        previewRenderer.toneMappingExposure = 1.2;

        const previewScene = new THREE.Scene();
        // Thêm background gradient cho từng preview
        const colors = [
          ['#000000', '#1a0033'], // Crystal
          ['#000000', '#0d0d1a'], // Chrome
          ['#0a001a', '#1a0033'], // Plasma
          ['#000033', '#001a33'], // Hologram
          ['#0d0d0d', '#1a1a1a'], // Carbon
          ['#000022', '#1a0033']  // Nebula
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
            colorB: { value: new THREE.Color(colors[index][1]) }
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
            opacity: 0.7
          });
          const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
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
          radius: variant.description === "Crystal" || variant.description === "Hologram" ? 1.0 : 0.8 // Tăng radius cho Crystal và Hologram
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
          preview: previewCanvas.toDataURL('image/png', 0.95), // Tăng chất lượng export
          description: variant.description || "Custom" // Sử dụng mô tả đã có
        };
      }));

      setMaterialParams(variants[0]);
      setVariantPreviews(variants);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
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
      precision: 'highp',
      powerPreference: 'high-performance'
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
    rgbeLoader.load("/textures/studio_small_08_1k.hdr", (texture: THREE.DataTexture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = new THREE.Color('#000000'); // Đảm bảo nền đen hoàn toàn
    });

    // Tăng độ chi tiết của geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1, 128, 128, 128); // Tăng phân mảnh
    const material = new THREE.MeshPhysicalMaterial({
      color: "#666666",
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 1.0, // Tăng cường phản chiếu môi trường
      clearcoat: 0.3, // Thêm lớp phủ bóng
      clearcoatRoughness: 0.2
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
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
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
      radius: 0.8
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
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 15, Math.PI / 6, 0.5, 1);
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
                baseColor: { value: new THREE.Color(materialParams.color || materialParams.gradientColors?.[0] || "#ffffff") },
              },
              transparent: true,
              opacity: materialParams.opacity || 0.8,
            });

            // Áp dụng material mới
            if (cubeRef.current.material instanceof THREE.ShaderMaterial) {
              // Chỉ cập nhật uniforms nếu đã là shader material
              cubeRef.current.material.uniforms.time.value = timeRef.current * 0.5;
              cubeRef.current.material.uniforms.baseColor.value = new THREE.Color(
                materialParams.color || materialParams.gradientColors?.[0] || "#ffffff"
              );
            } else {
              // Thay thế hoàn toàn nếu chưa phải là shader material
              cubeRef.current.material = newHologramMaterial;
            }
          }

          // Điều chỉnh wireframe để hiển thị rõ hơn
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current.material as THREE.LineBasicMaterial;

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
            cubeRef.current.material.color.set(materialParams.color || "#ffea00");

            // Đặt màu phát sáng
            if (materialParams.emissive) {
              cubeRef.current.material.emissive.set(materialParams.emissive);
              cubeRef.current.material.emissiveIntensity = materialParams.emissiveIntensity || 0.5;
            }

            // Tăng cường hiệu ứng clearcoat để làm nổi bật màu sắc
            cubeRef.current.material.clearcoat = materialParams.clearcoat || 1.0;
            cubeRef.current.material.clearcoatRoughness = 0.1;

            // Đảm bảo độ bóng được áp dụng
            cubeRef.current.material.roughness = materialParams.roughness || 0.2;
            cubeRef.current.material.metalness = materialParams.metalness || 0.8;
          }

          // Điều chỉnh wireframe cho carbon
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current.material as THREE.LineBasicMaterial;
            wireMaterial.color.set(materialParams.borderColor || "#ffffee");
            wireMaterial.opacity = 0.8;
          }
        }

        // Hiệu ứng nhịp đập cải tiến
        if (materialParams?.animationType === "pulse" && materialParams.animateEmissive) {
          const material = cubeRef.current.material as THREE.MeshPhysicalMaterial;
          // Nhịp đập mạnh hơn với tần số cao
          const pulseValue = Math.sin(timeRef.current * 4) * 0.5 + 0.5;
          material.emissiveIntensity = (materialParams.emissiveIntensity || 0.2) * (0.7 + pulseValue * 1.2);

          // Thêm hiệu ứng scale theo nhịp
          const scaleValue = 1 + pulseValue * 0.03;
          cubeRef.current.scale.set(scaleValue, scaleValue, scaleValue);

          // Làm cho wireframe cũng nhấp nháy
          if (wireframeRef.current && wireframeRef.current.visible) {
            const wireMaterial = wireframeRef.current.material as THREE.LineBasicMaterial;
            wireMaterial.opacity = 0.3 + pulseValue * 0.7;
          }
        }

        // Hiệu ứng flow cải tiến
        if (materialParams?.animationType === "flow" && cubeRef.current.material instanceof THREE.ShaderMaterial) {
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
        if (materialParams?.texturePattern === "noise" || materialParams?.displacementScale) {
          const vibrationAmount = 0.005; // Tăng cường độ rung
          cubeRef.current.scale.x = 1 + Math.sin(timeRef.current * 12) * vibrationAmount;
          cubeRef.current.scale.y = 1 + Math.sin(timeRef.current * 14) * vibrationAmount;
          cubeRef.current.scale.z = 1 + Math.sin(timeRef.current * 16) * vibrationAmount;
        }

        // Hiệu ứng đặc biệt cho Crystal
        if (materialParams?.description === "Crystal") {
          // Hiệu ứng tỏa sáng từ bên trong
          const pulseValue = Math.sin(timeRef.current * 2.5) * 0.5 + 0.5;
          if (cubeRef.current.material instanceof THREE.MeshPhysicalMaterial) {
            // Tăng cường hiển thị màu 
            cubeRef.current.material.emissiveIntensity = (materialParams.emissiveIntensity || 0.4) * (0.6 + pulseValue * 1.8);
            // Điều chỉnh transmission theo thời gian
            cubeRef.current.material.transmission = (materialParams.transmission || 0.8) * (0.85 + pulseValue * 0.15);

            // Đảm bảo màu phát sáng cực mạnh theo màu của prompt
            if (materialParams.emissive) {
              const color = new THREE.Color(materialParams.emissive);
              // Làm sáng màu emissive dần dần theo thời gian
              const hsl = { h: 0, s: 0, l: 0 };
              color.getHSL(hsl);
              // Tăng độ sáng nhưng giữ nguyên màu sắc
              color.setHSL(hsl.h, hsl.s, Math.min(0.8, hsl.l + 0.2 * pulseValue));
              cubeRef.current.material.emissive.copy(color);
            }
          }
        }
      }

      // Cập nhật hiệu ứng bloom tùy theo material
      if (bloomEffectRef.current && materialParams) {
        if (materialParams.emissiveIntensity || materialParams.customEffects?.includes("hologram")) {
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
      cubeRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cubeRef.current.rotation.x));

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
  }, [materialParams]);

  useEffect(() => {
    if (!cubeRef.current || !wireframeRef.current || !materialParams) return;

    const cube = cubeRef.current;
    const wireframe = wireframeRef.current;

    const textureLoader = new THREE.TextureLoader();
    let newMaterial: THREE.Material;

    // Xử lý đặc biệt cho texture stripes
    if (materialParams.texturePattern === 'stripes') {
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
        texture.repeat.set(materialParams.textureScale || 1, materialParams.textureScale || 1);
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
          baseColor: { value: new THREE.Color(materialParams.color || "#7dd3fc") },
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
          color1: { value: new THREE.Color(materialParams.gradientColors?.[0] || materialParams.color || "#ffffff") },
          color2: { value: new THREE.Color(materialParams.gradientColors?.[1] || "#000000") },
        },
      });
    } else if (materialParams.gradientColors && materialParams.gradientColors.length >= 2) {
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
        normalScale: materialParams.normalScale ? new THREE.Vector2(materialParams.normalScale, materialParams.normalScale) : new THREE.Vector2(1, 1),
        clearcoat: materialParams.clearcoat ?? 0,
        clearcoatRoughness: materialParams.clearcoatRoughness ?? 0.1,
        anisotropy: materialParams.anisotropy ?? 0,
        displacementScale: materialParams.displacementScale ?? 0,
        transmission: materialParams.transmission ?? 0,
        sheen: materialParams.sheen ?? 0,
        sheenColor: materialParams.sheenColor ? new THREE.Color(materialParams.sheenColor) : new THREE.Color("#ffffff"),
      });

      if (materialParams.map) {
        textureLoader.load(materialParams.map, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).map = texture;
          texture.repeat.set(materialParams.textureScale || 1, materialParams.textureScale || 1);
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
          texture.repeat.set(materialParams.textureScale || 1, materialParams.textureScale || 1);
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
      bloomEffectRef.current.intensity = materialParams.emissiveIntensity ? materialParams.emissiveIntensity * 0.8 : 0;
    }
  }, [materialParams, hologramShader.fragmentShader, hologramShader.vertexShader,
    hologramShader.uniforms, flowShader.fragmentShader, flowShader.vertexShader,
    flowShader.uniforms, gradientShader.fragmentShader, gradientShader.vertexShader]);

  const handleMint = async () => {
    if (!materialParams) {
      console.error("Không có materialParams");
      return;
    }

    try {
      // Hiển thị trạng thái đang mint
      setIsGenerating(true);

      // 1. Chuyển canvas thành file PNG
      if (!canvasRef.current) {
        throw new Error("Canvas không tồn tại");
      }

      // Lấy tên và mô tả cho NFT
      const nftName = `VOID Cube ${new Date().getTime().toString().slice(-6)}`;
      const nftDescription = materialParams.description ||
        `A unique cube with ${materialParams.color || "custom"} color and ${materialParams.texturePattern || "special"
        } texture pattern.`;

      // Convert canvas to file
      const imageFile = await convertCubeToFile(canvasRef.current, nftName);
      console.log("Đã tạo file ảnh:", imageFile.name, imageFile.size);

      // 2. Chuẩn bị thuộc tính cho NFT
      const attributes = [
        { trait_type: "Color", value: materialParams.color || "Custom" },
        { trait_type: "Texture", value: materialParams.texturePattern || "None" },
        { trait_type: "Animation", value: materialParams.animationType || "None" }
      ];

      if (materialParams.metalness) {
        attributes.push({ trait_type: "Metalness", value: materialParams.metalness.toString() });
      }

      if (materialParams.roughness) {
        attributes.push({ trait_type: "Roughness", value: materialParams.roughness.toString() });
      }

      if (materialParams.emissiveIntensity) {
        attributes.push({ trait_type: "Glow", value: materialParams.emissiveIntensity.toString() });
      }

      // 3. Lấy thông tin màu sắc để tạo model 3D
      const colors = materialParams.gradientColors ||
        [materialParams.color || "#FFFFFF"];

      // 4. Mint NFT thật sử dụng Solana nếu có ví kết nối
      const wallet = window.solana;

      if (wallet && wallet.isConnected) {
        // Tạo kết nối Solana
        const connection = new Connection(
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
        );

        console.log("Bắt đầu mint NFT thật trên Solana");
        await mintRealNFT(
          connection,
          wallet,
          {
            name: nftName,
            description: nftDescription,
            attributes,
            colors
          },
          imageFile
        );

        alert("NFT đã được mint thành công trên Solana! Kiểm tra trong Profile và ví Phantom của bạn.");
      } else {
        // Sử dụng phương pháp mint giả lập nếu không có ví
        console.log("Không có ví kết nối, sử dụng mint giả lập");
        await mockMintNFT({
          name: nftName,
          description: nftDescription,
          image: imageFile,
          attributes
        });

        alert("NFT đã được tạo! Xem trong trang Profile của bạn.");
      }

      console.log("Mint NFT thành công");
    } catch (error: any) {
      console.error("Lỗi khi mint NFT:", error);
      alert(`Lỗi khi mint NFT: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
        animate={{
          x: cursorPosition.x - 16,
          y: cursorPosition.y - 16,
          scale: cursorHover ? 1.5 : 1,
        }}
        transition={{ type: "spring", damping: 10, mass: 0.1, stiffness: 100 }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      <Navigation />

      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-6"
            >
              <PixelHeading
                text="CREATOR"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                animate
              />
              <PixelHeading
                text="GENERATE UNIQUE DIGITAL ASSETS"
                className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300"
                animate
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light"
            >
              Create and mint custom 3D cubes with realistic textures and animations
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <Button
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-10 py-8 text-xl font-pixel tracking-wide transition-all duration-300"
                onClick={() => document.getElementById("creator")?.scrollIntoView({ behavior: "smooth" })}
              >
                START CREATING
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="creator" className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="cube" className="w-full" onValueChange={(value) => setActiveTab(value)}>
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
                </TabsList>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-black border border-purple-900/50 p-8">
                  <PixelHeading
                    text="DESIGN YOUR CUBE"
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-pixel">ENTER YOUR PROMPT</label>
                    <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="A glossy cube with a blue-to-purple gradient and pulsing glow..."
                      className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      {isGenerating ? (
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          GENERATING...
                        </>
                      ) : (
                        "Create 3D Cube"
                      )}
                    </Button>

                    <Button
                      onClick={handleMint}
                      disabled={isGenerating || !materialParams}
                      className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      MINT
                    </Button>
                  </div>

                  {materialParams && (
                    <div className="mt-6">
                      <PixelHeading
                        text="MATERIAL PROPERTIES"
                        className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />
                      <div className="text-gray-400 font-pixel text-sm grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-bold text-purple-400 mb-1">APPEARANCE:</p>
                          <p>
                            Type: {materialParams.description || "Standard"}
                          </p>
                          <p>
                            Color: {materialParams.gradientColors ?
                              `Gradient (${materialParams.gradientColors[0]} → ${materialParams.gradientColors[1]})` :
                              materialParams.color || "#FFFFFF"}
                          </p>
                          <p>Smoothness: {materialParams.roughness ? (1 - Number(materialParams.roughness)).toFixed(2) : "0.50"}</p>
                          <p>Metalness: {materialParams.metalness ? (Number(materialParams.metalness) * 100).toFixed(0) + "%" : "50%"}</p>
                          <p>Clearcoat: {materialParams.clearcoat ? (Number(materialParams.clearcoat)).toFixed(1) : "0.0"}</p>
                        </div>
                        <div>
                          <p className="font-bold text-purple-400 mb-1">EFFECTS:</p>
                          <p>Texture: {
                            materialParams.texturePattern === "circuit" ? "Circuit" :
                              materialParams.texturePattern === "marble" ? "Marble" :
                                materialParams.texturePattern === "noise" ? "Noise" :
                                  materialParams.texturePattern === "stripes" ? "Stripes" :
                                    materialParams.texturePattern === "plasma" ? "Plasma" :
                                      materialParams.texturePattern === "rust" ? "Rust" :
                                        (materialParams.proceduralTexture ? "Auto-generated" : "None")
                          }</p>
                          <p>Displacement: {materialParams.displacementScale || "0.0"}</p>
                          <p>Animation: {
                            materialParams.animationType === "pulse" ? "Pulse" :
                              materialParams.animationType === "flow" ? "Flow" :
                                materialParams.animationType === "rotate" ? "Rotate" :
                                  "None"
                          }</p>
                          <p>Emissive: {materialParams.emissiveIntensity ? (Number(materialParams.emissiveIntensity) * 100).toFixed(0) + "%" : "0%"}</p>
                          <p>Border: {materialParams.showBorder ? `${materialParams.borderWidth}px ${materialParams.borderColor}` : "None"}</p>
                        </div>
                      </div>
                      {materialParams.customEffects?.includes("hologram") && (
                        <p className="mt-2 text-purple-400 font-pixel text-sm">Special Effect: Hologram</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-black border border-purple-900/50 p-8">
                  <PixelHeading
                    text="3D PREVIEW"
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <div className="w-full aspect-square bg-black/50 flex items-center justify-center">
                    <canvas ref={canvasRef} className="w-full h-full" />
                    {!materialParams && !isGenerating && (
                      <div className="absolute text-center">
                        <p className="text-gray-400 font-pixel">ENTER A PROMPT AND CLICK GENERATE</p>
                      </div>
                    )}
                    {isGenerating && <AbstractShape className="w-32 h-32 text-purple-500 absolute" type="loading" animate />}
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
                            className={`relative border-2 cursor-pointer transition-all ${materialParams === variant ? "border-purple-500 scale-105" : "border-purple-900/30"
                              }`}
                            onClick={() => setMaterialParams(variant)}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            <img src={variant.preview} alt={`Variant ${index + 1}`} className="w-full h-full object-cover" />
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
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}