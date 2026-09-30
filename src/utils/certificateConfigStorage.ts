import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { CertificateThemeId, CERTIFICATE_THEMES, CertificateTheme } from '../components/cricket/MatchAwardsCertificateModal';

export interface CertificateConfigSettings {
  defaultThemeId: CertificateThemeId;
  defaultTournamentName: string;
  defaultOrganizerName: string;
  defaultSponsorName: string;
  defaultFederationName: string;
  officialSealText: string;
  enableQrVerification: boolean;
  enableSponsorBanner: boolean;
  enableDualSignatures: boolean;
  customHeaderTitle: string;
  customSubtitleTemplate: string;
  customFooterNote: string;
  // Custom overrides per theme or global accent color override
  customAccentColor?: string;
  customPrimaryBorder?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfigSettings = {
  defaultThemeId: 'classic_ivory',
  defaultTournamentName: 'Gully Premier League 2026',
  defaultOrganizerName: 'Shubham Hingane',
  defaultSponsorName: 'Founder of Gully Scoreboard',
  defaultFederationName: 'Gully Scoreboard Team',
  officialSealText: 'GULLY SCOREBOARD TEAM',
  enableQrVerification: true,
  enableSponsorBanner: true,
  enableDualSignatures: true,
  customHeaderTitle: 'CERTIFICATE OF EXCELLENCE',
  customSubtitleTemplate: 'for outstanding match-winning performance as',
  customFooterNote: 'Certified & Issued by Gully Scoreboard Team • Shubham Hingane, Founder of Gully Scoreboard',
  updatedAt: Date.now()
};

const CERT_CONFIG_DOC = 'cricket_certificate_config';
const CERT_CONFIG_COLLECTION = 'site_settings';
const LOCAL_STORAGE_KEY = 'gullyscore_certificate_design_config';

export async function getCertificateConfig(): Promise<CertificateConfigSettings> {
  try {
    const docRef = doc(db, CERT_CONFIG_COLLECTION, CERT_CONFIG_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CertificateConfigSettings;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return { ...DEFAULT_CERTIFICATE_CONFIG, ...data };
    }
  } catch (err) {
    console.warn('Could not read certificate config from Firestore, reading local cache:', err);
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_CERTIFICATE_CONFIG, ...JSON.parse(cached) };
    }
  } catch (_) {}

  return DEFAULT_CERTIFICATE_CONFIG;
}

export async function saveCertificateConfig(config: Partial<CertificateConfigSettings>): Promise<CertificateConfigSettings> {
  const updated: CertificateConfigSettings = {
    ...DEFAULT_CERTIFICATE_CONFIG,
    ...config,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}

  try {
    const docRef = doc(db, CERT_CONFIG_COLLECTION, CERT_CONFIG_DOC);
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    console.error('Error saving certificate config to Firestore:', err);
    throw err;
  }

  return updated;
}

export function subscribeCertificateConfig(callback: (config: CertificateConfigSettings) => void): () => void {
  try {
    const docRef = doc(db, CERT_CONFIG_COLLECTION, CERT_CONFIG_DOC);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as CertificateConfigSettings;
        const merged = { ...DEFAULT_CERTIFICATE_CONFIG, ...data };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        callback(merged);
      } else {
        callback(DEFAULT_CERTIFICATE_CONFIG);
      }
    }, (err) => {
      console.warn('Realtime subscription on certificate config failed, using local cache:', err);
      getCertificateConfig().then(callback);
    });
  } catch (_) {
    getCertificateConfig().then(callback);
    return () => {};
  }
}
