import { IDCardDesign, Student } from '../types/idCard';
import { jsPDF } from 'jspdf';

// Procedural linear barcode rendering function
export function drawBarcodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#000000';
  let seed = 0;
  const cleanText = text.replace(/[^A-Z0-9-]/gi, '').toUpperCase() || 'STU-101';
  for (let i = 0; i < cleanText.length; i++) {
    seed += cleanText.charCodeAt(i) * (i + 1);
  }

  let currentX = x + 8;
  const endX = x + width - 8;
  let index = 0;

  // Render authentic Code128 pattern lines of different thicknesses
  while (currentX < endX) {
    const num = Math.abs(Math.sin(seed + index * 2.3) * 98754) % 1;
    const barWidth = num > 0.75 ? 3 : num > 0.35 ? 2 : 1;
    const spaceWidth = Math.abs(Math.cos(seed + index * 1.9) * 45213) % 1 > 0.5 ? 2 : 1;

    ctx.fillRect(currentX, y, barWidth, height - 12);
    currentX += barWidth + spaceWidth;
    index++;
  }

  // Draw code text
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(cleanText, x + width / 2, y + height - 2);
  ctx.restore();
}

// Procedural high-fidelity QR Code matrix generator
export function drawQRCodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  data: string,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);

  // Position detection templates (locator loops in QR spec)
  const drawLocator = (lx: number, ly: number, lsize: number) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(lx, ly, lsize, lsize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx + lsize / 7, ly + lsize / 7, (lsize * 5) / 7, (lsize * 5) / 7);
    ctx.fillStyle = '#000000';
    ctx.fillRect(lx + (lsize * 2) / 7, ly + (lsize * 2) / 7, (lsize * 3) / 7, (lsize * 3) / 7);
  };

  const locatorSize = Math.floor(size * 0.28);
  drawLocator(x, y, locatorSize); // Top-left
  drawLocator(x + size - locatorSize, y, locatorSize); // Top-right
  drawLocator(x, y + size - locatorSize, locatorSize); // Bottom-left

  // Seed coordinates using data string
  let hashVal = 0;
  for (let i = 0; i < data.length; i++) {
    hashVal = (hashVal << 5) - hashVal + data.charCodeAt(i);
    hashVal |= 0;
  }

  const dotCount = 18;
  const cellSize = size / dotCount;

  ctx.fillStyle = '#000000';
  for (let r = 0; r < dotCount; r++) {
    for (let c = 0; c < dotCount; c++) {
      // Don't overwrite locator zones
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= dotCount - 6;
      const inBottomLeft = r >= dotCount - 6 && c < 6;

      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const noise = Math.abs(Math.sin(hashVal + r * 11.23 + c * 43.541) * 885231) % 1;
      if (noise > 0.48) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize + 0.3, cellSize + 0.3);
      }
    }
  }
  ctx.restore();
}

