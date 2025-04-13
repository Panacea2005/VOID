import axios from 'axios';

// Environment variables
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;

// Ensure all required API keys are available
if (!AI_API_KEY || !AI_API_URL) {
  console.warn('Warning: AI API keys not properly configured');
}

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
}

interface GenerateCubeSkinParams {
  prompt: string;
}

// Advanced AI-driven material parameter generation
const generateAIMaterialParams = async (prompt: string): Promise<MaterialParams> => {
  try {
    const response = await axios.post(
      `${AI_API_URL}/material-generation`,
      {
        prompt,
        model: "creative_materials_v3", // Upgraded model for better creativity
        options: {
          temperature: 0.9, // Increased for more creative outputs
          max_tokens: 1500,
          creative_mode: true,
          context_aware: true, // Ensure context is considered
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.materialParams) {
      return response.data.materialParams;
    }

    throw new Error('Invalid AI response structure');
  } catch (error) {
    console.error('Error generating AI material parameters:', error);
    return generateFallbackMaterialParams(prompt);
  }
};

// Enhanced color extraction with theme-based defaults
const extractColor = (text: string, theme: string): string | null => {
  const hexMatch = text.match(/#([0-9a-f]{3,8})\b/i);
  if (hexMatch) return hexMatch[0];

  const rgbMatch = text.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }

  const colorDescriptions: { [key: string]: string } = {
    'deep blue': '#0000aa',
    'vibrant red': '#ff0033',
    'electric blue': '#0066ff',
    'neon green': '#39ff14',
    'metallic gold': '#ffd700',
    'sunset orange': '#ff7e47',
    'royal purple': '#7851a9',
    'forest green': '#228b22',
    'crimson red': '#dc143c',
    'aqua blue': '#00ffff',
    'midnight black': '#000000',
    'cosmic purple': '#762cec',
    'ocean blue': '#0077be',
    'fiery orange': '#ff4500',
    'emerald green': '#50c878',
    'hot pink': '#ff69b4',
    'deep violet': '#9400d3',
  };

  for (const [desc, color] of Object.entries(colorDescriptions)) {
    if (text.toLowerCase().includes(desc)) {
      return color;
    }
  }

  const basicColors: { [key: string]: string } = {
    'red': '#ff0000',
    'orange': '#ffa500',
    'yellow': '#ffff00',
    'green': '#00ff00',
    'blue': '#0000ff',
    'purple': '#800080',
    'pink': '#ffc0cb',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#808080',
    'silver': '#c0c0c0',
    'gold': '#ffd700',
  };

  for (const [name, color] of Object.entries(basicColors)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(text)) {
      return color;
    }
  }

  // Theme-based color selection
  const themeColors: { [key: string]: string } = {
    cosmic: '#1e1b4b',
    galaxy: '#2d1a4d',
    hologram: '#a3e7fc',
    neon: '#ff00ff',
    ocean: '#0077be',
    fire: '#ff4500',
    ice: '#e0f7fa',
    cyberpunk: '#00ffcc',
    mystical: '#4b0082',
    nature: '#228b22',
  };

  return themeColors[theme] || null;
};

// Advanced material quality identification
const identifyMaterialQualities = (text: string): Record<string, number> => {
  const lowerText = text.toLowerCase();
  const qualities: Record<string, number> = {
    metalness: 0.5,
    roughness: 0.5,
    emissiveIntensity: 0,
    transparent: 0,
    iridescence: 0,
    clearcoat: 0,
    anisotropy: 0,
    sheen: 0,
  };

  const metallicWords = [
    { term: 'chrome', value: 1.0 },
    { term: 'metal', value: 0.9 },
    { term: 'steel', value: 0.95 },
    { term: 'silver', value: 0.95 },
    { term: 'gold', value: 0.9 },
    { term: 'hologram', value: 0.8 },
  ];

  for (const { term, value } of metallicWords) {
    if (lowerText.includes(term)) {
      qualities.metalness = value;
      break;
    }
  }

  const nonMetallicMaterials = ['plastic', 'wood', 'fabric', 'glass', 'crystal'];
  for (const material of nonMetallicMaterials) {
    if (lowerText.includes(material)) {
      qualities.metalness = Math.max(0, qualities.metalness - 0.5);
      break;
    }
  }

  if (lowerText.match(/\b(rough|coarse|textured)\b/)) {
    qualities.roughness = Math.min(1, qualities.roughness + 0.4);
  }

  if (lowerText.match(/\b(smooth|polished|shiny|glossy|hologram)\b/)) {
    qualities.roughness = Math.max(0, qualities.roughness - 0.4);
  }

  if (lowerText.match(/\b(glow|glowing|neon|radiant|hologram)\b/)) {
    qualities.emissiveIntensity = 1.2;
  }

  if (lowerText.match(/\b(transparent|translucent|glass|crystal|hologram)\b/)) {
    qualities.transparent = 1;
  }

  if (lowerText.match(/\b(iridescent|hologram|rainbow)\b/)) {
    qualities.iridescence = 1;
  }

  return qualities;
};

// Enhanced texture pattern identification
const identifyTexturePattern = (text: string): { pattern: string | null; maps: { map?: string; normalMap?: string; roughnessMap?: string } } => {
  const patterns = [
    { name: 'hologram', map: '/textures/hologram.png', normalMap: '/textures/hologram_normal.png', roughnessMap: '/textures/hologram_roughness.png' },
    { name: 'galaxy', map: '/textures/galaxy.png', normalMap: '/textures/galaxy_normal.png', roughnessMap: '/textures/galaxy_roughness.png' },
    { name: 'marble', map: '/textures/marble.png', normalMap: '/textures/marble_normal.png', roughnessMap: '/textures/marble_roughness.png' },
    { name: 'carbon fiber', map: '/textures/carbon_fiber.png', normalMap: '/textures/carbon_fiber_normal.png', roughnessMap: '/textures/carbon_fiber_roughness.png' },
    { name: 'nebula', map: '/textures/nebula.png', roughnessMap: '/textures/nebula_roughness.png' },
    { name: 'circuit', map: '/textures/circuit.png', roughnessMap: '/textures/circuit_roughness.png' },
  ];

  const lowerText = text.toLowerCase();
  for (const pattern of patterns) {
    if (lowerText.includes(pattern.name)) {
      return {
        pattern: pattern.name,
        maps: {
          map: pattern.map,
          normalMap: pattern.normalMap,
          roughnessMap: pattern.roughnessMap,
        },
      };
    }
  }

  return { pattern: null, maps: {} };
};

// Enhanced border detection
const detectBorder = (text: string): { showBorder: boolean; borderColor?: string; borderWidth?: number } => {
  const lowerText = text.toLowerCase();
  const result: { showBorder: boolean; borderColor?: string; borderWidth?: number } = { showBorder: false };

  if (lowerText.match(/\b(border|outline|edge|frame)\b/)) {
    result.showBorder = true;

    const borderColorMatch = lowerText.match(/(\w+)\s+(border|outline|edge|frame)/);
    if (borderColorMatch) {
      const possibleColor = extractColor(borderColorMatch[1], '');
      if (possibleColor) {
        result.borderColor = possibleColor;
      }
    }

    if (lowerText.match(/\b(thin|narrow)\b/)) {
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

// Detect gradient
const detectGradient = (text: string): string[] | null => {
  const lowerText = text.toLowerCase();
  const gradientPatterns = [
    /\b(gradient|fade|blend)\s+(from|of|with)\s+(\w+)\s+(to|into)\s+(\w+)\b/i,
    /\b(\w+)\s+to\s+(\w+)\s+(gradient|fade|blend)\b/i,
  ];

  for (const pattern of gradientPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const color1 = extractColor(match[3] || match[1], '');
      const color2 = extractColor(match[5] || match[2], '');
      if (color1 && color2) {
        return [color1, color2];
      }
    }
  }

  return null;
};

// Enhanced fallback material generation
const generateFallbackMaterialParams = (prompt: string): MaterialParams => {
  const lowerPrompt = prompt.toLowerCase();
  const theme = analyzeTheme(prompt);
  const params: MaterialParams = {};

  const materialQualities = identifyMaterialQualities(prompt);
  params.metalness = materialQualities.metalness;
  params.roughness = materialQualities.roughness;
  params.emissiveIntensity = materialQualities.emissiveIntensity;

  if (materialQualities.transparent) {
    params.transparent = true;
    params.opacity = 0.7;
  }

  if (materialQualities.iridescence) {
    params.iridescence = 1.0;
    params.iridescenceIor = 1.8;
  }

  const gradientColors = detectGradient(prompt);
  if (gradientColors) {
    params.gradientColors = gradientColors;
  } else {
    const color = extractColor(prompt, theme);
    params.color = color || getThemeColor(theme);
    if (params.emissiveIntensity > 0) {
      params.emissive = params.color;
      params.animateEmissive = lowerPrompt.includes('pulse') || lowerPrompt.includes('hologram');
    }
  }

  const { pattern, maps } = identifyTexturePattern(prompt);
  if (pattern) {
    params.texturePattern = pattern;
    params.map = maps.map;
    params.normalMap = maps.normalMap;
    params.roughnessMap = maps.roughnessMap;
    params.textureScale = 1.0;
    params.normalScale = 0.8;
  }

  const borderProps = detectBorder(prompt);
  params.showBorder = borderProps.showBorder;
  if (borderProps.showBorder) {
    params.borderColor = borderProps.borderColor || createComplementaryColor(params.color);
    params.borderWidth = borderProps.borderWidth || 5;
  }

  if (lowerPrompt.includes('hologram')) {
    params.iridescence = 1.0;
    params.transparent = true;
    params.opacity = 0.6;
    params.customEffects = ['hologramGlow', 'rainbowShift'];
  }

  if (lowerPrompt.includes('galaxy')) {
    params.customEffects = ['starfield', 'nebulaSwirl'];
    params.emissiveIntensity = 1.0;
    params.envMapIntensity = 1.2;
  }

  return params;
};

// Enhance material parameters with realistic effects
const enhanceMaterialParams = (params: MaterialParams, prompt: string): MaterialParams => {
  const enhancedParams = { ...params };
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('hologram')) {
    enhancedParams.iridescence = 1.0;
    enhancedParams.emissiveIntensity = Math.max(enhancedParams.emissiveIntensity || 0, 1.0);
    enhancedParams.animateEmissive = true;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'hologramGlow'];
  }

  if (lowerPrompt.includes('galaxy') || lowerPrompt.includes('cosmic')) {
    enhancedParams.emissiveIntensity = Math.max(enhancedParams.emissiveIntensity || 0, 0.8);
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'starfield'];
    enhancedParams.envMapIntensity = 1.5;
  }

  if (lowerPrompt.includes('shiny') || lowerPrompt.includes('polished')) {
    enhancedParams.clearcoat = 1.0;
    enhancedParams.clearcoatRoughness = 0.1;
  }

  return enhancedParams;
};

