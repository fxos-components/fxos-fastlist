
var list = document.querySelector('gaia-fast-list');

list.configure({
  getSectionName(item) { return item.section; }
});

list.setModel(getData());

function getData() {
  var result = [];

  var letters = 'abcdefghijklmnopqrstuvwyz#';
  var length = letters.length;

  for (var i = 0; i < length; i++) {
    for (var j = 0; j < 20; j++) {
      result.push({
        title: `${letters[i]} title ${j}`,
        body: `Body ${j}`,
        section: letters[i]
      });
    }
  }

  return result;
}

