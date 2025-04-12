"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import * as THREE from "three"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { generateCubeSkin } from "../ai/aiService"

interface MaterialParams {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: string;
  gradientColors?: string[];
  borderColor?: string;
  borderWidth?: number;
  transparent?: boolean;
  opacity?: number;
  bumpScale?: number;
  normalScale?: number;
  animateEmissive?: boolean;
}

export default function AIPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("cube")
  const [materialParams, setMaterialParams] = useState<MaterialParams | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const wireframeRef = useRef<THREE.LineSegments | null>(null)
  const timeRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const gradientShader = {
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      varying vec3 vPosition;
      void main() {
        float mixFactor = (vPosition.y + 0.5) / 1.0;
        vec3 color = mix(color1, color2, mixFactor);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    uniforms: {
      color1: { value: new THREE.Color('#ff00ff') },
      color2: { value: new THREE.Color('#00ffcc') },
    },
  };

  // Procedural bump map simulation
  const generateBumpMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y < 256; y++) {
        const value = Math.random() * 255;
        context.fillStyle = `rgb(${value}, ${value}, ${value})`;
        context.fillRect(x, y, 1, 1);
      }
    }
    return new THREE.CanvasTexture(canvas);
  };

  // Procedural normal map simulation
  const generateNormalMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d')!;
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y < 256; y++) {
        const r = 128 + Math.sin(x * 0.1) * 127;
        const g = 128 + Math.cos(y * 0.1) * 127;
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const gradientTexture = new THREE.CanvasTexture(generateGradientCanvas());
    scene.background = gradientTexture;

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const geometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: '#4b0082',
      metalness: 0.9,
      roughness: 0.1,
      emissive: '#ff00ff',
      emissiveIntensity: 0.3,
      transparent: false,
      opacity: 1.0,
    });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    const wireframeGeometry = new THREE.EdgesGeometry(geometry, 1);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: '#00ffcc',
      linewidth: 3,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 1.0,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.renderOrder = 1;
    wireframeRef.current = wireframe;
    cube.add(wireframe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    const onMouseDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !cubeRef.current) return;

      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      cubeRef.current.rotation.y += deltaX * 0.005;
      cubeRef.current.rotation.x += deltaY * 0.005;

      cubeRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cubeRef.current.rotation.x));

      previousMousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.01;

      if (cubeRef.current) {
        cubeRef.current.position.y = Math.sin(timeRef.current) * 0.1;
        if (!isDraggingRef.current) {
          cubeRef.current.rotation.y += 0.005;
          cubeRef.current.rotation.x += 0.003;
        }

        if (materialParams?.animateEmissive) {
          const material = cubeRef.current.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = materialParams.emissiveIntensity! * (1 + 0.3 * Math.sin(timeRef.current));
          material.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [materialParams]);

  useEffect(() => {
    if (!cubeRef.current || !wireframeRef.current || !materialParams) return;

    const cube = cubeRef.current;
    const wireframe = wireframeRef.current;

    if (materialParams.gradientColors && materialParams.gradientColors.length === 2) {
      const shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: gradientShader.vertexShader,
        fragmentShader: gradientShader.fragmentShader,
        uniforms: {
          color1: { value: new THREE.Color(materialParams.gradientColors[0]) },
          color2: { value: new THREE.Color(materialParams.gradientColors[1]) },
        },
      });
      cube.material = shaderMaterial;
    } else {
      const newMaterial = new THREE.MeshStandardMaterial({
        color: materialParams.color || '#4b0082',
        metalness: materialParams.metalness ?? 0.9,
        roughness: materialParams.roughness ?? 0.1,
        emissive: materialParams.emissive || '#ff00ff',
        emissiveIntensity: materialParams.emissiveIntensity ?? 0.3,
        transparent: materialParams.transparent ?? false,
        opacity: materialParams.opacity ?? 1.0,
        bumpMap: materialParams.bumpScale ? generateBumpMap() : undefined,
        bumpScale: materialParams.bumpScale ?? 0,
        normalMap: materialParams.normalScale ? generateNormalMap() : undefined,
        normalScale: materialParams.normalScale ? new THREE.Vector2(materialParams.normalScale, materialParams.normalScale) : undefined,
      });

      if (materialParams.map) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(materialParams.map, (texture) => {
          newMaterial.map = texture;
          newMaterial.needsUpdate = true;
          cube.material = newMaterial;
        });
      } else {
        cube.material = newMaterial;
      }
    }

    (wireframe.material as THREE.LineBasicMaterial).color.set(materialParams.borderColor || '#00ffcc');
    (wireframe.material as THREE.LineBasicMaterial).linewidth = materialParams.borderWidth || 3;
    (wireframe.material as THREE.LineBasicMaterial).needsUpdate = true;
  }, [materialParams]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await generateCubeSkin({
        prompt,
      });
      setMaterialParams(response.materialParams);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  const handleMint = () => {
    console.log("Minting AI creation with material params:", materialParams);
  }

  const generateGradientCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(1, '#000000');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    return canvas;
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

        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-purple-800/20"></div>
            ))}
          </div>

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g opacity="0.2">
              {[...Array(10)].map((_, i) => (
                <line
                  key={`line1-${i}`}
                  x1={10 + i * 8}
                  y1="20"
                  x2={50 + (i - 5) * 10}
                  y2="50"
                  stroke="#a855f7"
                  strokeWidth="0.5"
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <line
                  key={`line2-${i}`}
                  x1={50 + (i - 5) * 10}
                  y1="50"
                  x2={10 + i * 8}
                  y2="80"
                  stroke="#ec4899"
                  strokeWidth="0.5"
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node1-${i}`} cx={10 + i * 8} cy="20" r="1.5" fill="#a855f7" />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node2-${i}`} cx={50 + (i - 5) * 10} cy="50" r="1.5" fill="#ec4899" />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node3-${i}`} cx={10 + i * 8} cy="80" r="1.5" fill="#a855f7" />
              ))}
            </g>
          </svg>

          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-radial from-pink-500/10 to-transparent animate-pulse-slow delay-1000"></div>
          </div>
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
                text="AI CREATOR"
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
              Create and mint AI-generated 3D cubes and music with your prompts
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO CREATE</p>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="40" stroke="#a855f7" strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                fill="#ec4899"
              />
            </svg>
          </div>
        </motion.div>
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
                  <PixelHeading
                    text={activeTab === "cube" ? "DESIGN YOUR CUBE" : "COMPOSE YOUR SOUND"}
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-pixel">ENTER YOUR PROMPT</label>
                    <div className="relative">
                      <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          activeTab === "cube"
                            ? "A cube with red faces, black borders, and a glossy plastic texture..."
                            : "Ambient synthwave with deep bass and ethereal pads..."
                        }
                        className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      />
                    </div>
                  </div>

                  {activeTab === "music" && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">GENRE</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="ambient">AMBIENT</option>
                          <option value="synthwave">SYNTHWAVE</option>
                          <option value="cyberpunk">CYBERPUNK</option>
                          <option value="glitch">GLITCH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">DURATION</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="30">30 SECONDS</option>
                          <option value="60">1 MINUTE</option>
                          <option value="120">2 MINUTES</option>
                          <option value="180">3 MINUTES</option>
                        </select>
                      </div>
                    </div>
                  )}

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
                        "GENERATE"
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
                </div>

                <div className="bg-black border border-purple-900/50 p-8">
                  <PixelHeading
                    text={activeTab === "cube" ? "3D PREVIEW" : "AUDIO PREVIEW"}
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  {activeTab === "cube" ? (
                    <div className="w-full aspect-square bg-black/50 border-2 border-purple-900/50 flex items-center justify-center">
                      <canvas ref={canvasRef} className="w-full h-full" />
                      {!materialParams && !isGenerating && (
                        <div className="absolute text-center">
                          <p className="text-gray-400 font-pixel">ENTER A PROMPT AND CLICK GENERATE</p>
                        </div>
                      )}
                      {isGenerating && (
                        <AbstractShape className="w-32 h-32 text-purple-500 absolute" type="loading" animate />
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-black/50 border-2 border-purple-900/50 flex flex-col items-center justify-center">
                      {isGenerating ? (
                        <AbstractShape className="w-32 h-32 text-purple-500" type="loading" animate />
                      ) : (
                        <div className="text-center">
                          <AbstractShape className="w-40 h-40 mx-auto text-purple-500/50" type="wave" animate />
                          <p className="text-gray-400 mt-4 font-pixel">ENTER A PROMPT AND CLICK GENERATE</p>
                          <audio ref={audioRef} controls className="mt-6 hidden"></audio>
                          <Button
                            className="mt-4 bg-transparent border border-blue-500 hover:bg-blue-950/30 text-blue-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide hidden"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            DOWNLOAD AUDIO
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="INSPIRATION GALLERY"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black border border-purple-900/50 p-4 group hover:border-purple-500 transition-colors duration-300"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <div className="aspect-square bg-black/50 mb-4 overflow-hidden">
                    <AbstractShape
                      className={`w-full h-full ${
                        index % 3 === 0
                          ? "text-purple-500/70"
                          : index % 3 === 1
                            ? "text-pink-500/70"
                            : "text-blue-500/70"
                      }`}
                      type={
                        index % 2 === 0
                          ? "complex"
                          : index % 5 === 1
                            ? "grid"
                            : index % 5 === 2
                              ? "wave"
                              : index % 5 === 3
                                ? "dots"
                                : "noise"
                      }
                      animate
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 font-pixel">
                      {index % 2 === 0 ? "CUBE" : "MUSIC"} #{index + 1}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 font-pixel">
                      {index % 2 === 0
                        ? "Neon cyberpunk cube with glitchy textures"
                        : "Ambient synthwave with deep bass"}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-400 font-pixel">BY VOID_USER</span>
                      <Button
                        className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none px-2 py-1 text-xs font-pixel tracking-wide"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        REMIX
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <PixelHeading
                text="CREATE YOUR DIGITAL LEGACY"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">
                MINT YOUR CREATIONS AND JOIN THE VOID MARKETPLACE
              </p>

              <Button
                asChild
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-12 py-8 text-2xl font-pixel tracking-wide transition-all duration-300"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <Link href="/market">EXPLORE MARKETPLACE</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}