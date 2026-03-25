import QRCode from 'qrcode';

/**
 * Generate a QR code as a data URL (base64 PNG).
 * @param {string} data - The content to encode in the QR code.
 * @returns {Promise<string>} Base64 data URL of the QR image.
 */
export async function generateQR(data) {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a QR code as a Buffer (PNG).
 */
export async function generateQRBuffer(data) {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'M',
    type: 'png',
    width: 300,
    margin: 2,
  });
}
