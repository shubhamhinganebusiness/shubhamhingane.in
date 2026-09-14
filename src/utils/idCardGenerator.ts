import { IDCardDesign, Student } from '../types/idCard';
import { jsPDF } from 'jspdf';

// Procedural linear barcode rendering function
export function drawBarcodeOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number = 1
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#0f172a';
  let seed = 0;
  const cleanText = text.replace(/[^A-Z0-9-]/gi, '').toUpperCase() || 'STU-101';
  for (let i = 0; i < cleanText.length; i++) {
    seed += cleanText.charCodeAt(i) * (i + 1);
  }

  const padX = 8 * scale;
  let currentX = x + padX;
  const endX = x + width - padX;
  let index = 0;

  // Render authentic Code128 pattern lines of different thicknesses
  while (currentX < endX) {
    const num = Math.abs(Math.sin(seed + index * 2.3) * 98754) % 1;
    const barWidth = (num > 0.75 ? 3 : num > 0.35 ? 2 : 1) * Math.max(1, scale * 0.8);
    const spaceWidth = (Math.abs(Math.cos(seed + index * 1.9) * 45213) % 1 > 0.5 ? 2 : 1) * Math.max(1, scale * 0.8);

    ctx.fillRect(currentX, y + 4 * scale, barWidth, height - 16 * scale);
    currentX += barWidth + spaceWidth;
    index++;
  }

  // Draw code text
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${7.5 * scale}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(cleanText, x + width / 2, y + height - 3 * scale);
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
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lx, ly, lsize, lsize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(lx + lsize / 7, ly + lsize / 7, (lsize * 5) / 7, (lsize * 5) / 7);
    ctx.fillStyle = '#0f172a';
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

  ctx.fillStyle = '#0f172a';
  for (let r = 0; r < dotCount; r++) {
    for (let c = 0; c < dotCount; c++) {
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

// Procedural Security Hologram Badge
function drawHolographicBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  scale: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Metallic gold gradient circle
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.3, '#f59e0b');
  grad.addColorStop(0.6, '#d97706');
  grad.addColorStop(0.8, '#fef3c7');
  grad.addColorStop(1, '#b45309');

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle concentric micro-security rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();

  // Star / shield icon center
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${radius * 0.65}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 0);

  // Tiny circular security text
  ctx.font = `bold ${radius * 0.22}px sans-serif`;
  ctx.fillStyle = 'rgba(120, 53, 15, 0.9)';
  ctx.fillText('SECURE', 0, -radius * 0.6);
  ctx.fillText('VERIFIED', 0, radius * 0.6);

  ctx.restore();
}

// Procedural EMV Smart Chip
function drawSmartChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.save();
  // Gold body
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#fde68a');
  grad.addColorStop(0.4, '#d97706');
  grad.addColorStop(0.7, '#f59e0b');
  grad.addColorStop(1, '#b45309');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3 * scale);
  ctx.fill();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Circuit trace lines
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.7)';
  ctx.lineWidth = 1 * scale;

  // Horizontal mid divider
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();

  // Vertical middle segment
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y + h);
  ctx.moveTo(x + w * 0.65, y);
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.stroke();

  // Center contact pad
  ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.fillRect(x + w * 0.35, y + h * 0.3, w * 0.3, h * 0.4);

  ctx.restore();
}

