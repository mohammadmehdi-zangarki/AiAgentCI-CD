import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const CreateDocument = ({ onClose }) => {
    const [manualSubmitting, setManualSubmitting] = useState(false);
    const [manualTitle, setManualTitle] = useState('');
    const [manualText, setManualText] = useState('');
    const [error, setError] = useState(null);

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualTitle.trim() || !manualText.trim()) {
            setError('لطفا عنوان و متن را وارد کنید');
            return;
        }

        setManualSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/add_manually_knowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: manualText,
                    metadata: {
                        source: 'manual',
                        title: manualTitle
                    }
                })
            });

            if (!response.ok) {
                throw new Error('خطا در ذخیره اطلاعات');
            }

            const data = await response.json();
            if (data.status === 'success') {
                alert('اطلاعات با موفقیت ذخیره شد');
                setManualTitle('');
                setManualText('');
                if (onClose) onClose();
            } else {
                throw new Error('خطا در ذخیره اطلاعات');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error storing manual knowledge:', err);
        } finally {
            setManualSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleManualSubmit(e);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow w-full max-w-3xl mx-auto h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 flex-shrink-0">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">ایجاد سند جدید</h2>
                </div>
                <form className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            عنوان
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base"
                            placeholder="عنوان سند را وارد کنید"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            متن
                        </label>
                        <div className="min-h-[200px] max-h-[calc(90vh-200px)] overflow-y-auto">
                            <CKEditor
                                editor={ClassicEditor}
                                data={manualText}
                                onChange={(event, editor) => {
                                    const data = editor.getData();
                                    setManualText(data);
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
                                            { name: 'table', attributes: true, classes: true, styles: true },
                                            { name: 'tr', attributes: true, classes: true, styles: true },
                                            { name: 'td', attributes: true, classes: true, styles: true },
                                            { name: 'th', attributes: true, classes: true, styles: true }
                                        ]
                                    }
                                }}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}
                </form>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
                <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={manualSubmitting}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center"
                >
                    {manualSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            در حال ذخیره...
                        </>
                    ) : (
                        'ذخیره سند'
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateDocument;