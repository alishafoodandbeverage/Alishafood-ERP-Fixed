import { useState, useRef, useEffect } from "react";
import { SalesDataPoint } from "../types";

interface SalesChartProps {
  data: SalesDataPoint[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const height = 300;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 45;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value, default to 60,000 to match user's screenshot scale
  const maxValue = Math.max(60000, ...data.map((d) => d.amount));
  const yTicks = [0, 15000, 30000, 45000, 60000];

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (amount: number) => {
    return paddingTop + chartHeight - (amount / maxValue) * chartHeight;
  };

  const formatYValue = (val: number) => {
    if (val === 0) return "0";
    return `${(val / 1000).toFixed(0)}k`;
  };

  return (
    <div id="sales-trends-card" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Sales Trends</h3>
            <p className="text-[10px] text-slate-400">Daily business transaction volume</p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
          <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>
          <span>Daily Sales (৳)</span>
        </div>
      </div>

      <div ref={containerRef} className="w-full relative overflow-x-auto min-h-[300px]">
        <svg width={Math.max(600, width)} height={height} className="mx-auto">
          {/* Horizontal Grid lines & Y Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick} className="opacity-75">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth={1.5}
                  strokeDasharray={tick === 0 ? "none" : "4 4"}
                />
                <text
                  x={paddingLeft - 14}
                  y={y + 3.5}
                  fill="#94A3B8"
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="end"
                  className="font-mono"
                >
                  {formatYValue(tick)}
                </text>
              </g>
            );
          })}

          {/* Bars and Zero Indicators */}
          {data.map((point, index) => {
            const x = getX(index);
            const y = getY(point.amount);
            const baselineY = getY(0);
            const isZero = point.amount === 0;

            return (
              <g key={index} className="group">
                {/* Visual Bar */}
                {!isZero && (
                  <>
                    {/* Shadow/Glow effect on hover */}
                    <rect
                      x={x - 7}
                      y={y}
                      width={14}
                      height={baselineY - y}
                      fill="#10B981"
                      opacity={0.08}
                      className="transition-all duration-300 group-hover:opacity-20"
                      rx={3}
                    />
                    {/* Main Bar */}
                    <rect
                      x={x - 4}
                      y={y}
                      width={8}
                      height={baselineY - y}
                      fill="#059669"
                      rx={2}
                      className="transition-all duration-300 group-hover:fill-emerald-500"
                    />

                    {/* Tooltip Pill at the top */}
                    <g transform={`translate(${x}, ${y - 14})`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <rect
                        x={-30}
                        y={-14}
                        width={60}
                        height={18}
                        rx={5}
                        fill="#0F172A"
                      />
                      <text
                        x={0}
                        y={-2}
                        fill="#FFFFFF"
                        fontSize={9}
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {point.amount.toLocaleString()}
                      </text>
                      {/* Triangle Pointer */}
                      <polygon
                        points="-4,-14 4,-14 0,-18"
                        fill="#0F172A"
                        transform="rotate(180, 0, -5)"
                      />
                    </g>
                  </>
                )}

                {/* Zero Value Indicators */}
                {isZero && (
                  <g transform={`translate(${x - 8}, ${baselineY - 14})`}>
                    <rect
                      width={16}
                      height={12}
                      rx={3}
                      fill="#F8FAFC"
                      stroke="#E2E8F0"
                      strokeWidth={1}
                    />
                    <text
                      x={8}
                      y={9}
                      fill="#94A3B8"
                      fontSize={8}
                      fontWeight="bold"
                      className="font-mono"
                      textAnchor="middle"
                    >
                      0
                    </text>
                  </g>
                )}

                {/* X Axis Tick Labels */}
                {(index % 2 === 0 || index === data.length - 1) && (
                  <text
                    x={x}
                    y={baselineY + 20}
                    fill="#64748B"
                    fontSize={10}
                    fontWeight="600"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {point.date}
                  </text>
                )}

                {/* Hover trigger zone */}
                <rect
                  x={x - 12}
                  y={paddingTop}
                  width={24}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                >
                  <title>{`${point.date}: ৳${point.amount.toLocaleString()}`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
