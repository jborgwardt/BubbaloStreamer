// Release classifier.
//
// We use @viren070/parse-torrent-title for title/season/episode parsing, then
// this regex table to derive the canonical quality / encode / visualTag /
// audioTag / audioChannel tier labels. These tier labels match the import
// schema vocabulary 1:1 (see OPTION_VOCAB in admin/app.js), so imported configs
// map cleanly onto the values our parser actually emits.
//
// matchPattern returns the FIRST matching key in insertion order, so the key
// order in each table below IS the priority order — do not reorder casually.

// (?<![^\s[(_\-.,]) — must be preceded by a boundary char (start, space,
// bracket, separator). (?=[\s)\]_.\-,]|$) — must be followed by the same or EOL.
const createRegex = (pattern) =>
  new RegExp(`(?<![^\\s\\[(_\\-.,])(${pattern})(?=[\\s\\)\\]_.\\-,]|$)`, 'i');

const PARSE_REGEX = {
  qualities: {
    'BluRay REMUX': createRegex('(bd|br|b|uhd)?remux'),
    BluRay: createRegex(
      '(?<!remux.*)(bd|blu[ .\\-_]?ray|((bd|br)[ .\\-_]?rip))(?!.*remux)'
    ),
    'WEB-DL': createRegex('web[ .\\-_]?(dl)?(?![ .\\-_]?(rip|DLRip|cam))'),
    WEBRip: createRegex('web[ .\\-_]?rip'),
    HDRip: createRegex('hd[ .\\-_]?rip|web[ .\\-_]?dl[ .\\-_]?rip'),
    'HC HD-Rip': createRegex('hc|hd[ .\\-_]?rip'),
    DVDRip: createRegex('dvd[ .\\-_]?(rip|mux|r|full|5|9)?'),
    HDTV: createRegex(
      '(hd|pd)tv|tv[ .\\-_]?rip|hdtv[ .\\-_]?rip|dsr(ip)?|sat[ .\\-_]?rip'
    ),
    CAM: createRegex('cam|hdcam|cam[ .\\-_]?rip'),
    TS: createRegex('telesync|ts|hd[ .\\-_]?ts|pdvd|predvd(rip)?'),
    TC: createRegex('telecine|tc|hd[ .\\-_]?tc'),
    SCR: createRegex('((dvd|bd|web|hd)?[ .\\-_]?)?(scr(eener)?)'),
  },
  // Generic tags are ordered last so the more specific ones win first.
  visualTags: {
    '10bit': createRegex('10[ .\\-_]?bit|hi10p?'),
    'HDR10+': createRegex('hdr[ .\\-_]?10[ .\\-_]?(p(lus)?|[+])'),
    HDR10: createRegex('hdr[ .\\-_]?10(?![ .\\-_]?(?:\\+|p(?:lus)?|bit|hi))'),
    HDR: createRegex(
      'hdr(?![ .\\-_]?(?:10(?![ .\\-_]?(?:bit|hi))|\\+|p(?:lus)?))'
    ),
    HLG: createRegex('hlg'),
    DV: createRegex('do?(lby)?[ .\\-_]?vi?(sion)?(?:[ .\\-_]?atmos)?|dv'),
    '3D': createRegex('(bd)?(3|three)[ .\\-_]?(d(imension)?(al)?)'),
    IMAX: createRegex('imax'),
    AI: createRegex('ai|(ai)?(upscal(ed?|ing)|enhanced?|re[ .\\-_]?graded?)'),
    SDR: createRegex('sdr'),
    'H-OU': createRegex('h?(alf)?[ .\\-_]?(ou|over[ .\\-_]?under)'),
    'H-SBS': createRegex('h?(alf)?[ .\\-_]?(sbs|side[ .\\-_]?by[ .\\-_]?side)'),
  },
  audioTags: {
    Atmos: createRegex('atmos|ddpa\\d?'),
    'DD+': createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?((p(lus)?|\\+)a?)(?:[ .\\-_]?(2[ .\\-_]?0|5[ .\\-_]?1|7[ .\\-_]?1))?)|e[ .\\-_]?ac[ .\\-_]?3'
    ),
    DD: createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?(?:[ .\\-_]?(5[ .\\-_]?1|7[ .\\-_]?1|2[ .\\-_]?0?))?)|(?<!e[ .\\-_]?)ac[ .\\-_]?3'
    ),
    'DTS:X': createRegex('dts[ .\\-:_]?x'),
    'DTS-HD MA': createRegex('dts[ .\\-_]?hd[ .\\-_]?ma'),
    'DTS-HD': createRegex('dts[ .\\-_]?hd(?![ .\\-_]?ma)'),
    'DTS-ES': createRegex('dts[ .\\-_]?es'),
    DTS: createRegex(
      'dts(?![ .\\-:_]?(x(?=[\\s\\)\\]_.\\-,]|$)|hd[ .\\-_]?(ma)?|es))'
    ),
    TrueHD: createRegex('true[ .\\-_]?hd'),
    OPUS: createRegex('opus'),
    AAC: createRegex('q?aac(?:[ .\\-_]?2)?'),
    FLAC: createRegex('flac(?:[ .\\-_]?(lossless|2\\.0|x[2-4]))?'),
  },
  // Output values match the import schema set exactly (2.0/5.1/6.1/7.1). The
  // `N[sep]?ch` channel-count alternatives (6ch→5.1, 8ch→7.1) are a local
  // superset: neither the title parser nor the canonical regex recognise that
  // shorthand, but it is common in real releases and maps unambiguously. The
  // createRegex boundary guard already prevents a year fragment (e.g. "216ch")
  // from false-matching, since a preceding digit is not a valid boundary char.
  audioChannels: {
    // Prefix group also accepts AAC/DDP so "AAC2.0"/"DDP2.0" match — without it
    // the boundary guard rejects a "2.0" glued to a codec tag (the title parser
    // handles this, the canonical regex alone does not).
    '2.0': createRegex('(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?((p(lus)?|\\+)a?)?|aac)?2[ .\\-_]?0(ch)?'),
    '5.1': createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?((p(lus)?|\\+)a?)?)?5[ .\\-_]?1(ch)?|6[ .\\-_]?ch'
    ),
    '6.1': createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?((p(lus)?|\\+)a?)?)?6[ .\\-_]?1(ch)?'
    ),
    '7.1': createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?((p(lus)?|\\+)a?)?)?7[ .\\-_]?1(ch)?|8[ .\\-_]?ch'
    ),
  },
  encodes: {
    HEVC: createRegex('hevc[ .\\-_]?(10)?|[xh][ .\\-_]?265'),
    AVC: createRegex('avc|[xh][ .\\-_]?264'),
    AV1: createRegex('av1'),
    XviD: createRegex('xvid'),
    DivX: createRegex('divx|dvix'),
  },
};

