export type NFTType = 'cube' | 'music' | 'other';

export interface NFT {
    id: number;
    name: string;
    description: string;
    creator: string;
    price: number;
    type: NFTType;
    shapeType: string;
    color: "purple" | "pink" | "blue";
    attributes: {
        trait: string;
        value: string;
    }[];
    history: {
        event: string;
        from: string;
        to?: string;
        price?: number;
        date: Date;
    }[];
    isListed: boolean;
    saleAccount?: string;
    tokenAccount?: string;
    mint?: string;
    modelViewerUrl?: string;
}

export interface Collection {
    id: number;
    name: string;
    creator: string;
    items: number;
    floorPrice: number;
    bannerType: string;
    color: "purple" | "pink" | "blue";
} 