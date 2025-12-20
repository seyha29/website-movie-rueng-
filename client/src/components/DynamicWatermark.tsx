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
  const [position, setPosition] = useState({ x: 20, y: 30 });

  if (!user) return null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const moveTimer = setInterval(() => {
      setPosition({
        x: 10 + Math.random() * 30,
        y: 20 + Math.random() * 40,
      });
    }, 8000);

    return () => clearInterval(moveTimer);
  }, []);

  const opacityMap = {
    light: 0.2,
    medium: 0.35,
    strong: 0.5,
  };

  const opacity = opacityMap[intensity];
  const formattedTime = currentTime.toLocaleString();
  const watermarkText = showTimestamp 
    ? `${user.fullName} • ${user.phoneNumber} • ${formattedTime}`
    : `${user.fullName} • ${user.phoneNumber}`;

  return (
    <>
      <style>
        {`
          @keyframes scrollLeft {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes scrollRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulse {
            0%, 100% { opacity: ${opacity}; }
            50% { opacity: ${opacity * 0.6}; }
          }
        `}
      </style>
      
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none select-none z-[9998] overflow-hidden"
        style={{ height: "28px" }}
      >
        <div
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scrollLeft 20s linear infinite",
            color: `rgba(249, 115, 22, ${opacity})`,
            fontSize: "13px",
            fontWeight: 700,
            textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
            letterSpacing: "0.05em",
            paddingTop: "6px",
          }}
        >
          {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none select-none z-[9998] overflow-hidden"
        style={{ height: "28px" }}
      >
        <div
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scrollRight 25s linear infinite",
            color: `rgba(249, 115, 22, ${opacity})`,
            fontSize: "13px",
            fontWeight: 700,
            textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
            letterSpacing: "0.05em",
            paddingBottom: "6px",
          }}
        >
          {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
        </div>
      </div>

      <div
        className="absolute pointer-events-none select-none z-[9998]"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transition: "all 2s ease-in-out",
          animation: "pulse 4s ease-in-out infinite",
        }}
      >
        <div
          style={{
            color: `rgba(249, 115, 22, ${opacity * 0.8})`,
            fontSize: "16px",
            fontWeight: 800,
            textShadow: "2px 2px 4px rgba(0,0,0,0.9)",
            letterSpacing: "0.1em",
            transform: "rotate(-15deg)",
            whiteSpace: "nowrap",
          }}
        >
          {user.phoneNumber}
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none select-none z-[9997]"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 200px,
            rgba(249, 115, 22, 0.03) 200px,
            rgba(249, 115, 22, 0.03) 400px
          )`,
        }}
      />
    </>
  );
}
