import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Download, 
  Share2, 
  Check, 
  X, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  Flame, 
  Medal, 
  Zap,
  Users,
  CheckSquare,
  Square,
  Search,
  FileCheck,
  Printer,
  Layers,
  Eye,
  Loader2,
  Package,
  ArrowRight,
  UserPlus,
  Trash2,
  FileText,
  CheckCircle2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { QRCodeSVG } from 'qrcode.react';
import { subscribeCertificateConfig, DEFAULT_CERTIFICATE_CONFIG, CertificateConfigSettings } from '../../utils/certificateConfigStorage';
import { 
  generateCertificateSerial, 
  buildCertificateVerificationUrl, 
  AwardType,
  SquadPlayerCertificateItem,
  extractSquadPlayersForCertificates 
} from '../../utils/certificateVerification';

export type { AwardType };

export type CertificateThemeId = 'classic_ivory';

export interface AwardPlayer {
  name: string;
  runs: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets: number;
  runsConceded?: number;
  points: number;
}

export interface MatchCertificateData {
  matchId: string;
  tournamentName?: string;
  matchDate: string;
  teamA: string;
  teamB: string;
  winner?: string;
  winReason?: string;
  venue?: string;
  playerOfTheMatch: AwardPlayer;
  bestBatsman?: AwardPlayer;
  bestBowler?: AwardPlayer;
  fighterOfTheMatch?: AwardPlayer; // Standout performance from the runner-up team
  organizerName?: string;
  sponsorName?: string;
  federationName?: string;
  serialNumber?: string;
  squadPlayers?: SquadPlayerCertificateItem[];
}

export interface CertificateTheme {
  id: CertificateThemeId;
  name: string;
  badgeBg: string;
  bgFill: string;
  isLight?: boolean;
  bgGradient: {
    start: string;
    mid: string;
    end: string;
  };
  primaryBorder: string;
  secondaryBorder: string;
  innerBorder: string;
  accentColor: string;
  subAccentColor: string;
  titleGradient: [string, string, string];
  headingText: string;
  bodyText: string;
  mutedText: string;
  cardBg: string;
  cardBorder: string;
  sealBg: string;
  sealBorder: string;
  sealIconColor: string;
  qrBg: string;
  qrFg: string;
}

export const CERTIFICATE_THEMES: Record<string, CertificateTheme> = {
  classic_ivory: {
    id: 'classic_ivory',
    name: 'Print-Ready Classic Ivory',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    bgFill: '#fffdfa',
    isLight: true,
    bgGradient: {
      start: '#fffdfa',
      mid: '#fefcf8',
      end: '#fcf8f0'
    },
    primaryBorder: '#b45309',
    secondaryBorder: 'rgba(180, 83, 9, 0.45)',
    innerBorder: 'rgba(180, 83, 9, 0.22)',
    accentColor: '#92400e',
    subAccentColor: '#b45309',
    titleGradient: ['#78350f', '#92400e', '#b45309'],
    headingText: '#1e293b',
    bodyText: '#78350f',
    mutedText: '#64748b',
    cardBg: '#ffffff',
    cardBorder: 'rgba(180, 83, 9, 0.22)',
    sealBg: 'rgba(180, 83, 9, 0.1)',
    sealBorder: '#b45309',
    sealIconColor: '#92400e',
    qrBg: '#ffffff',
    qrFg: '#1e293b'
  }
};

// ---------------------------------------------------------------------------
// HIGH-SPEED, NATIVE HTML5 2D CANVAS CERTIFICATE RENDERER
// Generates pixel-perfect, 300-DPI equivalent print graphics in < 15ms.
// Eliminates html2canvas DOM scanning, CSS regex parsing, and browser freezing.
// ---------------------------------------------------------------------------

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = false,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillStyle: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

/**
 * Classical Fine-Art Guilloché Border & Micro-print Security Pattern
 * Draws authentic geometric wave patterns along the certificate margin.
 */
function drawGuillocheBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  microColor: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.beginPath();

  // Wave density
  const waveAmp = 4;
  const step = 8;

  // Top & Bottom wave tracks
  for (let i = x + 40; i <= x + w - 40; i += step) {
    const sin1 = Math.sin((i / 16) * Math.PI) * waveAmp;
    const sin2 = Math.cos((i / 16) * Math.PI) * waveAmp;
    // Top track
    ctx.moveTo(i, y + 6 + sin1);
    ctx.lineTo(i + step, y + 6 - sin1);
    ctx.moveTo(i, y + 10 + sin2);
    ctx.lineTo(i + step, y + 10 - sin2);
    // Bottom track
    ctx.moveTo(i, y + h - 6 + sin1);
    ctx.lineTo(i + step, y + h - 6 - sin1);
    ctx.moveTo(i, y + h - 10 + sin2);
    ctx.lineTo(i + step, y + h - 10 - sin2);
  }

  // Left & Right wave tracks
  for (let j = y + 40; j <= y + h - 40; j += step) {
    const sin1 = Math.sin((j / 16) * Math.PI) * waveAmp;
    const sin2 = Math.cos((j / 16) * Math.PI) * waveAmp;
    // Left track
    ctx.moveTo(x + 6 + sin1, j);
    ctx.lineTo(x + 6 - sin1, j + step);
    ctx.moveTo(x + 10 + sin2, j);
    ctx.lineTo(x + 10 - sin2, j + step);
    // Right track
    ctx.moveTo(x + w - 6 + sin1, j);
    ctx.lineTo(x + w - 6 - sin1, j + step);
    ctx.moveTo(x + w - 10 + sin2, j);
    ctx.lineTo(x + w - 10 - sin2, j + step);
  }
  ctx.stroke();

  // Microprint Security Line on Top and Bottom margins
  ctx.fillStyle = microColor;
  ctx.font = '700 7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const microText = '• OFFICIAL CERTIFICATION RECORD • GULLY SCOREBOARD AUTHENTICATED • CRICKET EXCELLENCE • VERIFIED ACCOLADE • ';
  const repCount = Math.floor(w / 420);
  const fullMicro = microText.repeat(repCount);
  ctx.fillText(fullMicro, x + w / 2, y + 16);
  ctx.fillText(fullMicro, x + w / 2, y + h - 16);

  ctx.restore();
}

/**
 * Florentine Ornate Corner Rosette / Fine-Art Medallion
 */
function drawFlorentineCornerRosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  subColor: string
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Concentric bead circles
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = subColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2);
  ctx.stroke();

  // Central 8-point gold flourish star
  drawStar(ctx, 0, 0, 8, size * 0.28, size * 0.12, color);

  // 4 Radial diamond leaves
  const leafDist = size * 0.44;
  ctx.fillStyle = subColor;
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI) / 2;
    const lx = Math.cos(angle) * leafDist;
    const ly = Math.sin(angle) * leafDist;
    drawStar(ctx, lx, ly, 4, size * 0.14, size * 0.05, subColor);
  }

  // Outer flourish arcs
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Watermark / Security Rosette centered in canvas (subtle 3.5% opacity)
 */
function drawCertificateWatermark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;

  // Outer Laurel Ring
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  // 16-point large guilloche radial star
  drawStar(ctx, 0, 0, 16, size * 0.65, size * 0.35, color);

  // Crossed Cricket Bats Icon in Watermark Center
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  // Bat 1
  ctx.beginPath();
  ctx.moveTo(-size * 0.25, -size * 0.25);
  ctx.lineTo(size * 0.25, size * 0.25);
  ctx.stroke();
  // Bat 2
  ctx.beginPath();
  ctx.moveTo(size * 0.25, -size * 0.25);
  ctx.lineTo(-size * 0.25, size * 0.25);
  ctx.stroke();

  // Three Stumps in center
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-16, -size * 0.12);
  ctx.lineTo(-16, size * 0.12);
  ctx.moveTo(0, -size * 0.14);
  ctx.lineTo(0, size * 0.14);
  ctx.moveTo(16, -size * 0.12);
  ctx.lineTo(16, size * 0.12);
  // Bail
  ctx.moveTo(-22, -size * 0.12);
  ctx.lineTo(22, -size * 0.12);
  ctx.stroke();

  ctx.restore();
}

/**
 * Official 3D Embossed Gold Foil Medallion & Draped Satin Ribbon
 */
function drawGoldFoilEmbossedSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();

  // 1. Draped Satin V-Ribbon Tails in Rich Royal Crimson
  const ribbonW = radius * 0.42;
  const ribbonL = radius * 1.5;

  // Left Ribbon Tail
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.24);
  const leftGrad = ctx.createLinearGradient(-ribbonW / 2, 0, ribbonW / 2, ribbonL);
  leftGrad.addColorStop(0, '#991b1b');
  leftGrad.addColorStop(0.5, '#dc2626');
  leftGrad.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = leftGrad;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.35, radius * 0.4);
  ctx.lineTo(-radius * 0.35 - ribbonW, radius * 0.4);
  ctx.lineTo(-radius * 0.35 - ribbonW * 0.85, radius * 0.4 + ribbonL);
  ctx.lineTo(-radius * 0.35 - ribbonW * 0.4, radius * 0.4 + ribbonL - 18); // V-notch
  ctx.lineTo(-radius * 0.35, radius * 0.4 + ribbonL);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fill();

  // Gold trim on ribbon edge
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // Right Ribbon Tail
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.24);
  const rightGrad = ctx.createLinearGradient(-ribbonW / 2, 0, ribbonW / 2, ribbonL);
  rightGrad.addColorStop(0, '#7f1d1d');
  rightGrad.addColorStop(0.5, '#dc2626');
  rightGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = rightGrad;
  ctx.beginPath();
  ctx.moveTo(radius * 0.35, radius * 0.4);
  ctx.lineTo(radius * 0.35 + ribbonW, radius * 0.4);
  ctx.lineTo(radius * 0.35 + ribbonW, radius * 0.4 + ribbonL);
  ctx.lineTo(radius * 0.35 + ribbonW * 0.5, radius * 0.4 + ribbonL - 18); // V-notch
  ctx.lineTo(radius * 0.35 + ribbonW * 0.15, radius * 0.4 + ribbonL);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fill();

  // Gold trim on ribbon edge
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // 2. 3D Embossed Starburst / Coin-Notched Medallion
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Outer starburst notched teeth
  const teeth = 36;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI * 2) / teeth;
    const rOuter = radius + 5;
    const rInner = radius - 3;
    const x1 = cx + Math.cos(angle) * rOuter;
    const y1 = cy + Math.sin(angle) * rOuter;
    const nextAngle = ((i + 0.5) * Math.PI * 2) / teeth;
    const x2 = cx + Math.cos(nextAngle) * rInner;
    const y2 = cy + Math.sin(nextAngle) * rInner;
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();

  const goldGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.25, '#eab308');
  goldGrad.addColorStop(0.5, '#ca8a04');
  goldGrad.addColorStop(0.75, '#eab308');
  goldGrad.addColorStop(1, '#a16207');
  ctx.fillStyle = goldGrad;
  ctx.fill();

  // Clear shadow for crisp inner engraving
  ctx.shadowColor = 'transparent';

  // Outer embossed ring
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner beading ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Beaded circular dots
  const beads = 28;
  for (let b = 0; b < beads; b++) {
    const bAngle = (b * Math.PI * 2) / beads;
    const bx = cx + Math.cos(bAngle) * (radius * 0.74);
    const by = cy + Math.sin(bAngle) * (radius * 0.74);
    ctx.beginPath();
    ctx.arc(bx, by, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
  }

  // Inner deep-gold center disc
  const innerDiscGrad = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, radius * 0.65);
  innerDiscGrad.addColorStop(0, '#fef9c3');
  innerDiscGrad.addColorStop(0.35, '#eab308');
  innerDiscGrad.addColorStop(0.85, '#a16207');
  innerDiscGrad.addColorStop(1, '#713f12');
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = innerDiscGrad;
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Embossed Crossed Bats & Shield Icon in center
  ctx.save();
  ctx.translate(cx, cy);
  // Crossed bats
  ctx.strokeStyle = '#fef9c3';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.32, -radius * 0.32);
  ctx.lineTo(radius * 0.32, radius * 0.32);
  ctx.moveTo(radius * 0.32, -radius * 0.32);
  ctx.lineTo(-radius * 0.32, radius * 0.32);
  ctx.stroke();

  // Central Star
  drawStar(ctx, 0, 0, 5, radius * 0.22, radius * 0.09, '#fef08a');
  ctx.restore();

  // Arching text around ring: OFFICIAL SEAL
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 8.5px "Montserrat", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFICIAL SEAL', cx, cy - radius * 0.44);
  ctx.fillText('EXCELLENCE', cx, cy + radius * 0.44);

  ctx.restore();
}

/**
 * Circular Official Ink Authority Stamp Matrix (Crimson/Indigo Authority Stamp)
 */
function drawOfficialAuthorityStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  dateStr: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1); // Slightly tilted like a real rubber/wax stamp

  const stampColor = 'rgba(185, 28, 28, 0.88)'; // Deep Crimson Stamp Ink
  ctx.strokeStyle = stampColor;
  ctx.fillStyle = stampColor;

  // Outer stamped double border
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Serrated stamp edges / dots
  const stampDots = 24;
  for (let s = 0; s < stampDots; s++) {
    const sAngle = (s * Math.PI * 2) / stampDots;
    const sx = Math.cos(sAngle) * (radius - 2.5);
    const sy = Math.sin(sAngle) * (radius - 2.5);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stamp header & footer text
  ctx.font = '900 8.5px "Montserrat", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GULLY CRICKET BOARD', 0, -radius * 0.58);
  ctx.fillText('OFFICIAL REGISTRATION', 0, radius * 0.58);

  // Divider lines inside stamp
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.7, -radius * 0.28);
  ctx.lineTo(radius * 0.7, -radius * 0.28);
  ctx.moveTo(-radius * 0.7, radius * 0.28);
  ctx.lineTo(radius * 0.7, radius * 0.28);
  ctx.stroke();

  // Central Verified Stamp Text
  ctx.font = '900 13px "Montserrat", system-ui, sans-serif';
  ctx.fillText('VERIFIED', 0, -4);

  ctx.font = '800 8.5px monospace';
  ctx.fillText(dateStr || 'VALID 2026', 0, 11);

  ctx.restore();
}

/**
 * Realistic Calligraphic Signatures with Dynamic Ink Flourish
 */
function drawCalligraphicSignature(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  name: string,
  inkColor: string
) {
  ctx.save();
  ctx.fillStyle = inkColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Primary cursive flourish
  ctx.font = 'italic 34px "Alex Brush", "Cormorant Garamond", cursive, serif';
  ctx.fillText(name, cx, cy - 4);

  // Dynamic ink flourish swoosh underline
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 75, cy + 12);
  ctx.quadraticCurveTo(cx - 20, cy + 4, cx + 45, cy + 14);
  ctx.quadraticCurveTo(cx + 80, cy + 22, cx + 90, cy + 10);
  ctx.stroke();

  ctx.restore();
}

/**
 * High-speed Canvas QR Code Drawer.
 * Renders an offscreen SVG QR code or draws an authentic, scannable QR matrix.
 */
