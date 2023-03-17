// noinspection SpellCheckingInspection,JSUnresolvedVariable,JSUnresolvedFunction,TypeScriptUMDGlobal,JSUnusedGlobalSymbols
// ==UserScript==
// @name InstagramProfileDownloader
// @namespace https://github.com/backwards221
// @author backwards221
// @description Downloads Instagram profiles
// @version 1.0.0
// @updateURL https://github.com/backwards221/InstagramProfileDownloader/raw/main/dist/build.user.js
// @downloadURL https://github.com/backwards221/InstagramProfileDownloader/raw/main/dist/build.user.js
// @icon https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @license WTFPL; http://www.wtfpl.net/txt/copying/
// @match https://instagram.com/*
// @match https://www.instagram.com/*
// @require https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @connect self
// @connect instagram.com
// @connect cdninstagram.com
// @connect githubusercontent.com
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log

// ==/UserScript==
const JSZip = window.JSZip;
const http = window.GM_xmlhttpRequest;
window.isFF = typeof InstallTrigger !== 'undefined';

const h = {
  /**
   * @param path
   * @returns {unknown}
   */
  basename: path =>
    path
      .replace(/\/(\s+)?$/, '')
      .split('/')
      .reverse()[0],
  /**
   * @param element
   * @returns {string}
   */
  show: element => (element.style.display = 'block'),
  /**
   * @param element
   * @returns {string}
   */
  hide: element => (element.style.display = 'none'),
  /**
   * @param executor
   * @returns {Promise<unknown>}
   */
  promise: executor => new Promise(executor),
  /**
   * @param ms
   * @returns {Promise<unknown>}
   */
  delayedResolve: async ms => await h.promise(resolve => setTimeout(resolve, ms)),
  /**
   * @param string
   * @param maxLength
   * @returns {string|*}
   */
  limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
  /**
   * @param needle
   * @param haystack
   * @param ignoreCase
   * @returns {boolean}
   */
  contains: (needle, haystack, ignoreCase = true) =>
    (ignoreCase ? haystack.toLowerCase().indexOf(needle.toLowerCase()) : haystack.indexOf(needle)) > -1,
  ui: {
    /**
     * @param element
     * @param text
     */
    setText: (element, text) => {
      element.textContent = text;
    },
    /**
     * @param element
     * @param props
     */
    setElProps: (element, props) => {
      for (const prop in props) {
        element.style[prop] = props[prop];
      }
    },
  },
  http: {
    /**
     * @param method
     * @param url
     * @param callbacks
     * @param headers
     * @param data
     * @param responseType
     * @returns {Promise<unknown>}
     */
    base: (method, url, callbacks = {}, headers = {}, data = {}, responseType = 'document') => {
      return h.promise((resolve, reject) => {
        let responseHeaders = null;
        http({
          url,
          method,
          responseType,
          data,
          headers: {
            Referer: url,
            ...headers,
          },
          onreadystatechange: response => {
            if (response.readyState === 2) {
              responseHeaders = response.responseHeaders;
            }
            callbacks && callbacks.onStateChange && callbacks.onStateChange(response);
          },
          onprogress: response => {
            callbacks && callbacks.onProgress && callbacks.onProgress(response);
          },
          onload: response => {
            const { responseText } = response;
            const dom = response?.response;
            callbacks && callbacks.onLoad && callbacks.onLoad(response);
            resolve({ source: responseText, dom, responseHeaders });
          },
          onerror: error => {
            callbacks && callbacks.onError && callbacks.onError(error);
            reject(error);
          },
        });
      });
    },
    /**
     * @param url
     * @param callbacks
     * @param headers
     * @param responseType
     * @returns {Promise<unknown>}
     */
    get: (url, callbacks = {}, headers = {}, responseType = 'document') => {
      return h.promise(resolve => resolve(h.http.base('GET', url, callbacks, headers, {}, responseType)));
    },
  },
  re: {
    /**
     * @param pattern
     * @param subject
     * @returns {*|null}
     */
    match: (pattern, subject) => {
      const matches = pattern.exec(subject);
      return matches && matches.length ? matches[0] : null;
    },
  },
};

