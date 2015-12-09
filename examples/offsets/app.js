
var list = document.querySelector('fxos-fastlist');

list.scrollTop = 50;
list.minScrollHeight = 'calc(100% + 50px)';
list.setModel(getData());

function getData() {
  var result = [];

  for (var i = 0; i < 3; i++) {
    result.push({
      title: `Title ${i}`,
      body: `Body ${i}`,
      section: i < 500 ? 'foo' : 'bar'
    });
  }

  return result;
}

