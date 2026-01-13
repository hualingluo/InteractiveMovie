import React, { useMemo } from 'react';
import { StoryNode } from '../../../types';

interface ConnectionLinesProps {
  nodes: Record<string, StoryNode>;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ nodes }) => {
  const lines = useMemo(() => {
    const svgLines: React.ReactElement[] = [];

    Object.values(nodes).forEach((node: StoryNode) => {
      node.options.forEach((opt) => {
        const target = nodes[opt.targetId];
        if (target) {
          const sx = node.x + 240;
          const sy = node.y + 60;
          const tx = target.x;
          const ty = target.y + 60;
          const path = `M ${sx} ${sy} C ${sx + 100} ${sy}, ${tx - 100} ${ty}, ${tx} ${ty}`;

          svgLines.push(
            <g key={`${node.id}-${opt.id}`}>
              <path
                d={path}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              <circle cx={tx} cy={ty} r="3" fill="#6366f1" />
            </g>
          );
        }
      });
    });

    return svgLines;
  }, [nodes]);

  return (
    <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none overflow-visible">
      {lines}
    </svg>
  );
};
