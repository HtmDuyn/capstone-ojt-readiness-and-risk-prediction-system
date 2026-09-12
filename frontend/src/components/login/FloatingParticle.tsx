import React from "react";
import type { FloatingParticleProps } from "../../types/loginTypes";

const FloatingParticle: React.FC<FloatingParticleProps> = ({ delay, duration, x, size, opacity }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: "-20px",
      width: size,
      height: size,
      opacity,
      background: "radial-gradient(circle, #f97316, #fed7aa)",
      animation: `floatUp ${duration}s ${delay}s ease-in infinite`,
    }}
  />
);

export default FloatingParticle;
