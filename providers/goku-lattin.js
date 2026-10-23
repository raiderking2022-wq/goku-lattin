/* Goku lattin 0.1.1. Native Nuvio provider. No eval, Node imports or embedded keys.
 * Presentation branding is not network anonymity. Only use authorized content.
 */
'use strict';
var NAME = 'Goku lattin';
var BASE = 'https://www.cinecalidad.my';
var UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36';
function report(stage, detail) {
  // Never log request URLs, credentials, signed streams or upstream filenames.
  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log('[Goku lattin 0.1.1] ' + stage + (detail ? ': ' + detail : ''));
  }
}

function absolute(value, base) {
  value = String(value || '').replace(/&amp;/g, '&').replace(/\\\//g, '/').trim();
  if (/^https:\/\//i.test(value)) return value;
  var origin = (base || BASE).match(/^https:\/\/[^/]+/);
  if (/^\/\//.test(value)) return 'https:' + value;
  if (!origin || !value || /^[a-z]+:/i.test(value)) return '';
  return value.charAt(0) === '/' ? origin[0] + value :
    base.replace(/[^/]*$/, '') + value;
}
function text(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#(\d+);/g, function (_, n) {
      return String.fromCharCode(+n);
    }).replace(/\s+/g, ' ').trim();
}
function attributes(tag) {
  var out = {}, re = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g, m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] =
    m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
  return out;
}
function request(url, referer) {
  if (!/^https:\/\//i.test(url)) return Promise.reject(new Error('invalid_url'));
  var controller = typeof AbortController === 'function' ? new AbortController() : null;
  var timer = null;
  if (controller && typeof setTimeout === 'function') {
    timer = setTimeout(function () { controller.abort(); }, 12000);
  }
  var options = { headers: { 'User-Agent': UA, 'Referer': referer || BASE + '/' } };
  if (controller) options.signal = controller.signal;
  return fetch(url, options).then(function (r) {
    if (r.ok === false || (typeof r.status === 'number' && r.status >= 400)) {
      throw new Error('http_' + r.status);
    }
    return r.text().then(function (body) {
      if (body.length > 2500000) throw new Error('response_too_large');
      return { text: body, url: r.url || url };
    });
  }).then(function (r) {
    if (timer) clearTimeout(timer);
    return r;
  }, function (e) {
    if (timer) clearTimeout(timer);
    throw e;
  });
}
function base64(input) {
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    s = String(input).replace(/\s/g, ''), acc = 0, bits = 0, out = '';
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('bad_base64');
  for (var i = 0; i < s.length && s[i] !== '='; i++) {
    acc = (acc << 6) | alphabet.indexOf(s[i]); bits += 6;
    if (bits >= 8) { bits -= 8; out += String.fromCharCode((acc >> bits) & 255); }
  }
  return out;
}
function decodeConfig(input) {
  var s = String(input).replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13));
  }).replace(/@\$|\^\^|~@|%\?|\*~|!!|#&|_/g, '');
  s = base64(s).split('').map(function (c) {
    return String.fromCharCode(c.charCodeAt(0) - 3);
  }).reverse().join('');
  return JSON.parse(base64(s));
}
function playerConfig(html, code) {
  var re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, m;
  while ((m = re.exec(html))) {
    try {
      if (attributes(m[1]).type !== 'application/json') continue;
      var raw = JSON.parse(m[2]);
      var cfg = Array.isArray(raw) && typeof raw[0] === 'string' ? decodeConfig(raw[0]) : raw;
      // Only the requested player's configuration. Never collect arbitrary ad,
      // trailer or demo-video URLs from scripts.
      if (cfg && cfg.file_code === code && /^https:\/\//.test(cfg.source || '') &&
          /\.m3u8(?:[?#]|$)/i.test(cfg.source)) return cfg;
    } catch (_) {}
  }
  return null;
}
function candidates(html) {
  var section = html.match(/id=["']?content_inside["']?([\s\S]*?)(?:id=["']?sidebar\b|id=["']?footer\b|$)/i);
  var input = section ? section[1] : html;
  var re = /<a\b[^>]*>/gi, m, out = [];
  while ((m = re.exec(input))) {
    var u = absolute(attributes(m[0]).href, BASE + '/');
    if (u.indexOf(BASE + '/pelicula/') === 0 && out.indexOf(u) === -1) out.push(u);
  }
  return out.slice(0, 5);
}
function movieInfo(html) {
  var imdb = html.match(/imdb\.com\/title\/(tt\d+)/i);
  var quality = html.match(/<strong>\s*Calidad:\s*<\/strong>([^<]*)/i);
  var audio = html.match(/<strong>\s*Audio:\s*<\/strong>([^<]*)/i);
  var re = /<a\b[^>]*>/gi, m, players = [];
  while ((m = re.exec(html))) {
    var a = attributes(m[0]);
    if (a.service === 'OnlineVoe' && /^[a-z0-9]{8,20}$/i.test(a.data || '')) {
      players.push({ code: a.data, url: 'https://voe.sx/e/' + a.data });
    }
  }
  return {
    imdb: imdb ? imdb[1] : '',
    quality: quality ? text(quality[1]) : '',
    audio: audio ? text(audio[1]) : '',
    players: players.slice(0, 3)
  };
}
function metadata(id) {
  var imdb = /^(?:imdb:)?(tt\d{5,12})$/.exec(id);
  if (imdb) {
    return imdbMetadata(imdb[1]);
  }
  var numeric = /^(?:tmdb:)?(\d{1,10})$/.exec(id);
  var key = typeof TMDB_API_KEY !== 'undefined' ? TMDB_API_KEY : '';
  if (!numeric) return Promise.reject(new Error('invalid_id'));
  function withoutKey() {
    report('metadata', 'public_id_lookup');
    // Public Wikidata ID mapping. The numeric identifier is validated above;
    // no API key, title history or device identifier is sent.
    var query = 'SELECT ?imdb WHERE {?item wdt:P4947 "' + numeric[1] +
      '"; wdt:P345 ?imdb} LIMIT 1';
    return request('https://query.wikidata.org/sparql?query=' +
      encodeURIComponent(query) + '&format=json', 'https://query.wikidata.org/').then(function (r) {
      var data = JSON.parse(r.text);
      var bindings = data.results && data.results.bindings;
      var value = bindings && bindings[0] && bindings[0].imdb && bindings[0].imdb.value;
      if (!/^tt\d{5,12}$/.test(value || '')) throw new Error('metadata_id_not_found');
      return imdbMetadata(value);
    });
  }
  if (!key) return withoutKey();
  // Key is injected by Nuvio. Never stored, logged or sent to other hosts.
  return request('https://api.themoviedb.org/3/movie/' + numeric[1] +
    '?language=es-MX&api_key=' + encodeURIComponent(key)).then(function (r) {
    var meta = JSON.parse(r.text);
    if (!/^tt\d{5,12}$/.test(meta.imdb_id || '')) throw new Error('missing_imdb');
    return { imdb: meta.imdb_id, titles: [meta.title, meta.original_title].filter(Boolean) };
  }).catch(function (e) {
    report('metadata_primary_failed', safeError(e));
    return withoutKey();
  });
}
function imdbMetadata(id) {
  return request('https://v3-cinemeta.strem.io/meta/movie/' + id + '.json',
    'https://v3-cinemeta.strem.io/').then(function (r) {
      var meta = JSON.parse(r.text).meta || {};
      if (!meta.name) throw new Error('metadata_title_missing');
      return { imdb: id, titles: [meta.name] };
    });
}
function safeError(e) {
  var value = e && e.message || '';
  // Only developer-owned error codes; network errors can contain secret URLs.
  return /^(?:http_\d+|metadata_[a-z_]+|missing_imdb|invalid_id|not_hls|empty_playlist|playlist_depth|response_too_large)$/.test(value) ?
    value : 'network_or_parse_error';
}
function findMovie(meta) {
  var queries = meta.titles.slice(0, 2);
  // Source titles can omit leading articles (e.g. "The Matrix" → "Matrix").
  var withoutArticle = queries[0] && queries[0].replace(/^(?:the|a|an|el|la|los|las|un|una)\s+/i, '');
  if (withoutArticle && withoutArticle !== queries[0] && queries.indexOf(withoutArticle) === -1) {
    queries.push(withoutArticle);
  }
  // A distinctive first word helps when a translated title differs.
  if (queries[0] && queries[0].split(/[ :.,]+/)[0].length >= 5) {
    queries.push(queries[0].split(/[ :.,]+/)[0]);
  }
  var seen = {}, found = null;
  function inspect(urls, i) {
    if (found || i >= urls.length) return Promise.resolve();
    var u = urls[i];
    if (seen[u]) return inspect(urls, i + 1);
    seen[u] = true;
    return request(u).then(function (r) {
      var info = movieInfo(r.text);
      // Exact IMDb match, not loose title matching: avoids wrong remakes.
      if (info.imdb === meta.imdb) found = { url: r.url, info: info };
    }).catch(function (e) { report('movie_lookup_failed', safeError(e)); })
      .then(function () { return inspect(urls, i + 1); });
  }
  function search(i) {
    if (found || i >= queries.length) return Promise.resolve(found);
    return request(BASE + '/?s=' + encodeURIComponent(queries[i])).then(function (r) {
      return inspect(candidates(r.text), 0);
    }).catch(function (e) { report('search_failed', safeError(e)); })
      .then(function () { return search(i + 1); });
  }
  return search(0);
}
function resolvePlayer(player, referer) {
  var visited = {};
  function walk(url, parent, depth) {
    if (depth > 2 || visited[url]) return Promise.resolve(null);
    visited[url] = true;
    return request(url, parent).then(function (r) {
      var cfg = playerConfig(r.text, player.code);
      if (cfg) return { config: cfg, referer: r.url };
      // Follow only the provider's explicit HTTPS location redirect that retains
      // the same video code. Do not execute remote scripts.
      var redirect = r.text.match(/(?:window\.)?location(?:\.href)?\s*=\s*(["'])(https:\/\/[^"']+)\1/i);
      if (redirect && redirect[2].split(/[?#]/)[0].slice(-player.code.length) === player.code) {
        return walk(redirect[2], r.url, depth + 1);
      }
      return null;
    });
  }
  return walk(player.url, referer, 0);
}
function playlist(url, referer, depth) {
  if (depth > 2) return Promise.reject(new Error('playlist_depth'));
  return request(url, referer).then(function (r) {
    if (!/^\s*#EXTM3U/.test(r.text)) throw new Error('not_hls');
    var lines = r.text.split(/\r?\n/), height = 0, first = '';
    for (var i = 0; i < lines.length; i++) {
      if (/^#EXT-X-STREAM-INF:/.test(lines[i])) {
        var res = lines[i].match(/RESOLUTION=\d+x(\d+)/);
        if (res) height = Math.max(height, +res[1]);
        for (var j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && lines[j].charAt(0) !== '#') {
            if (!first) first = absolute(lines[j].trim(), r.url);
            break;
          }
        }
      }
    }
    if (first) return playlist(first, referer, depth + 1).then(function (child) {
      return { height: height || child.height };
    });
    if (!/#EXTINF:/.test(r.text)) throw new Error('empty_playlist');
    return { height: height };
  });
}
function streamsForMovie(movie) {
    if (!movie) { report('movie_not_found'); return []; }
    report('online_players', String(movie.info.players.length));
    return Promise.all(movie.info.players.map(function (player) {
      return resolvePlayer(player, movie.url).then(function (resolved) {
        if (!resolved) { report('player_config_not_found'); return null; }
        return playlist(resolved.config.source, resolved.referer, 0).then(function (probe) {
          var quality = probe.height ? probe.height + 'p' : 'Auto';
          var audio = /latino/i.test(movie.info.audio) ? 'Latino' :
            /espa[nñ]ol/i.test(movie.info.audio) ? 'Español' : 'Audio no confirmado';
          var headers = { Referer: resolved.referer, 'User-Agent': UA };
          // No upstream title, filename, website logo or server brand in labels.
          return {
            name: NAME,
            title: audio + ' · ' + quality + '\nReproducción directa',
            url: resolved.config.source,
            quality: quality, type: 'm3u8', provider: 'goku-lattin',
            language: audio === 'Audio no confirmado' ? 'und' : 'es',
            headers: headers,
            subtitles: [],
            behaviorHints: { notWebReady: true, proxyHeaders: { request: headers } }
          };
        });
      }).catch(function (e) { report('player_failed', safeError(e)); return null; });
    })).then(function (results) {
      var seen = {};
      return results.filter(function (s) {
        if (!s || seen[s.url]) return false;
        seen[s.url] = true;
        return true;
      }).map(function (s, i) {
        s.title += ' · Servidor ' + (i + 1);
        return s;
      });
    });
}
function getStreams(tmdbId, mediaType, season, episode) {
  var type = String(mediaType || '').toLowerCase();
  if (type !== 'movie' && type !== 'movies' && type !== 'film') return Promise.resolve([]);
  var id = String(tmdbId).trim();
  if (!/^(?:(?:imdb:)?tt\d{5,12}|(?:tmdb:)?\d{1,10})$/.test(id)) return Promise.resolve([]);
  report('start', /^\d+$/.test(id) || /^tmdb:/.test(id) ? 'tmdb' : 'imdb');
  return metadata(id).then(findMovie).then(streamsForMovie).then(function (streams) {
    report('streams', String(streams.length)); return streams;
  }).catch(function (e) {
    report('failed', safeError(e)); return [];
  });
}
module.exports = { getStreams: getStreams };
