import React, { useState } from 'react';
import { toast } from 'react-toastify';

const NodeDetails = ({ node, onUpdate, onClose, onDelete, saveWorkflow, nodes }) => {
  const [details, setDetails] = useState({
    label: node.data.label || '',
    description: node.data.description || '',
    connections: node.data.connections || [],
    conditions: node.data.conditions?.filter((c) => c && c.trim() !== '') || [],
    value: node.data.value || '', // اضافه کردن فیلد value
    text: node.data.text || '',   // اضافه کردن فیلد text
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updatedData = {
        ...details,
        conditions: details.conditions.filter((c) => c && c.trim() !== ''),
      };
      console.log('Sending updated data:', updatedData);

      onUpdate(node.id, updatedData);

      const updatedNodes = nodes.map((n) =>
          n.id === node.id
              ? {
                ...n,
                data: {
                  ...n.data,
                  ...updatedData,
                  conditions: updatedData.conditions,
                },
              }
              : n
      );

      console.log('Updated nodes before saving:', updatedNodes);

      await saveWorkflow(updatedNodes);
      toast.success('تغییرات با موفقیت ذخیره شد');
      onClose();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('خطا در ذخیره تغییرات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    onDelete(node.id);
    onClose();
  };

  const addCondition = () => {
    setDetails((prev) => ({
      ...prev,
      conditions: [...prev.conditions, `شرط ${prev.conditions.length + 1}`],
    }));
  };

  const removeCondition = (index) => {
    setDetails((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index, value) => {
    setDetails((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
          i === index ? value : condition
      ),
    }));
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            ویرایش{' '}
            {node.type === 'start'
                ? 'شروع'
                : node.type === 'process'
                    ? 'فرآیند'
                    : node.type === 'decision'
                        ? 'تصمیم'
                        : node.type === 'function'
                            ? 'تابع'
                            : node.type === 'response'
                                ? 'پاسخ'
                                : node.type === 'glassButton'
                                    ? 'دکمه شیشه‌ای'
                                    : 'پایان'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                عنوان
              </label>
              <input
                  type="text"
                  value={details.label}
                  onChange={(e) => setDetails((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                  value={details.description}
                  onChange={(e) =>
                      setDetails((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  disabled={isSaving}
              />
            </div>

            {node.type === 'glassButton' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      مقدار (Value)
                    </label>
                    <input
                        type="text"
                        value={details.value}
                        onChange={(e) => setDetails((prev) => ({ ...prev, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="مقدار دکمه"
                        disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      متن (Text)
                    </label>
                    <input
                        type="text"
                        value={details.text}
                        onChange={(e) => setDetails((prev) => ({ ...prev, text: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="متن دکمه"
                        disabled={isSaving}
                    />
                  </div>
                </>
            )}

            {node.type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    شرایط
                  </label>
                  <div className="space-y-2">
                    {details.conditions.map((condition, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                              type="text"
                              value={condition}
                              onChange={(e) => updateCondition(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="شرط تصمیم"
                              disabled={isSaving}
                          />
                          <button
                              type="button"
                              onClick={() => removeCondition(index)}
                              className="px-3 py-2 text-red-600 hover:text-red-700"
                              disabled={isSaving}
                          >
                            حذف
                          </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addCondition}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                        disabled={isSaving}
                    >
                      + افزودن شرط
                    </button>
                  </div>
                </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  disabled={isSaving}
              >
                حذف
              </button>
              <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  disabled={isSaving}
              >
                انصراف
              </button>
              <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={isSaving}
              >
                {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </form>
        </div>

        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  تایید حذف
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  آیا از حذف این{' '}
                  {node.type === 'start'
                      ? 'شروع'
                      : node.type === 'process'
                          ? 'فرآیند'
                          : node.type === 'decision'
                              ? 'تصمیم'
                              : node.type === 'function'
                                  ? 'تابع'
                                  : node.type === 'response'
                                      ? 'پاسخ'
                                      : node.type === 'glassButton'
                                          ? 'دکمه شیشه‌ای'
                                          : 'پایان'}{' '}
                  اطمینان دارید؟
                </p>
                <div className="flex justify-end gap-2">
                  <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                  <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default NodeDetails;