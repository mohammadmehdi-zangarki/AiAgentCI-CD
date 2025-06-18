import React, { useState, useEffect } from 'react';
import CrawlUrl from '../CrawlUrl';
import CreateDocument from './CreateDocument';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

// استایل‌های سراسری برای جداول در Markdown و CKEditor
const globalStyles = `
    .prose table, .ck-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    direction: rtl;
}

.prose table th, .ck-content table th {
    background-color: #f3f4f6;
    color: #1f2937;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    text-align: right;
    font-weight: 600;
}

.prose table td, .ck-content table td {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    text-align: right;
    color: #374151;
}

.dark .prose table th, .dark .ck-content table th {
    background-color: #374151;
    color: #f9fafb;
    border-color: #4b5563;
}

.dark .prose table td, .dark .ck-content table td {
    color: #d1d5db;
    border-color: #4b5563;
}
`;

const DocumentIndex = () => {
    const [domains, setDomains] = useState([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [domainFiles, setDomainFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [fileContentLoading, setFileContentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCrawlUrl, setShowCrawlUrl] = useState(false);
    const [crawledDocs, setCrawledDocs] = useState([]);
    const [documentindexTab, setDocumentIndexTab] = useState('crawled');
    const [showAddKnowledge, setShowAddKnowledge] = useState(false);
    const [manualDocumentIndex, setManualDocumentIndex] = useState([]);
    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        total: 0,
    });

    const location = useLocation()

    useEffect(() => {
        if (documentindexTab === 'crawled') {
            fetchDomains();
        } else if (documentindexTab === 'manual') {
            fetchManualDocumentIndex();
        }
    }, [documentindexTab, pagination.offset]);

    const fetchDomains = async () => {
        setDomainsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/domains`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('خطا در دریافت لیست دامنه‌ها');
            }
            const data = await response.json();
            setDomains(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching domains:', err);
        } finally {
            setDomainsLoading(false);
        }
    };

    const fetchDomainDocuments = async (domain) => {
        setFilesLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_PYTHON_APP_API_URL}/documents?domain_id=${domain.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error('خطا در دریافت فایل‌های دامنه');
            }
            const data = await response.json();
            setDomainFiles(data);
            setSelectedDomain(domain);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching domain files:', err);
        } finally {
            setFilesLoading(false);
        }
    };

    const fetchFileContent = async (file) => {
        setFileContentLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/documents/${file.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('خطا در دریافت محتوای فایل');
            }
            const data = await response.json();
            setFileContent(data);
            setSelectedFile(file);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching file content:', err);
        } finally {
            setFileContentLoading(false);
        }
    };

    const fetchManualDocumentIndex = async () => {
        setDomainsLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_PYTHON_APP_API_URL}/documents/manual?limit=${pagination.limit}&offset=${pagination.offset}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error('خطا در دریافت لیست اسناد');
            }
            const data = await response.json();
            setManualDocumentIndex(data);
            const total = response.headers.get('X-Total-Count');
            if (total) {
                setPagination((prev) => ({ ...prev, total: parseInt(total) }));
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching manual documentindex:', err);
        } finally {
            setDomainsLoading(false);
        }
    };



    const handleBackClick = () => {
        setSelectedDomain(null);
        setDomainFiles([]);
    };

    const handleDocumentClick = (file) => {
        fetchFileContent(file);
    };

    const handleBackToFiles = () => {
        setSelectedFile(null);
        setFileContent(null);
    };

    const handleCrawledDocClick = (doc) => {
        setSelectedFile({
            id: doc.id,
            title: doc.title,
            uri: doc.url,
        });
        const domain = doc.url.split('/')[0];
        setSelectedDomain({ domain });
        fetchFileContent({
            id: doc.id,
            title: doc.title,
            uri: doc.url,
        });
    };

    const handlePageChange = (newOffset) => {
        setPagination((prev) => ({ ...prev, offset: newOffset }));
    };

    return (
        <>
            <style>{globalStyles}</style>
            <div className="flex flex-col h-full p-6 max-w-6xl mx-auto">
                {/* هدر */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        {selectedFile ? (
                            <button
                                onClick={handleBackToFiles}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                بازگشت
                            </button>
                        ) : selectedDomain ? (
                            <button
                                onClick={handleBackClick}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                بازگشت
                            </button>
                        ) : null}
                        {/* Title */}
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            {selectedFile ? 'محتوای سند' : selectedDomain ? `فایل‌های دامنه: ${selectedDomain.domain}` : 'مستندات'}
                        </h2>
                    </div>

                    {/* Action Buttons and Count */}
                    {!selectedFile && (
                        <div className="flex items-center gap-4">
                            {/* Crawl URL Button (only on initial crawled tab view)*/}
                            {/* Add Knowledge Button (only on initial manual tab view) */}
                            {(documentindexTab === 'manual' && !selectedDomain && !selectedFile) && (
                                <button
                                    onClick={() => { setShowAddKnowledge(true); setShowCrawlUrl(false); }}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    افزودن دانش
                                </button>
                            )}
                            {/* Count (only in list views) */}
                        </div>
                    )}
                </div>

                {/* تب‌ها */}


                {/* نمایش خطا */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center mb-6">
                        <p className="text-red-500 dark:text-red-400">{error}</p>
                        <button
                            onClick={documentindexTab === 'crawled' ? fetchDomains : fetchManualDocumentIndex}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                )}

                {/* نمایش لودینگ */}
                {(domainsLoading || filesLoading || fileContentLoading) && (
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                        <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
                    </div>
                )}

                {/* محتوای تب‌ها */}
                <Outlet />
            </div>

            {/* Modals */}
            {(showCrawlUrl || showAddKnowledge) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex justify-center items-center"
                    onClick={() => { setShowCrawlUrl(false); setShowAddKnowledge(false); }}
                >
                    {/* Backdrop */}
                    {showCrawlUrl && (
                        <div
                            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-3xl w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CrawlUrl
                                onClose={() => setShowCrawlUrl(false)}
                                onCrawlComplete={setCrawledDocs}
                                onDocClick={handleCrawledDocClick}
                            />
                        </div>
                    )}

                    {showAddKnowledge && (
                        <div
                            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-3xl w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CreateDocument
                                onClose={() => { setShowAddKnowledge(false); fetchManualDocumentIndex(); }}
                                onDocumentCreated={fetchManualDocumentIndex}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default DocumentIndex;
