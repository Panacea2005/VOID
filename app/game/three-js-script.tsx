// three-js-script.tsx
"use client";

import { useEffect } from 'react';
import Script from 'next/script';

// Add global declaration for THREE on the window object
declare global {
  interface Window {
    THREE: any;
  }
}

interface ThreeJSScriptProps {
  onLoad: () => void;
}

const ThreeJSScript: React.FC<ThreeJSScriptProps> = ({ onLoad }) => {
  useEffect(() => {
    // Check if Three.js is already loaded
    if (typeof window !== 'undefined' && window.THREE) {
      onLoad();
    }
  }, [onLoad]);

  return (
    <>
      {/* Load Three.js core */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js"
        onLoad={() => {
          console.log("Three.js loaded");
        }}
      />
      
      {/* Load PointerLockControls */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/three@0.157.0/examples/js/controls/PointerLockControls.js"
        onLoad={() => {
          console.log("PointerLockControls loaded");
          onLoad(); // Signal that all necessary scripts are loaded
        }}
      />
    </>
  );
};

export default ThreeJSScript;