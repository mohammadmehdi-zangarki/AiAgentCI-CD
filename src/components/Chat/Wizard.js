import React, { useState } from 'react';
import CreateWizard from './Wizard/CreateWizard';
import WizardIndex from './Wizard/WizardIndex';

const Wizard = () => {
    const [showCreateWizard, setShowCreateWizard] = useState(false);
    const [selectedWebsiteData, setSelectedWebsiteData] = useState(null);

    return (
        <div className="space-y-4 p-12"> {/* اضافه کردن p-6 برای padding */}
            <WizardIndex />
            {showCreateWizard && (
                <CreateWizard
                    onClose={() => {
                        setShowCreateWizard(false);
                        setSelectedWebsiteData(null);
                    }}
                    websiteData={selectedWebsiteData}
                />
            )}
        </div>
    );
};

export default Wizard;