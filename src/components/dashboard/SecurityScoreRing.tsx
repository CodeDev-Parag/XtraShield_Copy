"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SecurityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function SecurityScoreRing({
  score = 85,
  size = 200,
  strokeWidth = 14,
  className,
}: SecurityScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the text score number on mount
  useEffect(() => {
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    if (end === 0) return;
    
    const duration = 1500;
    const stepTime = 15;
    const totalSteps = Math.ceil(duration / stepTime);
    const increment = end / totalSteps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // Determine colors and label based on score
  const getStatusColor = (val: number) => {
    if (val < 40) return {
      color: "#DC2626",
      textClass: "text-[#DC2626]",
      label: "CRITICAL",
      trackColor: "#FEE2E2"
    };
    if (val < 70) return {
      color: "#EAB308",
      textClass: "text-[#EAB308]",
      label: "WARNING",
      trackColor: "#FEF3C7"
    };
    return {
      color: "#16A34A",
      textClass: "text-[#16A34A]",
      label: "SECURE",
      trackColor: "#DCFCE7"
    };
  };

  const status = getStatusColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      data-testid="security-score-ring"
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={status.trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={status.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>

      {/* Score Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-mono tracking-widest text-[#4B5563] uppercase">
          Score
        </span>
        <span className="text-5xl font-bold font-heading text-[#0A0A0A] tracking-tighter leading-none my-1">
          {animatedScore}
        </span>
        <span className={cn("text-xs font-mono font-bold tracking-widest", status.textClass)}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
