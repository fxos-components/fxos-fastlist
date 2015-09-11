/* global suite, sinon, setup, teardown,
test, assert, scheduler, GaiaFastList */

/*jshint maxlen:false*/

suite('GaiaFastList >', function() {
  'use strict';
  var GaiaFastListProto = GaiaFastList.prototype;
  var dom;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.FastList = this.sinon.spy(GaiaFastListProto, 'FastList');
    dom = document.createElement('div');
    document.body.appendChild(dom);
  });

  teardown(function() {
    this.sinon.restore();
    dom.remove();
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
      +      '</li>'
      +    '</template>'
      + '</gaia-fast-list>';

    dom.innerHTML = html;
    return dom.firstElementChild;
  }

  function createModel(params) {
    var length = params && params.length || 100;
    var perSection = params && params.perSection || 10;
    var result = [];

    for (var i = 0; i < length; i++) {
      result.push({
        title: `Title ${i}`,
        body: `Body ${i}`,
        section: `Section ${Math.floor(i / perSection)}`
      });
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