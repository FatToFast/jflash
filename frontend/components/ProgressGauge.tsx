"use client";

/**
 * ProgressGauge - Circular progress indicator
 * JLPT+ style progress display
 */

interface ProgressGaugeProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressGauge({
  current,
  total,
  size = 48,
  strokeWidth = 3,
}: ProgressGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = total > 0 ? current / total : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-neutral-900 transition-all duration-300"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-neutral-600">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}

export default ProgressGauge;
