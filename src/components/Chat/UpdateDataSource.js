import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const UpdateDataSource = (props) => {
    const { document_id, previousTab, onBack } = props;
    const [documentData, setDocumentData] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchDocument();
    }, [document_id]);

    const fetchDocument = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/document/vector/${document_id}`);
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات سند');
            }
            const data = await response.json();
            setDocumentData(data);
            setEditedContent(data.html || '');
        } catch (err) {
            setError(err.message);
            console.error('Error fetching document:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editedContent.trim()) {
            setError('لطفا محتوای سند را وارد کنید');
            return;
        }

        setUpdating(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/document/${documentData.id}?update_vector=true`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: documentData.title,
                    html: editedContent,
                    markdown: documentData.markdown,
                    uri: documentData.uri,
                    domain_id: documentData.domain_id
                })
            });

            if (!response.ok) {
                throw new Error('خطا در بروزرسانی سند');
            }

            alert('سند با موفقیت بروزرسانی شد');
        } catch (err) {
            setError(err.message);
            console.error('Error updating document:', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-4">
                <div className="text-red-500 mb-2">{error}</div>
                <button
                    onClick={fetchDocument}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        بازگشت
                    </button>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ویرایش منبع داده</h2>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        عنوان سند
                    </label>
                    <input
                        type="text"
                        value={documentData?.title || ''}
                        onChange={(e) => setDocumentData({ ...documentData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        محتوای سند
                    </label>
                    <div className="flex-1 min-h-0 overflow-auto">
                        <CKEditor
                            editor={ClassicEditor}
                            data={editedContent}
                            onChange={(event, editor) => {
                                const data = editor.getData();
                                setEditedContent(data);
                            }}
                            config={{
                                language: 'fa',
                                direction: 'rtl',
                                toolbar: {
                                    items: [
                                        'heading',
                                        '|',
                                        'bold',
                                        'italic',
                                        'link',
                                        'bulletedList',
                                        'numberedList',
                                        '|',
                                        'outdent',
                                        'indent',
                                        '|',
                                        'insertTable',
                                        'undo',
                                        'redo'
                                    ]
                                },
                                table: {
                                    contentToolbar: [
                                        'tableColumn',
                                        'tableRow',
                                        'mergeTableCells',
                                        'tableProperties',
                                        'tableCellProperties'
                                    ],
                                    defaultProperties: {
                                        borderWidth: '1px',
                                        borderColor: '#ccc',
                                        borderStyle: 'solid',
                                        alignment: 'right'
                                    }
                                },
                                htmlSupport: {
                                    allow: [
                                        {
                                            name: 'table',
                                            attributes: true,
                                            classes: true,
                                            styles: true
                                        },
                                        {
                                            name: 'tr',
                                            attributes: true,
                                            classes: true,
                                            styles: true
                                        },
                                        {
                                            name: 'td',
                                            attributes: true,
                                            classes: true,
                                            styles: true
                                        },
                                        {
                                            name: 'th',
                                            attributes: true,
                                            classes: true,
                                            styles: true
                                        }
                                    ]
                                }
                            }}
                            style={{ direction: 'rtl', textAlign: 'right' }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-2">
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                    {updating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            در حال بروزرسانی...
                        </>
                    ) : (
                        'بروزرسانی سند'
                    )}
                </button>
            </div>
        </div>
    );
};

export default UpdateDataSource;