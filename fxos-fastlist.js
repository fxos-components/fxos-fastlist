(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("fxos-component"));
	else if(typeof define === 'function' && define.amd)
		define(["fxos-component"], factory);
	else if(typeof exports === 'object')
		exports["FXOSFastlist"] = factory(require("fxos-component"));
	else
		root["FXOSFastlist"] = factory(root["fxosComponent"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 * Dependencies
	 */

	var component = __webpack_require__(1);
	var FastList = __webpack_require__(2);
	var scheduler = FastList.scheduler;
	var popel = __webpack_require__(4);

	__webpack_require__(6);

	/**
	 * Pointer abstractions
	 */

	var isTouch = 'ontouchstart' in window;
	var touchcancel = isTouch ? 'touchcancel' : 'mousecancel';
	var touchstart = isTouch ? 'touchstart' : 'mousedown';
	var touchmove = isTouch ? 'touchmove' : 'mousemove';
	var touchend = isTouch ? 'touchend' : 'mouseup';

	/**
	 * Mini Logger
	 *
	 * @type {Function}
	 */
	var debug = 0 ? (...args) => console.log('[fxos-fastlist]', ...args) : () => {};

	/**
	 * Cache to persist content.
	 *
	 * We open ASAP as we need the cached
	 * HTML content for the first-paint.
	 * As it's async it can be done in
	 * the background.
	 *
	 * @type {Promise}
	 */
	var cachesOpen = caches.open('gfl');

	/**
	 * Used to hide private properties behind.
	 *
	 * @type {Symbol}
	 */
	var keys = {
	  internal: Symbol(),
	  first: Symbol(),
	  img: Symbol()
	};

	/**
	 * Public prototype.
	 *
	 * @type {Object}
	 */
	var FXOSFastlistProto = {
	  extensible: false,

	  /**
	   * Default store up to 5mb of images.
	   *
	   * @type {Number}
	   */
	  imageCacheSize: 5e6,

	  /**
	   * Default store up to 500 images
	   * before entries start getting
	   * discarded.
	   *
	   * @type {Number}
	   */
	  imageCacheLength: 500,

	  /**
	   * Called when the component is first created.
	   *
	   * @private
	   */
	  created() {
	    debug('create');
	    this.setupShadowRoot();

	    this.caching = this.getAttribute('caching');
	    this.offset = this.getAttribute('offset');
	    this.picker = this.getAttribute('picker');
	    this.bottom = this.getAttribute('bottom');
	    this.top = this.getAttribute('top');

	    this[keys.internal] = new Internal(this);
	  },

	  /**
	   * Used to define configuration passed
	   * to internal FastList instantiation.
	   *
	   * NOTE: Must be called before `model`
	   * if defined.
	   *
	   * @param  {Object} props
	   * @public
	   */
	  configure(props) {
	    debug('configure');
	    this[keys.internal].configure(props);
	  },

	  /**
	   * Set a data model for the list to render.
	   *
	   * The returned Promise will resolve
	   * when rendering has *fully* completed.
	   *
	   * The `.rendered` Promise can be used
	   * to determine when the list is *visually*
	   * complete.
	   *
	   * @param  {Array} value
	   * @return {Promise}
	   * @public
	   */
	  setModel(value) {
	    return this[keys.internal].setModel(value);
	  },

	  /**
	   * Should be called by the user when
	   * they have finished incrementally
	   * updating there model.
	   *
	   * This acts as an internal hook used
	   * for updating caches.
	   *
	   * This only really concerns users
	   * who are using caching and fetching
	   * their model in chunks.
	   *
	   * @public
	   */
	  cache() {
	    debug('cache');
	    if (!this.caching) return;
	    this[keys.internal].cachedHeight = null;
	    return this[keys.internal].updateCache();
	  },

	  /**
	   * Clear cached height and html.
	   *
	   * @public
	   */
	  clearCache() {
	    debug('clear cache');
	    this[keys.internal].clearCache();
	  },

	  /**
	   * Smooth scrolls to the given position.
	   *
	   * @param  {Number} y
	   * @return {Promise}
	   */
	  scrollTo(y) {
	    return this[keys.internal].scrollTo(y);
	  },

	  /**
	   * Permanently destroy the component.
	   *
	   * @public
	   */
	  destroy() {
	    this[keys.internal].destroy();
	  },

	  /**
	   * Public attributes/properties configuration
	   * used by fxos-component.js.
	   *
	   * @type {Object}
	   */
	  attrs: {
	    rendered: {
	      get() { return this[keys.internal].rendered.promise; }
	    },

	    top: {
	      get() { return this._top; },
	      set(value) {
	        debug('set top', value);
	        if (value == null) return;
	        value = Number(value);
	        if (value === this._top) return;
	        this.setAttribute('top', value);
	        this._top = value;
	      }
	    },

	    bottom: {
	      get() { return this._bottom; },
	      set(value) {
	        debug('set bottom', value);
	        if (value == null) return;
	        value = Number(value);
	        if (value === this._bottom) return;
	        this.setAttribute('bottom', value);
	        this._bottom = value;
	      }
	    },

	    caching: {
	      get() { return this._caching; },
	      set(value) {
	        value = value || value === '';
	        if (value === this._caching) return;
	        if (value) this.setAttribute('caching', '');
	        else this.removeAttribute('caching');
	        this._caching = value;
	      }
	    },

	    offset: {
	      get() { return this._offset || 0; },
	      set(value) {
	        if (value == this._offset) return;
	        if (value) this.setAttribute('offset', value);
	        else this.removeAttribute('offset');
	        this._offset = Number(value);
	      }
	    },

	    scrollTop: {
	      get() { return this[keys.internal].getScrollTop(); },
	      set(value) { this[keys.internal].setScrollTop(value); }
	    },

	    minScrollHeight: {
	      get() { return this[keys.internal].list.style.minHeight; },
	      set(value) { this[keys.internal].list.style.minHeight = value; }
	    },

	    picker: {
	      get() { return this._picker; },
	      set(value) {
	        value = value || value === '';
	        if (value === this._picker) return;
	        if (value) this.setAttr('picker', '');
	        else this.removeAttr('picker');
	        this._picker = value;
	      }
	    }
	  },

	  /*jshint ignore:start*/
	  template: `
	    <div class="inner">
	      <div class="picker"><content select="[picker-item]"></content></div>
	      <div class="overlay"><div class="text">X</div><div class="icon">search</div></div>
	      <div class="fastlist">
	        <ul><content></content></ul>
	      </div>
	    </div>

	    <style>
	      :host {
	        display: block;
	        height: 100%;

	        overflow: hidden;
	        text-align: match-parent;
	        color:
	          var(--fxos-fastlist-color,
	          var(--fxos-color));
	      }

	      .inner {
	        position: relative;
	        height: 100%;
	      }

	      .fastlist {
	        position: absolute;
	        left: 0;
	        right: 0;
	        top: 0;
	        bottom: 0;

	        padding: 0 17px;
	      }

	      [picker] .fastlist {
	        offset-inline-end: 26px; /* picker width */
	        padding-inline-end: 12px;
	      }

	      .fastlist ul {
	        position: relative;

	        padding: 0;
	        margin: 0;

	        list-style: none;
	      }

	      ::content .gfl-header {
	        position: sticky;
	        top: -20px;
	        z-index: 100;

	        margin: 0 !important;
	        padding-top: 20px;
	        padding-bottom: 1px;
	        margin-bottom: -1px !important;
	        width: calc(100% + 1px);
	      }

	      ::content .gfl-item {
	        position: absolute;
	        left: 0;
	        top: 0;
	        right: 0;
	        z-index: 10;

	        display: flex;
	        flex-direction: column;
	        justify-content: center;
	        height: 60px;
	        padding: 0 9px;
	        overflow: hidden;
	        box-sizing: border-box;

	        list-style-type: none;
	        text-decoration: none;
	        -moz-user-select: none;
	        border-top: solid 1px
	          var(--fxos-fastlist-border-color,
	          var(--fxos-border-color,
	          #e7e7e7));
	        background:
	          var(--fxos-fastlist-background,
	          var(--fxos-background));
	      }

	      ::content .gfl-item.first {
	        border-top-color: transparent;
	      }

	      ::content .gfl-item[unread=true],
	      ::content .gfl-item[unread=false] {
	        -moz-padding-start: 18px;
	      }

	      ::content .gfl-item[unread=true]:before,
	      ::content .gfl-item[unread=false]:before {
	        content: '';
	        position: absolute;
	        offset-inline-start: 0;
	        top: 50%;

	        display: block;
	        width: 8px;
	        height: 8px;
	        margin-top: -4px;
	        border-radius: 50%;
	        background-color:
	          var(--fxos-fastlist-unread-color,
	          var(--fxos-brand-color,
	          currentColor));
	      }

	      ::content .gfl-item[unread=false]:before {
	        visibility: hidden;
	      }

	      ::content .image {
	        position: absolute;
	        top: 8px;
	        offset-inline-end: 7px;

	        width: 44px;
	        height: 44px;
	      }

	      ::content .image.round,
	      ::content .image.round > img {
	        width: 42px;
	        height: 42px;
	        border-radius: 50%;
	      }

	      ::content .gfl-item .image.round {
	        top: 8.5px;
	        offset-inline-end: 0;
	        background:
	          var(--fxos-fastlist-border-color,
	          var(--fxos-border-color));
	      }

	      ::content .gfl-item img {
	        position: absolute;
	        left: 0;
	        top: 0;

	        width: 44px;
	        height: 44px;

	        opacity: 0;
	      }

	      ::content .cached .gfl-item img {
	        display: none;
	      }

	      ::content h3,
	      ::content p {
	        overflow: hidden;
	        white-space: nowrap;
	        text-overflow: ellipsis;
	      }

	      ::content :-moz-dir(ltr) .image ~ h3,
	      ::content :-moz-dir(ltr) .image ~ p {
	        padding-right: 52px;
	      }

	      ::content :-moz-dir(rtl) .image ~ h3,
	      ::content :-moz-dir(rtl) .image ~ p {
	        padding-left: 52px;
	      }

	      ::content :-moz-dir(ltr) .image.round ~ h3,
	      ::content :-moz-dir(ltr) .image.round ~ p {
	        padding-right: 42px;
	      }

	      ::content :-moz-dir(rtl) .image.round ~ h3,
	      ::content :-moz-dir(rtl) .image.round ~ p {
	        padding-left: 42px;
	      }

	      ::content h3 {
	        margin: 0;

	        font-size: 20px;
	        font-weight: 400;
	        font-style: normal;
	        color:
	          var(--fxos-title-color,
	          var(--fxos-color));
	      }

	      ::content p {
	        margin: 0;
	        font-size: 15px;
	        line-height: 1.35em;
	      }

	      ::content a {
	        color: inherit;
	      }

	      .picker {
	        display: none;
	      }

	      [picker] .picker {
	        position: absolute;
	        right: 0;
	        top: 0;

	        box-sizing: border-box;
	        display: flex;
	        flex-direction: column;
	        width: 35px;
	        height: 100%;
	        padding: 2px 0;
	      }

	      ::content [picker-item] {
	        display: flex;
	        justify-content: center;
	        align-items: center;
	        flex: 1;
	        min-height: 0;
	        text-decoration: none;
	        text-align: center;
	        color: inherit;
	      }

	      ::content [picker-item][data-icon] {
	        font-size: 0; /* hide icon text-label */
	      }

	      ::content [picker-item]:before {
	        font-size: 19px;
	        -moz-user-select: none;
	      }

	      .picker a {
	        display: flex;
	        justify-content: center;
	        align-items: center;
	        flex: 1;

	        text-decoration: none;
	        text-align: center;
	        font-size: 13px;
	        color: inherit;

	        text-transform: uppercase;
	        -moz-user-select: none;
	      }

	      .overlay {
	        position: absolute;
	        left: 50%;
	        top: 50%;
	        z-index: 200;

	        display: none;
	        width: 1.8em;
	        height: 1.8em;
	        margin: -1em 0 0 -1em;

	        font-size: 70px;
	        text-align: center;
	        line-height: 1.8;
	        font-weight: 300;
	        border-radius: 50%;

	        opacity: 0;
	        pointer-events: none;
	        transition: opacity 400ms;
	        text-transform: uppercase;
	        background:
	          var(--fxos-fastlist-overlay-background,
	          currentColor);
	      }

	      [picker] .overlay {
	        display: block;
	      }

	      .overlay.visible {
	        opacity: 1;
	        transition: opacity 100ms;
	      }

	      .overlay > .icon,
	      .overlay > .text {
	        color: #fff;
	      }

	      .overlay > .icon {
	        position: absolute;
	        left: 0;
	        top: 0;
	        bottom: 0;
	        right: 0;

	        font-family: "fxos-icons";
	        font-weight: 500;
	        text-transform: none;
	        text-rendering: optimizeLegibility;
	      }
	    </style>`,
	  /*jshint ignore:end*/

	  // test hooks
	  FastList: FastList
	};

	/**
	 * Private internals.
	 * @param {FXOSFastlist} el
	 */
	function Internal(el) {
	  var shadow = el.shadowRoot;

	  this.el = el;
	  this.renderedCache = this.renderCache();

	  this.listCreated = new Deferred();
	  this.rendered = new Deferred();

	  this.images = {
	    list: [],
	    hash: {},
	    bytes: 0
	  };

	  this.els = {
	    list: shadow.querySelector('ul'),
	    picker: shadow.querySelector('.picker'),
	    overlay: shadow.querySelector('.overlay'),
	    overlayIcon: shadow.querySelector('.overlay > .icon'),
	    overlayText: shadow.querySelector('.overlay > .text'),
	    container: shadow.querySelector('.fastlist'),
	    listContent: shadow.querySelector('.fastlist content'),
	    pickerItems: []
	  };

	  // define property names for FastList
	  this.container = this.els.container;
	  this.list = this.els.list;
	  this.itemContainer = el;

	  this.configureTemplates();
	  this.setupPicker();

	  // don't memory leak ObjectURLs
	  addEventListener('pagehide', () => this.emptyImageCache());
	  debug('initialized');
	}

	Internal.prototype = {
	  headerHeight: 40,
	  itemHeight: 60,

	  /**
	   * Setting the model for the first
	   * time creates a new FastList. Setting
	   * it subsequent times rerenders
	   * the FastList with the new data.
	   *
	   * @param {Array} model
	   * @private
	   */
	  setModel(model) {
	    debug('set model');
	    if (!model) return Promise.reject(new Error('model undefined'));

	    this.sections = this.sectionize(model);
	    this.model = model;

	    return !this.fastList
	      ? this.createList()
	      : this.reloadData();
	  },

	  /**
	   * Creates the FastList.
	   *
	   * We add the fast-gradient last as it's
	   * expensive to paint (50-80ms) and only
	   * required for scrolling, not first paint.
	   *
	   * @return {Promise}
	   * @private
	   */
	  createList() {
	    return this.renderedCache
	      .then(() => {
	        debug('create list');
	        this.fastList = new this.el.FastList(this);
	        return this.fastList.rendered;
	      })

	      .then(() => {
	        this.rendered.resolve();
	        this.els.list.style.transform = '';
	        this.removeCachedRender();
	        return this.fastList.complete;
	      })

	      .then(() => {
	        this.updateFastGradient();
	        this.listCreated.resolve();
	      });
	  },

	  /**
	   * Reloading the list will completely
	   * re-render the list.
	   *
	   * We must empty the image cache as data
	   * may have changed or item indexed
	   * may not longer map to new model.
	   *
	   * We must update the fast-gradient
	   * as scrollHeight determines whether
	   * fast-gradient needs to be painted.
	   *
	   * @private
	   */
	  reloadData() {
	    return this.listCreated.promise
	      .then(() => {
	        debug('reload data');
	        this.emptyImageCache();
	        return this.fastList.reloadData();
	      })

	      .then(() => this.updateFastGradient());
	  },

	  /**
	   * Sorts items into sections using
	   * the user provided getSectionName()
	   *
	   * @param  {Array} items
	   * @return {Object}
	   */
	  sectionize(items) {
	    debug('sectionize');
	    var sectioned = !!this.getSectionName;
	    var count = 0;
	    var result = {};

	    for (var i = 0, l = items.length; i < l; i++) {
	      var item = items[i];
	      var section = sectioned && this.getSectionName(item);

	      // When a section is not defined, flag
	      // first list items and skip logic
	      if (!section) {
	        if (i === 0) item[keys.first] = true;
	        else if (item[keys.first]) delete item[keys.first];
	        continue;
	      }

	      // When there is no section yet
	      // we can assume that this item
	      // is the first item in the section.
	      if (!result[section]) {
	        result[section] = [];
	        item[keys.first] = true;

	      // Make sure that any previously
	      // assigned flags are removed as
	      // order of items can be changed.
	      } else if (item[keys.first]) {
	        delete item[keys.first];
	      }

	      result[section].push(item);
	      count++;
	    }

	    this.hasSections = !!count;
	    return this.hasSections && result;
	  },

	  /**
	   * Mixin properties/methods into the
	   * 'data-source' object passed to FastList.
	   *
	   * @param  {Object} props
	   */
	  configure(props) {
	    Object.assign(this, props);
	  },

	  /**
	   * Defines the templates to be used
	   * for the sections and items.
	   *
	   * Users can provide templates by
	   * placing <template> in the root
	   * of their <fxos-fastlist>
	   *
	   * @private
	   */
	  configureTemplates() {
	    var templateHeader = this.el.querySelector('template[header]');
	    var templateItem = this.el.querySelector('template[item]');
	    var noTemplates = !templateItem && !templateHeader;

	    // If no exact templates found, use unlabeled <template> for item
	    if (noTemplates) templateItem = this.el.querySelector('template');

	    if (templateHeader) {
	      this.templateHeader = templateHeader.innerHTML;
	      templateHeader.remove();
	    }

	    if (templateItem) {
	      this.templateItem = templateItem.innerHTML;
	      templateItem.remove();
	    }
	  },

	  /**
	   * Called by FastList when it needs
	   * to create a list-item element.
	   *
	   * @return {HTMLElement}
	   */
	  createItem() {
	    debug('create item');
	    this.parsedItem = this.parsedItem || popel.parse(this.templateItem);
	    var el = popel.create(this.parsedItem.cloneNode(true));
	    el[keys.img] = el.querySelector('img');
	    el.classList.add('gfl-item');
	    return el;
	  },

	  /**
	   * Called by FastList when it needs
	   * to create a section element.
	   *
	   * @return {HTMLElement}
	   */
	  createSection(name) {
	    this.parsedSection = this.parsedSection
	      || popel.parse(this.templateHeader);

	    var header = popel.create(this.parsedSection.cloneNode(true));
	    var section = document.createElement('div');

	    header.classList.add('gfl-header');
	    section.appendChild(header);
	    section.classList.add('gfl-section');
	    section.id = `gfl-section-${name}`;

	    return section;
	  },

	  /**
	   * Populates a list-item with data.
	   *
	   * If items were inflated from the HTML cache
	   * they won't yet be popel elements; in
	   * which case we have to replace them
	   * before we can populate them with data.
	   *
	   * @param  {HTMLElement} el
	   * @param  {Number} i
	   */
	  populateItem(el, i) {
	    var record = this.getRecordAt(i);
	    popel.populate(el, record);
	    el.classList.toggle('first', !!record[keys.first]);
	  },

	  /**
	   * Populates the list-item image if one is
	   * present in the template and the user
	   * has configured `getItemImageSrc()`.
	   *
	   * .populateItemDetail() is run only when the
	   * list is 'idle' (stopped or slow) so that
	   * we don't harm scrolling performance.
	   *
	   * NOTE: It seems sometimes fastlist may
	   * be calling this function more than
	   * once per item. Need to look into this.
	   *
	   * @param  {HTMLElement} el  list-item node
	   * @param  {Number} i  index
	   * @private
	   */
	  populateItemDetail(el, i) {
	    if (!this.getItemImageSrc) return;
	    debug('populate item detail', i);

	    var img = el[keys.img];
	    if (!img) return;

	    var record = this.getRecordAt(i);
	    var cached = this.getCachedImage(i);

	    // if we have the image cached
	    // we can just load it sync
	    if (cached) {
	      load(cached);
	      return;
	    }

	    // if we don't have the image we
	    // run the user's getter function
	    Promise.resolve(this.getItemImageSrc(record, i))
	      .then(result => {
	        if (!result) return;

	        // There is a chance that the item could have
	        // been recycled before the user was able to
	        // fetch the image. Abort here if that's the case.
	        if (el.dataset.index != i) return debug('item recycled');

	        var image = {
	          src: normalizeImageSrc(result),
	          bytes: result.size || result.length
	        };

	        this.cacheImage(image, i);
	        load(image);
	      }).catch(e => { throw e; });

	    /**
	     * Loads
	     * @param  {[type]} image [description]
	     * @return {[type]}       [description]
	     */
	    function load(image) {
	      debug('load image', image);
	      img.src = image.src;
	      img.onload = () => {
	        debug('image loaded', i);
	        img.raf = requestAnimationFrame(() => {
	          img.raf = null;
	          img.style.transition = 'opacity 500ms';
	          img.style.opacity = 1;
	        });
	      };
	    }
	  },

	  /**
	   * Hides the <img> ready for it to be
	   * recycled for the next item.
	   *
	   * @param  {HTMLElement} el  list-item
	   * @param  {Number} i  index
	   * @private
	   */
	  unpopulateItemDetail(el, i) {
	    if (!this.getItemImageSrc) return;
	    debug('unpopulate item detail');

	    var img = el[keys.img];
	    if (!img) return;

	    // Hide image instantly
	    img.style.transition = 'none';
	    img.style.opacity = 0;

	    debug('raf', img.raf);

	    // Clear any pending callbacks
	    if (img.raf) cancelAnimationFrame(img.raf);
	    img.onload = img.raf = null;
	  },

	  /**
	   * Cache an image in memory so that
	   * is can be quickly retrieved next
	   * time the list-item needs to be
	   * rendered.
	   *
	   * If the user has set the length/size
	   * of the cache to falsy then we don't
	   * do any caching.
	   *
	   * TODO: Some list items may share the
	   * same image src. If we have a matching
	   * src in already in the cache we could
	   * reuse that object to save memory.
	   *
	   * Although this gets tricky when we want
	   * to revokeObjectURL() and don't know how
	   * many list-items depend on it.
	   *
	   * @param  {Number} index
	   * @param  {Blob|String} raw
	   * @return {Object}
	   * @private
	   */
	  cacheImage(image, index) {
	    if (!this.el.imageCacheLength) return;
	    if (!this.el.imageCacheSize) return;
	    if (this.images.hash[index]) return;
	    this.images.hash[index] = image;
	    this.images.list.push(index);
	    this.images.bytes += image.bytes;
	    this.checkImageCacheLimit();
	    debug('image cached', image, this.images.bytes);
	    return image;
	  },

	  /**
	   * Attempt to fetch an image
	   * for the given item index.
	   *
	   * @param  {Number} index
	   * @return {Object|*}
	   * @private
	   */
	  getCachedImage(index) {
	    debug('get cached image', index);
	    return this.images.hash[index];
	  },

	  /**
	   * Check there is space remaining in
	   * the image cache discarding entries
	   * when we're full.
	   *
	   * The cache is full when either the
	   * size (bytes) or the length is breached.
	   * We use length as well as bytes as we
	   * don't want to store 1000s of strings
	   * in memory.
	   *
	   * When a limit is breached, we discard
	   * half of the cached images not currently
	   * in use, then we checkImageCacheLimit()
	   * once more.
	   *
	   * We aim to keep a relatively full cache
	   * to keep things fast, but don't want to
	   * be discarding every time a new image
	   * is loaded.
	   *
	   * @private
	   */
	  checkImageCacheLimit() {
	    var cachedImages = this.images.list.length;
	    var exceeded = this.images.bytes > this.el.imageCacheSize
	      || cachedImages > this.el.imageCacheLength;

	    if (!exceeded) return;

	    debug('image cache limit exceeded', exceeded);
	    var itemCount = this.fastList.geometry.maxItemCount;
	    var toDiscard = (cachedImages - itemCount) / 2;

	    // prevent infinite loop when
	    // imageCacheLength < maxItemCount
	    if (toDiscard <= 0) return;
	    debug('discarding: ', toDiscard);

	    while (toDiscard-- > 0) {
	      this.discardOldestImage();
	      debug('bytes used', this.images.bytes);
	    }

	    // double-check we've freed enough memory
	    this.checkImageCacheLimit();
	  },

	  /**
	   * Discard the oldest image in
	   * the image cache.
	   *
	   * When an image has `bytes` we assume
	   * it was a Blob and revokeObjectURL()
	   * to make sure we don't memory leak.
	   *
	   * @return {Boolean} success/falure
	   * @private
	   */
	  discardOldestImage() {
	    debug('discard oldest image');
	    if (!this.images.list.length) return false;
	    var index = this.images.list.shift();
	    var image = this.images.hash[index];

	    if (image.bytes) {
	      URL.revokeObjectURL(image.src);
	      this.images.bytes -= image.bytes;
	      debug('revoked url', image.src);
	    }

	    delete this.images.hash[index];
	    return true;
	  },

	  /**
	   * Completely empty the image cache.
	   *
	   * @private
	   */
	  emptyImageCache() {
	    while (this.images.list.length) this.discardOldestImage();
	  },

	  /**
	   * Called by FastList when it needs
	   * to populate a section with content.
	   *
	   * @param  {HTMLElement} el
	   * @param  {String} section
	   */
	  populateSection(el, section) {
	    var title = el.firstChild;
	    popel.populate(title, { section: section });
	  },

	  /**
	   * Called by FastList when it needs to
	   * know the height of the list viewport.
	   *
	   * If the user has provided `top` and `bottom`
	   * attributes we can calculate this value
	   * for free, else we must force a reflow
	   * by using `clientHeight`.
	   *
	   * NOTE: We use the innerHeight of the `parent`
	   * window to prevent forcing a reflow when
	   * fxos-fastlist is inside an iframe. This
	   * means that offsets must be relative to
	   * viewport *not* the closest window.
	   *
	   * @return {Number}
	   */
	  getViewportHeight() {
	    debug('get viewport height');
	    var bottom = this.el.bottom;
	    var top = this.el.top;

	    if (top != null && bottom != null) {
	      return parent.innerHeight - top - bottom;
	    }

	    return parseInt(this.el.style.height)
	      || this.el.clientHeight;
	  },

	  getSections() {
	    return Object.keys(this.sections || {});
	  },

	  getSectionHeaderHeight() {
	    return this.hasSections ? this.headerHeight : 0;
	  },

	  getFullSectionHeight(key) {
	    return this.sections[key].length * this.getItemHeight();
	  },

	  getFullSectionLength(key) {
	    return this.sections[key].length;
	  },

	  getRecordAt(index) {
	    return this.model[index];
	  },

	  // overwrite to create sections
	  // IDEA: We could accept an Object
	  // as a model and use the keys as
	  // section names. This would probably
	  // require the user do some additional
	  // formatting before setting the model.
	  getSectionName: undefined,

	  getSectionFor(index) {
	    var item = this.getRecordAt(index);
	    return this.getSectionName && this.getSectionName(item);
	  },

	  eachSection(fn) {
	    var sections = this.getSections();
	    var result;

	    if (sections.length) {
	      for (var key in this.sections) {
	        result = fn(key, this.sections[key]);
	        if (result !== undefined) { return result; }
	      }
	    } else {
	      return fn(null, this.model);
	    }
	  },

	  getIndexAtPosition(pos) {
	    // debug('get index at position', pos);
	    var sections = this.sections || [this.model];
	    var headerHeight = this.getSectionHeaderHeight();
	    var itemHeight = this.getItemHeight();
	    var fullLength = this.getFullLength();
	    var lastIndex = fullLength - 1;
	    var index = 0;

	    // sometimes the list is empty
	    if (!fullLength) return index;

	    for (var name in sections) {
	      var items = sections[name];
	      var sectionHeight = items.length * itemHeight;

	      pos -= headerHeight;

	      // If not in this section, jump to next
	      if (pos > sectionHeight) {
	        pos -= sectionHeight;
	        index += items.length;
	        continue;
	      }

	      // Each item in section
	      for (var i = 0; i < items.length; i++) {
	        pos -= itemHeight;
	        if (pos <= 0 || index === fullLength - 1) break; // found it!
	        else index++; // continue
	      }
	    }

	    // Can't be more than the last index
	    index = Math.min(index, lastIndex);
	    // debug('got index', index);

	    return index;
	  },

	  getPositionForIndex(index) {
	    // debug('get position for index', index);
	    var sections = this.sections || [this.model];
	    var headerHeight = this.getSectionHeaderHeight();
	    var itemHeight = this.itemHeight;
	    var top = this.el.offset;
	    var length;

	    for (var name in sections) {
	      length = sections[name].length;
	      top += headerHeight;

	      if (index < length) {
	        top += index * itemHeight;
	        break;
	      }

	      index -= length;
	      top += length * itemHeight;
	    }

	    // debug('got position', top);
	    return top;
	  },

	  /**
	   * Jump scroll position to the top of a section.
	   *
	   * If a section of the given name is not
	   * found the scroll postion will not
	   * be changed.
	   *
	   * @param  {String} name
	   * @private
	   */
	  jumpToId(id) {
	    debug('jump to id', id);
	    if (!id) return;

	    var children = this.els.listContent.getDistributedNodes();
	    var found = false;
	    var offset = 0;

	    for (var i = 0, l = children.length; i < l; i++) {
	      var child = children[i];

	      // Skip text-nodes
	      if (!child.tagName) continue;

	      if (child.id === id) {
	        debug('found section', child);
	        found = true;
	        break;
	      }

	      // skip <style> and gfl-items
	      if (child.tagName == 'STYLE') continue;
	      if (child.classList.contains('.gfl-item')) continue;

	      var height = child.style.height || child.offsetHeight;
	      offset += parseInt(height);
	    }

	    if (found) this.el.scrollTop = offset;
	  },

	  getFullLength() { return this.model.length; },
	  getItemHeight() { return this.itemHeight; },

	  getFullHeight() {
	    debug('get full height', this.cachedHeight);
	    var height = this.cachedHeight;
	    if (height != null) return height;

	    var headers = this.getSections().length * this.getSectionHeaderHeight();
	    var items = this.getFullLength() * this.getItemHeight();
	    return headers + items + this.el.offset;
	  },

	  insertAtIndex(index, record, toSection) {
	    this._cachedLength = null;
	    return this.eachSection(function(key, items) {
	      if (index < items.length || key === toSection) {
	        return items.splice(index, 0, record);
	      }

	      index -= items.length;
	    });
	  },

	  replaceAtIndex(index, record) {
	    return this.eachSection(function(key, items) {
	      if (index < items.length) return items.splice(index, 1, record);
	      index -= items.length;
	    });
	  },

	  removeAtIndex(index) {
	    this._cachedLength = null;
	    return this.eachSection(function(key, items) {
	      if (index < items.length) return items.splice(index, 1)[0];
	      index -= items.length;
	    });
	  },

	  /**
	   * Set the scroll position of the list.
	   *
	   * It is common for users to want to set
	   * an initial scrollTop before the real
	   * list has actually rendered.
	   *
	   * To support this we transform the list element
	   * and unset the transform once rendered.
	   * This is to avoid reflowing an expensive
	   * component.
	   *
	   * @param {Number} value
	   */
	  setScrollTop(value) {
	    debug('set scroll top', value);
	    if (this.fastList) {
	      this.fastList.scrollInstantly(value);
	    } else {
	      this.els.list.style.transform = `translateY(${-value}px)`;
	      this.initialScrollTop = value;
	    }
	  },

	  /**
	   * Scroll smoothly to a position.
	   *
	   * In certain circumstances .scrollTo()
	   * is ignored by Gecko. Wrapping it in
	   * setTimeout() seems to fix this :/
	   *
	   * @param  {Number} y
	   */
	  scrollTo(y) {
	    return this.listCreated.promise
	      .then(() => {
	        setTimeout(() => {
	          debug('scroll to', y);
	          this.els.container.scrollTo({
	            left: 0,
	            top: y,
	            behavior: 'smooth'
	          });
	        });
	      });
	  },

	  /**
	   * Get the list's current scroll position.
	   *
	   * Before FastList is created we
	   * return the initialScrollTop
	   * as the real scrollTop will
	   * return `0` before the list
	   * has a height.
	   *
	   * @return {Number}
	   */
	  getScrollTop() {
	    debug('get scroll top');
	    return this.fastList
	      ? this.fastList.scrollTop
	      : this.initialScrollTop;
	  },

	  /**
	   * Programatically draws a gradient on
	   * the background of the list element
	   * so that when rendering can't keep
	   * up, users will see a scrolling
	   * gradient as a fallback.
	   *
	   * This is done programatically so that
	   * we can size and position the gradient
	   * in-line with item-height, header-height
	   * and offset.
	   *
	   * Fast-gradients are not required when the
	   * list is not scrollable.
	   *
	   * @private
	   */
	  updateFastGradient() {
	    var viewportHeight = this.getViewportHeight();
	    var fullHeight = this.getFullHeight();
	    var style = this.els.list.style;

	    // Fast gradient not required if not scrollable
	    if (fullHeight <= viewportHeight) {
	      style.backgroundImage = '';
	      return;
	    }

	    var headerHeight = this.getSectionHeaderHeight();
	    var itemHeight = this.getItemHeight();
	    var offset = this.el.offset;

	    style.backgroundImage =
	      `linear-gradient(
	        to bottom,
	        var(--fxos-background),
	        var(--fxos-background) 100%),
	      linear-gradient(
	        to bottom,
	        transparent,
	        transparent 20%,
	        var(--fxos-border-color) 48%,
	        var(--fxos-border-color) 52%,
	        transparent 80%,
	        transparent 100%)`;

	    style.backgroundRepeat = 'no-repeat, repeat-y';
	    style.backgroundPosition = `0 0, center ${headerHeight}px`;
	    style.backgroundSize = `100% ${offset}px, 98% ${itemHeight}px`;
	  },

	  /**
	   * The key used to store the
	   * cached HTML and height under.
	   *
	   * When used with the `Cache` API
	   * this end up being appended to
	   * the current URL meaning we get
	   * a unique cache key per page.
	   *
	   * 'example.com/page-a/gflCacheKey'
	   * 'example.com/page-b/gflCacheKey'
	   * 'example.com/page-c/gflCacheKey'
	   *
	   * @type {String}
	   */
	  cacheKey: 'gflCacheKey',

	  /**
	   * Get content from cache.
	   *
	   * @param  {String} key
	   * @return {Array}
	   * @private
	   */
	  getCache() {
	    return cachesOpen.then(cache => {
	      debug('get cache', this.cacheKey);
	      return cache.match(new Request(this.cacheKey))
	        .then(res => res && res.json());
	    });
	  },

	  /**
	   * Store some data in the cache.
	   *
	   * @param {Array} valuex
	   * @private
	   */
	  setCache(data) {
	    return cachesOpen.then(cache => {
	      debug('set cache', data);
	      var req = new Request(this.cacheKey);
	      var res = new Response(JSON.stringify(data));
	      return cache.put(req, res);
	    });
	  },

	  /**
	   * Clear the cache.
	   *
	   * @private
	   */
	  clearCache() {
	    return cachesOpen.then(cache => {
	      debug('clear cache');
	      return cache.delete(this.cacheKey);
	    });
	  },

	  /**
	   * Creates a cache that contains HTML
	   * for enough items to fill the viewport
	   * and an integar representing the full
	   * height.
	   *
	   * The cache always contains content
	   * required to render scrollTop: 0.
	   *
	   * We have to dynamically create the items
	   * to cache as the user may have scrolled
	   * the list before .cache() is called,
	   * meaning the items in the DOM may
	   * not longer be for scrolTop: 0.
	   *
	   * @private
	   */
	  updateCache() {
	    if (!this.el.caching) return Promise.resolve();
	    debug('update cache');

	    var fullHeight = this.getFullHeight();
	    var maxViewportHeight = Math.max(window.innerWidth, window.innerHeight);
	    var length = Math.ceil(maxViewportHeight / this.getItemHeight());
	    var fullLength = this.getFullLength();
	    var html = '';

	    // Don't attempt to cache more items than we have.
	    if (length > fullLength) length = fullLength;

	    for (var i = 0; i < length; i++) {
	      var el = this.createItem();
	      el.dataset.position = this.getPositionForIndex(i);
	      this.populateItem(el, i);
	      html += el.outerHTML;
	    }

	    var sections = this.el.querySelectorAll('.gfl-section');
	    var height = 0;

	    for (var j = 0, l = sections.length; j < l; j++) {
	      html += sections[j].outerHTML;
	      height += ~~sections[j].style.height;
	      if (height >= maxViewportHeight) break;
	    }

	    debug('cached html', html);

	    return this.setCache({
	      height: fullHeight,
	      html: html
	    });
	  },

	  /**
	   * Render the cache into the DOM.
	   *
	   * From the users perspective this will
	   * appear as though the list has rendered,
	   * when in-fact it is more like a snapshot
	   * of the list state last time they used it.
	   *
	   * As soon as the app sets `list.model` the
	   * cached render will be destroyed and
	   * the real list will take it's place.
	   * Most of the time this transition
	   * will be seamless.
	   *
	   * @return {Promise}
	   */
	  renderCache() {
	    if (!this.el.caching) return Promise.resolve();
	    debug('render cache');

	    return this.getCache()
	      .then(result => {
	        debug('got cache');
	        if (!result) return;

	        var height = result.height;
	        var html = result.html;

	        this.els.cached = document.createElement('div');
	        this.els.cached.className = 'cached';
	        this.els.cached.innerHTML = html;

	        var items = this.els.cached.querySelectorAll('.gfl-item');
	        [].forEach.call(items, (el, i) => {
	          el.style.transform = `translateY(${el.dataset.position}px)`;
	        });

	        // Insert the cached render as an 'overlay'
	        this.el.appendChild(this.els.cached);

	        // This gets accessed inside .getFullHeight()
	        // so that FastList renders the *full*
	        // cached height on the first render.
	        this.cachedHeight = height;

	        // Dispatch a 'rendered' event
	        // so the user knows the list
	        // is ready to be revealed.
	        this.rendered.resolve();
	      });
	  },

	  /**
	   * Removes the cached render overlay
	   * to reveal the fully functional
	   * list below.
	   *
	   * @private
	   */
	  removeCachedRender() {
	    if (!this.els.cached) return;
	    this.els.cached.remove();
	    delete this.els.cached;
	  },

	  /**
	   * Picker
	   */

	  setupPicker() {
	    if (!this.el.picker) return;
	    debug('setup picker');

	    this.picker = new Picker(this.els.picker);
	    this.onPickingStarted = this.onPickingStarted.bind(this);
	    this.onPickingEnded = this.onPickingEnded.bind(this);
	    this.onPicked = this.onPicked.bind(this);

	    this.picker.addEventListener('started', this.onPickingStarted);
	    this.picker.addEventListener('ended', this.onPickingEnded);
	    this.picker.addEventListener('picked', this.onPicked);
	  },

	  teardownPicker() {
	    if (!this.picker) return;
	    debug('teardown picker');

	    this.picker.removeEventListener('picked', this.onPicked);
	    this.picker.destroy();

	    delete this.onPicked;
	    delete this.onPickingEnded;
	    delete this.onPickingStarted;
	    delete this.picker;
	  },

	  onPicked() {
	    debug('on picked');
	    var link = this.picker.selected;
	    this.setOverlayContent(link.dataset.icon, link.textContent);
	  },

	  onPickingStarted() {
	    debug('on picking started');
	    this.els.overlay.classList.add('visible');
	  },

	  onPickingEnded() {
	    debug('on picking ended');
	    var link = this.picker.selected;
	    var id = link.hash.substr(1);

	    this.jumpToId(id);
	    this.els.overlay.classList.remove('visible');
	  },

	  /**
	   * Set the picker overlay content
	   * prefering icons over text.
	   *
	   * The manipulation is done is such
	   * a way that prevents reflow.
	   *
	   * @param {String} icon
	   * @param {String} text
	   */
	  setOverlayContent(icon, text) {
	    var letterNode = this.els.overlayText;
	    var iconNode = this.els.overlayIcon;

	    if (icon) {
	      iconNode.firstChild.data = icon;
	      letterNode.style.visibility = 'hidden';
	      iconNode.style.visibility = 'visible';
	    } else {
	      letterNode.firstChild.data = text;
	      iconNode.style.visibility = 'hidden';
	      letterNode.style.visibility = 'visible';
	    }
	  },

	  /**
	   * Permanently destroy the list.
	   *
	   * @private
	   */
	  destroy() {
	    debug('detached');
	    this.teardownPicker();
	    if (this.fastList) {
	      this.fastList.destroy();
	      delete this.fastList;
	    }
	  },

	  // Default header template overridden by
	  // <template header> inside <fxos-fastlist>
	  templateHeader: '<fxos-sub-header>${section}</fxos-sub-header>',

	  // Default item template overridden by
	  // <template item> inside <fxos-fastlist>
	  templateItem: '<a href="${link}"><div class="text"><h3>${title}</h3>' +
	    '<p>${body}</p></div><div class="image"><img src="${image}"/></div></a>'
	};

	/**
	 * Initialize a new Alphabetical
	 * Picker Column.
	 *
	 * @param {HTMLElement} el  picker element
	 */
	function Picker(el) {
	  this.el = el;
	  this.els = {
	    content: this.el.querySelector('content'),
	    items: []
	  };

	  // bind so we can removeEventListener
	  this.onTouchStart = this.onTouchStart.bind(this);
	  this.onTouchMove = this.onTouchMove.bind(this);
	  this.onTouchEnd = this.onTouchEnd.bind(this);
	  this.onClick = this.onClick.bind(this);

	  this.el.addEventListener(touchstart, this.onTouchStart);
	  this.el.addEventListener('click', this.onClick, true);

	  this.render();
	  debug('created picker');
	}

	Picker.prototype = {
	  render() {
	    var letters = 'abcdefghijklmnopqrstuvwxyz#';
	    var length = letters.length;

	    for (var i = 0; i < length; i++) {
	      var letter = letters[i];
	      var el = document.createElement('a');
	      el.textContent = letters[i];
	      el.href = `#gfl-section-${letter}`;
	      this.el.appendChild(el);
	      this.els.items.push(el);
	    }
	  },

	  addEventListener(name, fn) { this.el.addEventListener(name, fn); },
	  removeEventListener(name, fn) { this.el.removeEventListener(name, fn); },

	  onTouchStart(e) {
	    debug('touch start');
	    e.stopPropagation();
	    e.preventDefault();
	    this.height = this.el.clientHeight;
	    this.els.allItems = this.getAllItems();
	    this.itemHeight = this.height / this.els.allItems.length;
	    this.offset = this.els.allItems[0].getBoundingClientRect().top;

	    scheduler.attachDirect(window, touchmove, this.onTouchMove);
	    addEventListener(touchcancel, this.onTouchEnd);
	    addEventListener(touchend, this.onTouchEnd);

	    this.update(e);
	    this.emit('started');
	  },

	  onTouchMove(e) {
	    debug('touch move');
	    e.stopPropagation();
	    e.preventDefault();
	    var fast = (e.timeStamp - this.lastUpdate) < 50;
	    if (!fast) this.update(e);
	  },

	  onTouchEnd(e) {
	    debug('touch end');
	    e.stopPropagation();
	    e.preventDefault();

	    scheduler.detachDirect(window, touchmove, this.onTouchMove);
	    removeEventListener(touchend, this.onTouchEnd);
	    removeEventListener(touchend, this.onTouchEnd);

	    this.update(e);
	    this.emit('ended');
	  },

	  onClick(e) {
	    e.preventDefault();
	    e.stopPropagation();
	  },

	  update(e) {
	    debug('update', this.offset);
	    var allItems = this.els.allItems;
	    var pageY = e.changedTouches ? e.changedTouches[0].pageY : e.pageY;
	    var y = pageY - this.offset;
	    var index = Math.floor(y / this.itemHeight);

	    // clamp within index range
	    index = Math.max(0, Math.min(allItems.length - 1, index));

	    // abort if new index is same as current
	    if (index === this.selectedIndex) return;

	    this.selectedIndex = index;
	    this.selected = allItems[index];
	    this.lastUpdate = e.timeStamp;
	    this.emit('picked');
	  },

	  getAllItems() {
	    var light = [].slice.call(this.els.content.getDistributedNodes());
	    var shadow = this.els.items;
	    return light.concat(shadow);
	  },

	  emit(name) {
	    this.el.dispatchEvent(new CustomEvent(name, { bubbles: false }));
	  },

	  destroy() {
	    this.els.items.forEach(el => el.remove());
	    this.el.removeEventListener(touchstart, this.onTouchStart);
	    this.el.removeEventListener('click', this.onClick, true);
	  }
	};

	/**
	 * Exports
	 */

	module.exports = component.register('fxos-fastlist', FXOSFastlistProto);

	/**
	 * Utils
	 */

	/**
	* Normalizes supported image return
	* value to a String.
	*
	* When Blobs are returned we createObjectURL,
	* when the cache is discarded we revokeObjectURL
	* later.
	*
	* @param  {Blob|String} src
	* @return {Object}  {src, bytes}
	*/
	function normalizeImageSrc(src) {
	  if (typeof src == 'string') return src;
	  else if (src instanceof Blob) return URL.createObjectURL(src);
	  else throw new Error('invalid image src');
	}

	function Deferred() {
	  this.promise = new Promise((resolve, reject) => {
	    this.resolve = resolve;
	    this.reject = reject;
	  });
	}


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;!(function() {

	/**
	 * Mini logger
	 *
	 * @type {Function}
	 */
	var debug = 0 ? console.log.bind(console, '[FastList]') : function() {};

	/**
	 * Use the dom-scheduler if it's around,
	 * else fallback to fake shim.
	 *
	 * @type {Object}
	 */
	var schedule = window.scheduler || schedulerShim();
	FastList.scheduler = schedule;

	function FastList(source) {
	  debug('initialize');
	  this._scrollStopTimeout = null;
	  this.source = source;

	  this.els = {
	    itemContainer: source.itemContainer,
	    container: source.container,
	    list: source.list,
	    sections: [],
	    items: [],
	    itemsInDOM: []
	  };

	  this.geometry = {
	    topPosition: 0,
	    forward: true,
	    busy: false,
	    idle: true,
	    hasScrolled: false,
	    itemHeight: source.getItemHeight(),
	    viewportHeight: 0,
	    maxItemCount: 0,
	    switchWindow: 0
	  };

	  // TODO: Move this to fast-list-edit.js
	  this.reorderingContext = {
	    item: null,
	    initialY: null,
	    identifier: null,
	    moveUp: null,
	    moveDown: null,
	  };

	  // TODO: Move this out of core
	  on(this.els.container, 'click', this);

	  // Update geometry on resize
	  on(window, 'resize', this);

	  // Create a list element if one wasn't provided
	  if (!this.els.list) this.els.list = document.createElement('ul');
	  if (!this.els.itemContainer) this.els.itemContainer = this.els.list;

	  // Phase1 renders just enough content
	  // for the viewport (without detail).
	  this.rendered = schedule
	    .mutation(this.setupPhase1.bind(this));

	  // Phase2 renders more list-items and detail
	  this.complete = this.rendered
	    .then(this.setupPhase2.bind(this));
	}

	FastList.prototype = {
	  PRERENDER_MULTIPLIER: 3.5,

	  /**
	   * The first render of the list aims
	   * to get content on the screen as
	   * fast as possible.
	   *
	   * Only the list-items in the viewport
	   * (critical) are rendered, and the
	   * populateItemDetail() stage is
	   * skipped to prevent expensive
	   * render paths being hit.
	   *
	   * @private
	   */
	  setupPhase1: function() {
	    debug('setup phase 1');
	    var fragment = document.createDocumentFragment();
	    var container = this.els.container;

	    this.updateContainerGeometry();

	    // Make the container scrollable
	    container.style.overflowX = 'hidden';
	    container.style.overflowY = 'scroll';
	    this.updateListHeight();

	    // If the list detached (created internally), attach it
	    if (!this.els.list.parentNode) container.appendChild(this.els.list);

	    // We can't set initial scrollTop
	    // until the list has a height.
	    // WARNING: Setting an initial scrollTop
	    // before render forces an extra reflow!
	    if (this.source.initialScrollTop) {
	      container.scrollTop = this.source.initialScrollTop;
	      this.geometry.topPosition = container.scrollTop;
	    }

	    // Using a fragment container means we only
	    // endure one document mutation on inititalization
	    this.updateSections({ fragment: fragment });

	    // Lightweight render into fragment
	    this.render({
	      fragment: fragment,
	      criticalOnly: true,
	      skipDetail: true
	    });

	    // Inject the content fragment
	    this.els.itemContainer.appendChild(fragment);

	    // Bind scroll listeners after setting the
	    // initialScrollTop to avoid triggering 'scroll'
	    // handler. Setting the handler early means
	    // we can render if the user or Gecko
	    // changes the scrollTop before phase2.
	    this.handleScroll = this.handleScroll.bind(this);
	    schedule.attachDirect(
	      this.els.container,
	      'scroll',
	      this.handleScroll
	    );
	  },

	  /**
	   * The second render phase completes
	   * the initialization of the list.
	   *
	   * All list items will be rendered
	   * and the detail (eg. images) will
	   * be populated.
	   *
	   * .processScrollPosition() is called
	   * before render to update the
	   *
	   * @return {Promise}
	   * @private
	   */
	  setupPhase2: function() {
	    return new Promise(function(resolve) {
	      setTimeout(function() {
	        debug('setup phase 2');
	        var fragment = document.createDocumentFragment();
	        this.render({ fragment: fragment });
	        this.els.itemContainer.appendChild(fragment);
	        resolve();
	      }.bind(this), 360);
	    }.bind(this));
	  },

	  /**
	   * Updates the container geometry
	   * state needed for the rendering.
	   *
	   * 'switchWindow' refers to an allocation
	   * of list items that are rendered 'behind'
	   * the current scroll direction of the
	   * list, so that if/when the user changes
	   * direction, we have something prerendered.
	   *
	   * The remaining items are used to render
	   * content 'ahead' of the current scroll
	   * direction.
	   *
	   * @private
	   */
	  updateContainerGeometry: function() {
	    var geo = this.geometry;
	    var viewportHeight = this.getViewportHeight();
	    var itemPerScreen = viewportHeight / geo.itemHeight;

	    geo.viewportHeight = viewportHeight;
	    geo.maxItemCount = Math.floor(itemPerScreen * this.PRERENDER_MULTIPLIER);
	    geo.switchWindow = Math.floor(itemPerScreen / 2);

	    debug('maxItemCount: ' + geo.maxItemCount);
	  },

	  /**
	   * Returns the height of the list container.
	   *
	   * Attempts to use user provided .getViewportHeight()
	   * from the configuration, falling back to reflow
	   * forcing .offsetHeight :(
	   *
	   * @return {Number}
	   * @private
	   */
	  getViewportHeight: function() {
	    return this.source.getViewportHeight
	      ? this.source.getViewportHeight()
	      : this.els.container.offsetHeight;
	  },

	  /**
	   * Updates the rendering window geometry informations
	   *
	   * - top position
	   * - busyness state
	   * - idling state
	   *
	   * We monitor the distance traveled between 2 handled scroll events to
	   * determine if we can do more expensive rendering (idle) or if we need
	   * to skip rendering altogether (busy).
	   *
	   * @private
	   */
	  processScrollPosition: function(instant) {
	    var position = this.els.container.scrollTop;
	    var geo = this.geometry;

	    // Don't compute lag on first reading
	    if (!geo.hasScrolled) {
	      geo.topPosition = position;
	      geo.hasScrolled = true;
	    }

	    var viewportHeight = geo.viewportHeight;
	    var previousTop = geo.topPosition;
	    var delta = position - previousTop;

	    geo.forward = isForward(geo.forward, delta);
	    geo.topPosition = position;

	    var onTop = geo.topPosition === 0;
	    var topReached = onTop && previousTop !== 0;
	    var fullHeight = this.source.getFullHeight();
	    var maxScrollTop = fullHeight - viewportHeight;
	    var atBottom = geo.topPosition === maxScrollTop;

	    if (topReached) this.emit('top-reached');

	    // Full stop, forcefuly idle
	    if (onTop || atBottom || instant) {
	      geo.busy = false;
	      geo.idle = true;
	      return;
	    }

	    var moved = Math.abs(delta);
	    geo.busy = isBusy(geo.busy, moved, viewportHeight);
	    geo.idle = isIdle(geo.idle, moved, viewportHeight);
	  },

	  /**
	   * Places and populates the item
	   * in the rendering window
	   *
	   * @param {Object} options
	   * @param {Object} options.reload  forces the re-population of all items
	   * @param {Object} options.fragment  optional fragment to insert items
	   * @param {Object} options.changedIndex  flags item as new
	   *   (for animated insertions)
	   */
	  render: function(options) {
	    debug('render');

	    options = options || {};
	    var changedIndex = options.changedIndex;
	    var criticalOnly = options.criticalOnly;
	    var skipDetail = options.skipDetail;
	    var fragment = options.fragment;
	    var reload = options.reload;

	    var itemContainer = fragment || this.els.itemContainer;
	    var itemsInDOM = this.els.itemsInDOM;
	    var items = this.els.items;
	    var source = this.source;
	    var geo = this.geometry;

	    var indices = computeIndices(this.source, this.geometry);
	    var fullLength = source.getFullLength();
	    var criticalStart = indices.cStart;
	    var criticalEnd = indices.cEnd;
	    var startIndex = indices.start;
	    var endIndex = indices.end;
	    var self = this;

	    // Only render the list-items visible
	    // in the viewport (critical).
	    if (criticalOnly) {
	      startIndex = criticalStart;
	      endIndex = criticalEnd;
	    }

	    var recyclableItems = recycle(
	      items,
	      criticalStart,
	      criticalEnd,
	      geo.forward ? endIndex : startIndex
	    );

	    // Only render if there are items
	    if (fullLength) {
	      if (geo.forward) {
	        for (var i = startIndex; i <= endIndex; ++i) renderItem(i);
	      } else {
	        for (var j = endIndex; j >= startIndex; --j) renderItem(j);
	      }
	    }

	    // When the data changes we need to make sure we're not keeping
	    // outdated pre-rendered content lying around
	    if (reload) cleanUpPrerenderedItems(items, source);

	    function findItemFor(index) {
	      // debug('find item for', index, recyclableItems);
	      var item;

	      if (recyclableItems.length > 0) {
	        var recycleIndex = recyclableItems.pop();
	        item = items[recycleIndex];
	        delete items[recycleIndex];
	        debug('found node to recycle', recycleIndex, recyclableItems);
	      } else if (itemsInDOM.length < geo.maxItemCount){
	        item = self.createItem();
	        itemContainer.appendChild(item);
	        itemsInDOM.push(item);
	      } else {
	        console.warn('missing a cell');
	        return;
	      }

	      items[index] = item;
	      return item;
	    }

	    function renderItem(i) {
	      // debug('render item', i);
	      var item = items[i];

	      if (!item) {
	        item = findItemFor(i);
	        self.unpopulateItemDetail(item);
	        tryToPopulate(item, i, source, true);
	        item.classList.toggle('new', i === changedIndex);

	      // Reloading, re-populating all items
	      // We expect the DataSource to be ready
	      // to populate all items so not
	      // going through `tryToPopulate()`
	      } else if (reload) {
	        self.unpopulateItemDetail(item);
	        source.populateItem(item, i);
	        item.dataset.populated = true;
	        if (item.style.display === 'none') {
	          item.style.removeProperty('display');
	        }
	      } // else item is already populated

	      var section = source.getSectionFor(i);
	      placeItem(item, i, section, geo, source, reload);

	      if (skipDetail || !source.populateItemDetail) return;

	      // Populating the item detail when we're not too busy scrolling
	      // Note: we're always settling back to an idle stage at some point where
	      // we do all the pending detail populations
	      if (!geo.idle) return;

	      // Detail already populated, skipping
	      if (item.dataset.detailPopulated === 'true') return;

	      var result = source.populateItemDetail(item, i);
	      if (result !== false) item.dataset.detailPopulated = true;
	    }

	    debugViewport(
	      items,
	      geo.forward,
	      criticalStart,
	      criticalEnd,
	      startIndex,
	      endIndex
	    );
	  },

	  unpopulateItemDetail: function(item) {
	    var shouldUnpopulate = this.source.unpopulateItemDetail
	      && item.dataset.detailPopulated === 'true';

	    // Recycling, need to unpopulate and
	    // populate with the new content
	    if (shouldUnpopulate) {
	      this.source.unpopulateItemDetail(item);
	      item.dataset.detailPopulated = false;
	    }
	  },

	  /**
	   * Creates a list item.
	   *
	   * @return {HTMLElement}
	   */
	  createItem: function() {
	    var el = this.source.createItem();
	    el.style.position = 'absolute';
	    el.style.left = el.style.top = 0;
	    el.style.overflow = 'hidden';
	    return el;
	  },

	  /**
	   * Creates a list section.
	   *
	   * @return {HTMLElement}
	   */
	  createSection: function(name) {
	    var el = this.source.createSection(name);
	    el.classList.add('fl-section');
	    return el;
	  },

	  reloadData: function() {
	    return schedule.mutation(function() {
	      this.updateSections();
	      this.updateListHeight();
	      this.render({ reload: true });
	    }.bind(this));
	  },

	  updateSections: function(options) {
	    debug('update sections');
	    var fragment = (options && options.fragment);
	    var nodes = this.els.itemContainer.querySelectorAll('.fl-section');
	    var items = fragment || document.createDocumentFragment();
	    var source = this.source;

	    // remove any old sections
	    for (var i = 0; i < nodes.length; i++) {
	      var toRemove = nodes[i];
	      toRemove.remove();
	    }

	    var headerHeight = source.getSectionHeaderHeight();
	    var sections = this.source.getSections();

	    // create new sections
	    for (var j = 0; j < sections.length; j++) {
	      var height = source.getFullSectionHeight(sections[j]);
	      var el = this.createSection(sections[j]);

	      el.style.height = headerHeight + height + 'px';
	      this.source.populateSection(el, sections[j], j);
	      items.appendChild(el);
	    }

	    // don't append the items if an outside fragment was given
	    if (!fragment) this.els.itemContainer.appendChild(items);
	  },

	  /**
	   * Scrolling
	   */

	  handleScroll: function(evt) {
	    clearTimeout(this._scrollStopTimeout);

	    this.processScrollPosition();
	    if (this.geometry.busy) debug('[x] ---------- faaaaassssstttt');
	    else this.render();

	    if (this.geometry.idle) return;
	    var self = this;

	    // We just did a partial rendering
	    // and need to make sure it won't
	    // get stuck this way if the
	    // scrolling comes to a hard stop.
	    this._scrollStopTimeout = setTimeout(function() {
	      self.processScrollPosition(true);
	      self.render();
	    }, 200);
	  },

	  updateListHeight: function() {
	    this.els.list.style.height = this.source.getFullHeight() + 'px';
	    debug('updated list height', this.els.list.style.height);
	  },

	  get scrollTop() {
	    return this.geometry.topPosition;
	  },

	  scrollInstantly: function(position) {
	    debug('scroll instantly', position);
	    this.els.container.scrollTop = position;
	    this.processScrollPosition(true);
	    this.render();
	  },

	  /**
	   * External Content Changes
	   */

	  insertedAtIndex: function(index) {
	    debug('inserted at index', index);

	    if (index !== 0) {
	      //TODO: support any point of insertion
	      return;
	    }

	    if (this.geometry.topPosition > this.geometry.itemHeight ||
	        this.editing) {
	      // No transition needed, just keep the scroll position
	      this._insertOnTop(true);
	      return;
	    }

	    var domItems = this.els.itemsInDOM;
	    var list = this.els.itemContainer;

	    list.classList.add('reordering');
	    pushDown(domItems, this.geometry)
	      .then(this._insertOnTop.bind(this, false))
	      .then(cleanInlineStyles.bind(null, domItems))
	      .then(reveal.bind(null, list))
	      .then(function() {
	        list.classList.remove('reordering');
	      });
	  },

	  _insertOnTop: function(keepScrollPosition) {
	    debug('insert on top', keepScrollPosition);
	    return schedule.mutation((function() {
	      this.els.items.unshift(null);
	      delete this.els.items[0]; // keeping it sparse

	      this.updateSections();

	      if (keepScrollPosition) {
	        var scrollTop = this.els.container.scrollTop;
	        this.scrollInstantly(scrollTop + this.geometry.itemHeight);
	        this.els.container.dispatchEvent(new CustomEvent('hidden-new-content'));
	      } else {
	        this.render({ changedIndex: 0 });
	      }

	      this.updateListHeight();
	    }).bind(this));
	  },

	  handleEvent: function(evt) {
	    switch (evt.type) {
	      case 'resize':
	        this.updateContainerGeometry();
	        break;

	      // TODO: Move out of core
	      case 'click':
	        if (this.editing) {
	          break;
	        }

	        var li = evt.target;
	        var index = this.els.items.indexOf(li);

	        this.els.itemContainer.dispatchEvent(new CustomEvent('item-selected', {
	          bubbles: true,
	          detail: {
	            index: index,
	            clickEvt: evt,
	          }
	        }));
	        break;
	    }
	  },

	  /**
	   * Attach a plugin to a list.
	   *
	   * @param  {Function} fn
	   * @return {FastList}
	   */
	  plugin: function(fn) {
	    fn(this);
	    return this;
	  },

	  /**
	   * Emit an event.
	   *
	   * @param  {String} name
	   * @private
	   */
	  emit: function(name, detail) {
	    var e = new CustomEvent(name, {
	      bubbles: false,
	      detail: detail
	    });

	    this.els.container.dispatchEvent(e);
	  },

	  /**
	   * Permanently destroy the list.
	   *
	   * @public
	   */
	  destroy: function() {
	    this.els.itemContainer.innerHTML = '';
	    schedule.detachDirect(
	      this.els.container,
	      'scroll',
	      this.handleScroll
	    );
	  }
	};

	/**
	 * Internals
	 */

	/**
	 * ASCII Art viewport debugging
	 *
	 * @param  {[type]} items   [description]
	 * @param  {[type]} forward [description]
	 * @param  {[type]} cStart  [description]
	 * @param  {[type]} cEnd    [description]
	 * @param  {[type]} start   [description]
	 * @param  {[type]} end     [description]
	 * @return {[type]}         [description]
	 */
	function debugViewport(items, forward, cStart, cEnd, start, end) {
	  if (!debug.name) {
	    return;
	  }

	  var str = '[' + (forward ? 'v' : '^') + ']';
	  for (var i = 0; i < items.length; i++) {
	    if (i == start) str += '|';
	    if (i == cStart) str += '[';

	    if (items[i]) str += 'x';
	    else str += '-';

	    if (i == cEnd) str += ']';
	    if (i == end) str += '|';
	  }

	  debug(str);
	}

	/**
	 * Computes the indices of the first and
	 * and last list items to be rendered and
	 * the indices of the first and last
	 * 'critical' items within the viewport.
	 *
	 * @param  {Object} source
	 * @param  {Object} geometry
	 * @return {Object} {start, end, cStart, cEnd}
	 */
	function computeIndices(source, geometry) {
	  debug('compute indices', geometry.topPosition);
	  var criticalStart = source.getIndexAtPosition(geometry.topPosition);
	  var criticalEnd = source.getIndexAtPosition(geometry.topPosition +
	    geometry.viewportHeight);
	  var canPrerender = geometry.maxItemCount -
	    (criticalEnd - criticalStart) - 1;
	  var before = geometry.switchWindow;
	  var after = canPrerender - before;
	  var fullLength = source.getFullLength();
	  var lastIndex = fullLength && fullLength - 1;
	  var startIndex;
	  var endIndex;
	  var extra;

	  if (geometry.forward) {
	    startIndex = criticalStart - before;
	    endIndex = criticalEnd + after;
	  } else {
	    startIndex = criticalStart - after;
	    endIndex = criticalEnd + before;
	  }

	  if (startIndex < 0) {
	    extra = -startIndex;
	    startIndex = 0;
	    endIndex = Math.min(lastIndex, endIndex + extra);
	  }

	  if (endIndex > lastIndex) {
	    extra = endIndex - lastIndex;
	    endIndex = lastIndex;
	    startIndex = Math.max(0, startIndex - extra);
	  }

	  return {
	    cStart: criticalStart,
	    cEnd: criticalEnd,
	    start: startIndex,
	    end: endIndex
	  };
	}

	function recycle(items, start, end, action) {
	  debug('recycle', start, end, action);
	  var recyclableItems = [];

	  for (var i in items) {
	    if ((i < start) || (i > end)) recyclableItems.push(i);
	  }

	  // Put the items that are furthest away from the displayport edge
	  // at the end of the array.
	  recyclableItems.sort(function(a, b) {
	    return Math.abs(a - action) - Math.abs(b - action);
	  });

	  return recyclableItems;
	}

	function cleanUpPrerenderedItems(items, source) {
	  var fullLength = source.getFullLength();
	  for (var i in items) {
	    if (i >= fullLength) {
	      var item = items[i];
	      item.dataset.populated = false;
	      item.style.display = 'none';
	    }
	  }
	}

	function tryToPopulate(item, index, source, first) {
	  // debug('try to populate');

	    // The item was probably reused
	  if (item.dataset.index != index && !first) return;

	  // TODO: should be in a mutation block when !first
	  var populateResult = source.populateItem(item, index);

	  if (populateResult instanceof Promise) {
	    item.dataset.populated = false;
	    populateResult.then(
	      tryToPopulate.bind(
	        null,
	        item,
	        index,
	        source
	      )
	    );

	    return;
	  }

	  if (first) {
	    item.dataset.populated = true;
	    return;
	  }

	  // Promise-delayed population, once resolved

	  // Doing any pending itemDetail population on it
	  if (source.populateItemDetail && item.dataset.detailPopulated !== 'true') {
	    source.populateItemDetail(item, index);
	    item.dataset.detailPopulated = true;
	  }

	  // Revealing the populated item
	  debug('revealing populated item');
	  item.style.transition = 'opacity 0.2s linear';
	  schedule.transition(function() {
	    item.dataset.populated = true;
	  }, item, 'transitionend').then(function() {
	    debug('populated item revealed');
	    item.style.transition = '';
	  });
	}

	function placeItem(item, index, section, geometry, source, reload) {
	  if (item.dataset.index == index && !reload) {
	    // The item was probably reused
	    // debug('abort: item resused');
	    return;
	  }

	  item.dataset.position = source.getPositionForIndex(index);
	  item.dataset.index = index;
	  item.dataset.section = section;

	  var tweakedBy = item.dataset.tweakDelta;
	  if (tweakedBy) tweakTransform(item, tweakedBy);
	  else resetTransform(item);
	}

	function resetTransform(item) {
	  var position = item.dataset.position;
	  var transform = 'translateY(' + position + 'px)';

	  style(item, 'webkitTransform', transform);
	  style(item, 'transform', transform);
	}

	function tweakTransform(item, delta) {
	  debug('tweak transform', item, delta);
	  var position = ~~item.dataset.position + ~~delta;
	  var transform = 'translateY(' + position + 'px)';

	  style(item, 'webkitTransform', transform);
	  style(item, 'transform', transform);

	  item.dataset.tweakDelta = delta;
	}

	/**
	 * Internals
	 */

	function cleanInlineStyles(domItems) {
	  return schedule.mutation(function() {
	    for (var i = 0; i < domItems.length; i++) {
	      var item = domItems[i];
	      item.style.transition = '';
	      item.style.webkitTransition = '';
	      resetTransform(item);
	    }
	    domItems[0] && domItems[0].scrollTop; // flushing
	  });
	}

	function pushDown(domItems, geometry) {
	  if (!domItems.length) return Promise.resolve();

	  return schedule.transition(function() {
	    for (var i = 0; i < domItems.length; i++) {
	      var item = domItems[i];
	      item.style.transition = 'transform 0.15s ease-in';
	      item.style.webkitTransition = '-webkit-transform 0.15s ease-in';
	      tweakTransform(item, geometry.itemHeight);
	    }
	  }, domItems[0], 'transitionend');
	}

	function reveal(list) {
	  var newEl = list.querySelector('li.new');

	  return schedule.transition(function() {
	    newEl.style.transition = 'opacity 0.25s ease-out';
	    newEl.style.webkitTransition = 'opacity 0.25s ease-out';
	    setTimeout(function() {
	      newEl.classList.remove('new');
	    });
	  }, newEl, 'transitionend').then(function() {
	    newEl.style.transition = '';
	    newEl.style.webkitTransition = '';
	  });
	}

	/**
	 * Detects if scrolling appears 'blocked'.
	 *
	 * We're BUSY if:
	 *
	 * The scroll position moved more than
	 * twice the height of the viewport
	 * since the last 'scroll' event.
	 *
	 * We're NO LONGER BUSY if:
	 *
	 * The scroll position moved less than
	 * *half* the viewport since the last
	 * 'scroll' event.
	 *
	 * If neither of these conditions are
	 * met we return the previous value.
	 *
	 * @param  {Boolean}  wasBusy
	 * @param  {Number}  moved  distance since last 'scroll'
	 * @param  {Number}  viewportHeight
	 * @return {Boolean}
	 */
	function isBusy(wasBusy, moved, viewportHeight) {
	  if (!wasBusy && moved > viewportHeight * 2) return true;
	  else if (wasBusy && moved && moved < viewportHeight / 2) return false;
	  else return wasBusy;
	}

	/**
	 * Detects if scrolling appears 'idle';
	 * meaning scrolling is slow or stopped.
	 *
	 * We're IDLE if:
	 *
	 * The scroll position moved less than
	 * 16th of the height of the viewport
	 * since the last 'scroll' event.
	 *
	 * We're NO LONGER IDLE if:
	 *
	 * The scroll position moved more than
	 * a *quarter* of the viewport since
	 * the last 'scroll' event.
	 *
	 * If neither of these conditions are
	 * met we return the previous value.
	 *
	 * @param  {Boolean}  wasIdle
	 * @param  {Number}  moved  distance since last 'scroll'
	 * @param  {Number}  viewportHeight
	 * @return {Boolean}
	 */
	function isIdle(wasIdle, moved, viewportHeight) {
	  if (!wasIdle && moved && moved < viewportHeight / 16) return true;
	  else if (wasIdle && moved && moved > viewportHeight / 4) return false;
	  else return wasIdle;
	}

	/**
	 * Detects if the scroll moved
	 * forward or backwards.
	 *
	 * Sometimes the scoll position doesn't
	 * move at all between renders, in
	 * which case we just return the
	 * last known direction.
	 *
	 * @param  {Boolean}  wasForward
	 * @param  {Number}  delta
	 * @return {Boolean}
	 */
	function isForward(wasForward, delta) {
	  if (!delta) return wasForward;
	  else return delta > 0;
	}

	/**
	 * Utils
	 */

	function schedulerShim() {
	  var raf = window.requestAnimationFrame;

	  return {
	    mutation: function(block) { return Promise.resolve().then(block); },
	    transition: function(block, el, event, timeout) {
	      block();
	      return after(el, event, timeout || 500);
	    },

	    // Not sure if this should be different from .transition()
	    feedback: function(block, el, event, timeout) {
	      block();
	      return after(el, event, timeout || 500);
	    },

	    attachDirect: function(el, event, fn) {
	      fn._raffed = function(e) { raf(function() { fn(e); } ); };
	      on(el, event, fn._raffed);
	    },

	    detachDirect: function(el, event, fn) {
	      off(el, event, fn._raffed);
	    }
	  };

	  function after(target, event, timeout) {
	    return new Promise(function(resolve) {
	      var timer = timeout && setTimeout(cb, timeout);
	      on(target, event, cb);
	      function cb() {
	        off(target, event, cb);
	        clearTimeout(timer);
	        resolve();
	      }
	    });
	  }
	}

	// Shorthand
	function on(el, name, fn) { el.addEventListener(name, fn); }
	function off(el, name, fn) { el.removeEventListener(name, fn); }

	/**
	 * Set a style property on an elements.
	 *
	 * First checks that the style property
	 * doesn't already match the given value
	 * to avoid Gecko doing unnecessary
	 * style-recalc.
	 *
	 * @param  {HTMLElement} el
	 * @param  {String} key
	 * @param  {String} value
	 */
	function style(el, key, value) {
	  if (el.style[key] !== value) el.style[key] = value;
	}

	/**
	 * Exports
	 */

	if (("function")[0] == 'f' && __webpack_require__(3)) !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return FastList; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	else if ((typeof module)[0] == 'o') module.exports = FastList;
	else window.FastList = FastList;

	})();


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {module.exports = __webpack_amd_options__;

	/* WEBPACK VAR INJECTION */}.call(exports, {}))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;;(function(define){'use strict';!(__WEBPACK_AMD_DEFINE_RESULT__ = function(require,exports,module){

	/**
	 * Mini logger
	 * @type {Function}
	 */
	var debug = 0 ? console.log.bind(console, '[popel]') : function() {};

	/**
	 * Stores references to popel elements
	 * @type {WeakMap}
	 */
	var elements = new WeakMap();

	/**
	 * Regexs used to parse HTML
	 * @type {Object}
	 */
	var regex = {
	  content: />([^<]+)</g,
	  var: /\$\{([^\}]+)\}/g,
	  attrs: /(<[a-z\-]+ )(.+?)( ?\/>|>)/g,
	  attr: /([a-z\-]+)="([^\"]+\$\{[^\"]+|\$[^"]+)"/g
	};

	/**
	 * Exports
	 */

	module.exports = popel;

	/**
	 * Create a popel element
	 * from an HTML string.
	 *
	 * @example
	 *
	 * var el = popel('<h1>Hello ${name}</h1>');
	 * popel.populate(el, { name: 'Wilson' });
	 * el.textContent; //=> 'Hello Wilson'
	 *
	 * @param  {String} html
	 * @return {HTMLElement}
	 */
	function popel(html) {
	  return popel.create(popel.parse(html));
	}

	/**
	 * Parse an HTML string and return
	 * a formatted element that can
	 * be passed to .create().
	 *
	 * @param  {String} html
	 * @return {HTMLElement}
	 */
	popel.parse = function(html) {
	  debug('parse', html);

	  var formatted = html
	    .replace(/\s*\n\s*/g, '')
	    .replace(/  +/g, '')

	    // attribute bindings
	    .replace(regex.attrs, function(match, start, content, end) {
	      var dynamic = [];
	      var simple = content.replace(regex.attr, function(match, name, prop) {
	        dynamic.push(name + '=' + encodeURIComponent(prop));
	        return '';
	      });

	      // Return original if no dynamic attrs were found
	      if (!dynamic.length) return match;

	      var dataBindAttrs = dynamic.join(' ');
	      var tag = start +
	        simple + ' data-popel-attrs="' + dataBindAttrs + '"' +
	        end;
	      return tag.replace(/  +/g, ' ');
	    })

	    // textNode bindings
	    .replace(regex.content, function(m, content) {
	      return m.replace(regex.var, function(m, group) {
	        return '<span data-popel-text="' + group + '"></span>';
	      });
	    });

	  return elementify(formatted);
	};

	/**
	 * Turns a formatted element into a final
	 * popel element that can we passed
	 * to .poplate() to fill with data.
	 *
	 * @param  {HTMLElement} parent
	 * @return {HTMLElement}
	 */
	popel.create = function(parent) {
	  debug('create');

	  var el = parent.firstElementChild;

	  elements.set(el, {
	    textNodes: replaceTextPlaceholders(parent),
	    attrs: replaceAttrPlaceholders(parent)
	  });

	  return el;
	};

	/**
	 * Populate the element with data.
	 *
	 * @param  {HTMLElement} el   popel element
	 * @param  {Object} data  Data to fill
	 * @public
	 */
	popel.populate = function(el, data) {
	  debug('poplate', el, data);

	  var bindings = elements.get(el);
	  if (!bindings) {
	    debug('unknown element');
	    return false;
	  }

	  var textNodes = bindings.textNodes;
	  var attrs = bindings.attrs;
	  var i = textNodes.length;
	  var j = attrs.length;

	  // text nodes
	  while (i--) {
	    var node = textNodes[i].node;
	    var newData = getProp(data, textNodes[i].key);
	    if (node.data !== newData) {
	      node.data = newData;
	    }
	  }

	  // attributes
	  while (j--) {
	    var item = attrs[j];

	    // If the variable is part of an
	    // attribute string it must be
	    // templated each time
	    var value = item.template
	      ? interpolate(item.template, data)
	      : getProp(data, item.prop);

	    item.el.setAttribute(item.name, value);
	  }

	  debug('populated');
	  return true;
	};

	/**
	 * Template a string.
	 *
	 * @example
	 *
	 * interpolate('foo ${bar}', { bar: 'bar'}); //=> 'foo bar'
	 *
	 * @param  {String} string
	 * @param  {Object} data
	 * @return {String}
	 */
	function interpolate(string, data) {
	  return string.replace(regex.var, function(match, group) {
	    return getProp(data, group);
	  });
	}

	/**
	 * Replace the <span> textNode placeholders
	 * with real textNodes and return a references.
	 *
	 * @param  {HTMLElement} el
	 * @return {Array}
	 */
	function replaceTextPlaceholders(el) {
	  var placeholders = el.querySelectorAll('[data-popel-text]');
	  var i = placeholders.length;
	  var result = [];

	  while (i--) {
	    var node = document.createTextNode('');
	    placeholders[i].parentNode.replaceChild(node, placeholders[i]);
	    result.push({
	      key: placeholders[i].dataset.popelText,
	      node: node
	    });
	  }

	  return result;
	}

	/**
	 * Remove the [data-popel-attr] reference
	 * and return a list of all dynamic attributes.
	 *
	 * @param  {HTMLElement} el
	 * @return {Array}
	 */
	function replaceAttrPlaceholders(el) {
	  var placeholders = el.querySelectorAll('[data-popel-attrs]');
	  var i = placeholders.length;
	  var result = [];

	  while (i--) {
	    var attrs = placeholders[i].dataset.popelAttrs.split(' ');
	    var j = attrs.length;

	    while (j--) {
	      var parts = attrs[j].split('=');
	      var value = decodeURIComponent(parts[1]);
	      var attr = {
	        name: parts[0],
	        el: placeholders[i]
	      };

	      // If the variable is *part* of the whole string
	      // we must interpolate the variable into the string
	      // each time .populate() is called. If the variable
	      // fills the entire string we can slam it straight in.
	      if (isPartial(value)) attr.template = value;
	      else attr.prop = value.replace(regex.var, '$1');

	      result.push(attr);
	    }

	    placeholders[i].removeAttribute('data-popel-attrs');
	  }

	  return result;
	}

	/**
	 * Detect if variable is part of
	 * a larger string.
	 *
	 * @example
	 *
	 * isPartial('before ${foo}') //=> true
	 * isPartial('${foo} after') //=> true
	 * isPartial('${foo}') //=> false
	 *
	 * @param  {String}  value
	 * @return {Boolean}
	 */
	function isPartial(value) {
	  return !/^\$\{.+\}$/.test(value);
	}

	/**
	 * Turn an HTML String into an element.
	 *
	 * @param  {String} html
	 * @return {HTMLElement}
	 */
	function elementify(html) {
	  var div = document.createElement('div');
	  div.innerHTML = html;
	  return div;
	}

	/**
	 * Get a property from an object,
	 * supporting dot notation for
	 * deep properties.
	 *
	 * @example
	 *
	 * getProp({ foo: { bar: 1 }}, 'foo.bar') //=> 1
	 *
	 * @param  {[type]} item [description]
	 * @param  {[type]} path [description]
	 * @return {[type]}      [description]
	 */
	function getProp(object, path) {
	  if (!path) return;

	  var parts = path.split('.');

	  // Fast paths
	  if (parts.length == 1) return object[parts[0]];
	  if (parts.length == 2) return object[parts[0]][parts[1]];

	  return (function getDeep(object, parts) {
	    var part = parts.shift();
	    return parts.length ? getDeep(object[part], parts) : object[part];
	  })(object, parts);
	}

	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));})(__webpack_require__(5));/*jshint ignore:line*/


