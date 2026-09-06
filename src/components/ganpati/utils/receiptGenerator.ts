import { DigitalPavati, VolunteerCollector } from '../types';

/**
 * Generate a guaranteed unique, anti-collision Pavati Number.
 * When a volunteer issues a receipt, it uses their assigned Book Prefix (e.g. V01, V02, HQ01)
 * combined with their sequence counter and checks against all existing receipts to guarantee 0 collisions.
 */
export function generateUniquePavatiNumber(
  existingPavatis: DigitalPavati[],
  collector?: VolunteerCollector | null,
  formatStyle: 'volunteerPrefix' | 'globalSerial' = 'volunteerPrefix',
  customMandalPrefix?: string
): string {
  const currentYear = '2026';
  const mandalPrefix = (customMandalPrefix || 'GMP-2026-').replace(/-+$/, '');
  const prefix = collector?.bookPrefix || 'HQ01';

  if (formatStyle === 'volunteerPrefix') {
    // Find all existing receipts issued with this prefix
    const matchingPrefixPavatis = existingPavatis.filter(
      p => p.receiptNumber.includes(`/${prefix}-`) || p.bookPrefix === prefix
    );

    let nextIndex = (collector?.currentReceiptIndex || matchingPrefixPavatis.length) + 1;
    let candidate = `${mandalPrefix}/${prefix}-${String(nextIndex).padStart(4, '0')}`;

    // Verify candidate is 100% collision-free
    while (existingPavatis.some(p => p.receiptNumber === candidate)) {
      nextIndex++;
      candidate = `${mandalPrefix}/${prefix}-${String(nextIndex).padStart(4, '0')}`;
    }

    return candidate;
  } else {
    // Global sequential numbering with collision check
    let nextIndex = existingPavatis.length + 1;
    let candidate = `${mandalPrefix}-${String(nextIndex).padStart(4, '0')}`;

    while (existingPavatis.some(p => p.receiptNumber === candidate)) {
      nextIndex++;
      candidate = `${mandalPrefix}-${String(nextIndex).padStart(4, '0')}`;
    }

    return candidate;
  }
}

/**
 * Convert numbers to Marathi Words (उदा. 5100 -> "पाच हजार एकशे रुपये फक्त")
 */
export function convertNumberToMarathiWords(amount: number): string {
  if (!amount || isNaN(amount) || amount <= 0) return 'शून्य रुपये फक्त';

  const units = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा', 
                 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
  const tens = ['', 'दहा', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];

  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;
  const lakh = Math.floor(amount / 100000);
  amount %= 100000;
  const thousand = Math.floor(amount / 1000);
  amount %= 1000;
  const hundred = Math.floor(amount / 100);
  const remainder = Math.floor(amount % 100);

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${formatTwoDigits(crore)} कोटी`);
  }
  if (lakh > 0) {
    parts.push(`${formatTwoDigits(lakh)} लाख`);
  }
  if (thousand > 0) {
    parts.push(`${formatTwoDigits(thousand)} हजार`);
  }
  if (hundred > 0) {
    parts.push(`${units[hundred]}शे`);
  }
  if (remainder > 0) {
    parts.push(formatTwoDigits(remainder));
  }

  function formatTwoDigits(num: number): string {
    if (num < 20) return units[num];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (u === 0) return tens[t];
    return `${tens[t]} ${units[u]}`;
  }

  return `${parts.join(' ')} रुपये फक्त`;
}

// Export alias for consistency
export const numberToMarathiWords = convertNumberToMarathiWords;

/**
 * Generates an instant WhatsApp Share URL with rich emoji & verified receipt details
 */
export function getWhatsAppShareText(pavati: DigitalPavati, mandalName: string): string {
  const words = convertNumberToMarathiWords(pavati.amount);
  const text = `🚩 *${mandalName}* 🚩
॥ श्री गणेशाय नमः ॥

*डिजिटल देणगी पावती (Digital Receipt)*
━━━━━━━━━━━━━━━━━━━━
📄 *पावती क्र:* ${pavati.receiptNumber}
👤 *देणगीदार:* ${pavati.donorName}
📱 *मोबाईल:* ${pavati.phone}
💰 *रक्कम:* ₹${pavati.amount.toLocaleString('en-IN')}
✍️ *अक्षरी:* ${words}
🏷️ *वर्गवारी:* ${pavati.category}
💳 *भरणा पद्धत:* ${pavati.paymentMode.toUpperCase()} ${pavati.transactionRef ? `(Ref: ${pavati.transactionRef})` : ''}
📅 *दिनांक व वेळ:* ${pavati.date} | ${pavati.time}
🤝 *पावती देणारा/संकलक:* ${pavati.receivedBy || pavati.collectorName || 'मंडळ प्रतिनिधी'}
${pavati.bookNumber ? `📖 *पावती बुक:* ${pavati.bookNumber}` : ''}
━━━━━━━━━━━━━━━━━━━━
✨ *॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥*
मंडळाच्या उत्सव व सामाजिक कार्यास सहकार्य केल्याबद्दल आपले मनःपूर्वक आभार!`;

  return encodeURIComponent(text);
}

/**
 * Generate unique Device ID for multi-device sync
 */
export function getOrCreateDeviceId(): string {
  const key = 'ganpati_mandal_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = `DEV-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}
