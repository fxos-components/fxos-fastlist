
var list = document.querySelector('gaia-fast-list');

list.configure({
  getItemImageSrc(data, i) { return 'images/artwork-' + (i % 10) + '.jpg'; },
  getSectionName(item) { return item.section; }
});

list.setModel(getData());

function getData() {
    var letters = 'abcdefghijklmnopqrstuvwyz';
    var result = [];

    for (var i = 0; i < letters.length; i++) {
      for (var j = 0; j < 50; j++) {
        result.push({
          title: `Title ${j}`,
          body: `Body ${j}`,
          section: letters[i]
        });
      }
    }

  return result;
}

