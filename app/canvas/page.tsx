"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useWallet } from "@solana/wallet-adapter-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { cn } from "@/lib/utils";

import {
  getAllPixels,
  placePixel,
  getPixelsByWalletAddress,
} from "@/lib/supabase/pixelCanvasService";
import { getProfileByWalletAddress } from "@/lib/supabase/profileService";
import { PixelData } from "@/lib/supabase/pixelCanvasService";

const CANVAS_WIDTH = 100; // Pixels wide
const CANVAS_HEIGHT = 100; // Pixels tall
const DEFAULT_PIXEL_SIZE = 8; // Default size of each pixel

// Enhanced predefined color palette
const COLORS = [
  // Purples and Pinks
  "#a855f7",
  "#8b5cf6",
  "#6d28d9",
  "#ec4899",
  "#be185d",
  "#db2777",
  // Blues
  "#3b82f6",
  "#1d4ed8",
  "#0ea5e9",
  "#0284c7",
  "#0369a1",
  // Greens
  "#22c55e",
  "#15803d",
  "#16a34a",
  "#84cc16",
  "#4d7c0f",
  // Reds and Oranges
  "#ef4444",
  "#b91c1c",
  "#dc2626",
  "#f97316",
  "#ea580c",
  // Yellows
  "#eab308",
  "#ca8a04",
  "#facc15",
  "#fde047",
  // Neutrals
  "#ffffff",
  "#f3f4f6",
  "#d1d5db",
  "#9ca3af",
  "#6b7280",
  "#4b5563",
  "#000000",
];

// Gradient presets
const GRADIENT_PRESETS = [
  ["#2A7B9B", "#57C785", "#EDDD53"], // Blue-Green-Yellow
  ["#8B5CF6", "#EC4899"], // Purple-Pink
  ["#3B82F6", "#10B981"], // Blue-Green
  ["#F97316", "#FACC15"], // Orange-Yellow
  ["#EF4444", "#F97316"], // Red-Orange
  ["#6366F1", "#A855F7", "#EC4899"], // Indigo-Purple-Pink
];

// Interface for user activity on the canvas
interface UserActivity {
  walletAddress: string;
  username: string;
  pixelsPlaced: number;
  lastActive: string;
}

