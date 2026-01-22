import QRCode from 'qrcode';

/**
 * Generate QR code for submission data
 * @param submissionId - The submission ID to encode
 * @param baseUrl - Base URL of the application
 * @returns Promise<string> - Data URL of the QR code
 */
export const generateSubmissionQR = async (submissionId: string, baseUrl: string): Promise<string> => {
    try {
        // Create a URL that can be used to view the submission
        const submissionUrl = `${baseUrl}/view-submission/${submissionId}`;
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(submissionUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });
        
        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Generate QR code with submission ID only (for offline scanning)
 * @param submissionId - The submission ID to encode
 * @returns Promise<string> - Data URL of the QR code
 */
export const generateSubmissionIdQR = async (submissionId: string): Promise<string> => {
    try {
        // Generate QR code with just the submission ID
        const qrDataUrl = await QRCode.toDataURL(submissionId, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });
        
        return qrDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
};
