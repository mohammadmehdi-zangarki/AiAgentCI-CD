import React, { useState, useEffect, useRef } from 'react';
import { askQuestion } from '../../services/api';
import { WizardButtons, WizardButton } from './Wizard/';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketUrl } from '../../utils/websocket';

// استایل‌های سراسری برای پیام‌های چت
const globalStyles = `
    .chat-message table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.chat-message table th {
  background-color: white;
  color: black;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: right;
}

.msg {
  transition: height 0.3s ease-in-out;
}

.chat-message table td {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: right;
}

.dark .chat-message table th {
  background-color: white;
  color: black;
  border-color: #374151;
}

.dark .chat-message table td {
  color: white;
  border-color: #374151;
}

/* Quill Editor RTL Styles */
.ql-editor {
  direction: rtl !important;
  text-align: right !important;
}

.ql-toolbar {
  direction: rtl !important;
}

.ql-toolbar .ql-formats {
  margin-left: 15px !important;
  margin-right: 0 !important;
}

.ql-toolbar .ql-picker {
  margin-left: 15px !important;
  margin-right: 0 !important;
}

/* Quill Editor Dark Mode Styles */
.dark .ql-toolbar {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

.dark .ql-toolbar button {
  color: #ffffff !important;
}

.dark .ql-toolbar button:hover {
  color: #3b82f6 !important;
}

.dark .ql-toolbar button.ql-active {
  color: #3b82f6 !important;
}

.dark .ql-toolbar .ql-picker {
  color: #ffffff !important;
}

.dark .ql-toolbar .ql-picker-options {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

.dark .ql-toolbar .ql-picker-item {
  color: #ffffff !important;
}

.dark .ql-toolbar .ql-picker-item:hover {
  color: #3b82f6 !important;
}

.dark .ql-container {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

.dark .ql-editor {
  color: #ffffff !important;
}

.dark .ql-editor.ql-blank::before {
  color: #9ca3af !important;
}

/* SVG Icon Styles for Dark Mode */
.dark .ql-toolbar .ql-stroke {
  stroke: #ffffff !important;
}

.dark .ql-toolbar .ql-fill {
  fill: #ffffff !important;
}

.dark .ql-toolbar .ql-even {
  fill: #ffffff !important;
}

.dark .ql-toolbar .ql-thin {
  stroke: #ffffff !important;
}

.dark .ql-toolbar button:hover .ql-stroke,
.dark .ql-toolbar button:hover .ql-fill,
.dark .ql-toolbar button:hover .ql-even,
.dark .ql-toolbar button:hover .ql-thin {
  stroke: #3b82f6 !important;
  fill: #3b82f6 !important;
}

.dark .ql-toolbar button.ql-active .ql-stroke,
.dark .ql-toolbar button.ql-active .ql-fill,
.dark .ql-toolbar button.ql-active .ql-even,
.dark .ql-toolbar button.ql-active .ql-thin {
  stroke: #3b82f6 !important;
  fill: #3b82f6 !important;
}

.dark .ql-toolbar .ql-picker-label {
  color: #ffffff !important;
}

.dark .ql-toolbar .ql-picker-label:hover {
  color: #3b82f6 !important;
}

.dark .ql-toolbar .ql-picker-label.ql-active {
  color: #3b82f6 !important;
}

/* Chat message links styling */
.chat-message a {
  color: #2563eb !important;
  text-decoration: underline;
  word-break: break-all;
}
.chat-message a:hover {
  color: #1d4ed8 !important;
}
.dark .chat-message a {
  color: #60a5fa !important;
}
.dark .chat-message a:hover {
  color: #3b82f6 !important;
}
`;

