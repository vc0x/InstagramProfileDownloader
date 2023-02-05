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
