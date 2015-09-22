/* global suite, sinon, setup, teardown,
test, assert, scheduler, GaiaFastList */

/*jshint maxlen:false*/

suite('GaiaFastList >', function() {
  'use strict';
  var GaiaFastListProto = GaiaFastList.prototype;
  var utils = window['test-utils'];
  var dom;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.FastList = this.sinon.spy(GaiaFastListProto, 'FastList');
    dom = document.createElement('div');
    document.body.appendChild(dom);
  });

  teardown(function() {
    this.sinon.restore();
    // dom.remove();
  });

  test('it creates FastList when model is first set', function() {
    var el = createList();
    sinon.assert.notCalled(this.FastList);

    el.model = createModel();
    sinon.assert.calledOnce(this.FastList);
  });

  suite('offset', function() {
    setup(function() {
      this.sinon.stub(scheduler, 'mutation', () => {
        this.rendered = deferred();
        return this.rendered.promise;
      });
    });

    test('it offsets all list items by the offset value', function() {
      var el = createList('offset="100"');

      // Append foreign element
      var before = document.createElement('div');
      before.style.height = '100px';
      el.appendChild(before);

      el.model = createModel();
      scheduler.mutation.yield();
      this.rendered.resolve();

      var items = el.querySelectorAll('li');

      assert.equal(items[0].getBoundingClientRect().top, 100);
      assert.equal(items[1].getBoundingClientRect().top, 160);
      assert.equal(items[2].getBoundingClientRect().top, 220);
    });

    test('it offsets sections as well as items', function() {
      var el = createList('offset="100"');

      // Append foreign element
      var before = document.createElement('div');
      before.style.height = '100px';
      el.appendChild(before);

      // create a single section
      el.configure({ getSectionName() { return 'section'; } });

      el.model = createModel();
      scheduler.mutation.yield();
      this.rendered.resolve();

      var sections = el.querySelectorAll('.gfl-section');
      var items = el.querySelectorAll('.gfl-item');

      assert.equal(sections[0].getBoundingClientRect().top, 100);
      assert.equal(items[0].getBoundingClientRect().top, 140);
      assert.equal(items[1].getBoundingClientRect().top, 200);
      assert.equal(items[2].getBoundingClientRect().top, 260);
    });
  });

  suite('caching', function() {
    setup(function() {
      this.clock = this.sinon.useFakeTimers();
    });

    teardown(function() {
      this.el.clearCache();
    });

    test('it should cache the content of the first render', function(done) {

      this.el = createList('caching');
      this.el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;

      fastList.rendered.then(() => {
        this.sinon.stub(scheduler, 'mutation');

        // Wait for cache to be set
        this.clock.tick(500);
        scheduler.mutation.yield();

        this.el.remove();

        // Create new list
        this.el = createList('caching');
        var items = this.el.querySelectorAll('.gfl-item');

        assert.ok(items.length, 'items rendered before model set');
        done();
      });
    });

    test('it caches the final height once .complete() is called', function(done) {
      var itemHeight = 60;

      this.el = createList('caching');
      this.el.model = createModel({ length: 10 });

      var fastList = this.FastList.lastCall.returnValue;

      fastList.rendered.then(() => {
        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        return fastList.rendered;
      }).then(() => {
        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        return fastList.rendered;
      }).then(() => {
        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        this.el.complete();

        return fastList.rendered;
      }).then(() => {

        // Update caches
        this.sinon.stub(scheduler, 'mutation');
        this.clock.tick(500);
        scheduler.mutation.yield();
        scheduler.mutation.restore();

        this.el.remove();

        // Create new list
        this.el = createList('caching');
        this.el.model = createModel({ length: 10 });

        fastList = this.FastList.lastCall.returnValue;
        return fastList.rendered;
      }).then(() => {

        var list = this.el.shadowRoot.querySelector('ul');
        assert.equal(list.style.height, (40 * itemHeight) + 'px',
          'the list has the height of the last complete list' +
          'before the remaining model chunks have arrived');

        done();
      }).catch(done);
    });

    test('it updates the height when the new height is different from cached', function(done) {
      var itemHeight = 60;

      this.el = createList('caching');

      // Setting model triggers render
      this.el.model = createModel({ length: 10 });

      // Get the internal FastList instance
      var fastList = this.FastList.lastCall.returnValue;

      fastList.rendered.then(() => {

        // Update caches
        this.sinon.stub(scheduler, 'mutation');
        this.clock.tick(500);
        scheduler.mutation.yield();
        scheduler.mutation.restore();

        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        return fastList.rendered;
      }).then(() => {
        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        this.el.complete();
        return fastList.rendered;
      }).then(() => {
        this.el.remove();

        // Create new list
        this.el = createList('caching');

        // Set model and render
        this.el.model = createModel({ length: 10 });
        fastList = this.FastList.lastCall.returnValue;

        return fastList.rendered;
      }).then(() => {

        // Update and mark as complete
        this.el.model = this.el.model.concat(createModel({ length: 10 }));
        this.el.complete();

        return fastList.rendered;
      }).then(() => {

        // Update caches
        var stub = sinon.stub(scheduler, 'mutation');
        this.clock.tick(500);
        scheduler.mutation.yield();
        stub.restore();

        var list = this.el.shadowRoot.querySelector('ul');
        assert.equal(list.clientHeight, 20 * itemHeight);

        done();
      }).catch(done);
    });
  });

  suite('styling >>', function() {
    test('it does not put top-borders on the first item in a section', function(done) {
      var el = createList({ perSection: 10 });

      el.configure({
        getSectionName(item) { return item.section; }
      });

      el.model = createModel();
      var fastList = this.FastList.lastCall.returnValue;

      fastList.rendered.then(() => {
        var items = el.querySelectorAll('.gfl-item');

        [].forEach.call(items, (item, i) => {
          var firstInSection = i % 10 === 0;
          var borderTopStyle = getComputedStyle(item).borderTopStyle;
          var expected = firstInSection
            ? 'none'
            : 'solid';

          assert.equal(borderTopStyle, expected);
        });

        done();
      }).catch(done);
    });

    test('it does not put border-top on first item when there are no sections', function() {
      var el = createList({ perSection: 10 });

      el.model = createModel();
      var fastList = this.FastList.lastCall.returnValue;

      return fastList.rendered.then(() => {
        var items = el.querySelectorAll('.gfl-item');

        [].forEach.call(items, (item, i) => {
          var firstInSection = i === 0;
          var borderTopStyle = getComputedStyle(item).borderTopStyle;
          var expected = firstInSection
            ? 'none'
            : 'solid';

          assert.equal(borderTopStyle, expected);
        });
      });
    });
  });

  suite('reflows', function() {
    var clientHeight;
    var offsetHeight;
    var spy;

    setup(function() {
      clientHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight');
      offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
      spy = sinon.spy();

      Object.defineProperty(Element.prototype, 'clientHeight', {
        get: function() {
          spy();
          return clientHeight.get.call(this);
        }
      });

      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        get: function() {
          spy();
          return offsetHeight.get.call(this);
        }
      });
    });

    teardown(function() {
      Object.defineProperty(Element.prototype, 'clientHeight', clientHeight);
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offsetHeight);
    });

    test('it does not cause sync reflow when `top` and `bottom` attributes are used', function() {
      var el = createList('top=50 bottom=0');
      el.model = createModel();
      var fastList = this.FastList.lastCall.returnValue;

      return fastList.rendered
        .then(() => {
          sinon.assert.notCalled(spy);

          var el = createList();
          el.model = createModel();
          var fastList = this.FastList.lastCall.returnValue;

          return fastList.rendered;
        })

        .then(() => {
          sinon.assert.called(spy);
        });
    });
  });

  suite('picker', function() {
    var el;

    setup(function() {
      this.sinon.stub(window, 'requestAnimationFrame').callsArg(0); // sync raf
      this.clock = this.sinon.useFakeTimers();
    });

    teardown(function() {
      el.destroy();
    });

    test('it jumps to a section when tapped', function() {
      el = createList('picker');
      var picker = el.shadowRoot.querySelector('.picker');

      el.configure({ getSectionName(item) { return item.section; } });
      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          var x = picker.clientWidth / 2;
          var sectionB = el.querySelector('#gfl-section-b');

          utils.touch(picker, 'touchstart', x, 20);
          utils.touch(picker, 'touchend', x, 20);

          assert.equal(sectionB.offsetTop, el.scrollTop);
        });
    });

    test('the picker overlay displays the letter of the pressed picker-item', function() {
      el = createList('picker');
      var picker = el.shadowRoot.querySelector('.picker');
      var overlayText = el.shadowRoot.querySelector('.overlay > .text');

      el.configure({ getSectionName(item) { return item.section; } });
      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          var x = picker.clientWidth / 2;
          var pickerItemHeight = picker.querySelector('a').offsetHeight;
          var y = 6;

          utils.touch(picker, 'touchstart', x, y);
          assert.equal(overlayText.textContent, 'a');

          this.clock.tick(50);
          utils.touch(picker, 'touchmove', x, y += pickerItemHeight);
          assert.equal(overlayText.textContent, 'b');

          this.clock.tick(50);
          utils.touch(picker, 'touchmove', x, y += pickerItemHeight);
          assert.equal(overlayText.textContent, 'c');

          this.clock.tick(50);
          utils.touch(picker, 'touchmove', x, y += pickerItemHeight);
          assert.equal(overlayText.textContent, 'd');

          utils.touch(picker, 'touchend', x, y);
        });
    });

    test('it accepts user provided picker items', function() {
      el = createList('picker');

      var customPickerItem = document.createElement('a');
      customPickerItem.setAttribute('picker-item', '');
      customPickerItem.textContent = '1';

      // href used to define scroll target
      customPickerItem.href = '#gfl-section-d';
      el.appendChild(customPickerItem);

      el.configure({ getSectionName(item) { return item.section; } });
      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          var sectionD = el.querySelector('#gfl-section-d');

          utils.touch(customPickerItem, 'touchstart');
          utils.touch(customPickerItem, 'touchend');

          assert.equal(sectionD.offsetTop, el.scrollTop);
        });
    });

    test('it populates overlay icon if picker-item is an icon', function() {
      el = createList('picker');
      var overlayIcon = el.shadowRoot.querySelector('.overlay > .icon');

      var customPickerItem = document.createElement('a');
      customPickerItem.setAttribute('picker-item', '');
      customPickerItem.setAttribute('data-icon', 'icon-id');
      el.appendChild(customPickerItem);

      el.configure({ getSectionName(item) { return item.section; } });
      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          utils.touch(customPickerItem, 'touchstart');
          utils.touch(customPickerItem, 'touchend');

          assert.equal(overlayIcon.textContent, 'icon-id');
        });
    });
  });

  suite('images', function() {
    var el;

    test('it loads images', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return `/base/test/lib/artwork-${i % 10}.jpg`;
        }
      });

      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          return Promise.all([].map.call(el.querySelectorAll('img'), img => {
            return new Promise(resolve => img.addEventListener('load', resolve));
          }));
        });
    });

    test('it loads correct images when the scrollTop changes', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return `/base/test/lib/artwork-${i % 10}.jpg`;
        }
      });

      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          var itemHeight = 60;
          el.scrollTop = 55 * itemHeight;

          // wait one tick for re-render
          return Promise.resolve();
        })
        .then(() => {
          var items = el.querySelectorAll('.gfl-item');
          [].forEach.call(items, item => {
            var index = item.dataset.index;
            var expected = `/base/test/lib/artwork-${index % 10}.jpg`;
            var img = item.querySelector('img');
            assert.include(img.src, expected);
          });
        });
    });

    test('it keeps the image hidden if no src is returned', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return i % 3
            ? `/base/test/lib/artwork-${i % 10}.jpg`
            : undefined;
        }
      });

      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          var items = el.querySelectorAll('.gfl-item');
          return [].map.call(items, item => {
            var img = item.querySelector('img');
            var index = item.dataset.index;

            if (index % 3 === 0) {
              assert.equal(img.src, '', 'no src set');
              assert.equal(img.onload, null, 'no load handler set');
              assert.equal(getComputedStyle(img).opacity, '0', 'hidden');
            }
          });
        });
    });

    test('getImageSrc() can return a Promise', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(`/base/test/lib/artwork-${i % 10}.jpg`);
            });
          });
        }
      });

      el.model = createModel();

      var fastList = this.FastList.lastCall.returnValue;
      return fastList.rendered
        .then(() => {
          return Promise.all([].map.call(el.querySelectorAll('img'), (img, index) => {
            return new Promise(resolve => img.addEventListener('load', e => {
              var expected = `/base/test/lib/artwork-${index % 10}.jpg`;
              assert.include(img.src, expected);
              resolve();
            }));
          }));
        });
    });
  });

  /**
   * Utils
   */

  function createList(attrs='') {
    attrs += ' style="width:300px;height:400px;"';

    var html = '<gaia-fast-list ' + attrs + '">'
      +    '<template>'
      +      '<li>'
      +        '<h2>${title}</h2>'
      +        '<p>${body}</p>'
      +        '<div class="image"><img/></div>'
      +      '</li>'
      +    '</template>'
      + '</gaia-fast-list>';

    dom.innerHTML = html;
    return dom.firstElementChild;
  }

  function createModel(params) {
    var perSection = params && params.perSection || 10;
    var maxLength = params && params.length;
    var letters = 'abcdefghijklmnopqrstuvwyz';
    var result = [];
    var count = 0;

    for (var i = 0; i < letters.length; i++) {
      for (var j = 0; j < perSection; j++) {
        if (maxLength && count >= maxLength) break;

        result.push({
          title: `Title ${j}`,
          body: `Body ${j}`,
          section: letters[i]
        });

        count++;
      }

    }

    return result;
  }

  function deferred() {
    var defer = {};

    defer.promise = new Promise((resolve, reject) => {
      defer.resolve = resolve;
      defer.reject = reject;
    });

    return defer;
  }
});