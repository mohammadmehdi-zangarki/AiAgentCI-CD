import React from 'react';
import WizardButton from './WizardButton';

const WizardButtons = ({ wizards, onWizardSelect }) => {
    if (!wizards || wizards.length === 0) {
        return (
            <div className="text-gray-500 text-sm text-center p-4">
                هیچ ویزارد فعالی یافت نشد
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2 py-4">
            {wizards.map((wizard) => (
                <WizardButton key={wizard.id} wizard={wizard} onWizardClick={onWizardSelect} />
            ))}
        </div>
    );
};

export default WizardButtons;