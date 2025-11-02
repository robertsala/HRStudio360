import React from 'react';

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  color = '#3b82f6',
  height = 150
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const padding = 20;
  const width = 400;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((point.value - minValue) / range) * (height - 2 * padding);
    return { x, y, value: point.value };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPathD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => {
          const y = padding + fraction * (height - 2 * padding);
          return (
            <line
              key={index}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4"
            />
          );
        })}

        {/* Area fill */}
        <path
          d={areaPathD}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="3"
            />
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between px-2">
        {data.map((item, index) => (
          <span key={index} className="text-xs text-gray-500">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