/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory(__webpack_require__(1));
		else if(typeof define === 'function' && define.amd)
			define(["fxos-component"], factory);
		else if(typeof exports === 'object')
			exports["FXOSSubHeader"] = factory(require("fxos-component"));
		else
			root["FXOSSubHeader"] = factory(root["fxosComponent"]);
	})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};

	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {

	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;

	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};

	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;

	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}


	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;

	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;

	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";

	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {

		
		/**
		 * Dependencies
		 */

		var component = __webpack_require__(1);

		/**
		 * Simple logger (toggle 0)
		 *
		 * @type {Function}
		 */
		var debug = 0 ? console.log.bind(console, '[fxos-sub-header]') : () => {};

		/**
		 * Exports
		 */

		module.exports = component.register('fxos-sub-header', {
		  created() {
		    this.setupShadowRoot();
		    this.els = { inner: this.shadowRoot.querySelector('.inner') };
		    this.level = this.getAttribute('level');
		  },

		  /**
		   * Known attribute property
		   * descriptors.
		   *
		   * These setters get called when matching
		   * attributes change on the element.
		   *
		   * @type {Object}
		   */
		  attrs: {
		    level: {
		      get() {
		        debug('get level');
		        if ('_level' in this) { return this._level; }
		      },

		      set(value) {
		        debug('set level', value);
		        value = parseInt(value, 10);
		        if (value === this._level || isNaN(value)) {
		          this.els.inner.removeAttribute('aria-level');
		          this._level = null;
		        } else {
		          this.els.inner.setAttribute('aria-level', value);
		          this._level = value;
		        }
		      }
		    }
		  },

		  template: `
		    <div class="inner" role="heading">
		      <div class="line"></div>
		      <div class="text"><content></content></div>
		    </div>
		    <style>
		      :host {
		        display: block;
		        margin: 20px 17px 0 17px;
		        background:
		          var(--fxos-sub-header-background,
		          var(--fxos-background));
		      }

		      .inner {
		        position: relative;
		        text-align: center;
		        height: 20px;
		      }

		      .line {
		        position: absolute;
		        left: 0;
		        top: 50%;

		        display: block;
		        height: 2px;
		        width: 100%;
		        margin-top: -1px;

		        background:
		          var(--fxos-sub-header-border-color,
		          var(--fxos-border-color,
		          #999));
		      }

		      .text {
		        position: relative;

		        display: inline-block;
		        padding: 0 14px;
		        height: 20px;
		        line-height: 20px;

		        text-transform: uppercase;
		        font-size: 14px;
		        font-weight: normal;

		        background:
		          var(--fxos-sub-header-background,
		          var(--fxos-background,
		          #fff));

		        color:
		          var(--fxos-title-color,
		          var(--fxos-text-color));
		      }

		      ::content a,
		      ::content button {
		        position: relative;

		        display: block;
		        padding-inline-end: 16px;

		        font: inherit;
		        cursor: pointer;
		        text-decoration: none;

		        color:
		          var(--fxos-sub-header-link-color,
		          var(--fxos-brand-color));
		      }

		      ::content a:active,
		      ::content button:active {
		        opacity: 0.5;
		      }

		      ::content a:after,
		      ::content button:after {
		        content: "";
		        position: absolute;
		        top: 6px;
		        offset-inline-end: 0px;

		        border-bottom: 8px solid;
		        border-inline-start: 8px solid transparent;
		        border-bottom-color: currentColor
		      }
		    </style>`
		});


	/***/ },
	/* 1 */
	/***/ function(module, exports) {

		module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

	/***/ }
	/******/ ])
	});
	;

/***/ }
/******/ ])
});
;