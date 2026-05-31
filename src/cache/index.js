// Central cache management module
const streamCache = require('./streamCache');
const nzbCache = require('./nzbCache');
const nzbdavCache = require('./nzbdavCache');
const diskNzbCache = require('./diskNzbCache');

function clearAllCaches(reason = 'manual') {
  streamCache.clearStreamResponseCache(reason);
  nzbCache.clearVerifiedNzbCache(reason);
  nzbdavCache.clearNzbdavStreamCache(reason);
  diskNzbCache.clearDiskCache(reason);
}

// Clear only the in-memory (transient) caches. Used on config save: a settings
// change can invalidate resolved results and NZBDav mount pointers, but NOT the
// on-disk NZB payloads — those are keyed by download URL and stay valid across
// settings changes, so we keep them for fast re-mounts (no needless re-downloads).
function clearTransientCaches(reason = 'manual') {
  streamCache.clearStreamResponseCache(reason);
  nzbCache.clearVerifiedNzbCache(reason);
  nzbdavCache.clearNzbdavStreamCache(reason);
}

// Periodic maintenance: enforce TTL + size/count caps across the caches.
// Called by the server's janitor timer so nothing relies on an admin save.
function runMaintenance() {
  streamCache.cleanupStreamCache();
  nzbdavCache.cleanupNzbdavCache();
  diskNzbCache.runMaintenance();
}

function getAllCacheStats() {
  return {
    stream: streamCache.getStreamCacheStats(),
    nzb: nzbCache.getVerifiedNzbCacheStats(),
    nzbdav: nzbdavCache.getNzbdavCacheStats(),
    disk: diskNzbCache.getDiskCacheStats(),
  };
}

module.exports = {
  // Stream cache
  ...streamCache,
  
  // NZB cache
  ...nzbCache,
  
  // NZBDav cache
  ...nzbdavCache,

  // Disk NZB cache
  ...diskNzbCache,
  
  // Combined operations
  clearAllCaches,
  clearTransientCaches,
  runMaintenance,
  getAllCacheStats,
};