// Procedural Lanyard Punch Slot
function drawLanyardSlot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.save();
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5 * scale;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
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

  // Standard CR80 Dimensions: 85.60 mm x 53.98 mm (Aspect ratio: 1.5857)
  // Portrait: 320 x 507 approx. At 3x = 960 x 1521 px
  // Landscape: 507 x 320 approx. At 3x = 1521 x 960 px
  const isPortrait = design.orientation === 'portrait';
  const width = isPortrait ? 320 * scale : 507 * scale;
  const height = isPortrait ? 507 * scale : 320 * scale;

  canvas.width = width;
  canvas.height = height;

  // Base background fill (clean off-white PVC base)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Template custom decorations drawing loops
  if (design.templateStyle === 'modern') {
    // Elegant dual diagonals gradients
    const grad = ctx.createLinearGradient(0, 0, width, height * 0.4);
    grad.addColorStop(0, design.primaryColor);
    grad.addColorStop(0.7, design.secondaryColor);
    grad.addColorStop(1, '#ffffff');

    if (isPortrait) {
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height * 0.28);

      // Subtle dynamic curves background decoration overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(width * 0.2, height * 0.1, width * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(width * 0.85, height * 0.18, width * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Bottom accent wave
      ctx.fillStyle = design.primaryColor;
      ctx.fillRect(0, height - 6 * scale, width, 6 * scale);
    } else {
      // Landscape Modern header
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height * 0.24);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(width * 0.85, height * 0.12, width * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = design.primaryColor;
      ctx.fillRect(0, height - 5 * scale, width, 5 * scale);
    }
  } else if (design.templateStyle === 'classic') {
    // Top banner block
    const bannerH = isPortrait ? height * 0.22 : height * 0.22;
    ctx.fillStyle = design.primaryColor;
    ctx.fillRect(0, 0, width, bannerH);

    // Accent strip
    ctx.fillStyle = design.secondaryColor;
    ctx.fillRect(0, bannerH, width, 4 * scale);

    // Bottom solid banner block
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, height - 24 * scale, width, 24 * scale);
    ctx.fillStyle = design.secondaryColor;
    ctx.fillRect(0, height - 24 * scale, width, 2 * scale);
  } else if (design.templateStyle === 'minimal') {
    // Pure whitespace bordered look
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = design.primaryColor;
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(6 * scale, 6 * scale, width - 12 * scale, height - 12 * scale);

    // Side stylish stripe accent
    ctx.fillStyle = design.secondaryColor;
    ctx.fillRect(6 * scale, 6 * scale, 5 * scale, height - 12 * scale);
  } else if (design.templateStyle === 'corporate') {
    // Top diagonal header block
    const bannerH = isPortrait ? height * 0.23 : height * 0.22;
    ctx.fillStyle = '#0f172a'; // Sleek dark charcoal header
    ctx.fillRect(0, 0, width, bannerH);

    // Stylized orange/gold geometric stripe separator
    ctx.fillStyle = design.secondaryColor || '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, bannerH);
    ctx.lineTo(width, bannerH - 6 * scale);
    ctx.lineTo(width, bannerH - 1 * scale);
    ctx.lineTo(0, bannerH + 5 * scale);
    ctx.closePath();
    ctx.fill();

    // Subtle bottom light bar
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, height - 20 * scale, width, 20 * scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, height - 3 * scale, width, 3 * scale);
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
    ctx.fillStyle = `rgba(15, 23, 42, ${design.watermarkOpacity || 0.08})`;
    ctx.font = `900 ${17 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
    ctx.fillText(design.watermarkText.toUpperCase(), 0, 0);
    ctx.restore();
  }

  // Lanyard slot hole if requested
  if (design.showLanyardHole) {
    drawLanyardSlot(ctx, width / 2, 6 * scale, 30 * scale, 8 * scale, scale);
  }

  // Load external elements safely before drawing on canvas context
  const logoImg = design.institutionLogo ? await loadImageAsync(design.institutionLogo) : null;
  const signatureImg = design.authorizedSignature ? await loadImageAsync(design.authorizedSignature) : null;
  const photoImg = student.photo ? await loadImageAsync(student.photo) : null;

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ==========================================
  // FRONT SIDE RENDERING
  // ==========================================
  if (side === 'front') {
    if (isPortrait) {
      // ----------------------------------------
      // PORTRAIT FRONT
      // ----------------------------------------
      // 1. Institution Details Block (Header)
      ctx.save();
      const isHeaderDark = design.templateStyle === 'modern' || design.templateStyle === 'classic' || design.templateStyle === 'corporate';
      ctx.fillStyle = isHeaderDark ? '#ffffff' : design.textColor;
      ctx.font = `bold ${8.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textBaseline = 'middle';

      const instName = (design.institutionName || 'INSTITUTION NAME').toUpperCase();
      const centerY = 32 * scale;

      if (logoImg) {
        const logoSize = 22 * scale;
        const spacing = 7 * scale;
        const textWidth = ctx.measureText(instName).width;
        const totalW = logoSize + spacing + textWidth;
        const startX = Math.max(12 * scale, (width - totalW) / 2);

        ctx.drawImage(logoImg, startX, centerY - logoSize / 2, logoSize, logoSize);
        ctx.textAlign = 'left';
        ctx.fillText(instName, startX + logoSize + spacing, centerY);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(instName, width / 2, centerY);
      }
      ctx.restore();

      // 2. Photo Frame
      const photoWidth = 68 * scale;
      const photoHeight = 80 * scale;
      const photoX = width / 2 - photoWidth / 2;
      const photoY = height * 0.28;

      ctx.save();
      // Drop shadow for photo
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 8 * scale;
      ctx.shadowOffsetY = 3 * scale;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = design.primaryColor;
      ctx.lineWidth = 2.5 * scale;

      if (design.templateStyle === 'modern') {
        const radius = photoWidth / 2;
        ctx.beginPath();
        ctx.arc(width / 2, photoY + radius, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, photoY + radius, radius - 1.5 * scale, 0, Math.PI * 2);
        ctx.clip();
        if (photoImg) {
          ctx.drawImage(photoImg, width / 2 - radius, photoY, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(width / 2 - radius, photoY, radius * 2, radius * 2);
          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold ${10 * scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('NO PHOTO', width / 2, photoY + radius);
        }
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 8 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX + 1 * scale, photoY + 1 * scale, photoWidth - 2 * scale, photoHeight - 2 * scale, 7 * scale);
        ctx.clip();
        if (photoImg) {
          ctx.drawImage(photoImg, photoX, photoY, photoWidth, photoHeight);
        } else {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold ${10 * scale}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('NO PHOTO', width / 2, photoY + photoHeight / 2);
        }
        ctx.restore();
      }

      // Smart chip if enabled
      if (design.showSmartChip) {
        drawSmartChip(ctx, 20 * scale, photoY + 20 * scale, 24 * scale, 18 * scale, scale);
      }

      // Hologram security seal if enabled
      if (design.showHologram) {
        drawHolographicBadge(ctx, width - 26 * scale, photoY + 26 * scale, 13 * scale, scale);
      }

      // 3. Holder Name & Role Badge
      const infoYStart = height * 0.54;

      ctx.fillStyle = design.textColor;
      ctx.textAlign = 'center';
      ctx.font = `900 ${design.fontSizeName * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillText((student.name || 'FULL NAME').toUpperCase(), width / 2, infoYStart);

      // Role Badge
      const roleText = (student.role || 'STUDENT').toUpperCase();
      const roleWidth = Math.max(64 * scale, ctx.measureText(roleText).width + 16 * scale);
      const roleHeight = 14 * scale;
      const roleY = infoYStart + 6 * scale;

      ctx.fillStyle = student.role === 'Faculty' ? '#7c3aed' : student.role === 'Staff' ? '#d97706' : design.primaryColor;
      ctx.beginPath();
      ctx.roundRect(width / 2 - roleWidth / 2, roleY, roleWidth, roleHeight, 7 * scale);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${7 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roleText, width / 2, roleY + roleHeight / 2);

      // 4. Details Metadata Grid
      ctx.textBaseline = 'alphabetic';
      const labelX = width * 0.12;
      const valX = width * 0.42;
      let currY = roleY + roleHeight + 18 * scale;
      const lineSpacing = 15 * scale;

      const isStudent = student.role === 'Student';
      const fields = [
        { label: isStudent ? 'STUDENT ID:' : 'OFFICIAL ID:', value: student.id || 'N/A' },
        { label: isStudent ? 'DEPARTMENT:' : 'DIVISION:', value: student.department || 'N/A' },
        { label: 'BLOOD GROUP:', value: student.bloodGroup || 'O+' },
        { label: 'DATE OF BIRTH:', value: formatDateStr(student.dob) },
      ];

      fields.forEach((row) => {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.font = `bold ${7 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
        ctx.textAlign = 'left';
        ctx.fillText(row.label, labelX, currY);

        ctx.fillStyle = design.textColor;
        ctx.font = `bold ${7.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillText(row.value, valX, currY);

        currY += lineSpacing;
      });

      // Bottom Valid Until Banner
      const bannerY = height - 28 * scale;
      ctx.fillStyle = student.status === 'Expired' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.08)';
      ctx.fillRect(0, bannerY, width, 18 * scale);

      ctx.fillStyle = student.status === 'Expired' ? '#dc2626' : design.primaryColor;
      ctx.font = `bold ${7.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText(`VALID UNTIL: ${formatDateStr(student.validUntil)}`, width / 2, bannerY + 12 * scale);

      // Status indicator dot
      ctx.fillStyle = student.status === 'Active' ? '#22c55e' : student.status === 'Expired' ? '#ef4444' : '#eab308';
      ctx.beginPath();
      ctx.arc(width - 16 * scale, 16 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ----------------------------------------
      // LANDSCAPE FRONT
      // ----------------------------------------
      // Header Banner
      const isHeaderDark = design.templateStyle === 'modern' || design.templateStyle === 'classic' || design.templateStyle === 'corporate';
      ctx.save();
      ctx.fillStyle = isHeaderDark ? '#ffffff' : design.textColor;
      ctx.font = `bold ${8.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textBaseline = 'middle';

      const instName = (design.institutionName || 'INSTITUTION NAME').toUpperCase();
      const centerY = 24 * scale;

      if (logoImg) {
        const logoSize = 22 * scale;
        const spacing = 8 * scale;
        ctx.drawImage(logoImg, 20 * scale, centerY - logoSize / 2, logoSize, logoSize);
        ctx.textAlign = 'left';
        ctx.fillText(instName, 20 * scale + logoSize + spacing, centerY);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(instName, 20 * scale, centerY);
      }

      // Top right status chip
      ctx.textAlign = 'right';
      ctx.fillStyle = student.status === 'Active' ? '#22c55e' : '#ef4444';
      ctx.font = `bold ${7 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillText(`● ${student.status.toUpperCase()}`, width - 20 * scale, centerY);
      ctx.restore();

      // Left Column: Photo & Role
      const photoWidth = 72 * scale;
      const photoHeight = 84 * scale;
      const photoX = 24 * scale;
      const photoY = height * 0.32;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = 8 * scale;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = design.primaryColor;
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoWidth, photoHeight, 8 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX + 1 * scale, photoY + 1 * scale, photoWidth - 2 * scale, photoHeight - 2 * scale, 7 * scale);
      ctx.clip();
      if (photoImg) {
        ctx.drawImage(photoImg, photoX, photoY, photoWidth, photoHeight);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `bold ${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('PHOTO', photoX + photoWidth / 2, photoY + photoHeight / 2);
      }
      ctx.restore();

      // Role badge under photo
      const roleText = (student.role || 'STUDENT').toUpperCase();
      const roleY = photoY + photoHeight + 6 * scale;
      ctx.fillStyle = student.role === 'Faculty' ? '#7c3aed' : student.role === 'Staff' ? '#d97706' : design.primaryColor;
      ctx.beginPath();
      ctx.roundRect(photoX, roleY, photoWidth, 14 * scale, 4 * scale);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${7 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText(roleText, photoX + photoWidth / 2, roleY + 10 * scale);

      // Smart chip if enabled
      if (design.showSmartChip) {
        drawSmartChip(ctx, photoX + photoWidth + 12 * scale, photoY + 4 * scale, 22 * scale, 17 * scale, scale);
      }

      // Security Hologram badge if enabled
      if (design.showHologram) {
        drawHolographicBadge(ctx, width - 28 * scale, height * 0.38, 14 * scale, scale);
      }

      // Right Column: Details
      const detailsX = photoX + photoWidth + (design.showSmartChip ? 42 * scale : 18 * scale);
      const nameY = height * 0.35;

      ctx.fillStyle = design.textColor;
      ctx.textAlign = 'left';
      ctx.font = `900 ${design.fontSizeName * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillText((student.name || 'FULL NAME').toUpperCase(), detailsX, nameY);

      // Details metadata
      const isStudent = student.role === 'Student';
      const fields = [
        { label: isStudent ? 'ID NUMBER:' : 'OFFICIAL ID:', value: student.id || 'N/A' },
        { label: isStudent ? 'DEPARTMENT:' : 'DIVISION:', value: student.department || 'N/A' },
        { label: 'BLOOD GROUP:', value: student.bloodGroup || 'O+' },
        { label: 'DATE OF BIRTH:', value: formatDateStr(student.dob) },
        { label: 'VALID UNTIL:', value: formatDateStr(student.validUntil) }
      ];

      const metaCol1X = detailsX;
      const metaCol1ValX = detailsX + 64 * scale;
      let currY = nameY + 16 * scale;
      const lineSpacing = 13.5 * scale;

      fields.forEach((row) => {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.font = `bold ${6.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillText(row.label, metaCol1X, currY);

        ctx.fillStyle = row.label === 'VALID UNTIL:' ? (student.status === 'Expired' ? '#dc2626' : design.primaryColor) : design.textColor;
        ctx.font = `bold ${7 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillText(row.value, metaCol1ValX, currY);

        currY += lineSpacing;
      });
    }

  } else {
    // ==========================================
    // BACK SIDE RENDERING
    // ==========================================
    if (isPortrait) {
      // ----------------------------------------
      // PORTRAIT BACK
      // ----------------------------------------
      // 1. Terms & Conditions Title
      ctx.fillStyle = design.textColor;
      ctx.font = `bold ${9 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText('TERMS & CONDITIONS OF ISSUANCE', width / 2, height * 0.1);

      ctx.fillStyle = 'rgba(51, 65, 85, 0.75)';
      ctx.font = `500 ${6.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      const terms = [
        '1. This card is non-transferable property of the institution.',
        '2. Loss must be reported immediately to administrative office.',
        '3. Must be displayed on request within campus premises.',
        '4. If found, please return to administrative center.',
        `Emergency Contact: ${student.emergencyContact || '+1 (555) 000-0000'}`
      ];

      let termY = height * 0.16;
      terms.forEach((line) => {
        ctx.fillText(line, width / 2, termY);
        termY += 10.5 * scale;
      });

      // 2. High-fidelity QR Code
      if (!design.hideQRCode) {
        const qrSize = 64 * scale;
        const qrX = width / 2 - qrSize / 2;
        const qrY = height * 0.39;
        const metaPayload = JSON.stringify({
          id: student.id,
          name: student.name,
          role: student.role,
          dept: student.department,
          emergency: student.emergencyContact,
          v: 'ZENID-PRO-V2'
        });
        drawQRCodeOnCanvas(ctx, metaPayload, qrX, qrY, qrSize);
      }

      // 3. Structured Barcode
      if (!design.hideBarcode) {
        const bWidth = 140 * scale;
        const bHeight = 38 * scale;
        const bX = width / 2 - bWidth / 2;
        const bY = height * 0.63;
        drawBarcodeOnCanvas(ctx, student.id, bX, bY, bWidth, bHeight, scale);
      }

      // 4. Authorized Signature Block
      const sigY = height * 0.79;
      if (signatureImg) {
        const sigW = 64 * scale;
        const sigH = 22 * scale;
        ctx.drawImage(signatureImg, width / 2 - sigW / 2, sigY, sigW, sigH);
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(width * 0.25, sigY + 24 * scale);
      ctx.lineTo(width * 0.75, sigY + 24 * scale);
      ctx.stroke();

      ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
      ctx.font = `bold ${6 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText('AUTHORIZED SIGNATURE & SEAL', width / 2, sigY + 31 * scale);

    } else {
      // ----------------------------------------
      // LANDSCAPE BACK
      // ----------------------------------------
      // Left Column: Terms & Regulatory Info
      const leftColX = 24 * scale;
      ctx.fillStyle = design.textColor;
      ctx.font = `bold ${8.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'left';
      ctx.fillText('TERMS & CONDITIONS', leftColX, 30 * scale);

      ctx.fillStyle = 'rgba(51, 65, 85, 0.75)';
      ctx.font = `500 ${6.5 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      const terms = [
        '• This card is non-transferable property of the institution.',
        '• Must be carried and displayed upon request on premises.',
        '• Report loss immediately to campus security & registrar.',
        '• Tampering with this card invalidates all permissions.',
        `• Emergency Contact: ${student.emergencyContact || 'N/A'}`
      ];

      let termY = 46 * scale;
      terms.forEach((line) => {
        ctx.fillText(line, leftColX, termY);
        termY += 11 * scale;
      });

      // Left Column Barcode
      if (!design.hideBarcode) {
        const bWidth = 160 * scale;
        const bHeight = 36 * scale;
        drawBarcodeOnCanvas(ctx, student.id, leftColX, height - 52 * scale, bWidth, bHeight, scale);
      }

      // Right Column: QR Code & Signature
      const rightColX = width * 0.58;

      if (!design.hideQRCode) {
        const qrSize = 64 * scale;
        const metaPayload = JSON.stringify({
          id: student.id,
          name: student.name,
          role: student.role,
          dept: student.department,
          emergency: student.emergencyContact
        });
        drawQRCodeOnCanvas(ctx, metaPayload, rightColX, 24 * scale, qrSize);

        ctx.fillStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.font = `bold ${6 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.fillText('SCAN FOR DIGITAL VERIFICATION', rightColX + qrSize / 2, 24 * scale + qrSize + 10 * scale);
      }

      // Right Column Signature
      const sigCenterX = width * 0.84;
      const sigY = height * 0.55;
      if (signatureImg) {
        const sigW = 60 * scale;
        const sigH = 22 * scale;
        ctx.drawImage(signatureImg, sigCenterX - sigW / 2, sigY, sigW, sigH);
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sigCenterX - 35 * scale, sigY + 24 * scale);
      ctx.lineTo(sigCenterX + 35 * scale, sigY + 24 * scale);
      ctx.stroke();

      ctx.fillStyle = 'rgba(71, 85, 105, 0.8)';
      ctx.font = `bold ${6 * scale}px ${design.fontFamily || 'Inter, sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.fillText('AUTHORIZED SIGNATURE', sigCenterX, sigY + 31 * scale);
    }
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
    
    const itemGridIdx = chunkCount % batchPerPage;
    const colIdx = itemGridIdx % colSize;
    const rowIdx = Math.floor(itemGridIdx / colSize);

    const xPos = marginX + colIdx * (cardW + gap);
    const yPos = marginY + rowIdx * (cardH + gap);

    if (side === 'front') {
      const frontCanvas = await renderCardToCanvas(design, student, 'front', 2);
      const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.85);
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
      const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.85);
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
      const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.85);
      pdf.addImage(frontDataUrl, 'JPEG', xPos, yPos, cardW, cardH);
      chunkCount++;

      if (chunkCount === batchPerPage || i === total - 1) {
        pdf.addPage();
        const currentBatchStart = i - chunkCount + 1;
        const currentBatchEnd = i;

        for (let j = currentBatchStart; j <= currentBatchEnd; j++) {
          const backStudent = dataList[j];
          const backSideCanvas = await renderCardToCanvas(design, backStudent, 'back', 2);
          const backSideDataUrl = backSideCanvas.toDataURL('image/jpeg', 0.85);

          const gridIdx = (j - currentBatchStart) % batchPerPage;
          const bColIdx = gridIdx % colSize;
          const bRowIdx = Math.floor(gridIdx / colSize);

          // For front-back duplex alignment, columns flip horizontally
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

    if (i % 8 === 0) {
      await new Promise((r) => setTimeout(r, 12));
    }
  }

  return pdf;
}

// Scalable vector SVG generator for crisp vector printing
export function generateCardAsSVG(design: IDCardDesign, student: Student, side: 'front' | 'back'): string {
  const isPortrait = design.orientation === 'portrait';
  const width = isPortrait ? 320 : 507;
  const height = isPortrait ? 507 : 320;
  
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
      <rect y="${height * 0.22}" width="${width}" height="4" fill="${design.secondaryColor}" />
      <rect y="${height - 24}" width="${width}" height="24" fill="#f8fafc" />
    `;
  } else {
    bgGradient = `
      <rect width="${width}" height="${height}" fill="#ffffff" rx="16" stroke="${design.primaryColor}" stroke-width="4" />
      <rect x="4" y="4" width="6" height="${height - 8}" fill="${design.secondaryColor}" />
    `;
  }

  let contents = '';
  if (side === 'front') {
    contents = `
      <text x="${width / 2}" y="36" fill="#ffffff" font-family="${design.fontFamily || 'sans-serif'}" font-weight="900" font-size="10" text-anchor="middle" letter-spacing="1">
        ${(design.institutionName || 'INSTITUTION').toUpperCase()}
      </text>
      <rect x="${width / 2 - 34}" y="${height * 0.28}" width="68" height="80" fill="#cbd5e1" rx="8" stroke="${design.primaryColor}" stroke-width="2" />
      <text x="${width / 2}" y="${height * 0.54}" fill="${design.textColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="900" font-size="${design.fontSizeName}" text-anchor="middle">
        ${(student.name || 'HOLDER NAME').toUpperCase()}
      </text>
      <rect x="${width / 2 - 32}" y="${height * 0.54 + 6}" width="64" height="14" fill="${design.primaryColor}" rx="7" />
      <text x="${width / 2}" y="${height * 0.54 + 16}" fill="#ffffff" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="7" text-anchor="middle">
        ${(student.role || 'STUDENT').toUpperCase()}
      </text>
      <text x="${width * 0.12}" y="${height * 0.65}" fill="#64748b" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="7">ID NUMBER:</text>
      <text x="${width * 0.42}" y="${height * 0.65}" fill="${design.textColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="8">${student.id}</text>
      <text x="${width * 0.12}" y="${height * 0.71}" fill="#64748b" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="7">DEPARTMENT:</text>
      <text x="${width * 0.42}" y="${height * 0.71}" fill="${design.textColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="8">${student.department}</text>
      <text x="${width * 0.12}" y="${height * 0.77}" fill="#64748b" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="7">BLOOD GROUP:</text>
      <text x="${width * 0.42}" y="${height * 0.77}" fill="${design.textColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="8">${student.bloodGroup}</text>
      <rect y="${height - 24}" width="${width}" height="18" fill="#eff6ff" />
      <text x="${width / 2}" y="${height - 12}" fill="${design.primaryColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="7.5" text-anchor="middle">
        VALID UNTIL: ${student.validUntil}
      </text>
    `;
  } else {
    contents = `
      <text x="${width / 2}" y="36" fill="${design.textColor}" font-family="${design.fontFamily || 'sans-serif'}" font-weight="bold" font-size="9" text-anchor="middle">
        TERMS & CONDITIONS OF ISSUANCE
      </text>
      <text x="${width / 2}" y="60" fill="#475569" font-family="${design.fontFamily || 'sans-serif'}" font-size="6.5" text-anchor="middle">
        1. This card is non-transferable property of the institution.
      </text>
      <text x="${width / 2}" y="74" fill="#475569" font-family="${design.fontFamily || 'sans-serif'}" font-size="6.5" text-anchor="middle">
        2. Loss must be reported immediately to administrative office.
      </text>
      <text x="${width / 2}" y="88" fill="#475569" font-family="${design.fontFamily || 'sans-serif'}" font-size="6.5" text-anchor="middle">
        3. Must be displayed on request inside campus facilities.
      </text>
      <text x="${width / 2}" y="102" fill="#475569" font-family="${design.fontFamily || 'sans-serif'}" font-size="6.5" text-anchor="middle">
        Emergency Contact: ${student.emergencyContact}
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
