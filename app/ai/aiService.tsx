// aiService.tsx
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

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
  iridescenceIor?: number;
  sheen?: number;
  sheenColor?: string;
  clearcoat?: number;
  clearcoatRoughness?: number;
  anisotropy?: number;
  showBorder?: boolean;
  texturePattern?: string;
  textureScale?: number;
  textureRotation?: number;
  displacementScale?: number;
  wireframe?: boolean;
  hslShift?: boolean;
  noiseScale?: number;
  customEffects?: string[];
  reflectivity?: number;
  transmission?: number;
  animationSpeed?: number;
  secondaryColor?: string;
  blendMode?: string;
  proceduralTexture?: string;
  animationType?: 'none' | 'pulse' | 'flow' | 'rotate';
}

interface GenerateCubeSkinParams {
  prompt: string;
}

const noise = createNoise2D();

const generateAIMaterialParams = async (prompt: string): Promise<MaterialParams> => {
  try {
    return generateEnhancedMaterialParams(prompt);
  } catch (error) {
    console.error('Error generating material parameters:', error);
    return generateFallbackMaterialParams(prompt);
  }
};

export const extractColor = (text: string, theme: string): string | null => {
  const hexMatch = text.match(/#([0-9a-f]{3,8})\b/i);
  if (hexMatch) return hexMatch[0];

  const rgbMatch = text.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  const colorDescriptions: { [key: string]: string } = {
    'deep blue': '#1e3a8a',
    'vibrant red': '#ff1a1a',
    'electric blue': '#3b82f6',
    'neon green': '#22ff22',
    'metallic gold': '#ffb700',
    'sunset orange': '#ff6b35',
    'royal purple': '#6b21a8',
    'forest green': '#1a7f1a',
    'crimson red': '#e11d48',
    'aqua blue': '#06b6d4',
    'midnight black': '#111111',
    'cosmic purple': '#9333ea',
    'ocean blue': '#0284c7',
    'fiery orange': '#ff4d00',
    'emerald green': '#10b981',
    'hot pink': '#ff2d55',
    'deep violet': '#7c3aed',
    'pastel pink': '#f9a8d4',
    'matte black': '#1f1f1f',
    'brushed silver': '#d1d5db',
    'velvet red': '#9f1239',
    'glossy white': '#f5f5f5',
    'sandstone beige': '#f59e0b',
    'charcoal gray': '#1f2937',
    'turquoise teal': '#2dd4bf',
    'blazing yellow': '#facc15',
    'lime glow': '#a3e635',
    'radiant magenta': '#d946ef',
    'icy lavender': '#d8b4fe',
    'stormy gray': '#4b5563',
    'fiery crimson': '#dc2626',
    'dusk purple': '#8b5cf6',
    'arctic blue': '#60a5fa',
    'neon coral': '#ff6f61',
    'soft mint': '#a7f3d0',
    'golden bronze': '#b45309',
    'glacier white': '#e0f2fe',
    'blush rose': '#fda4af',
    'space gray': '#374151',
    'plasma pink': '#ec4899',
    'bright cyan': '#22d3ee',
    'muted teal': '#5eead4',
    'copper flame': '#b45309',
    'pearlescent white': '#f3f4f6',
    'sapphire blue': '#2563eb',
    'volcanic red': '#991b1b',
    'stealth black': '#0f0f0f',
    'moonlight silver': '#cbd5e1',
    'dreamy peach': '#fecaca',
    'phantom purple': '#7e22ce',
    'ice mint': '#99f6e4',
    'neon lemon': '#fef08a',
    'mystic blue': '#3b82f6',
    'dark ruby': '#9f1239',
    'galactic teal': '#14b8a6',
    'platinum gray': '#e5e7eb',
    'cobalt flame': '#1e40af',
    'icy cyan': '#a5f3fc',
    'crystal peach': '#ffd1a1',
    'shadow violet': '#6d28d9',
    'ember orange': '#fb923c',
    'neon aqua': '#67e8f9',
    'frosted lilac': '#e9d5ff',
    'vintage rose': '#fbcfe8',
    'solar flare': '#f97316',
    'steel blue': '#3b82f6',
    'midnight teal': '#134e4a',
    'obsidian black': '#0b0b0b',
    'ashen white': '#fafafa',
    'vibrant mint': '#4ade80',
    'hyper yellow': '#fde047',
    'sunset blush': '#fb7185',
    'meteor gray': '#6b7280',
    'eclipse purple': '#7c3aed',
    'tropical lime': '#bef264',
    'molten gold': '#facc15',
    'neon berry': '#e879f9',
  };

  for (const [desc, color] of Object.entries(colorDescriptions)) {
    if (text.toLowerCase().includes(desc)) return color;
  }

  const basicColors: { [key: string]: string } = {
    red: '#ff0000',
    orange: '#ff6200',
    yellow: '#ffea00',
    green: '#00ff00',
    blue: '#0066ff',
    purple: '#9900ff',
    pink: '#ff66cc',
    black: '#000000',
    white: '#ffffff',
    gray: '#666666',
    silver: '#cccccc',
    gold: '#ffcc00',
  };

  for (const [name, color] of Object.entries(basicColors)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(text)) return color;
  }

  const themeColors: { [key: string]: string } = {
    cosmic: '#2d1a4d',
    galaxy: '#3b0764',
    hologram: '#7dd3fc',
    neon: '#ff00ff',
    ocean: '#0284c7',
    fire: '#ff4d00',
    ice: '#a5f3fc',
    cyberpunk: '#00ffcc',
    mystical: '#6b21a8',
    nature: '#15803d',
  };

  return themeColors[theme] || null;
};

