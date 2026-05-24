const blackjack = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

module.exports = {
  blackjack,
  draw,
  sum,
};