// Main function to generate cube skin
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
    materialParams.emissiveIntensity = materialParams.emissiveIntensity ?? 0.2;

    if (materialParams.showBorder) {
      materialParams.borderColor = materialParams.borderColor || createComplementaryColor(materialParams.color);
      materialParams.borderWidth = materialParams.borderWidth || 5;
    }

    return { materialParams };
  } catch (error) {
    console.error('Error in generateCubeSkin:', error);
    return {
      materialParams: {
        color: "#4b0082",
        metalness: 0.5,
        roughness: 0.5,
        emissiveIntensity: 0.2,
        showBorder: true,
        borderColor: "#ffffff",
        borderWidth: 5,
      },
    };
  }
};

// Utility function to track user feedback
export const trackUserFeedback = async (prompt: string, materialParams: MaterialParams, userRating?: number): Promise<void> => {
  if (!AI_API_KEY) return;

  try {
    await axios.post(
      `${AI_API_URL}/feedback`,
      {
        prompt,
        materialParams,
        userRating,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Feedback submitted successfully');
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
};

// Analyze theme of a prompt
function analyzeTheme(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.match(/cosmic|galaxy|space|nebula|star/)) return 'cosmic';
  if (lowerPrompt.match(/hologram|holographic|iridescent|rainbow/)) return 'hologram';
  if (lowerPrompt.match(/ocean|sea|water/)) return 'ocean';
  if (lowerPrompt.match(/fire|flame|burning/)) return 'fire';
  if (lowerPrompt.match(/ice|frost|frozen/)) return 'ice';
  if (lowerPrompt.match(/neon|cyberpunk|synthwave/)) return 'cyberpunk';
  if (lowerPrompt.match(/nature|forest|plant/)) return 'nature';
  if (lowerPrompt.match(/magical|mystical|enchanted/)) return 'mystical';

  return 'neutral';
}

// Get color based on theme
function getThemeColor(theme: string): string {
  const themeColors: { [key: string]: string } = {
    cosmic: '#1e1b4b',
    hologram: '#a3e7fc',
    ocean: '#0077be',
    fire: '#ff4500',
    ice: '#e0f7fa',
    cyberpunk: '#00ffcc',
    nature: '#228b22',
    mystical: '#4b0082',
    neutral: '#4b0082',
  };

  return themeColors[theme] || '#4b0082';
}

// Create complementary color
function createComplementaryColor(color?: string): string {
  if (!color) return '#ffffff';
  const hexColor = color.replace('#', '');
  const numColor = parseInt(hexColor, 16);
  const complement = 0xFFFFFF ^ numColor;
  return `#${complement.toString(16).padStart(6, '0')}`;
}