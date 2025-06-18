import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ProcessNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-400">
      <Handle type="target" position={Position.Left} className="w-16 !bg-blue-500" />
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label}</div>
          <div className="text-gray-500 text-sm break-words" style={{ maxWidth: '250px' }}>{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-16 !bg-blue-500" />
    </div>
  );
};

export default memo(ProcessNode); 