const identifyMaterialQualities = (text: string): Partial<MaterialParams> => {
  const lowerText = text.toLowerCase();
  const qualities: Partial<MaterialParams> = {
    metalness: 0.5,
    roughness: 0.5,
    emissiveIntensity: 0,
    transparent: false,
    iridescence: 0,
    clearcoat: 0,
    anisotropy: 0,
    sheen: 0,
    opacity: 1.0,
    displacementScale: 0,
    animationType: 'none',
  };

  const metallicWords = [
    { term: 'chrome', value: 1.0 },
    { term: 'metal', value: 0.9 },
    { term: 'steel', value: 0.95 },
    { term: 'silver', value: 0.95 },
    { term: 'gold', value: 0.9 },
    { term: 'brushed', value: 0.85 },
  ];

  for (const { term, value } of metallicWords) {
    if (lowerText.includes(term)) {
      qualities.metalness = value;
      break;
    }
  }

  const nonMetallicMaterials = ['plastic', 'wood', 'fabric', 'velvet', 'glass', 'crystal', 'matte'];
  for (const material of nonMetallicMaterials) {
    if (lowerText.includes(material)) {
      qualities.metalness = Math.max(0, (qualities.metalness as number) - 0.5);
      break;
    }
  }

  if (lowerText.match(/\b(rough|coarse|textured|sanded)\b/)) {
    qualities.roughness = Math.min(1, (qualities.roughness as number) + 0.4);
  }

  if (lowerText.match(/\b(smooth|polished|shiny|glossy|matte)\b/)) {
    qualities.roughness = Math.max(0, (qualities.roughness as number) - 0.4);
    if (lowerText.includes('matte')) qualities.roughness = 0.95;
  }

  if (lowerText.match(/\b(glow|glowing|neon|radiant|pulsing)\b/)) {
    qualities.emissiveIntensity = 1.5;
    qualities.animationType = lowerText.includes('pulsing') ? 'pulse' : 'none';
    qualities.animateEmissive = true;
  }

  if (lowerText.match(/\b(transparent|translucent|glass|crystal)\b/)) {
    qualities.transparent = true;
    qualities.opacity = lowerText.includes('crystal') ? 0.9 : 0.7;
    qualities.transmission = lowerText.includes('glass') ? 0.9 : 0;
  }

  if (lowerText.match(/\b(iridescent|rainbow|pearlescent)\b/)) {
    qualities.iridescence = 1.2;
  }

  if (lowerText.includes('velvet')) {
    qualities.sheen = 1.2;
    qualities.roughness = 0.8;
  }

  if (lowerText.includes('glossy')) {
    qualities.clearcoat = 1.2;
    qualities.clearcoatRoughness = 0.05;
  }

  if (lowerText.includes('brushed') && lowerText.includes('metal')) {
    qualities.anisotropy = 1.0;
  }

  if (lowerText.match(/\b(wavy|rippling|flowing)\b/)) {
    qualities.animationType = 'flow';
    qualities.displacementScale = 0.15;
  }

  if (lowerText.match(/\b(rotating|spinning)\b/)) {
    qualities.animationType = 'rotate';
    qualities.animationSpeed = 0.03;
  }

  if (lowerText.match(/\b(soft|gentle|diffuse)\b/)) {
    qualities.sheen = 0.8;
    qualities.roughness = 0.7;
  }

  if (lowerText.match(/\b(sharp|crisp|defined)\b/)) {
    qualities.clearcoat = 1.0;
    qualities.clearcoatRoughness = 0.1;
    qualities.anisotropy = 0.5;
  }

  if (lowerText.match(/\b(vibrant|bright|vivid)\b/)) {
    qualities.emissiveIntensity = 1.8;
    qualities.envMapIntensity = 1.2;
  }

  return qualities;
};

