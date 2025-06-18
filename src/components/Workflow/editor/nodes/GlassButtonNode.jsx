import React, { useEffect } from 'react';
import { Handle, Position } from 'reactflow';

const GlassButtonNode = ({ data }) => {
    useEffect(() => {
        const buttons = document.querySelectorAll('.glass-button');
        buttons.forEach((button) => {
            const handleClick = async () => {
                const value = button.getAttribute('data-value');
                try {
                    // فرضاً یک API برای ارسال به مدل AI
                    const response = await fetch('/api/send-to-ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value }),
                    });
                    const result = await response.json();
                    console.log('AI Response:', result);
                } catch (error) {
                    console.error('Error sending to AI:', error);
                }
            };

            button.addEventListener('click', handleClick);

            return () => {
                button.removeEventListener('click', handleClick);
            };
        });
    }, []);

    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border-2 border-pink-400">
            <Handle type="target" position={Position.Left} className="w-16 !bg-pink-500" />
            <div className="flex items-center">
                <div className="rounded-full w-12 h-12 flex items-center justify-center bg-pink-100">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-pink-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                </div>
                <div className="ml-2">
                    <div className="text-lg font-bold ">{data.label}</div>
                    <div className="text-gray-200 text-sm break-words" style={{ maxWidth: '250px' }}>
                        {data.description}
                    </div>
                    {data.value && (
                        <div className="text-gray-300 text-sm break-words" style={{ maxWidth: '250px' }}>
                            مقدار: {data.value}
                        </div>
                    )}
                    {data.text && (
                        <button
                            type="button"

                            data-value={data.value}
                            className="glass-button mt-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md shadow-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
                        >
                            {data.text}
                        </button>
                    )}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-16 !bg-pink-500" />
        </div>
    );
};

export default GlassButtonNode;