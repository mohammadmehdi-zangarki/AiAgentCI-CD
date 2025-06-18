// DocumentIndex.js
import DocumentCard from './DocumentCard';
import CreateDocument from './CreateDocument';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {Link, useLocation, useParams} from 'react-router-dom';
import {getDocuments, getDomainDocuments} from '../../../services/api';

const DocumentIndex = () => {
    const [documentContentLoading, setDocumentContentLoading] = useState(false);
    const [error, setError] = useState(null);
    const [documentContent, setDocumentContent] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [showAddKnowledge, setShowAddKnowledge] = useState(false);
    const location = useLocation();
    const {domain_id} = useParams()

    const pageSizeOptions = [20, 50, 100];
    const minPageSize = Math.min(...pageSizeOptions);

    const fetchDocuments = async () => {
        try {
            const isManual = location.pathname.endsWith('/manuals');
            const response = isManual ? await getDocuments(isManual, currentPage, pageSize) : await getDomainDocuments(domain_id, currentPage, pageSize);
            console.log('Get Documents Response:', response.data.items); // لاگ برای دیباگ
            if (response && response.data) {
                setDocuments(response.data.items);
                setTotalPages(response.data.pages);
                setTotalItems(response.data.total);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching documents:', err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [location.pathname, currentPage, pageSize]);

    const handleDocumentCardClick = (document) => {
        fetchDocument(document);
    };

    const fetchDocument = async (document) => {
        setDocumentContentLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/documents/${document.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error('خطا در دریافت محتوای فایل');
            }
            const data = await response.json();
            setDocumentContent(data);
            setSelectedDocument(document);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching document content:', err);
        } finally {
            setDocumentContentLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (event) => {
        const newSize = parseInt(event.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handleAddKnowledge = () => {
        setShowAddKnowledge(true);
    };

    const handleCloseAddKnowledge = () => {
        setShowAddKnowledge(false);
        fetchDocuments();
    };

    const handleStatusChange = async (documentId, newVectorId) => {
        try {
            // به‌روزرسانی موقت در کلاینت
            setDocuments((prevDocuments) =>
                prevDocuments.map((doc) =>
                    doc.id === documentId ? { ...doc, vector_id: newVectorId } : doc
                )
            );
            // رفرش لیست از سرور
            await fetchDocuments();
        } catch (err) {
            console.error('Error refreshing documents:', err);
            setError(err.message || 'Failed to refresh documents');
        }
    };

    const shouldShowPagination = totalItems > minPageSize;

    return (
        <>
            <div className="flex justify-between mb-3">
                {location.pathname.includes('/domain/') && (
                    <Link
                        to="/document/domains"
                        className="px-6 py-3 rounded-lg font-medium transition-all bg-gray-300"
                    >
                        بازگشت
                    </Link>
                )}
                {location.pathname.endsWith('/manuals') && (
                    <button
                        onClick={handleAddKnowledge}
                        className="px-6 py-3 rounded-lg font-medium transition-all bg-green-500 text-white hover:bg-green-600"
                    >
                        افزودن دانش
                    </button>
                )}
            </div>

            {documentContentLoading ? (
                <div className="text-center">Loading document content...</div>
            ) : error ? (
                <div className="text-red-500 text-center">Error: {error}</div>
            ) : documents.length === 0 ? (
                <div className="text-center">No documents found.</div>
            ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                    {documents.map((document) => (
                        <DocumentCard
                            key={document.id}
                            document={document}
                            onStatusChange={handleStatusChange}
                            onClick={() => handleDocumentCardClick(document)}
                        />
                    ))}
                </div>
            )}

            {shouldShowPagination && (
                <div className="flex flex-col sm:flex-row justify-center items-center mt-6 gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="pageSize" className="text-sm text-gray-600">
                            تعداد در هر صفحه:
                        </label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg ${
                                currentPage === 1
                                    ? 'bg-gray-200 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            قبلی
                        </button>
                        <span className="mx-4">
                            صفحه {currentPage} از {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg ${
                                currentPage === totalPages
                                    ? 'bg-gray-200 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            بعدی
                        </button>
                    </div>
                </div>
            )}

            {showAddKnowledge && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex justify-center items-center"
                    onClick={handleCloseAddKnowledge}
                >
                    <div
                        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-3xl w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CreateDocument onClose={handleCloseAddKnowledge} />
                    </div>
                </div>
            )}
        </>
    );
};

DocumentIndex.propTypes = {
    documents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        })
    ),
};

export default DocumentIndex;