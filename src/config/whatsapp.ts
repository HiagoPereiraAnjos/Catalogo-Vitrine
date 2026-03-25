export const WHATSAPP_CONFIG = {
  baseUrl: 'https://wa.me',
  phoneNumber: '5511999999999',
  displayNumber: '(11) 99999-9999'
} as const;

export const getWhatsAppBaseLink = () => `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.phoneNumber}`;

export const buildWaMeLink = (message: string, baseLink = getWhatsAppBaseLink()) =>
  `${baseLink}?text=${encodeURIComponent(message)}`;

