import { useEffect, useState } from "react";

interface DynamicWatermarkProps {
  intensity?: "light" | "medium" | "strong";
  showTimestamp?: boolean;
  user: any;
}

export default function DynamicWatermark({ 
  intensity = "medium", 
  showTimestamp = true,
  user
}: DynamicWatermarkProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [position, setPosition] = useState({ top: 50, left: 50 });

  // User is required - should not render without it
  if (!user) return null;

  // Update timestamp every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Randomize position slightly every 30 seconds to prevent easy cropping
  useEffect(() => {
    const positionTimer = setInterval(() => {
      setPosition({
        top: 45 + Math.random() * 10,
        left: 45 + Math.random() * 10,
      });
    }, 30000);

    return () => clearInterval(positionTimer);
  }, []);

  const opacityMap = {
    light: 0.1,
    medium: 0.2,
    strong: 0.35,
  };

  const opacity = opacityMap[intensity];
  const formattedTime = currentTime.toLocaleString();
  const watermarkText = showTimestamp 
    ? `${user.fullName} • ${user.phoneNumber} • ${formattedTime}`
    : `${user.fullName} • ${user.phoneNumber}`;

  return (
    <>
      {/* Main centered watermark - positioned absolutely within video player */}
      <div
        className="absolute pointer-events-none select-none z-[9998]"
        style={{
          top: `${position.top}%`,
          left: `${position.left}%`,
          transform: "translate(-50%, -50%) rotate(-45deg)",
          color: `rgba(249, 115, 22, ${opacity})`,
          fontSize: "clamp(20px, 3vw, 40px)",
          fontWeight: 700,
          textShadow: "0 0 10px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
          letterSpacing: "0.1em",
        }}
        data-testid="watermark-main"
      >
        {watermarkText}
      </div>

      {/* Corner watermarks for redundancy - positioned absolutely within video player */}
      <div
        className="absolute top-4 right-4 pointer-events-none select-none z-[9998] text-xs opacity-20"
        style={{
          color: "rgba(249, 115, 22, 1)",
          textShadow: "0 0 5px rgba(0,0,0,0.8)",
        }}
        data-testid="watermark-corner-top"
      >
        {user.phoneNumber}
      </div>

      <div
        className="absolute bottom-4 left-4 pointer-events-none select-none z-[9998] text-xs opacity-20"
        style={{
          color: "rgba(249, 115, 22, 1)",
          textShadow: "0 0 5px rgba(0,0,0,0.8)",
        }}
        data-testid="watermark-corner-bottom"
      >
        {formattedTime}
      </div>

      {/* Diagonal repeated pattern (subtle) - positioned absolutely within video player */}
      <div
        className="absolute inset-0 pointer-events-none select-none z-[9997] overflow-hidden"
        style={{
          opacity: opacity * 0.3,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute whitespace-nowrap"
            style={{
              top: `${(i * 15) % 100}%`,
              left: `${(i * 25) % 100}%`,
              transform: "rotate(-45deg)",
              color: "rgba(249, 115, 22, 1)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {user.phoneNumber}
          </div>
        ))}
      </div>
    </>
  );
}
