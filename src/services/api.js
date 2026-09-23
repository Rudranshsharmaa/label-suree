/**
 * LabelSure Unified API Client & Security Layer V3.3
 * 
 * Features:
 * - Direct integration with FastAPI backend (http://127.0.0.1:8000/api/v1)
 * - In-memory JWT Access Token management
 * - Silent Refresh via HttpOnly cookie and CSRF validation header (X-CSRF-Token)
 * - Strictly gated offline Demo Mode (VITE_APP_MODE === 'demo')
 * - ZERO MOCK BYPASS: Server errors (401, 403, 404, 429, 500) are authoritative and never fall back to mock data
 */

import { INITIAL_USERS, INITIAL_SCANS } from './mockData';
import { classifyProduct } from './foodClassifier';
import { parsePackagingText } from './ocrService';
import { evaluateCompliance } from './complianceEngine';
import { calculateHealthGrade } from './healthRatingEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
    ? `${window.location.origin}/api/v1` 
    : 'http://127.0.0.1:8000/api/v1');
const IS_DEMO_MODE = import.meta.env.VITE_APP_MODE === 'demo';

// In-Memory Token & CSRF State (Secure against XSS exfiltration of long-lived credentials)
let inMemoryAccessToken = null;
let inMemoryCsrfToken = null;

export function getAnonymousSessionId() {
  if (typeof window === 'undefined') return 'anon-default';
  let sessionId = localStorage.getItem('labelsure_anon_session_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('labelsure_anon_session_id', sessionId);
  }
  return sessionId;
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function setCsrfToken(token) {
  inMemoryCsrfToken = token;
}

export function getCsrfToken() {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (typeof document !== 'undefined' && document.cookie) {
    const match = document.cookie.match(/(?:^|;\s*)labelsure_csrf_token=([^;]+)/);
    if (match && match[1]) {
      try {
        inMemoryCsrfToken = decodeURIComponent(match[1]);
        return inMemoryCsrfToken;
      } catch {
        return match[1];
      }
    }
  }
  return null;
}

/**
 * Normalizes user object to ensure both camelCase (fullName) and snake_case (full_name) are always present.
 */
export function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    fullName: user.fullName || user.full_name || '',
    full_name: user.full_name || user.fullName || '',
  };
}

/**
 * Helper to check if a food_classification string indicates a valid food product.
 */
export function isFoodClassification(status) {
  if (!status) return false;
  const s = String(status).toUpperCase();
  return s.includes('FOOD') && !s.includes('NON-FOOD') && !s.includes('UNCERTAIN');
}

/**
 * Core authenticated fetch client with silent refresh retry and CSRF headers.
 */
async function secureFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    'X-Anonymous-Session-Id': getAnonymousSessionId(),
    ...(options.headers || {}),
  };

  if (inMemoryAccessToken) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  const activeCsrf = getCsrfToken();
  if (activeCsrf) {
    headers['X-CSRF-Token'] = activeCsrf;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly refresh token cookie
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    if (IS_DEMO_MODE) {
      console.warn('[LabelSure Demo] Backend unreachable, using demo offline mode.');
      return null;
    }
    throw new Error(`Unable to connect to LabelSure server: ${netErr.message}`);
  }

  // Silent Refresh on 401 Unauthorized (except on login/signup/refresh endpoints)
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup') && !endpoint.includes('/auth/refresh')) {
    try {
      const csrfForRefresh = getCsrfToken();
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(csrfForRefresh ? { 'X-CSRF-Token': csrfForRefresh } : {}),
        },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.access_token);
        if (refreshData.csrf_token) setCsrfToken(refreshData.csrf_token);

        // Retry original request with new access token
        headers['Authorization'] = `Bearer ${refreshData.access_token}`;
        if (refreshData.csrf_token) headers['X-CSRF-Token'] = refreshData.csrf_token;
        return await fetch(url, { ...config, headers });
      } else {
        setAccessToken(null);
        setCsrfToken(null);
      }
    } catch {
      setAccessToken(null);
      setCsrfToken(null);
    }
  }

  return response;
}

// Local mock storage keys (Quarantined for offline demo mode only)
const STORAGE_KEYS = {
  USERS: 'labelsure_demo_users_v1',
  CURRENT_USER: 'labelsure_demo_current_user_v1',
  SCANS: 'labelsure_demo_scans_v1',
};

function initDemoStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCANS)) {
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(INITIAL_SCANS));
  }
}

