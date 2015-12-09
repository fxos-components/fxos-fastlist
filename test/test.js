/* global suite, sinon, setup, teardown,
test, assert, FXOSFastlist */

/*jshint maxlen:false*/

suite('fxos-fastlist >>', function() {
  'use strict';
  var FXOSFastlistProto = FXOSFastlist.prototype;
  var utils = window['test-utils'];
  var afterNext = utils.afterNext;
  var dom;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.FastList = this.sinon.spy(FXOSFastlistProto, 'FastList');
    dom = document.createElement('div');
    document.body.appendChild(dom);
  });

  teardown(function() {
    this.sinon.restore();
    dom.remove();

    // trigger revokeObjectURL()
    window.dispatchEvent(new CustomEvent('pagehide'));
  });

  test('it creates FastList when model is first set', function() {
    var el = createList();
    sinon.assert.notCalled(this.FastList);

    return el.setModel(createModel())
      .then(() => {
        sinon.assert.calledOnce(this.FastList);
      });
  });

  test('it accepts an empty model', function() {
    var el = createList();

    return el.setModel([])
      .then(() => {
        var items = el.querySelectorAll('.gfl-item');
        assert.equal(items.length, 0);
        return el.setModel(createModel());
      })

      .then(() => {
        var items = el.querySelectorAll('.gfl-item');
        assert.equal(items.length, 23);
      });
  });

  test('setModel() can be hit hard', function(done) {
    var el = createList();

    el.setModel([]);
    setTimeout(() => {
      el.setModel(createModel());
      el.setModel(createModel().slice(50));
      setTimeout(() => {
        var model = createModel().slice(12);
        el.setModel(model);
        setTimeout(() => {
          var items = el.querySelectorAll('.gfl-item');
          var title = items[0].querySelector('h3').textContent;
          assert.equal(items.length, 23);
          assert.equal(title, model[0].title);
          done();
        }, 400);
      }, 100);
    }, 50);
  });

  suite('offset >>', function() {
    test('it offsets all list items by the offset value', function() {
      var el = createList('offset="100"');
      var model = createModel();

      // Append foreign element
      var before = document.createElement('div');
      before.style.height = '100px';
      el.appendChild(before);

      return el.setModel(model).then(() => {
        var items = el.querySelectorAll('li');
        assert.equal(items[0].getBoundingClientRect().top, 100);
        assert.equal(items[1].getBoundingClientRect().top, 160);
        assert.equal(items[2].getBoundingClientRect().top, 220);
      });
    });

    test('it offsets sections as well as items', function() {
      var el = createList('offset="100"');
      var model = createModel();

      // Append foreign element
      var before = document.createElement('div');
      before.style.height = '100px';
      el.appendChild(before);

      // create a single section
      el.configure({ getSectionName() { return 'section'; } });

      return el.setModel(model).then(() => {
        var sections = el.querySelectorAll('.gfl-section');
        var items = el.querySelectorAll('.gfl-item');

        assert.equal(sections[0].getBoundingClientRect().top, 100);
        assert.equal(items[0].getBoundingClientRect().top, 140);
        assert.equal(items[1].getBoundingClientRect().top, 200);
        assert.equal(items[2].getBoundingClientRect().top, 260);
      });
    });
  });

  suite('caching >>', function() {
    teardown(function() {
      this.el.clearCache();
    });

    test('it should cache the content of the first render', function() {
      this.el = createList('caching');
      this.el.setModel(createModel());

      return this.el.cache()
        .then(() => {
          this.el.remove();
          this.el = createList('caching');
          return this.el.rendered;
        })

        .then(() => {
          var items = this.el.querySelectorAll('.gfl-item');
          assert.ok(items.length, 'items rendered before model set');
          [].forEach.call(items, (item, i) => {
            assert.equal(item.getBoundingClientRect().top, i * 60,
              'item is correctly positioned');
          });
        });
    });

    test('it replaces the cache when the model is first set', function() {
      this.el = createList('caching');

      var model = createModel();
      var first = model[0];

      // trigger render
      this.el.setModel(model);

      // trigger creation of first cache
      return this.el.cache()
        .then(() => {

          // destroy first component
          this.el.remove();

          // Create new component
          this.el = createList('caching');

          return this.el.rendered;
        })

        .then(() => {

          // assert contains first cached model
          var firstTitle = this.el.querySelectorAll('.gfl-item h3')[0];
          assert.equal(firstTitle.textContent, first.title, 'first item matches first model');

          // set a different model
          var model = createModel().slice(5);
          this.el.setModel(model);
          first = model[0];
          return this.el.cache();
        })

        .then(() => {

          // destroy second component
          this.el.remove();

          // create third component
          this.el = createList('caching');
          return this.el.rendered;
        })

        .then(() => {

          // assert contains second cached model
          var firstTitle = this.el.querySelectorAll('.gfl-item h3')[0];
          assert.equal(firstTitle.textContent, first.title, 'first item matches first model');
        });
    });

    test('it only caches enough list-items to fill the viewport', function() {
      this.el = createList('caching');
      this.el.setModel(createModel());

      return this.el.cache()
        .then(() => {
          this.el.remove();
          this.el = createList('caching');
          return this.el.rendered;
        })

        .then(() => {
          var items = this.el.querySelectorAll('.gfl-item');
          var itemHeight = 60;

          // We should enough items to fill for the maximum possible
          // space the list could occupy bearing in mind both orientations
          var expected = Math.max(window.innerWidth, window.innerHeight) / itemHeight;
          assert.equal(items.length, Math.ceil(expected));
        });
    });

    test('it caches the final height once .cache() is called', function() {
      var model = createModel({ length: 10 });
      var itemHeight = 60;

      this.el = createList('caching');

      return this.el.setModel(model)
        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          return this.el.setModel(model);
        })

        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          return this.el.setModel(model);
        })

        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          return this.el.setModel(model);
        })

        .then(() => {
          return this.el.cache();
        })

        .then(() => {
          this.el.remove();
          this.el = createList('caching');
          return this.el.setModel(createModel({ length: 10 }));
        })

        .then(() => {
          var list = this.el.shadowRoot.querySelector('ul');
          assert.equal(list.style.height, (40 * itemHeight) + 'px',
            'the list has the height of the last complete list ' +
            'before the remaining model chunks have arrived');
        });
    });

    test('it updates the height when the new height is different from cached', function() {
      var model = createModel({ length: 10 });
      var itemHeight = 60;

      this.el = createList('caching');

      return this.el.setModel(model)
        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          return this.el.setModel(model);
        })

        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          return this.el.setModel(model);
        })

        .then(() => {
          return this.el.cache();
        })

        .then(() => {
          this.el.remove();
          this.el = createList('caching');
          model = createModel({ length: 10 });
          return this.el.setModel(model);
        })

        .then(() => {
          model = model.concat(createModel({ length: 10 }));
          this.el.setModel(model);
          return this.el.cache();
        })

        .then(() => {
          var list = this.el.shadowRoot.querySelector('ul');
          assert.equal(list.clientHeight, 20 * itemHeight);
        });
    });
  });

  suite('styling >>', function() {
    test('it does not put top-borders on the first item in a section', function() {
      var model = createModel({ perSection: 10 });
      var el = createList();

      el.configure({ getSectionName(item) { return item.section; } });

      return el.setModel(model)
        .then(() => {
          var items = Array.from(el.querySelectorAll('.gfl-item'));
          items.forEach((item, i) => {
            var firstInSection = i % 10 === 0;
            var borderTopStyle = getComputedStyle(item).borderTopColor;

            if (firstInSection) assert.equal(borderTopStyle, 'transparent');
            else assert.notEqual(borderTopStyle, 'transparent');
          });
        });
    });

    test('it does not put border-top on first item when there are no sections', function() {
      var model = createModel();
      var el = createList();


      return el.setModel(model)
        .then(() => {
          var items = Array.from(el.querySelectorAll('.gfl-item'));
          items.forEach((item, i) => {
            var firstInSection = i === 0;
            var borderTopStyle = getComputedStyle(item).borderTopColor;

            if (firstInSection) assert.equal(borderTopStyle, 'transparent');
            else assert.notEqual(borderTopStyle, 'transparent');
          });
        });
    });
  });

  suite('reflows >>', function() {
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
      var inner = el.shadowRoot.querySelector('.inner');

      inner.style.height = '400px';
      el.style.height = '';

      return el.setModel(createModel())
        .then(() => {
          sinon.assert.notCalled(spy);

          var el = createList();
          var inner = el.shadowRoot.querySelector('.inner');

          inner.style.height = '400px';
          el.style.height = '';

          return el.setModel(createModel());
        })

        .then(() => {
          sinon.assert.called(spy);
        });
    });

    test('it does not cause reflow when list.style.height is set', function() {
      var el = createList('top=50 bottom=0');

      return el.setModel(createModel())
        .then(() => {
          sinon.assert.notCalled(spy);

          var el = createList();
          var inner = el.shadowRoot.querySelector('.inner');

          inner.style.height = '400px';
          el.style.height = '';
          return el.setModel(createModel());
        })

        .then(() => {
          sinon.assert.called(spy);
        });
    });
  });

  suite('picker >>', function() {
    var el;

    setup(function() {
      this.sinon.stub(window, 'requestAnimationFrame').callsArg(0); // sync raf
    });

    teardown(function() {
      el.destroy();
    });

    test('it jumps to a section when tapped', function() {
      el = createList('picker');
      var picker = el.shadowRoot.querySelector('.picker');

      el.configure({ getSectionName(item) { return item.section; } });

      return el.setModel(createModel())
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

      return el.setModel(createModel())
        .then(() => {
          var x = picker.clientWidth / 2;
          var pickerItemHeight = picker.querySelector('a').offsetHeight;
          var y = 6;

          this.clock = this.sinon.useFakeTimers();

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

      return el.setModel(createModel())
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
      return el.setModel(createModel())
        .then(() => {
          utils.touch(customPickerItem, 'touchstart');
          utils.touch(customPickerItem, 'touchend');

          assert.equal(overlayIcon.textContent, 'icon-id');
        });
    });
  });

  suite('images >>', function() {
    var el;

    test('it loads images', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return `/base/test/lib/artwork-${i % 10}.jpg`;
        }
      });

      return el.setModel(createModel())
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

      return el.setModel(createModel())
        .then(() => {
          var itemHeight = 60;
          el.scrollTop = 55 * itemHeight;
          return imagesLoaded(el);
        })

        .then(() => {
          var items = Array.from(el.querySelectorAll('.gfl-item'));
          items.forEach(item => {
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

      return el.setModel(createModel())
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

      return el.setModel(createModel())
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

    test('getItemImageSrc() can return a Blob', function() {
      el = createList();
      el.configure({
        getItemImageSrc(item, i) {
          return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
        }
      });

      return el.setModel(createModel())
        .then(() => {
          return Promise.all([].map.call(el.querySelectorAll('img'), (img, index) => {
            return new Promise(resolve => img.addEventListener('load', e => {
              assert.include(img.src, 'blob:');
              resolve();
            }));
          }));
        });
    });

    test('getItemImageSrc() is only called once per item', function() {
      el = createList();

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el.configure({ getItemImageSrc: getItemImageSrc });
      return el.setModel(createModel())
        .then(() => imagesLoaded(el))
        .then(() => {

          // scroll down
          el.scrollTop = 400 * 4;

          // scroll back to top
          el.scrollTop = 10;
          el.scrollTop = 0;

          // assert that getItemImageArgs() was never
          // called more than once with the same arguments
          getItemImageSrc.args.forEach(args => {
            var callCount = getItemImageSrc.withArgs
              .apply(getItemImageSrc, args)
              .callCount;

            assert.equal(callCount, 1, `called once for item ${args[1]}`);
          });
        });
    });

    test('cached images get deleted when `imageCacheSize` limit is reached', function() {
      this.sinon.spy(URL, 'revokeObjectURL');

      el = createList();

      // set size small so limit reached easily
      el.imageCacheSize = 2000000;

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => imagesLoaded(el))
        .then(() => {
          el.scrollTop = 400 * 4; // 4 viewports
          return imagesLoaded(el);
        })
        .then(() => {
          sinon.assert.called(URL.revokeObjectURL);
        });
    });

    test('cached images get discarded when `imageCacheLength` limit is reached', function() {
      this.sinon.spy(URL, 'revokeObjectURL');

      el = createList();

      // set size small so limit reached easily
      el.imageCacheLength = 40;

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => imagesLoaded(el))
        .then(() => {
          el.scrollTop += 400 * 4; // 4 viewports
          return imagesLoaded(el);
        })

        .then(() => {
          el.scrollTop += 400 * 4; // 4 viewports
          return imagesLoaded(el);
        })

        .then(() => {
          sinon.assert.called(URL.revokeObjectURL);
        });
    });

    test('setting a new model does not load cached images', function() {
      el = createList();

      var getItemImageSrc = sinon.spy((item, i) => {
        return `/base/test/lib/artwork-${item.image}.jpg`;
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel([{ image: 1 }])
        .then(() => imagesLoaded(el))
        .then(() => {
          var firstImage = el.querySelector('img');
          assert.include(firstImage.src, 'artwork-1');
        })

        .then(() => {
          el.setModel([{ image: 2 }]);
          return new Promise(resolve => {
            var firstImage = el.querySelector('img');
            firstImage.addEventListener('load', function f() {
              firstImage.removeEventListener('load', f);
              assert.include(firstImage.src, 'artwork-2');
              resolve();
            });
          });
        });
    });

    test('all ObjectURLs should be revoked when page is destroyed', function() {
      var blobs = [];

      this.sinon.spy(URL, 'createObjectURL');
      this.sinon.spy(URL, 'revokeObjectURL');

      el = createList();

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${item.image}.jpg`)
          .then(result => {
            blobs.push(result);
            return result;
          });
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      var model = [
        { image: 1 },
        { image: 2 },
        { image: 3 },
      ];

      return el.setModel(model)
        .then(() => imagesLoaded(el))
        .then(() => {
          sinon.assert.calledWith(URL.createObjectURL, blobs[0]);

          // fake pagehide event
          window.dispatchEvent(new CustomEvent('pagehide'));

          // // called one for each list item image blob
          sinon.assert.calledThrice(URL.revokeObjectURL);

          // called with object url returned from createObjectURL()
          URL.createObjectURL.getCalls().forEach(call => {
            sinon.assert.calledWith(URL.revokeObjectURL, call.returnValue);
          });
        });
    });

    test('it does not use the cache if the imageCacheSize is falsy', function() {
      el = createList();

      // turn cache off
      el.imageCacheSize = 0;

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => imagesLoaded(el))
        .then(() => {
          var firstCallArgs = getItemImageSrc.args[0];

          // scroll down
          el.scrollTop = 400 * 4;

          // scroll back to top
          el.scrollTop = 10;
          el.scrollTop = 0;

          // assert that getItemImageArgs() was never
          // called more than once with the same arguments
          var callCount = getItemImageSrc.withArgs
            .apply(getItemImageSrc, firstCallArgs)
            .callCount;

          assert.equal(callCount, 2, 'called twice');
        });
    });

    test('it can handle imageCacheLength being < itemCount', function() {
      el = createList();

      // silly configuration
      el.imageCacheLength = 10;

      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => imagesLoaded(el));
    });

    test('it cancels rAF if unpopulateItemDetail runs before frame', function() {
      var raf = this.sinon.spy(window, 'requestAnimationFrame');
      var caf = this.sinon.spy(window, 'cancelAnimationFrame');
      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      el = createList();
      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => afterNext(window, 'requestAnimationFrame'))
        .then(() => {
          var rafId = raf.lastCall.returnValue;
          el.scrollTop = 2000;
          sinon.assert.calledWith(caf, rafId);
        });
    });

    test('it cancels image.onload if unpopulateItemDetail runs before load', function() {
      var getItemImageSrc = sinon.spy((item, i) => {
        return getBlobFromURL(`/base/test/lib/artwork-${i % 10}.jpg`);
      });

      var images;
      var onloadSpy;

      el = createList();
      el.configure({ getItemImageSrc: getItemImageSrc });

      return el.setModel(createModel())
        .then(() => {
          return new Promise(resolve => {
            images = el.querySelectorAll('img');
            var onload = Object.getOwnPropertyDescriptor(
              HTMLElement.prototype,
              'onload'
            );

            // Resolve promise once onload handler is set
            Object.defineProperty(images[0], 'onload', {
              configurable: true,
              get: function() { return this._onload; },
              set: function(fn) {
                onloadSpy = sinon.spy(fn);
                onload.set.call(this, onloadSpy);
                this._onload = fn;
                resolve();
              }
            });
          });
        })

        // Once .onload handler has been set
        // scroll the list to trigger unpopulateItemDetail
        // before the image has time to load.
        .then(() => {
          el.scrollTop = 2000;
          assert.equal(images[0].onload, null);
          sinon.assert.notCalled(onloadSpy);
        });
    });
  });

  suite('scrollTop >>', function() {
    test('setting `scrollTop` before render will instantly adjust the list offset', function() {
      var el = createList();
      el.scrollTop = 50;

      var list = el.shadowRoot.querySelector('ul');
      assert.equal(list.style.transform, 'translateY(-50px)');
    });

    test('once rendered the scrollTop is set on the container', function() {
      var el = createList();
      el.scrollTop = 50;

      return el.setModel(createModel())
        .then(() => {
          var container = el.shadowRoot.querySelector('.fastlist');
          var list = el.shadowRoot.querySelector('ul');

          assert.equal(container.scrollTop, 50, 'real list has matching scrollTop');
          assert.equal(list.style.transform, '', 'temp offset unset');
        });
    });

    test('should return the set value before render', function() {
      var el = createList();
      el.scrollTop = 50;
      assert.equal(el.scrollTop, 50);
    });

    test('should return the set value after render', function() {
      var el = createList();

      el.scrollTop = 50;
      return el.setModel(createModel())
        .then(() => assert.equal(el.scrollTop, 50));
    });
  });

  suite('\'rendered\' Promise >>', function() {
    test('it resolves when the cache is rendered', function() {
      var el = createList('caching');

      el.setModel(createModel());

      return el.cache()
        .then(() => {
          el.remove();
          el = createList('caching');
          return el.rendered;
        })

        .then(() => {
          var cache = el.querySelector('.cached');
          assert.ok(cache);
        });
    });

    test('without cache it fires when fastlist\'s critical render has completed', function() {
      var el = createList();

      el.setModel(createModel());

      return el.rendered
        .then(() => {
          var items = el.querySelectorAll('.gfl-item');
          var cache = el.querySelector('.cached');

          assert.isNull(cache, 'no cache render');
          assert.equal(items.length, 7, 'critical items only');
        });
    });
  });

  suite('fast gradient >>', function() {
    test('it\'s added only after FastList setup is complete', function() {
      var el = createList();
      var complete = el.setModel(createModel());

      el.rendered
        .then(() => {
          var list = el.shadowRoot.querySelector('ul');
          var backgroundImage = getComputedStyle(list).backgroundImage;

          // Should not be present on first render
          assert.equal(backgroundImage, 'none');

          // Wait until FastList fully setup
          return complete;
        })

        .then(() => {
            var list = el.shadowRoot.querySelector('ul');
            var backgroundImage = getComputedStyle(list).backgroundImage;
            assert.include(backgroundImage, 'linear-gradient');
        });
    });

    test('it\'s not applied when full-height is shorter than viewport', function() {
      var smallModel = createModel().slice(0, 5);
      var el = createList();

      return el.setModel(smallModel)
        .then(() => {
          var list = el.shadowRoot.querySelector('ul');
          var backgroundImage = getComputedStyle(list).backgroundImage;
          assert.equal(backgroundImage, 'none');
        });
    });

    test('a second blocking gradient is applied to cover offset region', function() {
      var offset = '99';
      var el = createList(`offset=${offset}`);

      return el.setModel(createModel())
        .then(() => {
          var list = el.shadowRoot.querySelector('ul');
          var backgroundSize = getComputedStyle(list).backgroundSize;
          assert.include(backgroundSize, `100% ${offset}`);
        });
    });
  });

  suite('getSectionName() >>', function() {
    test('renders correctly when `undefined` returned as section', function() {
      var el = createList();
      el.configure({ getSectionName: () => undefined });

      return el.setModel(createModel())
        .then(() => {
          var els = Array.from(el.querySelectorAll('.gfl-item'));
          els.forEach((el, i) => {
            var y = el.getBoundingClientRect().top;
            assert.equal(y, i * 60);
          });
        });
    });
  });

  suite('FXOSFastlist#scrollTo() >>', function() {
    var el;

    setup(function() {
      el = createList();
      el.setModel(createModel());
    });

    test('it scrolls smoothly to the given y position', function() {
      var positions = [];

      return el.scrollTo(500)
        .then(() => {
          return new Promise(resolve => {
            (function check() {
              positions.push(el.scrollTop);
              if (el.scrollTop < 500) setTimeout(check, 100);
              else resolve();
            })();
          });
        })

        .then(() => {
          assert.isTrue(positions.length > 2, 'it scrolled in increments');
          assert.equal(el.scrollTop, 500, 'it reached the given position');
        });
    });
  });

  suite('RTL >>', function() {
    var documentDir = document.dir;
    var el;

    setup(function() {
      el = createList();
      return el.setModel(createModel());
    });

    teardown(function() {
      document.dir = documentDir;
    });

    test('it pads the text away from the image in RTL & LTR', function() {
      var item = el.querySelector('.gfl-item');
      var image = item.querySelector('.image');
      var title = item.querySelector('h3');
      var body = item.querySelector('p');

      var imageWidth = image.clientWidth;
      var titlePadding = parseInt(getComputedStyle(title).paddingRight);
      var bodyPadding = parseInt(getComputedStyle(body).paddingRight);

      assert.equal(titlePadding, bodyPadding);
      assert.isTrue(titlePadding > imageWidth);

      document.dir = 'rtl';

      titlePadding = parseInt(getComputedStyle(title).paddingLeft);
      bodyPadding = parseInt(getComputedStyle(body).paddingLeft);

      assert.equal(titlePadding, bodyPadding);
      assert.isTrue(titlePadding > imageWidth);
    });
  });

  suite('unread styling >>', function() {
    var el;

    setup(function() {
      var model = [
        {
          unread: true,
          title: 'title 1',
          body: 'body 1'
        },
        {
          unread: true,
          title: 'title 2',
          body: 'body 2'
        },
        {
          unread: false,
          title: 'title 3',
          body: 'body 3'
        }
      ];

      el = createList('', 'unread=${unread}');
      return el.setModel(model);
    });

    test('unread items should be have visible marker', function() {
      var items = el.querySelectorAll('.gfl-item');
      assert.equal(getComputedStyle(items[0], ':before').visibility, 'visible');
      assert.equal(getComputedStyle(items[1], ':before').visibility, 'visible');
      assert.equal(getComputedStyle(items[2], ':before').visibility, 'hidden');
    });

    test('all items with `unread` attr should have larger padding-start', function() {
      var items = el.querySelectorAll('.gfl-item');
      assert.equal(getComputedStyle(items[0]).paddingLeft, '18px');
      assert.equal(getComputedStyle(items[1]).paddingLeft, '18px');
      assert.equal(getComputedStyle(items[2]).paddingLeft, '18px');
    });

    test('items without `unread` attr should have smaller padding', function() {
      var el = createList();
      var model = createModel();
      return el.setModel(model)
        .then(() => {
          var items = el.querySelectorAll('.gfl-item');
          assert.equal(getComputedStyle(items[0]).paddingLeft, '9px');
        });
    });
  });

  /**
   * Utils
   */

  function createList(attrs='', itemAttrs='') {
    attrs += ' style="width:300px;height:400px;"';


    var html = '<fxos-fastlist ' + attrs + '>'
      +    '<template>'
      +      '<li ' + itemAttrs + '>'
      +        '<div class="image"><img/></div>'
      +        '<h3 dir="auto">${title}</h3>'
      +        '<p dir="auto">${body}</p>'
      +      '</li>'
      +    '</template>'
      + '</fxos-fastlist>';

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

  function getBlobFromURL(url) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = reject;
      xhr.send();
    });
  }

  function imagesLoaded(el) {
    var imgs = el.querySelectorAll('img');
    return Promise.all([].map.call(imgs, img => {
      return new Promise((resolve, reject) => {
        img.addEventListener('load', function f() {
          img.removeEventListener('load', f);
          resolve();
        });

        img.addEventListener('error', function f() {
          img.removeEventListener('error', f);
          reject('error loading image: ' + img.src);
        });
      });
    }));
  }
});