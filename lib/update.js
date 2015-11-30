"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = update;

function update(observable, change) {
  var current = observable.state;
  var State = current.constructor;
  var next = new State(current, change);
  observable.state = next;
  observable.observe(next);
}

module.exports = exports["default"];