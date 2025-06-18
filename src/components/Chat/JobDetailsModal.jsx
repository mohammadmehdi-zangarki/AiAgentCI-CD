import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { getWebSocketUrl } from '../../utils/websocket';

const JobDetailsModal = ({ job, onClose, setActiveJobs }) => {
    const socketRef = useRef(null);
    const API_BASE_URL = process.env.REACT_APP_PYTHON_APP_API_URL || 'https://khan2.satia.co:1011';

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
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log(`Job socket closed: ${jobId}, code: ${event.code}`);
        };

        socketRef.current = socket;
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

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
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
        if (job.job_id && job.status !== 'finished') {
            connectToJobSocket(job.job_id);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [job.job_id, job.status]);

    const getProgressValue = (job) => {
        if (job.isSavingData && job.vectorizationProgress !== null) {
            return job.vectorizationProgress;
        }
        return job.crawlProgress;
    };

    const getProgressLabel = (job) => {
        if (job.isSavingData && job.vectorizationProgress !== null) {
            return `ذخیره‌سازی: ${job.vectorizationProgress}%`;
        }
        return `خزش: ${job.crawlProgress}%`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">جزئیات پردازش</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <XCircleIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">دامنه:</p>
                        <p className="text-gray-900 dark:text-white truncate">{job.domain}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL اولیه:</p>
                        <p className="text-gray-900 dark:text-white truncate">{job.init_url}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">زمان شروع:</p>
                        <p className="text-gray-900 dark:text-white">{formatDate(job.started_at)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت:</p>
                        <p className="text-gray-900 dark:text-white">{job.statusMsg}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع خزش:</p>
                        <p className="text-gray-900 dark:text-white">{job.recursive ? 'بازگشتی' : 'تکی'}</p>
                    </div>
                    {job.status !== 'finished' && (
                        <>
                            <div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mt-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ease-in-out ${
                                            job.isSavingData && job.vectorizationProgress !== null
                                                ? 'bg-gradient-to-r from-purple-500 to-purple-700'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-700'
                                        }`}
                                        style={{ width: `${getProgressValue(job)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm mt-1 text-gray-600 dark:text-gray-400">
                                    <span>{getProgressLabel(job)}</span>
                                    <span>{job.crawledUrls} از {job.totalUrls} لینک خزیده شده</span>
                                </div>
                            </div>
                            {job.isSavingData && job.vectorizationProgress !== null && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">وکتورسازی:</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {job.vectorizationProgress}% ({job.vectorizationProgress === 100 ? 'کامل شد' : 'در حال انجام...'})
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {job.docs.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">اسناد خزیده شده:</p>
                            <div className="space-y-2 mt-2">
                                {job.docs.map((doc) => (
                                    <Link
                                        key={doc.id}
                                        to={`/document/edit/${doc.id}`}
                                        className="p-3 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 block"
                                        onClick={onClose}
                                    >
                                        <h6 className="font-medium text-gray-900 dark:text-white">{doc.title}</h6>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{doc.uri}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobDetailsModal;