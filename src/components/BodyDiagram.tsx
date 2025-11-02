import React, { useState } from 'react';

interface BodyPart {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
  description?: string;
}

interface BodyDiagramProps {
  selectedParts: Array<{ name: string; description: string }>;
  onPartsChange: (parts: Array<{ name: string; description: string }>) => void;
}

export default function BodyDiagram({ selectedParts, onPartsChange }: BodyDiagramProps) {
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const bodyParts: BodyPart[] = [
    { id: 'head', name: 'Head/Skull', x: 155, y: 30, width: 40, height: 45, selected: false },
    { id: 'eye-left', name: 'Eye - Left', x: 160, y: 45, width: 12, height: 8, selected: false },
    { id: 'eye-right', name: 'Eye - Right', x: 178, y: 45, width: 12, height: 8, selected: false },
    { id: 'neck', name: 'Neck', x: 165, y: 75, width: 20, height: 20, selected: false },
    { id: 'shoulder-left', name: 'Shoulder - Left', x: 125, y: 95, width: 35, height: 25, selected: false },
    { id: 'shoulder-right', name: 'Shoulder - Right', x: 190, y: 95, width: 35, height: 25, selected: false },
    { id: 'chest', name: 'Chest', x: 155, y: 105, width: 40, height: 45, selected: false },
    { id: 'upper-arm-left', name: 'Upper Arm - Left', x: 110, y: 120, width: 20, height: 55, selected: false },
    { id: 'upper-arm-right', name: 'Upper Arm - Right', x: 220, y: 120, width: 20, height: 55, selected: false },
    { id: 'elbow-left', name: 'Elbow - Left', x: 107, y: 175, width: 23, height: 18, selected: false },
    { id: 'elbow-right', name: 'Elbow - Right', x: 220, y: 175, width: 23, height: 18, selected: false },
    { id: 'abdomen', name: 'Abdomen', x: 155, y: 150, width: 40, height: 38, selected: false },
    { id: 'forearm-left', name: 'Forearm - Left', x: 95, y: 193, width: 18, height: 55, selected: false },
    { id: 'forearm-right', name: 'Forearm - Right', x: 237, y: 193, width: 18, height: 55, selected: false },
    { id: 'lower-back', name: 'Lower Back', x: 155, y: 188, width: 40, height: 32, selected: false },
    { id: 'wrist-left', name: 'Wrist - Left', x: 92, y: 248, width: 18, height: 14, selected: false },
    { id: 'wrist-right', name: 'Wrist - Right', x: 240, y: 248, width: 18, height: 14, selected: false },
    { id: 'hand-left', name: 'Hand - Left', x: 85, y: 262, width: 22, height: 30, selected: false },
    { id: 'hand-right', name: 'Hand - Right', x: 243, y: 262, width: 22, height: 30, selected: false },
    { id: 'hip-left', name: 'Hip - Left', x: 150, y: 220, width: 22, height: 28, selected: false },
    { id: 'hip-right', name: 'Hip - Right', x: 178, y: 220, width: 22, height: 28, selected: false },
    { id: 'upper-leg-left', name: 'Upper Leg - Left', x: 147, y: 248, width: 25, height: 75, selected: false },
    { id: 'upper-leg-right', name: 'Upper Leg - Right', x: 178, y: 248, width: 25, height: 75, selected: false },
    { id: 'knee-left', name: 'Knee - Left', x: 145, y: 323, width: 27, height: 22, selected: false },
    { id: 'knee-right', name: 'Knee - Right', x: 178, y: 323, width: 27, height: 22, selected: false },
    { id: 'lower-leg-left', name: 'Lower Leg - Left', x: 147, y: 345, width: 23, height: 75, selected: false },
    { id: 'lower-leg-right', name: 'Lower Leg - Right', x: 180, y: 345, width: 23, height: 75, selected: false },
    { id: 'ankle-left', name: 'Ankle - Left', x: 145, y: 420, width: 25, height: 12, selected: false },
    { id: 'ankle-right', name: 'Ankle - Right', x: 180, y: 420, width: 25, height: 12, selected: false },
    { id: 'foot-left', name: 'Foot - Left', x: 142, y: 432, width: 28, height: 22, selected: false },
    { id: 'foot-right', name: 'Foot - Right', x: 180, y: 432, width: 28, height: 22, selected: false },
  ];

  const handleBodyPartClick = (part: BodyPart) => {
    setActiveBodyPart(part.name);
    const existing = selectedParts.find(p => p.name === part.name);
    if (existing) {
      setDescriptionInput(existing.description);
    } else {
      setDescriptionInput('');
    }
  };

  const handleSaveDescription = () => {
    if (!activeBodyPart || !descriptionInput.trim()) return;

    const updatedParts = selectedParts.filter(p => p.name !== activeBodyPart);
    updatedParts.push({
      name: activeBodyPart,
      description: descriptionInput.trim()
    });

    onPartsChange(updatedParts);
    setActiveBodyPart(null);
    setDescriptionInput('');
  };

  const handleRemoveBodyPart = (partName: string) => {
    onPartsChange(selectedParts.filter(p => p.name !== partName));
  };

  const isPartSelected = (partName: string) => {
    return selectedParts.some(p => p.name === partName);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4" style={{ width: '370px', height: '500px' }}>
            <svg width="370" height="500" className="absolute inset-0">
              {bodyParts.map((part) => (
                <g key={part.id}>
                  <rect
                    x={part.x}
                    y={part.y}
                    width={part.width}
                    height={part.height}
                    rx="4"
                    fill={isPartSelected(part.name) ? '#ef4444' : activeBodyPart === part.name ? '#fbbf24' : 'transparent'}
                    stroke={isPartSelected(part.name) ? '#dc2626' : hoveredPart === part.name ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={hoveredPart === part.name ? '2.5' : '1.5'}
                    className="cursor-pointer transition-all"
                    onClick={() => handleBodyPartClick(part)}
                    onMouseEnter={() => setHoveredPart(part.name)}
                    onMouseLeave={() => setHoveredPart(null)}
                    opacity={isPartSelected(part.name) ? 0.8 : hoveredPart === part.name ? 0.5 : 0.2}
                  />
                  {hoveredPart === part.name && (
                    <g>
                      <rect
                        x={part.x + part.width / 2 - 60}
                        y={part.y - 32}
                        width="120"
                        height="28"
                        fill="#1f2937"
                        rx="6"
                        opacity="0.95"
                      />
                      <text
                        x={part.x + part.width / 2}
                        y={part.y - 13}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="500"
                      >
                        {part.name}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-2 text-sm text-gray-600 text-center">
            Hover to preview, click to select body parts
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {activeBodyPart && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{activeBodyPart}</h4>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Describe the injury in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDescription}
                  disabled={!descriptionInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Injury
                </button>
                <button
                  onClick={() => {
                    setActiveBodyPart(null);
                    setDescriptionInput('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectedParts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Reported Injuries ({selectedParts.length})</h4>
              <div className="space-y-2">
                {selectedParts.map((part, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-red-900">{part.name}</span>
                      <button
                        onClick={() => handleRemoveBodyPart(part.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{part.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedParts.length === 0 && !activeBodyPart && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No injuries marked yet. Click on the body diagram to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
