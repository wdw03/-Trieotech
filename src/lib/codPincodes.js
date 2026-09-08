import { supabaseAdmin } from './supabase/admin.js';

const BUCKET_NAME = 'config';
const SETTINGS_FILE = 'cod_settings.json';

const DEFAULT_SETTINGS = {
  cod_enabled_globally: false, // COD is disabled by default everywhere
  pincodes: [], // List of { pincode: '302001', city: 'Jaipur', state: 'Rajasthan', notes: '', added_at: '...' }
  updated_at: new Date().toISOString(),
};

/**
 * Ensures bucket exists
 */
async function ensureBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const found = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!found) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: false });
    }
  } catch (_) {
    // Ignore error if already exists
  }
}

/**
 * Fetch COD settings from Supabase storage (bypassing any CDN cache using signed URL)
 */
export async function getCodSettings() {
  try {
    await ensureBucket();
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(SETTINGS_FILE, 60);

    if (signError || !signed?.signedUrl) {
      // If file does not exist yet, save and return default
      await saveCodSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    const res = await fetch(signed.signedUrl, { cache: 'no-store' });
    if (!res.ok) {
      return DEFAULT_SETTINGS;
    }

    const parsed = await res.json();
    return {
      cod_enabled_globally: !!parsed.cod_enabled_globally,
      pincodes: Array.isArray(parsed.pincodes) ? parsed.pincodes : [],
      updated_at: parsed.updated_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('[COD Pincodes] Error reading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save COD settings to Supabase storage
 */
export async function saveCodSettings(settings) {
  try {
    await ensureBucket();
    const payload = {
      cod_enabled_globally: !!settings.cod_enabled_globally,
      pincodes: Array.isArray(settings.pincodes) ? settings.pincodes : [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(SETTINGS_FILE, Buffer.from(JSON.stringify(payload, null, 2)), {
        contentType: 'application/json',
        cacheControl: '0',
        upsert: true,
      });

    if (error) throw error;
    return payload;
  } catch (err) {
    console.error('[COD Pincodes] Error saving settings:', err);
    throw err;
  }
}

/**
 * Checks if COD is allowed for a given 6-digit pincode
 */
export async function isCodAvailableForPincode(pincode) {
  if (!pincode) return false;
  const cleanPin = String(pincode).trim().replace(/\D/g, '');
  if (!cleanPin || cleanPin.length !== 6) return false;

  const settings = await getCodSettings();
  if (settings.cod_enabled_globally) return true;

  if (!settings.pincodes || settings.pincodes.length === 0) {
    return false;
  }

  return settings.pincodes.some((item) => {
    if (typeof item === 'string') {
      return item.trim() === cleanPin;
    }
    if (item && item.pincode) {
      return String(item.pincode).trim() === cleanPin;
    }
    return false;
  });
}

/**
 * Add pincodes to the allowed list (single or bulk)
 */
export async function addCodPincodes(newEntries = []) {
  const settings = await getCodSettings();
  const existingMap = new Map();

  settings.pincodes.forEach((item) => {
    const pin = typeof item === 'string' ? item.trim() : String(item.pincode).trim();
    if (pin) {
      existingMap.set(pin, typeof item === 'object' ? item : { pincode: pin });
    }
  });

  newEntries.forEach((entry) => {
    const pin = typeof entry === 'string' ? entry.trim() : String(entry.pincode || '').trim();
    const cleanPin = pin.replace(/\D/g, '');
    if (cleanPin && cleanPin.length === 6) {
      existingMap.set(cleanPin, {
        pincode: cleanPin,
        city: entry.city || '',
        state: entry.state || '',
        notes: entry.notes || '',
        added_at: new Date().toISOString(),
      });
    }
  });

  settings.pincodes = Array.from(existingMap.values());
  return await saveCodSettings(settings);
}

/**
 * Remove a pincode from the allowed list
 */
export async function removeCodPincode(pincode) {
  const cleanPin = String(pincode).trim().replace(/\D/g, '');
  const settings = await getCodSettings();
  settings.pincodes = settings.pincodes.filter((item) => {
    const pin = typeof item === 'string' ? item.trim() : String(item.pincode).trim();
    return pin !== cleanPin;
  });
  return await saveCodSettings(settings);
}
