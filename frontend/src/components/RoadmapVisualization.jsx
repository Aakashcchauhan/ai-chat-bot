import React from 'react';









export const RoadmapVisualization = ({
  data,
  onModuleSelect,
  onTopicSelect,
  selectedModuleId = null,
  selectedTopic = null,
  darkMode = false,
}) => {
  const wrapText = (text, maxCharsPerLine) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const getDifficultyGradient = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return { from: '#34d399', to: '#059669' };
      case 'Intermediate':
        return { from: '#38bdf8', to: '#0284c7' };
      case 'Advanced':
        return { from: '#818cf8', to: '#4338ca' };
      default:
        return { from: '#9ca3af', to: '#4b5563' };
    }
  };

  // Calculate module positions
  const modulePositions = {};
  const levels = {};

  // Determine levels
  data.modules.forEach((module) => {
    if (!module.prerequisites || module.prerequisites.length === 0) {
      levels[module.id] = 0;
    }
  });

  let changed = true;
  while (changed) {
    changed = false;
    data.modules.forEach((module) => {
      if (levels[module.id] !== undefined) return;

      if (!module.prerequisites || module.prerequisites.length === 0) {
        levels[module.id] = 0;
        changed = true;
        return;
      }

      const prereqLevels = module.prerequisites
        .map((id) => levels[id])
        .filter((level) => level !== undefined);

      if (prereqLevels.length === module.prerequisites.length) {
        levels[module.id] = Math.max(...prereqLevels) + 1;
        changed = true;
      }
    });
  }

  // Position modules
  data.modules.forEach((module) => {
    const level = levels[module.id] || 0;
    const levelModules = data.modules.filter((m) => (levels[m.id] || 0) === level);
    const indexInLevel = levelModules.findIndex((m) => m.id === module.id);

    modulePositions[module.id] = {
      x: 10 + level * 220,
      y: 100 + indexInLevel * 140,
    };
  });

  // Create connections
  const connections = [];

  data.modules.forEach((module) => {
    if (module.prerequisites) {
      module.prerequisites.forEach((prereqId) => {
        const start = modulePositions[prereqId];
        const end = modulePositions[module.id];

        if (start && end) {
          connections.push({
            id: `${prereqId}-${module.id}`,
            x1: start.x + 85,
            y1: start.y + 50,
            x2: end.x,
            y2: end.y + 25,
          });
        }
      });
    }
  });

  return (
    <div className="relative w-full overflow-x-auto pb-10">

      <svg
        className="min-w-max"
        style={{
          height: `${Math.max(...Object.values(modulePositions).map((p) => p.y), 0) + 150}px`,
          width: `${Math.max(...Object.values(modulePositions).map((p) => p.x), 0) + 250}px`,
        }}
      >
        {/* Draw connections */}
        {connections.map((conn) => (
          <g key={conn.id}>
            <defs>
              <linearGradient id={`gradient-${conn.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
            <path
              d={`M${conn.x1},${conn.y1} C${conn.x1 + 60},${conn.y1} ${conn.x2 - 60},${conn.y2} ${conn.x2},${conn.y2}`}
              fill="none"
              stroke={`url(#gradient-${conn.id})`}
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
            <polygon
              points={`${conn.x2},${conn.y2} ${conn.x2 - 8},${conn.y2 - 4} ${conn.x2 - 8},${conn.y2 + 4}`}
              fill="#64748b"
              className="transition-all duration-300"
            />
          </g>
        ))}

        {/* Draw modules */}
        {data.modules.map((module) => {
          const pos = modulePositions[module.id];
          if (!pos) return null;

          const nodeBgGradient = getDifficultyGradient(module.difficulty);
          const lines = wrapText(module.title, 16);
          const lineHeight = 18;
          const verticalPadding = 12;
          const rectHeight = Math.max(60, lines.length * lineHeight + verticalPadding * 2);

          return (
            <g
              key={module.id}
              className="cursor-pointer"
              onClick={() => onModuleSelect?.(module)}
            >
              <defs>
                <linearGradient
                  id={`gradient-${module.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={nodeBgGradient.from} />
                  <stop offset="100%" stopColor={nodeBgGradient.to} />
                </linearGradient>
                <filter
                  id={`shadow-${module.id}`}
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000033" />
                </filter>
              </defs>
              <rect
                x={pos.x}
                y={pos.y}
                width="170"
                height={rectHeight}
                rx="10"
                fill={`url(#gradient-${module.id})`}
                filter={`url(#shadow-${module.id})`}
                stroke={selectedModuleId === module.id ? '#fbbf24' : 'transparent'}
                strokeWidth={selectedModuleId === module.id ? '3' : '0'}
                className="transition-all duration-300 ease-in-out"
              />
              <text
                x={pos.x + 85}
                y={pos.y + verticalPadding + lineHeight / 2}
                textAnchor="middle"
                className="fill-white text-sm font-medium pointer-events-none"
              >
                {lines.map((line, i) => (
                  <tspan
                    key={i}
                    x={pos.x + 85}
                    dy={i === 0 ? 0 : lineHeight}
                    className="text-white font-medium"
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

