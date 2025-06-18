import React, { useState, useEffect } from 'react';
import { ShowWizard, UpdateWizard } from './index';

const WizardCard = ({ wizard, onClickWizard, onDeleteWizard, selectedWizardForUpdate }) => {
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState({});
    const [showUpdateWizard, setShowUpdateWizard] = useState(false)

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

            wizard.enabled = !wizard.enabled
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [wizardId]: false }));
        }
    };

    const submitDelete = () => {
        if (window.confirm('آیا از حذف این ویزارد مطمئن هستید ؟')) {
            fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizard.id}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('خطا در حذف ویزارد');
                    }
                    onDeleteWizard(wizard.id);
                })
                .catch(error => {
                    console.error('Error deleting wizard:', error);
                    alert('خطا در حذف ویزارد');
                });
        }
    }


    return (
        <>
            <div
                onClick={() => onClickWizard(wizard)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {wizard.title}
                        </h3>
                        <div className='flex gap-1'>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWizardStatus(wizard.id, wizard.enabled);
                                }}
                                disabled={updatingStatus[wizard.id]}
                                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${wizard.enabled
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {updatingStatus[wizard.id] ? (
                                    <div className="flex items-center gap-1">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                        <span>در حال تغییر...</span>
                                    </div>
                                ) : wizard.enabled ? (
                                    'فعال'
                                ) : (
                                    'غیرفعال'
                                )}
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    selectedWizardForUpdate(wizard)
                                }}
                                disabled={updatingStatus[wizard.id]}
                                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors bg-blue-200`}
                            >
                                ویرایش
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    submitDelete();
                                }}
                                disabled={updatingStatus[wizard.id]}
                                className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors bg-red-200`}
                            >
                                حذف
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                        <span>شناسه: {wizard.id}</span>
                        <span>
                            {new Date(wizard.created_at).toLocaleString('fa-IR')}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}

export default WizardCard;