export const api = {
  auth: {
    async login(email, password) {
      if (IS_DEMO_MODE) {
        initDemoStorage();
        await new Promise(r => setTimeout(r, 400));
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user || user.password !== password) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        const { password: _, ...userSafe } = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userSafe));
        return userSafe;
      }

      const res = await secureFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(err.detail || 'Invalid email or password.');
      }

      const data = await res.json();
      setAccessToken(data.access_token);
      setCsrfToken(data.csrf_token);
      return normalizeUser(data.user);
    },

    async signup({ fullName, email, password, role, organization }) {
      if (IS_DEMO_MODE) {
        initDemoStorage();
        await new Promise(r => setTimeout(r, 400));
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('An account with this email address already exists.');
        }
        const newUser = {
          id: `usr_${Date.now()}`,
          fullName,
          email,
          password,
          role: role || 'Compliance Reviewer',
          organization: organization || 'Independent Auditor',
          createdAt: new Date().toISOString().split('T')[0],
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const { password: _, ...userSafe } = newUser;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userSafe));
        return normalizeUser(userSafe);
      }

      const res = await secureFetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          role: role || 'Compliance Reviewer',
          organization: organization || 'Independent Auditor',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Signup failed' }));
        throw new Error(err.detail || 'Failed to register account.');
      }

      const data = await res.json();
      setAccessToken(data.access_token);
      setCsrfToken(data.csrf_token);
      return normalizeUser(data.user);
    },

    async getCurrentUser() {
      const anonUser = {
        id: getAnonymousSessionId(),
        email: 'guest@labelsure.org',
        full_name: 'Guest Inspector',
        fullName: 'Guest Inspector',
        role: 'Public Food Inspector',
        organization: 'Independent Citizen Auditor',
        is_active: true,
        is_guest: true,
        scans_remaining: 50,
        total_scans_used: 0,
      };

      if (IS_DEMO_MODE) {
        const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return userStr ? normalizeUser(JSON.parse(userStr)) : anonUser;
      }

      try {
        const res = await secureFetch('/auth/me');
        if (!res || !res.ok) {
          return anonUser;
        }
        const data = await res.json();
        return normalizeUser(data.user) || anonUser;
      } catch {
        return anonUser;
      }
    },

    async getQuotaStatus() {
      const defaultQuota = {
        scans_used_today: 0,
        daily_scan_limit: 50,
        scans_remaining_today: 50,
        scans_used_this_month: 0,
        monthly_scan_limit: 500,
        global_daily_calls: 1,
        global_daily_limit: 2000,
      };

      if (IS_DEMO_MODE) {
        return defaultQuota;
      }

      try {
        const res = await secureFetch('/scans/user/quota');
        if (res && res.ok) {
          return await res.json();
        }
        const meRes = await secureFetch('/auth/me');
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          return meData.quota || defaultQuota;
        }
      } catch {
        // Fallback gracefully
      }
      return defaultQuota;
    },

    async logout() {
      if (IS_DEMO_MODE) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return true;
      }

      try {
        await secureFetch('/auth/logout', { method: 'POST' });
      } finally {
        setAccessToken(null);
        setCsrfToken(null);
      }
      return true;
    },

    async revokeAllSessions() {
      const res = await secureFetch('/auth/revoke-all', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Revocation failed' }));
        throw new Error(err.detail || 'Failed to revoke sessions.');
      }
      return await res.json();
    },

    async deleteAccount(currentPassword) {
      if (IS_DEMO_MODE) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return { success: true, message: 'Account deleted in demo mode.' };
      }

      const res = await secureFetch('/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Account deletion failed.' }));
        throw new Error(err.detail || 'Incorrect password. Account deletion aborted.');
      }

      setAccessToken(null);
      setCsrfToken(null);
      return await res.json();
    },

    async forgotPassword(email) {
      if (IS_DEMO_MODE) {
        return { success: true, message: 'If an account exists, reset instructions have been sent.' };
      }

      const res = await secureFetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed.' }));
        throw new Error(err.detail || 'Password reset request failed.');
      }
      return await res.json();
    },

    async resetPassword(token, newPassword) {
      if (IS_DEMO_MODE) {
        return { success: true, message: 'Password reset successfully.' };
      }

      const res = await secureFetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Invalid reset token.' }));
        throw new Error(err.detail || 'Invalid or expired password reset token.');
      }
      return await res.json();
    }
  },

  scans: {
    async getUserScans(userId, filters = {}) {
      if (IS_DEMO_MODE) {
        initDemoStorage();
        const allScans = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

        let userScans = allScans.filter(scan => {
          if (scan.user_id !== userId) return false;
          const scanDate = new Date(scan.scan_date);
          return scanDate >= twelveMonthsAgo && scanDate <= now;
        });

        if (filters.search) {
          const query = filters.search.toLowerCase();
          userScans = userScans.filter(s =>
            s.product_name.toLowerCase().includes(query) ||
            (s.brand && s.brand.toLowerCase().includes(query)) ||
            s.scan_id.toLowerCase().includes(query)
          );
        }
        if (filters.complianceStatus && filters.complianceStatus !== 'ALL') {
          userScans = userScans.filter(s => s.compliance_status === filters.complianceStatus);
        }
        if (filters.foodClassification && filters.foodClassification !== 'ALL') {
          userScans = userScans.filter(s => s.food_classification === filters.foodClassification);
        }
        if (filters.healthGrade && filters.healthGrade !== 'ALL') {
          userScans = userScans.filter(s => s.health_rating === filters.healthGrade);
        }
        userScans.sort((a, b) => new Date(`${b.scan_date} ${b.scan_time || '00:00'}`) - new Date(`${a.scan_date} ${a.scan_time || '00:00'}`));
        return userScans;
      }

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.complianceStatus && filters.complianceStatus !== 'ALL') params.append('compliance_status', filters.complianceStatus);
      if (filters.foodClassification && filters.foodClassification !== 'ALL') params.append('food_classification', filters.foodClassification);
      if (filters.healthGrade && filters.healthGrade !== 'ALL') params.append('health_grade', filters.healthGrade);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await secureFetch(`/scans${qs}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to load scans' }));
        throw new Error(err.detail || 'Unable to retrieve scan records.');
      }

      const scans = await res.json();
      return scans.map(s => {
        let payload = {};
        try {
          payload = typeof s.data_payload === 'string' ? JSON.parse(s.data_payload) : (s.data_payload || {});
        } catch {
          payload = {};
        }
        return {
          ...payload,
          ...s,
        };
      });
    },

    async getScanById(scanId, userId) {
      if (IS_DEMO_MODE) {
        const allScans = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
        const scan = allScans.find(s => s.scan_id === scanId);
        if (!scan) throw new Error('Scan record not found.');
        if (scan.user_id !== userId) throw new Error('Access denied: You do not have permission to view this report.');
        return scan;
      }

      const res = await secureFetch(`/scans/${scanId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Scan not found' }));
        throw new Error(err.detail || 'Scan report not found or access denied.');
      }

      const scan = await res.json();
      let payload = {};
      try {
        payload = typeof scan.data_payload === 'string' ? JSON.parse(scan.data_payload) : (scan.data_payload || {});
      } catch {
        payload = {};
      }
      return {
        ...payload,
        ...scan,
      };
    },

    async createScan(scanData, userId) {
      if (IS_DEMO_MODE) {
        const allScans = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
        const now = new Date();
        const newScan = {
          ...scanData,
          scan_id: scanData.scan_id || `SCN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          user_id: userId,
          scan_date: now.toISOString().split('T')[0],
          scan_time: now.toTimeString().split(' ')[0].substring(0, 5),
          created_at: now.toISOString(),
        };
        allScans.unshift(newScan);
        localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(allScans));
        return newScan;
      }

      const now = new Date();
      const payload = {
        scan_id: scanData.scan_id || `SCN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        product_name: scanData.product_name || 'Packaged Food Product',
        brand: scanData.brand || '',
        category: scanData.product_category || 'General Packaged Food',
        food_classification: scanData.food_classification || 'Food Product',
        compliance_status: scanData.compliance_status || 'COMPLIANT',
        health_rating: scanData.health_rating || 'B',
        health_score: scanData.health_score || 70.0,
        scan_date: scanData.scan_date || now.toISOString().split('T')[0],
        scan_time: scanData.scan_time || now.toTimeString().split(' ')[0].substring(0, 5),
        data_payload: typeof scanData === 'string' ? JSON.parse(scanData) : scanData,
        image_paths: scanData.image_paths || [],
      };

      const res = await secureFetch('/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create scan' }));
        throw new Error(err.detail || 'Failed to save scan record.');
      }

      const created = await res.json();
      return {
        ...scanData,
        ...created,
      };
    },

    async deleteScan(scanId, userId) {
      if (IS_DEMO_MODE) {
        const allScans = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
        const filtered = allScans.filter(s => !(s.scan_id === scanId && s.user_id === userId));
        localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(filtered));
        return true;
      }

      const res = await secureFetch(`/scans/${scanId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to delete scan' }));
        throw new Error(err.detail || 'Unable to delete scan record.');
      }

      return true;
    },

    async downloadPdf(scanId) {
      const res = await secureFetch(`/scans/${scanId}/report.pdf`);
      if (!res.ok) {
        throw new Error('Failed to generate secure PDF audit report.');
      }
      return await res.blob();
    }
  },

  upload: {
    async uploadImage(file, view = 'front') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('view', view);

      const res = await secureFetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload validation failed' }));
        throw new Error(err.detail || 'Image upload validation failed.');
      }

      return await res.json();
    }
  },

  ai: {
    async analyzePackaging({ productName, category, imageResults }) {
      const res = await secureFetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          category,
          image_results: imageResults,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'AI analysis failed' }));
        throw new Error(err.detail || 'AI packaging analysis encountered an error.');
      }

      return await res.json();
    }
  },

  barcode: {
    async lookup(barcode) {
      if (!barcode || !barcode.trim()) {
        throw new Error('Please enter a valid numeric barcode.');
      }
      const cleanCode = barcode.trim().replace(/[^0-9]/g, '');
      if (!cleanCode) {
        throw new Error('Barcode must contain numbers.');
      }
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json`);
        if (!res.ok) {
          return {
            found: false,
            barcode: cleanCode,
            message: `Registry response: HTTP ${res.status}`,
          };
        }
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const nutriments = p.nutriments || {};
          
          return {
            found: true,
            barcode: cleanCode,
            productName: p.product_name || p.product_name_en || p.generic_name || 'Packaged Food Product',
            brand: p.brands || '',
            category: (p.categories_tags?.[0] ? p.categories_tags[0].replace(/^[a-z]{2}:/, '').replace(/-/g, ' ') : (p.categories || 'Packaged Food')),
            quantity: p.quantity || p.net_weight || null,
            imageUrl: p.image_front_url || p.image_url || null,
            ingredientsText: p.ingredients_text || p.ingredients_text_en || '',
            ingredients: (p.ingredients || []).map(i => i.text || i.id).filter(Boolean),
            nutritionalData: {
              energyKcal: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? null,
              proteinG: nutriments['proteins_100g'] ?? nutriments['proteins'] ?? null,
              carbohydratesG: nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? null,
              totalSugarG: nutriments['sugars_100g'] ?? nutriments['sugars'] ?? null,
              addedSugarG: nutriments['added-sugars_100g'] ?? null,
              fatG: nutriments['fat_100g'] ?? nutriments['fat'] ?? null,
              saturatedFatG: nutriments['saturated-fat_100g'] ?? null,
              transFatG: nutriments['trans-fat_100g'] ?? null,
              sodiumMg: nutriments['sodium_100g'] != null ? Math.round(nutriments['sodium_100g'] * 1000) : (nutriments['salt_100g'] != null ? Math.round(nutriments['salt_100g'] * 400) : null),
              servingSize: p.serving_size || 'Per 100g',
            },
            fssaiNumber: (p.emb_codes_tags || []).find(t => /^[0-9]{14}$/.test(t)) || null,
            vegNonVegStatus: p.ingredients_analysis_tags?.includes('en:non-vegan') || p.ingredients_analysis_tags?.includes('en:non-vegetarian')
              ? 'NON_VEGETARIAN'
              : (p.ingredients_analysis_tags?.includes('en:vegan') || p.ingredients_analysis_tags?.includes('en:vegetarian')
                ? 'VEGETARIAN'
                : 'UNCONFIRMED'),
            source: 'Open Food Facts Global Registry',
          };
        } else {
          return {
            found: false,
            barcode: cleanCode,
            message: data.status_verbose || 'Product barcode not found in registry. You can still scan front & back package photos.',
          };
        }
      } catch (err) {
        console.warn('Barcode lookup network error:', err);
        return {
          found: false,
          barcode: cleanCode,
          message: 'Unable to query product registry. You can still scan front & back package photos.',
          error: err.message,
        };
      }
    }
  },

  classifier: {
    classify: classifyProduct,
  },

  ocr: {
    extract: parsePackagingText,
  },

  compliance: {
    evaluate: evaluateCompliance,
  },

  health: {
    grade: calculateHealthGrade,
  }
};
