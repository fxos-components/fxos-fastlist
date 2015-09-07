/* global suite, sinon, setup, teardown, test, assert,
          DataSource, FastList */

suite.only('GaiaFastList >', function() {
  'use strict';
  var dom;

  setup(function() {
    this.sinon = sinon.sandbox.create();
    dom = document.createElement('div');
    document.body.appendChild(dom);
  });

  teardown(function() {
    dom.remove();
  });

  test('it creates FastList when model is first set', function() {
    var spy = this.sinon.spy(window, 'FastList');
    var el = create();

    sinon.assert.notCalled(spy);
  });

  function create(attrs='') {
    var html = '<gaia-fast-list ' + attrs + '>'
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
});