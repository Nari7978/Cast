// Lightweight sessionStorage cache for Firestore collections.
// Serves cached data instantly on mount; live Firestore updates overwrite it.
// sessionStorage clears when the browser tab closes — not stale across sessions.

function read(key) {
  try { return JSON.parse(sessionStorage.getItem('fsc_' + key) || 'null') } catch { return null }
}

function write(key, data) {
  try { sessionStorage.setItem('fsc_' + key, JSON.stringify(data)) } catch {}
}

export function clearFsCache(key) {
  try { sessionStorage.removeItem('fsc_' + key) } catch {}
}

/**
 * Wraps an onSnapshot subscription with a sessionStorage read-through cache.
 * Calls `cb` immediately with cached data if available, then again on every
 * live Firestore update (which also refreshes the cache).
 *
 * @param {string}   key   - Cache key (e.g. 'assignments', 'booths')
 * @param {Function} subscribe - Function that calls cb and returns an unsubscribe fn
 * @param {Function} cb   - Data callback
 * @returns {Function} unsubscribe
 */
export function cachedSubscribe(key, subscribe, cb) {
  const cached = read(key)
  if (cached) cb(cached)

  return subscribe(data => {
    write(key, data)
    cb(data)
  })
}

export function readCache(key) {
  return read(key)
}

export function writeCache(key, data) {
  write(key, data)
}
