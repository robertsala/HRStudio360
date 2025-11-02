import React from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  maxValue?: number;
  height?: number;
  showValues?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 200,
  showValues = true
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  const defaultColor = '#3b82f6';

  return (
    <div className="space-y-3" style={{ minHeight: `${height}px` }}>
      {data.map((item, index) => {
        const percentage = (item.value / max) * 100;
        const color = item.color || defaultColor;

        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              {showValues && (
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              )}
            </div>
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color
                }}
              >
                {percentage > 15 && showValues && (
                  <span className="text-xs font-semibold text-white">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
