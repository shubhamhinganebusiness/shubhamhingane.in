import { 
  DigitalPavati, 
  ExpenseEntry, 
  VolunteerCollector, 
  DayWiseCollection, 
  DailySummaryReport, 
  NightlyVerificationRecord, 
  DenominationBreakdown,
  MandalProfile 
} from '../types';
import { numberToMarathiWords } from './receiptGenerator';

/**
 * Calculate total value from currency note denominations
 */
export function calculateDenominationTotal(denominations: DenominationBreakdown): number {
  return (
    (denominations.note2000 || 0) * 2000 +
    (denominations.note500 || 0) * 500 +
    (denominations.note200 || 0) * 200 +
    (denominations.note100 || 0) * 100 +
    (denominations.note50 || 0) * 50 +
    (denominations.note20 || 0) * 20 +
    (denominations.note10 || 0) * 10 +
    (denominations.coins || 0)
  );
}

/**
 * Automatically aggregate and generate a complete Daily Summary Report for a specific date
 */
export function buildDailySummaryReport(
  targetDate: string,
  pavatis: DigitalPavati[],
  expenses: ExpenseEntry[],
  volunteers: VolunteerCollector[],
  dayWiseCollections: DayWiseCollection[],
  verifications: NightlyVerificationRecord[]
): DailySummaryReport {
  // Filter pavatis and expenses matching the target date
  const dayPavatis = pavatis.filter(p => p.date === targetDate);
  const activePavatis = dayPavatis.filter(p => !p.isCancelled && p.status !== 'Cancelled');
  const cancelledPavatis = dayPavatis.filter(p => p.isCancelled || p.status === 'Cancelled');

  const dayExpenses = expenses.filter(e => e.date === targetDate);

  // Match festival day info if available
  const matchedDay = dayWiseCollections.find(d => d.date === targetDate);
  const dayNumber = matchedDay ? matchedDay.dayNumber : 1;
  const festivalDayNameMr = matchedDay ? matchedDay.festivalDayNameMr : `दिनांक ${targetDate} दैनिक संकलन`;
  const festivalDayNameEn = matchedDay ? matchedDay.festivalDayNameEn : `Daily Collection - ${targetDate}`;

  // Mode matcher helper
  const isMode = (mode: string, targets: string[]) => 
    targets.some(t => mode?.toLowerCase() === t.toLowerCase());

  // Income calculations
  const totalIncome = activePavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const incomeCash = activePavatis.filter(p => isMode(p.paymentMode, ['cash'])).reduce((sum, p) => sum + p.amount, 0);
  const incomeUpi = activePavatis.filter(p => isMode(p.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, p) => sum + p.amount, 0);
  const incomeBank = activePavatis.filter(p => isMode(p.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, p) => sum + p.amount, 0);
  const incomeCheque = activePavatis.filter(p => isMode(p.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, p) => sum + p.amount, 0);

  // Expense calculations
  const totalExpenses = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const expenseCash = dayExpenses.filter(e => isMode(e.paymentMode, ['cash'])).reduce((sum, e) => sum + e.amount, 0);
  const expenseUpi = dayExpenses.filter(e => isMode(e.paymentMode, ['upi', 'gpay', 'phonepe', 'paytm', 'online', 'qr'])).reduce((sum, e) => sum + e.amount, 0);
  const expenseBank = dayExpenses.filter(e => isMode(e.paymentMode, ['bank transfer', 'neft', 'rtgs', 'netbanking', 'imps', 'bank'])).reduce((sum, e) => sum + e.amount, 0);
  const expenseCheque = dayExpenses.filter(e => isMode(e.paymentMode, ['cheque', 'check', 'dd'])).reduce((sum, e) => sum + e.amount, 0);

  const netDailySurplus = totalIncome - totalExpenses;

  // Receipt series range
  const sortedReceiptNumbers = activePavatis.map(p => p.receiptNumber).filter(Boolean).sort();
  const firstReceiptNumber = sortedReceiptNumbers[0] || '---';
  const lastReceiptNumber = sortedReceiptNumbers[sortedReceiptNumbers.length - 1] || '---';

  const cancelledAmount = cancelledPavatis.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Category breakdown
  const categoryMap: { [key: string]: { amount: number; count: number } } = {};
  activePavatis.forEach(p => {
    const cat = p.category || 'इतर देणगी';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amount: 0, count: 0 };
    }
    categoryMap[cat].amount += p.amount;
    categoryMap[cat].count += 1;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count,
    percentage: totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0
  })).sort((a, b) => b.amount - a.amount);

  // Volunteer Collector breakdown for this date
  const collectorBreakdown = volunteers.map(vol => {
    const volPavatis = activePavatis.filter(p => 
      p.collectorId === vol.id || 
      (p.bookPrefix && p.bookPrefix === vol.bookPrefix) ||
      p.receivedBy?.toLowerCase().includes(vol.name.toLowerCase())
    );

    const volCash = volPavatis.filter(p => isMode(p.paymentMode, ['cash'])).reduce((sum, p) => sum + p.amount, 0);
    const volUpi = volPavatis.filter(p => !isMode(p.paymentMode, ['cash'])).reduce((sum, p) => sum + p.amount, 0);
    const volTotal = volCash + volUpi;

    return {
      collectorId: vol.id,
      collectorName: vol.name,
      bookPrefix: vol.bookPrefix,
      receiptsCount: volPavatis.length,
      cashAmount: volCash,
      upiAmount: volUpi,
      totalAmount: volTotal,
      cashHandedOver: vol.cashHandedOver,
      cashInHand: vol.cashInHand
    };
  }).filter(c => c.receiptsCount > 0 || c.totalAmount > 0 || c.cashInHand > 0);

  // Verification Record for this day
  const existingVerification = verifications.find(v => v.date === targetDate);

  return {
    id: `summary-${targetDate}`,
    date: targetDate,
    dayNumber,
    festivalDayNameMr,
    festivalDayNameEn,
    totalIncome,
    totalExpenses,
    netDailySurplus,
    incomeByMode: {
      cash: incomeCash,
      upi: incomeUpi,
      bank: incomeBank,
      cheque: incomeCheque
    },
    expensesByMode: {
      cash: expenseCash,
      upi: expenseUpi,
      bank: expenseBank,
      cheque: expenseCheque
    },
    receiptsCount: activePavatis.length,
    expensesCount: dayExpenses.length,
    firstReceiptNumber,
    lastReceiptNumber,
    cancelledReceiptsCount: cancelledPavatis.length,
    cancelledAmount,
    collectorBreakdown,
    categoryBreakdown,
    verification: existingVerification
  };
}

