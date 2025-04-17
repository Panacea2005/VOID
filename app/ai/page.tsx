"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing";
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
import { generateCubeSkin, extractColor, adjustColorBrightness, generateProceduralTexture } from "../ai/aiService";
import { generateMusic, getMusicGenerationDetails } from "../ai/aiMusicService";

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
}

interface MusicGeneration {
  id: string;
  status: string;
  audio_url?: string;
  error?: string;
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
  const [materialParams, setMaterialParams] = useState<MaterialParams | null>(null);
  const [musicGeneration, setMusicGeneration] = useState<MusicGeneration | null>(null);
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
  const audioRef = useRef<HTMLAudioElement>(null);

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
      void main() {
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 baseColor;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (vPosition.x + vPosition.y + time));
        vec3 color = mix(baseColor, rainbow, fresnel);
        gl_FragColor = vec4(color, 0.6);
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
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vPosition;
      void main() {
        float flow = sin(vPosition.x * 2.0 + time) * cos(vPosition.y * 2.0 + time);
        float mixFactor = 0.5 + 0.5 * flow;
        vec3 color = mix(color1, color2, mixFactor);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color("#ffffff") },
      color2: { value: new THREE.Color("#000000") },
    },
  };

  const generateVariants = async () => {
    if (!cubePrompt.trim()) return;

    setIsGeneratingCube(true);

    try {
      const response = await generateCubeSkin({ prompt: cubePrompt });
      let baseParams = response.materialParams;

      const variants: MaterialParams[] = [
        { ...baseParams },
        {
          ...baseParams,
          gradientColors: baseParams.gradientColors
            ? baseParams.gradientColors.map((c) => adjustColorBrightness(c, 1.4))
            : baseParams.color
            ? [baseParams.color, adjustColorBrightness(baseParams.color, 0.8)]
            : ["#ffffff", "#cccccc"],
          emissive: baseParams.gradientColors ? baseParams.gradientColors[0] : baseParams.color || "#ffffff",
          emissiveIntensity: 1.8,
          animateEmissive: true,
          animationType: "pulse",
          envMapIntensity: (baseParams.envMapIntensity || 0.5) * 1.3,
        },
        {
          ...baseParams,
          gradientColors: baseParams.gradientColors
            ? baseParams.gradientColors.map((c) => adjustColorBrightness(c, 0.6))
            : baseParams.color
            ? [adjustColorBrightness(baseParams.color, 0.6), baseParams.color]
            : ["#666666", "#999999"],
          roughness: 0.9,
          clearcoat: 0,
          sheen: 0.8,
          sheenColor: baseParams.gradientColors ? baseParams.gradientColors[1] : baseParams.color || "#ffffff",
          texturePattern: baseParams.texturePattern || "marble",
          map: baseParams.map || (baseParams.color ? generateProceduralTexture("marble", 512, { color: baseParams.color }) : undefined),
        },
        {
          ...baseParams,
          gradientColors: baseParams.gradientColors
            ? baseParams.gradientColors.map((c) => adjustColorBrightness(c, 1.1))
            : baseParams.color
            ? [baseParams.color, adjustColorBrightness(baseParams.color, 1.1)]
            : ["#ffffff", "#eeeeee"],
          clearcoat: 1.2,
          clearcoatRoughness: 0.05,
          metalness: Math.min(1.0, (baseParams.metalness || 0.5) + 0.2),
          emissive: baseParams.gradientColors ? baseParams.gradientColors[0] : baseParams.color || "#ffffff",
          emissiveIntensity: 1.0,
          animationType: "none",
          texturePattern: baseParams.texturePattern || "circuit",
          map: baseParams.map || (baseParams.color ? generateProceduralTexture("circuit", 512, { color: baseParams.color }) : undefined),
        },
        {
          ...baseParams,
          gradientColors: baseParams.gradientColors
            ? baseParams.gradientColors
            : baseParams.color
            ? [baseParams.color, adjustColorBrightness(baseParams.color, 0.9)]
            : ["#ffffff", "#dddddd"],
          texturePattern: baseParams.texturePattern || "plasma",
          map: baseParams.map || (baseParams.color ? generateProceduralTexture("plasma", 512, { color: baseParams.color }) : undefined),
          textureScale: (baseParams.textureScale || 1.0) * 1.8,
          normalScale: (baseParams.normalScale || 0.8) * 1.5,
          emissive: baseParams.gradientColors ? baseParams.gradientColors[1] : baseParams.color || "#ffffff",
          emissiveIntensity: 2.0,
          animationType: "flow",
          animationSpeed: 0.05,
        },
        {
          ...baseParams,
          gradientColors: baseParams.gradientColors
            ? baseParams.gradientColors.map((c) => adjustColorBrightness(c, 0.8))
            : baseParams.color
            ? [adjustColorBrightness(baseParams.color, 0.8), baseParams.color]
            : ["#888888", "#bbbbbb"],
          roughness: 0.85,
          metalness: (baseParams.metalness || 0.5) * 0.8,
          texturePattern: baseParams.texturePattern || "rust",
          map: baseParams.map || (baseParams.color ? generateProceduralTexture("rust", 512, { color: baseParams.color }) : undefined),
          textureScale: (baseParams.textureScale || 1.0) * 2.0,
          displacementScale: (baseParams.displacementScale || 0.1) * 1.2,
          animationType: "none",
        },
      ];

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

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    const rgbeLoader = new RGBELoader();
    rgbeLoader.load("/textures/studio_small_08_1k.hdr", (texture: THREE.DataTexture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      color: "#666666",
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 0.5,
    });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: "#ffffff",
      linewidth: 5,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframeRef.current = wireframe;
    scene.add(wireframe);

    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    composer.addPass(new RenderPass(scene, camera));
    const bloomEffect = new BloomEffect();
    bloomEffectRef.current = bloomEffect;
    const effectPass = new EffectPass(camera, bloomEffect);
    composer.addPass(effectPass);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.0);
    spotLight.position.set(0, 3, 3);
    scene.add(spotLight);

    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.01;

      if (cubeRef.current && wireframeRef.current) {
        cubeRef.current.position.y = Math.sin(timeRef.current) * 0.1;
        if (!isDraggingRef.current) {
          cubeRef.current.rotation.y += 0.002;
          cubeRef.current.rotation.x += 0.001;
        }
        wireframeRef.current.position.copy(cubeRef.current.position);
        wireframeRef.current.rotation.copy(cubeRef.current.rotation);

        if (materialParams?.customEffects?.includes("hologram")) {
          const material = cubeRef.current.material as THREE.ShaderMaterial;
          material.uniforms.time.value = timeRef.current;
        }
        if (materialParams?.animationType === "pulse" && materialParams.animateEmissive) {
          const material = cubeRef.current.material as THREE.MeshPhysicalMaterial;
          material.emissiveIntensity = (materialParams.emissiveIntensity || 0.2) * (1 + 0.5 * Math.sin(timeRef.current));
        }
        if (materialParams?.animationType === "flow" && cubeRef.current.material instanceof THREE.ShaderMaterial) {
          const material = cubeRef.current.material;
          material.uniforms.time.value = timeRef.current;
        }
        if (materialParams?.animationType === "rotate") {
          cubeRef.current.rotation.y += (materialParams.animationSpeed || 0.03);
          cubeRef.current.rotation.x += (materialParams.animationSpeed || 0.03) * 0.5;
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
  }, []);

  useEffect(() => {
    if (!cubeRef.current || !wireframeRef.current || !materialParams) return;

    const cube = cubeRef.current;
    const wireframe = wireframeRef.current;

    let newMaterial: THREE.Material;

    if (materialParams.customEffects?.includes("hologram")) {
      newMaterial = new THREE.ShaderMaterial({
        vertexShader: hologramShader.vertexShader,
        fragmentShader: hologramShader.fragmentShader,
        uniforms: {
          ...hologramShader.uniforms,
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

      const textureLoader = new THREE.TextureLoader();
      if (materialParams.map) {
        textureLoader.load(materialParams.map, (texture) => {
          (newMaterial as THREE.MeshPhysicalMaterial).map = texture;
          texture.repeat.set(materialParams.textureScale || 1, materialParams.textureScale || 1);
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
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
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
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
  }, [materialParams]);

  const handleGenerateCube = async () => {
    if (!cubePrompt.trim()) return;

    setIsGeneratingCube(true);

    try {
      const response = await generateCubeSkin({ prompt: cubePrompt });
      setMaterialParams(response.materialParams);
      await generateVariants();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingCube(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicTitle.trim() || !musicStyle.trim() || (!isInstrumental && !musicPrompt.trim())) return;

    setIsGeneratingMusic(true);
    setMusicGeneration(null); // Reset music generation state

    try {
      console.log("isInstrumental value:", isInstrumental);
      const params = {
        prompt: musicPrompt,
        style: musicStyle,
        title: musicTitle,
        instrumental: isInstrumental === null || isInstrumental === undefined ? false : isInstrumental,
        customMode: true,
      };
      console.log("Calling generateMusic with params:", params);

      const response = await generateMusic(params);

      if (!response.id) {
        throw new Error("Failed to retrieve task ID from music generation response");
      }

      setMusicGeneration({ ...response, style: musicStyle });

      let pollAttempts = 0;
      const maxPollAttempts = 12; // 60 seconds total (5 seconds per poll)

      const pollStatus = async () => {
        try {
          // First, check the callback endpoint for the audio_url
          const callbackRes = await fetch(`/api/music/callback?taskId=${response.id}`);
          const callbackData = await callbackRes.json();

          if (!callbackRes.ok) {
            throw new Error(callbackData.error || "Failed to fetch callback data");
          }

          console.log("Fetched callback data:", callbackData);

          if (callbackData.audio_url) {
            // If the callback has the audio_url, use it and stop polling
            setMusicGeneration((prev) => prev ? { ...prev, ...callbackData, style: musicStyle } : null);
            clearInterval(pollingInterval);
            return;
          }

          // Fallback to getMusicGenerationDetails if the callback doesn't have the audio_url yet
          const details = await getMusicGenerationDetails(response.id);
          console.log("Polled music generation details:", details);
          setMusicGeneration({ ...details, style: musicStyle });

          if (details.status === "SUCCESS" || details.status === "completed") {
            clearInterval(pollingInterval);
            if (!details.audio_url && !callbackData.audio_url) {
              setMusicGeneration((prev) => (prev ? { ...prev, status: "failed", error: "Audio URL missing after successful generation", style: musicStyle } : null));
            }
          } else if (details.status === "failed") {
            clearInterval(pollingInterval);
            throw new Error(details.error || "Music generation failed");
          } else if (pollAttempts >= maxPollAttempts) {
            clearInterval(pollingInterval);
            setMusicGeneration((prev) => (prev ? { ...prev, status: "failed", error: "Timed out waiting for music generation to complete", style: musicStyle } : null));
          }
          pollAttempts++;
        } catch (error) {
          console.error("Error polling music generation status:", error);
          clearInterval(pollingInterval);
          const errorMessage = error instanceof Error ? error.message : String(error);
          setMusicGeneration((prev) => (prev ? { ...prev, status: "failed", error: errorMessage || "Failed to fetch music generation details", style: musicStyle } : null));
        }
      };

      const pollingInterval = setInterval(pollStatus, 5000);

      return () => clearInterval(pollingInterval);
    } catch (error) {
      console.error("Error generating music:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMusicGeneration({ id: "", status: "failed", error: errorMessage || "Failed to generate music", style: musicStyle });
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const handleMint = () => {
    if (activeTab === "cube" && materialParams) {
      console.log("Minting cube with material params:", materialParams);
    } else if (activeTab === "music" && musicGeneration?.audio_url) {
      console.log("Minting music with details:", musicGeneration);
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
              Create and mint custom 3D cubes or music with realistic textures and animations
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
                <div className="bg-black border border-purple-900/50 p-8">
                  {activeTab === "cube" ? (
                    <>
                      <PixelHeading
                        text="DESIGN YOUR CUBE"
                        className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />

                      <div className="mb-6">
                        <label className="block text-gray-300 mb-2 font-pixel">ENTER CUBE PROMPT</label>
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
                            "GENERATE CUBE VARIANTS"
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
                          <Label className="block text-gray-300 mb-2 font-pixel">MUSIC TITLE</Label>
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
                          <Label className="block text-gray-300 mb-2 font-pixel">MUSIC STYLE</Label>
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
                          <Label htmlFor="instrumental" className="text-gray-300 font-pixel">
                            Instrumental
                          </Label>
                        </div>

                        {!isInstrumental && (
                          <div>
                            <Label className="block text-gray-300 mb-2 font-pixel">MUSIC PROMPT</Label>
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
                            disabled={isGeneratingMusic || !musicGeneration?.audio_url}
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
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-purple-900/20 border border-purple-900/50 p-4 rounded-none font-pixel"
                      >
                        <div className="grid grid-cols-2 gap-4 text-gray-300">
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Color</span>
                            <span className="text-gray-200">
                              {materialParams.gradientColors
                                ? `${materialParams.gradientColors[0]} to ${materialParams.gradientColors[1]}`
                                : materialParams.color}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Metalness</span>
                            <span className="text-gray-200">{materialParams.metalness?.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Roughness</span>
                            <span className="text-gray-200">{materialParams.roughness?.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Animation</span>
                            <span className="text-gray-200">{materialParams.animationType || "None"}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Border</span>
                            <span className="text-gray-200">
                              {materialParams.showBorder
                                ? `${materialParams.borderWidth}px ${materialParams.borderColor}`
                                : "None"}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-purple-400 font-bold">Texture</span>
                            <span className="text-gray-200">
                              {materialParams.texturePattern || (materialParams.proceduralTexture ? "Procedural" : "None")}
                            </span>
                          </div>
                        </div>
                      </motion.div>
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
                            <p className="text-gray-400 font-pixel">ENTER A CUBE PROMPT AND CLICK GENERATE</p>
                          </div>
                        )}
                        {isGeneratingCube && <AbstractShape className="w-32 h-32 text-purple-500 absolute" type="loading" animate />}
                      </div>

                      {variantPreviews.length > 0 && (
                        <div className="mt-6">
                          <PixelHeading
                            text="VARIATIONS"
                            className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                          />
                          <div className="grid grid-cols-5 gap-4">
                            {variantPreviews.map((variant, index) => (
                              <div
                                key={index}
                                className={`border-2 cursor-pointer transition-all ${
                                  materialParams === variant ? "border-purple-500 scale-105" : "border-purple-900/30"
                                }`}
                                onClick={() => setMaterialParams(variant)}
                              >
                                <div className="p-1 aspect-square w-full relative">
                                  {variant.map || variant.proceduralTexture ? (
                                    <img
                                      src={variant.map || variant.proceduralTexture}
                                      alt="Texture Preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="absolute inset-0 bg-gradient-to-br"
                                      style={{
                                        background: variant.gradientColors
                                          ? `linear-gradient(to bottom right, ${variant.gradientColors[0]}, ${variant.gradientColors[1]})`
                                          : variant.color || "#666666",
                                      }}
                                    />
                                  )}
                                  {variant.showBorder && (
                                    <div
                                      className="absolute inset-0 border"
                                      style={{
                                        borderColor: variant.borderColor || "#ffffff",
                                        borderWidth: `${variant.borderWidth || 2}px`,
                                      }}
                                    />
                                  )}
                                  <span className="absolute bottom-1 right-1 text-xs font-pixel text-white">#{index + 1}</span>
                                </div>
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
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30 flex items-center justify-center relative overflow-hidden">
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            background: [
                              "radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, transparent 70%)",
                              "radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)",
                            ],
                          }}
                          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        >
                          <motion.div
                            className="absolute w-2 h-2 bg-purple-500 rounded-full"
                            style={{ top: "20%", left: "30%" }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute w-2 h-2 bg-pink-500 rounded-full"
                            style={{ top: "70%", left: "60%" }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          />
                          <motion.div
                            className="absolute w-2 h-2 bg-blue-500 rounded-full"
                            style={{ top: "40%", left: "80%" }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                          />
                        </motion.div>

                        {isGeneratingMusic ? (
                          <AbstractShape className="w-32 h-32 text-purple-500" type="loading" animate />
                        ) : musicGeneration ? (
                          (musicGeneration.status === "SUCCESS" || musicGeneration.status === "completed") && musicGeneration.audio_url ? (
                            <motion.div
                              className="text-center space-y-6 w-full max-w-md px-4"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <audio
                                ref={audioRef}
                                src={musicGeneration.audio_url}
                                controls
                                className="w-full rounded-none border-2 border-transparent bg-gradient-to-r from-purple-500 to-pink-500 p-1 shadow-lg hover:shadow-xl transition-shadow duration-300"
                              />
                              <div className="w-full h-16 bg-purple-900/50 rounded-md flex items-center justify-center">
                                <motion.div
                                  className="flex space-x-1"
                                  animate={{ y: [0, -5, 0] }}
                                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop" }}
                                >
                                  {[...Array(10)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-500"
                                      animate={{ height: [16, 32, 16] }}
                                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                  ))}
                                </motion.div>
                              </div>
                              <div className="flex justify-center">
                                <Button
                                  onClick={() => audioRef.current?.currentTime && (audioRef.current.currentTime = 0)}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-none px-6 py-2 font-pixel border-2 border-transparent hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-300"
                                  onMouseEnter={() => setCursorHover(true)}
                                  onMouseLeave={() => setCursorHover(false)}
                                >
                                  REWIND
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse">
                                  {musicTitle}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Style: {musicGeneration.style || "Unknown"}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Duration: {audioRef.current?.duration ? `${Math.floor(audioRef.current.duration / 60)}:${Math.floor(audioRef.current.duration % 60).toString().padStart(2, "0")}` : "Loading..."}
                                </p>
                              </div>
                            </motion.div>
                          ) : musicGeneration.status === "failed" ? (
                            <p className="text-red-500 font-pixel">Failed to generate music: {musicGeneration.error}</p>
                          ) : (
                            <p className="text-gray-400 font-pixel">Processing music generation... (Status: {musicGeneration.status})</p>
                          )
                        ) : (
                          <p className="text-gray-400 font-pixel">ENTER MUSIC DETAILS AND CLICK GENERATE</p>
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

      <Footer />
    </div>
  );
}