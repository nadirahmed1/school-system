/**
 * useSchoolSettings — Hook
 * 
 * XALKA DHIBAATADA WEYN:
 * Hore: localStorage → device kaliya, browser kale uma muuqdo
 * Hadda: Supabase database → meel kasta isku mid
 * 
 * Isticmaalka:
 *   const { settings, loading, saveSettings } = useSchoolSettings()
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Cache yar oo xawaaraha u ah (30 ilbiriqsi) ──────
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 30_000 // 30 seconds

const DEFAULT_SETTINGS = {
  school_name:    'Nidaamka Dugsiga',
  logo_url:       null,
  primary_color:  '#1a3a5c',
  accent_color:   '#065f46',
  sidebar_color:  '#1a3a5c',
  admin_email:    'admin@dugsi.so',
  admin_password: 'Admin@2024',
}

// ── CSS variables ku cusboonaysii markaas ────────────
function applyCSSVars(s) {
  const r = document.documentElement
  r.style.setProperty('--primary', s.primary_color || DEFAULT_SETTINGS.primary_color)
  r.style.setProperty('--accent',  s.accent_color  || DEFAULT_SETTINGS.accent_color)
  r.style.setProperty('--sidebar', s.sidebar_color || DEFAULT_SETTINGS.sidebar_color)
}

// ── Database ka soo qaad (cache leh) ────────────────
export async function fetchSchoolSettings(forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && _cache && (now - _cacheTime < CACHE_TTL)) {
    return _cache
  }

  try {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      // Haddii table aan jirin, isticmaal localStorage fallback
      console.warn('school_settings table error:', error.message)
      return getLocalFallback()
    }

    _cache = { ...DEFAULT_SETTINGS, ...data }
    _cacheTime = now
    applyCSSVars(_cache)
    return _cache
  } catch (err) {
    console.warn('fetchSchoolSettings failed:', err)
    return getLocalFallback()
  }
}

// ── Fallback: localStorage (offline ama error) ───────
function getLocalFallback() {
  try {
    const raw = localStorage.getItem('school_settings')
    if (raw) {
      const ls = JSON.parse(raw)
      // Translate camelCase → snake_case haddii loo baahdo
      return {
        ...DEFAULT_SETTINGS,
        school_name:    ls.schoolName    || DEFAULT_SETTINGS.school_name,
        logo_url:       ls.logoUrl       || DEFAULT_SETTINGS.logo_url,
        primary_color:  ls.primaryColor  || DEFAULT_SETTINGS.primary_color,
        accent_color:   ls.accentColor   || DEFAULT_SETTINGS.accent_color,
        sidebar_color:  ls.sidebarColor  || DEFAULT_SETTINGS.sidebar_color,
      }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

// ── Database ku keyd + cache nadiifi ────────────────
export async function saveSchoolSettings(updates) {
  try {
    const { data, error } = await supabase
      .from('school_settings')
      .upsert({ id: 1, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) {
      // Fallback: localStorage ku keyd (offline mode)
      console.warn('saveSchoolSettings DB error:', error.message)
      saveLSFallback(updates)
      return { data: updates, error: null, offline: true }
    }

    // Cache nadiifi si la helo xog cusub
    _cache = null
    _cacheTime = 0

    // CSS ku cusboonaysii
    applyCSSVars({ ...DEFAULT_SETTINGS, ...data })

    // Broadcast: components kale u sheeg
    window.dispatchEvent(new CustomEvent('school_settings_changed', { detail: data }))

    return { data, error: null }
  } catch (err) {
    saveLSFallback(updates)
    return { data: updates, error: err, offline: true }
  }
}

function saveLSFallback(updates) {
  try {
    const existing = JSON.parse(localStorage.getItem('school_settings') || '{}')
    const merged = {
      ...existing,
      schoolName:   updates.school_name   || existing.schoolName,
      logoUrl:      updates.logo_url      || existing.logoUrl,
      primaryColor: updates.primary_color || existing.primaryColor,
      accentColor:  updates.accent_color  || existing.accentColor,
      sidebarColor: updates.sidebar_color || existing.sidebarColor,
    }
    localStorage.setItem('school_settings', JSON.stringify(merged))
  } catch {}
}

// ── React Hook ───────────────────────────────────────
export function useSchoolSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    const s = await fetchSchoolSettings(force)
    setSettings(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    // Marka settings beddelo (tab kale), dib u load
    const handler = (e) => {
      if (e.detail) {
        setSettings({ ...DEFAULT_SETTINGS, ...e.detail })
        applyCSSVars({ ...DEFAULT_SETTINGS, ...e.detail })
      }
    }
    window.addEventListener('school_settings_changed', handler)
    return () => window.removeEventListener('school_settings_changed', handler)
  }, [load])

  const save = useCallback(async (updates) => {
    const result = await saveSchoolSettings(updates)
    if (!result.error) {
      setSettings(prev => ({ ...prev, ...updates }))
    }
    return result
  }, [])

  return { settings, loading, error, save, reload: () => load(true) }
}