const ui = {
  pBars: {
    /**
     * @param color
     * @param height
     * @param width
     * @returns {HTMLDivElement}
     */
    base: (color, height = '2px', width = '0%') => {
      const pb = document.createElement('div');
      pb.style.height = height;
      pb.style.background = color;
      pb.style.width = width;
      return pb;
    },
    /**
     * @param color
     * @returns {HTMLDivElement}
     */
    createFileProgressBar: (color = '#819ab7') => {
      const pb = ui.pBars.base(color);
      pb.style.marginTop = '3px';
      pb.style.marginBottom = '1px';
      return pb;
    },
    /**
     * @param color
     * @returns {HTMLDivElement}
     */
    createTotalProgressBar: (color = '#2d9053') => {
      const pb = ui.pBars.base(color);
      pb.style.marginBottom = '5px';
      return pb;
    },
  },
  labels: {
    /**
     * @param initialText
     * @param color
     * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
     */
    createBlockLabel: (initialText = null, color = '#959595') => {
      const container = document.createElement('div');
      container.style.color = color;
      container.style.fontSize = '12px';

      const span = document.createElement('span');
      container.appendChild(span);

      if (initialText) {
        span.textContent = initialText;
      }

      return {
        el: span,
        container,
      };
    },
    status: {
      /**
       * @param initialText
       * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
       */
      createStatusLabel: (initialText = '') => {
        return ui.labels.createBlockLabel(initialText);
      },
    },
  },
};
document.addEventListener('DOMContentLoaded', async () => {
  const headerSelector =
    'div[id^="mount_"] > div > div > div > div > div > div > div > div > div > section > main > div > header > section > div';

  let header = document.querySelector(headerSelector);

  while (!header) {
    header = document.querySelector(headerSelector);
    await h.delayedResolve(100);
  }

  const id = location.href
    .replace(/(\/)?\?.*/, '')
    .split('/')
    .filter((s) => s.trim() !== '')
    .reverse()[0];

  const headers = { 'User-Agent': 'Instagram 219.0.0.12.117 Android' };

  const { source } = await h.http.get(`https://instagram.com/${id}`, {}, headers);

  const profileId = h.contains('profile_id', source) ? h.re.match(/(?<="profile_id":")\d+/gis, source) : null;

  if (!profileId) {
    return;
  }

  const after = document.querySelector(`${headerSelector} > div > div > div`);

  const btnClass =
    'x1i10hfl xjqpnuy xa49m3k xqeqjp1 x2hbi6w x972fbf xcfux6l x1qhh985 xm0m39n xdl72j9 x2lah0s xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r x2lwn1j xeuugli xexx8yu x18d9i69 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x1lku1pv x1a2a7pz x6s0dn4 xjyslct x1lq5wgf xgqcy7u x30kzoy x9jhf4c x1ejq31n xd10rxx x1sy0etr x17r0tee x9f619 x1ypdohk x78zum5 x1i0vuye xwhw2v2 x10w6t97 xl56j7k x17ydfre x1f6kntn x1swvt13 x1pi30zi x2b8uid xlyipyv x87ps6o x14atkfc x1n2onr6 x1d5wrs8 x1gjpkn9 x175jnsf xsz8vos';

  const btnDownload = document.createElement('div');
  btnDownload.href = '#';
  btnDownload.className = after.getAttribute('class');
  btnDownload.innerHTML = `<div class="${btnClass}">🠋 Download</div>`;

  after.insertAdjacentElement('afterend', btnDownload);

  btnDownload.addEventListener('click', async () => {
    // Create download status / progress elements.
    const { el: statusLabel } = ui.labels.status.createStatusLabel('Resolving posts...');
    const filePBar = ui.pBars.createFileProgressBar();
    const totalPBar = ui.pBars.createTotalProgressBar();

    header.insertAdjacentElement('afterend', totalPBar);
    header.insertAdjacentElement('afterend', filePBar);
    header.insertAdjacentElement('afterend', statusLabel);

    h.hide(filePBar);
    h.hide(totalPBar);

    h.ui.setElProps(statusLabel, { color: '#2d9053', marginTop: '14px', fontWeight: 'bold' });

    const apiBaseUrl = `https://www.instagram.com/api/v1/feed/user`;

    const { source: response } = await h.http.get(`${apiBaseUrl}/${profileId}/?count=100`, {}, headers);

    let totalResolved = 0;
    const collect = async response => {
      const props = JSON.parse(response);
      const resolved = [];
      if (props && props.status === 'ok' && props.num_results > 0) {
        const items = Object.values(props.items);
        totalResolved += items.length;
        h.ui.setText(statusLabel, `Resolved ${totalResolved} posts...`);
        for (const item of items) {
          if (item.product_type === 'feed') {
            resolved.push({
              url: item.image_versions2.candidates[0].url,
              folder: 'Images',
            });
          } else if (item.product_type === 'carousel_container') {
            resolved.push(
              ...item.carousel_media.map(m => {
                return {
                  url: m.image_versions2.candidates[0].url,
                  folder: 'Images',
                };
              }),
            );
          } else if (item.product_type === 'clips') {
            resolved.push({
              url: item.video_versions[0].url,
              folder: 'Videos',
            });
          }
        }

        if (props.more_available === true && props.next_max_id) {
          await h.delayedResolve(1500);
          const { source } = await h.http.get(`${apiBaseUrl}/${profileId}/?count=100&max_id=${props.next_max_id}`, {}, headers);
          resolved.push(...(await collect(source)));
        }
      }

      return resolved;
    };

    const resolved = await collect(response);

    if (!resolved.length) {
      btnDownload.remove();
      return;
    }

    const props = JSON.parse(response);

    let profileFolder = id;

    if (props && props.user) {
      profileFolder = props.user.username;
    }

    let completed = 0;
    let successfullyCompleted = 0;

    const total = resolved.length;

    h.show(filePBar);
    h.show(totalPBar);

    const isFF = window.isFF;

    const zip = new JSZip();

    for (const { url, folder } of resolved) {
      const filename = h.basename(url.replace(/\?.*/, ''));

      const ellipsedUrl = h.limit(filename, 80);
      const setStatus = text => h.ui.setText(statusLabel, h.limit(text, 80));

      await h.http.get(
        url,
        {
          onProgress: response => {
            h.ui.setElProps(statusLabel, {
              color: '#469cf3',
            });
            const downloadedSizeInMB = Number(response.loaded / 1024 / 1024).toFixed(2);
            const totalSizeInMB = Number(response.total / 1024 / 1024).toFixed(2);
            if (response.total === -1 || response.totalSize === -1) {
              h.ui.setElProps(filePBar, { width: '0%' });
              setStatus(`${completed} / ${total} 🢒 ${downloadedSizeInMB} MB 🢒 ${ellipsedUrl}`);
            } else {
              h.show(filePBar);
              setStatus(`${completed} / ${total} 🢒 ${downloadedSizeInMB} MB / ${totalSizeInMB} MB  🢒 ${ellipsedUrl}`);
              h.ui.setElProps(filePBar, { width: `${(response.loaded / response.total) * 100}%` });
            }
          },
          onLoad: response => {
            completed++;
            successfullyCompleted++;

            setStatus(`${completed} / ${total} 🢒 ${ellipsedUrl}`);
            h.ui.setElProps(statusLabel, { color: '#2d9053' });
            h.ui.setElProps(totalPBar, { width: `${(completed / total) * 100}%` });

            const targetFolder = `Instagram/${profileFolder}/${folder}`;
            const saveAs = `${targetFolder}/${filename}`;

            if (isFF) {
              zip.file(`${folder}/${filename}`, response.response);
            } else {
              GM_download({
                url: URL.createObjectURL(response.response),
                name: saveAs,
                onload: () => {
                  console.log(`Written ${filename} to ${targetFolder}.`);
                },
                onerror: response => {
                  console.log(`Error writing file ${filename} to ${targetFolder}. There may be more details below.`);
                  console.log(response);
                },
              });
            }
          },
          onError: () => completed++,
        },
        headers,
        'blob',
      );
    }

    if (isFF) {
      let blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${profileFolder}.zip`);
    }

    h.hide(filePBar);
    h.hide(totalPBar);

    if (successfullyCompleted === resolved.length) {
      h.ui.setText(statusLabel, '✔ Profile downloaded successfully');
    } else {
      h.ui.setElProps(statusLabel, { color: '#902d2d' });
      if (successfullyCompleted > 0) {
        h.ui.setText(
          statusLabel,
          `🢒 Profile downloaded partially: ${resolved.length - successfullyCompleted} / ${resolved.length} downloaded successfully`,
        );
      } else {
        h.ui.setText(statusLabel, `🢒 Couldn't download any post!`);
      }
    }

    btnDownload.remove();
  });
});
