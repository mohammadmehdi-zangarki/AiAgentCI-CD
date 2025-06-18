import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkflowEditor from "./editor/WorkflowEditor"
import { workflowEndpoints } from "../../utils/apis";

const WorkflowIndex = () => {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                setLoading(true);
                const workflows = await workflowEndpoints.listWorkflows();
                setWorkflows(workflows);
                setError(null);
            } catch (e) {
                console.error(e);
                setError('خطا در دریافت لیست گردش کارها');
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflows();
    }, []);

    const handleCreateNew = () => {
        navigate('/workflow/create');
    };

    const handleEdit = (workflowId) => {
        navigate(`/workflow/${workflowId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">گردش کارها</h1>
                <button
                    onClick={handleCreateNew}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                    ایجاد گردش کار جدید
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                نام
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                وضعیت
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                عملیات
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {workflows.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    هیچ گردش کاری یافت نشد
                                </td>
                            </tr>
                        ) : (
                            workflows.map((workflow) => (
                                <tr key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {workflow.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            فعال
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <button
                                            onClick={() => handleEdit(workflow.id)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            ویرایش
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorkflowIndex;