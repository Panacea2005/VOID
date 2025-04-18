"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NFTDetailPage() {
  const params = useParams()
  const id = params?.id || '0'
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [showModelViewer, setShowModelViewer] = useState(false)
  const [modelUrl, setModelUrl] = useState("")

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Mock NFT data - in a real app, you would fetch this based on the ID
  const nft = {
    id: Number(id),
    name: `VOID CUBE #${id}`,
    description:
      "A unique digital artifact from the VOID universe. This cube contains the essence of digital creativity and blockchain innovation.",
    creator: "VOID_OFFICIAL",
    owner: "VOID_COLLECTOR",
    price: 0.5,
    type: Number(id) % 2 === 0 ? "music" : "cube",
    shapeType:
      Number(id) % 5 === 0
        ? "complex"
        : Number(id) % 5 === 1
          ? "grid"
          : Number(id) % 5 === 2
            ? "wave"
            : Number(id) % 5 === 3
              ? "dots"
              : "noise",
    color: Number(id) % 3 === 0 ? "purple" : Number(id) % 3 === 1 ? "pink" : "blue",
    attributes: [
      { trait: "Rarity", value: "Rare" },
      { trait: "Edition", value: `${id}/1000` },
      { trait: "Generation", value: "Genesis" },
      { trait: "Dimension", value: "3D" },
      { trait: "Animation", value: "Dynamic" },
    ],
    history: [
      { event: "Minted", from: "VOID_OFFICIAL", to: "VOID_OFFICIAL", price: 0, date: "2023-10-15" },
      { event: "Listed", from: "VOID_OFFICIAL", to: null, price: 0.5, date: "2023-10-16" },
      { event: "Sold", from: "VOID_OFFICIAL", to: "VOID_COLLECTOR", price: 0.5, date: "2023-10-18" },
    ],
  }

  // Thêm hàm xử lý khi người dùng muốn xem 3D model
  const handleView3DModel = () => {
    try {
      console.log("Mở 3D model viewer cho NFT:", nft.name);

      // Sử dụng GLB model dựa trên ID của NFT để có sự đa dạng
      let modelUrl;

      // Thử tìm kiếm trong localStorage xem có NFT với ID này không
      if (typeof window !== 'undefined') {
        try {
          const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
          const matchedNft = userNfts.find((item: any) => item.id === nft.id.toString() || item.id === `void-cube-${nft.id}`);

          if (matchedNft) {
            // Kiểm tra model trực tiếp từ modelViewerUrl nếu có
            if (matchedNft.modelViewerUrl) {
              console.log("Tìm thấy modelViewerUrl của NFT trong localStorage:", matchedNft.modelViewerUrl);
              modelUrl = matchedNft.modelViewerUrl;
            }
            // Kiểm tra model3d URL
            else if (matchedNft.model3d) {
              console.log("Tìm thấy model 3D của NFT trong localStorage:", matchedNft.model3d);
              // Kiểm tra xem có phải URL model viewer không
              if (matchedNft.model3d.includes('modelviewer.dev')) {
                modelUrl = matchedNft.model3d;
              } else {
                // Tạo URL model viewer từ model3d URL
                modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(matchedNft.model3d)}`;
              }
            }
            // Kiểm tra model3dHash
            else if (matchedNft.model3dHash) {
              console.log("Tìm thấy hash model 3D của NFT trong localStorage:", matchedNft.model3dHash);
              const directModelUrl = `https://ipfs.io/ipfs/${matchedNft.model3dHash}`;
              modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(directModelUrl)}`;
            }
            // Kiểm tra URL model trong properties.files của NFT
            else if (matchedNft.properties?.files?.length > 0) {
              const modelFile = matchedNft.properties.files.find((file: any) =>
                file.type === 'model/gltf-binary' ||
                file.type === 'model/gltf+json'
              );

              if (modelFile && modelFile.uri) {
                console.log("Tìm thấy model trong properties.files:", modelFile.uri);
                modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelFile.uri)}`;
              }
            }
          }

          // Nếu không tìm thấy, sử dụng một trong các model mẫu dựa trên ID
          if (!modelUrl) {
            const sampleModels = [
              "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
              "https://modelviewer.dev/shared-assets/models/Cube.gltf",
              "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
              "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
            ];

            modelUrl = sampleModels[nft.id % sampleModels.length];
            console.log("Không tìm thấy model thực tế, sử dụng model mẫu:", modelUrl);
          }
        } catch (error) {
          console.error("Lỗi khi tìm NFT trong localStorage:", error);
          modelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
        }
      } else {
        modelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
      }

      // Kiểm tra xem URL đã có phần modelviewer.dev hay chưa
      if (!modelUrl.includes('modelviewer.dev')) {
        modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelUrl)}`;
      }

      console.log("URL model viewer cuối cùng:", modelUrl);
      setModelUrl(modelUrl);
      setShowModelViewer(true);
    } catch (error) {
      console.error("Lỗi khi hiển thị model 3D:", error);
      alert("Có lỗi xảy ra khi tải 3D Model. Vui lòng thử lại sau.");
      setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
      setShowModelViewer(true);
    }
  };

  const handleCloseModelViewer = () => {
    setShowModelViewer(false);
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
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* NFT Detail Section */}
      <section className="relative pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* NFT Preview */}
              <div>
                <div className="aspect-square bg-black border-2 border-purple-900/50 overflow-hidden">
                  <AbstractShape
                    className={`w-full h-full ${nft.color === "purple"
                      ? "text-purple-500/70"
                      : nft.color === "pink"
                        ? "text-pink-500/70"
                        : "text-blue-500/70"
                      }`}
                    type={nft.shapeType as any}
                    animate
                  />
                  {nft.type === "music" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-white"
                        >
                          <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NFT Info */}
              <div>
                <div className="mb-6">
                  <Link
                    href="/market"
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel flex items-center"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <path
                        d="M19 12H5M5 12L12 19M5 12L12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    BACK TO MARKETPLACE
                  </Link>
                </div>

                <PixelHeading
                  text={nft.name}
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />

                <div className="flex items-center mb-6">
                  <span className="text-gray-400 font-pixel">CREATED BY</span>
                  <Link
                    href="#"
                    className="ml-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    {nft.creator}
                  </Link>
                </div>

                <p className="text-gray-300 mb-8 font-pixel leading-relaxed">{nft.description}</p>

                <div className="mb-8 p-6 bg-purple-950/10 border border-purple-900/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 font-pixel">CURRENT PRICE</p>
                      <p className="text-3xl font-bold text-white font-pixel">{nft.price} SOL</p>
                    </div>
                    <div className="flex space-x-4">
                      <Button
                        className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        BUY NOW
                      </Button>
                      <Button
                        className="bg-transparent border-2 border-blue-500 hover:bg-blue-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                        onClick={handleView3DModel}
                      >
                        VIEW 3D MODEL
                      </Button>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="attributes" className="w-full">
                  <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none mb-6">
                    <TabsTrigger
                      value="attributes"
                      className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-2 font-pixel"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      ATTRIBUTES
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-2 font-pixel"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      HISTORY
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="attributes" className="mt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {nft.attributes.map((attr, index) => (
                        <div key={index} className="bg-black border border-purple-900/50 p-4">
                          <p className="text-gray-400 text-sm font-pixel">{attr.trait}</p>
                          <p className="text-white font-bold font-pixel">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    <div className="border border-purple-900/50">
                      <div className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 bg-purple-950/10">
                        <p className="text-gray-400 font-pixel">EVENT</p>
                        <p className="text-gray-400 font-pixel">FROM</p>
                        <p className="text-gray-400 font-pixel">TO</p>
                        <p className="text-gray-400 font-pixel">PRICE</p>
                      </div>
                      {nft.history.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 last:border-0"
                        >
                          <p className="text-white font-pixel">{item.event}</p>
                          <p className="text-purple-400 font-pixel">{item.from}</p>
                          <p className="text-purple-400 font-pixel">{item.to || "-"}</p>
                          <p className="text-white font-pixel">{item.price} SOL</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More From Collection Section */}
      <section className="relative py-20 bg-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="MORE FROM THIS COLLECTION"
              className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center"
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <Link href={`/market/nft/${Number(id) + index + 1}`} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <AbstractShape
                        className={`w-full h-full ${index % 3 === 0
                          ? "text-purple-500/70"
                          : index % 3 === 1
                            ? "text-pink-500/70"
                            : "text-blue-500/70"
                          }`}
                        type={
                          index % 4 === 0 ? "complex" : index % 4 === 1 ? "grid" : index % 4 === 2 ? "dots" : "noise"
                        }
                        animate
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-1 font-pixel">{`VOID CUBE #${Number(id) + index + 1}`}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400 font-bold font-pixel">{0.5 + index * 0.1} SOL</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3D Model Viewer Modal */}
      {showModelViewer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border-2 border-purple-500 p-8 max-w-5xl w-full h-[80vh] relative"
          >
            <button
              onClick={handleCloseModelViewer}
              className="absolute top-4 right-4 text-white hover:text-pink-500 transition-colors"
              title="Close 3D Model Viewer"
              aria-label="Close 3D Model Viewer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-white mb-6 font-pixel">3D MODEL VIEWER - {nft.name}</h3>

            <div className="w-full h-[90%] flex items-center justify-center bg-black/50 relative">
              {modelUrl ? (
                <>
                  <iframe
                    src={modelUrl}
                    title="3D Model Viewer"
                    className="w-full h-full border-0"
                    allow="camera; microphone; fullscreen; autoplay; xr-spatial-tracking"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onLoad={() => console.log("iframe đã tải xong!")}
                    onError={() => {
                      console.error("Lỗi khi tải iframe");
                      setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
                    }}
                  ></iframe>
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button
                      onClick={() => window.open(modelUrl, '_blank')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    >
                      Mở trong cửa sổ mới
                    </button>
                    <button
                      onClick={() => setModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                    >
                      Thử với model mẫu
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-400 mb-4">Không thể tải model 3D. Vui lòng thử lại sau.</p>
                  <button
                    onClick={() => setModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                  >
                    Thử với model mẫu
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  )
}