export default function CanvasPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [activeTab, setActiveTab] = useState("draw");
  const [pixelSize, setPixelSize] = useState(DEFAULT_PIXEL_SIZE);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [customColor, setCustomColor] = useState("#a855f7");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorHistory, setColorHistory] = useState<string[]>(
    COLORS.slice(0, 10)
  );
  const [pixels, setPixels] = useState<PixelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPixels, setUserPixels] = useState<PixelData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
    color: string;
  } | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [activeColorTab, setActiveColorTab] = useState("palette");
  const [selectedGradient, setSelectedGradient] = useState<string[]>(
    GRADIENT_PRESETS[0]
  );
  const [gradientPosition, setGradientPosition] = useState(0);
  const [refreshCanvas, setRefreshCanvas] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const { publicKey } = useWallet();
  const router = useRouter();
  const { toast } = useToast();

  // Handle click outside of color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add custom color to history
  const addToColorHistory = (color: string) => {
    if (!colorHistory.includes(color)) {
      setColorHistory((prev) => [color, ...prev.slice(0, 9)]);
    }
  };

  // Calculate color from gradient position
  const getColorFromGradient = (position: number) => {
    if (selectedGradient.length === 1) return selectedGradient[0];

    const segmentCount = selectedGradient.length - 1;
    const segmentLength = 100 / segmentCount;
    const segmentIndex = Math.min(
      Math.floor(position / segmentLength),
      segmentCount - 1
    );
    const segmentPosition =
      (position - segmentIndex * segmentLength) / segmentLength;

    const startColor = selectedGradient[segmentIndex];
    const endColor = selectedGradient[segmentIndex + 1];

    // Simple linear interpolation between colors
    const r1 = parseInt(startColor.slice(1, 3), 16);
    const g1 = parseInt(startColor.slice(3, 5), 16);
    const b1 = parseInt(startColor.slice(5, 7), 16);

    const r2 = parseInt(endColor.slice(1, 3), 16);
    const g2 = parseInt(endColor.slice(3, 5), 16);
    const b2 = parseInt(endColor.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * segmentPosition);
    const g = Math.round(g1 + (g2 - g1) * segmentPosition);
    const b = Math.round(b1 + (b2 - b1) * segmentPosition);

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Update selected color when gradient position changes
  useEffect(() => {
    if (activeColorTab === "gradient") {
      const color = getColorFromGradient(gradientPosition);
      setSelectedColor(color);
    }
  }, [gradientPosition, selectedGradient, activeColorTab]);

  // Effect for handling cursor movements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Effect for window size
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debug function to check canvas state
  const debugCanvas = () => {
    console.log("Current canvas pixels:", pixels);
    console.log("Current user pixels:", userPixels);
    console.log("Canvas width/height:", CANVAS_WIDTH, CANVAS_HEIGHT);
    console.log("Total pixels count:", pixels.length);
  };

  // Effect for loading canvas data
  useEffect(() => {
    const loadCanvas = async () => {
      setLoading(true);
      try {
        console.log("Fetching all pixels...");
        const allPixels = await getAllPixels();
        console.log("Fetched pixels:", allPixels);
        setPixels(allPixels);

        // Group pixels by wallet address to create user activity data
        const userMap = new Map<
          string,
          {
            pixelsPlaced: number;
            lastActive: string;
            username: string;
          }
        >();

        for (const pixel of allPixels) {
          const existing = userMap.get(pixel.wallet_address);

          if (existing) {
            existing.pixelsPlaced++;
            if (
              new Date(existing.lastActive) < new Date(pixel.updated_at || "")
            ) {
              existing.lastActive = pixel.updated_at || "";
            }
          } else {
            userMap.set(pixel.wallet_address, {
              pixelsPlaced: 1,
              lastActive: pixel.updated_at || "",
              username:
                pixel.username ||
                `User_${pixel.wallet_address.substring(0, 4)}`,
            });
          }
        }

        // Convert map to array and sort by pixels placed
        const userActivity = Array.from(userMap.entries()).map(
          ([walletAddress, data]) => ({
            walletAddress,
            username: data.username,
            pixelsPlaced: data.pixelsPlaced,
            lastActive: data.lastActive,
          })
        );

        userActivity.sort((a, b) => b.pixelsPlaced - a.pixelsPlaced);
        setUserActivities(userActivity);

        if (publicKey) {
          console.log("Fetching pixels for wallet:", publicKey.toString());
          const myPixels = await getPixelsByWalletAddress(publicKey.toString());
          console.log("User pixels:", myPixels);
          setUserPixels(myPixels);
        }

        // Debug the canvas after loading
        setTimeout(debugCanvas, 500);
      } catch (error) {
        console.error("Error loading canvas:", error);
        toast({
          title: "Error",
          description: "Failed to load the canvas. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCanvas();
  }, [publicKey, toast, refreshCanvas]); // Added refreshCanvas as dependency

  // Handle canvas clicking (placing pixels)
  const handleCanvasClick = async (x: number, y: number) => {
    if (!publicKey) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet to draw on the canvas.",
        variant: "default",
      });
      return;
    }

    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return; // Out of bounds
    }

    try {
      // Get user profile to link username
      const profile = await getProfileByWalletAddress(publicKey.toString());
      const username =
        profile?.username || `User_${publicKey.toString().substring(0, 4)}`;

      const newPixel: PixelData = {
        x,
        y,
        color: selectedColor,
        wallet_address: publicKey.toString(),
        username,
      };

      addToColorHistory(selectedColor);
      const result = await placePixel(newPixel);

      if (result) {
        // Update local state
        setPixels((prevPixels) => {
          const newPixels = [...prevPixels];
          const existingIndex = newPixels.findIndex(
            (p) => p.x === x && p.y === y
          );

          if (existingIndex >= 0) {
            newPixels[existingIndex] = result;
          } else {
            newPixels.push(result);
          }

          return newPixels;
        });

        // Update user's personal pixels
        setUserPixels((prev) => {
          const newUserPixels = [...prev];
          const existingIndex = newUserPixels.findIndex(
            (p) => p.x === x && p.y === y
          );

          if (existingIndex >= 0) {
            newUserPixels[existingIndex] = result;
          } else {
            newUserPixels.push(result);
          }

          return newUserPixels;
        });

        // Force a refresh
        setRefreshCanvas((prev) => prev + 1);

        toast({
          title: "Pixel placed!",
          description: `You placed a pixel at (${x}, ${y})`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error placing pixel:", error);
      toast({
        title: "Error",
        description: "Failed to place your pixel. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle mouse down for canvas dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || e.ctrlKey) {
      // Middle button, right button, or ctrl+click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Handle mouse move for canvas dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setPanOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (value: number[]) => {
    setPixelSize(value[0]);
  };

  // Reset pan and zoom
  const resetView = () => {
    setPanOffset({ x: 0, y: 0 });
    setPixelSize(DEFAULT_PIXEL_SIZE);
  };

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = (cx: number, cy: number) => {
    return {
      x: cx * pixelSize + panOffset.x,
      y: cy * pixelSize + panOffset.y,
    };
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = (sx: number, sy: number) => {
    if (!canvasRef.current) return { x: -1, y: -1 };

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((sx - rect.left - panOffset.x) / pixelSize);
    const y = Math.floor((sy - rect.top - panOffset.y) / pixelSize);

    return { x, y };
  };

  // Format date for readable display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get pixel at specific coordinates
  const getPixelAt = (x: number, y: number) => {
    return pixels.find((p) => p.x === x && p.y === y);
  };

  // Handle hovering over a canvas pixel
  const handlePixelHover = (e: React.MouseEvent) => {
    if (isDragging) return;

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
      const pixel = getPixelAt(x, y);
      if (pixel) {
        setHoveredPixel({
          x: pixel.x,
          y: pixel.y,
          color: pixel.color,
        });
      } else {
        setHoveredPixel({ x, y, color: "transparent" });
      }
    } else {
      setHoveredPixel(null);
    }
  };

  // Handle leaving the canvas
  const handleCanvasLeave = () => {
    setHoveredPixel(null);
  };

  // Get color distribution data
  const getColorDistribution = () => {
    if (!pixels || pixels.length === 0) return {};

    const distribution: Record<string, number> = {};

    pixels.forEach((pixel) => {
      if (!distribution[pixel.color]) {
        distribution[pixel.color] = 1;
      } else {
        distribution[pixel.color]++;
      }
    });

    // Sort by frequency
    const sortedEntries = Object.entries(distribution).sort(
      (a, b) => b[1] - a[1]
    );
    const sortedDistribution: Record<string, number> = {};

    sortedEntries.forEach(([color, count]) => {
      sortedDistribution[color] = count;
    });

    return sortedDistribution;
  };

  // Render pixel grid with current pixels
  const renderPixelGrid = () => {
    return (
      <div
        className="relative"
        style={{
          width: `${CANVAS_WIDTH * pixelSize}px`,
          height: `${CANVAS_HEIGHT * pixelSize}px`,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          cursor: isDragging ? "grabbing" : "crosshair",
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 bg-black opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px)",
            backgroundSize: `${pixelSize}px ${pixelSize}px`,
          }}
        />

        {/* Placed pixels */}
        {pixels.map((pixel) => (
          <div
            key={`${pixel.x}-${pixel.y}`}
            className="absolute border border-gray-900/10"
            style={{
              left: `${pixel.x * pixelSize}px`,
              top: `${pixel.y * pixelSize}px`,
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor: pixel.color,
              boxShadow: `inset 0 0 ${Math.max(
                1,
                pixelSize / 4
              )}px rgba(0,0,0,0.2)`,
            }}
            onClick={() => handleCanvasClick(pixel.x, pixel.y)}
          />
        ))}

        {/* Hovered pixel preview */}
        {hoveredPixel && (
          <div
            className="absolute border-2 border-white pointer-events-none"
            style={{
              left: `${hoveredPixel.x * pixelSize}px`,
              top: `${hoveredPixel.y * pixelSize}px`,
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
              backgroundColor:
                hoveredPixel.color === "transparent"
                  ? selectedColor
                  : hoveredPixel.color,
              opacity: 0.7,
              zIndex: 5,
            }}
          />
        )}
      </div>
    );
  };

  // Render modern color picker
  const renderColorPicker = () => {
    return (
      <div className="mb-6">
        <div className="bg-black/50 border border-purple-900/50 rounded-md p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-gray-300 text-sm font-pixel">COLOR</h4>

            {/* Current color display */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-gray-700"
                style={{ backgroundColor: selectedColor }}
              />
              <div className="font-mono text-sm text-gray-300 uppercase">
                {selectedColor}
              </div>
            </div>
          </div>

          {/* Color picker tabs */}
          <div className="mb-4 flex">
            <button
              className={`px-4 py-2 text-xs ${
                activeColorTab === "palette"
                  ? "bg-purple-900/50 text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveColorTab("palette")}
            >
              PALETTE
            </button>
            <button
              className={`px-4 py-2 text-xs ${
                activeColorTab === "gradient"
                  ? "bg-purple-900/50 text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveColorTab("gradient")}
            >
              GRADIENT
            </button>
            <button
              className={`px-4 py-2 text-xs ${
                activeColorTab === "picker"
                  ? "bg-purple-900/50 text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveColorTab("picker")}
            >
              CUSTOM
            </button>
            <button
              className={`px-4 py-2 text-xs ${
                activeColorTab === "history"
                  ? "bg-purple-900/50 text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveColorTab("history")}
            >
              HISTORY
            </button>
          </div>

          {/* Color palette tab content */}
          {activeColorTab === "palette" && (
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <motion.button
                  key={color}
                  className={`w-8 h-8 rounded-md ${
                    selectedColor === color ? "ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                />
              ))}
            </div>
          )}

          {/* Gradient selector tab content */}
          {activeColorTab === "gradient" && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {GRADIENT_PRESETS.map((gradient, index) => (
                  <button
                    key={index}
                    className={`h-8 rounded-md overflow-hidden ${
                      JSON.stringify(selectedGradient) ===
                      JSON.stringify(gradient)
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    onClick={() => setSelectedGradient(gradient)}
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(to right, ${gradient.join(
                          ", "
                        )})`,
                      }}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-2 relative h-8 rounded-md overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${selectedGradient.join(
                      ", "
                    )})`,
                  }}
                />
                <Slider
                  defaultValue={[0]}
                  min={0}
                  max={100}
                  step={1}
                  value={[gradientPosition]}
                  onValueChange={(value) => setGradientPosition(value[0])}
                  className="relative z-10"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>{selectedGradient[0]}</span>
                <span>{selectedGradient[selectedGradient.length - 1]}</span>
              </div>
            </div>
          )}

          {/* Custom color picker tab content */}
          {activeColorTab === "picker" && (
            <div>
              <div ref={colorPickerRef} className="mb-4">
                <HexColorPicker
                  color={customColor}
                  onChange={(color) => {
                    setCustomColor(color);
                    setSelectedColor(color);
                  }}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-300">#</div>
                <HexColorInput
                  color={customColor}
                  onChange={(color) => {
                    setCustomColor(color);
                    setSelectedColor(color);
                  }}
                  className="flex-1 bg-black/50 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                  prefixed={false}
                />
                <button
                  className="px-3 py-1 bg-purple-900/50 hover:bg-purple-900/80 text-purple-300 text-sm rounded"
                  onClick={() => addToColorHistory(customColor)}
                >
                  SAVE
                </button>
              </div>
            </div>
          )}

          {/* Color history tab content */}
          {activeColorTab === "history" && (
            <div className="flex flex-wrap gap-2">
              {colorHistory.map((color) => (
                <motion.button
                  key={color}
                  className={`w-8 h-8 rounded-md ${
                    selectedColor === color ? "ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                />
              ))}
              {colorHistory.length === 0 && (
                <div className="text-sm text-gray-400 py-2">
                  Your color history will appear here
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render color statistics
  const renderColorStats = () => {
    const distribution = getColorDistribution();
    const total = pixels.length;

    // Get top 15 colors
    const topColors = Object.entries(distribution).slice(0, 15);

    return (
      <div className="grid grid-cols-1 gap-4 mt-6">
        {topColors.map(([color, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={color} className="flex items-center">
              <div
                className="w-6 h-6 rounded-sm mr-2"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 bg-gray-800 h-4 rounded-sm overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    backgroundColor: color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="ml-2 text-sm font-pixel text-gray-300 w-24 text-right">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
          );
        })}

        {Object.keys(distribution).length > 15 && (
          <div className="text-center text-sm text-gray-400 mt-2">
            + {Object.keys(distribution).length - 15} more colors used
          </div>
        )}
      </div>
    );
  };

  // Render leaderboard
  const renderLeaderboard = () => {
    return (
      <div className="mt-6 border border-purple-900/50 overflow-hidden rounded-md">
        <div className="bg-purple-900/20 px-4 py-2 font-pixel text-white grid grid-cols-12">
          <div className="col-span-1 font-bold">#</div>
          <div className="col-span-4 font-bold">USER</div>
          <div className="col-span-4 font-bold">PIXELS</div>
          <div className="col-span-3 font-bold">LAST ACTIVE</div>
        </div>
        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-black/20">
          {userActivities.slice(0, 20).map((user, index) => (
            <div
              key={user.walletAddress}
              className="px-4 py-2 border-b border-purple-900/30 hover:bg-purple-900/10 transition-colors grid grid-cols-12 text-sm"
            >
              <div className="col-span-1 text-gray-400">{index + 1}</div>
              <div
                className="col-span-4 text-purple-400 truncate"
                title={user.walletAddress}
              >
                {user.username}
              </div>
              <div className="col-span-4 text-white">{user.pixelsPlaced}</div>
              <div className="col-span-3 text-gray-400">
                {formatDate(user.lastActive)}
              </div>
            </div>
          ))}

          {userActivities.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400">
              No activity recorded yet. Be the first to place a pixel!
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-gradient-to-b from-purple-950/20 via-black to-black text-white min-h-screen overflow-hidden font-pixel">
      {/* Animated background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Static stars */}
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              boxShadow:
                i % 5 === 0 ? `0 0 ${Math.random() * 3 + 1}px white` : "none",
            }}
          />
        ))}

        {/* Animated drifting stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`drift-star-${i}`}
            className="absolute rounded-full bg-white"
            animate={{
              x: [0, Math.random() * 20 - 10],
              y: [0, Math.random() * 20 - 10],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${Math.random() * 5 + 2}px rgba(255,255,255,0.7)`,
            }}
          />
        ))}

        {/* Nebula clouds */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.2) 0%, transparent 50%), 
                        radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 40%)`,
            filter: "blur(40px)",
          }}
        />
      </div>

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
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 z-0 h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AbstractShape
              className="w-full h-full text-purple-500/10"
              type="grid"
              animate
            />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <PixelHeading
                text="VOID CANVAS"
                className="text-7xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
              />
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                A collaborative pixel canvas where the VOID community creates
                art together. Connect your wallet, choose a color, and place
                your pixels.
              </p>
            </motion.div>
          </div>

          <div className="max-w-7xl mx-auto">
            <Tabs
              defaultValue="draw"
              className="w-full"
              onValueChange={(value) => setActiveTab(value)}
            >
              <div className="flex justify-center mb-10">
                <TabsList className="bg-black/50 backdrop-blur-sm border-2 border-purple-900 p-1 rounded-md">
                  <TabsTrigger
                    value="draw"
                    className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-300 data-[state=active]:backdrop-blur-sm rounded-md px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    DRAW
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-300 data-[state=active]:backdrop-blur-sm rounded-md px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    STATS
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Draw Tab */}
              <TabsContent value="draw" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Tools Panel */}
                  <div className="lg:col-span-1">
                    <div className="bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 rounded-md">
                      <h3 className="text-xl font-bold text-white mb-6 font-pixel flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        TOOLS
                      </h3>

                      {/* Color picker */}
                      {renderColorPicker()}

                      {/* Zoom controls */}
                      <div className="mb-6 bg-black/50 border border-purple-900/50 rounded-md p-4 backdrop-blur-sm">
                        <h4 className="text-gray-300 mb-4 text-sm flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                          ZOOM
                        </h4>
                        <Slider
                          defaultValue={[DEFAULT_PIXEL_SIZE]}
                          min={2}
                          max={20}
                          step={1}
                          value={[pixelSize]}
                          onValueChange={handleZoom}
                          className="mb-4"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>2px</span>
                          <span>20px</span>
                        </div>
                      </div>

                      {/* Reset view button */}
                      <Button
                        onClick={resetView}
                        className="w-full bg-purple-900/30 backdrop-blur-sm border border-purple-500/50 hover:bg-purple-900/50 text-purple-300 rounded-md px-4 py-3 text-sm font-pixel tracking-wide flex items-center justify-center gap-2"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path>
                          <path d="M8 8v8"></path>
                          <path d="M16 8v8"></path>
                          <path d="M12 8v8"></path>
                        </svg>
                        RESET VIEW
                      </Button>

                      {/* Instructions */}
                      <div className="mt-6 pt-6 border-t border-purple-900/30">
                        <h4 className="text-gray-300 mb-4 text-sm flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          INSTRUCTIONS
                        </h4>
                        <ul className="text-sm text-gray-300 space-y-3 bg-black/20 p-4 rounded-md border border-purple-900/30">
                          <li className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mr-2">
                              1
                            </div>
                            Click to place a pixel
                          </li>
                          <li className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mr-2">
                              2
                            </div>
                            CTRL + drag or middle-click to pan
                          </li>
                          <li className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mr-2">
                              3
                            </div>
                            Use the slider to zoom
                          </li>
                          <li className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center mr-2">
                              4
                            </div>
                            Connect wallet to save pixels
                          </li>
                        </ul>
                      </div>

                      {/* Canvas statistics */}
                      <div className="mt-6 pt-6 border-t border-purple-900/30">
                        <h4 className="text-gray-300 mb-4 text-sm flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                          </svg>
                          CANVAS INFO
                        </h4>
                        <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-md border border-purple-900/30">
                          <div className="text-sm">
                            <div className="text-gray-400 mb-1">Dimensions</div>
                            <div className="text-white font-bold">
                              {CANVAS_WIDTH}×{CANVAS_HEIGHT}
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="text-gray-400 mb-1">
                              Total Pixels
                            </div>
                            <div className="text-white font-bold">
                              {pixels.length}
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="text-gray-400 mb-1">
                              Contributors
                            </div>
                            <div className="text-white font-bold">
                              {userActivities.length}
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="text-gray-400 mb-1">
                              Your Pixels
                            </div>
                            <div className="text-white font-bold">
                              {userPixels.length}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Canvas Panel */}
                  <div className="lg:col-span-3">
                    {loading ? (
                      <div className="bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 h-[600px] flex items-center justify-center rounded-md">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-t-purple-500 border-r-purple-400 border-b-pink-500 border-l-pink-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                          <p className="text-gray-300 font-pixel">
                            Loading canvas...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        ref={containerRef}
                        className="bg-black/20 backdrop-blur-md border border-purple-900/50 p-6 overflow-hidden relative rounded-md"
                        style={{ height: "600px" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {/* Canvas container */}
                        <div
                          ref={canvasRef}
                          className="absolute inset-0 overflow-hidden"
                          onClick={(e) => {
                            if (isDragging) return;

                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            const { x, y } = screenToCanvas(
                              e.clientX,
                              e.clientY
                            );

                            if (
                              x >= 0 &&
                              x < CANVAS_WIDTH &&
                              y >= 0 &&
                              y < CANVAS_HEIGHT
                            ) {
                              handleCanvasClick(x, y);
                            }
                          }}
                          onMouseMove={handlePixelHover}
                          onMouseLeave={handleCanvasLeave}
                        >
                          {renderPixelGrid()}
                        </div>

                        {/* Position indicator */}
                        {hoveredPixel && (
                          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-2 text-sm text-gray-300 font-mono rounded-md border border-purple-900/50 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mr-2"
                            >
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                              <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                            <span>
                              x: {hoveredPixel.x}, y: {hoveredPixel.y}
                            </span>

                            {hoveredPixel.color !== "transparent" && (
                              <div className="ml-3 flex items-center">
                                <div
                                  className="w-3 h-3 rounded-sm mr-1"
                                  style={{
                                    backgroundColor: hoveredPixel.color,
                                  }}
                                ></div>
                                <span>{hoveredPixel.color}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Controls overlay */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button
                            onClick={resetView}
                            className="bg-black/50 backdrop-blur-sm p-2 rounded-md border border-purple-900/50 text-purple-300 hover:bg-purple-900/30"
                            title="Reset view"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                              <path d="M3 3v5h5"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => setRefreshCanvas((prev) => prev + 1)}
                            className="bg-black/50 backdrop-blur-sm p-2 rounded-md border border-purple-900/50 text-purple-300 hover:bg-purple-900/30"
                            title="Refresh canvas"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Your pixels section */}
                    {publicKey && (
                      <div className="mt-6 bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 rounded-md">
                        <h3 className="text-xl font-bold text-white mb-6 font-pixel flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2"
                          >
                            <path d="M20 7h-9"></path>
                            <path d="M14 17H5"></path>
                            <circle cx="17" cy="17" r="3"></circle>
                            <circle cx="7" cy="7" r="3"></circle>
                          </svg>
                          YOUR PIXELS
                        </h3>

                        {userPixels.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 bg-black/20 p-4 rounded-md border border-purple-900/30">
                            {Array.from(
                              new Set(userPixels.map((p) => p.color))
                            ).map((color) => {
                              const filteredPixels = userPixels.filter(
                                (p) => p.color === color
                              );
                              return (
                                <div key={color} className="text-center">
                                  <div
                                    className="w-10 h-10 mx-auto mb-2 rounded-md border border-gray-800"
                                    style={{ backgroundColor: color }}
                                  />
                                  <div className="text-gray-300 text-sm">
                                    {filteredPixels.length}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center py-8 bg-black/20 rounded-md border border-purple-900/30">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mx-auto mb-3 text-gray-500"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              ></rect>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                            <p>
                              You haven't placed any pixels yet. Start drawing!
                            </p>
                          </div>
                        )}

                        <div className="mt-4 text-sm text-gray-400 flex justify-between items-center">
                          <span>Total pixels placed: {userPixels.length}</span>
                          {userPixels.length > 0 && (
                            <span className="text-purple-400">
                              {(
                                (userPixels.length / pixels.length) *
                                100
                              ).toFixed(2)}
                              % of all pixels
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Color Distribution */}
                  <div className="bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 rounded-md">
                    <h3 className="text-xl font-bold text-white mb-6 font-pixel flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path>
                        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
                        <path d="M12 2v2"></path>
                        <path d="M12 22v-2"></path>
                        <path d="M20 12h-2"></path>
                        <path d="M4 12h2"></path>
                        <path d="M17.8 4.2l-1.4 1.4"></path>
                        <path d="M7.6 14.4l-1.4 1.4"></path>
                        <path d="M16.4 17.8l1.4-1.4"></path>
                        <path d="M6.2 7.6l1.4-1.4"></path>
                      </svg>
                      COLOR DISTRIBUTION
                    </h3>
                    {renderColorStats()}
                  </div>

                  {/* Leaderboard */}
                  <div className="bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 rounded-md">
                    <h3 className="text-xl font-bold text-white mb-6 font-pixel flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M18 20V10"></path>
                        <path d="M12 20V4"></path>
                        <path d="M6 20v-6"></path>
                      </svg>
                      LEADERBOARD
                    </h3>
                    {renderLeaderboard()}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-black/30 backdrop-blur-md border border-purple-900/50 p-6 rounded-md">
                  <h3 className="text-xl font-bold text-white mb-6 font-pixel flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M12 8v4l3 3"></path>
                      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
                    </svg>
                    RECENT ACTIVITY
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pixels
                      .slice(Math.max(0, pixels.length - 9))
                      .reverse()
                      .map((pixel, index) => (
                        <div
                          key={index}
                          className="bg-black/20 p-4 border border-purple-900/30 rounded-md hover:border-purple-500/50 transition-colors"
                        >
                          <div className="flex items-center mb-3">
                            <div
                              className="w-6 h-6 mr-3 rounded-md"
                              style={{ backgroundColor: pixel.color }}
                            />
                            <div className="text-sm text-purple-300 truncate font-medium">
                              {pixel.username ||
                                pixel.wallet_address.substring(0, 6)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 flex justify-between">
                            <div>
                              Position: ({pixel.x}, {pixel.y})
                            </div>
                            <div className="text-right">{pixel.color}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {pixel.updated_at
                              ? formatDate(pixel.updated_at)
                              : "Unknown date"}
                          </div>
                        </div>
                      ))}

                    {pixels.length === 0 && (
                      <div className="col-span-3 text-center py-10 bg-black/20 rounded-md border border-purple-900/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mx-auto mb-3 text-gray-500"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <p className="text-gray-400 mb-2">
                          No activity recorded yet
                        </p>
                        <p className="text-gray-500">
                          Be the first to place a pixel on the canvas!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Community Showcase Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black to-purple-950/20"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-600 font-pixel">
                COMMUNITY CREATIONS
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-blue-500 mx-auto mb-6"></div>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Check out these amazing artworks created by the VOID community
                using our collaborative canvas.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Example community creation cards */}
            {[
              {
                id: "pixel-galaxy", // Added id property for linking
                title: "Pixel Galaxy",
                creator: "Cosmic_Wizard",
                colors: 42,
                contributors: 18,
                image:
                  "bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800",
              },
              {
                id: "neon-landscape", // Added id property for linking
                title: "Neon Landscape",
                creator: "DigitalDreamer",
                colors: 36,
                contributors: 24,
                image:
                  "bg-gradient-to-br from-green-800 via-teal-700 to-blue-900",
              },
              {
                id: "retro-arcade", // Added id property for linking
                title: "Retro Arcade",
                creator: "PixelPioneer",
                colors: 28,
                contributors: 15,
                image:
                  "bg-gradient-to-br from-red-800 via-orange-700 to-yellow-800",
              },
            ].map((creation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-black/30 backdrop-blur-md border border-purple-900/50 rounded-lg overflow-hidden group"
                whileHover={{ y: -5 }}
              >
                <div
                  className={`aspect-video ${creation.image} relative overflow-hidden`}
                >
                  {/* Pixelated overlay effect */}
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.5) 1px, transparent 1px)",
                      backgroundSize: "8px 8px",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-xl font-bold text-white mb-1 font-pixel">
                      {creation.title}
                    </h3>
                    <p className="text-sm text-gray-300">
                      by {creation.creator}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between mb-2">
                    <div className="text-sm text-gray-400">
                      <span className="text-purple-400 font-bold">
                        {creation.colors}
                      </span>{" "}
                      Colors
                    </div>
                    <div className="text-sm text-gray-400">
                      <span className="text-pink-400 font-bold">
                        {creation.contributors}
                      </span>{" "}
                      Contributors
                    </div>
                  </div>

                  {/* UPDATED: Changed Button to Link to artwork-detail with ID */}
                  <Button
                    className="w-full mt-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-500/50 rounded-md"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                    onClick={() =>
                      router.push(`/artwork-detail?id=${creation.id}`)
                    }
                  >
                    View Artwork
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              className="bg-black/30 backdrop-blur-sm border-2 border-purple-500/50 hover:bg-purple-900/30 text-white rounded-md px-6 py-4 text-lg font-pixel tracking-wide"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
              onClick={() => router.push("/gallery")}
            >
              Explore All Community Art
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 to-black"></div>

          {/* Animated circular elements */}
          <motion.div
            className="absolute w-96 h-96 rounded-full border border-purple-500/20"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              rotate: { ease: "linear" },
              scale: { repeatType: "reverse" },
            }}
          />

          <motion.div
            className="absolute w-64 h-64 rounded-full border border-pink-500/20"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.3, 0.1],
              rotate: [360, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              delay: 0.5,
              rotate: { ease: "linear" },
              scale: { repeatType: "reverse" },
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto bg-black/30 backdrop-blur-md border border-purple-900/50 p-10 rounded-lg">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel">
                JOIN THE VOID COLLECTIVE
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Connect your wallet and become part of our growing community of
                pixel artists. Create, collaborate, and leave your mark on the
                VOID canvas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md px-8 py-4 text-lg font-pixel tracking-wide"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  Connect Wallet
                </Button>
                <Button
                  className="bg-transparent border-2 border-purple-500 hover:bg-purple-900/30 text-white rounded-md px-8 py-4 text-lg font-pixel tracking-wide"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                  asChild
                >
                  <Button
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-900/30 text-white rounded-md px-8 py-4 text-lg font-pixel tracking-wide"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                    onClick={() => router.push("/gallery")}
                  >
                    Explore Gallery
                  </Button>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <Toaster />

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }

        /* For Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) rgba(0, 0, 0, 0.2);
        }

        /* React Color Picker Customization */
        .react-colorful {
          width: 100% !important;
          height: 180px !important;
          border-radius: 4px !important;
          background: rgba(0, 0, 0, 0.2) !important;
          padding: 10px !important;
        }

        .react-colorful__saturation {
          border-radius: 4px !important;
          border-bottom: none !important;
          margin-bottom: 10px !important;
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.2) !important;
        }

        .react-colorful__hue {
          height: 20px !important;
          border-radius: 4px !important;
          box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.2) !important;
        }

        .react-colorful__pointer {
          width: 20px !important;
          height: 20px !important;
          border-width: 2px !important;
          border-color: white !important;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
}