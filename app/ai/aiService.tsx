import axios from 'axios';

interface GenerateCubeSkinParams {
  prompt: string;
}

interface CubeSkinResponse {
  textureUrl?: string;
  materialParams: {
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
    bumpScale?: number; // For surface detail
    normalScale?: number; // For realistic lighting effects
    animateEmissive?: boolean; // For dynamic emissive effects
  };
}

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.x.ai/grok3/generate';
const API_KEY = process.env.AI_API_KEY || '';

const colorMap: { [key: string]: string } = {
  red: '#ff0000',
  blue: '#0000ff',
  green: '#00ff00',
  cyan: '#00ffcc',
  magenta: '#ff00ff',
  yellow: '#ffff00',
  white: '#ffffff',
  black: '#000000',
  purple: '#800080',
  orange: '#ffa500',
  pink: '#ff69b4',
  'pastel blue': '#add8e6',
  'neon green': '#39ff14',
  'deep purple': '#4b0082',
  'amber orange': '#ffbf00',
  'dark brown': '#5c4033',
  'sky blue': '#87ceeb',
  'emerald green': '#50c878',
  'navy blue': '#000080',
  silver: '#c0c0c0',
  gold: '#ffd700',
  beige: '#f5f5dc',
  chrome: '#d3d3d3',
  'dark gray': '#333333',
  'bright red': '#ff4040',
  teal: '#008080',
  lavender: '#e6e6fa',
  coral: '#ff7f50',
  'lime green': '#32cd32',
  'midnight blue': '#191970',
  'rose pink': '#ff66cc',
  'forest green': '#228b22',
  'sunset orange': '#ff4500',
  'ice blue': '#f0f8ff',
  'charcoal gray': '#36454f',
  'ruby red': '#e0115f',
  'golden yellow': '#ffc107',
  'violet': '#ee82ee',
  'turquoise': '#40e0d0',
  'maroon': '#800000',
  'olive green': '#808000',
  'peach': '#ffe5b4',
  'platinum': '#e5e4e2',
  'copper': '#b87333',
  'bronze': '#cd7f32',
};

