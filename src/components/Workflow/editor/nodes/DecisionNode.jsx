import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const DecisionNode = ({ data }) => {
  const validConditions = data.conditions?.filter((condition) => condition && condition.trim() !== '') || [];
  const baseTop = 30; // موقعیت پایه برای اولین Handle (پیکسل)
  const handleSpacing = 40; // فاصله ثابت بین Handleها (پیکسل)
  const nodeHeight = Math.max(80 + (validConditions.length * handleSpacing), 120); // ارتفاع پویا

  // محاسبه عرض پویا بر اساس طولانی‌ترین شرط
  const longestCondition = validConditions.length > 0
      ? validConditions.reduce((a, b) => (a.length > b.length ? a : b), '')
      : '';
  const estimatedWidth = longestCondition
      ? Math.max(longestCondition.length * 10 + 100, 300) // تقریبی: هر کاراکتر 10px + حاشیه
      : 300; // عرض پیش‌فرض

  return (
      <div
          className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-yellow-400 relative"
          style={{
            minHeight: `${nodeHeight}px`,
            minWidth: `${estimatedWidth}px`, // عرض پویا
            position: 'relative',
            zIndex: 0
          }}
      >
        <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-yellow-500 hover:!bg-yellow-600 transition-colors"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
        <div className="flex items-center">
          <div className="rounded-full w-12 h-12 flex items-center justify-center bg-yellow-100">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-2">
            <div className="text-lg font-bold">{data.label}</div>
            <div className="text-gray-500 text-sm break-words">
              {data.description}
            </div>
          </div>
        </div>
        {validConditions.length > 0 ? (
            validConditions.map((condition, index) => {
              const topPosition = baseTop + (index * handleSpacing); // موقعیت با فاصله ثابت
              return (
                  <div key={`${condition}-${index}`} className="relative">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={condition}
                        style={{
                          top: `${topPosition}px`,
                          transform: 'translateY(-50%)',
                          right: '-10px',
                          position: 'absolute',
                          zIndex: 10,
                        }}
                        className="w-5 h-5 !bg-yellow-500 hover:!bg-yellow-600 transition-colors cursor-crosshair"
                        isConnectable={true}
                    />
                    {/* برچسب ثابت برای نمایش condition */}
                    <div
                        className="absolute text-sm text-gray-700 bg-transparent px-2 py-1 rounded whitespace-nowrap"
                        style={{
                          top: `${topPosition}px`,
                          right: '20px', // فاصله بیشتر از لبه نود برای جا شدن داخل نود
                          transform: 'translateY(-50%)',
                          zIndex: 5,
                        }}
                    >
                      {condition}
                    </div>
                  </div>
              );
            })
        ) : (
            <div className="text-gray-500 text-sm mt-2">بدون شرط</div>
        )}
      </div>
  );
};

export default memo(DecisionNode);