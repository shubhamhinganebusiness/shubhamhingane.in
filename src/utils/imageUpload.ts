import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../lib/firebase';
import { normalizeImageUrl, isGoogleDriveUrl, extractGoogleDriveId, handleSmartImageError } from './imageUrlHelper';

export { normalizeImageUrl, isGoogleDriveUrl, extractGoogleDriveId, handleSmartImageError };

/**
 * Cricbuzz & CricHeroes Standard Cloud Storage Folder Hierarchy
 *
 * /players/avatars/             -> High-speed 200x200 square headshots for scorecards & commentary (~15KB WebP)
 * /players/action_shots/        -> Up to 960x960 action shots for player profile hubs (~75KB WebP)
 * /teams/logos/                 -> 200x200 transparent crests for scorecards & standings (~15KB WebP/PNG)
 * /tournaments/banners/         -> 1280x720 (16:9) cover banners for tournament headers (~90KB WebP)
 * /tournaments/trophies/        -> 400x400 transparent awards & trophy assets (~30KB WebP)
 * /matches/{id}/share_cards/    -> 1200x1350 viral Player of the Match / century cards (~110KB WebP)
 * /matches/{id}/scorecards/     -> Printable official scorecards & verified match PDFs (~200KB PDF)
 * /matches/{id}/audio/          -> Vernacular gully audio commentary snippets (~50KB/min)
 * /ads/sponsor_banners/         -> 1280x720 spectator scoreboard sponsorship banners (~95KB WebP)
 * /player_identity_docs/{uid}/  -> Zero-trust secure government ID proofs
 */
export const STORAGE_FOLDERS = {
  PLAYERS: 'players/avatars',
  PLAYERS_AVATARS: 'players/avatars',
  PLAYERS_ACTION: 'players/action_shots',
  TEAMS: 'teams/logos',
  TEAMS_LOGOS: 'teams/logos',
  TOURNAMENTS: 'tournaments/banners',
  TOURNAMENTS_BANNERS: 'tournaments/banners',
  TOURNAMENTS_TROPHIES: 'tournaments/trophies',
  MATCHES: 'matches',
  MATCHES_SHARE_CARDS: 'matches/share_cards',
  MATCHES_SCORECARDS: 'matches/scorecards',
  MATCHES_AUDIO: 'matches/audio_commentary',
  ADS: 'ads/sponsor_banners',
  ADS_SPONSORS: 'ads/sponsor_banners',
  DOCS: 'player_identity_docs',
  PLAYER_DOCS: 'player_identity_docs',
} as const;

export type StorageFolder = typeof STORAGE_FOLDERS[keyof typeof STORAGE_FOLDERS] | string;

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadOptions {
  folder?: StorageFolder;
  entityId?: string; // e.g., 'player_virat_18', 'team_chennai', 'match_889_potm'
  onProgress?: UploadProgressCallback;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
  fallbackToBase64?: boolean;
  cropSquare?: boolean; // When true, crops to square (Cricbuzz player face standard)
  cacheControl?: string; // CDN caching header (default: public, max-age=31536000, immutable)
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
  name: string;
  folder?: string;
  isBase64Fallback?: boolean;
  cacheControl?: string;
}

export interface FolderPreset {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  cropSquare: boolean;
  cacheControl: string;
}

export function getFolderUploadPreset(folder: StorageFolder): FolderPreset {
  const f = (folder || '').toLowerCase();
  if (f.includes('avatars') || f === 'players' || f === 'players/avatars') {
    return {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.82,
      cropSquare: true,
      cacheControl: 'public, max-age=31536000, immutable',
    };
  }
  if (f.includes('action_shots')) {
    return {
      maxWidth: 960,
      maxHeight: 960,
      quality: 0.85,
      cropSquare: false,
      cacheControl: 'public, max-age=31536000, immutable',
    };
  }
  if (f.includes('teams') || f.includes('logos')) {
    return {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.85,
      cropSquare: false,
      cacheControl: 'public, max-age=31536000, immutable',
    };
  }
  if (f.includes('trophies')) {
    return {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.85,
      cropSquare: false,
      cacheControl: 'public, max-age=31536000, immutable',
    };
  }
  if (f.includes('share_cards') || f.includes('potm')) {
    return {
      maxWidth: 1200,
      maxHeight: 1350,
      quality: 0.88,
      cropSquare: false,
      cacheControl: 'public, max-age=2592000',
    };
  }
  if (f.includes('player_identity_docs') || f.includes('docs')) {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.82,
      cropSquare: false,
      cacheControl: 'private, max-age=3600',
    };
  }
  // Default for banners, ads, matches
  return {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.85,
    cropSquare: false,
    cacheControl: 'public, max-age=31536000, immutable',
  };
}