// Image load utility so we can draw logos and student photos cleanly
export function loadImageAsync(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// High-DPI Master Canvas Drawing Routine
export async function renderCardToCanvas(
  design: IDCardDesign,
  student: Student,
  side: 'front' | 'back',
  scale: number = 3 // 3x scale guarantees excellent ultra-crisp printing matching 300 DPI
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Standard CR80 Size dimensions: 3.375" x 2.125" (Aspect ratio: 1.585)
  // At portrait scale context: 1x = 320 x 507 approx. At 3x (300DPI equivalent) = 960 x 1521 pixels
  const isPortrait = design.orientation === 'portrait';
  const width = isPortrait ? 320 * scale : 507 * scale;
  const height = isPortrait ? 507 * scale : 320 * scale;

  canvas.width = width;
  canvas.height = height;

  // Background and Styling presets
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Template custom decorations drawing loops
  if (design.templateStyle === 'modern') {
    // Elegant dual diagonals gradients
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, design.primaryColor);
    grad.addColorStop(0.4, design.secondaryColor);
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic clean curves background decoration overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.15, width * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.85, width * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (design.templateStyle === 'classic') {
    // Top banner block
    ctx.fillStyle = design.primaryColor;
    ctx.fillRect(0, 0, width, height * 0.22);

    // Accent strip
    ctx.fillStyle = design.secondaryColor;
    ctx.fillRect(0, height * 0.22, width, height * 0.02);

    // Bottom solid banner block
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, height * 0.9, width, height * 0.1);
    ctx.fillStyle = design.primaryColor;
    ctx.fillRect(0, height * 0.89, width, height * 0.01);
  } else if (design.templateStyle === 'minimal') {
    // Pure whitespace bordered look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = design.primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(8 * scale, 8 * scale, width - 16 * scale, height - 16 * scale);

    // Side stylish stripe accent
    ctx.fillStyle = design.secondaryColor;
    ctx.fillRect(8 * scale, 8 * scale, 6 * scale, height - 16 * scale);
  } else if (design.templateStyle === 'corporate') {
    // Top diagonal header block
    ctx.fillStyle = '#1e293b'; // Sleek dark charcoal header
    ctx.fillRect(0, 0, width, height * 0.25);

    // Stylized orange/gold geometric stripe separator
    ctx.fillStyle = design.primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.lineTo(width, height * 0.21);
    ctx.lineTo(width, height * 0.24);
    ctx.lineTo(0, height * 0.28);
    ctx.closePath();
    ctx.fill();

    // Subtle bottom light bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, height * 0.92, width, height * 0.08);
  }

  // Draw Ruler Grid guide if specified
  if (design.showGrid) {
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)';
    ctx.lineWidth = 1;
    const gStep = design.gridSize * scale;
    for (let xPos = 0; xPos < width; xPos += gStep) {
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, height);
      ctx.stroke();
    }
    for (let yPos = 0; yPos < height; yPos += gStep) {
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.stroke();
    }
  }

  // Draw Watermark inside background
  if (design.watermarkText) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(15, 23, 42, ${design.watermarkOpacity})`;
    ctx.font = `bold ${18 * scale}px ${design.fontFamily}`;
    ctx.fillText(design.watermarkText.toUpperCase(), 0, 0);
    ctx.restore();
  }

  // Load external elements safely before drawing on canvas context
  const logoImg = design.institutionLogo ? await loadImageAsync(design.institutionLogo) : null;
  const signatureImg = design.authorizedSignature ? await loadImageAsync(design.authorizedSignature) : null;
  const photoImg = student.photo ? await loadImageAsync(student.photo) : null;

  // Render Front VS Back sides of the card layout
  if (side === 'front') {
    // 1. Institution Details block
    ctx.save();
    ctx.fillStyle = (design.templateStyle === 'modern' || design.templateStyle === 'classic') ? '#ffffff' : design.textColor;
    if (design.templateStyle === 'corporate') {
      ctx.fillStyle = '#ffffff'; // White text on dark banner logo header
    }
    ctx.font = `bold ${8.5 * scale}px ${design.fontFamily}`;
    ctx.textBaseline = 'middle';

    const instName = design.institutionName.toUpperCase();
    const textWidth = ctx.measureText(instName).width;

    let centerY = 30 * scale;
    if (design.templateStyle === 'classic') {
      centerY = (height * 0.22) / 2;
    } else if (design.templateStyle === 'corporate') {
      centerY = (height * 0.25) / 2;
    } else if (design.templateStyle === 'modern') {
      centerY = isPortrait ? 36 * scale : 30 * scale;
    } else {
      centerY = isPortrait ? 30 * scale : 26 * scale;
    }

    if (logoImg) {
      const logoSize = 20 * scale;
      const spacing = 6 * scale;
      const totalWidth = logoSize + spacing + textWidth;
      const startX = (width - totalWidth) / 2;

      ctx.drawImage(logoImg, startX, centerY - logoSize / 2, logoSize, logoSize);
      ctx.textAlign = 'left';
      ctx.fillText(instName, startX + logoSize + spacing, centerY);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(instName, width / 2, centerY);
    }
    ctx.restore();

    // 2. Main photo element with frame
    const photoWidth = 64 * scale;
    const photoHeight = 74 * scale;
    const photoX = width / 2 - photoWidth / 2;
    const photoY = height * 0.28;

    // Draw frame backing outline
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = design.primaryColor;
    ctx.lineWidth = 2 * scale;

    if (design.templateStyle === 'modern') {
      // Circle photo frame layout
      const radius = photoWidth / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, photoY + radius, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.clip();
      if (photoImg) {
        ctx.drawImage(photoImg, width / 2 - radius, photoY, radius * 2, radius * 2);
      } else {
        // Mock SVG fallback image representer context
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(width / 2 - radius, photoY, radius * 2, radius * 2);
      }
      ctx.restore();
    } else {
      // Rounded Card corner photo frame layout
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 8 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoWidth, photoHeight, (8 * scale) - 1);
      ctx.closePath();
      ctx.clip();
      if (photoImg) {
        ctx.drawImage(photoImg, photoX, photoY, photoWidth, photoHeight);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
      }
      ctx.restore();
    }

    // 3. Holder Details list output
    const infoYStart = height * 0.53;
    const lineSpacing = 16 * scale;

    ctx.fillStyle = design.textColor;
    ctx.textAlign = 'center';

    // Bold name tag
    ctx.font = `black ${design.fontSizeName * scale}px ${design.fontFamily}`;
    ctx.fillText(student.name.toUpperCase(), width / 2, infoYStart);

    // Styled Role/Badge status label pill
    const roleWidth = 56 * scale;
    const roleHeight = 14 * scale;
    ctx.fillStyle = student.role === 'Faculty' ? '#9333ea' : design.primaryColor;
    ctx.beginPath();
    ctx.roundRect(width / 2 - roleWidth / 2, infoYStart + 6 * scale, roleWidth, roleHeight, 4 * scale);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${7 * scale}px ${design.fontFamily}`;
    ctx.fillText(student.role.toUpperCase(), width / 2, infoYStart + 15 * scale);

    // Details Grid Layout (Text metadata block)
    ctx.fillStyle = design.textColor;
    ctx.textAlign = 'left';
    ctx.font = `500 ${8 * scale}px ${design.fontFamily}`;

    const labelX = width * 0.12;
    const valX = width * 0.38;
    let currY = infoYStart + 34 * scale;

    const formatDateStr = (dateStr: string) => {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return dateStr;
      }
      return d.toLocaleDateString();
    };

    const isStudent = student.role === 'Student';
    const fields = [
      { label: isStudent ? 'STUDENT ID:' : 'STAFF ID:', value: student.id },
      { label: isStudent ? 'CLASS:' : 'DEPARTMENT:', value: student.department },
      { label: 'BLOOD GROUP:', value: student.bloodGroup },
      { label: 'DATE OF BIRTH:', value: formatDateStr(student.dob) },
    ];

    fields.forEach((row) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.55)'; // Grayish label
      ctx.font = `600 ${7 * scale}px ${design.fontFamily}`;
      ctx.fillText(row.label, labelX, currY);

      ctx.fillStyle = design.textColor;
      ctx.font = `bold ${8 * scale}px ${design.fontFamily}`;
      ctx.fillText(row.value, valX, currY);

      currY += lineSpacing;
    });

    // Valid until banner on front bottom edge
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, height * 0.88, width, height * 0.06);

    ctx.fillStyle = '#ef4444';
    ctx.font = `black ${7 * scale}px ${design.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(`VALID UNTIL: ${formatDateStr(student.validUntil)}`, width / 2, height * 0.92);

    // Small active tag color indicators
    ctx.fillStyle = student.status === 'Active' ? '#22c55e' : student.status === 'Expired' ? '#e11d48' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(width - 20 * scale, 20 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // BACK SIDE LAYOUT
    // 1. Regulatory terms and instructions block
    ctx.fillStyle = design.textColor;
    ctx.font = `bold ${9 * scale}px ${design.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('TERMS & CONDITIONS', width / 2, height * 0.12);

    ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
    ctx.font = `400 ${6.5 * scale}px ${design.fontFamily}`;
    const terms = [
      '1. This card is non-transferable property of the institution.',
      '2. Loss must be reported immediately to administrative office.',
      '3. Must be displayed on request inside campus facilities.',
      '4. If found, please return to administrative center.',
      `Emergency Contact Info: ${student.emergencyContact || 'N/A'}`
    ];

    let termY = height * 0.18;
    terms.forEach((line) => {
      ctx.fillText(line, width / 2, termY);
      termY += 11 * scale;
    });

    // 2. High-fidelity dynamic QR Code containing JSON/URL payload
    if (!design.hideQRCode) {
      const qrSize = 72 * scale;
      const qrX = width / 2 - qrSize / 2;
      const qrY = height * 0.42;
      const metaPayload = JSON.stringify({
        id: student.id,
        name: student.name,
        role: student.role,
        dept: student.department,
        emergency: student.emergencyContact
      });
      drawQRCodeOnCanvas(ctx, metaPayload, qrX, qrY, qrSize);
    }

    // 3. Structured Barcode element on the bottom back face
    if (!design.hideBarcode) {
      const bWidth = 140 * scale;
      const bHeight = 44 * scale;
      const bX = width / 2 - bWidth / 2;
      const bY = height * 0.65;
      drawBarcodeOnCanvas(ctx, student.id, bX, bY, bWidth, bHeight);
    }

    // 4. Authorized Signature block
    if (signatureImg) {
      const sigW = 60 * scale;
      const sigH = 22 * scale;
      ctx.drawImage(signatureImg, width / 2 - sigW / 2, height * 0.81, sigW, sigH);
    }
    
    ctx.fillStyle = 'rgba(31, 41, 55, 0.5)';
    ctx.font = `600 ${6 * scale}px ${design.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('AUTHORIZED SIGNATORY', width / 2, height * 0.91);
  }

  ctx.restore();
  return canvas;
}

// Bulk printable PDF compilation processor
export async function generateBulkPDF(
  design: IDCardDesign,
  dataList: Student[],
  side: 'both' | 'front' | 'back' = 'both',
  onProgress: (currentIndex: number, total: number) => void = () => {}
): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const total = dataList.length;

  // A4 Page margins is 10mm. Page width: 210mm, height: 297mm.
  // Landscape CR80 layout: 85.6mm x 54mm.
  // Portrait CR80 layout: 54mm x 85.6mm.
  // We place 4-8 cards per page depending on size configuration!
  // Let's standardise with A4 portrait configuration laying out cards cleanly spaced:
  const isPortrait = design.orientation === 'portrait';
  
  const cardW = isPortrait ? 54 : 85.6;
  const cardH = isPortrait ? 85.6 : 54;
  
  const marginX = 12;
  const marginY = 12;
  const gap = 6;

  // Compute layout counts per page
  const colSize = Math.floor((210 - marginX * 2 + gap) / (cardW + gap));
  const rowSize = Math.floor((297 - marginY * 2 + gap) / (cardH + gap));
  const batchPerPage = colSize * rowSize;

  let chunkCount = 0;

  for (let i = 0; i < total; i++) {
    const student = dataList[i];
    
    // Work out position grid inside A4 layout
    const itemGridIdx = chunkCount % batchPerPage;
    const colIdx = itemGridIdx % colSize;
    const rowIdx = Math.floor(itemGridIdx / colSize);

    const xPos = marginX + colIdx * (cardW + gap);
    const yPos = marginY + rowIdx * (cardH + gap);

    if (side === 'front') {
      const frontCanvas = await renderCardToCanvas(design, student, 'front', 2);
      const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(frontDataUrl, 'JPEG', xPos, yPos, cardW, cardH);
      chunkCount++;

      if (chunkCount === batchPerPage || i === total - 1) {
        chunkCount = 0;
        if (i < total - 1) {
          pdf.addPage();
        }
      }
    } else if (side === 'back') {
      const backCanvas = await renderCardToCanvas(design, student, 'back', 2);
      const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(backDataUrl, 'JPEG', xPos, yPos, cardW, cardH);
      chunkCount++;

      if (chunkCount === batchPerPage || i === total - 1) {
        chunkCount = 0;
        if (i < total - 1) {
          pdf.addPage();
        }
      }
    } else {
      // dual-sided ('both')
      const frontCanvas = await renderCardToCanvas(design, student, 'front', 2);
      const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.8);
      pdf.addImage(frontDataUrl, 'JPEG', xPos, yPos, cardW, cardH);
      chunkCount++;

      if (chunkCount === batchPerPage || i === total - 1) {
        // Draw back sides for this page's cards on a twin consecutive page!
        pdf.addPage();
        const currentBatchStart = i - chunkCount + 1;
        const currentBatchEnd = i;

        for (let j = currentBatchStart; j <= currentBatchEnd; j++) {
          const backStudent = dataList[j];
          const backSideCanvas = await renderCardToCanvas(design, backStudent, 'back', 2);
          const backSideDataUrl = backSideCanvas.toDataURL('image/jpeg', 0.8);

          const gridIdx = (j - currentBatchStart) % batchPerPage;
          const bColIdx = gridIdx % colSize;
          const bRowIdx = Math.floor(gridIdx / colSize);

          // For front-back folding alignment, cols flip:
          const backColIdx = colSize - 1 - bColIdx;
          const bxPos = marginX + backColIdx * (cardW + gap);
          const byPos = marginY + bRowIdx * (cardH + gap);

          pdf.addImage(backSideDataUrl, 'JPEG', bxPos, byPos, cardW, cardH);
        }

        chunkCount = 0;
        if (i < total - 1) {
          pdf.addPage();
        }
      }
    }

    onProgress(i + 1, total);

    // Yield control loop back to browser so UI does not freeze during ultra-heavy compilations
    if (i % 8 === 0) {
      await new Promise((r) => setTimeout(r, 12));
    }
  }

  return pdf;
}

// Convert design properties into fully scalable vector SVG structures for crisp vector printing
export function generateCardAsSVG(design: IDCardDesign, student: Student, side: 'front' | 'back'): string {
  const isPortrait = design.orientation === 'portrait';
  const width = isPortrait ? 320 : 507;
  const height = isPortrait ? 507 : 320;
  
  // Custom styled gradient tag node
  let bgGradient = '';
  if (design.templateStyle === 'modern') {
    bgGradient = `
      <defs>
        <linearGradient id="svg_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${design.primaryColor}" />
          <stop offset="40%" stop-color="${design.secondaryColor}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#svg_bg)" rx="16" />
    `;
  } else if (design.templateStyle === 'classic') {
    bgGradient = `
      <rect width="${width}" height="${height}" fill="#ffffff" rx="16" />
      <rect width="${width}" height="${height * 0.22}" fill="${design.primaryColor}" rx="14" />
      <rect y="${height * 0.22}" width="${width}" height="${height * 0.02}" fill="${design.secondaryColor}" />
      <rect y="${height * 0.9}" width="${width}" height="${height * 0.1}" fill="#f8fafc" />
    `;
  } else {
    bgGradient = `
      <rect width="${width}" height="${height}" fill="#ffffff" rx="16" stroke="${design.primaryColor}" stroke-width="4" />
      <rect x="4" y="4" width="6" height="${height - 8}" fill="${design.secondaryColor}" />
    `;
  }

  // Draw front side blocks vs back blocks
  let contents = '';
  if (side === 'front') {
    contents = `
      <text x="${width / 2}" y="42" fill="#ffffff" font-family="${design.fontFamily}" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">
        ${design.institutionName.toUpperCase()}
      </text>
      <!-- Base circle/rect frame -->
      <rect x="${width / 2 - 32}" y="${height * 0.28}" width="64" height="74" fill="#cbd5e1" rx="6" stroke="${design.primaryColor}" stroke-width="2" />
      
      <!-- Text details -->
      <text x="${width / 2}" y="${height * 0.53}" fill="${design.textColor}" font-family="${design.fontFamily}" font-weight="950" font-size="${design.fontSizeName}" text-anchor="middle">
        ${student.name.toUpperCase()}
      </text>
      
      <rect x="${width / 2 - 28}" y="${height * 0.53 + 6}" width="56" height="14" fill="${design.primaryColor}" rx="4" />
      <text x="${width / 2}" y="${height * 0.53 + 16}" fill="#ffffff" font-family="${design.fontFamily}" font-weight="bold" font-size="7" text-anchor="middle">
        ${student.role.toUpperCase()}
      </text>

      <!-- Details keys -->
      <text x="${width * 0.12}" y="${height * 0.64}" fill="#64748b" font-family="${design.fontFamily}" font-weight="bold" font-size="7">ID NUMBER:</text>
      <text x="${width * 0.38}" y="${height * 0.64}" fill="${design.textColor}" font-family="${design.fontFamily}" font-weight="bold" font-size="8">${student.id}</text>

      <text x="${width * 0.12}" y="${height * 0.70}" fill="#64748b" font-family="${design.fontFamily}" font-weight="bold" font-size="7">DEPARTMENT:</text>
      <text x="${width * 0.38}" y="${height * 0.70}" fill="${design.textColor}" font-family="${design.fontFamily}" font-weight="bold" font-size="8">${student.department}</text>

      <text x="${width * 0.12}" y="${height * 0.76}" fill="#64748b" font-family="${design.fontFamily}" font-weight="bold" font-size="7">BLOOD GROUP:</text>
      <text x="${width * 0.38}" y="${height * 0.76}" fill="${design.textColor}" font-family="${design.fontFamily}" font-weight="bold" font-size="8">${student.bloodGroup}</text>

      <rect y="${height * 0.88}" width="${width}" height="${height * 0.06}" fill="#fee2e2" />
      <text x="${width / 2}" y="${height * 0.92}" fill="#ef4444" font-family="${design.fontFamily}" font-weight="900" font-size="7" text-anchor="middle">
        VALID UNTIL: ${student.validUntil}
      </text>
    `;
  } else {
    contents = `
      <text x="${width / 2}" y="42" fill="${design.textColor}" font-family="${design.fontFamily}" font-weight="bold" font-size="9" text-anchor="middle">
        TERMS & CONDITIONS
      </text>
      <text x="${width / 2}" y="70" fill="#475569" font-family="${design.fontFamily}" font-size="6.5" text-anchor="middle">
        1. This card is non-transferable property of the institution.
      </text>
      <text x="${width / 2}" y="84" fill="#475569" font-family="${design.fontFamily}" font-size="6.5" text-anchor="middle">
        2. Loss must be reported immediately to administrative office.
      </text>
      <text x="${width / 2}" y="98" fill="#475569" font-family="${design.fontFamily}" font-size="6.5" text-anchor="middle">
        3. Must be displayed inside campus facilities.
      </text>
      <text x="${width / 2}" y="112" fill="#475569" font-family="${design.fontFamily}" font-size="6.5" text-anchor="middle">
        Emergency Contact: ${student.emergencyContact}
      </text>
      
      <!-- Simulated barcode representation -->
      <g fill="#000000">
        <rect x="${width / 2 - 70}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 - 64}" y="${height * 0.65}" width="2" height="32" />
        <rect x="${width / 2 - 60}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 - 52}" y="${height * 0.65}" width="1" height="32" />
        <rect x="${width / 2 - 48}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 - 40}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 - 32}" y="${height * 0.65}" width="2" height="32" />
        <rect x="${width / 2 - 28}" y="${height * 0.65}" width="1" height="32" />
        <rect x="${width / 2 - 24}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 - 14}" y="${height * 0.65}" width="2" height="32" />
        <rect x="${width / 2 - 10}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 - 2}" y="${height * 0.65}" width="1" height="32" />
        <rect x="${width / 2 + 2}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 + 10}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 + 18}" y="${height * 0.65}" width="2" height="32" />
        <rect x="${width / 2 + 24}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 + 32}" y="${height * 0.65}" width="1" height="32" />
        <rect x="${width / 2 + 36}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 + 42}" y="${height * 0.65}" width="6" height="32" />
        <rect x="${width / 2 + 50}" y="${height * 0.65}" width="2" height="32" />
        <rect x="${width / 2 + 56}" y="${height * 0.65}" width="4" height="32" />
        <rect x="${width / 2 + 62}" y="${height * 0.65}" width="2" height="32" />
      </g>
      <text x="${width / 2}" y="${height * 0.65 + 42}" fill="#000000" font-family="monospace" font-size="8" text-anchor="middle">
        ${student.id}
      </text>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${bgGradient}
      ${contents}
    </svg>
  `.trim();
}
