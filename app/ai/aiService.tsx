import axios from 'axios';
import { createApi } from 'unsplash-js';

// Environment variables
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

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
        model: "creative_materials_v2",
        options: {
          temperature: 0.8,
          max_tokens: 1000,
          creative_mode: true
        }
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

// Advanced color analysis and extraction
const extractColor = (text: string): string | null => {
  // This is a more sophisticated version that can handle named colors, hex codes, and descriptions
  
  // Check for hex codes first
  const hexMatch = text.match(/#([0-9a-f]{3,8})\b/i);
  if (hexMatch) return hexMatch[0];
  
  // Check for rgb/rgba format
  const rgbMatch = text.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
  }
  
  // Handle natural language color descriptions
  const colorDescriptions: {[key: string]: string} = {
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
    'cherry red': '#dc143c',
    'cosmic purple': '#762cec',
    'ocean blue': '#0077be',
    'fiery orange': '#ff4500',
    'turquoise blue': '#40e0d0',
    'emerald green': '#50c878',
    'lavender purple': '#967bb6',
    'hot pink': '#ff69b4',
    'chocolate brown': '#7b3f00',
    'wine red': '#722f37',
    'acid green': '#a8ff00',
    'deep violet': '#9400d3',
    'slate gray': '#708090',
  };
  
  // Check descriptions
  for (const [desc, color] of Object.entries(colorDescriptions)) {
    if (text.toLowerCase().includes(desc)) {
      return color;
    }
  }
  
  // Handle basic color names with better values
  const basicColors: {[key: string]: string} = {
    'red': '#ff0000',
    'orange': '#ffa500',
    'yellow': '#ffff00',
    'green': '#00ff00',
    'blue': '#0000ff',
    'purple': '#800080',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#808080',
    'grey': '#808080',
    'silver': '#c0c0c0',
    'gold': '#ffd700',
    'bronze': '#cd7f32',
    'copper': '#b87333',
  };
  
  for (const [name, color] of Object.entries(basicColors)) {
    // Look for the color name as a whole word
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    if (regex.test(text)) {
      return color;
    }
  }
  
  // If we can't extract a specific color, return null
  return null;
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
  
  // Metallic qualities
  const metallicWords = [
    { term: 'chrome', value: 1.0 },
    { term: 'metal', value: 0.9 },
    { term: 'steel', value: 0.95 },
    { term: 'iron', value: 0.9 },
    { term: 'silver', value: 0.95 },
    { term: 'gold', value: 0.9 },
    { term: 'copper', value: 0.85 },
    { term: 'brass', value: 0.85 },
    { term: 'bronze', value: 0.85 },
    { term: 'aluminum', value: 0.9 },
    { term: 'titanium', value: 0.9 },
    { term: 'platinum', value: 0.95 },
    { term: 'metallic', value: 0.9 },
  ];
  
  for (const { term, value } of metallicWords) {
    if (lowerText.includes(term)) {
      qualities.metalness = value;
      break;
    }
  }
  
  // Non-metallic materials decreasing metalness
  const nonMetallicMaterials = [
    'plastic', 'rubber', 'wood', 'cloth', 'fabric', 'leather', 'paper', 
    'ceramic', 'porcelain', 'clay', 'stone', 'rock', 'marble', 'concrete',
    'glass', 'crystal', 'water', 'liquid'
  ];
  
  for (const material of nonMetallicMaterials) {
    if (lowerText.includes(material)) {
      qualities.metalness = Math.max(0, qualities.metalness - 0.5);
      break;
    }
  }
  
  // Roughness qualities
  if (lowerText.match(/\b(rough|coarse|textured|rugged|scratched|worn|weathered|bumpy|uneven)\b/)) {
    qualities.roughness = Math.min(1, qualities.roughness + 0.4);
  }
  
  if (lowerText.match(/\b(smooth|polished|shiny|glossy|sleek|slick|reflective|mirror)\b/)) {
    qualities.roughness = Math.max(0, qualities.roughness - 0.4);
  }
  
  // Emission qualities
  if (lowerText.match(/\b(glow|glowing|luminous|emissive|bright|neon|radiant|light|illuminated|luminescent)\b/)) {
    qualities.emissiveIntensity = 1.0;
  }
  
  // Transparency
  if (lowerText.match(/\b(transparent|translucent|clear|see-through|glass|crystal)\b/)) {
    qualities.transparent = 1;
  }
  
  // Iridescence
  if (lowerText.match(/\b(iridescent|pearlescent|opalescent|rainbow|color-shifting|prismatic|holographic)\b/)) {
    qualities.iridescence = 1;
  }
  
  // Clearcoat
  if (lowerText.match(/\b(varnished|lacquered|waxed|coated|glazed|wet|glossy)\b/)) {
    qualities.clearcoat = 1;
  }
  
  // Anisotropy (directional reflections)
  if (lowerText.match(/\b(brushed|combed|fibrous|striated|grooved|directional)\b/)) {
    qualities.anisotropy = 1;
  }
  
  // Sheen
  if (lowerText.match(/\b(velvet|suede|satin|silk|plush|fuzzy|velvety)\b/)) {
    qualities.sheen = 1;
  }
  
  return qualities;
};

