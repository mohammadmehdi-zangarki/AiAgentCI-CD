import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const UpdateWizard = ({ wizard, onClose, onWizardUpdated }) => {
    const [title, setTitle] = useState('');
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (wizard) {
            setTitle(wizard.title || '');
            setContext(wizard.context || '');
        }
    }, [wizard]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('لطفا تمام فیلدها را پر کنید');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizard.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    context,
                    parent_id: wizard.parent_id
                })
            });

            if (!response.ok) {
                throw new Error('خطا در بروزرسانی ویزارد');
            }

            const updatedWizard = await response.json();
            if (onWizardUpdated) {
                onWizardUpdated(updatedWizard);
            }
            onClose();
        } catch (err) {
            setError(err.message);
            console.error('Error updating wizard:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 pb-12">
            <div className='flex justify-between items-center mb-6'>
                <div className='flex items-center gap-4'>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش ویزارد</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        عنوان ویزارد
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="context" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        متن ویزارد
                    </label>
                    <div className="h-[calc(100%-8rem)]">
                        <CKEditor
                            editor={ClassicEditor}
                            data={context}
                            onChange={(event, editor) => {
                                const data = editor.getData();
                                setContext(data);
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

                {error && (
                    <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        انصراف
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                در حال بروزرسانی...
                            </>
                        ) : (
                            'بروزرسانی ویزارد'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateWizard;