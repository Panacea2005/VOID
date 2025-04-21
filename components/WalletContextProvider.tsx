"use client";

import { FC, ReactNode, useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import default styles from wallet-adapter-react-ui
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextProviderProps {
    children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
    // Sử dụng mạng Devnet để phát triển
    const network = WalletAdapterNetwork.Devnet;

    // Endpoint RPC của Solana
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // Adapters của các ví
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect={true}>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;