// Advanced texture pattern identification
const identifyTexturePattern = (text: string): string | null => {
  const patterns = [
    'nebula', 'galaxy', 'starfield', 'cosmic', 'marble', 'wood grain', 'leather', 
    'carbon fiber', 'grid', 'honeycomb', 'circuit', 'digital', 'noise', 'static',
    'geometric', 'hexagonal', 'fractals', 'waves', 'clouds', 'smoke', 'fire', 'plasma',
    'water', 'ripples', 'fur', 'scales', 'snakeskin', 'crocodile', 'zebra', 'tiger',
    'leopard', 'cheetah', 'giraffe', 'camouflage', 'dots', 'polka dots', 'checkerboard',
    'stripes', 'lines', 'swirls', 'spirals', 'maze', 'labyrinth', 'brick', 'cobblestone',
    'woven', 'fabric', 'canvas', 'denim', 'rust', 'corrosion', 'distressed', 'weathered',
    'cracked', 'shattered', 'splatter', 'drip', 'vortex', 'whirlpool', 'aurora'
  ];
  
  const lowerText = text.toLowerCase();
  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return pattern;
    }
  }
  
  return null;
};

// Enhanced border detection
const detectBorder = (text: string): { showBorder: boolean, borderColor?: string, borderWidth?: number } => {
  const lowerText = text.toLowerCase();
  const result: { showBorder: boolean; borderColor?: string; borderWidth?: number } = { showBorder: false, borderColor: undefined, borderWidth: undefined };
  
  // Check for border indications
  if (lowerText.match(/\b(border|outline|edge|frame|trim|contour|perimeter)\b/)) {
    result.showBorder = true;
    
    // Look for color near border words
    const borderColorMatch = lowerText.match(/(\w+)\s+(border|outline|edge|frame|trim)/);
    if (borderColorMatch) {
      const possibleColor = extractColor(borderColorMatch[1]);
      if (possibleColor) {
        result.borderColor = possibleColor;
      }
    }
    
    // Look for width descriptors
    if (lowerText.match(/\b(thin|narrow|fine|small)\s+(border|outline|edge|frame|trim)\b/)) {
      result.borderWidth = 2;
    } else if (lowerText.match(/\b(thick|wide|heavy|large|big)\s+(border|outline|edge|frame|trim)\b/)) {
      result.borderWidth = 8;
    } else if (lowerText.match(/\b(medium)\s+(border|outline|edge|frame|trim)\b/)) {
      result.borderWidth = 5;
    } else if (result.showBorder) {
      // Default width if border is mentioned
      result.borderWidth = 5;
    }
  }
  
  // Check for explicit no-border requests
  if (lowerText.match(/\b(no border|without border|borderless|no outline|no edge|no frame|clean edge)\b/)) {
    result.showBorder = false;
  }
  
  return result;
};

