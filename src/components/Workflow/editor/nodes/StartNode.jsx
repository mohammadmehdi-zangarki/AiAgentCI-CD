import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const StartNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-400">
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex items-center justify-center bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-gray-500 text-sm break-words" style={{ maxWidth: '250px' }}>{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-16 !bg-green-500" />
    </div>
  );
};

export default memo(StartNode); 