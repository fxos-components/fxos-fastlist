
var list = document.querySelector('gaia-fast-list');

list.configure({
  getItemImageSrc(data, i) {
    return 'images/artwork-' + (i % 10) + '.jpg';
  }
});

list.model = getData();

function getData() {
  var result = [];

  for (var i = 0; i < 1000; i++) {
    result.push({
      title: `Title ${i}`,
      body: `Body ${i}`
    });
  }

  return result;
}