// Detect gradient
const detectGradient = (text: string): string[] | null => {
  const lowerText = text.toLowerCase();
  
  // Various ways people might describe gradients
  const gradientPatterns = [
    /\b(gradient|fade|transition|blend)\s+(from|of|with)\s+(\w+)\s+(to|into|toward)\s+(\w+)\b/i,
    /\b(\w+)\s+to\s+(\w+)\s+(gradient|fade|transition|blend)\b/i,
    /\b(transition|blend|fade)\s+(between|of)\s+(\w+)\s+(and|to)\s+(\w+)\b/i
  ];
  
  for (const pattern of gradientPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      // Extract the two colors mentioned
      let color1, color2;
      
      if (pattern.source.includes('from|of|with')) {
        color1 = extractColor(match[3]);
        color2 = extractColor(match[5]);
      } else if (pattern.source.includes('\\w+\\s+to\\s+\\w+')) {
        color1 = extractColor(match[1]);
        color2 = extractColor(match[2]);
      } else {
        color1 = extractColor(match[3]);
        color2 = extractColor(match[5]);
      }
      
      if (color1 && color2) {
        return [color1, color2];
      }
    }
  }
  
  return null;
};

// Advanced fallback material generation
const generateFallbackMaterialParams = (prompt: string): MaterialParams => {
  const lowerPrompt = prompt.toLowerCase();
  const params: MaterialParams = {};
  
  // Extract material qualities
  const materialQualities = identifyMaterialQualities(prompt);
  params.metalness = materialQualities.metalness;
  params.roughness = materialQualities.roughness;
  params.emissiveIntensity = materialQualities.emissiveIntensity;
  
  if (materialQualities.transparent) {
    params.transparent = true;
    params.opacity = 0.7; // Default transparency level
  }
  
  if (materialQualities.iridescence) {
    params.iridescence = 1.0;
    params.iridescenceIor = 1.8;
  }
  
  if (materialQualities.clearcoat) {
    params.clearcoat = 0.8;
    params.clearcoatRoughness = 0.2;
  }
  
  if (materialQualities.anisotropy) {
    params.anisotropy = 1.0;
  }
  
  if (materialQualities.sheen) {
    params.sheen = 1.0;
    params.sheenColor = "#ffffff";
  }
  
  // Try to extract gradient colors
  const gradientColors = detectGradient(prompt);
  if (gradientColors) {
    params.gradientColors = gradientColors;
  } else {
    // Otherwise try to extract a primary color
    const color = extractColor(prompt);
    if (color) {
      params.color = color;
      
      // Set emissive to match color if glowing was detected
      if (params.emissiveIntensity > 0) {
        params.emissive = color;
        params.animateEmissive = lowerPrompt.includes('pulse') || 
                                lowerPrompt.includes('pulsating') || 
                                lowerPrompt.includes('flicker') ||
                                lowerPrompt.includes('animated');
      }
    } else {
      // Default color if none specified
      params.color = "#4b0082"; // Default indigo color
    }
  }
  
  // Check for texture patterns
  const texturePattern = identifyTexturePattern(prompt);
  if (texturePattern) {
    params.texturePattern = texturePattern;
    
    // Map common patterns to specific texture maps
    const textureMapPaths: Record<string, string> = {
      'nebula': '/textures/nebula.png',
      'galaxy': '/textures/galaxy.png',
      'starfield': '/textures/stars.png',
      'marble': '/textures/marble.png',
      'wood grain': '/textures/wood.png',
      'carbon fiber': '/textures/carbon-fiber.png',
      'circuit': '/textures/circuit.png',
      'grid': '/textures/grid.png',
      'honeycomb': '/textures/honeycomb.png',
    };
    
    if (texturePattern in textureMapPaths) {
      params.map = textureMapPaths[texturePattern];
    }
  }
  
  // Detect border properties
  const borderProps = detectBorder(prompt);
  params.showBorder = borderProps.showBorder;
  if (borderProps.showBorder) {
    params.borderColor = borderProps.borderColor || "#ffffff"; // Default to white if no color specified
    params.borderWidth = borderProps.borderWidth || 5; // Default medium width
  }
  
  // Special effects
  params.customEffects = [];
  
  if (lowerPrompt.includes('pulse') || lowerPrompt.includes('pulsating')) {
    params.customEffects.push('pulse');
    params.animateEmissive = true;
  }
  
  if (lowerPrompt.includes('spin') || lowerPrompt.includes('rotating') || lowerPrompt.includes('rotation')) {
    params.customEffects.push('spin');
  }
  
  if (lowerPrompt.includes('float') || lowerPrompt.includes('levitate') || lowerPrompt.includes('hover')) {
    params.customEffects.push('float');
  }
  
  if (lowerPrompt.includes('wireframe')) {
    params.wireframe = true;
  }
  
  if (lowerPrompt.includes('rainbow cycling') || lowerPrompt.includes('color cycle') || lowerPrompt.includes('changing colors')) {
    params.hslShift = true;
  }
  
  // Handle noise/turbulence effects
  if (lowerPrompt.includes('noise') || lowerPrompt.includes('static') || lowerPrompt.includes('distortion')) {
    params.noiseScale = 1.0;
  }
  
  // Handle glass/transparent material characteristics
  if (lowerPrompt.includes('glass') || lowerPrompt.includes('crystal') || lowerPrompt.includes('transparent')) {
    params.transmission = 0.95;
    params.transparent = true;
    params.opacity = 0.5;
    params.clearcoat = 1.0;
    params.clearcoatRoughness = 0.1;
  }
  
  return params;
};