const identifyTexturePattern = (text: string, params: Partial<MaterialParams> = {}): { pattern: string | null; maps: { map?: string; normalMap?: string; roughnessMap?: string; displacementMap?: string } } => {
  const patterns = [
    { name: 'hologram', type: 'hologram' },
    { name: 'galaxy', type: 'galaxy' },
    { name: 'marble', type: 'marble' },
    { name: 'carbon fiber', type: 'carbon_fiber' },
    { name: 'nebula', type: 'nebula' },
    { name: 'circuit', type: 'circuit' },
    { name: 'brushed_metal', type: 'brushed_metal' },
    { name: 'velvet', type: 'velvet' },
    { name: 'sandstone', type: 'sandstone' },
    { name: 'plasma', type: 'plasma' },
    { name: 'wood', type: 'wood' },
    { name: 'rust', type: 'rust' },
  ];

  const lowerText = text.toLowerCase();
  for (const pattern of patterns) {
    if (lowerText.includes(pattern.name)) {
      const map = generateProceduralTexture(pattern.type, 512, params);
      const normalMap = generateProceduralTexture(pattern.type + '_normal', 512, params);
      const roughnessMap = generateProceduralTexture(pattern.type + '_roughness', 512, params);
      const displacementMap = ['marble', 'sandstone', 'wood', 'rust'].includes(pattern.type)
        ? generateProceduralTexture(pattern.type + '_displacement', 512, params)
        : undefined;

      return {
        pattern: pattern.name,
        maps: {
          map,
          normalMap,
          roughnessMap,
          displacementMap,
        },
      };
    }
  }

  return { pattern: null, maps: {} };
};

