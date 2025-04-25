"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Label } from "@/components/ui/label";
import PixelHeading from "@/components/pixel-heading";
import { Connection } from "@solana/web3.js";
import { handlePixelArtMint } from "@/lib/services/pixelArtNftService";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { connected } from "process";

export default function PixelArtPage() {
  const [canvasSize, setCanvasSize] = useState(128);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [presetPrompts, setPresetPrompts] = useState([
    "A cyberpunk city skyline with neon lights",
    "An 8-bit fantasy hero character",
    "Retro space invaders arcade scene",
    "Pixel art sunset over mountains",
    "Cyberpunk samurai with glowing katana",
  ]);

  // Added for parallax scrolling effects
  const containerRef = useRef(null);

  const { publicKey, signTransaction, signAllTransactions, sendTransaction } =
    useWallet() as WalletContextState;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Handle cursor movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle main canvas initialization
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      // Set canvas dimensions
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Draw grid
      const gridSize = canvasSize;
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      // Fill with dark background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lighter, more subtle grid
      ctx.strokeStyle = "rgba(168, 85, 247, 0.07)"; // Very faint purple grid
      ctx.lineWidth = 1;

      for (let x = 0; x <= gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellWidth, 0);
        ctx.lineTo(x * cellWidth, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellHeight);
        ctx.lineTo(canvas.width, y * cellHeight);
        ctx.stroke();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [canvasSize]);

  // Handle download with a larger image size
  const handleDownload = () => {
    if (!generatedImageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create a temporary canvas to draw the image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize;
    tempCanvas.height = canvasSize;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the generated image
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = generatedImageUrl;
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, canvasSize, canvasSize);

      // Create a high-quality download canvas with a larger size
      const downloadSize = 2048; // Set to 2048x2048 for a "normal" image size
      const downloadCanvas = document.createElement("canvas");
      downloadCanvas.width = downloadSize;
      downloadCanvas.height = downloadSize;
      const downloadCtx = downloadCanvas.getContext("2d");
      if (!downloadCtx) return;

      // Draw the image, scaled up
      downloadCtx.imageSmoothingEnabled = false; // Preserve pixelated look
      downloadCtx.drawImage(tempCanvas, 0, 0, downloadSize, downloadSize);

      // Download the image without the grid to preserve colors
      const link = document.createElement("a");
      link.href = downloadCanvas.toDataURL("image/png", 1.0); // High quality
      link.download = `pixel-art-${downloadSize}x${downloadSize}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const handleMintPixelArt = async () => {
    if (!canvasRef.current || !generatedImageUrl) {
      alert("Please generate pixel art before minting.");
      return;
    }

    setIsGenerating(true); // Reuse the loading state

    try {
      // Check wallet connection first
      if (!connected || !publicKey) {
        alert("Please connect your wallet to mint as an NFT");
        setIsGenerating(false);
        return;
      }

      // Create RPC connection to Solana
      const endpoint =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com";
      const connection = new Connection(endpoint, "confirmed");

      // Create pixel art data
      const pixelArtData = {
        name: `VOID Pixel Art #${Math.floor(Math.random() * 9000 + 1000)}`,
        description: prompt
          ? `Pixel art created with prompt: ${prompt}`
          : "VOID Pixel Art NFT",
        prompt: prompt,
        canvasSize: canvasSize,
        attributes: [
          { trait_type: "Type", value: "Pixel Art" },
          { trait_type: "Resolution", value: `${canvasSize}x${canvasSize}` },
          { trait_type: "Collection", value: "VOID Art Collection" },
        ],
      };

      // Add loading message
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.font = "16px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "MINTING YOUR PIXEL ART...",
        canvas.width / 2,
        canvas.height / 2
      );

      // Call minting function
      const result = await handlePixelArtMint(
        canvasRef.current,
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions,
          sendTransaction,
        },
        pixelArtData
      );

      if (result.success) {
        alert(`NFT has been minted successfully! View it in your Profile.`);
      } else {
        if (result.error?.includes("saved locally")) {
          alert(
            "Wallet connection failed, but your pixel art has been saved locally. View it in your Profile."
          );
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("Error minting pixel art:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to mint pixel art: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle mint (placeholder)
  const handleMint = async () => {
    if (!canvasRef.current || !generatedImageUrl) {
      alert("Please generate pixel art before minting.");
      return;
    }

    try {
      setIsGenerating(true);

      // Create RPC connection to Solana
      const endpoint =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com";
      const connection = new Connection(endpoint, "confirmed");

      // Create pixel art data
      const pixelArtData = {
        name: `VOID Pixel Art #${Math.floor(Math.random() * 9000 + 1000)}`,
        description: prompt
          ? `Pixel art created with prompt: ${prompt}`
          : "VOID Pixel Art NFT",
        prompt: prompt,
        canvasSize: canvasSize,
        attributes: [
          { trait_type: "Type", value: "Pixel Art" },
          { trait_type: "Resolution", value: `${canvasSize}x${canvasSize}` },
          { trait_type: "Collection", value: "VOID Art Collection" },
        ],
      };

      // Call minting function
      const result = await handlePixelArtMint(
        canvasRef.current,
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions,
          sendTransaction,
        },
        pixelArtData
      );

      if (result.success) {
        alert(`NFT has been minted successfully! View it in your Profile.`);
      } else {
        if (result.error?.includes("saved locally")) {
          alert(
            "Your pixel art has been saved locally. Connect your wallet next time to mint it as an NFT."
          );
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("Error minting pixel art:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to mint pixel art: ${errorMessage}`);

      // Try to save locally if blockchain minting fails
      try {
        const reader = new FileReader();
        canvasRef.current?.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `pixel-art-${Date.now()}.png`, {
                type: "image/png",
              });
              reader.readAsDataURL(file);
              reader.onload = () => {
                // Save to localStorage
                const userNfts = JSON.parse(
                  localStorage.getItem("userNfts") || "[]"
                );

                userNfts.push({
                  id: `local-pixel-art-${Date.now()}`,
                  name: `VOID Pixel Art #${Math.floor(
                    Math.random() * 9000 + 1000
                  )}`,
                  description: prompt
                    ? `Pixel art created with prompt: ${prompt}`
                    : "VOID Pixel Art NFT",
                  image: reader.result,
                  properties: {
                    pixelArtParams: {
                      prompt: prompt,
                      canvasSize: canvasSize,
                    },
                  },
                  attributes: [
                    { trait_type: "Type", value: "Pixel Art" },
                    {
                      trait_type: "Resolution",
                      value: `${canvasSize}x${canvasSize}`,
                    },
                    { trait_type: "Collection", value: "VOID Art Collection" },
                  ],
                  mintedAt: new Date().toISOString(),
                  type: "pixel-art",
                  collection: {
                    name: "VOID Art Collection",
                    family: "VOID Art",
                  },
                  local: true,
                });

                localStorage.setItem("userNfts", JSON.stringify(userNfts));
                alert(
                  "Blockchain minting failed, but your pixel art has been saved locally. View it in your Profile."
                );
              };
            }
          },
          "image/png",
          1.0
        );
      } catch (localError) {
        console.error("Error with local storage fallback:", localError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate pixel art and reveal pixel by pixel
  const generatePixelArt = async () => {
    if (!canvasRef.current || !prompt) return;
    setIsGenerating(true);
    setErrorMessage("");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("canvasSize", canvasSize.toString());

      const response = await fetch("/api/generate-pixel-art", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch from API route");
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImageUrl(imageUrl);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasSize;
        tempCanvas.height = canvasSize;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCtx.drawImage(img, 0, 0, canvasSize, canvasSize);
        const imageData = tempCtx.getImageData(
          0,
          0,
          canvasSize,
          canvasSize
        ).data;
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cellWidth = canvas.width / canvasSize;
        const cellHeight = canvas.height / canvasSize;
        const pixelCount = canvasSize * canvasSize;
        const pixelIndices = Array.from({ length: pixelCount }, (_, i) => i);
        for (let i = pixelCount - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pixelIndices[i], pixelIndices[j]] = [
            pixelIndices[j],
            pixelIndices[i],
          ];
        }
        let pixelIndex = 0;
        // Adjusted pixelsPerFrame for faster reveal on larger sizes
        const pixelsPerFrame =
          canvasSize >= 256
            ? Math.max(500, Math.floor((canvasSize * canvasSize) / 500)) // Increased for 256, 512, 1024
            : Math.max(100, Math.floor((canvasSize * canvasSize) / 1000)); // Original for 64, 128
        const reveal = () => {
          for (let i = 0; i < pixelsPerFrame && pixelIndex < pixelCount; i++) {
            const idx = pixelIndices[pixelIndex];
            const x = idx % canvasSize;
            const y = Math.floor(idx / canvasSize);
            const r = imageData[idx * 4];
            const g = imageData[idx * 4 + 1];
            const b = imageData[idx * 4 + 2];
            const a = imageData[idx * 4 + 3];
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            pixelIndex++;
          }
          if (pixelIndex < pixelCount) {
            setTimeout(() => requestAnimationFrame(reveal), 10);
          } else {
            setIsGenerating(false);
          }
        };
        requestAnimationFrame(reveal);
      };
      img.onerror = () => {
        throw new Error("Failed to load generated image");
      };
    } catch (error: any) {
      console.error("Error generating pixel art:", error);
      const displayError = error.message.includes("Authentication error")
        ? "API Error: Invalid API key or permissions"
        : error.message.includes("Rate limit exceeded")
        ? "API Error: Rate limit exceeded, try again later"
        : error.message.includes("Stability API error")
        ? `API Error: ${
            error.message.split(" - ")[1] || "Invalid request parameters"
          }`
        : "Failed to generate pixel art";
      setErrorMessage(displayError);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px 'Press Start 2P'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `ERROR: ${displayError}`,
        canvas.width / 2,
        canvas.height / 2
      );
      setIsGenerating(false);
    }
  };

  // Handle preset prompt selection
  const handlePresetPrompt = (preset: string) => {
    setPrompt(preset);
  };

  // 3D Banner for Pixel Art Page - Using exact structure from About banner
  const PixelArtBanner = () => {
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
                  duration: 20 + 5 * 5,
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
              text="PIXEL ART"
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
              text="AI-POWERED CREATOR"
              className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300 relative"
              animate
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-10 mb-12 font-light font-pixel"
          >
            Generate unique pixel art with advanced AI and mint as NFTs
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
              SCROLL TO CREATE
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

  // Custom cursor component
  const CustomCursor = () => {
    return (
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
    );
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black text-white relative pixel-art-page"
    >
      {/* Custom cursor */}
      <CustomCursor />

      <Navigation />

      {/* Enhanced Banner Section */}
      <PixelArtBanner />

      {/* Main Creation Section */}
      <section id="creator" className="relative py-20 min-h-screen">
        {/* Parallax background layers */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
          style={{ y: bgY1 }}
        >
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-900/30 blur-3xl" />
          <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-pink-900/20 blur-3xl" />
        </motion.div>

        {/* Secondary parallax layer */}
        <motion.div
          className="absolute inset-0 z-0 grid grid-cols-12 grid-rows-12 gap-px opacity-10 pointer-events-none"
          style={{ y: bgY2 }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`grid-bg-${i}`}
              className={`bg-gray-700`}
              initial={{ opacity: 0.05 }}
              animate={{
                opacity: [0.05, i % 5 === 0 ? 0.2 : 0.05, 0.05],
                backgroundColor:
                  i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <PixelHeading
                text="CREATE YOUR MASTERPIECE"
                className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                animate
              />
              <p className="text-gray-400 max-w-2xl mx-auto font-pixel">
                Generate stunning pixel art using AI and your imagination.
                Describe your vision and watch it come to life pixel by pixel.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Control Panel */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/50 rounded-lg p-8 shadow-lg shadow-purple-500/10"
              >
                <h3 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6 font-pixel">
                  DESCRIBE YOUR PIXEL ART IDEA
                </h3>

                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-gray-400 font-pixel">
                    Canvas Size:
                  </p>
                  <div
                    className="flex items-center space-x-2 bg-black/50 border border-purple-500/30 rounded px-3 py-2"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    {[64, 128, 256, 512, 1024].map((size) => (
                      <button
                        key={size}
                        onClick={() => setCanvasSize(size)}
                        className={`px-2 py-1 text-xs rounded font-pixel ${
                          canvasSize === size
                            ? "bg-purple-600 text-white"
                            : "bg-black/50 text-gray-400 hover:bg-purple-900/30"
                        } transition-colors`}
                        disabled={isGenerating}
                      >
                        {size}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="block text-gray-300 mb-3 font-pixel">
                    YOUR VISION
                  </Label>
                  <textarea
                    className="w-full h-40 bg-black/50 border border-purple-500/50 rounded-md p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-pixel"
                    placeholder="Enter your pixel art idea (e.g., a cyberpunk city at night with neon signs)..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  />
                </div>

                {/* Preset Prompts */}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3 font-pixel">
                    INSPIRATION:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {presetPrompts.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => handlePresetPrompt(preset)}
                        className="bg-black/30 border border-purple-500/30 hover:border-purple-500/70 text-left p-3 rounded-md text-gray-300 text-sm transition-colors font-pixel"
                        disabled={isGenerating}
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-transparent text-white border-2 border-purple-500 hover:bg-purple-500/20 rounded-none px-6 py-6 font-pixel uppercase tracking-wider relative overflow-hidden group mb-4"
                  onClick={generatePixelArt}
                  disabled={isGenerating || !prompt}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/30 to-purple-600/0"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                  />
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
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
                    </div>
                  ) : (
                    "GENERATE PIXEL ART"
                  )}
                </Button>

                <div className="flex space-x-4">
                  <Button
                    className="w-1/2 bg-transparent text-white border-2 border-pink-500 hover:bg-pink-500/20 rounded-none px-6 py-3 font-pixel uppercase tracking-wider"
                    onClick={handleDownload}
                    disabled={!generatedImageUrl || isGenerating}
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    DOWNLOAD
                  </Button>
                  <Button
                    className="w-1/2 bg-transparent text-white border-2 border-cyan-500 hover:bg-cyan-500/20 rounded-none px-6 py-3 font-pixel uppercase tracking-wider"
                    onClick={handleMint}
                    disabled={isGenerating || !generatedImageUrl}
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MINT NFT
                  </Button>
                </div>

                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded">
                    <p className="text-xs text-red-400 text-center font-pixel">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Canvas Display */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <div className="relative w-full aspect-square rounded-lg border-4 border-purple-500/50 overflow-hidden shadow-lg shadow-purple-500/20 bg-black/70">
                  <canvas ref={canvasRef} className="w-full h-full" />

                  {/* Empty state */}
                  {!generatedImageUrl && !isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-2 border-dashed border-purple-500 rounded mb-4"></div>
                      <p className="text-gray-400 text-sm text-center max-w-xs font-pixel">
                        YOUR PIXEL ART WILL APPEAR HERE
                      </p>
                    </div>
                  )}

                  {/* Loading state */}
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Pixel loading animation */}
                        <div className="grid grid-cols-4 grid-rows-4 gap-1 opacity-80">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <motion.div
                              key={`loading-pixel-${i}`}
                              className="w-3 h-3"
                              style={{
                                backgroundColor: [
                                  "#a855f7",
                                  "#ec4899",
                                  "#60a5fa",
                                ][i % 3],
                              }}
                              animate={{
                                opacity: [0.2, 1, 0.2],
                                scale: [1, 1.2, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.05,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Canvas border effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-purple-600/70 rounded-lg"></div>
                    <motion.div
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-purple-600/50 rounded-b-sm"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        boxShadow: [
                          "0 0 5px rgba(168, 85, 247, 0.5)",
                          "0 0 10px rgba(168, 85, 247, 0.8)",
                          "0 0 5px rgba(168, 85, 247, 0.5)",
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    ></motion.div>
                  </div>
                </div>

                {/* Canvas controls info */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 font-pixel">
                    {generatedImageUrl
                      ? "CLICK AND DRAG TO ROTATE VIEW"
                      : "GENERATE YOUR FIRST PIXEL MASTERPIECE"}
                  </p>
                </div>

                {/* Generation Info */}
                {generatedImageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mt-6 p-4 bg-black/50 border border-purple-500/30 rounded"
                  >
                    <h4 className="text-sm text-purple-400 mb-2 font-pixel">
                      GENERATION INFO:
                    </h4>
                    <p className="text-xs text-gray-400 font-pixel">
                      Canvas size: {canvasSize}x{canvasSize} pixels
                      <br />
                      Total pixels: {canvasSize * canvasSize}
                      <br />
                      Format: PNG (lossless)
                      <br />
                      Download size: 2048x2048 pixels
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* How it works section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="mt-20"
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
                  Follow these steps to create your own unique pixel masterpiece
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
                    Enter a detailed description of the pixel art you want to
                    create. The more specific, the better the results.
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
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.3,
                        }}
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
                    Our AI transforms your description into stunning pixel art,
                    constructed one pixel at a time in a visually engaging
                    animation.
                  </motion.p>

                  {/* Animated pixel generation simulation */}
                  <div className="absolute bottom-4 right-4 w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="grid grid-cols-5 grid-rows-5 gap-[1px] w-full h-full">
                      {[...Array(25)].map((_, i) => (
                        <motion.div
                          key={`generate-pixel-${i}`}
                          className="bg-pink-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: i * 0.04,
                            repeat: Infinity,
                            repeatDelay: 1.5,
                          }}
                        />
                      ))}
                    </div>
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
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: 0.6,
                        }}
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
                    MINT & SHARE
                  </motion.h4>

                  <motion.p
                    className="text-gray-400 text-sm font-pixel leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    Download your creation in high resolution or mint it as an
                    NFT to showcase in your digital collection.
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
          </div>
        </div>
      </section>

      <Footer />

      {/* Global style for pixel font */}
      <style jsx global>{`
        .font-pixel {
          font-family: "Press Start 2P", cursive;
        }

        /* Apply pixel font to specific elements in the pixel art page */
        .pixel-art-page h3,
        .pixel-art-page h4,
        .pixel-art-page p,
        .pixel-art-page button,
        .pixel-art-page textarea,
        .pixel-art-page label,
        .pixel-art-page span {
          font-family: "Press Start 2P", cursive;
        }
      `}</style>
    </div>
  );
}