// Enhanced texture mapping with more properties
const textureMap: { [key: string]: { 
  metalness: number; 
  roughness: number; 
  emissiveIntensity: number; 
  transparent: boolean; 
  opacity: number; 
  bumpScale: number; 
  normalScale: number; 
  animateEmissive: boolean 
} } = {
  'glossy plastic': { 
    metalness: 0.3, 
    roughness: 0.05, 
    emissiveIntensity: 0.2, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.02, 
    normalScale: 0.5, 
    animateEmissive: false 
  },
  'soft matte': { 
    metalness: 0.0, 
    roughness: 0.95, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.05, 
    normalScale: 0.2, 
    animateEmissive: false 
  },
  'glowing smooth': { 
    metalness: 0.4, 
    roughness: 0.15, 
    emissiveIntensity: 1.2, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.01, 
    normalScale: 0.3, 
    animateEmissive: true 
  },
  'brushed metal': { 
    metalness: 0.9, 
    roughness: 0.25, 
    emissiveIntensity: 0.1, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.03, 
    normalScale: 0.8, 
    animateEmissive: false 
  },
  'glassy reflective': { 
    metalness: 0.7, 
    roughness: 0.02, 
    emissiveIntensity: 0.5, 
    transparent: true, 
    opacity: 0.85, 
    bumpScale: 0.01, 
    normalScale: 0.4, 
    animateEmissive: false 
  },
  'rugged wooden': { 
    metalness: 0.0, 
    roughness: 0.9, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.1, 
    normalScale: 0.6, 
    animateEmissive: false 
  },
  'shiny ceramic': { 
    metalness: 0.5, 
    roughness: 0.1, 
    emissiveIntensity: 0.4, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.02, 
    normalScale: 0.5, 
    animateEmissive: false 
  },
  'carbon fiber': { 
    metalness: 0.8, 
    roughness: 0.2, 
    emissiveIntensity: 0.1, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.03, 
    normalScale: 0.7, 
    animateEmissive: false 
  },
  'rough stone': { 
    metalness: 0.0, 
    roughness: 0.98, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.15, 
    normalScale: 0.8, 
    animateEmissive: false 
  },
  'soft leather': { 
    metalness: 0.0, 
    roughness: 0.75, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.05, 
    normalScale: 0.4, 
    animateEmissive: false 
  },
  'polished marble': { 
    metalness: 0.6, 
    roughness: 0.05, 
    emissiveIntensity: 0.3, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.02, 
    normalScale: 0.5, 
    animateEmissive: false 
  },
  'frosted glass': { 
    metalness: 0.4, 
    roughness: 0.9, 
    emissiveIntensity: 0.2, 
    transparent: true, 
    opacity: 0.6, 
    bumpScale: 0.03, 
    normalScale: 0.3, 
    animateEmissive: false 
  },
  'velvet': { 
    metalness: 0.0, 
    roughness: 0.9, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.04, 
    normalScale: 0.2, 
    animateEmissive: false 
  },
  'neon glow': { 
    metalness: 0.3, 
    roughness: 0.2, 
    emissiveIntensity: 1.8, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.01, 
    normalScale: 0.3, 
    animateEmissive: true 
  },
  'scratched metal': { 
    metalness: 0.85, 
    roughness: 0.4, 
    emissiveIntensity: 0.05, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.06, 
    normalScale: 0.9, 
    animateEmissive: false 
  },
  'smooth silk': { 
    metalness: 0.2, 
    roughness: 0.15, 
    emissiveIntensity: 0.2, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.02, 
    normalScale: 0.3, 
    animateEmissive: false 
  },
  'cracked earth': { 
    metalness: 0.0, 
    roughness: 0.95, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.2, 
    normalScale: 0.7, 
    animateEmissive: false 
  },
  'polished wood': { 
    metalness: 0.2, 
    roughness: 0.25, 
    emissiveIntensity: 0.1, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.05, 
    normalScale: 0.5, 
    animateEmissive: false 
  },
  'diamond sparkle': { 
    metalness: 0.95, 
    roughness: 0.02, 
    emissiveIntensity: 0.8, 
    transparent: true, 
    opacity: 0.9, 
    bumpScale: 0.03, 
    normalScale: 0.6, 
    animateEmissive: true 
  },
  'rusty iron': { 
    metalness: 0.7, 
    roughness: 0.65, 
    emissiveIntensity: 0.0, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.08, 
    normalScale: 0.8, 
    animateEmissive: false 
  },
  default: { 
    metalness: 0.5, 
    roughness: 0.5, 
    emissiveIntensity: 0.2, 
    transparent: false, 
    opacity: 1.0, 
    bumpScale: 0.03, 
    normalScale: 0.4, 
    animateEmissive: false 
  },
};

