import { Window } from 'happy-dom';
import path from 'node:path';

export const projectRoot = path.resolve(import.meta.dirname, '../..');

let importCounter = 0;
const nativeGlobals = new Map([
  ['window', globalThis.window],
  ['document', globalThis.document],
  ['navigator', globalThis.navigator],
  ['location', globalThis.location],
  ['history', globalThis.history],
  ['sessionStorage', globalThis.sessionStorage],
  ['FormData', globalThis.FormData],
  ['URL', globalThis.URL],
  ['IntersectionObserver', globalThis.IntersectionObserver],
  ['console', globalThis.console]
]);

export const createDom = (html, url = 'http://127.0.0.1/index.html') => {
  const window = new Window({
    url,
    settings: {
      disableCSSFileLoading: true,
      disableJavaScriptFileLoading: true
    }
  });
  window.SyntaxError = window.SyntaxError || SyntaxError;
  window.document.write(html);
  window.document.close();

  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    media: '',
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    }
  }));

  window.IntersectionObserver = window.IntersectionObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.scrollTo = window.scrollTo || (() => {});
  window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || (() => {});

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.navigator = window.navigator;
  globalThis.location = window.location;
  globalThis.history = window.history;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.FormData = window.FormData;
  globalThis.URL = window.URL;
  globalThis.IntersectionObserver = window.IntersectionObserver;

  return window;
};

export const importFresh = async (modulePath) => {
  importCounter += 1;
  return import(`${modulePath}?testRun=${importCounter}`);
};

export const fireDOMContentLoaded = () => {
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
};

export const resetDom = () => {
  for (const [key, value] of nativeGlobals) {
    if (value === undefined) {
      delete globalThis[key];
    } else {
      globalThis[key] = value;
    }
  }
};