/**
 * Generate a clean, highly structured WhatsApp daily summary text in Marathi & English
 */
export function generateNightlyWhatsAppDigest(
  report: DailySummaryReport,
  mandal: MandalProfile
): string {
  const isReconciled = report.verification?.status === 'Verified' || report.verification?.status === 'Locked';
  const statusBadge = isReconciled ? '✅ [हिशोब तपासणी पूर्ण व प्रमाणित]' : '⏳ [रात्री पडताळणी प्रलंबित]';

  return `॥ श्री गणेशाय नमः ॥
🚩 *${mandal.nameMr}* 🚩
━━━━━━━━━━━━━━━━━━━━
📊 *दैनिक संकलन व रात्री हिशोब अहवाल*
📅 *दिनांक:* ${report.date} (${report.festivalDayNameMr})
${statusBadge}
━━━━━━━━━━━━━━━━━━━━

💰 *आजचे एकूण उत्पन्न (Income):* ₹${report.totalIncome.toLocaleString('en-IN')}
🔻 *आजचा एकूण खर्च (Expenses):* ₹${report.totalExpenses.toLocaleString('en-IN')}
💵 *दैनिक निव्वळ शिल्लक:* ₹${report.netDailySurplus.toLocaleString('en-IN')}

📈 *रक्कम भरणा पद्धतीनुसार तपशील:*
• 💵 रोख संकलन (Cash): ₹${report.incomeByMode.cash.toLocaleString('en-IN')}
• 📱 UPI / QR संकलन: ₹${report.incomeByMode.upi.toLocaleString('en-IN')}
• 🏦 बँक ट्रान्सफर: ₹${report.incomeByMode.bank.toLocaleString('en-IN')}
• 📑 धनादेश (Cheque): ₹${report.incomeByMode.cheque.toLocaleString('en-IN')}

📝 *पावती आकडेवारी:*
• एकूण फाडलेल्या पावत्या: *${report.receiptsCount}*
• पावती क्र. श्रेणी: *${report.firstReceiptNumber}* ते *${report.lastReceiptNumber}*
${report.cancelledReceiptsCount > 0 ? `• रद्द पावत्या: ${report.cancelledReceiptsCount} (रक्कम: ₹${report.cancelledAmount})` : ''}

${report.categoryBreakdown.length > 0 ? `📂 *प्रमुख वर्गवारी:*
${report.categoryBreakdown.slice(0, 4).map(c => `• ${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.count} पावत्या)`).join('\n')}` : ''}

${report.verification ? `🔒 *खजिनदार पडताळणी निष्कर्ष:*
• प्रत्यक्ष कॅश मोजणी: ₹${report.verification.physicalCashCounted.toLocaleString('en-IN')}
• कॅश तफावत: ${report.verification.cashVariance === 0 ? '₹० (तंतोतंत जुळली ✅)' : `₹${report.verification.cashVariance > 0 ? '+' : ''}${report.verification.cashVariance} (${report.verification.cashVariance > 0 ? 'जादा' : 'कमी'})`}
• तिजोरी / बँक ठेव: ${report.verification.depositVaultLocation}
• पडताळणी अधिकारी: ${report.verification.verifiedByTreasurer}` : `⚠️ खजिनदार पडताळणी अद्याप बाकी आहे.`}

━━━━━━━━━━━━━━━━━━━━
*खजिनदार:* ${mandal.treasurerName || 'महेश गायकवाड'}
*अध्यक्ष:* ${mandal.presidentName || 'राजेंद्र तांबडे'}
_Digital ERP System generated report_`;
}