const parsePrompt = (prompt: string) => {
  const lowerPrompt = prompt.toLowerCase();
  let color: string | undefined = undefined;
  let gradientColors: string[] | undefined = undefined;
  let borderColor: string | undefined = undefined;
  let borderWidth: number | undefined = undefined;
  let textureStyle: string | undefined = undefined;

  const colorsInPrompt = Object.keys(colorMap).filter((colorName) =>
    lowerPrompt.includes(colorName)
  );

  const faceColorIndex = lowerPrompt.indexOf('faces') !== -1 ? lowerPrompt.indexOf('faces') : lowerPrompt.indexOf('cube');
  let faceColors: string[] = [];
  if (faceColorIndex !== -1) {
    faceColors = colorsInPrompt.filter((colorName) =>
      lowerPrompt.indexOf(colorName) < faceColorIndex
    );
  } else {
    faceColors = colorsInPrompt.length > 0 ? [colorsInPrompt[0]] : [];
  }

  if (lowerPrompt.includes('gradient')) {
    if (colorsInPrompt.length >= 2) {
      gradientColors = colorsInPrompt.map((colorName) => colorMap[colorName]).slice(0, 2);
    } else if (faceColors.length === 1) {
      gradientColors = [colorMap[faceColors[0]], '#ffffff'];
    } else {
      gradientColors = ['#ff00ff', '#00ffcc'];
    }
  } else if (faceColors.length > 0) {
    color = colorMap[faceColors[0]];
  } else {
    color = '#ffffff';
  }

  const borderIndex = lowerPrompt.indexOf('border');
  if (borderIndex !== -1) {
    const borderColors = colorsInPrompt.filter((colorName) => {
      const colorIndex = lowerPrompt.indexOf(colorName);
      return colorIndex > borderIndex;
    });
    borderColor = borderColors.length > 0 ? colorMap[borderColors[0]] : '#00ffcc';

    if (lowerPrompt.includes('thick')) {
      borderWidth = 5;
    } else if (lowerPrompt.includes('thin')) {
      borderWidth = 1;
    } else {
      borderWidth = 3;
    }
  } else {
    const baseColor = color || (gradientColors ? gradientColors[0] : '#ffffff');
    borderColor = baseColor === '#ffffff' ? '#000000' : '#ffffff';
    borderWidth = 3;
  }

  for (const texture of Object.keys(textureMap)) {
    if (lowerPrompt.includes(texture)) {
      textureStyle = texture;
      break;
    }
  }

  if (!textureStyle) {
    if (lowerPrompt.includes('shiny') || lowerPrompt.includes('glossy') || lowerPrompt.includes('polished')) {
      textureStyle = 'glossy plastic';
    } else if (lowerPrompt.includes('matte') || lowerPrompt.includes('soft') || lowerPrompt.includes('velvet')) {
      textureStyle = 'soft matte';
    } else if (lowerPrompt.includes('glowing') || lowerPrompt.includes('neon')) {
      textureStyle = 'glowing smooth';
    } else if (lowerPrompt.includes('metal') || lowerPrompt.includes('metallic') || lowerPrompt.includes('brushed')) {
      textureStyle = 'brushed metal';
    } else if (lowerPrompt.includes('glass') || lowerPrompt.includes('reflective')) {
      textureStyle = 'glassy reflective';
    } else if (lowerPrompt.includes('wood') || lowerPrompt.includes('wooden')) {
      textureStyle = 'rugged wooden';
    } else if (lowerPrompt.includes('stone') || lowerPrompt.includes('rock')) {
      textureStyle = 'rough stone';
    } else if (lowerPrompt.includes('leather')) {
      textureStyle = 'soft leather';
    } else if (lowerPrompt.includes('marble')) {
      textureStyle = 'polished marble';
    } else if (lowerPrompt.includes('frosted')) {
      textureStyle = 'frosted glass';
    } else if (lowerPrompt.includes('silk')) {
      textureStyle = 'smooth silk';
    } else if (lowerPrompt.includes('diamond')) {
      textureStyle = 'diamond sparkle';
    } else if (lowerPrompt.includes('rusty')) {
      textureStyle = 'rusty iron';
    } else {
      textureStyle = 'default';
    }
  }

  return { color, gradientColors, borderColor, borderWidth, textureStyle };
};

const mockCubeSkinResponse = (params: GenerateCubeSkinParams): CubeSkinResponse => {
  const { prompt } = params;
  const { color, gradientColors, borderColor, borderWidth, textureStyle } = parsePrompt(prompt);

  const selectedTexture = textureStyle || 'default';
  const textureProps = textureMap[selectedTexture] || textureMap['default'];

  const materialParams = {
    color: gradientColors ? undefined : (color || '#ffffff'),
    metalness: textureProps.metalness,
    roughness: textureProps.roughness,
    emissive: gradientColors ? gradientColors[0] : (color || '#ffffff'),
    emissiveIntensity: textureProps.emissiveIntensity,
    map: undefined,
    gradientColors,
    borderColor: borderColor || '#00ffcc',
    borderWidth: borderWidth || 3,
    transparent: textureProps.transparent,
    opacity: textureProps.opacity,
    bumpScale: textureProps.bumpScale,
    normalScale: textureProps.normalScale,
    animateEmissive: textureProps.animateEmissive,
  };

  return {
    textureUrl: undefined,
    materialParams,
  };
};

export const generateCubeSkin = async ({
  prompt,
}: GenerateCubeSkinParams): Promise<CubeSkinResponse> => {
  try {
    console.log('Using mock response for generateCubeSkin:', { prompt });
    return mockCubeSkinResponse({ prompt });
  } catch (error) {
    console.error('Error generating cube skin:', error);
    throw new Error('Failed to generate cube skin. Please try again.');
  }
};