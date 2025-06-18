import React, { useState, useEffect, useRef } from 'react';
import { askQuestion } from '../../services/api';
import { WizardButtons, WizardButton } from './Wizard/';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';
import { getWebSocketUrl } from '../../utils/websocket';
import '../../styles/ChatStyles.css';
import VoiceBtn from './VoiceBtn';
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
  const [rootWizards, setRootWizards] = useState([]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const initialMessageAddedRef = useRef(false);
  let inCompatibleMessage = '';
  let bufferedTable = '';
  let isInsideTable = false;
  const [forceRender, setForceRender] = useState(false);
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

  const CopyButton = ({ text }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`copy-button ${isCopied ? 'copied' : ''}`}
            title="کپی متن"
        >
          <svg className="copy-icon" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m0 0H15a2.25 2.25 0 012.25 2.25v9.75m0 0H21m-9-6h4.5m-4.5 3h4.5" />
          </svg>
          <svg className="check-icon" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const chatLinks = document.querySelectorAll('.chat-message a');
      console.log('Found chat links:', chatLinks.length);
      chatLinks.forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });

      const glassButtons = document.querySelectorAll('.glass-button');
      glassButtons.forEach((button) => {
        button.removeEventListener('click', handleGlassButtonClick);
        button.addEventListener('click', () => handleGlassButtonClick(button.getAttribute('data-value')));
      });

      // اضافه کردن شنونده‌ها برای ردیف‌های جدول
      const tableRows = document.querySelectorAll('tbody tr[data-value]');
      console.log('Found table rows with data-value:', tableRows.length);
      tableRows.forEach((row) => {
        row.removeEventListener('click', handleRowClick);
        row.addEventListener('click', () => handleRowClick(row.getAttribute('data-value')));
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [chatHistory, forceRender]);

  const handleGlassButtonClick = (value) => {
    if (!value || chatLoading) return;
    const syntheticEvent = { preventDefault: () => {} };
    realtimeHandleSubmit(syntheticEvent, value);
  };

  const handleRowClick = (value) => {
    if (!value || chatLoading) return;
    const syntheticEvent = { preventDefault: () => {} };
    realtimeHandleSubmit(syntheticEvent, value);
  };

  useEffect(() => {
    const storedSessionId = localStorage.getItem('chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `uuid_${uuidv4()}`;
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchChatHistory(0);
      fetchRootWizards();
    }
  }, [sessionId]);

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
      setRootWizards(data);
      setCurrentWizards(data);
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
        return;
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

  const realtimeHandleSubmit = async (e, customQuestion = null) => {
    e.preventDefault();
    const questionToSend = customQuestion || question;
    if (!questionToSend.trim()) return;

    setQuestion('');
    setError(null);

    const userMessage = {
      type: 'question',
      text: questionToSend,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, userMessage]);

    if (socketRef.current) {
      socketRef.current.close();
    }

    initialMessageAddedRef.current = false;
    inCompatibleMessage = '';
    bufferedTable = '';
    isInsideTable = false;

    const storedSessionId = localStorage.getItem('chat_session_id');
    if (!storedSessionId) {
      setError('خطا در شناسایی نشست');
      return;
    }

    socketRef.current = new WebSocket(getWebSocketUrl(`/ws/ask?session_id=${storedSessionId}`));

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
      socketRef.current.send(
          JSON.stringify({
            question: questionToSend,
            session_id: storedSessionId,
          })
      );
      setChatLoading(true);
    };

    socketRef.current.onmessage = handleDeltaResponse;

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
      if (isInsideTable && bufferedTable) {
        setChatHistory((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            answer: inCompatibleMessage,
          };
          return updated;
        });
        bufferedTable = '';
        isInsideTable = false;
      }
      setChatLoading(false);
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('خطا در ارتباط با سرور');
      setChatLoading(false);
    };
  };

  const handleDeltaResponse = (event) => {
    try {
      const parsedData = JSON.parse(event.data);
      if (parsedData.event === "fetching data" && parsedData.message === "در حال واکشی اطلاعات, لطفا صبر کنید.") {
        console.log("Ignoring fetching data message from WebSocket.");
        return;
      }
      if (parsedData.event === "finished") {
        console.log("Received finished message from WebSocket:", parsedData.msg);
        setChatHistory((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              answer: inCompatibleMessage,
            };
          }
          return updated;
        });
        bufferedTable = '';
        isInsideTable = false;
        setChatLoading(false);
        setForceRender((prev) => !prev);
        return;
      }
    } catch (e) {
      // Not a JSON message, proceed with normal handling.
    }

    if (!initialMessageAddedRef.current) {
      const botMessage = {
        type: 'answer',
        answer: '',
        sources: [],
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, botMessage]);
      initialMessageAddedRef.current = true;
      setChatLoading(true);
    }

    let delta = event.data;
    inCompatibleMessage += delta;

    if (inCompatibleMessage.includes('<table')) {
      isInsideTable = true;
      bufferedTable += delta;
    } else if (isInsideTable) {
      bufferedTable += delta;
    } else {
      setChatHistory((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          answer: inCompatibleMessage,
        };
        return updated;
      });
      setChatLoading(false);
      return;
    }

    if (isInsideTable) {
      const openTableTags = (bufferedTable.match(/<table>/g) || []).length;
      const closeTableTags = (bufferedTable.match(/<\/table>/g) || []).length;

      if (openTableTags === closeTableTags && openTableTags > 0) {
        setChatHistory((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            answer: inCompatibleMessage,
          };
          return updated;
        });
        bufferedTable = '';
        isInsideTable = false;
        setChatLoading(false);
      } else {
        const openTrTags = (bufferedTable.match(/<tr>/g) || []).length;
        const closeTrTags = (bufferedTable.match(/<\/tr>/g) || []).length;

        if (openTrTags > closeTrTags) {
          const lastOpenTrIndex = bufferedTable.lastIndexOf('<tr>');
          if (lastOpenTrIndex !== -1) {
            const partialMessage = bufferedTable.substring(0, lastOpenTrIndex);
            setChatHistory((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                answer: inCompatibleMessage.replace(bufferedTable, partialMessage),
              };
              return updated;
            });
          }
          return;
        }

        const lastCompleteRowIndex = bufferedTable.lastIndexOf('</tr>');
        if (lastCompleteRowIndex !== -1) {
          const partialTable = bufferedTable.substring(0, lastCompleteRowIndex + 5);
          setChatHistory((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              answer: inCompatibleMessage.replace(bufferedTable, partialTable),
            };
            return updated;
          });
        }
      }
    }
  };

  const handleWizardSelect = (wizardData) => {
    setChatHistory((prev) => [
      ...prev,
      {
        type: 'answer',
        answer: wizardData.context,
        timestamp: new Date(),
      },
    ]);

    if (wizardData.children && wizardData.children.length > 0) {
      setCurrentWizards(wizardData.children);
    } else {
      setCurrentWizards(rootWizards);
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
        <div className="flex flex-col h-full p-6 max-w-7xl mx-auto">
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
                            <>
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
                              <CopyButton text={item.text} />
                            </>
                        ) : (
                            <>
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
                              <CopyButton text={item.answer} />
                            </>
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
          <WizardButtons onWizardSelect={handleWizardSelect} wizards={currentWizards} />
          <div className="chat-input-container">
            <div className="chat-textarea-wrapper">
              <textarea
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    e.target.style.height = 'auto';
                    const newHeight = Math.min(e.target.scrollHeight, 240);
                    e.target.style.height = `${newHeight}px`;
                    e.target.scrollTop = e.target.scrollHeight;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!chatLoading && question.trim()) {
                        realtimeHandleSubmit(e);
                      }
                    } else if (e.key === 'Enter' && e.shiftKey) {
                      e.preventDefault();
                      setQuestion((prev) => prev + '\n');
                      setTimeout(() => {
                        e.target.style.height = 'auto';
                        const newHeight = Math.min(e.target.scrollHeight, 240);
                        e.target.style.height = `${newHeight}px`;
                        e.target.scrollTop = e.target.scrollHeight;
                      }, 0);
                    }
                  }}
                  placeholder="سوال خود را بپرسید..."
                  className="chat-textarea"
                  disabled={chatLoading}
              />
            </div>
            <div className='flex flex-col gap-2'>
            <VoiceBtn/>
            <button
                onClick={realtimeHandleSubmit}
                disabled={chatLoading || !question.trim()}
                className="chat-submit-button"
            >
              {chatLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>در حال ارسال...</span>
                  </>
              ) : (
                  'ارسال'
              )}
            </button>
            </div>
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </>
  );
};

export default Chat;