import { useState, useEffect, useRef } from 'react';
import { getWebSocketUrl } from '../../utils/websocket';
import { Link } from 'react-router-dom';
import { crawlUrl, getDocument } from '../../services/api';
import { ArrowPathIcon, CloudArrowDownIcon, CheckCircleIcon, QueueListIcon } from '@heroicons/react/24/outline';

const CrawlUrl = ({ onClose, onDocClick }) => {
    const [url, setUrl] = useState('');
    const [crawlRecursive, setCrawlRecursive] = useState(false);
    const [storeInVector, setStoreInVector] = useState(false);
    const [crawling, setCrawling] = useState(false);
    const [error, setError] = useState(null);
    const [activeJobs, setActiveJobs] = useState({});
    const socketRef = useRef(null);

    const handleCrawl = async () => {
        if (!url) {
            setError('لطفا آدرس وب‌سایت را وارد کنید');
            return;
        }

        try {
            new URL(url);
        } catch (e) {
            setError('لطفا یک آدرس معتبر وارد کنید');
            return;
        }

        setCrawling(true);
        setError(null);
        try {
            const response = await crawlUrl(url, crawlRecursive, storeInVector);
            const data = response.data;

            setActiveJobs(prev => ({
                ...prev,
                [data.job_id]: {
                    url: data.url,
                    status: 'queued',
                    statusMsg: 'در صف',
                    docs: [],
                    crawlProgress: 0,
                    vectorizationProgress: storeInVector ? 0 : null,
                    totalUrls: 0,
                    crawledUrls: 0,
                    exceptionUrls: 0,
                }
            }));

            connectToJobSocket(data.job_id);
            setUrl('');
        } catch (err) {
            setError(err.message);
            console.error('Error crawling website:', err);
        } finally {
            setCrawling(false);
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
        };

        socketRef.current = socket;
    };

    const handleProgressUpdate = (jobId, data) => {
        setActiveJobs(prev => {
            const updatedJobs = { ...prev, [jobId]: {
                    ...prev[jobId],
                    status: data.status,
                    statusMsg: data.status_info.msg === 'saving data' ? 'ذخیره در پایگاه داده' :
                        data.status_info.msg === 'running crawl' ? 'در حال خزش' :
                            data.status_info.msg === 'Queued' ? 'در صف' : data.status,
                    crawlProgress: data.status_info.progress.progress_percent,
                    vectorizationProgress: data.status_info.vectorization_batch && prev[jobId].vectorizationProgress !== null
                        ? data.status_info.vectorization_batch.progress.progress_percent
                        : prev[jobId].vectorizationProgress,
                    totalUrls: data.status_info.progress.total_urls,
                    crawledUrls: data.status_info.progress.crawled_urls,
                    exceptionUrls: data.status_info.progress.exception_urls,
                }};
            return updatedJobs;
        });
    };

    const handleJobFinished = (jobId, data) => {
        setActiveJobs(prev => {
            const updatedJobs = { ...prev };
            if (updatedJobs[jobId]) {
                updatedJobs[jobId] = {
                    ...updatedJobs[jobId],
                    status: data.status,
                    statusMsg: 'تکمیل شده',
                    crawlProgress: data.progress?.progress_percent || 100,
                    vectorizationProgress: data.status_info?.vectorization_batch && updatedJobs[jobId].vectorizationProgress !== null
                        ? data.status_info.vectorization_batch.progress.progress_percent
                        : updatedJobs[jobId].vectorizationProgress,
                    totalUrls: data.progress?.total_urls || updatedJobs[jobId].totalUrls,
                    crawledUrls: data.progress?.crawled_urls || updatedJobs[jobId].crawledUrls,
                    exceptionUrls: data.progress?.exception_urls || updatedJobs[jobId].exceptionUrls,
                };
            }
            return updatedJobs;
        });
    };

    const handleDocsCreated = async (jobId, data) => {
        const docPromises = data.doc_ids.map(async (docId) => {
            try {
                const response = await getDocument(docId);
                const doc = response.data;
                return {
                    id: doc.id,
                    title: doc.title,
                    url: doc.uri,
                    uri: doc.uri,
                    html: doc.html,
                    markdown: doc.markdown,
                    domain: doc.domain,
                };
            } catch (err) {
                console.error('Error fetching document:', err);
                return null;
            }
        });

        const docs = (await Promise.all(docPromises)).filter(doc => doc !== null);

        setActiveJobs(prev => {
            const updatedJobs = { ...prev };
            if (updatedJobs[jobId]) {
                updatedJobs[jobId] = {
                    ...updatedJobs[jobId],
                    docs: [...updatedJobs[jobId].docs, ...docs],
                };
            }
            return updatedJobs;
        });
    };

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const getCombinedProgress = (job) => {
        if (job.vectorizationProgress === null) {
            return job.crawlProgress;
        }
        // Combined progress: 50% weight for crawling, 50% for vectorization
        return (job.crawlProgress * 0.5 + job.vectorizationProgress * 0.5);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-10 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">خزش وب‌سایت</h2>
                <Link
                    to="/document"
                    className="px-6 py-2 rounded-lg font-medium transition-all bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                    بازگشت
                </Link>
            </div>
            <div className="space-y-6">
                <div>
                    <label htmlFor="crawl-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        آدرس وب‌سایت
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="url"
                            id="crawl-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                            placeholder="https://example.com"
                        />
                        <button
                            onClick={handleCrawl}
                            disabled={crawling}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 transition-all duration-200"
                        >
                            {crawling ? (
                                <>
                                    <ArrowPathIcon className="animate-spin h-5 w-5" />
                                    در حال خزش...
                                </>
                            ) : (
                                <>
                                    <CloudArrowDownIcon className="h-5 w-5" />
                                    شروع خزش
                                </>
                            )}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2 animate-pulse">{error}</p>}
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="crawl-recursive"
                                checked={crawlRecursive}
                                onChange={e => setCrawlRecursive(e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                            />
                            <label htmlFor="crawl-recursive" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                خزش تو در تو (Recursive)
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="store-in-vector"
                                checked={storeInVector}
                                onChange={e => setStoreInVector(e.target.checked)}
                                className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
                            />
                            <label htmlFor="store-in-vector" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                اسناد ساخته شده پس از خزش فعال شوند و در دسترس هوش مصنوعی قرار گیرند.
                            </label>
                        </div>
                    </div>
                </div>

                {/* Active Jobs List */}
                {Object.entries(activeJobs).length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وظایف فعال</h3>
                        <div className="space-y-4">
                            {Object.entries(activeJobs).map(([jobId, job]) => (
                                <div key={jobId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-900 dark:text-white truncate max-w-md">{job.url}</h4>
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
                                    {/* Combined Progress Bar */}
                                    <div className="mt-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ease-in-out ${
                                                    job.vectorizationProgress !== null ? 'bg-gradient-to-r from-purple-500 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-700'
                                                }`}
                                                style={{ width: `${getCombinedProgress(job)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-center text-sm mt-1 text-gray-600 dark:text-gray-400">
                                            <span> {getCombinedProgress(job).toFixed(1)}%</span>
                                            {/*<span>*/}
                                            {/*    {job.crawledUrls} از {job.totalUrls} لینک خزیده شده*/}
                                            {/*</span>*/}
                                        </div>
                                    </div>
                                    {/* Detailed Progress Info */}

                                    {job.exceptionUrls > 0 && (
                                        <p className="text-sm text-red-500 mt-2 animate-pulse">
                                            {job.exceptionUrls} لینک با خطا مواجه شده‌اند
                                        </p>
                                    )}
                                    {job.docs.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <h5 className="font-medium text-gray-900 dark:text-white">اسناد خزیده شده:</h5>
                                            {job.docs.map((doc) => (
                                                <Link
                                                    key={doc.id}
                                                    to={`/document/edit/${doc.id}`}
                                                    className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 block"
                                                >
                                                    <h6 className="font-medium text-gray-900 dark:text-white">{doc.title}</h6>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{doc.uri}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrawlUrl;