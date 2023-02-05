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
