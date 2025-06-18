import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const FunctionNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-400">
      <Handle type="target" position={Position.Left} className="w-16 !bg-purple-500" />
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex items-center justify-center bg-purple-100">
          {/* Placeholder Icon for Function Node */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2m4 6v-4a2 2 0 00-2-2h-2m0 0l-3-3m0 0l-3 3"
            />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label || "تابع"}</div>
          <div className="text-gray-500 text-sm break-words" style={{ maxWidth: '250px' }}>{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-16 !bg-purple-500" />
    </div>
  );
};

export default memo(FunctionNode); 