// Enhance material parameters with creative effects based on context
const enhanceMaterialParams = (params: MaterialParams, prompt: string): MaterialParams => {
  const enhancedParams = { ...params };
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for thematic enhancements
  if (lowerPrompt.includes('cosmic') || lowerPrompt.includes('space') || lowerPrompt.includes('galaxy')) {
    enhancedParams.emissiveIntensity = Math.max(enhancedParams.emissiveIntensity || 0, 0.8);
    enhancedParams.animateEmissive = true;
    enhancedParams.envMapIntensity = 0.8;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'stardust'];
  }
  
  if (lowerPrompt.includes('ocean') || lowerPrompt.includes('sea') || lowerPrompt.includes('water')) {
    enhancedParams.envMapIntensity = 1.2;
    enhancedParams.clearcoat = Math.max(enhancedParams.clearcoat || 0, 0.6);
    enhancedParams.transmission = 0.6;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'waves'];
  }
  
  if (lowerPrompt.includes('fire') || lowerPrompt.includes('flame') || lowerPrompt.includes('burning')) {
    enhancedParams.emissiveIntensity = 1.5;
    enhancedParams.animateEmissive = true;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'flames'];
  }
  
  if (lowerPrompt.includes('ice') || lowerPrompt.includes('frost') || lowerPrompt.includes('frozen')) {
    enhancedParams.envMapIntensity = 1.2;
    enhancedParams.roughness = Math.min(enhancedParams.roughness || 1, 0.2);
    enhancedParams.transmission = 0.4;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'frost'];
  }
  
  if (lowerPrompt.includes('neon') || lowerPrompt.includes('cyberpunk') || lowerPrompt.includes('synthwave')) {
    enhancedParams.emissiveIntensity = 1.5;
    enhancedParams.animateEmissive = true;
    enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'neonPulse'];
  }
  
  // Check for material complexity enhancements
  if (lowerPrompt.includes('complex') || lowerPrompt.includes('detailed') || lowerPrompt.includes('intricate')) {
    enhancedParams.bumpScale = 0.2;
    enhancedParams.normalScale = 0.8;
    enhancedParams.displacementScale = 0.1;
  }
  
  // Special handling for animated effects
  if (lowerPrompt.includes('animated') || lowerPrompt.includes('moving') || lowerPrompt.includes('dynamic')) {
    enhancedParams.animationSpeed = 1.0;
    if (!enhancedParams.customEffects?.includes('pulse')) {
      enhancedParams.customEffects = [...(enhancedParams.customEffects || []), 'pulse'];
    }
  }
  
  return enhancedParams;
};

