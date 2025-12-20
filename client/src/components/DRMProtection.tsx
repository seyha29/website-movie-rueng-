import { useEffect, useRef, ReactNode } from "react";

interface DRMProtectionProps {
  children: ReactNode;
}

export default function DRMProtection({ children }: DRMProtectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'drm-protection-styles';
    style.textContent = `
      .drm-protected-container {
        position: relative;
        isolation: isolate;
      }
      
      .drm-protected-container video,
      .drm-protected-container iframe {
        -webkit-filter: brightness(1) !important;
        filter: brightness(1) !important;
      }
      
      .drm-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
        background: rgba(255, 255, 255, 0.003);
      }
      
      .drm-color-layer {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9998;
        background: linear-gradient(
          135deg,
          rgba(0, 0, 0, 0.001) 0%,
          rgba(255, 255, 255, 0.001) 50%,
          rgba(0, 0, 0, 0.001) 100%
        );
        mix-blend-mode: color-burn;
      }
      
      @media print {
        .drm-protected-container * {
          visibility: hidden !important;
          display: none !important;
        }
        .drm-protected-container::before {
          content: "Content Protected - Printing Disabled";
          visibility: visible !important;
          display: block !important;
          font-size: 24px;
          text-align: center;
          padding: 100px;
        }
      }
    `;
    
    if (!document.getElementById('drm-protection-styles')) {
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById('drm-protection-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (containerRef.current) {
          containerRef.current.style.filter = 'blur(20px)';
        }
      } else {
        if (containerRef.current) {
          containerRef.current.style.filter = 'none';
        }
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', detectDevTools);
    };
  }, []);

  return (
    <div ref={containerRef} className="drm-protected-container">
      {children}
      <div className="drm-overlay" />
      <div className="drm-color-layer" />
    </div>
  );
}
