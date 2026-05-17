const DEFAULT_SEARCH_UA = 'Prowlarr/2.0.5';
const DEFAULT_DOWNLOAD_UA = 'SABnzbd/4.5.5';

function getDefaultSearchUserAgent() {
  return DEFAULT_SEARCH_UA;
}

function getDefaultDownloadUserAgent() {
  return DEFAULT_DOWNLOAD_UA;
}

// Backward-compatible alias — returns the download UA. Existing callers that
// download NZB payloads continue to work unchanged.
function getRandomUserAgent() {
  return DEFAULT_DOWNLOAD_UA;
}

module.exports = {
  getRandomUserAgent,
  getDefaultSearchUserAgent,
  getDefaultDownloadUserAgent,
  DEFAULT_SEARCH_UA,
  DEFAULT_DOWNLOAD_UA,
};
