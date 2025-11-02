import React from 'react';

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  centerText?: string;
  centerSubtext?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, centerText, centerSubtext }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(50, 50, 40, endAngle);
    const end = polarToCartesian(50, 50, 40, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: '200px', height: '200px' }}>
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />

          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const path = createArc(currentAngle, currentAngle + angle);
            const arcPath = `${path} L 50 50`;

            currentAngle += angle;

            return (
              <path
                key={index}
                d={arcPath}
                fill="none"
                stroke={item.color}
                strokeWidth="10"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center text */}
        {centerText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-gray-900">{centerText}</div>
            {centerSubtext && <div className="text-sm text-gray-500">{centerSubtext}</div>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {item.value} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonutChart;
