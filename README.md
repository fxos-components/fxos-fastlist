[![](https://travis-ci.org/fxos-components/fxos-fastlist.svg)](https://travis-ci.org/fxos-components/fxos-fastlist) [![Coverage Status](https://coveralls.io/repos/fxos-components/fxos-fastlist/badge.svg?branch=master&service=github)](https://coveralls.io/github/fxos-components/fxos-fastlist?branch=master)

## Installation

```bash
$ npm install fxos-fastlist
```

## Usage

```html
<fxos-fastlist>
  <template>
    <li>
      <h3>${title}</h3>
      <p>${body}</p>
    </li>
  </template>
</fxos-fastlist>
```

```js
var list = document.querySelector('fxos-fastlist');

// triggers render
list.setModel([
  { title: 'Title 1', body: 'Body 1' },
  { title: 'Title 2', body: 'Body 2' },
  { title: 'Title 3', body: 'Body 3' },
  ...
);
```

## Sections

To group list-items into sections, define a `getSectionName()` function before assigning a `model`.

```js
list.configure({
  getSectionName: function(item) {
    return item.section;
  }
});

list.setModel([
  { title: 'Title 1', body: 'Body 1', section: 1 },
  { title: 'Title 2', body: 'Body 2', section: 1 },
  { title: 'Title 3', body: 'Body 3', section: 2 },
  ...
];
```

## Images

GaiaFastList takes care of rendering images for you to ensure that scrolling performance remains fast.

Place `<div class="image"><img/></div>` as the *first* child of your list-item template.

```html
<fxos-fastlist>
  <template>
    <li>
      <div class="image"><img/></div>
      <h3>${title}</h3>
      <p>${body}</p>
    </li>
  </template>
</fxos-fastlist>
```

Then define a `.getItemImageSrc()` function that returns either a `String` or a `Blob`, sync or async (by returning a `Promise`).

```js
list.configure({
  getItemImageSrc(item) { return item.src; }
});
```

## Caching

The optional caching feature will cache rendered list-items and section HTML in `localStorage`. On second render we inject the cached HTML right away for a really fast first-paint. This way the user see some content right away, giving you time to fetch your model behind the scenes.

```html
<fxos-fastlist caching>
  <template>
    ...
  </template>
</fxos-fastlist>
```

```js
list.setModel([...]);

// update the cached content
list.cache();

// you can clear caches if need be
list.clearCache();
```

## Optimizing reflows

Defining `top` and `bottom` offsets avoids the component having to read dimensions from the DOM, which can be costly. The following example is for a list that occupies the entire vertical screen space.

```html
<fxos-fastlist top="0" bottom="0">
  <template>
    ...
  </template>
</fxos-fastlist>
```

## Offsetting content

Sometimes you may require elements other than list-items within your scrollable region (eg. a search field). The `offset` attribute allows you to define a value which all list content will be offset by. The value should usually be the height of your 'foreign' element.

```html
<fxos-fastlist offset="50">
  <div style="height: 50px"></div>
  <template>
    ...
  </template>
</fxos-fastlist>
```
## Developing locally

1. `git clone https://github.com/fxos-components/fxos-fastlist.git`
2. `cd fxos-checkbox`
3. `npm install` (NPM3)
4. `npm start`

## Readiness

- [ ] Accessibility
- [ ] Localization
- [ ] Performance
- [ ] Visual/UX
- [ ] RTL

## Tests

1. Ensure Firefox Nightly is installed on your machine.
2. `$ npm install`
3. `$ npm test`

If your would like tests to run on file change use:

`$ npm run test-dev`

## Lint check

Run lint check with command:

`$ npm run lint`
