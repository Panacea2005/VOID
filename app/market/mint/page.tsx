"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { mintNFT, getCubeNFTMetadata } from "@/lib/services/nftService"
import { cubeCollection } from "@/app/game/cube/realm-cube"
import CubePreview from "../../components/CubePreview"
import CubeRenderer from "../../components/CubeRenderer"
import { mockMintNFT, convertCubeToFile, mintRealNFT, getUserNFTs } from "@/lib/services/mockNftService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function MintPage() {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [cursorHover, setCursorHover] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [minting, setMinting] = useState(false)
    const [mintSuccess, setMintSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        type: "cube", // 'cube' or 'music'
        royalty: "5",
        collection: "",
    })
    const [image, setImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>("")
    const router = useRouter()
    const { connected, publicKey, wallet } = useWallet()
    const { connection } = useConnection()
    const [selectedCube, setSelectedCube] = useState<any>(null)
    const [error, setError] = useState<string>("")
    const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null)
    const [mintMode, setMintMode] = useState<"mock" | "real">("mock")
    const [transactionStatus, setTransactionStatus] = useState<string>("")
    const [mintAddress, setMintAddress] = useState<string>("")

    // Handle cursor effects
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCursorPosition({ x: e.clientX, y: e.clientY })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    // Redirect if not connected
    useEffect(() => {
        if (!connected) {
            router.push("/market")
        }
    }, [connected, router])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setImage(file)

        // Create preview URL
        const fileUrl = URL.createObjectURL(file)
        setPreviewUrl(fileUrl)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Bắt đầu quá trình mint NFT");

        if (!connected || !publicKey) {
            alert("Vui lòng kết nối ví trước!")
            return
        }

        if (!selectedCube) {
            setError("Vui lòng chọn một cube để mint!")
            return
        }

        try {
            setMinting(true)
            setError("")
            setTransactionStatus("Đang chuẩn bị tài nguyên...")

            if (!canvasRef) {
                setError("Không thể tạo ảnh từ cube. Vui lòng thử lại!")
                console.error("Canvas ref không tồn tại");
                return
            }

            // Convert canvas to file
            console.log("Đang chuyển đổi canvas thành file PNG");
            const imageFile = await convertCubeToFile(
                canvasRef,
                formData.name || `VOID Cube #${Date.now()}`
            )
            console.log("Đã tạo file PNG:", imageFile.name);

            // Chuẩn bị thuộc tính
            const attributes = [
                {
                    trait_type: 'Collection',
                    value: selectedCube.name
                },
                {
                    trait_type: 'Rarity',
                    value: selectedCube.rarity
                }
            ]

            let mintedNftAddress = ""

            if (mintMode === "real") {
                // Mint NFT thật trên Solana
                setTransactionStatus("Đang mint NFT lên Solana blockchain...")
                console.log("Đang mint NFT thật trên Solana");

                // Chuẩn bị dữ liệu cube
                const cubeData = {
                    name: formData.name || `VOID Cube #${Date.now()}`,
                    description: formData.description || `A unique VOID cube with ${selectedCube.name} properties`,
                    attributes,
                    colors: selectedCube.colors
                }

                console.log("Dữ liệu cube:", cubeData);
                console.log("Wallet adapter:", wallet?.adapter);

                try {
                    // Mint NFT thật
                    mintedNftAddress = await mintRealNFT(
                        connection,
                        wallet?.adapter,
                        cubeData,
                        imageFile
                    )

                    console.log("Mint NFT thành công với địa chỉ:", mintedNftAddress);
                    setTransactionStatus("NFT đã được mint thành công! Địa chỉ: " + mintedNftAddress)
                } catch (error: any) {
                    console.error("Lỗi cụ thể khi mint NFT:", error);
                    setError(`Lỗi khi mint NFT thật: ${error?.message || 'Lỗi không xác định'}`);
                    return;
                }
            } else {
                // Mint giả lập
                setTransactionStatus("Đang giả lập mint NFT...")
                console.log("Đang mint NFT giả lập");

                // Chuẩn bị metadata
                const metadata = {
                    name: formData.name || `VOID Cube #${Date.now()}`,
                    description: formData.description || `A unique VOID cube with ${selectedCube.name} properties`,
                    image: imageFile,
                    attributes
                }

                console.log("Metadata NFT giả lập:", metadata);

                try {
                    // Mint NFT (giả lập)
                    mintedNftAddress = await mockMintNFT(metadata)
                    console.log("Mint NFT giả lập thành công với ID:", mintedNftAddress);
                    setTransactionStatus("Đã tạo NFT mô phỏng: " + mintedNftAddress)
                } catch (error: any) {
                    console.error("Lỗi cụ thể khi mint NFT giả lập:", error);
                    setError(`Lỗi khi mint NFT giả lập: ${error?.message || 'Lỗi không xác định'}`);
                    return;
                }
            }

            setMintAddress(mintedNftAddress)
            setMintSuccess(true)

            // Kiểm tra localStorage sau khi mint
            const nftsAfterMint = getUserNFTs();
            console.log("NFTs sau khi mint:", nftsAfterMint);

            // Redirect to profile after success
            setTimeout(() => {
                router.push("/profile")
            }, 2000)

        } catch (error: any) {
            console.error("Error minting NFT:", error)
            setError(`Có lỗi xảy ra khi mint NFT: ${error?.message || 'Lỗi không xác định'}`)
            setTransactionStatus("Mint NFT thất bại.")
        } finally {
            setMinting(false)
        }
    }

    // Generate random appearance for preview
    const previewType = formData.type === "cube" ? "complex" : "wave"
    const previewColors = ["purple", "pink", "blue"]
    const previewColor = previewColors[Math.floor(Math.random() * previewColors.length)]

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

            {/* Mint Section */}
            <section className="relative pt-32 pb-20">
                <div className="absolute inset-0 z-0 h-[50vh] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AbstractShape className="w-full h-full text-purple-500/10" type="grid" animate />
                    </div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-12 text-center">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                <PixelHeading
                                    text="MINT NEW NFT"
                                    className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4"
                                    animate
                                />
                                <p className="text-gray-400 max-w-2xl mx-auto">
                                    Tạo NFT mới trong VOID universe và chia sẻ sáng tạo của bạn với cộng đồng
                                </p>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Cube Selection */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="flex flex-col items-center justify-start"
                            >
                                <h3 className="text-2xl font-bold mb-4 text-white">Chọn Cube</h3>
                                <div className="grid grid-cols-2 gap-4 w-full">
                                    {cubeCollection.map((cube) => (
                                        <div
                                            key={cube.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedCube?.id === cube.id
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-gray-700 hover:border-purple-500/50'
                                                }`}
                                            onClick={() => setSelectedCube(cube)}
                                        >
                                            <div className="aspect-square relative mb-2">
                                                <CubePreview
                                                    colors={cube.colors}
                                                    size={80}
                                                    animate={selectedCube?.id === cube.id}
                                                />
                                            </div>
                                            <h4 className="text-white font-bold">{cube.name}</h4>
                                            <p className="text-gray-400 text-sm">{cube.rarity}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 w-full bg-black/30 border border-purple-500/30 p-4">
                                    <h4 className="font-bold text-lg mb-2">Chế độ Mint</h4>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Checkbox
                                            id="mint-mode-real"
                                            checked={mintMode === "real"}
                                            onCheckedChange={() => setMintMode("real")}
                                        />
                                        <label
                                            htmlFor="mint-mode-real"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Mint NFT thật lên Solana (hiển thị trong Phantom)
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="mint-mode-mock"
                                            checked={mintMode === "mock"}
                                            onCheckedChange={() => setMintMode("mock")}
                                        />
                                        <label
                                            htmlFor="mint-mode-mock"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Mint NFT giả lập (chỉ hiển thị trong VOID profile)
                                        </label>
                                    </div>
                                </div>

                                {/* Kiểm tra phiên bản hiện tại */}
                                <div className="mt-4 w-full">
                                    <p className="text-xs text-gray-500">
                                        LocalStorage status:
                                        <button
                                            onClick={() => {
                                                const nfts = getUserNFTs();
                                                console.log("Current NFTs:", nfts);
                                                alert(`Hiện có ${nfts.length} NFT trong localStorage`);
                                            }}
                                            className="ml-2 text-purple-400 hover:text-purple-300"
                                        >
                                            Kiểm tra NFTs
                                        </button>
                                    </p>
                                </div>
                            </motion.div>

                            {/* NFT Preview */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="relative aspect-square w-full max-w-md mb-6 overflow-hidden border border-purple-500/30">
                                    {selectedCube ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black/50">
                                            <div className="w-full h-full">
                                                <CubeRenderer
                                                    colors={selectedCube.colors}
                                                    size={800}
                                                    onRender={(canvas) => {
                                                        console.log("Canvas đã được render");
                                                        setCanvasRef(canvas);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black/50">
                                            <p className="text-gray-400">Chọn một cube để xem preview</p>
                                        </div>
                                    )}
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <Label htmlFor="name" className="text-white font-pixel">TÊN NFT</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="bg-black/50 border-purple-500/30 focus:border-purple-500 text-white rounded-none font-pixel"
                                            placeholder="Nhập tên cho NFT của bạn"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-white font-pixel">MÔ TẢ</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="bg-black/50 border-purple-500/30 focus:border-purple-500 text-white rounded-none font-pixel min-h-[100px]"
                                            placeholder="Mô tả về NFT của bạn"
                                        />
                                    </div>

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Lỗi</AlertTitle>
                                            <AlertDescription>
                                                {error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {transactionStatus && (
                                        <Alert className="bg-purple-500/20 border-purple-500">
                                            <AlertTitle>Trạng thái</AlertTitle>
                                            <AlertDescription>
                                                {transactionStatus}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {mintSuccess && (
                                        <Alert className="bg-green-500/20 border-green-500">
                                            <AlertTitle>Thành công!</AlertTitle>
                                            <AlertDescription>
                                                NFT đã được tạo thành công! <br />
                                                {mintAddress && <span className="font-mono text-xs">Mint Address: {mintAddress}</span>}
                                                <br />
                                                Đang chuyển hướng...
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-none font-pixel text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                        disabled={minting || !connected || !selectedCube}
                                    >
                                        {minting ? "ĐANG MINT..." : `MINT NFT ${mintMode === 'real' ? 'THẬT' : 'GIẢ LẬP'}`}
                                    </Button>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
} 