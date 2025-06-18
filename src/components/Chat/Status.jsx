import { useState, useEffect, useRef } from 'react';
import { getWebSocketUrl } from '../../utils/websocket';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { QueueListIcon, ArrowPathIcon, CloudArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import JobDetailsModal from './JobDetailsModal';

const Status = () => {
    const [activeJobs, setActiveJobs] = useState({});
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('active'); // 'active' or 'finished'
    const [selectedJobId, setSelectedJobId] = useState(null);
    const socketRefs = useRef({});

    const API_BASE_URL = process.env.REACT_APP_PYTHON_APP_API_URL || 'https://khan2.satia.co:1011';

    const extractDomain = (url) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/crawl/jobs?active=${filter === 'active'}`);
            const jobs = response.data.items || [];

            setActiveJobs(() => {
                const newJobs = {};
                jobs.forEach(job => {
                    newJobs[job.job_id] = {
                        init_url: job.init_url,
                        domain: extractDomain(job.init_url),
                        status: job.status.toLowerCase(),
                        statusMsg: job.status.toLowerCase() === 'queued' ? 'در صف' :
                            job.status.toLowerCase() === 'started' ? 'در حال خزش' :
                                job.status.toLowerCase() === 'finished' ? 'تکمیل شده' : job.status,
                        recursive: job.recursive,
                        started_at: job.started_at,
                        docs: [],
                        crawlProgress: 0,
                        vectorizationProgress: job.save_in_vector ? 0 : null,
                        totalUrls: 0,
                        crawledUrls: 0,
                        exceptionUrls: 0,
                        isSavingData: false,
                    };
                });
                return newJobs;
            });

            Object.keys(socketRefs.current).forEach(jobId => {
                if (!jobs.some(job => job.job_id === jobId)) {
                    socketRefs.current[jobId].close();
                    delete socketRefs.current[jobId];
                }
            });

            if (filter === 'active') {
                jobs.forEach(job => {
                    if (!socketRefs.current[job.job_id]) {
                        connectToJobSocket(job.job_id);
                    }
                });
            }
        } catch (err) {
            setError('خطا در دریافت لیست پردازش‌ها');
            console.error('Error fetching jobs:', err);
        }
    };

    const connectToJobSocket = (jobId) => {
        const wsUrl = getWebSocketUrl(`/jobs/ws/${jobId}`);
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log(`Connected to job socket: ${jobId}`);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.event) {
                    case 'progress_update':
                        handleProgressUpdate(jobId, data);
                        break;
                    case 'docs_created':
                        handleDocsCreated(jobId, data);
                        break;
                    case 'finished':
                        handleJobFinished(jobId, data);
                        break;
                    default:
                        console.log('Unknown event:', data);
                }
            } catch (err) {
                console.error('Error parsing socket message:', err);
                setError('خطا در پردازش پیام سرور');
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('خطا در ارتباط با سرور');
        };

        socket.onclose = (event) => {
            console.log(`Job socket closed: ${jobId}, code: ${event.code}`);
            if (event.code !== 1000) {
                setError('اتصال به سرور قطع شد. لطفاً دوباره امتحان کنید.');
            }
            delete socketRefs.current[jobId];
        };

        socketRefs.current[jobId] = socket;
    };

    const handleProgressUpdate = (jobId, data) => {
        setActiveJobs(prev => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: {
                    ...prev[jobId],
                    status: data.status?.toLowerCase() || prev[jobId].status,
                    statusMsg: data.status_info?.msg === 'saving data' ? 'ذخیره در پایگاه داده' :
                        data.status_info?.msg === 'running crawl' ? 'در حال خزش' :
                            data.status_info?.msg === 'Queued' ? 'در صف' :
                                data.status?.toLowerCase() === 'finished' ? 'تکمیل شده' : data.status || prev[jobId].statusMsg,
                    crawlProgress: data.status_info?.progress?.progress_percent || 0,
                    vectorizationProgress: data.status_info?.vectorization_batch && prev[jobId].vectorizationProgress !== null
                        ? data.status_info.vectorization_batch.progress.progress_percent || 0
                        : prev[jobId].vectorizationProgress,
                    totalUrls: data.status_info?.progress?.total_urls || 0,
                    crawledUrls: data.status_info?.progress?.crawled_urls || 0,
                    exceptionUrls: data.status_info?.progress?.exception_urls || 0,
                    isSavingData: data.status_info?.msg === 'saving data' || prev[jobId].isSavingData,
                }
            };
        });
    };

    const handleJobFinished = (jobId, data) => {
        setActiveJobs(prev => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: {
                    ...prev[jobId],
                    status: data.status?.toLowerCase() || 'finished',
                    statusMsg: 'تکمیل شده',
                    crawlProgress: data.progress?.progress_percent || 100,
                    vectorizationProgress: data.status_info?.vectorization_batch && prev[jobId].vectorizationProgress !== null
                        ? data.status_info.vectorization_batch.progress.progress_percent || 0
                        : prev[jobId].vectorizationProgress,
                    totalUrls: data.progress?.total_urls || prev[jobId].totalUrls || 0,
                    crawledUrls: data.progress?.crawled_urls || prev[jobId].crawledUrls || 0,
                    exceptionUrls: data.progress?.exception_urls || prev[jobId].exceptionUrls || 0,
                    isSavingData: prev[jobId].isSavingData,
                }
            };
        });

        if (socketRefs.current[jobId]) {
            socketRefs.current[jobId].close();
            delete socketRefs.current[jobId];
        }
    };

    const handleDocsCreated = async (jobId, data) => {
        const docPromises = (data.doc_ids || []).map(async (docId) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/documents/${docId}`);
                const doc = response.data;
                return {
                    id: doc.id || docId,
                    title: doc.title || 'بدون عنوان',
                    url: doc.uri || '',
                    uri: doc.uri || '',
                    html: doc.html || '',
                    markdown: doc.markdown || '',
                    domain: doc.domain || '',
                };
            } catch (err) {
                console.error('Error fetching document:', err);
                return null;
            }
        });

        const docs = (await Promise.all(docPromises)).filter(doc => doc !== null);

        setActiveJobs(prev => {
            if (!prev[jobId]) return prev;
            return {
                ...prev,
                [jobId]: {
                    ...prev[jobId],
                    docs: [...prev[jobId].docs, ...docs]
                }
            };
        });
    };

    useEffect(() => {
        fetchJobs();
        return () => {
            Object.values(socketRefs.current).forEach(socket => socket.close());
            socketRefs.current = {};
        };
    }, [filter]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openModal = (jobId) => {
        setSelectedJobId(jobId);
    };

    const closeModal = () => {
        setSelectedJobId(null);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">پردازش‌ها</h2>
                <Link
                    to="/document"
                    className="px-6 py-2 rounded-lg font-medium transition-all bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                    بازگشت
                </Link>
            </div>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600'
                        }`}
                    >
                        در حال اجرا
                    </button>
                    <button
                        onClick={() => setFilter('finished')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            filter === 'finished' ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600'
                        }`}
                    >
                        تکمیل شده
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2 animate-pulse">{error}</p>}
                {Object.entries(activeJobs).length > 0 ? (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {filter === 'active' ? 'پردازش‌های در حال اجرا' : 'پردازش‌های تکمیل شده'}
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(activeJobs).map(([jobId, job]) => (
                                <div
                                    key={jobId}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                                    onClick={() => openModal(jobId)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{job.domain}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                شروع: {formatDate(job.started_at)} {job.recursive && '(بازگشتی)'}
                                            </p>
                                        </div>
                                        <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 ${
                                            job.status === 'finished' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                job.statusMsg === 'ذخیره در پایگاه داده' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    job.status === 'started' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                        }`}>
                                            {job.statusMsg === 'در صف' && <QueueListIcon className="h-4 w-4" />}
                                            {job.statusMsg === 'در حال خزش' && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                            {job.statusMsg === 'ذخیره در پایگاه داده' && <CloudArrowDownIcon className="h-4 w-4" />}
                                            {job.statusMsg === 'تکمیل شده' && <CheckCircleIcon className="h-4 w-4" />}
                                            {job.statusMsg}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                        {filter === 'active' ? 'هیچ پردازشی در حال اجرا نیست.' : 'هیچ پردازش تکمیل‌شده‌ای یافت نشد.'}
                    </p>
                )}
                {selectedJobId && (
                    <JobDetailsModal
                        job={activeJobs[selectedJobId]}
                        onClose={closeModal}
                    />
                )}
            </div>
        </div>
    );
};

export default Status;