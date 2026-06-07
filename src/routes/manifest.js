const specialMetadata = require('../services/specialMetadata');

module.exports = function createManifestHandler(getConfig) {
  return function manifestHandler(req, res) {
    const cfg = getConfig(req.profileName);
    if (cfg.profileUnknown) {
      res.status(404).json({ error: 'Unknown profile' });
      return;
    }
    const {
      STREAMING_MODE,
      ADDON_NAME,
      DEFAULT_ADDON_NAME,
      ADDON_BASE_URL,
      ADDON_VERSION,
      NZBDAV_HISTORY_CATALOG_LIMIT,
      profileSlug,
      profileDisplayName,
      profileNameOverridden,
    } = cfg;

    if (!ADDON_BASE_URL) {
      throw new Error('ADDON_BASE_URL is not configured');
    }

    const isNative = STREAMING_MODE === 'native';
    // Each profile is a DISTINCT Stremio addon: Stremio dedupes by manifest id, so a
    // profile needs its own id + a distinguishable name. Default (no profile) is
    // byte-identical to before.
    const baseId = isNative ? 'com.usenet.streamer.native' : 'com.usenet.streamer';
    const manifestId = profileSlug ? `${baseId}.p.${profileSlug}` : baseId;
    const displayName = profileSlug
      ? (profileNameOverridden ? ADDON_NAME : `${ADDON_NAME || DEFAULT_ADDON_NAME} (${profileDisplayName})`)
      : ADDON_NAME;

    const description = isNative
      ? 'Native Usenet streaming for Stremio v5 (Windows) - NZB sources via direct Newznab indexers'
      : 'Usenet-powered instant streams for Stremio via Prowlarr/NZBHydra and NZBDav';

    const catalogs = [];
    const resources = ['stream'];
    const idPrefixes = ['tt', 'tvdb', 'tmdb', 'kitsu', 'mal', 'anilist', 'pt', specialMetadata.SPECIAL_ID_PREFIX];
    if (!isNative && NZBDAV_HISTORY_CATALOG_LIMIT > 0) {
      const catalogName = displayName || DEFAULT_ADDON_NAME;
      catalogs.push(
        { type: 'movie', id: 'nzbdav_completed', name: catalogName, pageSize: 20, extra: [{ name: 'skip' }] },
        { type: 'series', id: 'nzbdav_completed', name: catalogName, pageSize: 20, extra: [{ name: 'skip' }] }
      );
      resources.push('catalog', 'meta');
      idPrefixes.push('nzbdav');
    }

    res.json({
      id: manifestId,
      version: ADDON_VERSION,
      name: displayName,
      description,
      logo: `${ADDON_BASE_URL.replace(/\/$/, '')}/assets/icon.png`,
      resources,
      types: ['movie', 'series', 'channel', 'tv'],
      catalogs,
      idPrefixes
    });
  };
};
