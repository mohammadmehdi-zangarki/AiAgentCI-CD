
import { useState } from "react";

const WizardButton = ({ wizard, onWizardClick }) => {
    const [error, setError] = useState(null);

    const handleWizardClick = async (wizardId) => {
        try {
          const response = await fetch(`${process.env.REACT_APP_PYTHON_APP_API_URL}/wizards/${wizardId}?enable_only=true`);
          if (!response.ok) {
            throw new Error('خطا در دریافت محتوای ویزارد');
          }
          const data = await response.json();
          onWizardClick(data);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <button
            key={wizard.id}
            onClick={() => {handleWizardClick(wizard.id)}}
            className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-white dark:hover:bg-blue-800 transition-colors"
        >
            {wizard.title}
        </button>
    )
}

export default WizardButton;