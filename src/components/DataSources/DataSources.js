import React, { useState, useEffect } from 'react';
import { getDataSources } from '../../services/api';

const DataSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDataSources();
        setSources(data.sources);
        setLoading(false);
      } catch (err) {
        setError('خطا در دریافت منابع داده');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">منابع داده</h2>
      
      <div className="grid gap-6">
        {sources.map((source, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {source.url}
                  </a>
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>وارد شده توسط: {source.imported_by}</p>
                  <p>تاریخ وارد کردن: {new Date(source.import_date).toLocaleString('fa-IR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  source.status === '✓' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {source.status}
                </span>
                <span className="text-sm text-gray-500">
                  آخرین بروزرسانی: {source.refresh_status}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">بخش‌های متن:</h4>
              <div className="space-y-4">
                {source.chunks.map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{chunk.text}</p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>عنوان: {chunk.metadata.title}</p>
                      <p>شماره بخش: {chunk.metadata.chunk_index}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataSources; 