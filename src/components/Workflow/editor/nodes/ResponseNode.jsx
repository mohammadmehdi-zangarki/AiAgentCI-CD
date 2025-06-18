import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ResponseNode = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-orange-400">
      <Handle type="target" position={Position.Left} className="w-16 !bg-orange-500" />
      <div className="flex items-center">
        <div className="rounded-full w-12 h-12 flex items-center justify-center bg-orange-100">
          {/* Placeholder Icon for Response Node */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.913 9.913 0 01-3.981-.82A10.003 10.003 0 004 21c.217 0 .42-.029.613-.08a1 1 0 01.19-.182l-.016.016A6.5 6.5 0 0110 14c4.69 0 8.5-3.582 8.5-8S15.69 2 11 2c-1.165 0-2.281.191-3.312.555S4.982 3.656 4 4.838C3.018 6.02 2.5 7.45 2.5 9c0 .84.116 1.648.336 2.416.054.196-.008.403-.16.554l-1.234 1.234c-.432.432-.194 1.154.43 1.457A16.011 16.011 0 0012 20c4.97 0 9-3.582 9-8z"
            />
          </svg>
        </div>
        <div className="ml-2">
          <div className="text-lg font-bold">{data.label || "پاسخ"}</div>
          <div className="text-gray-500 text-sm break-words" style={{ maxWidth: '250px' }}>{data.description}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-16 !bg-orange-500" />
    </div>
  );
};

export default memo(ResponseNode); 