const Chat = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const [historyOffset, setHistoryOffset] = useState(0);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [currentWizards, setCurrentWizards] = useState([]);
    const [rootWizards, setRootWizards] = useState([]); // New state to store root wizards
    const chatContainerRef = useRef(null);
    const chatEndRef = useRef(null);
    const socketRef = useRef(null);
    const initialMessageAddedRef = useRef(false);
    let inCompatibleMessage = '';

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean'],
        ],
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const chatLinks = document.querySelectorAll('.chat-message a');
            console.log('Found chat links:', chatLinks.length); // برای دیباگ
            chatLinks.forEach((link) => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
        }, 100); // تأخیر کوچک برای اطمینان از رندر DOM
        return () => clearTimeout(timer);
    }, [chatHistory]);




    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [historyLoading, hasMoreHistory, historyOffset]);

    useEffect(() => {
        if (!historyLoading && chatHistory.length > 0) {
            const scrollToBottom = () => {
                if (chatEndRef.current) {
                    chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            };
            scrollToBottom();
            setTimeout(scrollToBottom, 100);
        }
    }, [historyLoading, chatHistory.length]);

    const fetchRootWizards = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/hierarchy/roots`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('خطا در دریافت ویزاردها');
            }
            const data = await response.json();
            setRootWizards(data); // Store root wizards
            setCurrentWizards(data); // Set initial current wizards
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchChatHistory = async (offset = 0, limit = 20) => {
        if (!sessionId) return;

        setHistoryLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_PYTHON_APP_API_URL}/chat/history/${sessionId}?offset=${offset}&limit=${limit}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.status !== 200) {
                return
            }

            const messages = await response.json();

            if (Array.isArray(messages)) {
                const transformedMessages = messages.map((msg) => ({
                    type: msg.role === 'user' ? 'question' : 'answer',
                    text: msg.role === 'user' ? msg.body : undefined,
                    answer: msg.role === 'assistant' ? msg.body : undefined,
                    timestamp: new Date(msg.created_at),
                }));

                const reversedMessages = [...transformedMessages].reverse();

                if (offset === 0) {
                    setChatHistory(reversedMessages);
                } else {
                    setChatHistory((prev) => [...reversedMessages, ...prev]);
                }
                setHasMoreHistory(messages.length === limit);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching chat history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion('');
        setChatLoading(true);
        setError(null);

        setChatHistory((prev) => [
            ...prev,
            { type: 'question', text: currentQuestion, timestamp: new Date() },
        ]);

        try {
            const response = await askQuestion(currentQuestion);
            setChatHistory((prev) => [
                ...prev,
                {
                    type: 'answer',
                    answer: response.answer,
                    sources: response.sources || [],
                    timestamp: new Date(),
                },
            ]);
        } catch (err) {
            setError('خطا در دریافت پاسخ');
            console.error('Error asking question:', err);
        } finally {
            setChatLoading(false);
        }
    };

    const realtimeHandleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion('');
        setError(null);

        const userMessage = {
            type: 'question',
            text: currentQuestion,
            timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, userMessage]);

        if (socketRef.current) {
            socketRef.current.close();
        }

        initialMessageAddedRef.current = false;

        const url = new URL(process.env.REACT_APP_PYTHON_APP_API_URL);
        const hostPort = `${url.hostname}:${url.port}`;
        const storedSessionId = localStorage.getItem('chat_session_id');
        if (!storedSessionId) {
            setError('خطا در شناسایی نشست');
            return;
        }

        socketRef.current = new WebSocket(getWebSocketUrl(`/ws/ask?session_id=${storedSessionId}`));

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
            inCompatibleMessage = '';
            socketRef.current.send(
                JSON.stringify({
                    question: currentQuestion,
                    session_id: storedSessionId,
                })
            );
            setChatLoading(true);
        };

        socketRef.current.onmessage = handleDeltaResponse;

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
            setChatLoading(false);
        };

        socketRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('خطا در ارتباط با سرور');
            setChatLoading(false);
        };
    };

    const handleDeltaResponse = (event) => {
        if (!initialMessageAddedRef.current) {
            const botMessage = {
                type: 'answer',
                answer: '',
                sources: [],
                timestamp: new Date(),
            };
            setChatHistory((prev) => [...prev, botMessage]);
            setChatLoading(false);
            initialMessageAddedRef.current = true;
        }

        let delta = event.data;
        inCompatibleMessage += delta;
        let msg = inCompatibleMessage;

        const openTableTags = (msg.match(/<table>/g) || []).length;
        const closeTableTags = (msg.match(/<\/table>/g) || []).length;
        const openTableExists = openTableTags > closeTableTags;

        if (openTableExists) {
            const openTrCount = (msg.match(/<tr>/g) || []).length;
            const closeTrCount = (msg.match(/<\/tr>/g) || []).length;
            const openTrExists = openTrCount > closeTrCount;

            if (openTrExists) {
                const lastOpenTrIndex = msg.lastIndexOf('<tr>');
                if (lastOpenTrIndex !== -1) {
                    msg = msg.substring(0, lastOpenTrIndex);
                }
            }
        }

        setChatHistory((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
                ...updated[lastIndex],
                answer: msg,
            };
            return updated;
        });
    };

    const handleWizardSelect = (wizardData) => {
        // Add the wizard's context as an answer to the chat history
        setChatHistory((prev) => [
            ...prev,
            {
                type: 'answer',
                answer: wizardData.context,
                timestamp: new Date(),
            },
        ]);

        // Update currentWizards based on whether the wizard has children
        if (wizardData.children && wizardData.children.length > 0) {
            setCurrentWizards(wizardData.children);
        } else {
            setCurrentWizards(rootWizards); // Reset to root wizards if no children
        }
    };

    const handleScroll = () => {
        if (!chatContainerRef.current || historyLoading || !hasMoreHistory) return;

        const { scrollTop } = chatContainerRef.current;
        if (scrollTop === 0) {
            const newOffset = historyOffset + 20;
            setHistoryOffset(newOffset);
            fetchChatHistory(newOffset);
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
        });


    };

    return (
        <>
            <style>{globalStyles}</style>
            <div className="flex flex-col h-full p-6 max-w-7xl mx-auto z-51">
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto mb-4 space-y-4"
                    style={{
                        height: 'calc(100vh - 200px)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {historyLoading && (
                        <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                            <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری تاریخچه...</p>
                        </div>
                    )}
                    <div className="flex-1">
                        {chatHistory.length === 0 && !historyLoading ? (
                            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                                سوال خود را بپرسید تا گفتگو شروع شود
                            </div>
                        ) : (
                            chatHistory.map((item, index) => (
                                <div key={index} className="mb-4 msg">
                                    {item.type === 'question' ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-right">
                                            <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(item.timestamp)}
                        </span>
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">شما</span>
                                            </div>
                                            <div
                                                className="text-gray-800 dark:text-white chat-message"
                                                dangerouslySetInnerHTML={{ __html: item.text }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                                            <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(item.timestamp)}
                        </span>
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">چت‌بات</span>
                                            </div>
                                            <div className="mb-4">
                                                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">پاسخ:</h3>
                                                <div
                                                    className="text-gray-700 dark:text-white chat-message"
                                                    dangerouslySetInnerHTML={{ __html: item.answer }}
                                                />
                                            </div>
                                            {item.sources && item.sources.length > 0 && (
                                                <div>
                                                    <h3 className="font-bold mb-2 text-sm text-gray-900 dark:text-white">منابع:</h3>
                                                    <ul className="list-disc pl-4">
                                                        {item.sources.map((source, sourceIndex) => (
                                                            <li key={sourceIndex} className="mb-2">
                                                                <p className="text-sm text-gray-700 dark:text-white">{source.text}</p>
                                                                <a
                                                                    href={source.metadata?.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    منبع: {source.metadata?.source || 'نامشخص'}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    {chatLoading && (
                        <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-gray-800 rounded-lg mb-4 animate-pulse">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                            <p className="text-gray-600 dark:text-gray-300">در حال دریافت پاسخ...</p>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!chatLoading && question.trim()) {
                                    realtimeHandleSubmit(e);
                                }
                            }
                        }}
                        placeholder="سوال خود را بپرسید..."
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={chatLoading}
                    />
                    <button
                        onClick={realtimeHandleSubmit}
                        disabled={chatLoading || !question.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                        <span> ارسال</span>
                    </button>
                </div>
                {error && <div className="text-red-500 mt-2">{error}</div>}
            </div>
        </>
    );
};

export default Chat;