export const generateProceduralTexture = (type: string, size: number = 512, params: Partial<MaterialParams> = {}): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return '';

  // Extract parameters for customization
  const baseColor = params.color || '#ffffff';
  const secondaryColor = params.secondaryColor || adjustColorBrightness(baseColor, 0.7);
  const textureScale = params.textureScale || 1.0;
  const noiseScale = params.noiseScale || 50;

  // Enhanced noise with layered patterns
  const layeredNoise = (x: number, y: number) => {
    return (
      noise(x / noiseScale, y / noiseScale) * 0.5 +
      noise(x / (noiseScale * 2), y / (noiseScale * 2)) * 0.3 +
      noise(x / (noiseScale * 4), y / (noiseScale * 4)) * 0.2
    );
  };

  const applyColor = (value: number): string => {
    const t = (value + 1) / 2;
    const color1 = new THREE.Color(baseColor);
    const color2 = new THREE.Color(secondaryColor);
    const blended = color1.lerp(color2, t);
    return `#${blended.getHexString()}`;
  };

  if (type === 'noise') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'wave') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = Math.sin((x + y) / (15 / textureScale)) + layeredNoise(x, y) * 0.3;
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'voronoi') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale) * Math.cos(x / (20 / textureScale));
        const r = Math.floor((value + 1) * 100 + 100);
        const g = Math.floor((value + 1) * 80 + 80);
        const b = Math.floor((value + 1) * 120 + 60);
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'hologram') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = Math.sin(x / (20 / textureScale)) + Math.cos(y / (20 / textureScale)) + layeredNoise(x, y);
        const r = Math.floor((Math.sin(value * Math.PI) + 1) * 127.5);
        const g = Math.floor((Math.cos(value * Math.PI) + 1) * 127.5);
        const b = Math.floor((Math.sin(value * Math.PI * 2) + 1) * 127.5);
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'hologram_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'hologram_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'galaxy') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const star = layeredNoise(x / (10 / textureScale), y / (10 / textureScale)) > 0.95 ? 1 : 0;
        const base = layeredNoise(x / (100 / textureScale), y / (100 / textureScale));
        const r = Math.floor((base + 1) * 30 + star * 200);
        const g = Math.floor((base + 1) * 40 + star * 200);
        const b = Math.floor((base + 1) * 80 + star * 255);
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'galaxy_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'galaxy_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'marble') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (80 / textureScale), y / (80 / textureScale)) + 0.3 * Math.sin(x / (40 / textureScale) + layeredNoise(y / 100, x / 100));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'marble_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'marble_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'marble_displacement') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 127.5);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'carbon_fiber') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const weave = (Math.sin(x / (10 / textureScale)) + Math.sin(y / (10 / textureScale))) > 0 ? 1 : 0;
        const value = layeredNoise(x / (50 / textureScale), y / (50 / textureScale)) * 0.2 + weave * 0.8;
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'carbon_fiber_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'carbon_fiber_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'nebula') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (60 / textureScale), y / (60 / textureScale)) + 0.5 * layeredNoise(x / (120 / textureScale), y / (120 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'nebula_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'nebula_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'circuit') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (20 / textureScale), y / (20 / textureScale)) > 0.3 ? 1 : 0;
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'circuit_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'circuit_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'brushed_metal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (5 / textureScale), y / (100 / textureScale)) + 0.5 * Math.sin(x / (20 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'brushed_metal_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'brushed_metal_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'velvet') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (30 / textureScale), y / (30 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'velvet_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'velvet_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'sandstone') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (60 / textureScale), y / (60 / textureScale)) + 0.2 * layeredNoise(x / (120 / textureScale), y / (120 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'sandstone_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'sandstone_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'sandstone_displacement') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 127.5);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'plasma') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = Math.sin(x / (40 / textureScale)) + Math.cos(y / (40 / textureScale)) + layeredNoise(x / (60 / textureScale), y / (60 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'plasma_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'plasma_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'wood') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (100 / textureScale), y / (10 / textureScale)) + 0.5 * Math.sin(y / (20 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'wood_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'wood_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'wood_displacement') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 127.5);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'rust') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x / (40 / textureScale), y / (40 / textureScale));
        context.fillStyle = applyColor(value);
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'rust_normal') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const r = Math.floor((value + 1) * 127.5);
        const g = Math.floor((value + 1) * 127.5);
        const b = 255;
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'rust_roughness') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 64 + 64);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  } else if (type === 'rust_displacement') {
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const value = layeredNoise(x * textureScale, y * textureScale);
        const gray = Math.floor((value + 1) * 127.5);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  return canvas.toDataURL();
};

