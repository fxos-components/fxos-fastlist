
var list = document.querySelector('fxos-fastlist');
list.setModel(getData());

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

