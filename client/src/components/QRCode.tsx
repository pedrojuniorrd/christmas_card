import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 200, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCodeLib.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#1a1a1a",
          light: "#ffffff",
        },
      }).catch(console.error);
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
