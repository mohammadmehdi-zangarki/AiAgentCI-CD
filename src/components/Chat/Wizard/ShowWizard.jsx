import React, { useState, useEffect } from 'react';
import CreateWizard from './CreateWizard';
import UpdateWizard from './UpdateWizard';

const ShowWizard = ({ wizard, onWizardSelect }) => {
    const [wizardData, setWizardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateWizard, setShowCreateWizard] = useState(false);
    const [selectedWizardForEdit, setSelectedWizardForEdit] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});

    useEffect(() => {
        const fetchWizardData = async () => {
            if (!wizard?.id) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizard.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch wizard data');
                }
                const data = await response.json();
                setWizardData(data);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching wizard:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWizardData();
    }, [wizard?.id]);

    const handleBackClick = () => {
        if (wizardData?.parent_id) {
            onWizardSelect({ id: wizardData.parent_id });
        } else
            onWizardSelect(null);

    };

    const handleChildClick = (childWizard) => {
        onWizardSelect(childWizard);
    };

    const addNewChild = (child) => {
        let children = wizardData.children || [];
        setWizardData(prev => ({
            ...prev,
            children: [...children, child]
        }));
    };

    const handleWizardUpdated = (updatedWizard) => {
        // Update the wizard in the children array
        const updatedChildren = wizardData.children.map(child => 
            child.id === updatedWizard.id ? updatedWizard : child
        );
        setWizardData(prev => ({
            ...prev,
            children: updatedChildren
        }));
    };

    const handleDeleteWizard = (wizardId) => {
        if (window.confirm('آیا از حذف این ویزارد مطمئن هستید ؟')) {
            fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizardId}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('خطا در حذف ویزارد');
                    }
                    // Remove the deleted wizard from the children array
                    setWizardData(prev => ({
                        ...prev,
                        children: prev.children.filter(child => child.id !== wizardId)
                    }));
                })
                .catch(error => {
                    console.error('Error deleting wizard:', error);
                    alert('خطا در حذف ویزارد');
                });
        }
    };

    const toggleWizardStatus = async (wizardId, currentStatus) => {
        setUpdatingStatus(prev => ({ ...prev, [wizardId]: true }));
        try {
            const endpoint = currentStatus ? 'disable' : 'enable';
            const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizardId}/${endpoint}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('خطا در تغییر وضعیت ویزارد');
            }

            // Update the wizard status in the children array
            setWizardData(prev => ({
                ...prev,
                children: prev.children.map(child => 
                    child.id === wizardId ? { ...child, enabled: !child.enabled } : child
                )
            }));
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [wizardId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                    onClick={() => onWizardSelect(wizard)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    if (!wizardData) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                ویزاردی یافت نشد
            </div>
        );
    }

    return (
        <>
        {
            selectedWizardForEdit ? (
                <UpdateWizard 
                    wizard={selectedWizardForEdit} 
                    onClose={() => setSelectedWizardForEdit(null)}
                    onWizardUpdated={handleWizardUpdated}
                />
            ) : showCreateWizard ? (
                <CreateWizard 
                    onWizardCreated={addNewChild} 
                    onClose={() => setShowCreateWizard(false)} 
                    parent_id={wizard.id}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header with back button */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {wizardData.title}
                        </h2>
                        <div className='flex gap-x-2'>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={() => setShowCreateWizard(true)}
                            >
                                ایجاد ویزارد فرزند جدید
                            </button>
                            <button
                                onClick={handleBackClick}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                بازگشت
                            </button>
                        </div>
                    </div>
        
                    {/* Wizard content */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div
                            className="prose dark:prose-invert max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-700 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300"
                            dangerouslySetInnerHTML={{ __html: wizardData.context }}
                        />
                    </div>
        
                    {/* Children table */}
                    {wizardData.children && wizardData.children.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    زیر ویزاردها
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                عنوان
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                تاریخ ایجاد
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                وضعیت
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                عملیات
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {wizardData.children.map((child) => (
                                            <tr
                                                key={child.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                                    onClick={() => handleChildClick(child)}
                                                >
                                                    {child.title}
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
                                                    onClick={() => handleChildClick(child)}
                                                >
                                                    {new Date(child.created_at).toLocaleString('fa-IR')}
                                                </td>
                                                <td 
                                                    className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer"
                                                    onClick={() => handleChildClick(child)}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleWizardStatus(child.id, child.enabled);
                                                        }}
                                                        disabled={updatingStatus[child.id]}
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${child.enabled
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
                                                            : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {updatingStatus[child.id] ? (
                                                            <div className="flex items-center gap-1">
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                                                <span>در حال تغییر...</span>
                                                            </div>
                                                        ) : child.enabled ? (
                                                            'فعال'
                                                        ) : (
                                                            'غیرفعال'
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedWizardForEdit(child);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteWizard(child.id);
                                                            }}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )
        }
        </>
    );
};

export default ShowWizard;