const detectBorder = (text: string): { showBorder: boolean; borderColor?: string; borderWidth?: number } => {
  const lowerText = text.toLowerCase();
  const result: { showBorder: boolean; borderColor?: string; borderWidth?: number } = { showBorder: false };

  if (lowerText.match(/\b(border|outline|edge|frame)\b/)) {
    result.showBorder = true;

    const borderColorMatch = lowerText.match(/(\w+)\s+(border|outline|edge|frame)/);
    if (borderColorMatch) {
      const possibleColor = extractColor(borderColorMatch[1], '');
      if (possibleColor) result.borderColor = possibleColor;
    }

    if (lowerText.match(/\b(thin|narrow|subtle)\b/)) {
      result.borderWidth = 2;
    } else if (lowerText.match(/\b(thick|wide|bold)\b/)) {
      result.borderWidth = 8;
    } else {
      result.borderWidth = 5;
    }
  }

  if (lowerText.match(/\b(no border|borderless|no outline)\b/)) {
    result.showBorder = false;
  }

  return result;
};

const detectGradient = (text: string): string[] | null => {
  const lowerText = text.toLowerCase();
  const gradientPatterns = [
    /\b(gradient|fade|blend)\s+(\w+)\s+(?:to|and|into)\s+(\w+)\b/i,
    /\b(\w+)\s+to\s+(\w+)\s+(gradient|fade|blend)\b/i,
    /\b(\w+)\s+and\s+(\w+)\s+(gradient|blend)\b/i,
    /\b(subtle|soft)\s+(\w+)\s+gradient\b/i,
  ];

  for (const pattern of gradientPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      if (/\b(subtle|soft)\b/.test(lowerText)) {
        const color = extractColor(match[2], '');
        return color ? [color, adjustColorBrightness(color, 0.8)] : null;
      }
      const color1 = extractColor(match[2] || match[1], '');
      const color2 = extractColor(match[3] || match[2], '');
      if (color1 && color2) return [color1, color2];
    }
  }

  return null;
};

export const adjustColorBrightness = (hex: string, factor: number): string => {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.l = Math.min(1, Math.max(0, hsl.l * factor));
  hsl.s = Math.min(1, hsl.s * 1.2);
  const newColor = new THREE.Color();
  newColor.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${newColor.getHexString()}`;
};

const generateEnhancedMaterialParams = (prompt: string): MaterialParams => {
  const lowerPrompt = prompt.toLowerCase();
  const theme = analyzeTheme(prompt);
  const params: MaterialParams = {};

  const materialQualities = identifyMaterialQualities(prompt);
  Object.assign(params, materialQualities);

  const gradientColors = detectGradient(prompt);
  if (gradientColors) {
    params.gradientColors = gradientColors;
    params.customEffects = [...(params.customEffects || []), 'gradient'];
  } else {
    const color = extractColor(prompt, theme);
    params.color = color || getThemeColor(theme);
  }

  if (params.emissiveIntensity && lowerPrompt.match(/\b(glow|glowing|neon|radiant|pulsing)\b/)) {
    params.emissive = params.gradientColors ? params.gradientColors[0] : params.color || '#ffffff';
    params.animateEmissive = true;
  } else {
    params.emissiveIntensity = 0;
    params.emissive = undefined;
  }

  const { pattern, maps } = identifyTexturePattern(prompt, params);
  if (pattern) {
    params.texturePattern = pattern;
    Object.assign(params, maps);
    params.textureScale = lowerPrompt.includes('large') ? 3.0 : lowerPrompt.includes('small') ? 1.0 : 1.5;
    params.normalScale = lowerPrompt.includes('detailed') ? 1.5 : 1.2;
    params.displacementScale = lowerPrompt.includes('bumpy') ? 0.2 : 0.15;
  } else {
    if (lowerPrompt.match(/\b(noisy|grainy|speckled)\b/)) {
      params.proceduralTexture = generateProceduralTexture('noise', 512, params);
      params.textureScale = 2.0;
    } else if (lowerPrompt.match(/\b(wavy|rippling|flowing)\b/)) {
      params.proceduralTexture = generateProceduralTexture('wave', 512, params);
      params.textureScale = 2.0;
    } else if (lowerPrompt.match(/\b(voronoi|cell-like|cracked)\b/)) {
      params.proceduralTexture = generateProceduralTexture('voronoi', 512, params);
      params.textureScale = 2.5;
    } else if (lowerPrompt.match(/\b(marble|veined|smooth stone)\b/)) {
      params.proceduralTexture = generateProceduralTexture('marble', 512, params);
      params.textureScale = 1.8;
      params.displacementScale = 0.1;
    } else if (lowerPrompt.match(/\b(circuit|tech|cyber)\b/)) {
      params.proceduralTexture = generateProceduralTexture('circuit', 512, params);
      params.textureScale = 1.5;
      params.normalScale = 1.0;
    } else if (lowerPrompt.match(/\b(plasma|energy|electric)\b/)) {
      params.proceduralTexture = generateProceduralTexture('plasma', 512, params);
      params.textureScale = 2.0;
      params.emissiveIntensity = 1.5;
      params.animateEmissive = true;
    } else if (lowerPrompt.match(/\b(wood|grainy wood|oak)\b/)) {
      params.proceduralTexture = generateProceduralTexture('wood', 512, params);
      params.textureScale = 1.8;
      params.displacementScale = 0.12;
    } else if (lowerPrompt.match(/\b(rust|rusted|corroded)\b/)) {
      params.proceduralTexture = generateProceduralTexture('rust', 512, params);
      params.textureScale = 2.0;
      params.roughness = 0.9;
      params.displacementScale = 0.15;
    }
  }

  const borderProps = detectBorder(prompt);
  params.showBorder = borderProps.showBorder;
  if (borderProps.showBorder) {
    params.borderColor = borderProps.borderColor || createComplementaryColor(params.color || params.gradientColors?.[0]);
    params.borderWidth = borderProps.borderWidth || 6;
  }

  if (lowerPrompt.includes('velvet')) {
    params.sheen = 1.2;
    params.sheenColor = params.color || '#ffffff';
  }

  if (lowerPrompt.includes('brushed') && lowerPrompt.includes('metal')) {
    params.anisotropy = 1.0;
    params.clearcoat = 0.7;
  }

  if (lowerPrompt.match(/\b(rotating|spinning)\b/)) {
    params.animationType = 'rotate';
    params.animationSpeed = 0.03;
  }

  return params;
};

const generateFallbackMaterialParams = (prompt: string): MaterialParams => {
  const theme = analyzeTheme(prompt);
  const params: MaterialParams = {
    color: getThemeColor(theme),
    metalness: 0.5,
    roughness: 0.5,
    emissiveIntensity: 0,
    opacity: 1.0,
    showBorder: true,
    borderColor: '#ffffff',
    borderWidth: 5,
  };

  if (Math.random() > 0.5) {
    params.gradientColors = [params.color!, adjustColorBrightness(params.color!, 0.7)];
    params.customEffects = ['gradient'];
  }

  if (Math.random() > 0.7) {
    params.proceduralTexture = generateProceduralTexture('noise', 512, params);
    params.textureScale = 1.5;
  }

  return params;
};

const enhanceMaterialParams = (params: MaterialParams, prompt: string): MaterialParams => {
  const enhancedParams = { ...params };
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('iridescent') || lowerPrompt.includes('pearlescent')) {
    enhancedParams.iridescence = 1.2;
    enhancedParams.iridescenceIor = 2.0;
  }

  if (lowerPrompt.includes('glossy') || lowerPrompt.includes('polished')) {
    enhancedParams.clearcoat = 1.2;
    enhancedParams.clearcoatRoughness = 0.05;
  }

  if (lowerPrompt.includes('matte')) {
    enhancedParams.roughness = 0.95;
    enhancedParams.clearcoat = 0;
  }

  if (lowerPrompt.match(/\b(vibrant|bright)\b/)) {
    if (enhancedParams.color) {
      enhancedParams.color = adjustColorBrightness(enhancedParams.color, 1.4);
    }
    if (enhancedParams.gradientColors) {
      enhancedParams.gradientColors = enhancedParams.gradientColors.map(c => adjustColorBrightness(c, 1.4));
    }
    enhancedParams.emissiveIntensity = 1.8;
  }

  if (lowerPrompt.match(/\b(soft|gentle|diffuse)\b/)) {
    enhancedParams.sheen = 0.8;
    enhancedParams.envMapIntensity = 0.7;
  }

  if (lowerPrompt.match(/\b(neon|radiant)\b/)) {
    enhancedParams.emissiveIntensity = 2.0;
    enhancedParams.animateEmissive = true;
    enhancedParams.animationType = 'pulse';
  }

  if (lowerPrompt.match(/\b(metallic|shiny)\b/)) {
    enhancedParams.metalness = Math.min(1.0, (enhancedParams.metalness || 0.5) + 0.2);
    enhancedParams.clearcoat = 0.8;
  }

  return enhancedParams;
};

export const generateCubeSkin = async ({ prompt }: GenerateCubeSkinParams): Promise<{ materialParams: MaterialParams }> => {
  try {
    let materialParams = await generateAIMaterialParams(prompt);
    materialParams = enhanceMaterialParams(materialParams, prompt);

    if (!materialParams.color && !materialParams.gradientColors) {
      const theme = analyzeTheme(prompt);
      materialParams.color = getThemeColor(theme);
    }

    materialParams.metalness = materialParams.metalness ?? 0.5;
    materialParams.roughness = materialParams.roughness ?? 0.5;
    materialParams.emissiveIntensity = materialParams.emissiveIntensity ?? 0;
    materialParams.opacity = materialParams.opacity ?? 1.0;

    if (materialParams.showBorder) {
      materialParams.borderColor = materialParams.borderColor || createComplementaryColor(materialParams.color || materialParams.gradientColors?.[0]);
      materialParams.borderWidth = materialParams.borderWidth || 5;
    }

    return { materialParams };
  } catch (error) {
    console.error('Error in generateCubeSkin:', error);
    return {
      materialParams: generateFallbackMaterialParams(prompt),
    };
  }
};

export const trackUserFeedback = async (prompt: string, materialParams: MaterialParams, userRating?: number): Promise<void> => {
  try {
    console.log('Feedback:', { prompt, materialParams, userRating, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
};

function analyzeTheme(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.match(/cosmic|galaxy|space|nebula|star/)) return 'cosmic';
  if (lowerPrompt.match(/hologram|holographic|iridescent|rainbow|pearlescent/)) return 'hologram';
  if (lowerPrompt.match(/ocean|sea|water/)) return 'ocean';
  if (lowerPrompt.match(/fire|flame|burning/)) return 'fire';
  if (lowerPrompt.match(/ice|frost|frozen/)) return 'ice';
  if (lowerPrompt.match(/neon|cyberpunk|synthwave/)) return 'cyberpunk';
  if (lowerPrompt.match(/nature|forest|plant|sandstone/)) return 'nature';
  if (lowerPrompt.match(/magical|mystical|enchanted/)) return 'mystical';

  return 'neutral';
}

function getThemeColor(theme: string): string {
  const themeColors: { [key: string]: string } = {
    cosmic: '#2d1a4d',
    hologram: '#7dd3fc',
    ocean: '#0284c7',
    fire: '#ff4d00',
    ice: '#a5f3fc',
    cyberpunk: '#00ffcc',
    nature: '#15803d',
    mystical: '#6b21a8',
    neutral: '#666666',
  };

  return themeColors[theme] || '#666666';
}

function createComplementaryColor(color?: string): string {
  if (!color) return '#ffffff';
  const hexColor = color.replace('#', '');
  const numColor = parseInt(hexColor, 16);
  const complement = 0xFFFFFF ^ numColor;
  return `#${complement.toString(16).padStart(6, '0')}`;
}