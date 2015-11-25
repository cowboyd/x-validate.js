import update from './update';

export default class Rule {
  constructor(options = {}) {
    this.observe = options.observe || function() {};

    this.condition = options.condition || function() { return Promise.resolve(); };
    this.state = new State({
      isPending: false,
      isFulfilled: false,
      isRejected: false
    });
  }

  run(input) {
    update(this, {
      isPending: true
    });
    return new Promise((resolve, reject)=> {
      return this.condition(input, resolve, reject);
    }).then(()=> {
      update(this, {
        isPending: false,
        isFulfilled: true
      });
    });
  }
}


class State {
  constructor(previous = {}, change = ()=>{}) {
    Object.assign(this, previous);
    if (change.call) {
      change.call(this);
    } else {
      Object.assign(this, change);
    }
    Object.freeze(this);
  }

  get isIdle() {
    return !this.isPending && !this.isSettled;
  }

  get isSettled() {
    return this.isFulfilled || this.isRejected;
  }
}
