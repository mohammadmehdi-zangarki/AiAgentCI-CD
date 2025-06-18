import React, { useState, useEffect } from 'react';
import CreateWizard from './CreateWizard';
import ShowWizard from './ShowWizard';
import WizardCard from './WizardCard';
import UpdateWizard from './UpdateWizard';

const WizardIndex = () => {
  const [wizards, setWizards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedWizard, setSelectedWizard] = useState(null);
  const [selectedWizardForUpdate, setSelectedWizardForEdit] = useState(null)

  useEffect(() => {
    fetchWizards();
  }, []);

  const fetchWizards = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/`);
      if (!response.ok) {
        throw new Error('خطا در دریافت لیست ویزاردها');
      }
      const data = await response.json();
      setWizards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWizardCreated = (newWizard) => {
    setWizards(prevWizards => [newWizard, ...prevWizards]);
  };

  const handleWizardDeleted = (wizardId) => {
    setWizards(prevWizards => prevWizards.filter(w => w.id !== wizardId));
  };

  const handleWizardClick = (wizard) => {
    setSelectedWizard(wizard);
  };

  const freshWizard = (wizard) => {
    setWizards(prevWizards => 
      prevWizards.map(w => w.id === wizard.id ? wizard : w)
    );
  }

  if (selectedWizard) {
    return (
        <ShowWizard
            wizard={selectedWizard}
            onWizardSelect={setSelectedWizard}
        />
    );
}

  return (
    <>
    {
      selectedWizardForUpdate ?
      <UpdateWizard wizard={selectedWizardForUpdate} onClose={() => {setSelectedWizardForEdit(null)}} onWizardUpdated={freshWizard}/> :
      (
        <div className="space-y-6">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" >پاسخ‌های ویزارد</h2>
          <button
            onClick={() => {setShowCreateWizard(true)}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ایجاد ویزارد جدید
          </button>
        </div>
  
        {showCreateWizard ?
          <CreateWizard onClose={() => {setShowCreateWizard(false)}} onWizardCreated={handleWizardCreated}/> :
          loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <button
                onClick={fetchWizards}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                تلاش مجدد
              </button>
            </div>
          ) : wizards.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                هیچ ویزاردی یافت نشد
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                برای ایجاد ویزارد جدید، روی دکمه "ایجاد ویزارد جدید" کلیک کنید
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 xxl:grid-cols-4 gap-4">
              {wizards.map((wizard) => (
                <WizardCard key={wizard.id} wizard={wizard} onClickWizard={handleWizardClick} onDeleteWizard={handleWizardDeleted} selectedWizardForUpdate={setSelectedWizardForEdit}/>
              ))}
            </div>
          )
        }
  
      </div>
      )
    }
    </>

   
  );
};

export default WizardIndex; 