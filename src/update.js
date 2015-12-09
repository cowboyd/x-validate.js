export default function update(observable, change) {
  let next = change;
  if (!(next instanceof observable.state.constructor)) {
    var current = observable.state;
    let State = current.constructor;
    next = new State(current, change);
  }
  observable.state = next;
  observable.observe(next);
}
