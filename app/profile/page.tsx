"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useWallet } from "@solana/wallet-adapter-react"
import { getWalletInfo, getNFTs, getTransactionHistory, shortenAddress, WalletData, NFTData } from "@/lib/services/walletService"
import { getUserNFTs, refreshNFTImageURLS, isValidBlobURL, preloadImages, validateAndFixModelURL } from "@/lib/services/mockNftService"
import { getModelViewerUrl, getDirectModelUrl, getGoogleModelViewerUrl } from "@/lib/services/pinataService"
import IPFSViewer from '@/components/ipfs-viewer'
import SolscanViewer from '@/components/solscan-viewer'
import NFTCard from "@/components/nft-card"

export default function ProfilePage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [activeTab, setActiveTab] = useState("minted")
  const [isEditing, setIsEditing] = useState(false)
  const [listingPrice, setListingPrice] = useState("")
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<WalletData | null>(null)
  const [ownedNFTs, setOwnedNFTs] = useState<NFTData[]>([])
  const [mintedNFTs, setMintedNFTs] = useState<NFTData[]>([])
  const [listedNFTs, setListedNFTs] = useState<NFTData[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const { publicKey, disconnect } = useWallet()
  const router = useRouter()
  const [userNFTs, setUserNFTs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTxDetails, setShowTxDetails] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [showModelViewer, setShowModelViewer] = useState(false)
  const [currentModelUrl, setCurrentModelUrl] = useState<string | null>(null)
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false)
  const [modelLoadError, setModelLoadError] = useState<boolean>(false)

  // Format wallet address
  const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`
  }

  // Load wallet data from blockchain
  useEffect(() => {
    async function loadWalletData() {
      if (!publicKey) {
        // Nếu không có publicKey, đưa user về trang chủ
        router.push("/");
        return;
      }

      try {
        setLoading(true);

        // Lấy thông tin ví
        const walletData = await getWalletInfo(publicKey);
        setUserData(walletData);

        // Lấy NFTs
        const nftData = await getNFTs(publicKey);
        setOwnedNFTs(nftData.ownedNFTs);
        setMintedNFTs(nftData.mintedNFTs);
        setListedNFTs(nftData.listedNFTs);

        // Lấy lịch sử giao dịch
        const txHistory = await getTransactionHistory(publicKey);
        setRecentActivity(txHistory.map(tx => ({
          event: tx.type,
          item: `Transaction ${shortenAddress(tx.signature, 6)}`,
          price: tx.amount,
          date: tx.blockTime,
          fullSignature: tx.fullSignature
        })));
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWalletData();
  }, [publicKey, router]);

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Load NFTs from local storage
  useEffect(() => {
    try {
      // Đọc NFTs từ localStorage
      const loadNFTs = () => {
        // Làm mới URL NFTs nếu cần
        refreshNFTImageURLS();

        const nfts = getUserNFTs();
        console.log("Loading NFTs from localStorage:", nfts);
        setUserNFTs(nfts);

        // Tải trước hình ảnh để tối ưu hiển thị
        preloadImages(nfts);
      };

      // Load ngay lập tức
      loadNFTs();

      // Thiết lập interval để kiểm tra mỗi 2 giây
      const interval = setInterval(loadNFTs, 2000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hàm thử tải hình ảnh và sử dụng fallback nếu cần
  const tryLoadImage = (primaryUrl: string, fallbackUrls?: string[]) => {
    const imgElement = document.createElement('img');
    imgElement.src = primaryUrl;

    imgElement.onerror = () => {
      console.log(`Cannot load image from: ${primaryUrl}`);
      if (fallbackUrls && fallbackUrls.length > 0) {
        // Thử từng URL dự phòng lần lượt
        let fallbackIndex = 0;
        const tryNextFallback = () => {
          if (fallbackIndex < fallbackUrls.length) {
            const imgElement = document.createElement('img');
            imgElement.src = fallbackUrls[fallbackIndex];
            imgElement.onerror = () => {
              console.log(`Cannot load image from fallback: ${fallbackUrls[fallbackIndex]}`);
              fallbackIndex++;
              tryNextFallback();
            };
            imgElement.onload = () => {
              console.log(`Successfully loaded image from: ${fallbackUrls[fallbackIndex]}`);
              // Cập nhật src trong DOM cho tất cả hình ảnh có URL chính
              const imageElements = document.querySelectorAll(`img[src="${primaryUrl}"]`);
              imageElements.forEach(img => {
                img.setAttribute('src', fallbackUrls[fallbackIndex]);
              });
            };
          }
        };
        tryNextFallback();
      }
    };
  };

  // Cập nhật hàm refreshImageURLs để sử dụng tryLoadImage
  const refreshImageURLs = (nfts: any[]) => {
    nfts.forEach(nft => {
      if (nft.image) {
        // Thử tải hình ảnh chính và sử dụng fallback nếu cần
        tryLoadImage(nft.image, nft.fallbackImages);
      }

      // Đảm bảo các thuộc tính cần thiết tồn tại
      if (!nft.name) nft.name = `VOID NFT #${nft.id.substring(0, 6)}`;
      if (!nft.description) nft.description = "A unique VOID NFT";

      // Cập nhật NFT với dữ liệu trực quan
      const updatedNft = {
        ...nft,
        color: getRandomColor(),
        type: nft.type || "cube",
        shapeType: getRandomShapeType(),
        collection: "VOID Collection"
      };

      // Đảm bảo model3d URL hợp lệ nếu có model3dHash
      if (updatedNft.model3dHash) {
        updatedNft.model3d = `https://ipfs.io/ipfs/${updatedNft.model3dHash}`;
        if (updatedNft.fallbackModel3d) {
          // Thử tải model3d
          tryLoadModel(updatedNft.model3d, updatedNft.fallbackModel3d);
        }
      }

      return updatedNft;
    });
  };

  // Thử tải model 3D
  const tryLoadModel = (primaryUrl: string, fallbackUrls?: string[]) => {
    const modelTest = document.createElement('a');
    modelTest.href = primaryUrl;

    fetch(primaryUrl, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid model URL');
        }
        console.log('Valid model URL:', primaryUrl);
      })
      .catch(error => {
        console.log(`Cannot load model from: ${primaryUrl}`, error);
        if (fallbackUrls && fallbackUrls.length > 0) {
          // Thử từng URL dự phòng lần lượt
          tryNextModelFallback(fallbackUrls, 0);
        }
      });
  };

  const tryNextModelFallback = (fallbackUrls: string[], index: number) => {
    if (index >= fallbackUrls.length) return;

    fetch(fallbackUrls[index], { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Fallback model URL is not valid');
        }
        console.log('Found valid model URL:', fallbackUrls[index]);
        // Cập nhật trong DOM nếu cần
      })
      .catch(error => {
        console.log(`Cannot load model from fallback: ${fallbackUrls[index]}`, error);
        tryNextModelFallback(fallbackUrls, index + 1);
      });
  };

  const handleListNFT = (nftId: string) => {
    setSelectedNFT(nftId)
    setIsEditing(true)
  }

  const handleConfirmListing = () => {
    // This would be replaced with actual listing logic
    console.log(`Listing NFT #${selectedNFT} for ${listingPrice} SOL`)
    setIsEditing(false)
    setSelectedNFT(null)
    setListingPrice("")
  }

  const handleCancelListing = () => {
    setIsEditing(false)
    setSelectedNFT(null)
    setListingPrice("")
  }

  const handleDisconnect = async () => {
    try {
      await disconnect();
      console.log("Disconnecting wallet...");
      // Redirect to home page after disconnecting
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }

  // Xử lý hiển thị chi tiết giao dịch
  const handleShowTxDetails = (tx: any) => {
    console.log("Transaction details:", tx);
    console.log("Full signature:", tx.fullSignature);
    setSelectedTx(tx);
    setShowTxDetails(true);
  }

  const handleCloseTxDetails = () => {
    setShowTxDetails(false);
    setSelectedTx(null);
  }

  // Hàm trả về màu ngẫu nhiên cho NFT
  const getRandomColor = () => {
    const colors = ["purple", "pink", "blue"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Hàm trả về kiểu hình dạng ngẫu nhiên cho NFT
  const getRandomShapeType = () => {
    const types = ["complex", "grid", "wave", "dots", "noise"];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Hàm xử lý khi nhấn vào nút Watch 3D Model
  const handleViewModel = async (nft: any) => {
    setModelLoadError(false);
    setIsLoadingModel(true);
    try {
      console.log("Open 3D model viewer with NFT:", nft.name);

      let modelViewerUrl = null;

      // Kiểm tra model trực tiếp từ modelViewerUrl nếu có
      if (nft.modelViewerUrl) {
        console.log("Use available modelViewerUrl:", nft.modelViewerUrl);
        modelViewerUrl = nft.modelViewerUrl;
      }
      // Kiểm tra model3d URL
      else if (nft.model3d) {
        console.log("Sử dụng model3d URL:", nft.model3d);
        // Kiểm tra xem có phải URL model viewer không
        if (nft.model3d.includes('modelviewer.dev')) {
          modelViewerUrl = nft.model3d;
        } else {
          // Tạo URL model viewer từ model3d URL trực tiếp
          modelViewerUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(nft.model3d)}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
        }
      }
      // Kiểm tra model3dHash
      else if (nft.model3dHash) {
        console.log("Use model3dHash:", nft.model3dHash);
        // Dùng hàm utility để tạo URL cho model viewer
        modelViewerUrl = getModelViewerUrl(nft.model3dHash);

        // Lưu thêm các URL dự phòng cho nft để sử dụng sau này
        nft.model3d = getDirectModelUrl(nft.model3dHash);
        nft.modelViewerUrl = modelViewerUrl;
        nft.googleModelViewerUrl = getGoogleModelViewerUrl(nft.model3dHash);
      }
      // Kiểm tra URL model trong properties.files của NFT
      else if (nft.properties?.files?.length > 0) {
        const modelFile = nft.properties.files.find((file: any) =>
          file.type === 'model/gltf-binary' ||
          file.type === 'model/gltf+json'
        );

        if (modelFile && modelFile.uri) {
          console.log("Found model in properties.files:", modelFile.uri);

          if (modelFile.uri.startsWith('ipfs://')) {
            // Nếu là URI IPFS, tạo model viewer URL từ hash IPFS
            const ipfsHash = modelFile.uri.replace('ipfs://', '');
            modelViewerUrl = getModelViewerUrl(ipfsHash);
          } else {
            // Nếu đã là URL đầy đủ, dùng nó trực tiếp
            modelViewerUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelFile.uri)}&ar=true&autoplay=true&autoRotate=true&cameraControls=true`;
          }
        }
      }

      // Nếu không tìm thấy model 3D nào, sử dụng mẫu
      if (!modelViewerUrl) {
        console.warn("Cannot found model 3D for NFT, using available model.");
        modelViewerUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
      }

      // Đặt URL và hiển thị viewer
      console.log("URL model viewer final:", modelViewerUrl);
      setCurrentModelUrl(modelViewerUrl);
      setShowModelViewer(true);

    } catch (error) {
      console.error("Error displaying the 3D model.:", error);
      alert(' An error occurred while loading the 3D model.Please try again later.');
      setModelLoadError(true);
      // Thử tải model mẫu
      setCurrentModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb');
      setShowModelViewer(true);
    } finally {
      setIsLoadingModel(false);
    }
  };

  // Thêm hàm xử lý lỗi khi iframe không tải được
  const handleModelViewerError = () => {
    console.error("Error loading the model viewer.");
    // Thử lại với model mẫu
    setCurrentModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb');
  };

  // Hàm đóng modal xem 3D model
  const handleCloseModelViewer = () => {
    setShowModelViewer(false);
    setCurrentModelUrl(null);
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

      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AbstractShape className="w-20 h-20 mx-auto text-purple-500 animate-pulse" type="complex" animate />
            <p className="text-xl font-pixel mt-4">LOADING DATA...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <section className="relative pt-32 pb-20">
            <div className="absolute inset-0 z-0 h-[50vh] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <AbstractShape className="w-full h-full text-purple-500/10" type="grid" animate />
              </div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
                  <div className="flex items-center mb-6 md:mb-0">
                    <div className="w-20 h-20 mr-6 relative overflow-hidden">
                      <AbstractShape className="w-full h-full text-purple-500" type="complex" animate />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-white"
                          >
                            <path
                              d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2 font-pixel">{userData?.displayName}</h1>
                      <div className="flex items-center">
                        <span className="text-gray-400 text-sm font-pixel mr-2">JOINED {userData?.joinedDate}</span>
                        <div className="flex items-center bg-purple-900/30 px-2 py-1">
                          <span className="text-purple-400 text-xs font-pixel truncate max-w-[120px] md:max-w-none">
                            {userData ? shortenAddress(userData.address) : ""}
                          </span>
                          <button
                            aria-label="Copy wallet address"
                            title="Copy wallet address"
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                              if (userData) {
                                navigator.clipboard.writeText(userData.address);
                                alert("Địa chỉ ví đã được sao chép vào clipboard!");
                              }
                            }}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M8 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H17C18.1046 21 19 20.1046 19 19V16M21 3H13V11H21V3Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      className="bg-transparent border border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      EDIT PROFILE
                    </Button>
                    <Button
                      onClick={handleDisconnect}
                      className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      DISCONNECT
                    </Button>
                  </div>
                </div>

                {/* Wallet Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {[
                    { label: "BALANCE", value: userData ? `${userData.balance.toFixed(2)} SOL` : "0 SOL" },
                    { label: "PORTFOLIO VALUE", value: userData ? `${userData.totalValue.toFixed(2)} SOL` : "0 SOL" },
                    { label: "TRANSACTIONS", value: userData?.transactions || 0 },
                    { label: "NFTS OWNED", value: userData?.nftsOwned || 0 },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-black border border-purple-900/50 p-6"
                    >
                      <h3 className="text-gray-400 text-sm mb-2 font-pixel">{stat.label}</h3>
                      <p className="text-2xl font-bold text-white font-pixel">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* NFT Tabs */}
                <Tabs defaultValue="minted" className="w-full" onValueChange={(value) => setActiveTab(value)}>
                  <div className="flex justify-center mb-10">
                    <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                      <TabsTrigger
                        value="minted"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        MINTED NFTs
                      </TabsTrigger>
                      <TabsTrigger
                        value="listed"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        LISTED NFTs
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Minted NFTs Tab */}
                  <TabsContent value="minted" className="mt-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : userNFTs.length === 0 ? (
                      <div className="text-center py-20">
                        <AbstractShape className="w-24 h-24 mx-auto text-purple-500/30 mb-6" type="grid" />
                        <h3 className="text-2xl font-bold text-white mb-4 font-pixel">NO MINTED NFTS</h3>
                        <p className="text-gray-400 mb-6 font-pixel">You haven't minted any NFTs yet.</p>
                        <Button
                          asChild
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <Link href="/market/mint">MINT NEW NFT</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {userNFTs.map((nft, index) => (
                          <NFTCard
                            key={nft.id}
                            nft={nft}
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                            onViewModelClick={handleViewModel}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Listed NFTs Tab */}
                  <TabsContent value="listed" className="mt-0">
                    {listedNFTs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listedNFTs.map((nft) => (
                          <motion.div
                            key={nft.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            <div className="aspect-square overflow-hidden relative">
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
                                  <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                    <svg
                                      width="20"
                                      height="20"
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
                            <div className="p-4">
                              <h3 className="text-lg font-bold text-white mb-1 font-pixel">{nft.name}</h3>
                              <p className="text-gray-400 text-sm mb-3 font-pixel">{nft.collection}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-purple-400 font-bold font-pixel">{nft.price} SOL</span>
                                <div className="flex items-center">
                                  <div className="text-xs text-gray-400 font-pixel mr-2">{nft.listed}</div>
                                  <Button
                                    className="bg-transparent border border-red-500/50 hover:bg-red-950/30 text-red-400 rounded-none px-3 py-1 text-xs font-pixel tracking-wide"
                                    onMouseEnter={() => setCursorHover(true)}
                                    onMouseLeave={() => setCursorHover(false)}
                                  >
                                    CANCEL
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <AbstractShape className="w-24 h-24 mx-auto text-purple-500/30 mb-6" type="grid" />
                        <h3 className="text-2xl font-bold text-white mb-4 font-pixel">NO LISTED NFTS</h3>
                        <p className="text-gray-400 mb-6 font-pixel">You haven't listed any NFTs for sale yet.</p>
                        <Button
                          asChild
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <Link href="#owned">LIST AN NFT</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* Listing Modal */}
          {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black border-2 border-purple-500 p-8 max-w-md w-full"
              >
                <h3 className="text-2xl font-bold text-white mb-6 font-pixel">LIST NFT FOR SALE</h3>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2 font-pixel">PRICE (SOL)</label>
                  <Input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="0.00"
                    className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleConfirmListing}
                    disabled={!listingPrice}
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CONFIRM
                  </Button>
                  <Button
                    onClick={handleCancelListing}
                    className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CANCEL
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Activity Section */}
          <section className="relative py-20 bg-purple-950/10">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <PixelHeading
                  text="RECENT ACTIVITY"
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
                />

                <div className="border border-purple-900/50">
                  <div className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 bg-purple-950/10">
                    <p className="text-gray-400 font-pixel">EVENT</p>
                    <p className="text-gray-400 font-pixel">ITEM</p>
                    <p className="text-gray-400 font-pixel">PRICE</p>
                    <p className="text-gray-400 font-pixel">DATE</p>
                  </div>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 last:border-0 hover:bg-purple-900/10 cursor-pointer"
                        onClick={() => handleShowTxDetails(item)}
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                        title={item.fullSignature || ''}
                      >
                        <p className="text-white font-pixel">{item.event}</p>
                        <p className="text-purple-400 font-pixel">{item.item}</p>
                        <p className="text-white font-pixel">{item.price} SOL</p>
                        <p className="text-gray-400 font-pixel">{item.date}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-400 font-pixel">No recent activities found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Section */}
          <section className="relative py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <PixelHeading
                  text="PORTFOLIO ANALYTICS"
                  className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
                />

                {recentActivity.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black border border-purple-900/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 font-pixel">COLLECTION DISTRIBUTION</h3>
                      <div className="h-64 relative">
                        {ownedNFTs.length > 0 ? (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-full flex">
                                <div className="h-full w-[60%] bg-purple-500/50"></div>
                                <div className="h-full w-[25%] bg-pink-500/50"></div>
                                <div className="h-full w-[15%] bg-blue-500/50"></div>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-purple-400 font-pixel text-sm">VOID CUBES</span>
                                <span className="text-white font-pixel text-sm">60%</span>
                              </div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-pink-400 font-pixel text-sm">RESONANCE</span>
                                <span className="text-white font-pixel text-sm">25%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-blue-400 font-pixel text-sm">OTHER</span>
                                <span className="text-white font-pixel text-sm">15%</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <AbstractShape className="w-16 h-16 text-purple-500/30 mb-4" type="grid" />
                            <p className="text-gray-400 font-pixel text-center">No NFT data to display</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-black border border-purple-900/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4 font-pixel">PORTFOLIO VALUE OVER TIME</h3>
                      <div className="h-64 relative">
                        {recentActivity.length > 1 ? (
                          <div className="absolute inset-0 flex items-end">
                            <div className="w-full h-full relative">
                              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                <path
                                  d="M0,100 L0,80 C10,75 20,85 30,70 C40,55 50,65 60,50 C70,35 80,45 90,30 L100,20 L100,100 Z"
                                  fill="url(#gradient)"
                                  opacity="0.5"
                                />
                                <path
                                  d="M0,80 C10,75 20,85 30,70 C40,55 50,65 60,50 C70,35 80,45 90,30 L100,20"
                                  fill="none"
                                  stroke="url(#gradient)"
                                  strokeWidth="1"
                                />
                                <defs>
                                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 font-pixel">
                                {recentActivity.slice(0, 4).map((activity, index) => (
                                  <span key={index}>{activity.date.split('-')[1]}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center">
                            <AbstractShape className="w-16 h-16 text-purple-500/30 mb-4" type="wave" />
                            <p className="text-gray-400 font-pixel text-center">Not enough transaction data to display chart</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black border border-purple-900/50 p-12 text-center">
                    <AbstractShape className="w-24 h-24 mx-auto text-purple-500/30 mb-6" type="grid" />
                    <h3 className="text-2xl font-bold text-white mb-4 font-pixel">NO ANALYTICS DATA</h3>
                    <p className="text-gray-400 mb-6 font-pixel max-w-lg mx-auto">
                      You need at least one transaction to view portfolio analytics. Try minting or buying an NFT.
                    </p>
                    <Button
                      asChild
                      className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      <Link href="/market">EXPLORE MARKETPLACE</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Transaction Details Modal */}
          {showTxDetails && selectedTx && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black border-2 border-purple-500 p-8 max-w-2xl w-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white font-pixel">TRANSACTION DETAILS</h3>
                  <Button
                    onClick={handleCloseTxDetails}
                    className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none w-8 h-8 p-0 flex items-center justify-center"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Event Type:</p>
                      <p className="text-white font-pixel col-span-2">{selectedTx.event}</p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Transaction:</p>
                      <div className="col-span-2 flex items-center">
                        <p className="text-purple-400 font-pixel mr-2" title={selectedTx.fullSignature || ''}>
                          {selectedTx.fullSignature ?
                            `${selectedTx.fullSignature.substring(0, 6)}...${selectedTx.fullSignature.substring(selectedTx.fullSignature.length - 6)}` :
                            selectedTx.item}
                        </p>
                        <button
                          className="text-gray-400 hover:text-white transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Sử dụng fullSignature nếu có, không thì xử lý từ item
                            let signatureToCopy;
                            if (selectedTx.fullSignature) {
                              signatureToCopy = selectedTx.fullSignature;
                            } else {
                              // Trích xuất chữ ký từ item nếu nó có định dạng "Transaction xyz..."
                              const match = selectedTx.item.match(/Transaction (.*)/);
                              signatureToCopy = match && match[1] ? match[1] : selectedTx.item;
                            }

                            navigator.clipboard.writeText(signatureToCopy);
                            alert("Transaction signature copied to clipboard!");
                          }}
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                          aria-label="Copy transaction signature"
                          title="Copy transaction signature"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M8 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H17C18.1046 21 19 20.1046 19 19V16M21 3H13V11H21V3Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Amount:</p>
                      <p className="text-white font-pixel col-span-2">{selectedTx.price} SOL</p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Date:</p>
                      <p className="text-white font-pixel col-span-2">{selectedTx.date}</p>
                    </div>
                  </div>

                  <div className="border border-purple-900/50 p-4 bg-purple-950/10">
                    <div className="grid grid-cols-3 gap-2">
                      <p className="text-gray-400 font-pixel">Status:</p>
                      <p className="text-green-400 font-pixel col-span-2">CONFIRMED</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      // Sử dụng fullSignature nếu có, không thì xử lý từ item
                      let signature;
                      if (selectedTx.fullSignature) {
                        signature = selectedTx.fullSignature;
                      } else {
                        // Trích xuất chữ ký từ item nếu nó có định dạng "Transaction xyz..."
                        const match = selectedTx.item.match(/Transaction (.*)/);
                        signature = match && match[1] ? match[1] : selectedTx.item;
                      }

                      console.log("Opening Solscan with signature:", signature);

                      // Đảm bảo đường dẫn đúng đến Solscan với giao dịch đầy đủ
                      const solscanUrl = `https://solscan.io/tx/${signature}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet' ? '?cluster=devnet' : ''}`;
                      console.log("Solscan URL:", solscanUrl);

                      window.open(solscanUrl, '_blank');
                    }}
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    VIEW ON SOLSCAN
                  </Button>
                </div>
              </motion.div>
            </div>
          )}

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

                <h3 className="text-2xl font-bold text-white mb-6 font-pixel">3D MODEL VIEWER</h3>

                <div className="w-full h-[90%] flex items-center justify-center bg-black/50 relative">
                  {isLoadingModel ? (
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Uploading 3D Model...</p>
                    </div>
                  ) : modelLoadError ? (
                    <div className="text-center p-8">
                      <p className="text-gray-400 mb-4">Unable to upload model 3D. Please try again later.</p>
                      <p className="text-xs text-gray-500">URL: {currentModelUrl}</p>
                      <button
                        onClick={() => setCurrentModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                      >
                        Try with a sample model
                      </button>
                    </div>
                  ) : currentModelUrl ? (
                    <>
                      <iframe
                        src={currentModelUrl}
                        title="3D Model Viewer"
                        className="w-full h-full border-0"
                        allow="camera; microphone; fullscreen; autoplay; xr-spatial-tracking"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onLoad={() => console.log("iframe has loaded successfully!")}
                        onError={() => {
                          console.error("Error loading iframe");
                          setModelLoadError(true);
                        }}
                      ></iframe>
                      <div className="absolute bottom-4 right-4 flex space-x-2">
                        <button
                          onClick={() => window.open(currentModelUrl, '_blank')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                        >
                          Open in a new window
                        </button>
                        <button
                          onClick={() => setCurrentModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                        >
                          Try with a sample model
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-gray-400 mb-4">Unable to load the 3D model. Please try again later.</p>
                      <button
                        onClick={() => setCurrentModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
                      >
                        Try with a sample model
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Footer */}
          <Footer />
        </>
      )}
    </div>
  )
}
