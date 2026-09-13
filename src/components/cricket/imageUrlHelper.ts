/**
 * Universal Image URL Helper
 * Converts Google Drive sharing links, Dropbox, OneDrive, and external URLs
 * into direct, viewable image URLs that render reliably in <img> tags.
 */

import type React from 'react';

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: drive.google.com/file/d/{id} or /d/{id}
  const fileDMatch = trimmed.match(/(?:drive|docs)\.google\.com\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: ?id={id} or &id={id}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Pattern 3: lh3.googleusercontent.com/d/{id}
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1];
  }

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(url);
}

/**
 * Normalizes any image URL into a format guaranteed to work in browser <img> tags.
 * Handles:
 * - Google Drive sharing URLs (e.g., https://drive.google.com/file/d/XYZ/view?usp=sharing)
 * - Dropbox shared links
 * - OneDrive links
 * - Base64 Data URLs & Blobs
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().replace(/^["']|["']$/g, '');

  if (!trimmed) return '';

  // Data URLs and Blobs are already direct
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Google Drive
  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    // Google User Content CDN link: Direct image bytes with proper headers
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // Dropbox links: replace dl=0 with raw=1 or use dl.dropboxusercontent.com
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('?dl=0') || trimmed.includes('&dl=0')) {
      return trimmed.replace(/[?&]dl=0/, '?raw=1');
    }
    if (!trimmed.includes('raw=1')) {
      return trimmed + (trimmed.includes('?') ? '&raw=1' : '?raw=1');
    }
  }

  // OneDrive links: ensure download=1
  if (trimmed.includes('1drv.ms') || trimmed.includes('onedrive.live.com')) {
    if (!trimmed.includes('download=1')) {
      return trimmed + (trimmed.includes('?') ? '&download=1' : '?download=1');
    }
  }

  return trimmed;
}

/**
 * Fallback generator for Google Drive links if lh3 CDN fails
 */
export function getGoogleDriveFallbackUrl(url: string): string | null {
  const driveId = extractGoogleDriveId(url);
  if (!driveId) return null;
  // High-res Google Drive Thumbnail API (1600px width max)
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
}

/**
 * Smart image error handler that attempts Google Drive thumbnail fallback
 * before falling back to a placeholder image.
 */
export function handleSmartImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  originalUrl?: string,
  placeholderUrl = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80'
) {
  const img = e.currentTarget;
  const currentSrc = img.src;

  const urlToCheck = originalUrl || currentSrc;
  const driveId = extractGoogleDriveId(urlToCheck);

  // If this is a Google Drive URL and we haven't tried the thumbnail proxy yet
  if (driveId && !img.dataset.triedDriveThumbnail) {
    img.dataset.triedDriveThumbnail = 'true';
    img.src = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`;
    return;
  }

  // If thumbnail proxy also failed, try backend proxy
  if (driveId && !img.dataset.triedBackendProxy) {
    img.dataset.triedBackendProxy = 'true';
    img.src = `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/uc?export=view&id=${driveId}`)}`;
    return;
  }

  // Final fallback to placeholder
  if (!img.dataset.usedPlaceholder) {
    img.dataset.usedPlaceholder = 'true';
    img.src = placeholderUrl;
  }
}
