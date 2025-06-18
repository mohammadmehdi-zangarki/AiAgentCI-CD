import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import {
    PlayIcon,
    PlusCircleIcon,
    CogIcon,
    QuestionMarkCircleIcon,
    XCircleIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const WorkflowEditorSidebar = ({
                                   workflowName,
                                   setWorkflowName,
                                   workflowId,
                                   saveWorkflow,
                                   addNode,
                                   setShowChatModal,
                               }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(true);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const buttonStyles =
        'flex items-center gap-2 w-full px-3 py-1.5 text-sm font-medium text-white rounded-md transition-all duration-200 hover:scale-102 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900';

    return (
        <div className="absolute left-6 top-6 z-10 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300">
            <style>
                {`
          :root {
            --primary-bg: #F9FAFB;
            --primary-text: #1F2937;
            --accent-green: #34D399;
            --accent-blue: #4B5EAA;
            --accent-yellow: #F59E0B;
            --accent-purple: #A78BFA;
            --accent-orange: #F97316;
            --accent-red: #EF4444;
            --accent-teal: #14B8A6;
            --accent-pink: #EC4899; /* رنگ جدید برای دکمه شیشه‌ای */
          }
          .dark {
            --primary-bg: #1F2937;
            --primary-text: #F9FAFB;
          }
        `}
            </style>
            <button
                onClick={toggleMenu}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
                <span className="text-sm font-semibold">منوی گردش کار</span>
                <FontAwesomeIcon
                    icon={isMenuOpen ? faChevronUp : faChevronDown}
                    className="h-4 w-4 text-gray-500 dark:text-gray-400"
                />
            </button>
            <div
                className={`flex flex-col gap-1.5 p-2 transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'max-h-[calc(100vh-110px)] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
            >
                <div className="p-1.5">
                    <label
                        htmlFor="workflow-name"
                        className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                    >
                        نام گردش کار
                    </label>
                    <input
                        type="text"
                        id="workflow-name"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="نام گردش کار را وارد کنید"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    />
                </div>
                <hr className="border-gray-200 dark:border-gray-700 my-1" />
                <button
                    onClick={() => saveWorkflow()}
                    className={`${buttonStyles} bg-[var(--accent-green)] hover:bg-green-500 focus:ring-green-400`}
                >
                    <CheckIcon className="h-4 w-4" />
                    ذخیره
                </button>
                <button
                    onClick={() => addNode('start')}
                    className={`${buttonStyles} bg-[var(--accent-blue)] hover:bg-blue-600 focus:ring-blue-400`}
                >
                    <PlusCircleIcon className="h-4 w-4" />
                    شروع
                </button>
                <button
                    onClick={() => addNode('process')}
                    className={`${buttonStyles} bg-[var(--accent-blue)] hover:bg-blue-600 focus:ring-blue-400`}
                >
                    <CogIcon className="h-4 w-4" />
                    فرآیند
                </button>
                <button
                    onClick={() => addNode('decision')}
                    className={`${buttonStyles} bg-[var(--accent-yellow)] hover:bg-yellow-600 focus:ring-yellow-400`}
                >
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    تصمیم
                </button>
                <button
                    onClick={() => addNode('function')}
                    className={`${buttonStyles} bg-[var(--accent-purple)] hover:bg-purple-600 focus:ring-purple-400`}
                >
                    <CogIcon className="h-4 w-4" />
                    تابع
                </button>
                <button
                    onClick={() => addNode('response')}
                    className={`${buttonStyles} bg-[var(--accent-orange)] hover:bg-orange-600 focus:ring-orange-400`}
                >
                    <QuestionMarkCircleIcon className="h-4 w-4" />
                    پاسخ
                </button>
                <button
                    onClick={() => addNode('glassButton')}
                    className={`${buttonStyles} bg-[var(--accent-pink)] hover:bg-pink-600 focus:ring-pink-400`}
                >
                    <PlusCircleIcon className="h-4 w-4" />
                    دکمه شیشه‌ای
                </button>
                <button
                    onClick={() => addNode('end')}
                    className={`${buttonStyles} bg-[var(--accent-red)] hover:bg-red-600 focus:ring-red-400`}
                >
                    <XCircleIcon className="h-4 w-4" />
                    پایان
                </button>
                <hr className="border-gray-200 dark:border-gray-700 my-1" />
                <button
                    onClick={() => setShowChatModal(true)}
                    className={`${buttonStyles} bg-[var(--accent-teal)] hover:bg-teal-600 focus:ring-teal-400 border border-teal-400`}
                >
                    <PlayIcon className="h-4 w-4" />
                    اجرا
                </button>
            </div>
        </div>
    );
};

export default WorkflowEditorSidebar;