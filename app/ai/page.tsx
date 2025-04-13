"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import * as THREE from "three"
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from "postprocessing"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"
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
  normalMap?: string;
  roughnessMap?: string;
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
}

export default function AIPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("cube")
  const [materialParams, setMaterialParams] = useState<MaterialParams | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const wireframeRef = useRef<THREE.LineSegments | null>(null)
  const timeRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [variantPreviews, setVariantPreviews] = useState<MaterialParams[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
      baseColor: { value: new THREE.Color('#a3e7fc') },
    },
  };

  const generateVariants = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await generateCubeSkin({ prompt });
      const variants = [
        { ...response.materialParams },
        {
          ...response.materialParams,
          emissiveIntensity: (response.materialParams.emissiveIntensity || 0.2) * 1.5,
          roughness: Math.max(0.1, (response.materialParams.roughness || 0.5) - 0.2),
        },
        {
          ...response.materialParams,
          metalness: Math.min(1.0, (response.materialParams.metalness || 0.5) + 0.3),
          envMapIntensity: (response.materialParams.envMapIntensity || 0.5) * 1.3,
        },
        {
          ...response.materialParams,
          borderColor: response.materialParams.borderColor || '#ffffff',
          showBorder: true,
          borderWidth: 6,
        },
      ];

      setMaterialParams(variants[0]);
      setVariantPreviews(variants);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

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
    rgbeLoader.load('/textures/studio_small_08_1k.hdr', (texture: THREE.DataTexture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: '#4b0082',
      metalness: 0.5,
      roughness: 0.5,
      emissive: '#ff00ff',
      emissiveIntensity: 0.2,
      envMapIntensity: 0.5,
    });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: '#ffffff',
      linewidth: 5,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframeRef.current = wireframe;
    scene.add(wireframe);

    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    composer.addPass(new RenderPass(scene, camera));
    const bloomEffect = new BloomEffect();
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

        if (materialParams?.customEffects?.includes('hologramGlow')) {
          const material = cubeRef.current.material as THREE.ShaderMaterial;
          material.uniforms.time.value = timeRef.current;
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
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    animate();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!cubeRef.current || !wireframeRef.current || !materialParams) return;

    const cube = cubeRef.current;
    const wireframe = wireframeRef.current;

    let newMaterial: THREE.Material;

    if (materialParams.customEffects?.includes('hologramGlow')) {
      newMaterial = new THREE.ShaderMaterial({
        vertexShader: hologramShader.vertexShader,
        fragmentShader: hologramShader.fragmentShader,
        uniforms: {
          ...hologramShader.uniforms,
          baseColor: { value: new THREE.Color(materialParams.color || '#a3e7fc') },
        },
        transparent: true,
        opacity: materialParams.opacity ?? 0.6,
      });
    } else if (materialParams.gradientColors && materialParams.gradientColors.length === 2) {
      newMaterial = new THREE.ShaderMaterial({
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
          color1: { value: new THREE.Color(materialParams.gradientColors[0]) },
          color2: { value: new THREE.Color(materialParams.gradientColors[1]) },
        },
      });
    } else {
      newMaterial = new THREE.MeshStandardMaterial({
        color: materialParams.color || '#4b0082',
        metalness: materialParams.metalness ?? 0.5,
        roughness: materialParams.roughness ?? 0.5,
        emissive: materialParams.emissive || '#000000',
        emissiveIntensity: materialParams.emissiveIntensity ?? 0.2,
        transparent: materialParams.transparent ?? false,
        opacity: materialParams.opacity ?? 1.0,
        envMapIntensity: materialParams.envMapIntensity ?? 0.5,
        bumpScale: materialParams.bumpScale ?? 0.0,
        normalScale: materialParams.normalScale ? new THREE.Vector2(materialParams.normalScale, materialParams.normalScale) : new THREE.Vector2(1, 1),
      });

      const textureLoader = new THREE.TextureLoader();
      if (materialParams.map) {
        textureLoader.load(materialParams.map, (texture) => {
          (newMaterial as THREE.MeshStandardMaterial).map = texture;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.normalMap) {
        textureLoader.load(materialParams.normalMap, (texture) => {
          (newMaterial as THREE.MeshStandardMaterial).normalMap = texture;
          newMaterial.needsUpdate = true;
        });
      }
      if (materialParams.roughnessMap) {
        textureLoader.load(materialParams.roughnessMap, (texture) => {
          (newMaterial as THREE.MeshStandardMaterial).roughnessMap = texture;
          newMaterial.needsUpdate = true;
        });
      }
    }

    cube.material = newMaterial;

    const wireframeMaterial = wireframe.material as THREE.LineBasicMaterial;
    wireframeMaterial.color.set(materialParams.borderColor || '#ffffff');
    wireframeMaterial.linewidth = materialParams.borderWidth || 5;
    wireframeMaterial.needsUpdate = true;
    wireframe.visible = materialParams.showBorder ?? false;
  }, [materialParams]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await generateCubeSkin({ prompt });
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
              Create and mint AI-generated 3D cubes with realistic textures
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
                      placeholder="A holographic cube with rainbow shine and thick blue borders..."
                      className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={generateVariants}
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
                        "GENERATE VARIANTS"
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
                    {isGenerating && (
                      <AbstractShape className="w-32 h-32 text-purple-500 absolute" type="loading" animate />
                    )}
                  </div>

                  {activeTab === "cube" && variantPreviews.length > 0 && (
                    <div className="mt-6">
                      <PixelHeading
                        text="VARIATIONS"
                        className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                      />
                      <div className="grid grid-cols-4 gap-4">
                        {variantPreviews.map((variant, index) => (
                          <div
                            key={index}
                            className={`border-2 cursor-pointer transition-all ${
                              materialParams === variant ? 'border-purple-500 scale-105' : 'border-purple-900/30'
                            }`}
                            onClick={() => setMaterialParams(variant)}
                          >
                            <div className="p-1 aspect-square w-full relative">
                              <div
                                className="absolute inset-0 bg-gradient-to-br"
                                style={{
                                  background: variant.gradientColors
                                    ? `linear-gradient(to bottom right, ${variant.gradientColors[0]}, ${variant.gradientColors[1]})`
                                    : variant.color || '#4b0082',
                                }}
                              />
                              {variant.showBorder && (
                                <div
                                  className="absolute inset-0 border"
                                  style={{
                                    borderColor: variant.borderColor || '#ffffff',
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
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}