export function getPlayerAvatarStoragePath(playerId: string): string {
  const cleanId = (playerId || 'player').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `players/avatars/${cleanId}.webp`;
}

export function getTeamLogoStoragePath(teamId: string): string {
  const cleanId = (teamId || 'team').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `teams/logos/${cleanId}.webp`;
}

export function getTournamentBannerStoragePath(tourId: string): string {
  const cleanId = (tourId || 'tournament').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `tournaments/banners/${cleanId}.webp`;
}

export function getTournamentTrophyStoragePath(trophyId: string): string {
  const cleanId = (trophyId || 'trophy').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `tournaments/trophies/${cleanId}.webp`;
}

export function getMatchShareCardStoragePath(matchId: string, cardType = 'potm'): string {
  const cleanMatch = (matchId || 'match').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanType = (cardType || 'share').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `matches/${cleanMatch}/share_cards/${cleanType}.webp`;
}

export function getSponsorBannerStoragePath(sponsorId: string): string {
  const cleanId = (sponsorId || 'sponsor').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ads/sponsor_banners/${cleanId}.webp`;
}

export function getPlayerDocStoragePath(userId: string, docType = 'aadhaar'): string {
  const cleanUser = (userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanDoc = (docType || 'doc').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `player_identity_docs/${cleanUser}/${cleanDoc}.webp`;
}

// Lazy initialization of Firebase Storage
let storageInstance: ReturnType<typeof getStorage> | null = null;
export function getFirebaseStorage() {
  if (!storageInstance) {
    try {
      storageInstance = getStorage(app);
    } catch (err) {
      console.warn('[Firebase Storage] Failed to initialize storage:', err);
    }
  }
  return storageInstance;
}

/**
 * Validates file size and image MIME type
 */
export function validateImageFile(file: File, maxSizeMB = 10): { valid: boolean; error?: string } {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif'
  ];

  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || 'unknown'}). Please upload JPG, PNG, WebP, GIF, or SVG.`
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${maxSizeMB} MB.`
    };
  }

  return { valid: true };
}

/**
 * Converts a File or Blob into a base64 Data URL
 */
export function fileToDataUrl(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts width and height of an image file or blob
 */
export function getImageDimensions(file: Blob | File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image dimensions.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses an image in-memory using HTML5 Canvas to WebP (or JPEG fallback).
 * Supports optional square crop for player headshots (Cricbuzz standard).
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = 1600,
  quality = 0.82,
  targetFormat: 'image/webp' | 'image/jpeg' = 'image/webp',
  cropSquare = false
): Promise<Blob> {
  if ('type' in file && (file.type === 'image/svg+xml' || file.type === 'image/gif')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        const canvas = document.createElement('canvas');

        if (cropSquare) {
          const side = Math.min(width, height);
          const startX = Math.round((width - side) / 2);
          const startY = Math.round(Math.max(0, (height - side) * 0.2));
          const targetDim = Math.min(side, maxWidth);

          canvas.width = targetDim;
          canvas.height = targetDim;

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, side, side, 0, 0, targetDim, targetDim);
        } else {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) return resolve(file);

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              canvas.toBlob(
                (fallbackBlob) => (fallbackBlob ? resolve(fallbackBlob) : resolve(file)),
                'image/jpeg',
                quality
              );
            }
          },
          targetFormat,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function generateSafeFileName(originalName: string, ext = 'webp', entityId?: string, folder?: string): string {
  const timestamp = Date.now();
  if (entityId) {
    const cleanEntity = entityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${cleanEntity}.${ext}`;
  }
  const cleanFolder = (folder || '').toLowerCase();
  if (cleanFolder.includes('avatars') || cleanFolder.includes('player')) {
    return `avatar_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('action')) {
    return `action_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('trophy')) {
    return `trophy_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('tournament')) {
    return `tournament_banner_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('share_card')) {
    return `share_card_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('match')) {
    return `match_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('ad') || cleanFolder.includes('sponsor')) {
    return `sponsor_ad_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  if (cleanFolder.includes('team') || cleanFolder.includes('logo')) {
    return `logo_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
  }
  const cleanBase = originalName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 24);
  return `${cleanBase}_${timestamp}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
}

/**
 * Uploads an image file with automatic validation, compression, and progress updates
 */
export async function uploadImageToStorage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const preset = getFolderUploadPreset(options.folder || STORAGE_FOLDERS.PLAYERS);

  const {
    folder = STORAGE_FOLDERS.PLAYERS,
    entityId,
    onProgress,
    compress = true,
    maxWidth = preset.maxWidth,
    maxHeight = preset.maxHeight,
    quality = preset.quality,
    maxSizeMB = 10,
    cropSquare = preset.cropSquare,
    cacheControl = preset.cacheControl,
    fallbackToBase64 = true
  } = options;

  // 1. Validate
  const validation = validateImageFile(file, maxSizeMB);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  // 2. Client-side compression
  let uploadBlob: Blob = file;
  let fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';
  let contentType = file.type || 'image/jpeg';

  if (compress && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
    try {
      uploadBlob = await compressImage(file, maxWidth, quality, 'image/webp', cropSquare);
      fileExt = 'webp';
      contentType = 'image/webp';
    } catch (compErr) {
      console.warn('[Image Upload] Client-side compression note:', compErr);
      uploadBlob = file;
    }
  }

  const fileName = generateSafeFileName(file.name, fileExt, entityId, folder);
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const fullPath = `${cleanFolder}/${fileName}`;
  const storage = getFirebaseStorage();

  // 3. Attempt direct Firebase Storage upload with CDN Cache-Control headers
  if (storage) {
    try {
      const storageRef = ref(storage, fullPath);
      const metadata = {
        contentType,
        cacheControl,
        customMetadata: {
          originalName: file.name,
          entityId: entityId || '',
          folder: folder,
          uploadedAt: new Date().toISOString()
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, uploadBlob, metadata);

      return await new Promise<UploadResult>((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = (snapshot.bytesTransferred / (snapshot.totalBytes || 1)) * 100;
            if (onProgress) {
              onProgress(Math.min(100, Math.round(pct)));
            }
          },
          (error) => {
            console.warn('[Firebase Storage] Direct upload error, trying backend route:', error?.message || error);
            uploadImageViaBackend(uploadBlob, {
              folder,
              entityId,
              maxWidth,
              maxHeight,
              quality,
              cropSquare,
              cacheControl,
              onProgress
            })
              .then(resolve)
              .catch(async (backendErr) => {
                console.warn('[Backend Upload] Note:', backendErr?.message || backendErr);
                if (fallbackToBase64) {
                  if (onProgress) onProgress(70);
                  const dataUrl = await fileToDataUrl(uploadBlob);
                  if (onProgress) onProgress(100);
                  resolve({
                    url: dataUrl,
                    path: `local-base64/${fileName}`,
                    size: uploadBlob.size,
                    contentType,
                    name: fileName,
                    folder,
                    isBase64Fallback: true
                  });
                } else {
                  throw backendErr;
                }
              });
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve({
                url: downloadUrl,
                path: fullPath,
                size: uploadBlob.size,
                contentType,
                name: fileName,
                folder,
                cacheControl,
                isBase64Fallback: false
              });
            } catch (urlErr) {
              uploadImageViaBackend(uploadBlob, {
                folder,
                entityId,
                maxWidth,
                maxHeight,
                quality,
                cropSquare,
                cacheControl,
                onProgress
              })
                .then(resolve)
                .catch(async () => {
                  if (fallbackToBase64) {
                    if (onProgress) onProgress(70);
                    const dataUrl = await fileToDataUrl(uploadBlob);
                    if (onProgress) onProgress(100);
                    resolve({
                      url: dataUrl,
                      path: `local-base64/${fileName}`,
                      size: uploadBlob.size,
                      contentType,
                      name: fileName,
                      folder,
                      isBase64Fallback: true
                    });
                  }
                });
            }
          }
        );
      });
    } catch (storageError: any) {
      console.warn('[Firebase Storage] Direct bucket upload attempt note:', storageError?.message || storageError);
    }
  }

  // 4. Attempt upload via Node.js backend to Firebase Storage (/api/upload-image)
  try {
    const backendResult = await uploadImageViaBackend(uploadBlob, {
      folder,
      entityId,
      maxWidth,
      maxHeight,
      quality,
      cropSquare,
      cacheControl,
      onProgress
    });
    if (backendResult && backendResult.url) {
      return backendResult;
    }
  } catch (backendErr) {
    console.warn('[Backend Upload] Backend upload route note:', backendErr);
  }

  // 5. Fallback to optimized Base64 Data URL if Storage bucket is offline
  if (fallbackToBase64) {
    if (onProgress) onProgress(50);
    const dataUrl = await fileToDataUrl(uploadBlob);
    if (onProgress) onProgress(100);
    return {
      url: dataUrl,
      path: `local-base64/${fileName}`,
      size: uploadBlob.size,
      contentType,
      name: fileName,
      folder,
      isBase64Fallback: true
    };
  }

  throw new Error('Firebase Storage is unavailable and fallback mode is disabled.');
}

/**
 * Uploads an image via the Express Node.js backend route (/api/upload-image)
 */
export async function uploadImageViaBackend(
  fileOrDataUrl: File | Blob | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    folder = STORAGE_FOLDERS.PLAYERS,
    entityId,
    maxWidth,
    maxHeight,
    quality,
    cropSquare,
    cacheControl = 'public, max-age=31536000, immutable',
    onProgress
  } = options;

  let dataUrl: string;
  let fileName = 'image.webp';
  let mimeType = 'image/webp';

  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
    if (dataUrl.startsWith('data:')) {
      const match = dataUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
      if (match) mimeType = match[1];
    }
  } else {
    fileName = 'name' in fileOrDataUrl ? (fileOrDataUrl as File).name : 'image.webp';
    mimeType = fileOrDataUrl.type || 'image/jpeg';
    dataUrl = await fileToDataUrl(fileOrDataUrl);
  }

  if (onProgress) onProgress(40);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: dataUrl,
      folder,
      entityId,
      filename: fileName,
      mimeType,
      maxWidth,
      maxHeight,
      quality,
      cropSquare,
      cacheControl
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Backend upload failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  if (onProgress) onProgress(100);

  return {
    url: result.url,
    path: result.path || `${folder}/${fileName}`,
    size: result.size || dataUrl.length,
    contentType: result.contentType || mimeType,
    name: result.name || fileName,
    folder: result.folder || folder,
    cacheControl: result.cacheControl || cacheControl,
    isBase64Fallback: Boolean(result.isBase64Fallback)
  };
}

/**
 * Deletes an uploaded file from Firebase Storage
 */
export async function deleteImageFromStorage(pathOrUrl: string): Promise<void> {
  if (!pathOrUrl || pathOrUrl.startsWith('data:')) {
    return;
  }

  const storage = getFirebaseStorage();
  if (!storage) return;

  try {
    let fileRef;
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      fileRef = ref(storage, pathOrUrl);
    } else {
      fileRef = ref(storage, pathOrUrl);
    }
    await deleteObject(fileRef);
  } catch (err: any) {
    console.warn('[Firebase Storage] Failed to delete file:', err?.message || err);
  }
}