// First matching key in insertion order (= priority).
function matchPattern(filename, patterns) {
  const entry = Object.entries(patterns).find(([, pattern]) => pattern.test(filename));
  return entry ? entry[0] : undefined;
}

// All matching keys (multi-valued fields: visual/audio tags, audio channels).
function matchMultiplePatterns(filename, patterns) {
  return Object.entries(patterns)
    .filter(([, pattern]) => pattern.test(filename))
    .map(([tag]) => tag);
}

// Three composite "fake" visual tags are derived after matching so users can
// filter/sort on HDR+DV / DV-only / HDR-only. Mutates + returns the tag list.
function applyCompositeVisualTags(visualTags) {
  const hasHdr = visualTags.some((tag) => tag.startsWith('HDR'));
  const hasDv = visualTags.some((tag) => tag.startsWith('DV'));
  if (hasHdr && hasDv) {
    const hdrIndex = visualTags.findIndex((tag) => tag.startsWith('HDR'));
    const dvIndex = visualTags.findIndex((tag) => tag.startsWith('DV'));
    visualTags.splice(Math.min(hdrIndex, dvIndex), 0, 'HDR+DV');
  } else if (hasDv) {
    visualTags.push('DV Only');
  } else if (hasHdr) {
    visualTags.push('HDR Only');
  }
  return visualTags;
}

// Strip the parsed title out of the filename before regex matching — prevents a
// title word like "Cam"/"DV"/"AI" from false-matching a quality/tag. Then
// normalise separators to dots.
function stripTitle(filename, title) {
  if (title && title.length > 4) {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleRegex = new RegExp(escapedTitle.replace(/ /g, '[._ ]'), 'i');
    filename = filename.replace(titleRegex, '').trim();
    filename = filename.replace(/\s+/g, '.').replace(/^\.+|\.+$/g, '');
  }
  return filename;
}

/**
 * Classify a release filename into the canonical tier labels.
 * @param {string} filename  raw release title
 * @param {string} [title]   parsed title (from the title parser) used to strip false matches
 * @returns {{quality: string|null, encode: string|null, visualTags: string[], audioTags: string[], audioChannels: string[]}}
 */
function classifyRelease(filename, title) {
  const name = typeof filename === 'string' ? filename : '';
  const cleaned = stripTitle(name, title);
  return {
    quality: matchPattern(cleaned, PARSE_REGEX.qualities) || null,
    encode: matchPattern(cleaned, PARSE_REGEX.encodes) || null,
    visualTags: applyCompositeVisualTags(matchMultiplePatterns(cleaned, PARSE_REGEX.visualTags)),
    audioTags: matchMultiplePatterns(cleaned, PARSE_REGEX.audioTags),
    audioChannels: matchMultiplePatterns(cleaned, PARSE_REGEX.audioChannels),
  };
}

module.exports = {
  PARSE_REGEX,
  matchPattern,
  matchMultiplePatterns,
  classifyRelease,
};
