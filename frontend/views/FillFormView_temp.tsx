// This is a temporary file to show the needed change
// Line 64-65 needs to be updated from:

if (selectedIndicator?.measurementType === 'percentage' &&
    !['74', '83', '87', '88', '101', '132', '69', '99', '67', '89'].includes(indicatorId)) {
    setShowPercentageOnlyInput(false); // Force 3-box system for non-construction percentage indicators
    }\
// To:

if (selectedIndicator?.measurementType === 'percentage' &&
    !['74', '83', '87', '88', '101', '132', '69', '99', '67', '89', '43'].includes(indicatorId)) {
    setShowPercentageOnlyInput(false); // Force 3-box system for non-construction percentage indicators
    }
