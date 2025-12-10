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

  if (!user) return null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const opacityMap = {
    light: 0.15,
    medium: 0.25,
    strong: 0.4,
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
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
      
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none select-none z-[9998] overflow-hidden"
        style={{
          height: "24px",
        }}
        data-testid="watermark-main"
      >
        <div
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            animation: "scrollLeft 15s linear infinite",
            color: `rgba(249, 115, 22, ${opacity})`,
            fontSize: "12px",
            fontWeight: 600,
            textShadow: "0 0 5px rgba(0,0,0,0.5)",
            letterSpacing: "0.05em",
            paddingTop: "4px",
          }}
        >
          {watermarkText}
        </div>
      </div>
    </>
  );
}