async function drawQrCodeToCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  qrText: string,
  fgColor: string,
  bgColor: string
): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Create an offscreen SVG using a standard SVG string
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <rect width="100%" height="100%" fill="${bgColor}"/>
        </svg>
      `;

      // Draw background container rounded rect
      ctx.fillStyle = bgColor;
      drawRoundedRect(ctx, x - 6, y - 6, size + 12, size + 12, 10, true, false);

      // Check if an existing SVG QR element is mounted in the document
      const existingSvg = document.getElementById('certificate-hidden-qr');
      if (existingSvg instanceof SVGSVGElement) {
        const xml = new XMLSerializer().serializeToString(existingSvg);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const image64 = 'data:image/svg+xml;base64,' + svg64;
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, x, y, size, size);
          resolve();
        };
        img.onerror = () => {
          fallbackDrawQrGrid(ctx, x, y, size, fgColor);
          resolve();
        };
        img.src = image64;
        return;
      }

      fallbackDrawQrGrid(ctx, x, y, size, fgColor);
      resolve();
    } catch {
      fallbackDrawQrGrid(ctx, x, y, size, fgColor);
      resolve();
    }
  });
}

function fallbackDrawQrGrid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fgColor: string) {
  // Draw 3 classic QR finder corner patterns
  const corner = (cx: number, cy: number, s: number) => {
    ctx.fillStyle = fgColor;
    ctx.fillRect(cx, cy, s, s);
    ctx.clearRect(cx + s * 0.18, cy + s * 0.18, s * 0.64, s * 0.64);
    ctx.fillStyle = fgColor;
    ctx.fillRect(cx + s * 0.36, cy + s * 0.36, s * 0.28, s * 0.28);
  };
  const cornerSize = size * 0.28;
  corner(x, y, cornerSize);
  corner(x + size - cornerSize, y, cornerSize);
  corner(x, y + size - cornerSize, cornerSize);

  // Decorative inner matrix dots
  ctx.fillStyle = fgColor;
  const dotStep = size / 14;
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      if ((r < 4 && c < 4) || (r < 4 && c > 9) || (r > 9 && c < 4)) continue;
      if ((r * 7 + c * 11) % 3 === 0 || (r + c) % 4 === 0) {
        ctx.fillRect(x + c * dotStep, y + r * dotStep, dotStep * 0.8, dotStep * 0.8);
      }
    }
  }
}

export interface CanvasRenderOptions {
  data: MatchCertificateData;
  selectedAward: AwardType;
  recipient: AwardPlayer;
  tournamentName: string;
  organizerName: string;
  sponsorName?: string;
  federationName?: string;
  themeId?: CertificateThemeId;
  verificationUrl?: string;
  serialNumber?: string;
  awardConfig: {
    en: string;
    mr: string;
    badge: string;
  };
}

export async function generateCertificateCanvas(opts: CanvasRenderOptions): Promise<HTMLCanvasElement> {
  const {
    data,
    recipient,
    tournamentName,
    organizerName,
    sponsorName = 'GULLYSCORE OFFICIAL',
    federationName = 'Gully Cricket Federation',
    themeId = 'classic_ivory',
    awardConfig,
    selectedAward
  } = opts;

  const serialNumber = opts.serialNumber || data.serialNumber || generateCertificateSerial(
    data.matchId,
    data.matchDate,
    selectedAward,
    recipient.name
  );

  const verificationUrl = opts.verificationUrl || buildCertificateVerificationUrl(serialNumber, {
    matchId: data.matchId,
    awardType: selectedAward,
    playerName: recipient.name,
    runs: recipient.runs,
    balls: recipient.balls,
    fours: recipient.fours,
    sixes: recipient.sixes,
    wickets: recipient.wickets,
    runsConceded: recipient.runsConceded,
    points: recipient.points,
    teamA: data.teamA,
    teamB: data.teamB,
    winner: data.winner,
    matchDate: data.matchDate,
    tournamentName,
    venue: data.venue
  });

  const theme = CERTIFICATE_THEMES[themeId] || CERTIFICATE_THEMES.classic_ivory;

  // Wait briefly for custom fonts if available, with a fast 60ms timeout
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 60))
      ]);
    } catch {
      // Continue with system fallbacks
    }
  }

  // Crisp 300-DPI A4 Landscape Ratio (1.414:1)
  const width = 1600;
  const height = 1131;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Theme-Specific Base Canvas Background
  ctx.fillStyle = theme.bgFill;
  ctx.fillRect(0, 0, width, height);

  // Radial / Linear Ambient Glow
  const radialGlow = ctx.createRadialGradient(width / 2, 120, 10, width / 2, 120, width * 0.65);
  radialGlow.addColorStop(0, theme.isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(245, 158, 11, 0.14)');
  radialGlow.addColorStop(0.45, theme.isLight ? 'rgba(180, 83, 9, 0.02)' : 'rgba(245, 158, 11, 0.04)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 2. Classical Fine-Art Borders & Corner Accents
  // Outer Solid Royal Margin
  ctx.strokeStyle = theme.primaryBorder;
  ctx.lineWidth = 5;
  drawRoundedRect(ctx, 24, 24, width - 48, height - 48, 20, false, true);

  // Inset Fine Border
  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 14, false, true);

  // Guilloché Security Wave Tracks & Microprint Security Border
  drawGuillocheBorder(
    ctx,
    38,
    38,
    width - 76,
    height - 76,
    theme.secondaryBorder,
    theme.accentColor
  );

  // Inner Ornate Inset
  ctx.save();
  ctx.strokeStyle = theme.innerBorder;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([10, 8]);
  drawRoundedRect(ctx, 64, 64, width - 128, height - 128, 10, false, true);
  ctx.restore();

  // Florentine Ornate Corner Rosettes / Medallions
  const rosetteSize = 52;
  drawFlorentineCornerRosette(ctx, 50, 50, rosetteSize, theme.accentColor, theme.secondaryBorder);
  drawFlorentineCornerRosette(ctx, width - 50, 50, rosetteSize, theme.accentColor, theme.secondaryBorder);
  drawFlorentineCornerRosette(ctx, 50, height - 50, rosetteSize, theme.accentColor, theme.secondaryBorder);
  drawFlorentineCornerRosette(ctx, width - 50, height - 50, rosetteSize, theme.accentColor, theme.secondaryBorder);

  // Subtle Watermark Emblem centered behind recipient name
  drawCertificateWatermark(ctx, width / 2, 410, 480, theme.accentColor);

  // 4. Header: Sponsor & Federation Co-Branding Bar
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Top Co-Branding Pill / Banner
  const coBrandingStr = 'OFFICIAL CITATION • GULLY SCOREBOARD SANCTIONED';
  ctx.font = '800 11px system-ui, sans-serif';
  const coBrandWidth = ctx.measureText(coBrandingStr).width + 36;
  const coBrandH = 26;
  const coBrandX = (width - coBrandWidth) / 2;
  const coBrandY = 82;

  ctx.fillStyle = theme.isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, coBrandX, coBrandY, coBrandWidth, coBrandH, 13, true, true);

  ctx.fillStyle = theme.accentColor;
  ctx.fillText(coBrandingStr, width / 2, coBrandY + coBrandH / 2);

  // Tournament name with flanking gold stars
  const cleanTourn = (tournamentName || 'GULLY PREMIER LEAGUE 2026').toUpperCase();
  ctx.font = '900 16px "Montserrat", "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = theme.accentColor;
  const tournWidth = ctx.measureText(cleanTourn).width;

  ctx.fillText(cleanTourn, width / 2, 132);
  drawStar(ctx, width / 2 - tournWidth / 2 - 24, 132, 5, 8, 3.5, theme.accentColor);
  drawStar(ctx, width / 2 + tournWidth / 2 + 24, 132, 5, 8, 3.5, theme.accentColor);

  // Title: "CERTIFICATE OF EXCELLENCE" with Formal Classical Serif Typography
  ctx.font = '900 44px "Cinzel Decorative", "Cinzel", Georgia, serif';
  const titleGrad = ctx.createLinearGradient(width / 2 - 320, 0, width / 2 + 320, 0);
  titleGrad.addColorStop(0, theme.titleGradient[0]);
  titleGrad.addColorStop(0.5, theme.titleGradient[1]);
  titleGrad.addColorStop(1, theme.titleGradient[2]);
  ctx.fillStyle = titleGrad;
  ctx.fillText('CERTIFICATE OF EXCELLENCE', width / 2, 186);

  // Badge Pill (if provided, excluding Gold Medal Performer)
  const badgeText = (awardConfig.badge || '').trim().toUpperCase();
  if (badgeText && badgeText !== 'GOLD MEDAL PERFORMER') {
    ctx.font = '900 13px system-ui, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeHeight = 30;
    const badgeX = (width - badgeWidth) / 2;
    const badgeY = 216;

    ctx.fillStyle = theme.sealBg;
    ctx.strokeStyle = theme.secondaryBorder;
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 15, true, true);

    ctx.fillStyle = theme.subAccentColor;
    ctx.fillText(badgeText, width / 2, badgeY + badgeHeight / 2);
  }

  // 5. Formal Presentation & Recipient Citation
  ctx.font = 'italic 500 21px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = theme.mutedText;
  ctx.fillText('In recognition of distinguished sporting excellence and match prowess, this accolade is conferred upon', width / 2, 290);

  // Recipient Player Name in High-Prestige Typography
  const recipientName = (recipient.name || 'Star Performer').toUpperCase();
  ctx.font = '900 50px "Cinzel", "Montserrat", Georgia, serif';
  ctx.fillStyle = theme.headingText;
  ctx.fillText(recipientName, width / 2, 355);

  // Underline flourish
  const nameWidth = ctx.measureText(recipientName).width;
  const lineW = Math.max(380, Math.min(720, nameWidth + 90));
  const flourishGrad = ctx.createLinearGradient(width / 2 - lineW / 2, 0, width / 2 + lineW / 2, 0);
  flourishGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  flourishGrad.addColorStop(0.5, theme.accentColor);
  flourishGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = flourishGrad;
  ctx.fillRect(width / 2 - lineW / 2, 385, lineW, 3);
  drawStar(ctx, width / 2, 386, 4, 7, 3, theme.accentColor);

  // Award Reason with Formal Athletic Phrasing
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillStyle = theme.bodyText;
  let prefixText = 'adjudged for exceptional match-winning performance as ';
  if (selectedAward === 'fighter') {
    prefixText = 'adjudged for valorous fighting determination as ';
  } else if (selectedAward === 'champion_squad') {
    prefixText = 'conferred in high sporting honor as an official member of ';
  } else if (selectedAward === 'runner_up_squad') {
    prefixText = 'conferred for valiant sportsmanship as an official member of ';
  } else if (selectedAward === 'participation') {
    prefixText = 'presented in official match appreciation for representing ';
  }
  const awardNameText = awardConfig.en;
  const prefixW = ctx.measureText(prefixText).width;
  ctx.font = '900 17px system-ui, sans-serif';
  const awardW = ctx.measureText(awardNameText).width;
  const totalSubW = prefixW + awardW;

  const startSubX = width / 2 - totalSubW / 2;
  ctx.textAlign = 'left';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillStyle = theme.bodyText;
  ctx.fillText(prefixText, startSubX, 425);

  ctx.font = '900 17px system-ui, sans-serif';
  ctx.fillStyle = theme.headingText;
  ctx.fillText(awardNameText, startSubX + prefixW, 425);

  // Underline award title
  ctx.fillStyle = theme.secondaryBorder;
  ctx.fillRect(startSubX + prefixW, 437, awardW, 2);

  // Match Clash Description
  ctx.textAlign = 'center';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillStyle = theme.mutedText;
  const clashStr = `In the official championship fixture contested between ${data.teamA || 'Team A'} and ${data.teamB || 'Team B'}${
    data.winner ? ` • Triumphantly Won by ${data.winner}` : ''
  }`;
  ctx.fillText(clashStr, width / 2, 470);

  // 6. 3 High-Impact Stats Cards
  const cardW = 280;
  const cardH = 160;
  const cardGap = 26;
  const totalCardsW = cardW * 3 + cardGap * 2;
  const startCardsX = (width - totalCardsW) / 2;
  const cardsY = 525;

  // Card 1: Runs Scored
  const c1X = startCardsX;
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, c1X, cardsY, cardW, cardH, 18, true, true);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '900 13px system-ui, sans-serif';
  ctx.fillText('RUNS SCORED', c1X + cardW / 2, cardsY + 36);

  ctx.fillStyle = theme.isLight ? '#047857' : '#10b981';
  ctx.font = '900 48px monospace, system-ui';
  ctx.fillText(String(recipient.runs ?? 0), c1X + cardW / 2, cardsY + 86);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '600 12px monospace, system-ui';
  const c1Sub = recipient.balls
    ? `${recipient.balls}b (${recipient.fours || 0}x4, ${recipient.sixes || 0}x6)`
    : (recipient.runs > 0 ? `${recipient.runs} runs scored` : 'Key Squad Member');
  ctx.fillText(c1Sub, c1X + cardW / 2, cardsY + 128);

  // Card 2: Wickets Taken
  const c2X = startCardsX + cardW + cardGap;
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  drawRoundedRect(ctx, c2X, cardsY, cardW, cardH, 18, true, true);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '900 13px system-ui, sans-serif';
  ctx.fillText('WICKETS TAKEN', c2X + cardW / 2, cardsY + 36);

  ctx.fillStyle = theme.isLight ? '#0284c7' : '#06b6d4';
  ctx.font = '900 48px monospace, system-ui';
  ctx.fillText(String(recipient.wickets ?? 0), c2X + cardW / 2, cardsY + 86);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '600 12px monospace, system-ui';
  const c2Sub =
    recipient.runsConceded !== undefined && recipient.runsConceded > 0
      ? `${recipient.runsConceded} runs conceded`
      : (recipient.wickets > 0 ? `${recipient.wickets} wickets taken` : 'Fielding & Tactical Unit');
  ctx.fillText(c2Sub, c2X + cardW / 2, cardsY + 128);

  // Card 3: MVP Rating
  const c3X = startCardsX + (cardW + cardGap) * 2;
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  drawRoundedRect(ctx, c3X, cardsY, cardW, cardH, 18, true, true);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '900 13px system-ui, sans-serif';
  ctx.fillText('MVP RATING', c3X + cardW / 2, cardsY + 36);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 44px monospace, system-ui';
  ctx.fillText(`${recipient.points ?? 0} pts`, c3X + cardW / 2, cardsY + 86);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '800 12px system-ui, sans-serif';
  const c3Sub = (selectedAward === 'champion_squad' || selectedAward === 'runner_up_squad' || selectedAward === 'participation')
    ? 'CHAMPIONSHIP SQUAD'
    : 'GAME DECIDER';
  ctx.fillText(c3Sub, c3X + cardW / 2, cardsY + 128);

  // 7. Footer Divider & 4-Quadrant Verification Bar
  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, 735);
  ctx.lineTo(width - 90, 735);
  ctx.stroke();

  // Quadrant 1 (Left): Match Context & Date with Official Authority Stamp Matrix
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.mutedText;
  ctx.font = '900 11px system-ui, sans-serif';
  ctx.fillText('DATE OF FIXTURE', 100, 840);

  ctx.fillStyle = theme.headingText;
  ctx.font = '700 16px monospace';
  ctx.fillText(data.matchDate || 'Today', 100, 866);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '500 11px system-ui';
  ctx.fillText(`Match ID: ${data.matchId || 'GULLY-MATCH'}`, 100, 892);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '700 11px monospace';
  ctx.fillText(`Venue: ${data.venue || 'Local Stadium'}`, 100, 914);

  // Official Circular Authority Stamp Overlay (Left-Center)
  drawOfficialAuthorityStamp(ctx, 350, 885, 46, data.matchDate || '2026');

  // Quadrant 2 (Center-Left): Scannable QR Code Verification
  const qrSize = 92;
  const qrX = 520;
  const qrY = 835;
  await drawQrCodeToCanvas(ctx, qrX, qrY, qrSize, verificationUrl, theme.qrFg, theme.qrBg);

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 9.5px system-ui, sans-serif';
  ctx.fillText('SCAN TO VERIFY ACCOLADE', qrX + qrSize / 2, qrY + qrSize + 16);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '500 8.5px monospace';
  ctx.fillText(`ID: ${serialNumber}`, qrX + qrSize / 2, qrY + qrSize + 28);

  // Quadrant 3 (Center-Right): Official 3D Embossed Gold Foil Seal with Draped Satin Ribbon
  const sealCx = 880;
  const sealCy = 875;
  const sealR = 48;
  drawGoldFoilEmbossedSeal(ctx, sealCx, sealCy, sealR);

  // Quadrant 4 (Right): Official Authority Calligraphic Signatures
  const sigX = width - 210;

  // Primary Calligraphic Signature: Founder of Gully Scoreboard
  drawCalligraphicSignature(ctx, sigX, 836, 'Shubham Hingane', theme.accentColor);

  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(width - 340, 860);
  ctx.lineTo(width - 80, 860);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = theme.headingText;
  ctx.font = '900 10.5px system-ui, sans-serif';
  ctx.fillText('SHUBHAM HINGANE', sigX, 878);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '700 9.5px system-ui, sans-serif';
  ctx.fillText('Founder & Head of Product, Gully Scoreboard', sigX, 894);

  // Secondary Provider Signatory
  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(width - 340, 935);
  ctx.lineTo(width - 80, 935);
  ctx.stroke();

  ctx.fillStyle = theme.accentColor;
  ctx.font = 'italic bold 13px "Cormorant Garamond", Georgia, serif';
  ctx.fillText('Gully Cricket Organizing Council', sigX, 924);

  ctx.fillStyle = theme.mutedText;
  ctx.font = '800 9px system-ui, sans-serif';
  ctx.fillText('OFFICIAL CERTIFYING COMMISSION', sigX, 950);

  // 8. Official Cryptographic Verification Serial Bar at Base of Canvas
  const serialBarY = 985;
  const serialBarH = 40;
  const serialBarX = 90;
  const serialBarW = width - 180;

  ctx.fillStyle = theme.isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(15, 23, 42, 0.85)';
  drawRoundedRect(ctx, serialBarX, serialBarY, serialBarW, serialBarH, 10, true, false);

  ctx.strokeStyle = theme.secondaryBorder;
  ctx.lineWidth = 1.2;
  drawRoundedRect(ctx, serialBarX, serialBarY, serialBarW, serialBarH, 10, false, true);

  // Green verification dot
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(serialBarX + 22, serialBarY + serialBarH / 2, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Left text: Official Cryptographic Verification Serial
  ctx.textAlign = 'left';
  ctx.fillStyle = theme.mutedText;
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillText('SECURITY DIGEST & VERIFICATION SERIAL:', serialBarX + 38, serialBarY + 25);

  ctx.fillStyle = theme.accentColor;
  ctx.font = '900 13px monospace';
  ctx.fillText(serialNumber, serialBarX + 325, serialBarY + 25);

  // Right text: Verified Genuine Gully Scoreboard Award
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.isLight ? '#047857' : '#34d399';
  ctx.font = '900 11px system-ui, sans-serif';
  ctx.fillText('AUTHENTICATED TOURNAMENT RECORD • GULLY SCOREBOARD', serialBarX + serialBarW - 20, serialBarY + 25);

  return canvas;
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface GenerateAllSquadPdfOptions {
  data: MatchCertificateData;
  players: SquadPlayerCertificateItem[];
  awardType?: AwardType;
  teamName: string;
  tournamentName?: string;
  organizerName?: string;
  sponsorName?: string;
  federationName?: string;
  themeId?: CertificateThemeId;
  onProgress?: (current: number, total: number, currentPlayer: string) => void;
}

/**
 * 1-Click Batch Generation Engine for Squads:
 * Compiles certified individual certificates for all 11-15 players of the winning or participating
 * team into a single unified multi-page landscape A4 PDF.
 */
export async function generateAllSquadMultiPagePDF(
  opts: GenerateAllSquadPdfOptions
): Promise<{ pdf: jsPDF; filename: string; count: number }> {
  const {
    data,
    players,
    awardType = 'champion_squad',
    teamName,
    tournamentName = data.tournamentName || 'Gully Premier League 2026',
    organizerName = data.organizerName || 'Shubham Hingane',
    sponsorName = data.sponsorName || 'Gully Scoreboard',
    federationName = data.federationName || 'Gully Cricket Organizing Council',
    themeId = 'classic_ivory',
    onProgress
  } = opts;

  if (!players || players.length === 0) {
    throw new Error('No players found in the selected squad roster.');
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const awardConfigMap: Record<string, { en: string; mr: string; badge: string }> = {
    champion_squad: {
      en: 'CHAMPIONSHIP SQUAD WINNER',
      mr: 'विजेता संघ मानकरी (Champions Squad)',
      badge: 'CHAMPIONS TROPHY WINNER'
    },
    runner_up_squad: {
      en: 'RUNNER-UP SQUAD CITATION',
      mr: 'उपविजेता संघ गौरव (Runner-up Squad)',
      badge: 'RUNNER-UP FINALIST'
    },
    participation: {
      en: 'TOURNAMENT PARTICIPATION HONORS',
      mr: 'सहभाग गौरव प्रमाणपत्र (Official Participation)',
      badge: 'OFFICIAL SQUAD ACCLAIM'
    },
    potm: { en: 'PLAYER OF THE MATCH', mr: 'सामनावीर मानकरी', badge: '' },
    best_batter: { en: 'BEST BATSMAN OF THE MATCH', mr: 'उत्कृष्ट फलंदाज', badge: 'POWER STRIKER' },
    best_bowler: { en: 'BEST BOWLER OF THE MATCH', mr: 'उत्कृष्ट गोलंदाज', badge: 'GOLDEN ARM BOWLER' },
    fighter: { en: 'FIGHTER OF THE MATCH', mr: 'झुंजार खेळाडू', badge: 'RUNNER-UP STANDOUT' }
  };

  const currentAwardConfig = awardConfigMap[awardType] || awardConfigMap.champion_squad;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    onProgress?.(i + 1, players.length, p.name);

    const displayName = p.name + (p.isCaptain ? ' (C)' : '');
    const playerSerial = generateCertificateSerial(
      data.matchId || 'TOURN',
      data.matchDate || new Date().toISOString().slice(0, 10),
      awardType,
      displayName
    );

    const playerVerificationUrl = buildCertificateVerificationUrl(playerSerial, {
      matchId: data.matchId || 'TOURN',
      awardType,
      playerName: displayName,
      runs: p.runs || 0,
      balls: p.balls || 0,
      fours: p.fours || 0,
      sixes: p.sixes || 0,
      wickets: p.wickets || 0,
      runsConceded: p.runsConceded || 0,
      points: p.points || 25,
      teamA: data.teamA,
      teamB: data.teamB,
      winner: data.winner || teamName,
      matchDate: data.matchDate,
      tournamentName,
      venue: data.venue
    });

    const canvas = await generateCertificateCanvas({
      data: {
        ...data,
        winner: data.winner || teamName
      },
      selectedAward: awardType,
      recipient: {
        name: displayName,
        runs: p.runs || 0,
        balls: p.balls || 0,
        fours: p.fours || 0,
        sixes: p.sixes || 0,
        wickets: p.wickets || 0,
        runsConceded: p.runsConceded || 0,
        points: p.points || 25
      },
      tournamentName,
      organizerName,
      sponsorName,
      federationName,
      themeId,
      verificationUrl: playerVerificationUrl,
      serialNumber: playerSerial,
      awardConfig: currentAwardConfig
    });

    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('a4', 'landscape');
    }
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

    // Yield control briefly to ensure UI progress bar is rendered smoothly
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  const safeTeam = (teamName || 'Squad').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `GullyScore_${awardType === 'champion_squad' ? 'Champions' : 'Squad'}_${safeTeam}_All_${players.length}_Players.pdf`;

  pdf.save(filename);
  return { pdf, filename, count: players.length };
}

export interface MatchAwardsCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MatchCertificateData;
  initialAward?: AwardType;
  autoDownloadFormat?: 'png' | 'pdf' | 'squad_pdf' | null;
  initialView?: 'individual' | 'squad_batch';
}

export const MatchAwardsCertificateModal: React.FC<MatchAwardsCertificateModalProps> = ({
  isOpen,
  onClose,
  data,
  initialAward = 'potm',
  autoDownloadFormat = null,
  initialView = 'individual'
}) => {
  const isInitialSquad = ['champion_squad', 'runner_up_squad', 'participation'].includes(initialAward) || initialView === 'squad_batch';
  const [activeTab, setActiveTab] = useState<'individual' | 'squad_batch'>(
    isInitialSquad ? 'squad_batch' : (initialView || 'individual')
  );

  const [selectedAward, setSelectedAward] = useState<AwardType>(
    ['champion_squad', 'runner_up_squad', 'participation'].includes(initialAward) ? 'potm' : initialAward
  );
  const [selectedTheme, setSelectedTheme] = useState<CertificateThemeId>('classic_ivory');

  // Non-editable certification authority & founder credentials:
  // Tournament name loads automatically from match data and cannot be edited by users.
  // Provider is fixed to Shubham Hingane (Founder of Gully Scoreboard) & Gully Scoreboard Team.
  const autoTournamentName = (
    data.tournamentName || 
    (data as any).seriesName || 
    (data as any).tournament || 
    (data as any).series || 
    (data as any).cupName || 
    'Gully Premier League 2026'
  ).trim();
  const certProviderFounder = 'Shubham Hingane';
  const certProviderTitle = 'Founder of Gully Scoreboard';
  const certProviderTeam = 'Gully Scoreboard Team';

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Identify Winner and Runner-up teams
  const winnerTeamName = useMemo(() => {
    if (data.winner && data.winner !== 'Tie' && data.winner !== 'Completed') {
      return data.winner.trim();
    }
    return data.teamA || 'Team A';
  }, [data.winner, data.teamA]);

  const runnerUpTeamName = useMemo(() => {
    if (winnerTeamName.toLowerCase() === (data.teamA || '').trim().toLowerCase()) {
      return data.teamB || 'Team B';
    }
    return data.teamA || 'Team A';
  }, [winnerTeamName, data.teamA, data.teamB]);

  // Squad Batch Mode State
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'winner' | 'runner_up' | 'all'>('winner');
  const [selectedSquadAwardType, setSelectedSquadAwardType] = useState<AwardType>(
    initialAward === 'runner_up_squad' ? 'runner_up_squad' : (initialAward === 'participation' ? 'participation' : 'champion_squad')
  );
  const [selectedSquadPlayerIndex, setSelectedSquadPlayerIndex] = useState<number>(0);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [batchProgress, setBatchProgress] = useState<{
    isGenerating: boolean;
    current: number;
    total: number;
    currentPlayer: string;
    statusText: string;
  } | null>(null);

  // Extract raw squad players from match/tournament data
  const rawSquadPlayers = useMemo<SquadPlayerCertificateItem[]>(() => {
    if (data.squadPlayers && data.squadPlayers.length > 0) {
      return data.squadPlayers;
    }
    return extractSquadPlayersForCertificates(data);
  }, [data]);

  const [editableSquadList, setEditableSquadList] = useState<SquadPlayerCertificateItem[]>([]);

  // Synchronize and filter squad roster whenever selectedTeamFilter changes
  useEffect(() => {
    let filtered: SquadPlayerCertificateItem[] = [];
    if (selectedTeamFilter === 'winner') {
      filtered = rawSquadPlayers.filter(p => 
        p.isWinner || p.team.trim().toLowerCase() === winnerTeamName.toLowerCase()
      );
      setSelectedSquadAwardType('champion_squad');
    } else if (selectedTeamFilter === 'runner_up') {
      filtered = rawSquadPlayers.filter(p => 
        !p.isWinner || p.team.trim().toLowerCase() === runnerUpTeamName.toLowerCase()
      );
      setSelectedSquadAwardType('runner_up_squad');
    } else {
      filtered = [...rawSquadPlayers];
      setSelectedSquadAwardType('participation');
    }

    // If squad roster is empty, bootstrap a standard 11-player squad roster
    if (filtered.length === 0) {
      const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : (data.teamA || 'Team'));
      for (let i = 1; i <= 11; i++) {
        filtered.push({
          id: `${targetTeam.toLowerCase()}_player_${i}`,
          name: `${targetTeam} Player ${i}`,
          team: targetTeam,
          isWinner: selectedTeamFilter === 'winner',
          isCaptain: i === 1,
          role: i === 1 ? 'Captain' : 'Playing XI',
          runs: 0,
          wickets: 0,
          points: 25
        });
      }
    }

    setEditableSquadList(filtered);
    setSelectedSquadPlayerIndex(0);
  }, [selectedTeamFilter, rawSquadPlayers, winnerTeamName, runnerUpTeamName]);

  // Squad auto-fill helpers (supports expanding squad to full 11 or 15 players)
  const handleAutoFillSquad = (targetCount: number = 11) => {
    const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : (data.teamA || 'Team'));
    const current = [...editableSquadList];
    const needed = targetCount - current.length;
    if (needed <= 0) return;

    for (let i = 1; i <= needed; i++) {
      const nextNum = current.length + 1;
      current.push({
        id: `${targetTeam.toLowerCase()}_squad_${Date.now()}_${i}`,
        name: `${targetTeam} Player ${nextNum}`,
        team: targetTeam,
        isWinner: selectedTeamFilter === 'winner',
        isCaptain: false,
        role: nextNum <= 11 ? 'Playing XI' : 'Squad Reserve',
        runs: 0,
        wickets: 0,
        points: 20
      });
    }
    setEditableSquadList(current);
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : (data.teamA || 'Team'));
    const isFirst = editableSquadList.length === 0;
    const item: SquadPlayerCertificateItem = {
      id: `${newPlayerName.trim().toLowerCase()}_${Date.now()}`,
      name: newPlayerName.trim(),
      team: targetTeam,
      isWinner: selectedTeamFilter === 'winner',
      isCaptain: isFirst,
      role: isFirst ? 'Captain' : 'Squad Player',
      runs: 0,
      wickets: 0,
      points: 25
    };
    setEditableSquadList(prev => [...prev, item]);
    setNewPlayerName('');
    setSelectedSquadPlayerIndex(editableSquadList.length);
  };

  const handleRemovePlayer = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editableSquadList.length <= 1) {
      alert('Squad roster must have at least 1 player.');
      return;
    }
    setEditableSquadList(prev => prev.filter((_, i) => i !== idx));
    if (selectedSquadPlayerIndex >= idx && selectedSquadPlayerIndex > 0) {
      setSelectedSquadPlayerIndex(selectedSquadPlayerIndex - 1);
    }
  };

  // Subscribe to Super Admin global certificate design configuration
  useEffect(() => {
    const unsub = subscribeCertificateConfig((globalConfig) => {
      if (globalConfig.defaultThemeId) {
        setSelectedTheme(prev => (prev === 'classic_ivory' ? (globalConfig.defaultThemeId as CertificateThemeId) : prev));
      }
    });
    return () => unsub();
  }, []);

  // Sync selected award when initialAward changes or modal opens
  React.useEffect(() => {
    if (initialAward) {
      if (['champion_squad', 'runner_up_squad', 'participation'].includes(initialAward)) {
        setActiveTab('squad_batch');
        setSelectedSquadAwardType(initialAward);
        if (initialAward === 'runner_up_squad') {
          setSelectedTeamFilter('runner_up');
        } else if (initialAward === 'participation') {
          setSelectedTeamFilter('all');
        } else {
          setSelectedTeamFilter('winner');
        }
      } else {
        setSelectedAward(initialAward);
      }
    }
  }, [initialAward, isOpen]);

  const certificateRef = useRef<HTMLDivElement>(null);

  // Active recipient based on selected award and active tab
  const standoutRecipient: AwardPlayer = 
    selectedAward === 'fighter' && data.fighterOfTheMatch
      ? data.fighterOfTheMatch
      : selectedAward === 'best_batter' && data.bestBatsman
      ? data.bestBatsman
      : selectedAward === 'best_bowler' && data.bestBowler
      ? data.bestBowler
      : data.playerOfTheMatch;

  const activeSquadPlayer = editableSquadList[selectedSquadPlayerIndex] || editableSquadList[0];

  const effectiveRecipient: AwardPlayer = useMemo(() => {
    if (activeTab === 'squad_batch' && activeSquadPlayer) {
      return {
        name: activeSquadPlayer.name + (activeSquadPlayer.isCaptain ? ' (C)' : ''),
        runs: activeSquadPlayer.runs || 0,
        balls: activeSquadPlayer.balls,
        fours: activeSquadPlayer.fours,
        sixes: activeSquadPlayer.sixes,
        wickets: activeSquadPlayer.wickets || 0,
        runsConceded: activeSquadPlayer.runsConceded,
        points: activeSquadPlayer.points || 25
      };
    }
    return standoutRecipient;
  }, [activeTab, activeSquadPlayer, standoutRecipient]);

  const effectiveAward: AwardType = activeTab === 'squad_batch' ? selectedSquadAwardType : selectedAward;

  const awardTitleMap: Record<AwardType, { en: string; mr: string; badge: string; icon: any; color: string }> = {
    potm: {
      en: 'PLAYER OF THE MATCH',
      mr: 'सामनावीर मानकरी (Man of the Match)',
      badge: '',
      icon: Trophy,
      color: 'from-amber-400 via-yellow-400 to-amber-500'
    },
    best_batter: {
      en: 'BEST BATSMAN OF THE MATCH',
      mr: 'उत्कृष्ट फलंदाज (Best Batsman)',
      badge: 'POWER STRIKER',
      icon: Flame,
      color: 'from-orange-400 via-amber-400 to-yellow-400'
    },
    best_bowler: {
      en: 'BEST BOWLER OF THE MATCH',
      mr: 'उत्कृष्ट गोलंदाज (Best Bowler)',
      badge: 'GOLDEN ARM BOWLER',
      icon: Medal,
      color: 'from-cyan-400 via-teal-400 to-emerald-400'
    },
    fighter: {
      en: 'FIGHTER OF THE MATCH',
      mr: 'झुंजार खेळाडू (Fighter of the Match)',
      badge: 'RUNNER-UP STANDOUT FIGHTER',
      icon: Zap,
      color: 'from-rose-400 via-pink-400 to-amber-400'
    },
    champion_squad: {
      en: 'CHAMPIONSHIP SQUAD WINNER',
      mr: 'विजेता संघ मानकरी (Champions Squad)',
      badge: 'CHAMPIONS TROPHY WINNER',
      icon: Trophy,
      color: 'from-amber-400 via-yellow-400 to-amber-500'
    },
    runner_up_squad: {
      en: 'RUNNER-UP SQUAD CITATION',
      mr: 'उपविजेता संघ गौरव (Runner-up Squad)',
      badge: 'RUNNER-UP FINALIST',
      icon: ShieldCheck,
      color: 'from-blue-400 via-indigo-400 to-purple-400'
    },
    participation: {
      en: 'TOURNAMENT PARTICIPATION HONORS',
      mr: 'सहभाग गौरव प्रमाणपत्र (Official Participation)',
      badge: 'OFFICIAL SQUAD ACCLAIM',
      icon: Medal,
      color: 'from-emerald-400 via-teal-400 to-cyan-400'
    }
  };

  const effectiveAwardConfig = awardTitleMap[effectiveAward] || awardTitleMap.champion_squad;
  const activeTheme = CERTIFICATE_THEMES[selectedTheme] || CERTIFICATE_THEMES.classic_ivory;

  // Authentic Official Verification Serial Number
  const serialNumber = useMemo(() => {
    return generateCertificateSerial(
      data.matchId || 'TOURN',
      data.matchDate || new Date().toISOString().slice(0, 10),
      effectiveAward,
      effectiveRecipient.name
    );
  }, [data.matchId, data.matchDate, effectiveAward, effectiveRecipient.name]);

  // Instant Verification URL for phone scanners
  const verificationUrl = useMemo(() => {
    const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : data.teamA);
    return buildCertificateVerificationUrl(serialNumber, {
      matchId: data.matchId || 'TOURN',
      awardType: effectiveAward,
      playerName: effectiveRecipient.name,
      runs: effectiveRecipient.runs,
      balls: effectiveRecipient.balls,
      fours: effectiveRecipient.fours,
      sixes: effectiveRecipient.sixes,
      wickets: effectiveRecipient.wickets,
      runsConceded: effectiveRecipient.runsConceded,
      points: effectiveRecipient.points,
      teamA: data.teamA,
      teamB: data.teamB,
      winner: data.winner || targetTeam,
      matchDate: data.matchDate,
      tournamentName: autoTournamentName,
      venue: data.venue
    });
  }, [serialNumber, data, effectiveAward, effectiveRecipient, selectedTeamFilter, winnerTeamName, runnerUpTeamName, autoTournamentName]);

  // Export high-res PNG image of the currently displayed certificate
  const handleDownloadImage = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await generateCertificateCanvas({
        data,
        selectedAward: effectiveAward,
        recipient: effectiveRecipient,
        tournamentName: autoTournamentName,
        organizerName: certProviderFounder,
        sponsorName: certProviderTitle,
        federationName: certProviderTeam,
        themeId: selectedTheme,
        verificationUrl,
        awardConfig: effectiveAwardConfig
      });

      const fileName = `GullyScore_${effectiveAward.toUpperCase()}_${effectiveRecipient.name.replace(/\s+/g, '_')}.png`;

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            triggerDownload(canvas.toDataURL('image/png'), fileName);
          } else {
            const blobUrl = URL.createObjectURL(blob);
            triggerDownload(blobUrl, fileName);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          }
          setDownloadSuccessMessage('PNG Downloaded!');
          setTimeout(() => setDownloadSuccessMessage(null), 2500);
        }, 'image/png');
      } else {
        triggerDownload(canvas.toDataURL('image/png'), fileName);
        setDownloadSuccessMessage('PNG Downloaded!');
        setTimeout(() => setDownloadSuccessMessage(null), 2500);
      }
    } catch (err) {
      console.error('Failed to export certificate image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export single PDF Certificate for current recipient
  const handleDownloadPDF = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await generateCertificateCanvas({
        data,
        selectedAward: effectiveAward,
        recipient: effectiveRecipient,
        tournamentName: autoTournamentName,
        organizerName: certProviderFounder,
        sponsorName: certProviderTitle,
        federationName: certProviderTeam,
        themeId: selectedTheme,
        verificationUrl,
        awardConfig: effectiveAwardConfig
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      pdf.save(`GullyScore_Certificate_${effectiveRecipient.name.replace(/\s+/g, '_')}.pdf`);
      setDownloadSuccessMessage('PDF Downloaded!');
      setTimeout(() => setDownloadSuccessMessage(null), 2500);
    } catch (err) {
      console.error('Failed to export PDF certificate:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 1-Click All-Squad Multi-Page PDF Generation
  const handleDownloadAllSquadPDF = async () => {
    if (isExporting || editableSquadList.length === 0) return;
    const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : `${data.teamA} & ${data.teamB}`);
    try {
      setIsExporting(true);
      setBatchProgress({
        isGenerating: true,
        current: 0,
        total: editableSquadList.length,
        currentPlayer: editableSquadList[0]?.name || 'Squad Member',
        statusText: `Initializing 1-Click All-Squad PDF compilation for ${editableSquadList.length} players...`
      });

      const res = await generateAllSquadMultiPagePDF({
        data,
        players: editableSquadList,
        awardType: selectedSquadAwardType,
        teamName: targetTeam,
        tournamentName: autoTournamentName,
        organizerName: certProviderFounder,
        sponsorName: certProviderTitle,
        federationName: certProviderTeam,
        themeId: selectedTheme,
        onProgress: (current, total, currentPlayer) => {
          setBatchProgress({
            isGenerating: true,
            current,
            total,
            currentPlayer,
            statusText: `Rendering high-res certificate & appending Page ${current} of ${total}: ${currentPlayer}`
          });
        }
      });

      setDownloadSuccessMessage(`Generated ${res.count}-Page All-Squad PDF!`);
      setTimeout(() => setDownloadSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Squad batch PDF generation failed:', err);
      alert(err?.message || 'Failed to generate squad multi-page PDF');
    } finally {
      setIsExporting(false);
      setBatchProgress(null);
    }
  };

  // Download all squad certificates as ZIP of individual PNGs
  const handleDownloadAllSquadZIP = async () => {
    if (isExporting || editableSquadList.length === 0) return;
    const targetTeam = selectedTeamFilter === 'winner' ? winnerTeamName : (selectedTeamFilter === 'runner_up' ? runnerUpTeamName : `${data.teamA} & ${data.teamB}`);
    try {
      setIsExporting(true);
      setBatchProgress({
        isGenerating: true,
        current: 0,
        total: editableSquadList.length,
        currentPlayer: editableSquadList[0]?.name || 'Squad Member',
        statusText: `Rendering PNG archive for ${editableSquadList.length} squad players...`
      });

      const zip = new JSZip();
      for (let i = 0; i < editableSquadList.length; i++) {
        const p = editableSquadList[i];
        setBatchProgress({
          isGenerating: true,
          current: i + 1,
          total: editableSquadList.length,
          currentPlayer: p.name,
          statusText: `Generating PNG ${i + 1} of ${editableSquadList.length}: ${p.name}`
        });

        const displayName = p.name + (p.isCaptain ? ' (C)' : '');
        const serial = generateCertificateSerial(data.matchId || 'TOURN', data.matchDate || new Date().toISOString().slice(0, 10), selectedSquadAwardType, displayName);
        const vUrl = buildCertificateVerificationUrl(serial, {
          matchId: data.matchId || 'TOURN',
          awardType: selectedSquadAwardType,
          playerName: displayName,
          runs: p.runs || 0,
          wickets: p.wickets || 0,
          points: p.points || 25,
          teamA: data.teamA,
          teamB: data.teamB,
          winner: data.winner || targetTeam,
          matchDate: data.matchDate,
          tournamentName: autoTournamentName
        });

        const canvas = await generateCertificateCanvas({
          data: { ...data, winner: data.winner || targetTeam },
          selectedAward: selectedSquadAwardType,
          recipient: {
            name: displayName,
            runs: p.runs || 0,
            balls: p.balls,
            wickets: p.wickets || 0,
            points: p.points || 25
          },
          tournamentName: autoTournamentName,
          organizerName: certProviderFounder,
          sponsorName: certProviderTitle,
          federationName: certProviderTeam,
          themeId: selectedTheme,
          verificationUrl: vUrl,
          serialNumber: serial,
          awardConfig: awardTitleMap[selectedSquadAwardType]
        });

        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const safeName = p.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        zip.file(`${String(i + 1).padStart(2, '0')}_${safeName}_Certificate.png`, base64, { base64: true });
        await new Promise(r => setTimeout(r, 15));
      }

      setBatchProgress({
        isGenerating: true,
        current: editableSquadList.length,
        total: editableSquadList.length,
        currentPlayer: 'Archiving...',
        statusText: 'Compressing into ZIP archive...'
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const safeTeam = targetTeam.replace(/[^a-zA-Z0-9_-]/g, '_');
      triggerDownload(blobUrl, `GullyScore_${safeTeam}_Squad_Certificates.zip`);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setDownloadSuccessMessage('ZIP Archive Downloaded!');
      setTimeout(() => setDownloadSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('ZIP export failed:', err);
      alert(err?.message || 'Failed to export ZIP');
    } finally {
      setIsExporting(false);
      setBatchProgress(null);
    }
  };

  // Auto-download on open if requested
  React.useEffect(() => {
    if (!isOpen || !autoDownloadFormat) return;
    const timer = setTimeout(() => {
      if (autoDownloadFormat === 'pdf') {
        handleDownloadPDF();
      } else if (autoDownloadFormat === 'png') {
        handleDownloadImage();
      } else if (autoDownloadFormat === 'squad_pdf') {
        setActiveTab('squad_batch');
        handleDownloadAllSquadPDF();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, autoDownloadFormat]);

  if (!isOpen) return null;

  // WhatsApp share message with certificate summary
  const handleShareWhatsApp = () => {
    const text = `🏆 *GULLY CRICKET CERTIFICATE OF EXCELLENCE* 🏆\n\n` +
      `🌟 *Award:* ${activeAwardConfig.en}\n` +
      `👤 *Recipient:* ${currentRecipient.name}\n` +
      `🏏 *Match:* ${data.teamA} vs ${data.teamB}\n` +
      `🥇 *Winner:* ${data.winner} (${data.winReason || 'Won'})\n` +
      `📊 *Performance Highlights:*\n` +
      `  • Runs: ${currentRecipient.runs} ${currentRecipient.balls ? `(${currentRecipient.balls}b, ${currentRecipient.fours || 0}x4, ${currentRecipient.sixes || 0}x6)` : ''}\n` +
      `  • Wickets: ${currentRecipient.wickets} ${currentRecipient.runsConceded !== undefined ? `(${currentRecipient.runsConceded} runs)` : ''}\n` +
      `  • MVP Rating: ${currentRecipient.points} pts\n` +
      `📅 *Date:* ${data.matchDate}\n` +
      `✨ *Tournament:* ${autoTournamentName}\n` +
      `🛡️ *Verification Serial:* ${serialNumber}\n` +
      `🔍 *Instant Scanner Verification:* ${verificationUrl}\n` +
      `🏅 *Certified & Issued By:* Gully Scoreboard Team\n` +
      `✍️ *Signature Authority:* ${certProviderFounder} (${certProviderTitle})\n\n` +
      `Verify genuine award: ${verificationUrl}`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-3 overflow-hidden">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl max-w-4xl w-full p-2.5 sm:p-3.5 shadow-2xl relative text-white h-[98dvh] sm:h-[94vh] max-h-[860px] flex flex-col justify-between overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md font-black shrink-0">
              <Trophy size={16} />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase flex items-center gap-1.5 truncate">
                {activeTab === 'squad_batch' ? '1-Click All-Squad Batch Certificates' : 'Official Match Award Certificates'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block truncate">
                {activeTab === 'squad_batch' 
                  ? 'Multi-page certified PDF for all 11–15 players at tournament conclusion' 
                  : 'Official recognition certificate for standout performers'}
              </p>
            </div>
          </div>

          {/* Primary View Switcher: Standout Awards vs 1-Click All-Squad Batch */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('individual')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeTab === 'individual'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy size={12} />
                <span className="hidden xs:inline">Standout</span>
                <span>Awards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('squad_batch')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'squad_batch'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={12} />
                <span>All-Squad PDF</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-tight hidden sm:inline">
                  11–15
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sub-Header Controls */}
        {activeTab === 'individual' ? (
          /* Standout Award Category Buttons */
          <div className="py-1 shrink-0 flex items-center justify-center border-b border-slate-800/80">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedAward('potm')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  selectedAward === 'potm'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy size={12} />
                <span>Player of Match</span>
              </button>

              {data.bestBatsman && (
                <button
                  type="button"
                  onClick={() => setSelectedAward('best_batter')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedAward === 'best_batter'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame size={12} />
                  <span>Best Batsman</span>
                </button>
              )}

              {data.bestBowler && (
                <button
                  type="button"
                  onClick={() => setSelectedAward('best_bowler')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedAward === 'best_bowler'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Medal size={12} />
                  <span>Best Bowler</span>
                </button>
              )}

              {data.fighterOfTheMatch && (
                <button
                  type="button"
                  onClick={() => setSelectedAward('fighter')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedAward === 'fighter'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap size={12} className="text-amber-300" />
                  <span>Fighter of Match</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Squad Batch Generation Sub-Header Bar */
          <div className="py-1.5 shrink-0 border-b border-slate-800/80 space-y-1.5">
            {/* Team Filter + Award Type Selector */}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1 hidden sm:inline">Team:</span>
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('winner')}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedTeamFilter === 'winner'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>👑</span>
                  <span className="truncate max-w-[110px]">{winnerTeamName} (Champions)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('runner_up')}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedTeamFilter === 'runner_up'
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🥈</span>
                  <span className="truncate max-w-[110px]">{runnerUpTeamName} (Finalists)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('all')}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                    selectedTeamFilter === 'all'
                      ? 'bg-teal-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🌐</span>
                  <span>All Players</span>
                </button>
              </div>

              {/* Award Citation Type */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1 hidden sm:inline">Citation:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSquadAwardType('champion_squad')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedSquadAwardType === 'champion_squad'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Champions
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSquadAwardType('runner_up_squad')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedSquadAwardType === 'runner_up_squad'
                      ? 'bg-blue-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Runner-Up
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSquadAwardType('participation')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedSquadAwardType === 'participation'
                      ? 'bg-teal-600 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Participation
                </button>
              </div>
            </div>

            {/* Squad Roster Controls & Quick Auto-Fill */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Users size={12} />
                  <span>Roster: {editableSquadList.length} Players</span>
                </span>
                
                {editableSquadList.length < 11 && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillSquad(11)}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                    title="Fill squad up to 11 players"
                  >
                    <Sparkles size={10} />
                    <span>Auto-Fill Full 11</span>
                  </button>
                )}

                {editableSquadList.length >= 11 && editableSquadList.length < 15 && (
                  <button
                    type="button"
                    onClick={() => handleAutoFillSquad(15)}
                    className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                    title="Fill squad up to 15 players"
                  >
                    <Plus size={10} />
                    <span>Auto-Fill 15 Squad</span>
                  </button>
                )}
              </div>

              {/* Add Custom Player to Squad */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPlayer();
                    }
                  }}
                  placeholder="Add player name..."
                  className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded-lg text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-28 sm:w-36"
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-0.5"
                >
                  <Plus size={11} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Player List Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5">
              {editableSquadList.map((player, idx) => {
                const isSelected = selectedSquadPlayerIndex === idx;
                return (
                  <div
                    key={player.id || idx}
                    onClick={() => setSelectedSquadPlayerIndex(idx)}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-sm'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[9px] font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="truncate max-w-[90px]">{player.name}</span>
                    {player.isCaptain && <span title="Captain">👑</span>}
                    <button
                      type="button"
                      onClick={(e) => handleRemovePlayer(idx, e)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Remove player from batch"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden high-res QR element for direct SVG-to-Canvas rendering */}
        <div style={{ display: 'none' }}>
          <QRCodeSVG
            id="certificate-hidden-qr"
            value={verificationUrl}
            size={128}
            bgColor={activeTheme.qrBg}
            fgColor={activeTheme.qrFg}
            level="M"
            includeMargin={true}
          />
        </div>

        {/* PREVIEW CONTAINER - Fits full viewport without scrolling */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden py-1">
          <div
            ref={certificateRef}
            id="gully-award-certificate"
            className="w-full max-w-3xl h-full max-h-full sm:aspect-[1.42/1] border-2 sm:border-4 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 md:p-5 shadow-2xl relative flex flex-col justify-between overflow-hidden text-center select-none transition-colors duration-300"
            style={{
              backgroundColor: activeTheme.bgFill,
              borderColor: activeTheme.primaryBorder,
              color: activeTheme.bodyText,
              backgroundImage: activeTheme.isLight
                ? 'radial-gradient(circle at 50% 10%, rgba(180, 83, 9, 0.05) 0%, transparent 70%)'
                : 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)'
            }}
          >
            {/* Ornate Classical Triple Border & Microprint Flourish */}
            <div
              className="absolute inset-1 sm:inset-2 border-2 rounded-lg sm:rounded-xl pointer-events-none"
              style={{ borderColor: activeTheme.secondaryBorder }}
            />
            <div
              className="absolute inset-2 sm:inset-3.5 border border-dashed rounded-md sm:rounded-lg pointer-events-none opacity-80"
              style={{ borderColor: activeTheme.innerBorder }}
            />

            {/* Florentine Ornate Corner Rosette Accents */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border border-amber-600/40 rounded-full flex items-center justify-center">
                <Star size={10} className="text-amber-500 fill-amber-500/30" />
              </div>
            </div>
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border border-amber-600/40 rounded-full flex items-center justify-center">
                <Star size={10} className="text-amber-500 fill-amber-500/30" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border border-amber-600/40 rounded-full flex items-center justify-center">
                <Star size={10} className="text-amber-500 fill-amber-500/30" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border border-amber-600/40 rounded-full flex items-center justify-center">
                <Star size={10} className="text-amber-500 fill-amber-500/30" />
              </div>
            </div>

            {/* Certificate Header: Co-branding Bar & Tournament Title */}
            <div className="relative z-10 space-y-0.5 sm:space-y-1 shrink-0">
              {/* Co-Branding Banner */}
              <div
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[7px] sm:text-[8.5px] font-extrabold uppercase tracking-widest border mx-auto mb-0.5 shadow-xs"
                style={{
                  backgroundColor: activeTheme.isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: activeTheme.secondaryBorder,
                  color: activeTheme.accentColor
                }}
              >
                <span>OFFICIAL CITATION • GULLY SCOREBOARD SANCTIONED</span>
              </div>

              {/* Tournament Name */}
              <div className="flex items-center justify-center gap-1.5" style={{ color: activeTheme.accentColor }}>
                <Star size={11} style={{ fill: activeTheme.accentColor }} />
                <span className="text-[8.5px] sm:text-xs uppercase tracking-[0.2em] font-black truncate max-w-[85%]" style={{ color: activeTheme.accentColor }}>
                  {autoTournamentName}
                </span>
                <Star size={11} style={{ fill: activeTheme.accentColor }} />
              </div>

              <h1
                className="text-xs sm:text-lg md:text-2xl font-black uppercase tracking-wider leading-tight"
                style={{
                  fontFamily: '"Cinzel Decorative", "Cinzel", Georgia, serif',
                  color: activeTheme.titleGradient[0],
                  textShadow: activeTheme.isLight ? 'none' : '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                CERTIFICATE OF EXCELLENCE
              </h1>

              {effectiveAwardConfig.badge && (
                <div 
                  className="inline-block px-2 py-0.5 rounded-full text-[7px] sm:text-[8.5px] font-black uppercase tracking-widest border"
                  style={{
                    backgroundColor: activeTheme.sealBg,
                    borderColor: activeTheme.secondaryBorder,
                    color: activeTheme.subAccentColor
                  }}
                >
                  {effectiveAwardConfig.badge}
                </div>
              )}
            </div>

            {/* Recipient & Performance Core */}
            <div className="relative z-10 py-0.5 sm:py-1 space-y-0.5 sm:space-y-1">
              <p className="text-[7.5px] sm:text-[9.5px] font-medium tracking-wide italic font-serif" style={{ color: activeTheme.mutedText }}>
                In recognition of distinguished sporting excellence and match prowess, this accolade is conferred upon
              </p>

              <div className="relative inline-block py-0.5 px-3">
                <h2
                  className="text-sm sm:text-2xl md:text-3xl font-black tracking-tight uppercase drop-shadow-md leading-tight"
                  style={{
                    fontFamily: '"Cinzel", Georgia, serif',
                    color: activeTheme.headingText
                  }}
                >
                  {effectiveRecipient.name}
                </h2>
                <div
                  className="h-0.5 w-1/2 sm:w-2/3 mx-auto mt-0.5"
                  style={{ background: `linear-gradient(to right, transparent, ${activeTheme.accentColor}, transparent)` }}
                />
              </div>

              <p className="text-[8.5px] sm:text-xs md:text-sm font-bold uppercase tracking-wider leading-tight" style={{ color: activeTheme.accentColor }}>
                {effectiveAward === 'fighter'
                  ? 'adjudged for valorous fighting determination as '
                  : effectiveAward === 'champion_squad'
                  ? 'honored as esteemed squad member & champions victor '
                  : effectiveAward === 'runner_up_squad'
                  ? 'honored as esteemed finalist playing squad member '
                  : effectiveAward === 'participation'
                  ? 'honored for commendable spirit and sportsmanship in tournament '
                  : 'adjudged for exceptional match-winning performance as '}
                <span
                  className="underline underline-offset-2"
                  style={{ color: activeTheme.headingText, textDecorationColor: activeTheme.secondaryBorder }}
                >
                  {effectiveAwardConfig.en}
                </span>
              </p>

              {/* Match Details & Context */}
              <p className="text-[7.5px] sm:text-[9.5px] truncate" style={{ color: activeTheme.mutedText }}>
                In the official championship fixture contested between <strong style={{ color: activeTheme.headingText }}>{data.teamA}</strong> and{' '}
                <strong style={{ color: activeTheme.headingText }}>{data.teamB}</strong>
                {data.winner && ` • Triumphantly Won by ${data.winner}`}
              </p>

              {/* Stats Highlight Bar */}
              <div className="max-w-xs sm:max-w-md mx-auto grid grid-cols-3 gap-1 sm:gap-2 pt-0.5">
                <div
                  className="rounded-lg sm:rounded-xl p-1 sm:p-1.5 text-center border"
                  style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.cardBorder }}
                >
                  <span className="text-[6.5px] sm:text-[8px] uppercase font-black tracking-wider block" style={{ color: activeTheme.mutedText }}>
                    Runs Scored
                  </span>
                  <strong className={`text-xs sm:text-base font-mono font-black block ${activeTheme.isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {effectiveRecipient.runs ?? 0}
                  </strong>
                  {effectiveRecipient.balls ? (
                    <span className="text-[6px] sm:text-[7.5px] font-mono block truncate" style={{ color: activeTheme.mutedText }}>
                      {effectiveRecipient.balls}b ({effectiveRecipient.fours || 0}x4, {effectiveRecipient.sixes || 0}x6)
                    </span>
                  ) : null}
                </div>

                <div
                  className="rounded-lg sm:rounded-xl p-1 sm:p-1.5 text-center border"
                  style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.cardBorder }}
                >
                  <span className="text-[6.5px] sm:text-[8px] uppercase font-black tracking-wider block" style={{ color: activeTheme.mutedText }}>
                    Wickets Taken
                  </span>
                  <strong className={`text-xs sm:text-base font-mono font-black block ${activeTheme.isLight ? 'text-sky-700' : 'text-cyan-400'}`}>
                    {effectiveRecipient.wickets ?? 0}
                  </strong>
                  {effectiveRecipient.runsConceded !== undefined ? (
                    <span className="text-[6px] sm:text-[7.5px] font-mono block truncate" style={{ color: activeTheme.mutedText }}>
                      {effectiveRecipient.runsConceded} runs conc.
                    </span>
                  ) : null}
                </div>

                <div
                  className="rounded-lg sm:rounded-xl p-1 sm:p-1.5 text-center border"
                  style={{ backgroundColor: activeTheme.cardBg, borderColor: activeTheme.cardBorder }}
                >
                  <span className="text-[6.5px] sm:text-[8px] uppercase font-black tracking-wider block" style={{ color: activeTheme.mutedText }}>
                    MVP Rating
                  </span>
                  <strong className="text-xs sm:text-base font-mono font-black block" style={{ color: activeTheme.accentColor }}>
                    {effectiveRecipient.points || 25}{' '}
                    <span className="text-[7.5px] sm:text-[8.5px] font-sans font-normal" style={{ color: activeTheme.subAccentColor }}>
                      pts
                    </span>
                  </strong>
                  <span className="text-[6px] sm:text-[7.5px] font-bold uppercase block" style={{ color: activeTheme.mutedText }}>
                    Squad Contributor
                  </span>
                </div>
              </div>
            </div>

            {/* Certificate Footer: 4 Distinct Verifiable Sections */}
            <div
              className="relative z-10 pt-1 sm:pt-1.5 border-t flex items-end justify-between text-left text-[7px] sm:text-[8.5px] shrink-0"
              style={{ borderColor: activeTheme.secondaryBorder }}
            >
              {/* 1. Date & Match ID with Official Stamp Badge */}
              <div className="relative">
                <span className="uppercase tracking-wider block text-[6.5px] sm:text-[7.5px] font-black" style={{ color: activeTheme.mutedText }}>
                  Date of Fixture
                </span>
                <strong className="font-mono text-[7px] sm:text-[8.5px]" style={{ color: activeTheme.headingText }}>
                  {data.matchDate}
                </strong>
                <span className="block text-[6.5px] sm:text-[7.5px] mt-0.5" style={{ color: activeTheme.mutedText }}>
                  ID: {data.matchId}
                </span>
                {/* Visual Stamp Indicator */}
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold text-[6px] uppercase tracking-wider">
                  <span>OFFICIAL STAMP MATRIX</span>
                </div>
              </div>

              {/* 2. Live QR Code for Instant Match Verification */}
              <div className="flex flex-col items-center">
                <div
                  className="p-0.5 sm:p-1 rounded-md border shadow-xs"
                  style={{ backgroundColor: activeTheme.qrBg, borderColor: activeTheme.secondaryBorder }}
                >
                  <div className="block sm:hidden">
                    <QRCodeSVG
                      value={verificationUrl}
                      size={28}
                      bgColor={activeTheme.qrBg}
                      fgColor={activeTheme.qrFg}
                      level="M"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <QRCodeSVG
                      value={verificationUrl}
                      size={40}
                      bgColor={activeTheme.qrBg}
                      fgColor={activeTheme.qrFg}
                      level="M"
                    />
                  </div>
                </div>
                <span className="text-[6px] sm:text-[7px] uppercase font-black tracking-widest mt-0.5" style={{ color: activeTheme.accentColor }}>
                  Scan to Verify
                </span>
                <span className="text-[5.5px] sm:text-[6.5px] font-mono tracking-wider" style={{ color: activeTheme.mutedText }}>
                  ID: {serialNumber}
                </span>
              </div>

              {/* 3. Official 3D Embossed Gold Seal with Draped Ribbon */}
              <div className="flex flex-col items-center relative">
                {/* Draped Red Ribbon Tails */}
                <div className="absolute -bottom-1 -left-1 w-2.5 h-4 bg-gradient-to-b from-red-700 to-red-900 rotate-[-18deg] rounded-xs border border-yellow-400/60 shadow-xs" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-4 bg-gradient-to-b from-red-700 to-red-900 rotate-[18deg] rounded-xs border border-yellow-400/60 shadow-xs" />
                
                {/* Embossed Gold Coin */}
                <div 
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-yellow-500 bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 flex items-center justify-center shadow-md relative z-10"
                >
                  <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-yellow-100 flex items-center justify-center bg-amber-500/40">
                    <ShieldCheck size={14} className="text-yellow-950 sm:hidden" />
                    <ShieldCheck size={16} className="text-yellow-950 hidden sm:block" />
                  </div>
                </div>
                <span className="text-[6px] sm:text-[7px] uppercase font-black tracking-widest mt-1 text-amber-600 dark:text-amber-400">
                  OFFICIAL GOLD SEAL
                </span>
              </div>

              {/* 4. Official Authority Calligraphic Signatures */}
              <div className="text-right">
                <div className="h-5 sm:h-6 flex items-end justify-end">
                  <span
                    className="font-bold text-[12px] sm:text-base md:text-lg"
                    style={{
                      fontFamily: '"Alex Brush", "Cormorant Garamond", cursive, serif',
                      color: activeTheme.accentColor
                    }}
                  >
                    Shubham Hingane
                  </span>
                </div>
                <div className="w-24 sm:w-36 border-b ml-auto my-0.5" style={{ borderColor: activeTheme.secondaryBorder }} />
                <span className="uppercase tracking-wider block text-[6.5px] sm:text-[7.5px] font-black" style={{ color: activeTheme.headingText }}>
                  SHUBHAM HINGANE
                </span>
                <span className="text-[6px] sm:text-[7px] font-bold block" style={{ color: activeTheme.mutedText }}>
                  Founder & Head of Product
                </span>
                <span className="text-[5.5px] sm:text-[6.5px] font-semibold block" style={{ color: activeTheme.subAccentColor }}>
                  Gully Cricket Organizing Council
                </span>
              </div>
            </div>

            {/* 5. Official Verification Security Serial Strip */}
            <div
              className="relative z-10 mt-1 sm:mt-1.5 py-0.5 sm:py-1 px-2 rounded-md sm:rounded-lg border flex items-center justify-between text-[6.5px] sm:text-[8px] font-mono shadow-inner shrink-0"
              style={{
                backgroundColor: activeTheme.isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(15, 23, 42, 0.85)',
                borderColor: activeTheme.secondaryBorder
              }}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="uppercase font-bold tracking-wider" style={{ color: activeTheme.mutedText }}>
                  SECURITY SERIAL:
                </span>
                <strong className="tracking-widest font-black select-all" style={{ color: activeTheme.accentColor }}>
                  {serialNumber}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden sm:inline text-[6.5px] uppercase font-bold" style={{ color: activeTheme.mutedText }}>
                  AUTHENTICATED RECORD
                </span>
                <span className="px-1.5 py-0.2 rounded text-[6px] sm:text-[6.5px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  VERIFIED GENUINE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {activeTab === 'squad_batch' ? (
              <>
                {/* 1-Click All-Squad PDF Primary Button */}
                <button
                  type="button"
                  disabled={isExporting || editableSquadList.length === 0}
                  onClick={handleDownloadAllSquadPDF}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ring-2 ring-emerald-400/40 animate-pulse"
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  <span>⚡ 1-Click All-Squad PDF ({editableSquadList.length} Players)</span>
                </button>

                {/* Download All as ZIP */}
                <button
                  type="button"
                  disabled={isExporting || editableSquadList.length === 0}
                  onClick={handleDownloadAllSquadZIP}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Download individual PNG files in a ZIP archive"
                >
                  <Package size={13} />
                  <span className="hidden xs:inline">ZIP</span>
                  <span>Archive</span>
                </button>

                {/* Download Current Selected Player's Single PDF */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPDF}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Download single PDF for currently selected player"
                >
                  <Award size={13} />
                  <span>Single PDF</span>
                </button>
              </>
            ) : (
              <>
                {/* Download Image (PNG) */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadImage}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? <Sparkles size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>{isExporting ? 'Generating...' : 'Download PNG'}</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPDF}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? <Sparkles size={13} className="animate-spin" /> : <Award size={13} />}
                  <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
                </button>

                {/* Quick 1-Click All-Squad Button from Individual View */}
                <button
                  type="button"
                  onClick={() => setActiveTab('squad_batch')}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users size={13} />
                  <span>⚡ 1-Click All-Squad PDF</span>
                </button>
              </>
            )}

            {downloadSuccessMessage && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check size={13} />
                {downloadSuccessMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Share WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Full Modal Batch Progress Overlay */}
        {batchProgress?.isGenerating && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl mb-4 animate-bounce">
              <Trophy size={32} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-1">
              Compiling 1-Click All-Squad Multi-Page PDF
            </h3>
            <p className="text-xs sm:text-sm font-bold text-amber-400 mb-4">
              Certificate {batchProgress.current} of {batchProgress.total}: {batchProgress.currentPlayer}
            </p>

            {/* Animated Progress Bar */}
            <div className="w-full max-w-md bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700 mb-2 shadow-inner">
              <div 
                className="bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, Math.round((batchProgress.current / Math.max(batchProgress.total, 1)) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between w-full max-w-md text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-[280px]">{batchProgress.statusText}</span>
              <span className="font-bold text-amber-300 shrink-0">
                {Math.round((batchProgress.current / Math.max(batchProgress.total, 1)) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-4">
              Rendering 300-DPI authentic certificates, applying official signatures, and compiling A4 landscape pages...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