// The main function to generate cube skin
export const generateCubeSkin = async ({ prompt }: GenerateCubeSkinParams): Promise<{ materialParams: MaterialParams }> => {
  try {
    // First try to get parameters from the advanced AI
    let materialParams = await generateAIMaterialParams(prompt);
    
    // Enhance the parameters with creative effects
    materialParams = enhanceMaterialParams(materialParams, prompt);
    
    // Final validation and defaults
    if (!materialParams.color && !materialParams.gradientColors) {
      // Generate a creative color based on the prompt's mood/theme
      const mood = analyzeMood(prompt);
      materialParams.color = getMoodColor(mood);
    }
    
    // Ensure essential properties have defaults
    materialParams.metalness = materialParams.metalness ?? 0.5;
    materialParams.roughness = materialParams.roughness ?? 0.5;
    materialParams.emissiveIntensity = materialParams.emissiveIntensity ?? 0.2;
    
    // Handle border visibility
    if (materialParams.showBorder) {
      materialParams.borderColor = materialParams.borderColor || createComplementaryColor(materialParams.color);
      materialParams.borderWidth = materialParams.borderWidth || 5;
    }
    
    return { materialParams };
  } catch (error) {
    console.error('Error in generateCubeSkin:', error);
    // Ultimate fallback for complete failure
    return {
      materialParams: {
        color: "#4b0082",
        metalness: 0.5,
        roughness: 0.5,
        emissiveIntensity: 0.2,
        showBorder: true,
        borderColor: "#ffffff",
        borderWidth: 5
      }
    };
  }
};

// Utility function to track user feedback for model improvement
export const trackUserFeedback = async (prompt: string, materialParams: MaterialParams, userRating?: number): Promise<void> => {
  if (!AI_API_KEY) return;

  try {
    await axios.post(
      `${AI_API_URL}/feedback`,
      {
        prompt,
        materialParams,
        userRating,
        timestamp: new Date().toISOString()
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

// Helper function to analyze mood/theme of a prompt
function analyzeMood(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.match(/happy|joy|cheerful|bright|vibrant|lively/)) return 'happy';
  if (lowerPrompt.match(/sad|melancholy|gloomy|dark|somber|depressed/)) return 'sad';
  if (lowerPrompt.match(/angry|rage|furious|intense|fierce|aggressive/)) return 'angry';
  if (lowerPrompt.match(/calm|peaceful|tranquil|serene|gentle|relaxed/)) return 'calm';
  if (lowerPrompt.match(/mysterious|enigmatic|cryptic|secret|hidden/)) return 'mysterious';
  if (lowerPrompt.match(/fantasy|magical|enchanted|mystical|fairy/)) return 'fantasy';
  if (lowerPrompt.match(/tech|digital|future|cyber|electronic|robot/)) return 'tech';
  if (lowerPrompt.match(/nature|natural|organic|forest|garden|plant/)) return 'nature';
  if (lowerPrompt.match(/elegant|luxurious|premium|royal|sophisticated/)) return 'elegant';
  if (lowerPrompt.match(/retro|vintage|old|classic|nostalgic/)) return 'retro';
  
  return 'neutral';
}

// Helper function to get a color based on mood
function getMoodColor(mood: string): string {
  const moodColors: Record<string, string> = {
    happy: '#FFD700', // Gold
    sad: '#4682B4',   // Steel Blue
    angry: '#DC143C', // Crimson
    calm: '#5F9EA0',  // Cadet Blue
    mysterious: '#663399', // Rebecca Purple
    fantasy: '#9370DB', // Medium Purple
    tech: '#00CED1',  // Dark Turquoise
    nature: '#228B22', // Forest Green
    elegant: '#800080', // Purple
    retro: '#CD5C5C',  // Indian Red
    neutral: '#4B0082', // Indigo
  };
  
  return moodColors[mood] || '#4B0082';
}

// Helper function to create a complementary color
function createComplementaryColor(color?: string): string {
  if (!color) return '#ffffff';
  
  // Remove '#' and convert to number
  const hexColor = color.replace('#', '');
  const numColor = parseInt(hexColor, 16);
  
  // Create complement (invert the color)
  const complement = 0xFFFFFF ^ numColor;
  
  // Convert back to hex string with padding
  return `#${complement.toString(16).padStart(6, '0')}`;
}