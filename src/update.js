export default function update(observable, change) {
  var current = observable.state;
  let State = current.constructor;
  let next = new State(current, change);
  observable.state = next;
  observable.observe(next);
}
