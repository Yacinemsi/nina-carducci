(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      (global.bootstrap = factory()));
})(this, function () {
  "use strict";
  const MAX_UID = 1e6;
  const MILLISECONDS_MULTIPLIER = 1e3;
  const TRANSITION_END = "transitionend";
  const toType = (obj) => {
    if (obj === null || obj === undefined) {
      return `${obj}`;
    }
    return {}.toString
      .call(obj)
      .match(/\s([a-z]+)/i)[1]
      .toLowerCase();
  };
  const getUID = (prefix) => {
    do {
      prefix += Math.floor(Math.random() * MAX_UID);
    } while (document.getElementById(prefix));
    return prefix;
  };
  const getSelector = (element) => {
    let selector = element.getAttribute("data-bs-target");
    if (!selector || selector === "#") {
      let hrefAttr = element.getAttribute("href");
      if (!hrefAttr || (!hrefAttr.includes("#") && !hrefAttr.startsWith("."))) {
        return null;
      }
      if (hrefAttr.includes("#") && !hrefAttr.startsWith("#")) {
        hrefAttr = `#${hrefAttr.split("#")[1]}`;
      }
      selector = hrefAttr && hrefAttr !== "#" ? hrefAttr.trim() : null;
    }
    return selector;
  };
  const getSelectorFromElement = (element) => {
    const selector = getSelector(element);
    if (selector) {
      return document.querySelector(selector) ? selector : null;
    }
    return null;
  };
  const getElementFromSelector = (element) => {
    const selector = getSelector(element);
    return selector ? document.querySelector(selector) : null;
  };
  const getTransitionDurationFromElement = (element) => {
    if (!element) {
      return 0;
    }
    let { transitionDuration, transitionDelay } =
      window.getComputedStyle(element);
    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay);
    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    }
    transitionDuration = transitionDuration.split(",")[0];
    transitionDelay = transitionDelay.split(",")[0];
    return (
      (Number.parseFloat(transitionDuration) +
        Number.parseFloat(transitionDelay)) *
      MILLISECONDS_MULTIPLIER
    );
  };
  const triggerTransitionEnd = (element) => {
    element.dispatchEvent(new Event(TRANSITION_END));
  };
  const isElement$1 = (obj) => {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (typeof obj.jquery !== "undefined") {
      obj = obj[0];
    }
    return typeof obj.nodeType !== "undefined";
  };
  const getElement = (obj) => {
    if (isElement$1(obj)) {
      return obj.jquery ? obj[0] : obj;
    }
    if (typeof obj === "string" && obj.length > 0) {
      return document.querySelector(obj);
    }
    return null;
  };
  const typeCheckConfig = (componentName, config, configTypes) => {
    Object.keys(configTypes).forEach((property) => {
      const expectedTypes = configTypes[property];
      const value = config[property];
      const valueType = value && isElement$1(value) ? "element" : toType(value);
      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(
          `${componentName.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`
        );
      }
    });
  };
  const isVisible = (element) => {
    if (!isElement$1(element) || element.getClientRects().length === 0) {
      return false;
    }
    return (
      getComputedStyle(element).getPropertyValue("visibility") === "visible"
    );
  };
  const isDisabled = (element) => {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }
    if (element.classList.contains("disabled")) {
      return true;
    }
    if (typeof element.disabled !== "undefined") {
      return element.disabled;
    }
    return (
      element.hasAttribute("disabled") &&
      element.getAttribute("disabled") !== "false"
    );
  };
  const findShadowRoot = (element) => {
    if (!document.documentElement.attachShadow) {
      return null;
    }
    if (typeof element.getRootNode === "function") {
      const root = element.getRootNode();
      return root instanceof ShadowRoot ? root : null;
    }
    if (element instanceof ShadowRoot) {
      return element;
    }
    if (!element.parentNode) {
      return null;
    }
    return findShadowRoot(element.parentNode);
  };
  const noop = () => {};
  const reflow = (element) => {
    element.offsetHeight;
  };
  const getjQuery = () => {
    const { jQuery } = window;
    if (jQuery && !document.body.hasAttribute("data-bs-no-jquery")) {
      return jQuery;
    }
    return null;
  };
  const DOMContentLoadedCallbacks = [];
  const onDOMContentLoaded = (callback) => {
    if (document.readyState === "loading") {
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener("DOMContentLoaded", () => {
          DOMContentLoadedCallbacks.forEach((callback) => callback());
        });
      }
      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };
  const isRTL = () => document.documentElement.dir === "rtl";
  const defineJQueryPlugin = (plugin) => {
    onDOMContentLoaded(() => {
      const $ = getjQuery();
      if ($) {
        const name = plugin.NAME;
        const JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin.jQueryInterface;
        $.fn[name].Constructor = plugin;
        $.fn[name].noConflict = () => {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin.jQueryInterface;
        };
      }
    });
  };
  const execute = (callback) => {
    if (typeof callback === "function") {
      callback();
    }
  };
  const executeAfterTransition = (
    callback,
    transitionElement,
    waitForTransition = true
  ) => {
    if (!waitForTransition) {
      execute(callback);
      return;
    }
    const durationPadding = 5;
    const emulatedDuration =
      getTransitionDurationFromElement(transitionElement) + durationPadding;
    let called = false;
    const handler = ({ target }) => {
      if (target !== transitionElement) {
        return;
      }
      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };
    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };
  const getNextActiveElement = (
    list,
    activeElement,
    shouldGetNext,
    isCycleAllowed
  ) => {
    let index = list.indexOf(activeElement);
    if (index === -1) {
      return list[!shouldGetNext && isCycleAllowed ? list.length - 1 : 0];
    }
    const listLength = list.length;
    index += shouldGetNext ? 1 : -1;
    if (isCycleAllowed) {
      index = (index + listLength) % listLength;
    }
    return list[Math.max(0, Math.min(index, listLength - 1))];
  };
  const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  const stripNameRegex = /\..*/;
  const stripUidRegex = /::\d+$/;
  const eventRegistry = {};
  let uidEvent = 1;
  const customEvents = { mouseenter: "mouseover", mouseleave: "mouseout" };
  const customEventsRegex = /^(mouseenter|mouseleave)/i;
  const nativeEvents = new Set([
    "click",
    "dblclick",
    "mouseup",
    "mousedown",
    "contextmenu",
    "mousewheel",
    "DOMMouseScroll",
    "mouseover",
    "mouseout",
    "mousemove",
    "selectstart",
    "selectend",
    "keydown",
    "keypress",
    "keyup",
    "orientationchange",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "pointerdown",
    "pointermove",
    "pointerup",
    "pointerleave",
    "pointercancel",
    "gesturestart",
    "gesturechange",
    "gestureend",
    "focus",
    "blur",
    "change",
    "reset",
    "select",
    "submit",
    "focusin",
    "focusout",
    "load",
    "unload",
    "beforeunload",
    "resize",
    "move",
    "DOMContentLoaded",
    "readystatechange",
    "error",
    "abort",
    "scroll",
  ]);
  function getUidEvent(element, uid) {
    return (uid && `${uid}::${uidEvent++}`) || element.uidEvent || uidEvent++;
  }
  function getEvent(element) {
    const uid = getUidEvent(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }
  function bootstrapHandler(element, fn) {
    return function handler(event) {
      event.delegateTarget = element;
      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn);
      }
      return fn.apply(element, [event]);
    };
  }
  function bootstrapDelegationHandler(element, selector, fn) {
    return function handler(event) {
      const domElements = element.querySelectorAll(selector);
      for (
        let { target } = event;
        target && target !== this;
        target = target.parentNode
      ) {
        for (let i = domElements.length; i--; ) {
          if (domElements[i] === target) {
            event.delegateTarget = target;
            if (handler.oneOff) {
              EventHandler.off(element, event.type, selector, fn);
            }
            return fn.apply(target, [event]);
          }
        }
      }
      return null;
    };
  }
  function findHandler(events, handler, delegationSelector = null) {
    const uidEventList = Object.keys(events);
    for (let i = 0, len = uidEventList.length; i < len; i++) {
      const event = events[uidEventList[i]];
      if (
        event.originalHandler === handler &&
        event.delegationSelector === delegationSelector
      ) {
        return event;
      }
    }
    return null;
  }
  function normalizeParams(originalTypeEvent, handler, delegationFn) {
    const delegation = typeof handler === "string";
    const originalHandler = delegation ? delegationFn : handler;
    let typeEvent = getTypeEvent(originalTypeEvent);
    const isNative = nativeEvents.has(typeEvent);
    if (!isNative) {
      typeEvent = originalTypeEvent;
    }
    return [delegation, originalHandler, typeEvent];
  }
  function addHandler(
    element,
    originalTypeEvent,
    handler,
    delegationFn,
    oneOff
  ) {
    if (typeof originalTypeEvent !== "string" || !element) {
      return;
    }
    if (!handler) {
      handler = delegationFn;
      delegationFn = null;
    }
    if (customEventsRegex.test(originalTypeEvent)) {
      const wrapFn = (fn) => {
        return function (event) {
          if (
            !event.relatedTarget ||
            (event.relatedTarget !== event.delegateTarget &&
              !event.delegateTarget.contains(event.relatedTarget))
          ) {
            return fn.call(this, event);
          }
        };
      };
      if (delegationFn) {
        delegationFn = wrapFn(delegationFn);
      } else {
        handler = wrapFn(handler);
      }
    }
    const [delegation, originalHandler, typeEvent] = normalizeParams(
      originalTypeEvent,
      handler,
      delegationFn
    );
    const events = getEvent(element);
    const handlers = events[typeEvent] || (events[typeEvent] = {});
    const previousFn = findHandler(
      handlers,
      originalHandler,
      delegation ? handler : null
    );
    if (previousFn) {
      previousFn.oneOff = previousFn.oneOff && oneOff;
      return;
    }
    const uid = getUidEvent(
      originalHandler,
      originalTypeEvent.replace(namespaceRegex, "")
    );
    const fn = delegation
      ? bootstrapDelegationHandler(element, handler, delegationFn)
      : bootstrapHandler(element, handler);
    fn.delegationSelector = delegation ? handler : null;
    fn.originalHandler = originalHandler;
    fn.oneOff = oneOff;
    fn.uidEvent = uid;
    handlers[uid] = fn;
    element.addEventListener(typeEvent, fn, delegation);
  }
  function removeHandler(
    element,
    events,
    typeEvent,
    handler,
    delegationSelector
  ) {
    const fn = findHandler(events[typeEvent], handler, delegationSelector);
    if (!fn) {
      return;
    }
    element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
    delete events[typeEvent][fn.uidEvent];
  }
  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    const storeElementEvent = events[typeEvent] || {};
    Object.keys(storeElementEvent).forEach((handlerKey) => {
      if (handlerKey.includes(namespace)) {
        const event = storeElementEvent[handlerKey];
        removeHandler(
          element,
          events,
          typeEvent,
          event.originalHandler,
          event.delegationSelector
        );
      }
    });
  }
  function getTypeEvent(event) {
    event = event.replace(stripNameRegex, "");
    return customEvents[event] || event;
  }
  const EventHandler = {
    on(element, event, handler, delegationFn) {
      addHandler(element, event, handler, delegationFn, false);
    },
    one(element, event, handler, delegationFn) {
      addHandler(element, event, handler, delegationFn, true);
    },
    off(element, originalTypeEvent, handler, delegationFn) {
      if (typeof originalTypeEvent !== "string" || !element) {
        return;
      }
      const [delegation, originalHandler, typeEvent] = normalizeParams(
        originalTypeEvent,
        handler,
        delegationFn
      );
      const inNamespace = typeEvent !== originalTypeEvent;
      const events = getEvent(element);
      const isNamespace = originalTypeEvent.startsWith(".");
      if (typeof originalHandler !== "undefined") {
        if (!events || !events[typeEvent]) {
          return;
        }
        removeHandler(
          element,
          events,
          typeEvent,
          originalHandler,
          delegation ? handler : null
        );
        return;
      }
      if (isNamespace) {
        Object.keys(events).forEach((elementEvent) => {
          removeNamespacedHandlers(
            element,
            events,
            elementEvent,
            originalTypeEvent.slice(1)
          );
        });
      }
      const storeElementEvent = events[typeEvent] || {};
      Object.keys(storeElementEvent).forEach((keyHandlers) => {
        const handlerKey = keyHandlers.replace(stripUidRegex, "");
        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          const event = storeElementEvent[keyHandlers];
          removeHandler(
            element,
            events,
            typeEvent,
            event.originalHandler,
            event.delegationSelector
          );
        }
      });
    },
    trigger(element, event, args) {
      if (typeof event !== "string" || !element) {
        return null;
      }
      const $ = getjQuery();
      const typeEvent = getTypeEvent(event);
      const inNamespace = event !== typeEvent;
      const isNative = nativeEvents.has(typeEvent);
      let jQueryEvent;
      let bubbles = true;
      let nativeDispatch = true;
      let defaultPrevented = false;
      let evt = null;
      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }
      if (isNative) {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(typeEvent, bubbles, true);
      } else {
        evt = new CustomEvent(event, { bubbles: bubbles, cancelable: true });
      }
      if (typeof args !== "undefined") {
        Object.keys(args).forEach((key) => {
          Object.defineProperty(evt, key, {
            get() {
              return args[key];
            },
          });
        });
      }
      if (defaultPrevented) {
        evt.preventDefault();
      }
      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }
      if (evt.defaultPrevented && typeof jQueryEvent !== "undefined") {
        jQueryEvent.preventDefault();
      }
      return evt;
    },
  };
  const elementMap = new Map();
  const Data = {
    set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, new Map());
      }
      const instanceMap = elementMap.get(element);
      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        console.error(
          `Bootstrap doesn't allow more than one instance per element. Bound instance: ${
            Array.from(instanceMap.keys())[0]
          }.`
        );
        return;
      }
      instanceMap.set(key, instance);
    },
    get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }
      return null;
    },
    remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }
      const instanceMap = elementMap.get(element);
      instanceMap["delete"](key);
      if (instanceMap.size === 0) {
        elementMap["delete"](element);
      }
    },
  };
  const VERSION = "5.1.3";
  class BaseComponent {
    constructor(element) {
      element = getElement(element);
      if (!element) {
        return;
      }
      this._element = element;
      Data.set(this._element, this.constructor.DATA_KEY, this);
    }
    dispose() {
      Data.remove(this._element, this.constructor.DATA_KEY);
      EventHandler.off(this._element, this.constructor.EVENT_KEY);
      Object.getOwnPropertyNames(this).forEach((propertyName) => {
        this[propertyName] = null;
      });
    }
    _queueCallback(callback, element, isAnimated = true) {
      executeAfterTransition(callback, element, isAnimated);
    }
    static getInstance(element) {
      return Data.get(getElement(element), this.DATA_KEY);
    }
    static getOrCreateInstance(element, config = {}) {
      return (
        this.getInstance(element) ||
        new this(element, typeof config === "object" ? config : null)
      );
    }
    static get VERSION() {
      return VERSION;
    }
    static get NAME() {
      throw new Error(
        'You have to implement the static method "NAME", for each component!'
      );
    }
    static get DATA_KEY() {
      return `bs.${this.NAME}`;
    }
    static get EVENT_KEY() {
      return `.${this.DATA_KEY}`;
    }
  }
  const enableDismissTrigger = (component, method = "hide") => {
    const clickEvent = `click.dismiss${component.EVENT_KEY}`;
    const name = component.NAME;
    EventHandler.on(
      document,
      clickEvent,
      `[data-bs-dismiss="${name}"]`,
      function (event) {
        if (["A", "AREA"].includes(this.tagName)) {
          event.preventDefault();
        }
        if (isDisabled(this)) {
          return;
        }
        const target = getElementFromSelector(this) || this.closest(`.${name}`);
        const instance = component.getOrCreateInstance(target);
        instance[method]();
      }
    );
  };
  const NAME$d = "alert";
  const DATA_KEY$c = "bs.alert";
  const EVENT_KEY$c = `.${DATA_KEY$c}`;
  const EVENT_CLOSE = `close${EVENT_KEY$c}`;
  const EVENT_CLOSED = `closed${EVENT_KEY$c}`;
  const CLASS_NAME_FADE$5 = "fade";
  const CLASS_NAME_SHOW$8 = "show";
  class Alert extends BaseComponent {
    static get NAME() {
      return NAME$d;
    }
    close() {
      const closeEvent = EventHandler.trigger(this._element, EVENT_CLOSE);
      if (closeEvent.defaultPrevented) {
        return;
      }
      this._element.classList.remove(CLASS_NAME_SHOW$8);
      const isAnimated = this._element.classList.contains(CLASS_NAME_FADE$5);
      this._queueCallback(
        () => this._destroyElement(),
        this._element,
        isAnimated
      );
    }
    _destroyElement() {
      this._element.remove();
      EventHandler.trigger(this._element, EVENT_CLOSED);
      this.dispose();
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Alert.getOrCreateInstance(this);
        if (typeof config !== "string") {
          return;
        }
        if (
          data[config] === undefined ||
          config.startsWith("_") ||
          config === "constructor"
        ) {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      });
    }
  }
  enableDismissTrigger(Alert, "close");
  defineJQueryPlugin(Alert);
  const NAME$c = "button";
  const DATA_KEY$b = "bs.button";
  const EVENT_KEY$b = `.${DATA_KEY$b}`;
  const DATA_API_KEY$7 = ".data-api";
  const CLASS_NAME_ACTIVE$3 = "active";
  const SELECTOR_DATA_TOGGLE$5 = '[data-bs-toggle="button"]';
  const EVENT_CLICK_DATA_API$6 = `click${EVENT_KEY$b}${DATA_API_KEY$7}`;
  class Button extends BaseComponent {
    static get NAME() {
      return NAME$c;
    }
    toggle() {
      this._element.setAttribute(
        "aria-pressed",
        this._element.classList.toggle(CLASS_NAME_ACTIVE$3)
      );
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Button.getOrCreateInstance(this);
        if (config === "toggle") {
          data[config]();
        }
      });
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$6,
    SELECTOR_DATA_TOGGLE$5,
    (event) => {
      event.preventDefault();
      const button = event.target.closest(SELECTOR_DATA_TOGGLE$5);
      const data = Button.getOrCreateInstance(button);
      data.toggle();
    }
  );
  defineJQueryPlugin(Button);
  function normalizeData(val) {
    if (val === "true") {
      return true;
    }
    if (val === "false") {
      return false;
    }
    if (val === Number(val).toString()) {
      return Number(val);
    }
    if (val === "" || val === "null") {
      return null;
    }
    return val;
  }
  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, (chr) => `-${chr.toLowerCase()}`);
  }
  const Manipulator = {
    setDataAttribute(element, key, value) {
      element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
    },
    removeDataAttribute(element, key) {
      element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
    },
    getDataAttributes(element) {
      if (!element) {
        return {};
      }
      const attributes = {};
      Object.keys(element.dataset)
        .filter((key) => key.startsWith("bs"))
        .forEach((key) => {
          let pureKey = key.replace(/^bs/, "");
          pureKey =
            pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
          attributes[pureKey] = normalizeData(element.dataset[key]);
        });
      return attributes;
    },
    getDataAttribute(element, key) {
      return normalizeData(
        element.getAttribute(`data-bs-${normalizeDataKey(key)}`)
      );
    },
    offset(element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
      };
    },
    position(element) {
      return { top: element.offsetTop, left: element.offsetLeft };
    },
  };
  const NODE_TEXT = 3;
  const SelectorEngine = {
    find(selector, element = document.documentElement) {
      return [].concat(
        ...Element.prototype.querySelectorAll.call(element, selector)
      );
    },
    findOne(selector, element = document.documentElement) {
      return Element.prototype.querySelector.call(element, selector);
    },
    children(element, selector) {
      return []
        .concat(...element.children)
        .filter((child) => child.matches(selector));
    },
    parents(element, selector) {
      const parents = [];
      let ancestor = element.parentNode;
      while (
        ancestor &&
        ancestor.nodeType === Node.ELEMENT_NODE &&
        ancestor.nodeType !== NODE_TEXT
      ) {
        if (ancestor.matches(selector)) {
          parents.push(ancestor);
        }
        ancestor = ancestor.parentNode;
      }
      return parents;
    },
    prev(element, selector) {
      let previous = element.previousElementSibling;
      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }
        previous = previous.previousElementSibling;
      }
      return [];
    },
    next(element, selector) {
      let next = element.nextElementSibling;
      while (next) {
        if (next.matches(selector)) {
          return [next];
        }
        next = next.nextElementSibling;
      }
      return [];
    },
    focusableChildren(element) {
      const focusables = [
        "a",
        "button",
        "input",
        "textarea",
        "select",
        "details",
        "[tabindex]",
        '[contenteditable="true"]',
      ]
        .map((selector) => `${selector}:not([tabindex^="-"])`)
        .join(", ");
      return this.find(focusables, element).filter(
        (el) => !isDisabled(el) && isVisible(el)
      );
    },
  };
  const NAME$b = "carousel";
  const DATA_KEY$a = "bs.carousel";
  const EVENT_KEY$a = `.${DATA_KEY$a}`;
  const DATA_API_KEY$6 = ".data-api";
  const ARROW_LEFT_KEY = "ArrowLeft";
  const ARROW_RIGHT_KEY = "ArrowRight";
  const TOUCHEVENT_COMPAT_WAIT = 500;
  const SWIPE_THRESHOLD = 40;
  const Default$a = {
    interval: 5e3,
    keyboard: true,
    slide: false,
    pause: "hover",
    wrap: true,
    touch: true,
  };
  const DefaultType$a = {
    interval: "(number|boolean)",
    keyboard: "boolean",
    slide: "(boolean|string)",
    pause: "(string|boolean)",
    wrap: "boolean",
    touch: "boolean",
  };
  const ORDER_NEXT = "next";
  const ORDER_PREV = "prev";
  const DIRECTION_LEFT = "left";
  const DIRECTION_RIGHT = "right";
  const KEY_TO_DIRECTION = {
    [ARROW_LEFT_KEY]: DIRECTION_RIGHT,
    [ARROW_RIGHT_KEY]: DIRECTION_LEFT,
  };
  const EVENT_SLIDE = `slide${EVENT_KEY$a}`;
  const EVENT_SLID = `slid${EVENT_KEY$a}`;
  const EVENT_KEYDOWN = `keydown${EVENT_KEY$a}`;
  const EVENT_MOUSEENTER = `mouseenter${EVENT_KEY$a}`;
  const EVENT_MOUSELEAVE = `mouseleave${EVENT_KEY$a}`;
  const EVENT_TOUCHSTART = `touchstart${EVENT_KEY$a}`;
  const EVENT_TOUCHMOVE = `touchmove${EVENT_KEY$a}`;
  const EVENT_TOUCHEND = `touchend${EVENT_KEY$a}`;
  const EVENT_POINTERDOWN = `pointerdown${EVENT_KEY$a}`;
  const EVENT_POINTERUP = `pointerup${EVENT_KEY$a}`;
  const EVENT_DRAG_START = `dragstart${EVENT_KEY$a}`;
  const EVENT_LOAD_DATA_API$2 = `load${EVENT_KEY$a}${DATA_API_KEY$6}`;
  const EVENT_CLICK_DATA_API$5 = `click${EVENT_KEY$a}${DATA_API_KEY$6}`;
  const CLASS_NAME_CAROUSEL = "carousel";
  const CLASS_NAME_ACTIVE$2 = "active";
  const CLASS_NAME_SLIDE = "slide";
  const CLASS_NAME_END = "carousel-item-end";
  const CLASS_NAME_START = "carousel-item-start";
  const CLASS_NAME_NEXT = "carousel-item-next";
  const CLASS_NAME_PREV = "carousel-item-prev";
  const CLASS_NAME_POINTER_EVENT = "pointer-event";
  const SELECTOR_ACTIVE$1 = ".active";
  const SELECTOR_ACTIVE_ITEM = ".active.carousel-item";
  const SELECTOR_ITEM = ".carousel-item";
  const SELECTOR_ITEM_IMG = ".carousel-item img";
  const SELECTOR_NEXT_PREV = ".carousel-item-next, .carousel-item-prev";
  const SELECTOR_INDICATORS = ".carousel-indicators";
  const SELECTOR_INDICATOR = "[data-bs-target]";
  const SELECTOR_DATA_SLIDE = "[data-bs-slide], [data-bs-slide-to]";
  const SELECTOR_DATA_RIDE = '[data-bs-ride="carousel"]';
  const POINTER_TYPE_TOUCH = "touch";
  const POINTER_TYPE_PEN = "pen";
  class Carousel extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._items = null;
      this._interval = null;
      this._activeElement = null;
      this._isPaused = false;
      this._isSliding = false;
      this.touchTimeout = null;
      this.touchStartX = 0;
      this.touchDeltaX = 0;
      this._config = this._getConfig(config);
      this._indicatorsElement = SelectorEngine.findOne(
        SELECTOR_INDICATORS,
        this._element
      );
      this._touchSupported =
        "ontouchstart" in document.documentElement ||
        navigator.maxTouchPoints > 0;
      this._pointerEvent = Boolean(window.PointerEvent);
      this._addEventListeners();
    }
    static get Default() {
      return Default$a;
    }
    static get NAME() {
      return NAME$b;
    }
    next() {
      this._slide(ORDER_NEXT);
    }
    nextWhenVisible() {
      if (!document.hidden && isVisible(this._element)) {
        this.next();
      }
    }
    prev() {
      this._slide(ORDER_PREV);
    }
    pause(event) {
      if (!event) {
        this._isPaused = true;
      }
      if (SelectorEngine.findOne(SELECTOR_NEXT_PREV, this._element)) {
        triggerTransitionEnd(this._element);
        this.cycle(true);
      }
      clearInterval(this._interval);
      this._interval = null;
    }
    cycle(event) {
      if (!event) {
        this._isPaused = false;
      }
      if (this._interval) {
        clearInterval(this._interval);
        this._interval = null;
      }
      if (this._config && this._config.interval && !this._isPaused) {
        this._updateInterval();
        this._interval = setInterval(
          (document.visibilityState ? this.nextWhenVisible : this.next).bind(
            this
          ),
          this._config.interval
        );
      }
    }
    to(index) {
      this._activeElement = SelectorEngine.findOne(
        SELECTOR_ACTIVE_ITEM,
        this._element
      );
      const activeIndex = this._getItemIndex(this._activeElement);
      if (index > this._items.length - 1 || index < 0) {
        return;
      }
      if (this._isSliding) {
        EventHandler.one(this._element, EVENT_SLID, () => this.to(index));
        return;
      }
      if (activeIndex === index) {
        this.pause();
        this.cycle();
        return;
      }
      const order = index > activeIndex ? ORDER_NEXT : ORDER_PREV;
      this._slide(order, this._items[index]);
    }
    _getConfig(config) {
      config = {
        ...Default$a,
        ...Manipulator.getDataAttributes(this._element),
        ...(typeof config === "object" ? config : {}),
      };
      typeCheckConfig(NAME$b, config, DefaultType$a);
      return config;
    }
    _handleSwipe() {
      const absDeltax = Math.abs(this.touchDeltaX);
      if (absDeltax <= SWIPE_THRESHOLD) {
        return;
      }
      const direction = absDeltax / this.touchDeltaX;
      this.touchDeltaX = 0;
      if (!direction) {
        return;
      }
      this._slide(direction > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT);
    }
    _addEventListeners() {
      if (this._config.keyboard) {
        EventHandler.on(this._element, EVENT_KEYDOWN, (event) =>
          this._keydown(event)
        );
      }
      if (this._config.pause === "hover") {
        EventHandler.on(this._element, EVENT_MOUSEENTER, (event) =>
          this.pause(event)
        );
        EventHandler.on(this._element, EVENT_MOUSELEAVE, (event) =>
          this.cycle(event)
        );
      }
      if (this._config.touch && this._touchSupported) {
        this._addTouchEventListeners();
      }
    }
    _addTouchEventListeners() {
      const hasPointerPenTouch = (event) => {
        return (
          this._pointerEvent &&
          (event.pointerType === POINTER_TYPE_PEN ||
            event.pointerType === POINTER_TYPE_TOUCH)
        );
      };
      const start = (event) => {
        if (hasPointerPenTouch(event)) {
          this.touchStartX = event.clientX;
        } else if (!this._pointerEvent) {
          this.touchStartX = event.touches[0].clientX;
        }
      };
      const move = (event) => {
        this.touchDeltaX =
          event.touches && event.touches.length > 1
            ? 0
            : event.touches[0].clientX - this.touchStartX;
      };
      const end = (event) => {
        if (hasPointerPenTouch(event)) {
          this.touchDeltaX = event.clientX - this.touchStartX;
        }
        this._handleSwipe();
        if (this._config.pause === "hover") {
          this.pause();
          if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
          }
          this.touchTimeout = setTimeout(
            (event) => this.cycle(event),
            TOUCHEVENT_COMPAT_WAIT + this._config.interval
          );
        }
      };
      SelectorEngine.find(SELECTOR_ITEM_IMG, this._element).forEach(
        (itemImg) => {
          EventHandler.on(itemImg, EVENT_DRAG_START, (event) =>
            event.preventDefault()
          );
        }
      );
      if (this._pointerEvent) {
        EventHandler.on(this._element, EVENT_POINTERDOWN, (event) =>
          start(event)
        );
        EventHandler.on(this._element, EVENT_POINTERUP, (event) => end(event));
        this._element.classList.add(CLASS_NAME_POINTER_EVENT);
      } else {
        EventHandler.on(this._element, EVENT_TOUCHSTART, (event) =>
          start(event)
        );
        EventHandler.on(this._element, EVENT_TOUCHMOVE, (event) => move(event));
        EventHandler.on(this._element, EVENT_TOUCHEND, (event) => end(event));
      }
    }
    _keydown(event) {
      if (/input|textarea/i.test(event.target.tagName)) {
        return;
      }
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        this._slide(direction);
      }
    }
    _getItemIndex(element) {
      this._items =
        element && element.parentNode
          ? SelectorEngine.find(SELECTOR_ITEM, element.parentNode)
          : [];
      return this._items.indexOf(element);
    }
    _getItemByOrder(order, activeElement) {
      const isNext = order === ORDER_NEXT;
      return getNextActiveElement(
        this._items,
        activeElement,
        isNext,
        this._config.wrap
      );
    }
    _triggerSlideEvent(relatedTarget, eventDirectionName) {
      const targetIndex = this._getItemIndex(relatedTarget);
      const fromIndex = this._getItemIndex(
        SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element)
      );
      return EventHandler.trigger(this._element, EVENT_SLIDE, {
        relatedTarget: relatedTarget,
        direction: eventDirectionName,
        from: fromIndex,
        to: targetIndex,
      });
    }
    _setActiveIndicatorElement(element) {
      if (this._indicatorsElement) {
        const activeIndicator = SelectorEngine.findOne(
          SELECTOR_ACTIVE$1,
          this._indicatorsElement
        );
        activeIndicator.classList.remove(CLASS_NAME_ACTIVE$2);
        activeIndicator.removeAttribute("aria-current");
        const indicators = SelectorEngine.find(
          SELECTOR_INDICATOR,
          this._indicatorsElement
        );
        for (let i = 0; i < indicators.length; i++) {
          if (
            Number.parseInt(
              indicators[i].getAttribute("data-bs-slide-to"),
              10
            ) === this._getItemIndex(element)
          ) {
            indicators[i].classList.add(CLASS_NAME_ACTIVE$2);
            indicators[i].setAttribute("aria-current", "true");
            break;
          }
        }
      }
    }
    _updateInterval() {
      const element =
        this._activeElement ||
        SelectorEngine.findOne(SELECTOR_ACTIVE_ITEM, this._element);
      if (!element) {
        return;
      }
      const elementInterval = Number.parseInt(
        element.getAttribute("data-bs-interval"),
        10
      );
      if (elementInterval) {
        this._config.defaultInterval =
          this._config.defaultInterval || this._config.interval;
        this._config.interval = elementInterval;
      } else {
        this._config.interval =
          this._config.defaultInterval || this._config.interval;
      }
    }
    _slide(directionOrOrder, element) {
      const order = this._directionToOrder(directionOrOrder);
      const activeElement = SelectorEngine.findOne(
        SELECTOR_ACTIVE_ITEM,
        this._element
      );
      const activeElementIndex = this._getItemIndex(activeElement);
      const nextElement = element || this._getItemByOrder(order, activeElement);
      const nextElementIndex = this._getItemIndex(nextElement);
      const isCycling = Boolean(this._interval);
      const isNext = order === ORDER_NEXT;
      const directionalClassName = isNext ? CLASS_NAME_START : CLASS_NAME_END;
      const orderClassName = isNext ? CLASS_NAME_NEXT : CLASS_NAME_PREV;
      const eventDirectionName = this._orderToDirection(order);
      if (nextElement && nextElement.classList.contains(CLASS_NAME_ACTIVE$2)) {
        this._isSliding = false;
        return;
      }
      if (this._isSliding) {
        return;
      }
      const slideEvent = this._triggerSlideEvent(
        nextElement,
        eventDirectionName
      );
      if (slideEvent.defaultPrevented) {
        return;
      }
      if (!activeElement || !nextElement) {
        return;
      }
      this._isSliding = true;
      if (isCycling) {
        this.pause();
      }
      this._setActiveIndicatorElement(nextElement);
      this._activeElement = nextElement;
      const triggerSlidEvent = () => {
        EventHandler.trigger(this._element, EVENT_SLID, {
          relatedTarget: nextElement,
          direction: eventDirectionName,
          from: activeElementIndex,
          to: nextElementIndex,
        });
      };
      if (this._element.classList.contains(CLASS_NAME_SLIDE)) {
        nextElement.classList.add(orderClassName);
        reflow(nextElement);
        activeElement.classList.add(directionalClassName);
        nextElement.classList.add(directionalClassName);
        const completeCallBack = () => {
          nextElement.classList.remove(directionalClassName, orderClassName);
          nextElement.classList.add(CLASS_NAME_ACTIVE$2);
          activeElement.classList.remove(
            CLASS_NAME_ACTIVE$2,
            orderClassName,
            directionalClassName
          );
          this._isSliding = false;
          setTimeout(triggerSlidEvent, 0);
        };
        this._queueCallback(completeCallBack, activeElement, true);
      } else {
        activeElement.classList.remove(CLASS_NAME_ACTIVE$2);
        nextElement.classList.add(CLASS_NAME_ACTIVE$2);
        this._isSliding = false;
        triggerSlidEvent();
      }
      if (isCycling) {
        this.cycle();
      }
    }
    _directionToOrder(direction) {
      if (![DIRECTION_RIGHT, DIRECTION_LEFT].includes(direction)) {
        return direction;
      }
      if (isRTL()) {
        return direction === DIRECTION_LEFT ? ORDER_PREV : ORDER_NEXT;
      }
      return direction === DIRECTION_LEFT ? ORDER_NEXT : ORDER_PREV;
    }
    _orderToDirection(order) {
      if (![ORDER_NEXT, ORDER_PREV].includes(order)) {
        return order;
      }
      if (isRTL()) {
        return order === ORDER_PREV ? DIRECTION_LEFT : DIRECTION_RIGHT;
      }
      return order === ORDER_PREV ? DIRECTION_RIGHT : DIRECTION_LEFT;
    }
    static carouselInterface(element, config) {
      const data = Carousel.getOrCreateInstance(element, config);
      let { _config } = data;
      if (typeof config === "object") {
        _config = { ..._config, ...config };
      }
      const action = typeof config === "string" ? config : _config.slide;
      if (typeof config === "number") {
        data.to(config);
      } else if (typeof action === "string") {
        if (typeof data[action] === "undefined") {
          throw new TypeError(`No method named "${action}"`);
        }
        data[action]();
      } else if (_config.interval && _config.ride) {
        data.pause();
        data.cycle();
      }
    }
    static jQueryInterface(config) {
      return this.each(function () {
        Carousel.carouselInterface(this, config);
      });
    }
    static dataApiClickHandler(event) {
      const target = getElementFromSelector(this);
      if (!target || !target.classList.contains(CLASS_NAME_CAROUSEL)) {
        return;
      }
      const config = {
        ...Manipulator.getDataAttributes(target),
        ...Manipulator.getDataAttributes(this),
      };
      const slideIndex = this.getAttribute("data-bs-slide-to");
      if (slideIndex) {
        config.interval = false;
      }
      Carousel.carouselInterface(target, config);
      if (slideIndex) {
        Carousel.getInstance(target).to(slideIndex);
      }
      event.preventDefault();
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$5,
    SELECTOR_DATA_SLIDE,
    Carousel.dataApiClickHandler
  );
  EventHandler.on(window, EVENT_LOAD_DATA_API$2, () => {
    const carousels = SelectorEngine.find(SELECTOR_DATA_RIDE);
    for (let i = 0, len = carousels.length; i < len; i++) {
      Carousel.carouselInterface(
        carousels[i],
        Carousel.getInstance(carousels[i])
      );
    }
  });
  defineJQueryPlugin(Carousel);
  const NAME$a = "collapse";
  const DATA_KEY$9 = "bs.collapse";
  const EVENT_KEY$9 = `.${DATA_KEY$9}`;
  const DATA_API_KEY$5 = ".data-api";
  const Default$9 = { toggle: true, parent: null };
  const DefaultType$9 = { toggle: "boolean", parent: "(null|element)" };
  const EVENT_SHOW$5 = `show${EVENT_KEY$9}`;
  const EVENT_SHOWN$5 = `shown${EVENT_KEY$9}`;
  const EVENT_HIDE$5 = `hide${EVENT_KEY$9}`;
  const EVENT_HIDDEN$5 = `hidden${EVENT_KEY$9}`;
  const EVENT_CLICK_DATA_API$4 = `click${EVENT_KEY$9}${DATA_API_KEY$5}`;
  const CLASS_NAME_SHOW$7 = "show";
  const CLASS_NAME_COLLAPSE = "collapse";
  const CLASS_NAME_COLLAPSING = "collapsing";
  const CLASS_NAME_COLLAPSED = "collapsed";
  const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
  const CLASS_NAME_HORIZONTAL = "collapse-horizontal";
  const WIDTH = "width";
  const HEIGHT = "height";
  const SELECTOR_ACTIVES = ".collapse.show, .collapse.collapsing";
  const SELECTOR_DATA_TOGGLE$4 = '[data-bs-toggle="collapse"]';
  class Collapse extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._isTransitioning = false;
      this._config = this._getConfig(config);
      this._triggerArray = [];
      const toggleList = SelectorEngine.find(SELECTOR_DATA_TOGGLE$4);
      for (let i = 0, len = toggleList.length; i < len; i++) {
        const elem = toggleList[i];
        const selector = getSelectorFromElement(elem);
        const filterElement = SelectorEngine.find(selector).filter(
          (foundElem) => foundElem === this._element
        );
        if (selector !== null && filterElement.length) {
          this._selector = selector;
          this._triggerArray.push(elem);
        }
      }
      this._initializeChildren();
      if (!this._config.parent) {
        this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
      }
      if (this._config.toggle) {
        this.toggle();
      }
    }
    static get Default() {
      return Default$9;
    }
    static get NAME() {
      return NAME$a;
    }
    toggle() {
      if (this._isShown()) {
        this.hide();
      } else {
        this.show();
      }
    }
    show() {
      if (this._isTransitioning || this._isShown()) {
        return;
      }
      let actives = [];
      let activesData;
      if (this._config.parent) {
        const children = SelectorEngine.find(
          CLASS_NAME_DEEPER_CHILDREN,
          this._config.parent
        );
        actives = SelectorEngine.find(
          SELECTOR_ACTIVES,
          this._config.parent
        ).filter((elem) => !children.includes(elem));
      }
      const container = SelectorEngine.findOne(this._selector);
      if (actives.length) {
        const tempActiveData = actives.find((elem) => container !== elem);
        activesData = tempActiveData
          ? Collapse.getInstance(tempActiveData)
          : null;
        if (activesData && activesData._isTransitioning) {
          return;
        }
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_SHOW$5);
      if (startEvent.defaultPrevented) {
        return;
      }
      actives.forEach((elemActive) => {
        if (container !== elemActive) {
          Collapse.getOrCreateInstance(elemActive, { toggle: false }).hide();
        }
        if (!activesData) {
          Data.set(elemActive, DATA_KEY$9, null);
        }
      });
      const dimension = this._getDimension();
      this._element.classList.remove(CLASS_NAME_COLLAPSE);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.style[dimension] = 0;
      this._addAriaAndCollapsedClass(this._triggerArray, true);
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
        this._element.style[dimension] = "";
        EventHandler.trigger(this._element, EVENT_SHOWN$5);
      };
      const capitalizedDimension =
        dimension[0].toUpperCase() + dimension.slice(1);
      const scrollSize = `scroll${capitalizedDimension}`;
      this._queueCallback(complete, this._element, true);
      this._element.style[dimension] = `${this._element[scrollSize]}px`;
    }
    hide() {
      if (this._isTransitioning || !this._isShown()) {
        return;
      }
      const startEvent = EventHandler.trigger(this._element, EVENT_HIDE$5);
      if (startEvent.defaultPrevented) {
        return;
      }
      const dimension = this._getDimension();
      this._element.style[dimension] = `${
        this._element.getBoundingClientRect()[dimension]
      }px`;
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_COLLAPSING);
      this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW$7);
      const triggerArrayLength = this._triggerArray.length;
      for (let i = 0; i < triggerArrayLength; i++) {
        const trigger = this._triggerArray[i];
        const elem = getElementFromSelector(trigger);
        if (elem && !this._isShown(elem)) {
          this._addAriaAndCollapsedClass([trigger], false);
        }
      }
      this._isTransitioning = true;
      const complete = () => {
        this._isTransitioning = false;
        this._element.classList.remove(CLASS_NAME_COLLAPSING);
        this._element.classList.add(CLASS_NAME_COLLAPSE);
        EventHandler.trigger(this._element, EVENT_HIDDEN$5);
      };
      this._element.style[dimension] = "";
      this._queueCallback(complete, this._element, true);
    }
    _isShown(element = this._element) {
      return element.classList.contains(CLASS_NAME_SHOW$7);
    }
    _getConfig(config) {
      config = {
        ...Default$9,
        ...Manipulator.getDataAttributes(this._element),
        ...config,
      };
      config.toggle = Boolean(config.toggle);
      config.parent = getElement(config.parent);
      typeCheckConfig(NAME$a, config, DefaultType$9);
      return config;
    }
    _getDimension() {
      return this._element.classList.contains(CLASS_NAME_HORIZONTAL)
        ? WIDTH
        : HEIGHT;
    }
    _initializeChildren() {
      if (!this._config.parent) {
        return;
      }
      const children = SelectorEngine.find(
        CLASS_NAME_DEEPER_CHILDREN,
        this._config.parent
      );
      SelectorEngine.find(SELECTOR_DATA_TOGGLE$4, this._config.parent)
        .filter((elem) => !children.includes(elem))
        .forEach((element) => {
          const selected = getElementFromSelector(element);
          if (selected) {
            this._addAriaAndCollapsedClass([element], this._isShown(selected));
          }
        });
    }
    _addAriaAndCollapsedClass(triggerArray, isOpen) {
      if (!triggerArray.length) {
        return;
      }
      triggerArray.forEach((elem) => {
        if (isOpen) {
          elem.classList.remove(CLASS_NAME_COLLAPSED);
        } else {
          elem.classList.add(CLASS_NAME_COLLAPSED);
        }
        elem.setAttribute("aria-expanded", isOpen);
      });
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const _config = {};
        if (typeof config === "string" && /show|hide/.test(config)) {
          _config.toggle = false;
        }
        const data = Collapse.getOrCreateInstance(this, _config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$4,
    SELECTOR_DATA_TOGGLE$4,
    function (event) {
      if (
        event.target.tagName === "A" ||
        (event.delegateTarget && event.delegateTarget.tagName === "A")
      ) {
        event.preventDefault();
      }
      const selector = getSelectorFromElement(this);
      const selectorElements = SelectorEngine.find(selector);
      selectorElements.forEach((element) => {
        Collapse.getOrCreateInstance(element, { toggle: false }).toggle();
      });
    }
  );
  defineJQueryPlugin(Collapse);
  var top = "top";
  var bottom = "bottom";
  var right = "right";
  var left = "left";
  var auto = "auto";
  var basePlacements = [top, bottom, right, left];
  var start = "start";
  var end = "end";
  var clippingParents = "clippingParents";
  var viewport = "viewport";
  var popper = "popper";
  var reference = "reference";
  var variationPlacements = basePlacements.reduce(function (acc, placement) {
    return acc.concat([placement + "-" + start, placement + "-" + end]);
  }, []);
  var placements = []
    .concat(basePlacements, [auto])
    .reduce(function (acc, placement) {
      return acc.concat([
        placement,
        placement + "-" + start,
        placement + "-" + end,
      ]);
    }, []);
  var beforeRead = "beforeRead";
  var read = "read";
  var afterRead = "afterRead";
  var beforeMain = "beforeMain";
  var main = "main";
  var afterMain = "afterMain";
  var beforeWrite = "beforeWrite";
  var write = "write";
  var afterWrite = "afterWrite";
  var modifierPhases = [
    beforeRead,
    read,
    afterRead,
    beforeMain,
    main,
    afterMain,
    beforeWrite,
    write,
    afterWrite,
  ];
  function getNodeName(element) {
    return element ? (element.nodeName || "").toLowerCase() : null;
  }
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (node.toString() !== "[object Window]") {
      var ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }
  function isElement(node) {
    var OwnElement = getWindow(node).Element;
    return node instanceof OwnElement || node instanceof Element;
  }
  function isHTMLElement(node) {
    var OwnElement = getWindow(node).HTMLElement;
    return node instanceof OwnElement || node instanceof HTMLElement;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    var OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }
  function applyStyles(_ref) {
    var state = _ref.state;
    Object.keys(state.elements).forEach(function (name) {
      var style = state.styles[name] || {};
      var attributes = state.attributes[name] || {};
      var element = state.elements[name];
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function (name) {
        var value = attributes[name];
        if (value === false) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value === true ? "" : value);
        }
      });
    });
  }
  function effect$2(_ref2) {
    var state = _ref2.state;
    var initialStyles = {
      popper: {
        position: state.options.strategy,
        left: "0",
        top: "0",
        margin: "0",
      },
      arrow: { position: "absolute" },
      reference: {},
    };
    Object.assign(state.elements.popper.style, initialStyles.popper);
    state.styles = initialStyles;
    if (state.elements.arrow) {
      Object.assign(state.elements.arrow.style, initialStyles.arrow);
    }
    return function () {
      Object.keys(state.elements).forEach(function (name) {
        var element = state.elements[name];
        var attributes = state.attributes[name] || {};
        var styleProperties = Object.keys(
          state.styles.hasOwnProperty(name)
            ? state.styles[name]
            : initialStyles[name]
        );
        var style = styleProperties.reduce(function (style, property) {
          style[property] = "";
          return style;
        }, {});
        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (attribute) {
          element.removeAttribute(attribute);
        });
      });
    };
  }
  const applyStyles$1 = {
    name: "applyStyles",
    enabled: true,
    phase: "write",
    fn: applyStyles,
    effect: effect$2,
    requires: ["computeStyles"],
  };
  function getBasePlacement(placement) {
    return placement.split("-")[0];
  }
  function getBoundingClientRect(element, includeScale) {
    var rect = element.getBoundingClientRect();
    var scaleX = 1;
    var scaleY = 1;
    return {
      width: rect.width / scaleX,
      height: rect.height / scaleY,
      top: rect.top / scaleY,
      right: rect.right / scaleX,
      bottom: rect.bottom / scaleY,
      left: rect.left / scaleX,
      x: rect.left / scaleX,
      y: rect.top / scaleY,
    };
  }
  function getLayoutRect(element) {
    var clientRect = getBoundingClientRect(element);
    var width = element.offsetWidth;
    var height = element.offsetHeight;
    if (Math.abs(clientRect.width - width) <= 1) {
      width = clientRect.width;
    }
    if (Math.abs(clientRect.height - height) <= 1) {
      height = clientRect.height;
    }
    return {
      x: element.offsetLeft,
      y: element.offsetTop,
      width: width,
      height: height,
    };
  }
  function contains(parent, child) {
    var rootNode = child.getRootNode && child.getRootNode();
    if (parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      var next = child;
      do {
        if (next && parent.isSameNode(next)) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }
  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function isTableElement(element) {
    return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
  }
  function getDocumentElement(element) {
    return (
      (isElement(element) ? element.ownerDocument : element.document) ||
      window.document
    ).documentElement;
  }
  function getParentNode(element) {
    if (getNodeName(element) === "html") {
      return element;
    }
    return (
      element.assignedSlot ||
      element.parentNode ||
      (isShadowRoot(element) ? element.host : null) ||
      getDocumentElement(element)
    );
  }
  function getTrueOffsetParent(element) {
    if (
      !isHTMLElement(element) ||
      getComputedStyle$1(element).position === "fixed"
    ) {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;
    var isIE = navigator.userAgent.indexOf("Trident") !== -1;
    if (isIE && isHTMLElement(element)) {
      var elementCss = getComputedStyle$1(element);
      if (elementCss.position === "fixed") {
        return null;
      }
    }
    var currentNode = getParentNode(element);
    while (
      isHTMLElement(currentNode) &&
      ["html", "body"].indexOf(getNodeName(currentNode)) < 0
    ) {
      var css = getComputedStyle$1(currentNode);
      if (
        css.transform !== "none" ||
        css.perspective !== "none" ||
        css.contain === "paint" ||
        ["transform", "perspective"].indexOf(css.willChange) !== -1 ||
        (isFirefox && css.willChange === "filter") ||
        (isFirefox && css.filter && css.filter !== "none")
      ) {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    var window = getWindow(element);
    var offsetParent = getTrueOffsetParent(element);
    while (
      offsetParent &&
      isTableElement(offsetParent) &&
      getComputedStyle$1(offsetParent).position === "static"
    ) {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (
      offsetParent &&
      (getNodeName(offsetParent) === "html" ||
        (getNodeName(offsetParent) === "body" &&
          getComputedStyle$1(offsetParent).position === "static"))
    ) {
      return window;
    }
    return offsetParent || getContainingBlock(element) || window;
  }
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
  }
  var max = Math.max;
  var min = Math.min;
  var round = Math.round;
  function within(min$1, value, max$1) {
    return max(min$1, min(value, max$1));
  }
  function getFreshSideObject() {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  function mergePaddingObject(paddingObject) {
    return Object.assign({}, getFreshSideObject(), paddingObject);
  }
  function expandToHashMap(value, keys) {
    return keys.reduce(function (hashMap, key) {
      hashMap[key] = value;
      return hashMap;
    }, {});
  }
  var toPaddingObject = function toPaddingObject(padding, state) {
    padding =
      typeof padding === "function"
        ? padding(
            Object.assign({}, state.rects, { placement: state.placement })
          )
        : padding;
    return mergePaddingObject(
      typeof padding !== "number"
        ? padding
        : expandToHashMap(padding, basePlacements)
    );
  };
  function arrow(_ref) {
    var _state$modifiersData$;
    var state = _ref.state,
      name = _ref.name,
      options = _ref.options;
    var arrowElement = state.elements.arrow;
    var popperOffsets = state.modifiersData.popperOffsets;
    var basePlacement = getBasePlacement(state.placement);
    var axis = getMainAxisFromPlacement(basePlacement);
    var isVertical = [left, right].indexOf(basePlacement) >= 0;
    var len = isVertical ? "height" : "width";
    if (!arrowElement || !popperOffsets) {
      return;
    }
    var paddingObject = toPaddingObject(options.padding, state);
    var arrowRect = getLayoutRect(arrowElement);
    var minProp = axis === "y" ? top : left;
    var maxProp = axis === "y" ? bottom : right;
    var endDiff =
      state.rects.reference[len] +
      state.rects.reference[axis] -
      popperOffsets[axis] -
      state.rects.popper[len];
    var startDiff = popperOffsets[axis] - state.rects.reference[axis];
    var arrowOffsetParent = getOffsetParent(arrowElement);
    var clientSize = arrowOffsetParent
      ? axis === "y"
        ? arrowOffsetParent.clientHeight || 0
        : arrowOffsetParent.clientWidth || 0
      : 0;
    var centerToReference = endDiff / 2 - startDiff / 2;
    var min = paddingObject[minProp];
    var max = clientSize - arrowRect[len] - paddingObject[maxProp];
    var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
    var offset = within(min, center, max);
    var axisProp = axis;
    state.modifiersData[name] =
      ((_state$modifiersData$ = {}),
      (_state$modifiersData$[axisProp] = offset),
      (_state$modifiersData$.centerOffset = offset - center),
      _state$modifiersData$);
  }
  function effect$1(_ref2) {
    var state = _ref2.state,
      options = _ref2.options;
    var _options$element = options.element,
      arrowElement =
        _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
    if (arrowElement == null) {
      return;
    }
    if (typeof arrowElement === "string") {
      arrowElement = state.elements.popper.querySelector(arrowElement);
      if (!arrowElement) {
        return;
      }
    }
    if (!contains(state.elements.popper, arrowElement)) {
      return;
    }
    state.elements.arrow = arrowElement;
  }
  const arrow$1 = {
    name: "arrow",
    enabled: true,
    phase: "main",
    fn: arrow,
    effect: effect$1,
    requires: ["popperOffsets"],
    requiresIfExists: ["preventOverflow"],
  };
  function getVariation(placement) {
    return placement.split("-")[1];
  }
  var unsetSides = { top: "auto", right: "auto", bottom: "auto", left: "auto" };
  function roundOffsetsByDPR(_ref) {
    var x = _ref.x,
      y = _ref.y;
    var win = window;
    var dpr = win.devicePixelRatio || 1;
    return {
      x: round(round(x * dpr) / dpr) || 0,
      y: round(round(y * dpr) / dpr) || 0,
    };
  }
  function mapToStyles(_ref2) {
    var _Object$assign2;
    var popper = _ref2.popper,
      popperRect = _ref2.popperRect,
      placement = _ref2.placement,
      variation = _ref2.variation,
      offsets = _ref2.offsets,
      position = _ref2.position,
      gpuAcceleration = _ref2.gpuAcceleration,
      adaptive = _ref2.adaptive,
      roundOffsets = _ref2.roundOffsets;
    var _ref3 =
        roundOffsets === true
          ? roundOffsetsByDPR(offsets)
          : typeof roundOffsets === "function"
          ? roundOffsets(offsets)
          : offsets,
      _ref3$x = _ref3.x,
      x = _ref3$x === void 0 ? 0 : _ref3$x,
      _ref3$y = _ref3.y,
      y = _ref3$y === void 0 ? 0 : _ref3$y;
    var hasX = offsets.hasOwnProperty("x");
    var hasY = offsets.hasOwnProperty("y");
    var sideX = left;
    var sideY = top;
    var win = window;
    if (adaptive) {
      var offsetParent = getOffsetParent(popper);
      var heightProp = "clientHeight";
      var widthProp = "clientWidth";
      if (offsetParent === getWindow(popper)) {
        offsetParent = getDocumentElement(popper);
        if (
          getComputedStyle$1(offsetParent).position !== "static" &&
          position === "absolute"
        ) {
          heightProp = "scrollHeight";
          widthProp = "scrollWidth";
        }
      }
      offsetParent = offsetParent;
      if (
        placement === top ||
        ((placement === left || placement === right) && variation === end)
      ) {
        sideY = bottom;
        y -= offsetParent[heightProp] - popperRect.height;
        y *= gpuAcceleration ? 1 : -1;
      }
      if (
        placement === left ||
        ((placement === top || placement === bottom) && variation === end)
      ) {
        sideX = right;
        x -= offsetParent[widthProp] - popperRect.width;
        x *= gpuAcceleration ? 1 : -1;
      }
    }
    var commonStyles = Object.assign(
      { position: position },
      adaptive && unsetSides
    );
    if (gpuAcceleration) {
      var _Object$assign;
      return Object.assign(
        {},
        commonStyles,
        ((_Object$assign = {}),
        (_Object$assign[sideY] = hasY ? "0" : ""),
        (_Object$assign[sideX] = hasX ? "0" : ""),
        (_Object$assign.transform =
          (win.devicePixelRatio || 1) <= 1
            ? "translate(" + x + "px, " + y + "px)"
            : "translate3d(" + x + "px, " + y + "px, 0)"),
        _Object$assign)
      );
    }
    return Object.assign(
      {},
      commonStyles,
      ((_Object$assign2 = {}),
      (_Object$assign2[sideY] = hasY ? y + "px" : ""),
      (_Object$assign2[sideX] = hasX ? x + "px" : ""),
      (_Object$assign2.transform = ""),
      _Object$assign2)
    );
  }
  function computeStyles(_ref4) {
    var state = _ref4.state,
      options = _ref4.options;
    var _options$gpuAccelerat = options.gpuAcceleration,
      gpuAcceleration =
        _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
      _options$adaptive = options.adaptive,
      adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
      _options$roundOffsets = options.roundOffsets,
      roundOffsets =
        _options$roundOffsets === void 0 ? true : _options$roundOffsets;
    var commonStyles = {
      placement: getBasePlacement(state.placement),
      variation: getVariation(state.placement),
      popper: state.elements.popper,
      popperRect: state.rects.popper,
      gpuAcceleration: gpuAcceleration,
    };
    if (state.modifiersData.popperOffsets != null) {
      state.styles.popper = Object.assign(
        {},
        state.styles.popper,
        mapToStyles(
          Object.assign({}, commonStyles, {
            offsets: state.modifiersData.popperOffsets,
            position: state.options.strategy,
            adaptive: adaptive,
            roundOffsets: roundOffsets,
          })
        )
      );
    }
    if (state.modifiersData.arrow != null) {
      state.styles.arrow = Object.assign(
        {},
        state.styles.arrow,
        mapToStyles(
          Object.assign({}, commonStyles, {
            offsets: state.modifiersData.arrow,
            position: "absolute",
            adaptive: false,
            roundOffsets: roundOffsets,
          })
        )
      );
    }
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-placement": state.placement,
    });
  }
  const computeStyles$1 = {
    name: "computeStyles",
    enabled: true,
    phase: "beforeWrite",
    fn: computeStyles,
    data: {},
  };
  var passive = { passive: true };
  function effect(_ref) {
    var state = _ref.state,
      instance = _ref.instance,
      options = _ref.options;
    var _options$scroll = options.scroll,
      scroll = _options$scroll === void 0 ? true : _options$scroll,
      _options$resize = options.resize,
      resize = _options$resize === void 0 ? true : _options$resize;
    var window = getWindow(state.elements.popper);
    var scrollParents = [].concat(
      state.scrollParents.reference,
      state.scrollParents.popper
    );
    if (scroll) {
      scrollParents.forEach(function (scrollParent) {
        scrollParent.addEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window.addEventListener("resize", instance.update, passive);
    }
    return function () {
      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.removeEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window.removeEventListener("resize", instance.update, passive);
      }
    };
  }
  const eventListeners = {
    name: "eventListeners",
    enabled: true,
    phase: "write",
    fn: function fn() {},
    effect: effect,
    data: {},
  };
  var hash$1 = { left: "right", right: "left", bottom: "top", top: "bottom" };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, function (matched) {
      return hash$1[matched];
    });
  }
  var hash = { start: "end", end: "start" };
  function getOppositeVariationPlacement(placement) {
    return placement.replace(/start|end/g, function (matched) {
      return hash[matched];
    });
  }
  function getWindowScroll(node) {
    var win = getWindow(node);
    var scrollLeft = win.pageXOffset;
    var scrollTop = win.pageYOffset;
    return { scrollLeft: scrollLeft, scrollTop: scrollTop };
  }
  function getWindowScrollBarX(element) {
    return (
      getBoundingClientRect(getDocumentElement(element)).left +
      getWindowScroll(element).scrollLeft
    );
  }
  function getViewportRect(element) {
    var win = getWindow(element);
    var html = getDocumentElement(element);
    var visualViewport = win.visualViewport;
    var width = html.clientWidth;
    var height = html.clientHeight;
    var x = 0;
    var y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width: width,
      height: height,
      x: x + getWindowScrollBarX(element),
      y: y,
    };
  }
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    var html = getDocumentElement(element);
    var winScroll = getWindowScroll(element);
    var body =
      (_element$ownerDocumen = element.ownerDocument) == null
        ? void 0
        : _element$ownerDocumen.body;
    var width = max(
      html.scrollWidth,
      html.clientWidth,
      body ? body.scrollWidth : 0,
      body ? body.clientWidth : 0
    );
    var height = max(
      html.scrollHeight,
      html.clientHeight,
      body ? body.scrollHeight : 0,
      body ? body.clientHeight : 0
    );
    var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
    var y = -winScroll.scrollTop;
    if (getComputedStyle$1(body || html).direction === "rtl") {
      x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return { width: width, height: height, x: x, y: y };
  }
  function isScrollParent(element) {
    var _getComputedStyle = getComputedStyle$1(element),
      overflow = _getComputedStyle.overflow,
      overflowX = _getComputedStyle.overflowX,
      overflowY = _getComputedStyle.overflowY;
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }
  function getScrollParent(node) {
    if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(node) && isScrollParent(node)) {
      return node;
    }
    return getScrollParent(getParentNode(node));
  }
  function listScrollParents(element, list) {
    var _element$ownerDocumen;
    if (list === void 0) {
      list = [];
    }
    var scrollParent = getScrollParent(element);
    var isBody =
      scrollParent ===
      ((_element$ownerDocumen = element.ownerDocument) == null
        ? void 0
        : _element$ownerDocumen.body);
    var win = getWindow(scrollParent);
    var target = isBody
      ? [win].concat(
          win.visualViewport || [],
          isScrollParent(scrollParent) ? scrollParent : []
        )
      : scrollParent;
    var updatedList = list.concat(target);
    return isBody
      ? updatedList
      : updatedList.concat(listScrollParents(getParentNode(target)));
  }
  function rectToClientRect(rect) {
    return Object.assign({}, rect, {
      left: rect.x,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
    });
  }
  function getInnerBoundingClientRect(element) {
    var rect = getBoundingClientRect(element);
    rect.top = rect.top + element.clientTop;
    rect.left = rect.left + element.clientLeft;
    rect.bottom = rect.top + element.clientHeight;
    rect.right = rect.left + element.clientWidth;
    rect.width = element.clientWidth;
    rect.height = element.clientHeight;
    rect.x = rect.left;
    rect.y = rect.top;
    return rect;
  }
  function getClientRectFromMixedType(element, clippingParent) {
    return clippingParent === viewport
      ? rectToClientRect(getViewportRect(element))
      : isHTMLElement(clippingParent)
      ? getInnerBoundingClientRect(clippingParent)
      : rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingParents(element) {
    var clippingParents = listScrollParents(getParentNode(element));
    var canEscapeClipping =
      ["absolute", "fixed"].indexOf(getComputedStyle$1(element).position) >= 0;
    var clipperElement =
      canEscapeClipping && isHTMLElement(element)
        ? getOffsetParent(element)
        : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingParents.filter(function (clippingParent) {
      return (
        isElement(clippingParent) &&
        contains(clippingParent, clipperElement) &&
        getNodeName(clippingParent) !== "body"
      );
    });
  }
  function getClippingRect(element, boundary, rootBoundary) {
    var mainClippingParents =
      boundary === "clippingParents"
        ? getClippingParents(element)
        : [].concat(boundary);
    var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
    var firstClippingParent = clippingParents[0];
    var clippingRect = clippingParents.reduce(function (
      accRect,
      clippingParent
    ) {
      var rect = getClientRectFromMixedType(element, clippingParent);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    },
    getClientRectFromMixedType(element, firstClippingParent));
    clippingRect.width = clippingRect.right - clippingRect.left;
    clippingRect.height = clippingRect.bottom - clippingRect.top;
    clippingRect.x = clippingRect.left;
    clippingRect.y = clippingRect.top;
    return clippingRect;
  }
  function computeOffsets(_ref) {
    var reference = _ref.reference,
      element = _ref.element,
      placement = _ref.placement;
    var basePlacement = placement ? getBasePlacement(placement) : null;
    var variation = placement ? getVariation(placement) : null;
    var commonX = reference.x + reference.width / 2 - element.width / 2;
    var commonY = reference.y + reference.height / 2 - element.height / 2;
    var offsets;
    switch (basePlacement) {
      case top:
        offsets = { x: commonX, y: reference.y - element.height };
        break;
      case bottom:
        offsets = { x: commonX, y: reference.y + reference.height };
        break;
      case right:
        offsets = { x: reference.x + reference.width, y: commonY };
        break;
      case left:
        offsets = { x: reference.x - element.width, y: commonY };
        break;
      default:
        offsets = { x: reference.x, y: reference.y };
    }
    var mainAxis = basePlacement
      ? getMainAxisFromPlacement(basePlacement)
      : null;
    if (mainAxis != null) {
      var len = mainAxis === "y" ? "height" : "width";
      switch (variation) {
        case start:
          offsets[mainAxis] =
            offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
          break;
        case end:
          offsets[mainAxis] =
            offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
          break;
      }
    }
    return offsets;
  }
  function detectOverflow(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options,
      _options$placement = _options.placement,
      placement =
        _options$placement === void 0 ? state.placement : _options$placement,
      _options$boundary = _options.boundary,
      boundary =
        _options$boundary === void 0 ? clippingParents : _options$boundary,
      _options$rootBoundary = _options.rootBoundary,
      rootBoundary =
        _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
      _options$elementConte = _options.elementContext,
      elementContext =
        _options$elementConte === void 0 ? popper : _options$elementConte,
      _options$altBoundary = _options.altBoundary,
      altBoundary =
        _options$altBoundary === void 0 ? false : _options$altBoundary,
      _options$padding = _options.padding,
      padding = _options$padding === void 0 ? 0 : _options$padding;
    var paddingObject = mergePaddingObject(
      typeof padding !== "number"
        ? padding
        : expandToHashMap(padding, basePlacements)
    );
    var altContext = elementContext === popper ? reference : popper;
    var popperRect = state.rects.popper;
    var element = state.elements[altBoundary ? altContext : elementContext];
    var clippingClientRect = getClippingRect(
      isElement(element)
        ? element
        : element.contextElement || getDocumentElement(state.elements.popper),
      boundary,
      rootBoundary
    );
    var referenceClientRect = getBoundingClientRect(state.elements.reference);
    var popperOffsets = computeOffsets({
      reference: referenceClientRect,
      element: popperRect,
      strategy: "absolute",
      placement: placement,
    });
    var popperClientRect = rectToClientRect(
      Object.assign({}, popperRect, popperOffsets)
    );
    var elementClientRect =
      elementContext === popper ? popperClientRect : referenceClientRect;
    var overflowOffsets = {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom:
        elementClientRect.bottom -
        clippingClientRect.bottom +
        paddingObject.bottom,
      left:
        clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right:
        elementClientRect.right -
        clippingClientRect.right +
        paddingObject.right,
    };
    var offsetData = state.modifiersData.offset;
    if (elementContext === popper && offsetData) {
      var offset = offsetData[placement];
      Object.keys(overflowOffsets).forEach(function (key) {
        var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
        var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
        overflowOffsets[key] += offset[axis] * multiply;
      });
    }
    return overflowOffsets;
  }
  function computeAutoPlacement(state, options) {
    if (options === void 0) {
      options = {};
    }
    var _options = options,
      placement = _options.placement,
      boundary = _options.boundary,
      rootBoundary = _options.rootBoundary,
      padding = _options.padding,
      flipVariations = _options.flipVariations,
      _options$allowedAutoP = _options.allowedAutoPlacements,
      allowedAutoPlacements =
        _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
    var variation = getVariation(placement);
    var placements$1 = variation
      ? flipVariations
        ? variationPlacements
        : variationPlacements.filter(function (placement) {
            return getVariation(placement) === variation;
          })
      : basePlacements;
    var allowedPlacements = placements$1.filter(function (placement) {
      return allowedAutoPlacements.indexOf(placement) >= 0;
    });
    if (allowedPlacements.length === 0) {
      allowedPlacements = placements$1;
    }
    var overflows = allowedPlacements.reduce(function (acc, placement) {
      acc[placement] = detectOverflow(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding,
      })[getBasePlacement(placement)];
      return acc;
    }, {});
    return Object.keys(overflows).sort(function (a, b) {
      return overflows[a] - overflows[b];
    });
  }
  function getExpandedFallbackPlacements(placement) {
    if (getBasePlacement(placement) === auto) {
      return [];
    }
    var oppositePlacement = getOppositePlacement(placement);
    return [
      getOppositeVariationPlacement(placement),
      oppositePlacement,
      getOppositeVariationPlacement(oppositePlacement),
    ];
  }
  function flip(_ref) {
    var state = _ref.state,
      options = _ref.options,
      name = _ref.name;
    if (state.modifiersData[name]._skip) {
      return;
    }
    var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
      specifiedFallbackPlacements = options.fallbackPlacements,
      padding = options.padding,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      _options$flipVariatio = options.flipVariations,
      flipVariations =
        _options$flipVariatio === void 0 ? true : _options$flipVariatio,
      allowedAutoPlacements = options.allowedAutoPlacements;
    var preferredPlacement = state.options.placement;
    var basePlacement = getBasePlacement(preferredPlacement);
    var isBasePlacement = basePlacement === preferredPlacement;
    var fallbackPlacements =
      specifiedFallbackPlacements ||
      (isBasePlacement || !flipVariations
        ? [getOppositePlacement(preferredPlacement)]
        : getExpandedFallbackPlacements(preferredPlacement));
    var placements = [preferredPlacement]
      .concat(fallbackPlacements)
      .reduce(function (acc, placement) {
        return acc.concat(
          getBasePlacement(placement) === auto
            ? computeAutoPlacement(state, {
                placement: placement,
                boundary: boundary,
                rootBoundary: rootBoundary,
                padding: padding,
                flipVariations: flipVariations,
                allowedAutoPlacements: allowedAutoPlacements,
              })
            : placement
        );
      }, []);
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var checksMap = new Map();
    var makeFallbackChecks = true;
    var firstFittingPlacement = placements[0];
    for (var i = 0; i < placements.length; i++) {
      var placement = placements[i];
      var _basePlacement = getBasePlacement(placement);
      var isStartVariation = getVariation(placement) === start;
      var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
      var len = isVertical ? "width" : "height";
      var overflow = detectOverflow(state, {
        placement: placement,
        boundary: boundary,
        rootBoundary: rootBoundary,
        altBoundary: altBoundary,
        padding: padding,
      });
      var mainVariationSide = isVertical
        ? isStartVariation
          ? right
          : left
        : isStartVariation
        ? bottom
        : top;
      if (referenceRect[len] > popperRect[len]) {
        mainVariationSide = getOppositePlacement(mainVariationSide);
      }
      var altVariationSide = getOppositePlacement(mainVariationSide);
      var checks = [];
      if (checkMainAxis) {
        checks.push(overflow[_basePlacement] <= 0);
      }
      if (checkAltAxis) {
        checks.push(
          overflow[mainVariationSide] <= 0,
          overflow[altVariationSide] <= 0
        );
      }
      if (
        checks.every(function (check) {
          return check;
        })
      ) {
        firstFittingPlacement = placement;
        makeFallbackChecks = false;
        break;
      }
      checksMap.set(placement, checks);
    }
    if (makeFallbackChecks) {
      var numberOfChecks = flipVariations ? 3 : 1;
      var _loop = function _loop(_i) {
        var fittingPlacement = placements.find(function (placement) {
          var checks = checksMap.get(placement);
          if (checks) {
            return checks.slice(0, _i).every(function (check) {
              return check;
            });
          }
        });
        if (fittingPlacement) {
          firstFittingPlacement = fittingPlacement;
          return "break";
        }
      };
      for (var _i = numberOfChecks; _i > 0; _i--) {
        var _ret = _loop(_i);
        if (_ret === "break") break;
      }
    }
    if (state.placement !== firstFittingPlacement) {
      state.modifiersData[name]._skip = true;
      state.placement = firstFittingPlacement;
      state.reset = true;
    }
  }
  const flip$1 = {
    name: "flip",
    enabled: true,
    phase: "main",
    fn: flip,
    requiresIfExists: ["offset"],
    data: { _skip: false },
  };
  function getSideOffsets(overflow, rect, preventedOffsets) {
    if (preventedOffsets === void 0) {
      preventedOffsets = { x: 0, y: 0 };
    }
    return {
      top: overflow.top - rect.height - preventedOffsets.y,
      right: overflow.right - rect.width + preventedOffsets.x,
      bottom: overflow.bottom - rect.height + preventedOffsets.y,
      left: overflow.left - rect.width - preventedOffsets.x,
    };
  }
  function isAnySideFullyClipped(overflow) {
    return [top, right, bottom, left].some(function (side) {
      return overflow[side] >= 0;
    });
  }
  function hide(_ref) {
    var state = _ref.state,
      name = _ref.name;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var preventedOffsets = state.modifiersData.preventOverflow;
    var referenceOverflow = detectOverflow(state, {
      elementContext: "reference",
    });
    var popperAltOverflow = detectOverflow(state, { altBoundary: true });
    var referenceClippingOffsets = getSideOffsets(
      referenceOverflow,
      referenceRect
    );
    var popperEscapeOffsets = getSideOffsets(
      popperAltOverflow,
      popperRect,
      preventedOffsets
    );
    var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
    var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
    state.modifiersData[name] = {
      referenceClippingOffsets: referenceClippingOffsets,
      popperEscapeOffsets: popperEscapeOffsets,
      isReferenceHidden: isReferenceHidden,
      hasPopperEscaped: hasPopperEscaped,
    };
    state.attributes.popper = Object.assign({}, state.attributes.popper, {
      "data-popper-reference-hidden": isReferenceHidden,
      "data-popper-escaped": hasPopperEscaped,
    });
  }
  const hide$1 = {
    name: "hide",
    enabled: true,
    phase: "main",
    requiresIfExists: ["preventOverflow"],
    fn: hide,
  };
  function distanceAndSkiddingToXY(placement, rects, offset) {
    var basePlacement = getBasePlacement(placement);
    var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
    var _ref =
        typeof offset === "function"
          ? offset(Object.assign({}, rects, { placement: placement }))
          : offset,
      skidding = _ref[0],
      distance = _ref[1];
    skidding = skidding || 0;
    distance = (distance || 0) * invertDistance;
    return [left, right].indexOf(basePlacement) >= 0
      ? { x: distance, y: skidding }
      : { x: skidding, y: distance };
  }
  function offset(_ref2) {
    var state = _ref2.state,
      options = _ref2.options,
      name = _ref2.name;
    var _options$offset = options.offset,
      offset = _options$offset === void 0 ? [0, 0] : _options$offset;
    var data = placements.reduce(function (acc, placement) {
      acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
      return acc;
    }, {});
    var _data$state$placement = data[state.placement],
      x = _data$state$placement.x,
      y = _data$state$placement.y;
    if (state.modifiersData.popperOffsets != null) {
      state.modifiersData.popperOffsets.x += x;
      state.modifiersData.popperOffsets.y += y;
    }
    state.modifiersData[name] = data;
  }
  const offset$1 = {
    name: "offset",
    enabled: true,
    phase: "main",
    requires: ["popperOffsets"],
    fn: offset,
  };
  function popperOffsets(_ref) {
    var state = _ref.state,
      name = _ref.name;
    state.modifiersData[name] = computeOffsets({
      reference: state.rects.reference,
      element: state.rects.popper,
      strategy: "absolute",
      placement: state.placement,
    });
  }
  const popperOffsets$1 = {
    name: "popperOffsets",
    enabled: true,
    phase: "read",
    fn: popperOffsets,
    data: {},
  };
  function getAltAxis(axis) {
    return axis === "x" ? "y" : "x";
  }
  function preventOverflow(_ref) {
    var state = _ref.state,
      options = _ref.options,
      name = _ref.name;
    var _options$mainAxis = options.mainAxis,
      checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
      _options$altAxis = options.altAxis,
      checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
      boundary = options.boundary,
      rootBoundary = options.rootBoundary,
      altBoundary = options.altBoundary,
      padding = options.padding,
      _options$tether = options.tether,
      tether = _options$tether === void 0 ? true : _options$tether,
      _options$tetherOffset = options.tetherOffset,
      tetherOffset =
        _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
    var overflow = detectOverflow(state, {
      boundary: boundary,
      rootBoundary: rootBoundary,
      padding: padding,
      altBoundary: altBoundary,
    });
    var basePlacement = getBasePlacement(state.placement);
    var variation = getVariation(state.placement);
    var isBasePlacement = !variation;
    var mainAxis = getMainAxisFromPlacement(basePlacement);
    var altAxis = getAltAxis(mainAxis);
    var popperOffsets = state.modifiersData.popperOffsets;
    var referenceRect = state.rects.reference;
    var popperRect = state.rects.popper;
    var tetherOffsetValue =
      typeof tetherOffset === "function"
        ? tetherOffset(
            Object.assign({}, state.rects, { placement: state.placement })
          )
        : tetherOffset;
    var data = { x: 0, y: 0 };
    if (!popperOffsets) {
      return;
    }
    if (checkMainAxis || checkAltAxis) {
      var mainSide = mainAxis === "y" ? top : left;
      var altSide = mainAxis === "y" ? bottom : right;
      var len = mainAxis === "y" ? "height" : "width";
      var offset = popperOffsets[mainAxis];
      var min$1 = popperOffsets[mainAxis] + overflow[mainSide];
      var max$1 = popperOffsets[mainAxis] - overflow[altSide];
      var additive = tether ? -popperRect[len] / 2 : 0;
      var minLen = variation === start ? referenceRect[len] : popperRect[len];
      var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
      var arrowElement = state.elements.arrow;
      var arrowRect =
        tether && arrowElement
          ? getLayoutRect(arrowElement)
          : { width: 0, height: 0 };
      var arrowPaddingObject = state.modifiersData["arrow#persistent"]
        ? state.modifiersData["arrow#persistent"].padding
        : getFreshSideObject();
      var arrowPaddingMin = arrowPaddingObject[mainSide];
      var arrowPaddingMax = arrowPaddingObject[altSide];
      var arrowLen = within(0, referenceRect[len], arrowRect[len]);
      var minOffset = isBasePlacement
        ? referenceRect[len] / 2 -
          additive -
          arrowLen -
          arrowPaddingMin -
          tetherOffsetValue
        : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
      var maxOffset = isBasePlacement
        ? -referenceRect[len] / 2 +
          additive +
          arrowLen +
          arrowPaddingMax +
          tetherOffsetValue
        : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
      var arrowOffsetParent =
        state.elements.arrow && getOffsetParent(state.elements.arrow);
      var clientOffset = arrowOffsetParent
        ? mainAxis === "y"
          ? arrowOffsetParent.clientTop || 0
          : arrowOffsetParent.clientLeft || 0
        : 0;
      var offsetModifierValue = state.modifiersData.offset
        ? state.modifiersData.offset[state.placement][mainAxis]
        : 0;
      var tetherMin =
        popperOffsets[mainAxis] +
        minOffset -
        offsetModifierValue -
        clientOffset;
      var tetherMax = popperOffsets[mainAxis] + maxOffset - offsetModifierValue;
      if (checkMainAxis) {
        var preventedOffset = within(
          tether ? min(min$1, tetherMin) : min$1,
          offset,
          tether ? max(max$1, tetherMax) : max$1
        );
        popperOffsets[mainAxis] = preventedOffset;
        data[mainAxis] = preventedOffset - offset;
      }
      if (checkAltAxis) {
        var _mainSide = mainAxis === "x" ? top : left;
        var _altSide = mainAxis === "x" ? bottom : right;
        var _offset = popperOffsets[altAxis];
        var _min = _offset + overflow[_mainSide];
        var _max = _offset - overflow[_altSide];
        var _preventedOffset = within(
          tether ? min(_min, tetherMin) : _min,
          _offset,
          tether ? max(_max, tetherMax) : _max
        );
        popperOffsets[altAxis] = _preventedOffset;
        data[altAxis] = _preventedOffset - _offset;
      }
    }
    state.modifiersData[name] = data;
  }
  const preventOverflow$1 = {
    name: "preventOverflow",
    enabled: true,
    phase: "main",
    fn: preventOverflow,
    requiresIfExists: ["offset"],
  };
  function getHTMLElementScroll(element) {
    return { scrollLeft: element.scrollLeft, scrollTop: element.scrollTop };
  }
  function getNodeScroll(node) {
    if (node === getWindow(node) || !isHTMLElement(node)) {
      return getWindowScroll(node);
    } else {
      return getHTMLElementScroll(node);
    }
  }
  function isElementScaled(element) {
    var rect = element.getBoundingClientRect();
    var scaleX = rect.width / element.offsetWidth || 1;
    var scaleY = rect.height / element.offsetHeight || 1;
    return scaleX !== 1 || scaleY !== 1;
  }
  function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
    if (isFixed === void 0) {
      isFixed = false;
    }
    var isOffsetParentAnElement = isHTMLElement(offsetParent);
    isHTMLElement(offsetParent) && isElementScaled(offsetParent);
    var documentElement = getDocumentElement(offsetParent);
    var rect = getBoundingClientRect(elementOrVirtualElement);
    var scroll = { scrollLeft: 0, scrollTop: 0 };
    var offsets = { x: 0, y: 0 };
    if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
      if (
        getNodeName(offsetParent) !== "body" ||
        isScrollParent(documentElement)
      ) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        offsets = getBoundingClientRect(offsetParent);
        offsets.x += offsetParent.clientLeft;
        offsets.y += offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height,
    };
  }
  function order(modifiers) {
    var map = new Map();
    var visited = new Set();
    var result = [];
    modifiers.forEach(function (modifier) {
      map.set(modifier.name, modifier);
    });
    function sort(modifier) {
      visited.add(modifier.name);
      var requires = [].concat(
        modifier.requires || [],
        modifier.requiresIfExists || []
      );
      requires.forEach(function (dep) {
        if (!visited.has(dep)) {
          var depModifier = map.get(dep);
          if (depModifier) {
            sort(depModifier);
          }
        }
      });
      result.push(modifier);
    }
    modifiers.forEach(function (modifier) {
      if (!visited.has(modifier.name)) {
        sort(modifier);
      }
    });
    return result;
  }
  function orderModifiers(modifiers) {
    var orderedModifiers = order(modifiers);
    return modifierPhases.reduce(function (acc, phase) {
      return acc.concat(
        orderedModifiers.filter(function (modifier) {
          return modifier.phase === phase;
        })
      );
    }, []);
  }
  function debounce(fn) {
    var pending;
    return function () {
      if (!pending) {
        pending = new Promise(function (resolve) {
          Promise.resolve().then(function () {
            pending = undefined;
            resolve(fn());
          });
        });
      }
      return pending;
    };
  }
  function mergeByName(modifiers) {
    var merged = modifiers.reduce(function (merged, current) {
      var existing = merged[current.name];
      merged[current.name] = existing
        ? Object.assign({}, existing, current, {
            options: Object.assign({}, existing.options, current.options),
            data: Object.assign({}, existing.data, current.data),
          })
        : current;
      return merged;
    }, {});
    return Object.keys(merged).map(function (key) {
      return merged[key];
    });
  }
  var DEFAULT_OPTIONS = {
    placement: "bottom",
    modifiers: [],
    strategy: "absolute",
  };
  function areValidElements() {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key];
    }
    return !args.some(function (element) {
      return !(element && typeof element.getBoundingClientRect === "function");
    });
  }
  function popperGenerator(generatorOptions) {
    if (generatorOptions === void 0) {
      generatorOptions = {};
    }
    var _generatorOptions = generatorOptions,
      _generatorOptions$def = _generatorOptions.defaultModifiers,
      defaultModifiers =
        _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
      _generatorOptions$def2 = _generatorOptions.defaultOptions,
      defaultOptions =
        _generatorOptions$def2 === void 0
          ? DEFAULT_OPTIONS
          : _generatorOptions$def2;
    return function createPopper(reference, popper, options) {
      if (options === void 0) {
        options = defaultOptions;
      }
      var state = {
        placement: "bottom",
        orderedModifiers: [],
        options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
        modifiersData: {},
        elements: { reference: reference, popper: popper },
        attributes: {},
        styles: {},
      };
      var effectCleanupFns = [];
      var isDestroyed = false;
      var instance = {
        state: state,
        setOptions: function setOptions(setOptionsAction) {
          var options =
            typeof setOptionsAction === "function"
              ? setOptionsAction(state.options)
              : setOptionsAction;
          cleanupModifierEffects();
          state.options = Object.assign(
            {},
            defaultOptions,
            state.options,
            options
          );
          state.scrollParents = {
            reference: isElement(reference)
              ? listScrollParents(reference)
              : reference.contextElement
              ? listScrollParents(reference.contextElement)
              : [],
            popper: listScrollParents(popper),
          };
          var orderedModifiers = orderModifiers(
            mergeByName([].concat(defaultModifiers, state.options.modifiers))
          );
          state.orderedModifiers = orderedModifiers.filter(function (m) {
            return m.enabled;
          });
          runModifierEffects();
          return instance.update();
        },
        forceUpdate: function forceUpdate() {
          if (isDestroyed) {
            return;
          }
          var _state$elements = state.elements,
            reference = _state$elements.reference,
            popper = _state$elements.popper;
          if (!areValidElements(reference, popper)) {
            return;
          }
          state.rects = {
            reference: getCompositeRect(
              reference,
              getOffsetParent(popper),
              state.options.strategy === "fixed"
            ),
            popper: getLayoutRect(popper),
          };
          state.reset = false;
          state.placement = state.options.placement;
          state.orderedModifiers.forEach(function (modifier) {
            return (state.modifiersData[modifier.name] = Object.assign(
              {},
              modifier.data
            ));
          });
          for (var index = 0; index < state.orderedModifiers.length; index++) {
            if (state.reset === true) {
              state.reset = false;
              index = -1;
              continue;
            }
            var _state$orderedModifie = state.orderedModifiers[index],
              fn = _state$orderedModifie.fn,
              _state$orderedModifie2 = _state$orderedModifie.options,
              _options =
                _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
              name = _state$orderedModifie.name;
            if (typeof fn === "function") {
              state =
                fn({
                  state: state,
                  options: _options,
                  name: name,
                  instance: instance,
                }) || state;
            }
          }
        },
        update: debounce(function () {
          return new Promise(function (resolve) {
            instance.forceUpdate();
            resolve(state);
          });
        }),
        destroy: function destroy() {
          cleanupModifierEffects();
          isDestroyed = true;
        },
      };
      if (!areValidElements(reference, popper)) {
        return instance;
      }
      instance.setOptions(options).then(function (state) {
        if (!isDestroyed && options.onFirstUpdate) {
          options.onFirstUpdate(state);
        }
      });
      function runModifierEffects() {
        state.orderedModifiers.forEach(function (_ref3) {
          var name = _ref3.name,
            _ref3$options = _ref3.options,
            options = _ref3$options === void 0 ? {} : _ref3$options,
            effect = _ref3.effect;
          if (typeof effect === "function") {
            var cleanupFn = effect({
              state: state,
              name: name,
              instance: instance,
              options: options,
            });
            var noopFn = function noopFn() {};
            effectCleanupFns.push(cleanupFn || noopFn);
          }
        });
      }
      function cleanupModifierEffects() {
        effectCleanupFns.forEach(function (fn) {
          return fn();
        });
        effectCleanupFns = [];
      }
      return instance;
    };
  }
  var createPopper$2 = popperGenerator();
  var defaultModifiers$1 = [
    eventListeners,
    popperOffsets$1,
    computeStyles$1,
    applyStyles$1,
  ];
  var createPopper$1 = popperGenerator({
    defaultModifiers: defaultModifiers$1,
  });
  var defaultModifiers = [
    eventListeners,
    popperOffsets$1,
    computeStyles$1,
    applyStyles$1,
    offset$1,
    flip$1,
    preventOverflow$1,
    arrow$1,
    hide$1,
  ];
  var createPopper = popperGenerator({ defaultModifiers: defaultModifiers });
  const Popper = Object.freeze({
    __proto__: null,
    popperGenerator: popperGenerator,
    detectOverflow: detectOverflow,
    createPopperBase: createPopper$2,
    createPopper: createPopper,
    createPopperLite: createPopper$1,
    top: top,
    bottom: bottom,
    right: right,
    left: left,
    auto: auto,
    basePlacements: basePlacements,
    start: start,
    end: end,
    clippingParents: clippingParents,
    viewport: viewport,
    popper: popper,
    reference: reference,
    variationPlacements: variationPlacements,
    placements: placements,
    beforeRead: beforeRead,
    read: read,
    afterRead: afterRead,
    beforeMain: beforeMain,
    main: main,
    afterMain: afterMain,
    beforeWrite: beforeWrite,
    write: write,
    afterWrite: afterWrite,
    modifierPhases: modifierPhases,
    applyStyles: applyStyles$1,
    arrow: arrow$1,
    computeStyles: computeStyles$1,
    eventListeners: eventListeners,
    flip: flip$1,
    hide: hide$1,
    offset: offset$1,
    popperOffsets: popperOffsets$1,
    preventOverflow: preventOverflow$1,
  });
  const NAME$9 = "dropdown";
  const DATA_KEY$8 = "bs.dropdown";
  const EVENT_KEY$8 = `.${DATA_KEY$8}`;
  const DATA_API_KEY$4 = ".data-api";
  const ESCAPE_KEY$2 = "Escape";
  const SPACE_KEY = "Space";
  const TAB_KEY$1 = "Tab";
  const ARROW_UP_KEY = "ArrowUp";
  const ARROW_DOWN_KEY = "ArrowDown";
  const RIGHT_MOUSE_BUTTON = 2;
  const REGEXP_KEYDOWN = new RegExp(
    `${ARROW_UP_KEY}|${ARROW_DOWN_KEY}|${ESCAPE_KEY$2}`
  );
  const EVENT_HIDE$4 = `hide${EVENT_KEY$8}`;
  const EVENT_HIDDEN$4 = `hidden${EVENT_KEY$8}`;
  const EVENT_SHOW$4 = `show${EVENT_KEY$8}`;
  const EVENT_SHOWN$4 = `shown${EVENT_KEY$8}`;
  const EVENT_CLICK_DATA_API$3 = `click${EVENT_KEY$8}${DATA_API_KEY$4}`;
  const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY$8}${DATA_API_KEY$4}`;
  const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY$8}${DATA_API_KEY$4}`;
  const CLASS_NAME_SHOW$6 = "show";
  const CLASS_NAME_DROPUP = "dropup";
  const CLASS_NAME_DROPEND = "dropend";
  const CLASS_NAME_DROPSTART = "dropstart";
  const CLASS_NAME_NAVBAR = "navbar";
  const SELECTOR_DATA_TOGGLE$3 = '[data-bs-toggle="dropdown"]';
  const SELECTOR_MENU = ".dropdown-menu";
  const SELECTOR_NAVBAR_NAV = ".navbar-nav";
  const SELECTOR_VISIBLE_ITEMS =
    ".dropdown-menu .dropdown-item:not(.disabled):not(:disabled)";
  const PLACEMENT_TOP = isRTL() ? "top-end" : "top-start";
  const PLACEMENT_TOPEND = isRTL() ? "top-start" : "top-end";
  const PLACEMENT_BOTTOM = isRTL() ? "bottom-end" : "bottom-start";
  const PLACEMENT_BOTTOMEND = isRTL() ? "bottom-start" : "bottom-end";
  const PLACEMENT_RIGHT = isRTL() ? "left-start" : "right-start";
  const PLACEMENT_LEFT = isRTL() ? "right-start" : "left-start";
  const Default$8 = {
    offset: [0, 2],
    boundary: "clippingParents",
    reference: "toggle",
    display: "dynamic",
    popperConfig: null,
    autoClose: true,
  };
  const DefaultType$8 = {
    offset: "(array|string|function)",
    boundary: "(string|element)",
    reference: "(string|element|object)",
    display: "string",
    popperConfig: "(null|object|function)",
    autoClose: "(boolean|string)",
  };
  class Dropdown extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._popper = null;
      this._config = this._getConfig(config);
      this._menu = this._getMenuElement();
      this._inNavbar = this._detectNavbar();
    }
    static get Default() {
      return Default$8;
    }
    static get DefaultType() {
      return DefaultType$8;
    }
    static get NAME() {
      return NAME$9;
    }
    toggle() {
      return this._isShown() ? this.hide() : this.show();
    }
    show() {
      if (isDisabled(this._element) || this._isShown(this._menu)) {
        return;
      }
      const relatedTarget = { relatedTarget: this._element };
      const showEvent = EventHandler.trigger(
        this._element,
        EVENT_SHOW$4,
        relatedTarget
      );
      if (showEvent.defaultPrevented) {
        return;
      }
      const parent = Dropdown.getParentFromElement(this._element);
      if (this._inNavbar) {
        Manipulator.setDataAttribute(this._menu, "popper", "none");
      } else {
        this._createPopper(parent);
      }
      if (
        "ontouchstart" in document.documentElement &&
        !parent.closest(SELECTOR_NAVBAR_NAV)
      ) {
        []
          .concat(...document.body.children)
          .forEach((elem) => EventHandler.on(elem, "mouseover", noop));
      }
      this._element.focus();
      this._element.setAttribute("aria-expanded", true);
      this._menu.classList.add(CLASS_NAME_SHOW$6);
      this._element.classList.add(CLASS_NAME_SHOW$6);
      EventHandler.trigger(this._element, EVENT_SHOWN$4, relatedTarget);
    }
    hide() {
      if (isDisabled(this._element) || !this._isShown(this._menu)) {
        return;
      }
      const relatedTarget = { relatedTarget: this._element };
      this._completeHide(relatedTarget);
    }
    dispose() {
      if (this._popper) {
        this._popper.destroy();
      }
      super.dispose();
    }
    update() {
      this._inNavbar = this._detectNavbar();
      if (this._popper) {
        this._popper.update();
      }
    }
    _completeHide(relatedTarget) {
      const hideEvent = EventHandler.trigger(
        this._element,
        EVENT_HIDE$4,
        relatedTarget
      );
      if (hideEvent.defaultPrevented) {
        return;
      }
      if ("ontouchstart" in document.documentElement) {
        []
          .concat(...document.body.children)
          .forEach((elem) => EventHandler.off(elem, "mouseover", noop));
      }
      if (this._popper) {
        this._popper.destroy();
      }
      this._menu.classList.remove(CLASS_NAME_SHOW$6);
      this._element.classList.remove(CLASS_NAME_SHOW$6);
      this._element.setAttribute("aria-expanded", "false");
      Manipulator.removeDataAttribute(this._menu, "popper");
      EventHandler.trigger(this._element, EVENT_HIDDEN$4, relatedTarget);
    }
    _getConfig(config) {
      config = {
        ...this.constructor.Default,
        ...Manipulator.getDataAttributes(this._element),
        ...config,
      };
      typeCheckConfig(NAME$9, config, this.constructor.DefaultType);
      if (
        typeof config.reference === "object" &&
        !isElement$1(config.reference) &&
        typeof config.reference.getBoundingClientRect !== "function"
      ) {
        throw new TypeError(
          `${NAME$9.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`
        );
      }
      return config;
    }
    _createPopper(parent) {
      if (typeof Popper === "undefined") {
        throw new TypeError(
          "Bootstrap's dropdowns require Popper (https://popper.js.org)"
        );
      }
      let referenceElement = this._element;
      if (this._config.reference === "parent") {
        referenceElement = parent;
      } else if (isElement$1(this._config.reference)) {
        referenceElement = getElement(this._config.reference);
      } else if (typeof this._config.reference === "object") {
        referenceElement = this._config.reference;
      }
      const popperConfig = this._getPopperConfig();
      const isDisplayStatic = popperConfig.modifiers.find(
        (modifier) =>
          modifier.name === "applyStyles" && modifier.enabled === false
      );
      this._popper = createPopper(referenceElement, this._menu, popperConfig);
      if (isDisplayStatic) {
        Manipulator.setDataAttribute(this._menu, "popper", "static");
      }
    }
    _isShown(element = this._element) {
      return element.classList.contains(CLASS_NAME_SHOW$6);
    }
    _getMenuElement() {
      return SelectorEngine.next(this._element, SELECTOR_MENU)[0];
    }
    _getPlacement() {
      const parentDropdown = this._element.parentNode;
      if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
        return PLACEMENT_RIGHT;
      }
      if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
        return PLACEMENT_LEFT;
      }
      const isEnd =
        getComputedStyle(this._menu)
          .getPropertyValue("--bs-position")
          .trim() === "end";
      if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
        return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
      }
      return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
    }
    _detectNavbar() {
      return this._element.closest(`.${CLASS_NAME_NAVBAR}`) !== null;
    }
    _getOffset() {
      const { offset } = this._config;
      if (typeof offset === "string") {
        return offset.split(",").map((val) => Number.parseInt(val, 10));
      }
      if (typeof offset === "function") {
        return (popperData) => offset(popperData, this._element);
      }
      return offset;
    }
    _getPopperConfig() {
      const defaultBsPopperConfig = {
        placement: this._getPlacement(),
        modifiers: [
          {
            name: "preventOverflow",
            options: { boundary: this._config.boundary },
          },
          { name: "offset", options: { offset: this._getOffset() } },
        ],
      };
      if (this._config.display === "static") {
        defaultBsPopperConfig.modifiers = [
          { name: "applyStyles", enabled: false },
        ];
      }
      return {
        ...defaultBsPopperConfig,
        ...(typeof this._config.popperConfig === "function"
          ? this._config.popperConfig(defaultBsPopperConfig)
          : this._config.popperConfig),
      };
    }
    _selectMenuItem({ key, target }) {
      const items = SelectorEngine.find(
        SELECTOR_VISIBLE_ITEMS,
        this._menu
      ).filter(isVisible);
      if (!items.length) {
        return;
      }
      getNextActiveElement(
        items,
        target,
        key === ARROW_DOWN_KEY,
        !items.includes(target)
      ).focus();
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Dropdown.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
    static clearMenus(event) {
      if (
        event &&
        (event.button === RIGHT_MOUSE_BUTTON ||
          (event.type === "keyup" && event.key !== TAB_KEY$1))
      ) {
        return;
      }
      const toggles = SelectorEngine.find(SELECTOR_DATA_TOGGLE$3);
      for (let i = 0, len = toggles.length; i < len; i++) {
        const context = Dropdown.getInstance(toggles[i]);
        if (!context || context._config.autoClose === false) {
          continue;
        }
        if (!context._isShown()) {
          continue;
        }
        const relatedTarget = { relatedTarget: context._element };
        if (event) {
          const composedPath = event.composedPath();
          const isMenuTarget = composedPath.includes(context._menu);
          if (
            composedPath.includes(context._element) ||
            (context._config.autoClose === "inside" && !isMenuTarget) ||
            (context._config.autoClose === "outside" && isMenuTarget)
          ) {
            continue;
          }
          if (
            context._menu.contains(event.target) &&
            ((event.type === "keyup" && event.key === TAB_KEY$1) ||
              /input|select|option|textarea|form/i.test(event.target.tagName))
          ) {
            continue;
          }
          if (event.type === "click") {
            relatedTarget.clickEvent = event;
          }
        }
        context._completeHide(relatedTarget);
      }
    }
    static getParentFromElement(element) {
      return getElementFromSelector(element) || element.parentNode;
    }
    static dataApiKeydownHandler(event) {
      if (
        /input|textarea/i.test(event.target.tagName)
          ? event.key === SPACE_KEY ||
            (event.key !== ESCAPE_KEY$2 &&
              ((event.key !== ARROW_DOWN_KEY && event.key !== ARROW_UP_KEY) ||
                event.target.closest(SELECTOR_MENU)))
          : !REGEXP_KEYDOWN.test(event.key)
      ) {
        return;
      }
      const isActive = this.classList.contains(CLASS_NAME_SHOW$6);
      if (!isActive && event.key === ESCAPE_KEY$2) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (isDisabled(this)) {
        return;
      }
      const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE$3)
        ? this
        : SelectorEngine.prev(this, SELECTOR_DATA_TOGGLE$3)[0];
      const instance = Dropdown.getOrCreateInstance(getToggleButton);
      if (event.key === ESCAPE_KEY$2) {
        instance.hide();
        return;
      }
      if (event.key === ARROW_UP_KEY || event.key === ARROW_DOWN_KEY) {
        if (!isActive) {
          instance.show();
        }
        instance._selectMenuItem(event);
        return;
      }
      if (!isActive || event.key === SPACE_KEY) {
        Dropdown.clearMenus();
      }
    }
  }
  EventHandler.on(
    document,
    EVENT_KEYDOWN_DATA_API,
    SELECTOR_DATA_TOGGLE$3,
    Dropdown.dataApiKeydownHandler
  );
  EventHandler.on(
    document,
    EVENT_KEYDOWN_DATA_API,
    SELECTOR_MENU,
    Dropdown.dataApiKeydownHandler
  );
  EventHandler.on(document, EVENT_CLICK_DATA_API$3, Dropdown.clearMenus);
  EventHandler.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$3,
    SELECTOR_DATA_TOGGLE$3,
    function (event) {
      event.preventDefault();
      Dropdown.getOrCreateInstance(this).toggle();
    }
  );
  defineJQueryPlugin(Dropdown);
  const SELECTOR_FIXED_CONTENT =
    ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";
  const SELECTOR_STICKY_CONTENT = ".sticky-top";
  class ScrollBarHelper {
    constructor() {
      this._element = document.body;
    }
    getWidth() {
      const documentWidth = document.documentElement.clientWidth;
      return Math.abs(window.innerWidth - documentWidth);
    }
    hide() {
      const width = this.getWidth();
      this._disableOverFlow();
      this._setElementAttributes(
        this._element,
        "paddingRight",
        (calculatedValue) => calculatedValue + width
      );
      this._setElementAttributes(
        SELECTOR_FIXED_CONTENT,
        "paddingRight",
        (calculatedValue) => calculatedValue + width
      );
      this._setElementAttributes(
        SELECTOR_STICKY_CONTENT,
        "marginRight",
        (calculatedValue) => calculatedValue - width
      );
    }
    _disableOverFlow() {
      this._saveInitialAttribute(this._element, "overflow");
      this._element.style.overflow = "hidden";
    }
    _setElementAttributes(selector, styleProp, callback) {
      const scrollbarWidth = this.getWidth();
      const manipulationCallBack = (element) => {
        if (
          element !== this._element &&
          window.innerWidth > element.clientWidth + scrollbarWidth
        ) {
          return;
        }
        this._saveInitialAttribute(element, styleProp);
        const calculatedValue = window.getComputedStyle(element)[styleProp];
        element.style[styleProp] = `${callback(
          Number.parseFloat(calculatedValue)
        )}px`;
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    reset() {
      this._resetElementAttributes(this._element, "overflow");
      this._resetElementAttributes(this._element, "paddingRight");
      this._resetElementAttributes(SELECTOR_FIXED_CONTENT, "paddingRight");
      this._resetElementAttributes(SELECTOR_STICKY_CONTENT, "marginRight");
    }
    _saveInitialAttribute(element, styleProp) {
      const actualValue = element.style[styleProp];
      if (actualValue) {
        Manipulator.setDataAttribute(element, styleProp, actualValue);
      }
    }
    _resetElementAttributes(selector, styleProp) {
      const manipulationCallBack = (element) => {
        const value = Manipulator.getDataAttribute(element, styleProp);
        if (typeof value === "undefined") {
          element.style.removeProperty(styleProp);
        } else {
          Manipulator.removeDataAttribute(element, styleProp);
          element.style[styleProp] = value;
        }
      };
      this._applyManipulationCallback(selector, manipulationCallBack);
    }
    _applyManipulationCallback(selector, callBack) {
      if (isElement$1(selector)) {
        callBack(selector);
      } else {
        SelectorEngine.find(selector, this._element).forEach(callBack);
      }
    }
    isOverflowing() {
      return this.getWidth() > 0;
    }
  }
  const Default$7 = {
    className: "modal-backdrop",
    isVisible: true,
    isAnimated: false,
    rootElement: "body",
    clickCallback: null,
  };
  const DefaultType$7 = {
    className: "string",
    isVisible: "boolean",
    isAnimated: "boolean",
    rootElement: "(element|string)",
    clickCallback: "(function|null)",
  };
  const NAME$8 = "backdrop";
  const CLASS_NAME_FADE$4 = "fade";
  const CLASS_NAME_SHOW$5 = "show";
  const EVENT_MOUSEDOWN = `mousedown.bs.${NAME$8}`;
  class Backdrop {
    constructor(config) {
      this._config = this._getConfig(config);
      this._isAppended = false;
      this._element = null;
    }
    show(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._append();
      if (this._config.isAnimated) {
        reflow(this._getElement());
      }
      this._getElement().classList.add(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        execute(callback);
      });
    }
    hide(callback) {
      if (!this._config.isVisible) {
        execute(callback);
        return;
      }
      this._getElement().classList.remove(CLASS_NAME_SHOW$5);
      this._emulateAnimation(() => {
        this.dispose();
        execute(callback);
      });
    }
    _getElement() {
      if (!this._element) {
        const backdrop = document.createElement("div");
        backdrop.className = this._config.className;
        if (this._config.isAnimated) {
          backdrop.classList.add(CLASS_NAME_FADE$4);
        }
        this._element = backdrop;
      }
      return this._element;
    }
    _getConfig(config) {
      config = { ...Default$7, ...(typeof config === "object" ? config : {}) };
      config.rootElement = getElement(config.rootElement);
      typeCheckConfig(NAME$8, config, DefaultType$7);
      return config;
    }
    _append() {
      if (this._isAppended) {
        return;
      }
      this._config.rootElement.append(this._getElement());
      EventHandler.on(this._getElement(), EVENT_MOUSEDOWN, () => {
        execute(this._config.clickCallback);
      });
      this._isAppended = true;
    }
    dispose() {
      if (!this._isAppended) {
        return;
      }
      EventHandler.off(this._element, EVENT_MOUSEDOWN);
      this._element.remove();
      this._isAppended = false;
    }
    _emulateAnimation(callback) {
      executeAfterTransition(
        callback,
        this._getElement(),
        this._config.isAnimated
      );
    }
  }
  const Default$6 = { trapElement: null, autofocus: true };
  const DefaultType$6 = { trapElement: "element", autofocus: "boolean" };
  const NAME$7 = "focustrap";
  const DATA_KEY$7 = "bs.focustrap";
  const EVENT_KEY$7 = `.${DATA_KEY$7}`;
  const EVENT_FOCUSIN$1 = `focusin${EVENT_KEY$7}`;
  const EVENT_KEYDOWN_TAB = `keydown.tab${EVENT_KEY$7}`;
  const TAB_KEY = "Tab";
  const TAB_NAV_FORWARD = "forward";
  const TAB_NAV_BACKWARD = "backward";
  class FocusTrap {
    constructor(config) {
      this._config = this._getConfig(config);
      this._isActive = false;
      this._lastTabNavDirection = null;
    }
    activate() {
      const { trapElement, autofocus } = this._config;
      if (this._isActive) {
        return;
      }
      if (autofocus) {
        trapElement.focus();
      }
      EventHandler.off(document, EVENT_KEY$7);
      EventHandler.on(document, EVENT_FOCUSIN$1, (event) =>
        this._handleFocusin(event)
      );
      EventHandler.on(document, EVENT_KEYDOWN_TAB, (event) =>
        this._handleKeydown(event)
      );
      this._isActive = true;
    }
    deactivate() {
      if (!this._isActive) {
        return;
      }
      this._isActive = false;
      EventHandler.off(document, EVENT_KEY$7);
    }
    _handleFocusin(event) {
      const { target } = event;
      const { trapElement } = this._config;
      if (
        target === document ||
        target === trapElement ||
        trapElement.contains(target)
      ) {
        return;
      }
      const elements = SelectorEngine.focusableChildren(trapElement);
      if (elements.length === 0) {
        trapElement.focus();
      } else if (this._lastTabNavDirection === TAB_NAV_BACKWARD) {
        elements[elements.length - 1].focus();
      } else {
        elements[0].focus();
      }
    }
    _handleKeydown(event) {
      if (event.key !== TAB_KEY) {
        return;
      }
      this._lastTabNavDirection = event.shiftKey
        ? TAB_NAV_BACKWARD
        : TAB_NAV_FORWARD;
    }
    _getConfig(config) {
      config = { ...Default$6, ...(typeof config === "object" ? config : {}) };
      typeCheckConfig(NAME$7, config, DefaultType$6);
      return config;
    }
  }
  const NAME$6 = "modal";
  const DATA_KEY$6 = "bs.modal";
  const EVENT_KEY$6 = `.${DATA_KEY$6}`;
  const DATA_API_KEY$3 = ".data-api";
  const ESCAPE_KEY$1 = "Escape";
  const Default$5 = { backdrop: true, keyboard: true, focus: true };
  const DefaultType$5 = {
    backdrop: "(boolean|string)",
    keyboard: "boolean",
    focus: "boolean",
  };
  const EVENT_HIDE$3 = `hide${EVENT_KEY$6}`;
  const EVENT_HIDE_PREVENTED = `hidePrevented${EVENT_KEY$6}`;
  const EVENT_HIDDEN$3 = `hidden${EVENT_KEY$6}`;
  const EVENT_SHOW$3 = `show${EVENT_KEY$6}`;
  const EVENT_SHOWN$3 = `shown${EVENT_KEY$6}`;
  const EVENT_RESIZE = `resize${EVENT_KEY$6}`;
  const EVENT_CLICK_DISMISS = `click.dismiss${EVENT_KEY$6}`;
  const EVENT_KEYDOWN_DISMISS$1 = `keydown.dismiss${EVENT_KEY$6}`;
  const EVENT_MOUSEUP_DISMISS = `mouseup.dismiss${EVENT_KEY$6}`;
  const EVENT_MOUSEDOWN_DISMISS = `mousedown.dismiss${EVENT_KEY$6}`;
  const EVENT_CLICK_DATA_API$2 = `click${EVENT_KEY$6}${DATA_API_KEY$3}`;
  const CLASS_NAME_OPEN = "modal-open";
  const CLASS_NAME_FADE$3 = "fade";
  const CLASS_NAME_SHOW$4 = "show";
  const CLASS_NAME_STATIC = "modal-static";
  const OPEN_SELECTOR$1 = ".modal.show";
  const SELECTOR_DIALOG = ".modal-dialog";
  const SELECTOR_MODAL_BODY = ".modal-body";
  const SELECTOR_DATA_TOGGLE$2 = '[data-bs-toggle="modal"]';
  class Modal extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._config = this._getConfig(config);
      this._dialog = SelectorEngine.findOne(SELECTOR_DIALOG, this._element);
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._isShown = false;
      this._ignoreBackdropClick = false;
      this._isTransitioning = false;
      this._scrollBar = new ScrollBarHelper();
    }
    static get Default() {
      return Default$5;
    }
    static get NAME() {
      return NAME$6;
    }
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown || this._isTransitioning) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$3, {
        relatedTarget: relatedTarget,
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      if (this._isAnimated()) {
        this._isTransitioning = true;
      }
      this._scrollBar.hide();
      document.body.classList.add(CLASS_NAME_OPEN);
      this._adjustDialog();
      this._setEscapeEvent();
      this._setResizeEvent();
      EventHandler.on(this._dialog, EVENT_MOUSEDOWN_DISMISS, () => {
        EventHandler.one(this._element, EVENT_MOUSEUP_DISMISS, (event) => {
          if (event.target === this._element) {
            this._ignoreBackdropClick = true;
          }
        });
      });
      this._showBackdrop(() => this._showElement(relatedTarget));
    }
    hide() {
      if (!this._isShown || this._isTransitioning) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$3);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._isShown = false;
      const isAnimated = this._isAnimated();
      if (isAnimated) {
        this._isTransitioning = true;
      }
      this._setEscapeEvent();
      this._setResizeEvent();
      this._focustrap.deactivate();
      this._element.classList.remove(CLASS_NAME_SHOW$4);
      EventHandler.off(this._element, EVENT_CLICK_DISMISS);
      EventHandler.off(this._dialog, EVENT_MOUSEDOWN_DISMISS);
      this._queueCallback(() => this._hideModal(), this._element, isAnimated);
    }
    dispose() {
      [window, this._dialog].forEach((htmlElement) =>
        EventHandler.off(htmlElement, EVENT_KEY$6)
      );
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    handleUpdate() {
      this._adjustDialog();
    }
    _initializeBackDrop() {
      return new Backdrop({
        isVisible: Boolean(this._config.backdrop),
        isAnimated: this._isAnimated(),
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({ trapElement: this._element });
    }
    _getConfig(config) {
      config = {
        ...Default$5,
        ...Manipulator.getDataAttributes(this._element),
        ...(typeof config === "object" ? config : {}),
      };
      typeCheckConfig(NAME$6, config, DefaultType$5);
      return config;
    }
    _showElement(relatedTarget) {
      const isAnimated = this._isAnimated();
      const modalBody = SelectorEngine.findOne(
        SELECTOR_MODAL_BODY,
        this._dialog
      );
      if (
        !this._element.parentNode ||
        this._element.parentNode.nodeType !== Node.ELEMENT_NODE
      ) {
        document.body.append(this._element);
      }
      this._element.style.display = "block";
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.scrollTop = 0;
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
      if (isAnimated) {
        reflow(this._element);
      }
      this._element.classList.add(CLASS_NAME_SHOW$4);
      const transitionComplete = () => {
        if (this._config.focus) {
          this._focustrap.activate();
        }
        this._isTransitioning = false;
        EventHandler.trigger(this._element, EVENT_SHOWN$3, {
          relatedTarget: relatedTarget,
        });
      };
      this._queueCallback(transitionComplete, this._dialog, isAnimated);
    }
    _setEscapeEvent() {
      if (this._isShown) {
        EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS$1, (event) => {
          if (this._config.keyboard && event.key === ESCAPE_KEY$1) {
            event.preventDefault();
            this.hide();
          } else if (!this._config.keyboard && event.key === ESCAPE_KEY$1) {
            this._triggerBackdropTransition();
          }
        });
      } else {
        EventHandler.off(this._element, EVENT_KEYDOWN_DISMISS$1);
      }
    }
    _setResizeEvent() {
      if (this._isShown) {
        EventHandler.on(window, EVENT_RESIZE, () => this._adjustDialog());
      } else {
        EventHandler.off(window, EVENT_RESIZE);
      }
    }
    _hideModal() {
      this._element.style.display = "none";
      this._element.setAttribute("aria-hidden", true);
      this._element.removeAttribute("aria-modal");
      this._element.removeAttribute("role");
      this._isTransitioning = false;
      this._backdrop.hide(() => {
        document.body.classList.remove(CLASS_NAME_OPEN);
        this._resetAdjustments();
        this._scrollBar.reset();
        EventHandler.trigger(this._element, EVENT_HIDDEN$3);
      });
    }
    _showBackdrop(callback) {
      EventHandler.on(this._element, EVENT_CLICK_DISMISS, (event) => {
        if (this._ignoreBackdropClick) {
          this._ignoreBackdropClick = false;
          return;
        }
        if (event.target !== event.currentTarget) {
          return;
        }
        if (this._config.backdrop === true) {
          this.hide();
        } else if (this._config.backdrop === "static") {
          this._triggerBackdropTransition();
        }
      });
      this._backdrop.show(callback);
    }
    _isAnimated() {
      return this._element.classList.contains(CLASS_NAME_FADE$3);
    }
    _triggerBackdropTransition() {
      const hideEvent = EventHandler.trigger(
        this._element,
        EVENT_HIDE_PREVENTED
      );
      if (hideEvent.defaultPrevented) {
        return;
      }
      const { classList, scrollHeight, style } = this._element;
      const isModalOverflowing =
        scrollHeight > document.documentElement.clientHeight;
      if (
        (!isModalOverflowing && style.overflowY === "hidden") ||
        classList.contains(CLASS_NAME_STATIC)
      ) {
        return;
      }
      if (!isModalOverflowing) {
        style.overflowY = "hidden";
      }
      classList.add(CLASS_NAME_STATIC);
      this._queueCallback(() => {
        classList.remove(CLASS_NAME_STATIC);
        if (!isModalOverflowing) {
          this._queueCallback(() => {
            style.overflowY = "";
          }, this._dialog);
        }
      }, this._dialog);
      this._element.focus();
    }
    _adjustDialog() {
      const isModalOverflowing =
        this._element.scrollHeight > document.documentElement.clientHeight;
      const scrollbarWidth = this._scrollBar.getWidth();
      const isBodyOverflowing = scrollbarWidth > 0;
      if (
        (!isBodyOverflowing && isModalOverflowing && !isRTL()) ||
        (isBodyOverflowing && !isModalOverflowing && isRTL())
      ) {
        this._element.style.paddingLeft = `${scrollbarWidth}px`;
      }
      if (
        (isBodyOverflowing && !isModalOverflowing && !isRTL()) ||
        (!isBodyOverflowing && isModalOverflowing && isRTL())
      ) {
        this._element.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    _resetAdjustments() {
      this._element.style.paddingLeft = "";
      this._element.style.paddingRight = "";
    }
    static jQueryInterface(config, relatedTarget) {
      return this.each(function () {
        const data = Modal.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](relatedTarget);
      });
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$2,
    SELECTOR_DATA_TOGGLE$2,
    function (event) {
      const target = getElementFromSelector(this);
      if (["A", "AREA"].includes(this.tagName)) {
        event.preventDefault();
      }
      EventHandler.one(target, EVENT_SHOW$3, (showEvent) => {
        if (showEvent.defaultPrevented) {
          return;
        }
        EventHandler.one(target, EVENT_HIDDEN$3, () => {
          if (isVisible(this)) {
            this.focus();
          }
        });
      });
      const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR$1);
      if (allReadyOpen) {
        Modal.getInstance(allReadyOpen).hide();
      }
      const data = Modal.getOrCreateInstance(target);
      data.toggle(this);
    }
  );
  enableDismissTrigger(Modal);
  defineJQueryPlugin(Modal);
  const NAME$5 = "offcanvas";
  const DATA_KEY$5 = "bs.offcanvas";
  const EVENT_KEY$5 = `.${DATA_KEY$5}`;
  const DATA_API_KEY$2 = ".data-api";
  const EVENT_LOAD_DATA_API$1 = `load${EVENT_KEY$5}${DATA_API_KEY$2}`;
  const ESCAPE_KEY = "Escape";
  const Default$4 = { backdrop: true, keyboard: true, scroll: false };
  const DefaultType$4 = {
    backdrop: "boolean",
    keyboard: "boolean",
    scroll: "boolean",
  };
  const CLASS_NAME_SHOW$3 = "show";
  const CLASS_NAME_BACKDROP = "offcanvas-backdrop";
  const OPEN_SELECTOR = ".offcanvas.show";
  const EVENT_SHOW$2 = `show${EVENT_KEY$5}`;
  const EVENT_SHOWN$2 = `shown${EVENT_KEY$5}`;
  const EVENT_HIDE$2 = `hide${EVENT_KEY$5}`;
  const EVENT_HIDDEN$2 = `hidden${EVENT_KEY$5}`;
  const EVENT_CLICK_DATA_API$1 = `click${EVENT_KEY$5}${DATA_API_KEY$2}`;
  const EVENT_KEYDOWN_DISMISS = `keydown.dismiss${EVENT_KEY$5}`;
  const SELECTOR_DATA_TOGGLE$1 = '[data-bs-toggle="offcanvas"]';
  class Offcanvas extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._config = this._getConfig(config);
      this._isShown = false;
      this._backdrop = this._initializeBackDrop();
      this._focustrap = this._initializeFocusTrap();
      this._addEventListeners();
    }
    static get NAME() {
      return NAME$5;
    }
    static get Default() {
      return Default$4;
    }
    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget);
    }
    show(relatedTarget) {
      if (this._isShown) {
        return;
      }
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$2, {
        relatedTarget: relatedTarget,
      });
      if (showEvent.defaultPrevented) {
        return;
      }
      this._isShown = true;
      this._element.style.visibility = "visible";
      this._backdrop.show();
      if (!this._config.scroll) {
        new ScrollBarHelper().hide();
      }
      this._element.removeAttribute("aria-hidden");
      this._element.setAttribute("aria-modal", true);
      this._element.setAttribute("role", "dialog");
      this._element.classList.add(CLASS_NAME_SHOW$3);
      const completeCallBack = () => {
        if (!this._config.scroll) {
          this._focustrap.activate();
        }
        EventHandler.trigger(this._element, EVENT_SHOWN$2, {
          relatedTarget: relatedTarget,
        });
      };
      this._queueCallback(completeCallBack, this._element, true);
    }
    hide() {
      if (!this._isShown) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE$2);
      if (hideEvent.defaultPrevented) {
        return;
      }
      this._focustrap.deactivate();
      this._element.blur();
      this._isShown = false;
      this._element.classList.remove(CLASS_NAME_SHOW$3);
      this._backdrop.hide();
      const completeCallback = () => {
        this._element.setAttribute("aria-hidden", true);
        this._element.removeAttribute("aria-modal");
        this._element.removeAttribute("role");
        this._element.style.visibility = "hidden";
        if (!this._config.scroll) {
          new ScrollBarHelper().reset();
        }
        EventHandler.trigger(this._element, EVENT_HIDDEN$2);
      };
      this._queueCallback(completeCallback, this._element, true);
    }
    dispose() {
      this._backdrop.dispose();
      this._focustrap.deactivate();
      super.dispose();
    }
    _getConfig(config) {
      config = {
        ...Default$4,
        ...Manipulator.getDataAttributes(this._element),
        ...(typeof config === "object" ? config : {}),
      };
      typeCheckConfig(NAME$5, config, DefaultType$4);
      return config;
    }
    _initializeBackDrop() {
      return new Backdrop({
        className: CLASS_NAME_BACKDROP,
        isVisible: this._config.backdrop,
        isAnimated: true,
        rootElement: this._element.parentNode,
        clickCallback: () => this.hide(),
      });
    }
    _initializeFocusTrap() {
      return new FocusTrap({ trapElement: this._element });
    }
    _addEventListeners() {
      EventHandler.on(this._element, EVENT_KEYDOWN_DISMISS, (event) => {
        if (this._config.keyboard && event.key === ESCAPE_KEY) {
          this.hide();
        }
      });
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Offcanvas.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (
          data[config] === undefined ||
          config.startsWith("_") ||
          config === "constructor"
        ) {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config](this);
      });
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API$1,
    SELECTOR_DATA_TOGGLE$1,
    function (event) {
      const target = getElementFromSelector(this);
      if (["A", "AREA"].includes(this.tagName)) {
        event.preventDefault();
      }
      if (isDisabled(this)) {
        return;
      }
      EventHandler.one(target, EVENT_HIDDEN$2, () => {
        if (isVisible(this)) {
          this.focus();
        }
      });
      const allReadyOpen = SelectorEngine.findOne(OPEN_SELECTOR);
      if (allReadyOpen && allReadyOpen !== target) {
        Offcanvas.getInstance(allReadyOpen).hide();
      }
      const data = Offcanvas.getOrCreateInstance(target);
      data.toggle(this);
    }
  );
  EventHandler.on(window, EVENT_LOAD_DATA_API$1, () =>
    SelectorEngine.find(OPEN_SELECTOR).forEach((el) =>
      Offcanvas.getOrCreateInstance(el).show()
    )
  );
  enableDismissTrigger(Offcanvas);
  defineJQueryPlugin(Offcanvas);
  const uriAttributes = new Set([
    "background",
    "cite",
    "href",
    "itemtype",
    "longdesc",
    "poster",
    "src",
    "xlink:href",
  ]);
  const ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;
  const SAFE_URL_PATTERN =
    /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^#&/:?]*(?:[#/?]|$))/i;
  const DATA_URL_PATTERN =
    /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[\d+/a-z]+=*$/i;
  const allowedAttribute = (attribute, allowedAttributeList) => {
    const attributeName = attribute.nodeName.toLowerCase();
    if (allowedAttributeList.includes(attributeName)) {
      if (uriAttributes.has(attributeName)) {
        return Boolean(
          SAFE_URL_PATTERN.test(attribute.nodeValue) ||
            DATA_URL_PATTERN.test(attribute.nodeValue)
        );
      }
      return true;
    }
    const regExp = allowedAttributeList.filter(
      (attributeRegex) => attributeRegex instanceof RegExp
    );
    for (let i = 0, len = regExp.length; i < len; i++) {
      if (regExp[i].test(attributeName)) {
        return true;
      }
    }
    return false;
  };
  const DefaultAllowlist = {
    "*": ["class", "dir", "id", "lang", "role", ARIA_ATTRIBUTE_PATTERN],
    a: ["target", "href", "title", "rel"],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    div: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ["src", "srcset", "alt", "title", "width", "height"],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: [],
  };
  function sanitizeHtml(unsafeHtml, allowList, sanitizeFn) {
    if (!unsafeHtml.length) {
      return unsafeHtml;
    }
    if (sanitizeFn && typeof sanitizeFn === "function") {
      return sanitizeFn(unsafeHtml);
    }
    const domParser = new window.DOMParser();
    const createdDocument = domParser.parseFromString(unsafeHtml, "text/html");
    const elements = [].concat(...createdDocument.body.querySelectorAll("*"));
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      const elementName = element.nodeName.toLowerCase();
      if (!Object.keys(allowList).includes(elementName)) {
        element.remove();
        continue;
      }
      const attributeList = [].concat(...element.attributes);
      const allowedAttributes = [].concat(
        allowList["*"] || [],
        allowList[elementName] || []
      );
      attributeList.forEach((attribute) => {
        if (!allowedAttribute(attribute, allowedAttributes)) {
          element.removeAttribute(attribute.nodeName);
        }
      });
    }
    return createdDocument.body.innerHTML;
  }
  const NAME$4 = "tooltip";
  const DATA_KEY$4 = "bs.tooltip";
  const EVENT_KEY$4 = `.${DATA_KEY$4}`;
  const CLASS_PREFIX$1 = "bs-tooltip";
  const DISALLOWED_ATTRIBUTES = new Set([
    "sanitize",
    "allowList",
    "sanitizeFn",
  ]);
  const DefaultType$3 = {
    animation: "boolean",
    template: "string",
    title: "(string|element|function)",
    trigger: "string",
    delay: "(number|object)",
    html: "boolean",
    selector: "(string|boolean)",
    placement: "(string|function)",
    offset: "(array|string|function)",
    container: "(string|element|boolean)",
    fallbackPlacements: "array",
    boundary: "(string|element)",
    customClass: "(string|function)",
    sanitize: "boolean",
    sanitizeFn: "(null|function)",
    allowList: "object",
    popperConfig: "(null|object|function)",
  };
  const AttachmentMap = {
    AUTO: "auto",
    TOP: "top",
    RIGHT: isRTL() ? "left" : "right",
    BOTTOM: "bottom",
    LEFT: isRTL() ? "right" : "left",
  };
  const Default$3 = {
    animation: true,
    template:
      '<div class="tooltip" role="tooltip">' +
      '<div class="tooltip-arrow"></div>' +
      '<div class="tooltip-inner"></div>' +
      "</div>",
    trigger: "hover focus",
    title: "",
    delay: 0,
    html: false,
    selector: false,
    placement: "top",
    offset: [0, 0],
    container: false,
    fallbackPlacements: ["top", "right", "bottom", "left"],
    boundary: "clippingParents",
    customClass: "",
    sanitize: true,
    sanitizeFn: null,
    allowList: DefaultAllowlist,
    popperConfig: null,
  };
  const Event$2 = {
    HIDE: `hide${EVENT_KEY$4}`,
    HIDDEN: `hidden${EVENT_KEY$4}`,
    SHOW: `show${EVENT_KEY$4}`,
    SHOWN: `shown${EVENT_KEY$4}`,
    INSERTED: `inserted${EVENT_KEY$4}`,
    CLICK: `click${EVENT_KEY$4}`,
    FOCUSIN: `focusin${EVENT_KEY$4}`,
    FOCUSOUT: `focusout${EVENT_KEY$4}`,
    MOUSEENTER: `mouseenter${EVENT_KEY$4}`,
    MOUSELEAVE: `mouseleave${EVENT_KEY$4}`,
  };
  const CLASS_NAME_FADE$2 = "fade";
  const CLASS_NAME_MODAL = "modal";
  const CLASS_NAME_SHOW$2 = "show";
  const HOVER_STATE_SHOW = "show";
  const HOVER_STATE_OUT = "out";
  const SELECTOR_TOOLTIP_INNER = ".tooltip-inner";
  const SELECTOR_MODAL = `.${CLASS_NAME_MODAL}`;
  const EVENT_MODAL_HIDE = "hide.bs.modal";
  const TRIGGER_HOVER = "hover";
  const TRIGGER_FOCUS = "focus";
  const TRIGGER_CLICK = "click";
  const TRIGGER_MANUAL = "manual";
  class Tooltip extends BaseComponent {
    constructor(element, config) {
      if (typeof Popper === "undefined") {
        throw new TypeError(
          "Bootstrap's tooltips require Popper (https://popper.js.org)"
        );
      }
      super(element);
      this._isEnabled = true;
      this._timeout = 0;
      this._hoverState = "";
      this._activeTrigger = {};
      this._popper = null;
      this._config = this._getConfig(config);
      this.tip = null;
      this._setListeners();
    }
    static get Default() {
      return Default$3;
    }
    static get NAME() {
      return NAME$4;
    }
    static get Event() {
      return Event$2;
    }
    static get DefaultType() {
      return DefaultType$3;
    }
    enable() {
      this._isEnabled = true;
    }
    disable() {
      this._isEnabled = false;
    }
    toggleEnabled() {
      this._isEnabled = !this._isEnabled;
    }
    toggle(event) {
      if (!this._isEnabled) {
        return;
      }
      if (event) {
        const context = this._initializeOnDelegatedTarget(event);
        context._activeTrigger.click = !context._activeTrigger.click;
        if (context._isWithActiveTrigger()) {
          context._enter(null, context);
        } else {
          context._leave(null, context);
        }
      } else {
        if (this.getTipElement().classList.contains(CLASS_NAME_SHOW$2)) {
          this._leave(null, this);
          return;
        }
        this._enter(null, this);
      }
    }
    dispose() {
      clearTimeout(this._timeout);
      EventHandler.off(
        this._element.closest(SELECTOR_MODAL),
        EVENT_MODAL_HIDE,
        this._hideModalHandler
      );
      if (this.tip) {
        this.tip.remove();
      }
      this._disposePopper();
      super.dispose();
    }
    show() {
      if (this._element.style.display === "none") {
        throw new Error("Please use show on visible elements");
      }
      if (!(this.isWithContent() && this._isEnabled)) {
        return;
      }
      const showEvent = EventHandler.trigger(
        this._element,
        this.constructor.Event.SHOW
      );
      const shadowRoot = findShadowRoot(this._element);
      const isInTheDom =
        shadowRoot === null
          ? this._element.ownerDocument.documentElement.contains(this._element)
          : shadowRoot.contains(this._element);
      if (showEvent.defaultPrevented || !isInTheDom) {
        return;
      }
      if (
        this.constructor.NAME === "tooltip" &&
        this.tip &&
        this.getTitle() !==
          this.tip.querySelector(SELECTOR_TOOLTIP_INNER).innerHTML
      ) {
        this._disposePopper();
        this.tip.remove();
        this.tip = null;
      }
      const tip = this.getTipElement();
      const tipId = getUID(this.constructor.NAME);
      tip.setAttribute("id", tipId);
      this._element.setAttribute("aria-describedby", tipId);
      if (this._config.animation) {
        tip.classList.add(CLASS_NAME_FADE$2);
      }
      const placement =
        typeof this._config.placement === "function"
          ? this._config.placement.call(this, tip, this._element)
          : this._config.placement;
      const attachment = this._getAttachment(placement);
      this._addAttachmentClass(attachment);
      const { container } = this._config;
      Data.set(tip, this.constructor.DATA_KEY, this);
      if (!this._element.ownerDocument.documentElement.contains(this.tip)) {
        container.append(tip);
        EventHandler.trigger(this._element, this.constructor.Event.INSERTED);
      }
      if (this._popper) {
        this._popper.update();
      } else {
        this._popper = createPopper(
          this._element,
          tip,
          this._getPopperConfig(attachment)
        );
      }
      tip.classList.add(CLASS_NAME_SHOW$2);
      const customClass = this._resolvePossibleFunction(
        this._config.customClass
      );
      if (customClass) {
        tip.classList.add(...customClass.split(" "));
      }
      if ("ontouchstart" in document.documentElement) {
        [].concat(...document.body.children).forEach((element) => {
          EventHandler.on(element, "mouseover", noop);
        });
      }
      const complete = () => {
        const prevHoverState = this._hoverState;
        this._hoverState = null;
        EventHandler.trigger(this._element, this.constructor.Event.SHOWN);
        if (prevHoverState === HOVER_STATE_OUT) {
          this._leave(null, this);
        }
      };
      const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);
      this._queueCallback(complete, this.tip, isAnimated);
    }
    hide() {
      if (!this._popper) {
        return;
      }
      const tip = this.getTipElement();
      const complete = () => {
        if (this._isWithActiveTrigger()) {
          return;
        }
        if (this._hoverState !== HOVER_STATE_SHOW) {
          tip.remove();
        }
        this._cleanTipClass();
        this._element.removeAttribute("aria-describedby");
        EventHandler.trigger(this._element, this.constructor.Event.HIDDEN);
        this._disposePopper();
      };
      const hideEvent = EventHandler.trigger(
        this._element,
        this.constructor.Event.HIDE
      );
      if (hideEvent.defaultPrevented) {
        return;
      }
      tip.classList.remove(CLASS_NAME_SHOW$2);
      if ("ontouchstart" in document.documentElement) {
        []
          .concat(...document.body.children)
          .forEach((element) => EventHandler.off(element, "mouseover", noop));
      }
      this._activeTrigger[TRIGGER_CLICK] = false;
      this._activeTrigger[TRIGGER_FOCUS] = false;
      this._activeTrigger[TRIGGER_HOVER] = false;
      const isAnimated = this.tip.classList.contains(CLASS_NAME_FADE$2);
      this._queueCallback(complete, this.tip, isAnimated);
      this._hoverState = "";
    }
    update() {
      if (this._popper !== null) {
        this._popper.update();
      }
    }
    isWithContent() {
      return Boolean(this.getTitle());
    }
    getTipElement() {
      if (this.tip) {
        return this.tip;
      }
      const element = document.createElement("div");
      element.innerHTML = this._config.template;
      const tip = element.children[0];
      this.setContent(tip);
      tip.classList.remove(CLASS_NAME_FADE$2, CLASS_NAME_SHOW$2);
      this.tip = tip;
      return this.tip;
    }
    setContent(tip) {
      this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TOOLTIP_INNER);
    }
    _sanitizeAndSetContent(template, content, selector) {
      const templateElement = SelectorEngine.findOne(selector, template);
      if (!content && templateElement) {
        templateElement.remove();
        return;
      }
      this.setElementContent(templateElement, content);
    }
    setElementContent(element, content) {
      if (element === null) {
        return;
      }
      if (isElement$1(content)) {
        content = getElement(content);
        if (this._config.html) {
          if (content.parentNode !== element) {
            element.innerHTML = "";
            element.append(content);
          }
        } else {
          element.textContent = content.textContent;
        }
        return;
      }
      if (this._config.html) {
        if (this._config.sanitize) {
          content = sanitizeHtml(
            content,
            this._config.allowList,
            this._config.sanitizeFn
          );
        }
        element.innerHTML = content;
      } else {
        element.textContent = content;
      }
    }
    getTitle() {
      const title =
        this._element.getAttribute("data-bs-original-title") ||
        this._config.title;
      return this._resolvePossibleFunction(title);
    }
    updateAttachment(attachment) {
      if (attachment === "right") {
        return "end";
      }
      if (attachment === "left") {
        return "start";
      }
      return attachment;
    }
    _initializeOnDelegatedTarget(event, context) {
      return (
        context ||
        this.constructor.getOrCreateInstance(
          event.delegateTarget,
          this._getDelegateConfig()
        )
      );
    }
    _getOffset() {
      const { offset } = this._config;
      if (typeof offset === "string") {
        return offset.split(",").map((val) => Number.parseInt(val, 10));
      }
      if (typeof offset === "function") {
        return (popperData) => offset(popperData, this._element);
      }
      return offset;
    }
    _resolvePossibleFunction(content) {
      return typeof content === "function"
        ? content.call(this._element)
        : content;
    }
    _getPopperConfig(attachment) {
      const defaultBsPopperConfig = {
        placement: attachment,
        modifiers: [
          {
            name: "flip",
            options: { fallbackPlacements: this._config.fallbackPlacements },
          },
          { name: "offset", options: { offset: this._getOffset() } },
          {
            name: "preventOverflow",
            options: { boundary: this._config.boundary },
          },
          {
            name: "arrow",
            options: { element: `.${this.constructor.NAME}-arrow` },
          },
          {
            name: "onChange",
            enabled: true,
            phase: "afterWrite",
            fn: (data) => this._handlePopperPlacementChange(data),
          },
        ],
        onFirstUpdate: (data) => {
          if (data.options.placement !== data.placement) {
            this._handlePopperPlacementChange(data);
          }
        },
      };
      return {
        ...defaultBsPopperConfig,
        ...(typeof this._config.popperConfig === "function"
          ? this._config.popperConfig(defaultBsPopperConfig)
          : this._config.popperConfig),
      };
    }
    _addAttachmentClass(attachment) {
      this.getTipElement().classList.add(
        `${this._getBasicClassPrefix()}-${this.updateAttachment(attachment)}`
      );
    }
    _getAttachment(placement) {
      return AttachmentMap[placement.toUpperCase()];
    }
    _setListeners() {
      const triggers = this._config.trigger.split(" ");
      triggers.forEach((trigger) => {
        if (trigger === "click") {
          EventHandler.on(
            this._element,
            this.constructor.Event.CLICK,
            this._config.selector,
            (event) => this.toggle(event)
          );
        } else if (trigger !== TRIGGER_MANUAL) {
          const eventIn =
            trigger === TRIGGER_HOVER
              ? this.constructor.Event.MOUSEENTER
              : this.constructor.Event.FOCUSIN;
          const eventOut =
            trigger === TRIGGER_HOVER
              ? this.constructor.Event.MOUSELEAVE
              : this.constructor.Event.FOCUSOUT;
          EventHandler.on(
            this._element,
            eventIn,
            this._config.selector,
            (event) => this._enter(event)
          );
          EventHandler.on(
            this._element,
            eventOut,
            this._config.selector,
            (event) => this._leave(event)
          );
        }
      });
      this._hideModalHandler = () => {
        if (this._element) {
          this.hide();
        }
      };
      EventHandler.on(
        this._element.closest(SELECTOR_MODAL),
        EVENT_MODAL_HIDE,
        this._hideModalHandler
      );
      if (this._config.selector) {
        this._config = { ...this._config, trigger: "manual", selector: "" };
      } else {
        this._fixTitle();
      }
    }
    _fixTitle() {
      const title = this._element.getAttribute("title");
      const originalTitleType = typeof this._element.getAttribute(
        "data-bs-original-title"
      );
      if (title || originalTitleType !== "string") {
        this._element.setAttribute("data-bs-original-title", title || "");
        if (
          title &&
          !this._element.getAttribute("aria-label") &&
          !this._element.textContent
        ) {
          this._element.setAttribute("aria-label", title);
        }
        this._element.setAttribute("title", "");
      }
    }
    _enter(event, context) {
      context = this._initializeOnDelegatedTarget(event, context);
      if (event) {
        context._activeTrigger[
          event.type === "focusin" ? TRIGGER_FOCUS : TRIGGER_HOVER
        ] = true;
      }
      if (
        context.getTipElement().classList.contains(CLASS_NAME_SHOW$2) ||
        context._hoverState === HOVER_STATE_SHOW
      ) {
        context._hoverState = HOVER_STATE_SHOW;
        return;
      }
      clearTimeout(context._timeout);
      context._hoverState = HOVER_STATE_SHOW;
      if (!context._config.delay || !context._config.delay.show) {
        context.show();
        return;
      }
      context._timeout = setTimeout(() => {
        if (context._hoverState === HOVER_STATE_SHOW) {
          context.show();
        }
      }, context._config.delay.show);
    }
    _leave(event, context) {
      context = this._initializeOnDelegatedTarget(event, context);
      if (event) {
        context._activeTrigger[
          event.type === "focusout" ? TRIGGER_FOCUS : TRIGGER_HOVER
        ] = context._element.contains(event.relatedTarget);
      }
      if (context._isWithActiveTrigger()) {
        return;
      }
      clearTimeout(context._timeout);
      context._hoverState = HOVER_STATE_OUT;
      if (!context._config.delay || !context._config.delay.hide) {
        context.hide();
        return;
      }
      context._timeout = setTimeout(() => {
        if (context._hoverState === HOVER_STATE_OUT) {
          context.hide();
        }
      }, context._config.delay.hide);
    }
    _isWithActiveTrigger() {
      for (const trigger in this._activeTrigger) {
        if (this._activeTrigger[trigger]) {
          return true;
        }
      }
      return false;
    }
    _getConfig(config) {
      const dataAttributes = Manipulator.getDataAttributes(this._element);
      Object.keys(dataAttributes).forEach((dataAttr) => {
        if (DISALLOWED_ATTRIBUTES.has(dataAttr)) {
          delete dataAttributes[dataAttr];
        }
      });
      config = {
        ...this.constructor.Default,
        ...dataAttributes,
        ...(typeof config === "object" && config ? config : {}),
      };
      config.container =
        config.container === false
          ? document.body
          : getElement(config.container);
      if (typeof config.delay === "number") {
        config.delay = { show: config.delay, hide: config.delay };
      }
      if (typeof config.title === "number") {
        config.title = config.title.toString();
      }
      if (typeof config.content === "number") {
        config.content = config.content.toString();
      }
      typeCheckConfig(NAME$4, config, this.constructor.DefaultType);
      if (config.sanitize) {
        config.template = sanitizeHtml(
          config.template,
          config.allowList,
          config.sanitizeFn
        );
      }
      return config;
    }
    _getDelegateConfig() {
      const config = {};
      for (const key in this._config) {
        if (this.constructor.Default[key] !== this._config[key]) {
          config[key] = this._config[key];
        }
      }
      return config;
    }
    _cleanTipClass() {
      const tip = this.getTipElement();
      const basicClassPrefixRegex = new RegExp(
        `(^|\\s)${this._getBasicClassPrefix()}\\S+`,
        "g"
      );
      const tabClass = tip.getAttribute("class").match(basicClassPrefixRegex);
      if (tabClass !== null && tabClass.length > 0) {
        tabClass
          .map((token) => token.trim())
          .forEach((tClass) => tip.classList.remove(tClass));
      }
    }
    _getBasicClassPrefix() {
      return CLASS_PREFIX$1;
    }
    _handlePopperPlacementChange(popperData) {
      const { state } = popperData;
      if (!state) {
        return;
      }
      this.tip = state.elements.popper;
      this._cleanTipClass();
      this._addAttachmentClass(this._getAttachment(state.placement));
    }
    _disposePopper() {
      if (this._popper) {
        this._popper.destroy();
        this._popper = null;
      }
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Tooltip.getOrCreateInstance(this, config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  }
  defineJQueryPlugin(Tooltip);
  const NAME$3 = "popover";
  const DATA_KEY$3 = "bs.popover";
  const EVENT_KEY$3 = `.${DATA_KEY$3}`;
  const CLASS_PREFIX = "bs-popover";
  const Default$2 = {
    ...Tooltip.Default,
    placement: "right",
    offset: [0, 8],
    trigger: "click",
    content: "",
    template:
      '<div class="popover" role="tooltip">' +
      '<div class="popover-arrow"></div>' +
      '<h3 class="popover-header"></h3>' +
      '<div class="popover-body"></div>' +
      "</div>",
  };
  const DefaultType$2 = {
    ...Tooltip.DefaultType,
    content: "(string|element|function)",
  };
  const Event$1 = {
    HIDE: `hide${EVENT_KEY$3}`,
    HIDDEN: `hidden${EVENT_KEY$3}`,
    SHOW: `show${EVENT_KEY$3}`,
    SHOWN: `shown${EVENT_KEY$3}`,
    INSERTED: `inserted${EVENT_KEY$3}`,
    CLICK: `click${EVENT_KEY$3}`,
    FOCUSIN: `focusin${EVENT_KEY$3}`,
    FOCUSOUT: `focusout${EVENT_KEY$3}`,
    MOUSEENTER: `mouseenter${EVENT_KEY$3}`,
    MOUSELEAVE: `mouseleave${EVENT_KEY$3}`,
  };
  const SELECTOR_TITLE = ".popover-header";
  const SELECTOR_CONTENT = ".popover-body";
  class Popover extends Tooltip {
    static get Default() {
      return Default$2;
    }
    static get NAME() {
      return NAME$3;
    }
    static get Event() {
      return Event$1;
    }
    static get DefaultType() {
      return DefaultType$2;
    }
    isWithContent() {
      return this.getTitle() || this._getContent();
    }
    setContent(tip) {
      this._sanitizeAndSetContent(tip, this.getTitle(), SELECTOR_TITLE);
      this._sanitizeAndSetContent(tip, this._getContent(), SELECTOR_CONTENT);
    }
    _getContent() {
      return this._resolvePossibleFunction(this._config.content);
    }
    _getBasicClassPrefix() {
      return CLASS_PREFIX;
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Popover.getOrCreateInstance(this, config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  }
  defineJQueryPlugin(Popover);
  const NAME$2 = "scrollspy";
  const DATA_KEY$2 = "bs.scrollspy";
  const EVENT_KEY$2 = `.${DATA_KEY$2}`;
  const DATA_API_KEY$1 = ".data-api";
  const Default$1 = { offset: 10, method: "auto", target: "" };
  const DefaultType$1 = {
    offset: "number",
    method: "string",
    target: "(string|element)",
  };
  const EVENT_ACTIVATE = `activate${EVENT_KEY$2}`;
  const EVENT_SCROLL = `scroll${EVENT_KEY$2}`;
  const EVENT_LOAD_DATA_API = `load${EVENT_KEY$2}${DATA_API_KEY$1}`;
  const CLASS_NAME_DROPDOWN_ITEM = "dropdown-item";
  const CLASS_NAME_ACTIVE$1 = "active";
  const SELECTOR_DATA_SPY = '[data-bs-spy="scroll"]';
  const SELECTOR_NAV_LIST_GROUP$1 = ".nav, .list-group";
  const SELECTOR_NAV_LINKS = ".nav-link";
  const SELECTOR_NAV_ITEMS = ".nav-item";
  const SELECTOR_LIST_ITEMS = ".list-group-item";
  const SELECTOR_LINK_ITEMS = `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}, .${CLASS_NAME_DROPDOWN_ITEM}`;
  const SELECTOR_DROPDOWN$1 = ".dropdown";
  const SELECTOR_DROPDOWN_TOGGLE$1 = ".dropdown-toggle";
  const METHOD_OFFSET = "offset";
  const METHOD_POSITION = "position";
  class ScrollSpy extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._scrollElement =
        this._element.tagName === "BODY" ? window : this._element;
      this._config = this._getConfig(config);
      this._offsets = [];
      this._targets = [];
      this._activeTarget = null;
      this._scrollHeight = 0;
      EventHandler.on(this._scrollElement, EVENT_SCROLL, () => this._process());
      this.refresh();
      this._process();
    }
    static get Default() {
      return Default$1;
    }
    static get NAME() {
      return NAME$2;
    }
    refresh() {
      const autoMethod =
        this._scrollElement === this._scrollElement.window
          ? METHOD_OFFSET
          : METHOD_POSITION;
      const offsetMethod =
        this._config.method === "auto" ? autoMethod : this._config.method;
      const offsetBase =
        offsetMethod === METHOD_POSITION ? this._getScrollTop() : 0;
      this._offsets = [];
      this._targets = [];
      this._scrollHeight = this._getScrollHeight();
      const targets = SelectorEngine.find(
        SELECTOR_LINK_ITEMS,
        this._config.target
      );
      targets
        .map((element) => {
          const targetSelector = getSelectorFromElement(element);
          const target = targetSelector
            ? SelectorEngine.findOne(targetSelector)
            : null;
          if (target) {
            const targetBCR = target.getBoundingClientRect();
            if (targetBCR.width || targetBCR.height) {
              return [
                Manipulator[offsetMethod](target).top + offsetBase,
                targetSelector,
              ];
            }
          }
          return null;
        })
        .filter((item) => item)
        .sort((a, b) => a[0] - b[0])
        .forEach((item) => {
          this._offsets.push(item[0]);
          this._targets.push(item[1]);
        });
    }
    dispose() {
      EventHandler.off(this._scrollElement, EVENT_KEY$2);
      super.dispose();
    }
    _getConfig(config) {
      config = {
        ...Default$1,
        ...Manipulator.getDataAttributes(this._element),
        ...(typeof config === "object" && config ? config : {}),
      };
      config.target = getElement(config.target) || document.documentElement;
      typeCheckConfig(NAME$2, config, DefaultType$1);
      return config;
    }
    _getScrollTop() {
      return this._scrollElement === window
        ? this._scrollElement.pageYOffset
        : this._scrollElement.scrollTop;
    }
    _getScrollHeight() {
      return (
        this._scrollElement.scrollHeight ||
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight
        )
      );
    }
    _getOffsetHeight() {
      return this._scrollElement === window
        ? window.innerHeight
        : this._scrollElement.getBoundingClientRect().height;
    }
    _process() {
      const scrollTop = this._getScrollTop() + this._config.offset;
      const scrollHeight = this._getScrollHeight();
      const maxScroll =
        this._config.offset + scrollHeight - this._getOffsetHeight();
      if (this._scrollHeight !== scrollHeight) {
        this.refresh();
      }
      if (scrollTop >= maxScroll) {
        const target = this._targets[this._targets.length - 1];
        if (this._activeTarget !== target) {
          this._activate(target);
        }
        return;
      }
      if (
        this._activeTarget &&
        scrollTop < this._offsets[0] &&
        this._offsets[0] > 0
      ) {
        this._activeTarget = null;
        this._clear();
        return;
      }
      for (let i = this._offsets.length; i--; ) {
        const isActiveTarget =
          this._activeTarget !== this._targets[i] &&
          scrollTop >= this._offsets[i] &&
          (typeof this._offsets[i + 1] === "undefined" ||
            scrollTop < this._offsets[i + 1]);
        if (isActiveTarget) {
          this._activate(this._targets[i]);
        }
      }
    }
    _activate(target) {
      this._activeTarget = target;
      this._clear();
      const queries = SELECTOR_LINK_ITEMS.split(",").map(
        (selector) =>
          `${selector}[data-bs-target="${target}"],${selector}[href="${target}"]`
      );
      const link = SelectorEngine.findOne(
        queries.join(","),
        this._config.target
      );
      link.classList.add(CLASS_NAME_ACTIVE$1);
      if (link.classList.contains(CLASS_NAME_DROPDOWN_ITEM)) {
        SelectorEngine.findOne(
          SELECTOR_DROPDOWN_TOGGLE$1,
          link.closest(SELECTOR_DROPDOWN$1)
        ).classList.add(CLASS_NAME_ACTIVE$1);
      } else {
        SelectorEngine.parents(link, SELECTOR_NAV_LIST_GROUP$1).forEach(
          (listGroup) => {
            SelectorEngine.prev(
              listGroup,
              `${SELECTOR_NAV_LINKS}, ${SELECTOR_LIST_ITEMS}`
            ).forEach((item) => item.classList.add(CLASS_NAME_ACTIVE$1));
            SelectorEngine.prev(listGroup, SELECTOR_NAV_ITEMS).forEach(
              (navItem) => {
                SelectorEngine.children(navItem, SELECTOR_NAV_LINKS).forEach(
                  (item) => item.classList.add(CLASS_NAME_ACTIVE$1)
                );
              }
            );
          }
        );
      }
      EventHandler.trigger(this._scrollElement, EVENT_ACTIVATE, {
        relatedTarget: target,
      });
    }
    _clear() {
      SelectorEngine.find(SELECTOR_LINK_ITEMS, this._config.target)
        .filter((node) => node.classList.contains(CLASS_NAME_ACTIVE$1))
        .forEach((node) => node.classList.remove(CLASS_NAME_ACTIVE$1));
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = ScrollSpy.getOrCreateInstance(this, config);
        if (typeof config !== "string") {
          return;
        }
        if (typeof data[config] === "undefined") {
          throw new TypeError(`No method named "${config}"`);
        }
        data[config]();
      });
    }
  }
  EventHandler.on(window, EVENT_LOAD_DATA_API, () => {
    SelectorEngine.find(SELECTOR_DATA_SPY).forEach((spy) => new ScrollSpy(spy));
  });
  defineJQueryPlugin(ScrollSpy);
  const NAME$1 = "tab";
  const DATA_KEY$1 = "bs.tab";
  const EVENT_KEY$1 = `.${DATA_KEY$1}`;
  const DATA_API_KEY = ".data-api";
  const EVENT_HIDE$1 = `hide${EVENT_KEY$1}`;
  const EVENT_HIDDEN$1 = `hidden${EVENT_KEY$1}`;
  const EVENT_SHOW$1 = `show${EVENT_KEY$1}`;
  const EVENT_SHOWN$1 = `shown${EVENT_KEY$1}`;
  const EVENT_CLICK_DATA_API = `click${EVENT_KEY$1}${DATA_API_KEY}`;
  const CLASS_NAME_DROPDOWN_MENU = "dropdown-menu";
  const CLASS_NAME_ACTIVE = "active";
  const CLASS_NAME_FADE$1 = "fade";
  const CLASS_NAME_SHOW$1 = "show";
  const SELECTOR_DROPDOWN = ".dropdown";
  const SELECTOR_NAV_LIST_GROUP = ".nav, .list-group";
  const SELECTOR_ACTIVE = ".active";
  const SELECTOR_ACTIVE_UL = ":scope > li > .active";
  const SELECTOR_DATA_TOGGLE =
    '[data-bs-toggle="tab"], [data-bs-toggle="pill"], [data-bs-toggle="list"]';
  const SELECTOR_DROPDOWN_TOGGLE = ".dropdown-toggle";
  const SELECTOR_DROPDOWN_ACTIVE_CHILD = ":scope > .dropdown-menu .active";
  class Tab extends BaseComponent {
    static get NAME() {
      return NAME$1;
    }
    show() {
      if (
        this._element.parentNode &&
        this._element.parentNode.nodeType === Node.ELEMENT_NODE &&
        this._element.classList.contains(CLASS_NAME_ACTIVE)
      ) {
        return;
      }
      let previous;
      const target = getElementFromSelector(this._element);
      const listElement = this._element.closest(SELECTOR_NAV_LIST_GROUP);
      if (listElement) {
        const itemSelector =
          listElement.nodeName === "UL" || listElement.nodeName === "OL"
            ? SELECTOR_ACTIVE_UL
            : SELECTOR_ACTIVE;
        previous = SelectorEngine.find(itemSelector, listElement);
        previous = previous[previous.length - 1];
      }
      const hideEvent = previous
        ? EventHandler.trigger(previous, EVENT_HIDE$1, {
            relatedTarget: this._element,
          })
        : null;
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW$1, {
        relatedTarget: previous,
      });
      if (
        showEvent.defaultPrevented ||
        (hideEvent !== null && hideEvent.defaultPrevented)
      ) {
        return;
      }
      this._activate(this._element, listElement);
      const complete = () => {
        EventHandler.trigger(previous, EVENT_HIDDEN$1, {
          relatedTarget: this._element,
        });
        EventHandler.trigger(this._element, EVENT_SHOWN$1, {
          relatedTarget: previous,
        });
      };
      if (target) {
        this._activate(target, target.parentNode, complete);
      } else {
        complete();
      }
    }
    _activate(element, container, callback) {
      const activeElements =
        container &&
        (container.nodeName === "UL" || container.nodeName === "OL")
          ? SelectorEngine.find(SELECTOR_ACTIVE_UL, container)
          : SelectorEngine.children(container, SELECTOR_ACTIVE);
      const active = activeElements[0];
      const isTransitioning =
        callback && active && active.classList.contains(CLASS_NAME_FADE$1);
      const complete = () =>
        this._transitionComplete(element, active, callback);
      if (active && isTransitioning) {
        active.classList.remove(CLASS_NAME_SHOW$1);
        this._queueCallback(complete, element, true);
      } else {
        complete();
      }
    }
    _transitionComplete(element, active, callback) {
      if (active) {
        active.classList.remove(CLASS_NAME_ACTIVE);
        const dropdownChild = SelectorEngine.findOne(
          SELECTOR_DROPDOWN_ACTIVE_CHILD,
          active.parentNode
        );
        if (dropdownChild) {
          dropdownChild.classList.remove(CLASS_NAME_ACTIVE);
        }
        if (active.getAttribute("role") === "tab") {
          active.setAttribute("aria-selected", false);
        }
      }
      element.classList.add(CLASS_NAME_ACTIVE);
      if (element.getAttribute("role") === "tab") {
        element.setAttribute("aria-selected", true);
      }
      reflow(element);
      if (element.classList.contains(CLASS_NAME_FADE$1)) {
        element.classList.add(CLASS_NAME_SHOW$1);
      }
      let parent = element.parentNode;
      if (parent && parent.nodeName === "LI") {
        parent = parent.parentNode;
      }
      if (parent && parent.classList.contains(CLASS_NAME_DROPDOWN_MENU)) {
        const dropdownElement = element.closest(SELECTOR_DROPDOWN);
        if (dropdownElement) {
          SelectorEngine.find(
            SELECTOR_DROPDOWN_TOGGLE,
            dropdownElement
          ).forEach((dropdown) => dropdown.classList.add(CLASS_NAME_ACTIVE));
        }
        element.setAttribute("aria-expanded", true);
      }
      if (callback) {
        callback();
      }
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Tab.getOrCreateInstance(this);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config]();
        }
      });
    }
  }
  EventHandler.on(
    document,
    EVENT_CLICK_DATA_API,
    SELECTOR_DATA_TOGGLE,
    function (event) {
      if (["A", "AREA"].includes(this.tagName)) {
        event.preventDefault();
      }
      if (isDisabled(this)) {
        return;
      }
      const data = Tab.getOrCreateInstance(this);
      data.show();
    }
  );
  defineJQueryPlugin(Tab);
  const NAME = "toast";
  const DATA_KEY = "bs.toast";
  const EVENT_KEY = `.${DATA_KEY}`;
  const EVENT_MOUSEOVER = `mouseover${EVENT_KEY}`;
  const EVENT_MOUSEOUT = `mouseout${EVENT_KEY}`;
  const EVENT_FOCUSIN = `focusin${EVENT_KEY}`;
  const EVENT_FOCUSOUT = `focusout${EVENT_KEY}`;
  const EVENT_HIDE = `hide${EVENT_KEY}`;
  const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
  const EVENT_SHOW = `show${EVENT_KEY}`;
  const EVENT_SHOWN = `shown${EVENT_KEY}`;
  const CLASS_NAME_FADE = "fade";
  const CLASS_NAME_HIDE = "hide";
  const CLASS_NAME_SHOW = "show";
  const CLASS_NAME_SHOWING = "showing";
  const DefaultType = {
    animation: "boolean",
    autohide: "boolean",
    delay: "number",
  };
  const Default = { animation: true, autohide: true, delay: 5e3 };
  class Toast extends BaseComponent {
    constructor(element, config) {
      super(element);
      this._config = this._getConfig(config);
      this._timeout = null;
      this._hasMouseInteraction = false;
      this._hasKeyboardInteraction = false;
      this._setListeners();
    }
    static get DefaultType() {
      return DefaultType;
    }
    static get Default() {
      return Default;
    }
    static get NAME() {
      return NAME;
    }
    show() {
      const showEvent = EventHandler.trigger(this._element, EVENT_SHOW);
      if (showEvent.defaultPrevented) {
        return;
      }
      this._clearTimeout();
      if (this._config.animation) {
        this._element.classList.add(CLASS_NAME_FADE);
      }
      const complete = () => {
        this._element.classList.remove(CLASS_NAME_SHOWING);
        EventHandler.trigger(this._element, EVENT_SHOWN);
        this._maybeScheduleHide();
      };
      this._element.classList.remove(CLASS_NAME_HIDE);
      reflow(this._element);
      this._element.classList.add(CLASS_NAME_SHOW);
      this._element.classList.add(CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    hide() {
      if (!this._element.classList.contains(CLASS_NAME_SHOW)) {
        return;
      }
      const hideEvent = EventHandler.trigger(this._element, EVENT_HIDE);
      if (hideEvent.defaultPrevented) {
        return;
      }
      const complete = () => {
        this._element.classList.add(CLASS_NAME_HIDE);
        this._element.classList.remove(CLASS_NAME_SHOWING);
        this._element.classList.remove(CLASS_NAME_SHOW);
        EventHandler.trigger(this._element, EVENT_HIDDEN);
      };
      this._element.classList.add(CLASS_NAME_SHOWING);
      this._queueCallback(complete, this._element, this._config.animation);
    }
    dispose() {
      this._clearTimeout();
      if (this._element.classList.contains(CLASS_NAME_SHOW)) {
        this._element.classList.remove(CLASS_NAME_SHOW);
      }
      super.dispose();
    }
    _getConfig(config) {
      config = {
        ...Default,
        ...Manipulator.getDataAttributes(this._element),
        ...(typeof config === "object" && config ? config : {}),
      };
      typeCheckConfig(NAME, config, this.constructor.DefaultType);
      return config;
    }
    _maybeScheduleHide() {
      if (!this._config.autohide) {
        return;
      }
      if (this._hasMouseInteraction || this._hasKeyboardInteraction) {
        return;
      }
      this._timeout = setTimeout(() => {
        this.hide();
      }, this._config.delay);
    }
    _onInteraction(event, isInteracting) {
      switch (event.type) {
        case "mouseover":
        case "mouseout":
          this._hasMouseInteraction = isInteracting;
          break;
        case "focusin":
        case "focusout":
          this._hasKeyboardInteraction = isInteracting;
          break;
      }
      if (isInteracting) {
        this._clearTimeout();
        return;
      }
      const nextElement = event.relatedTarget;
      if (
        this._element === nextElement ||
        this._element.contains(nextElement)
      ) {
        return;
      }
      this._maybeScheduleHide();
    }
    _setListeners() {
      EventHandler.on(this._element, EVENT_MOUSEOVER, (event) =>
        this._onInteraction(event, true)
      );
      EventHandler.on(this._element, EVENT_MOUSEOUT, (event) =>
        this._onInteraction(event, false)
      );
      EventHandler.on(this._element, EVENT_FOCUSIN, (event) =>
        this._onInteraction(event, true)
      );
      EventHandler.on(this._element, EVENT_FOCUSOUT, (event) =>
        this._onInteraction(event, false)
      );
    }
    _clearTimeout() {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
    static jQueryInterface(config) {
      return this.each(function () {
        const data = Toast.getOrCreateInstance(this, config);
        if (typeof config === "string") {
          if (typeof data[config] === "undefined") {
            throw new TypeError(`No method named "${config}"`);
          }
          data[config](this);
        }
      });
    }
  }
  enableDismissTrigger(Toast);
  defineJQueryPlugin(Toast);
  const index_umd = {
    Alert: Alert,
    Button: Button,
    Carousel: Carousel,
    Collapse: Collapse,
    Dropdown: Dropdown,
    Modal: Modal,
    Offcanvas: Offcanvas,
    Popover: Popover,
    ScrollSpy: ScrollSpy,
    Tab: Tab,
    Toast: Toast,
    Tooltip: Tooltip,
  };
  return index_umd;
});
