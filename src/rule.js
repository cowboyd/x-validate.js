import update from './update';

export default class Rule {
  constructor(options = {}) {
    Object.assign(this, {
      isRequired: false,
      condition: function(input, resolve) { resolve(); },
      observe: function() {},
      rules: {},
      context: {}
    }, options);

    let keys = Object.keys(this.rules);
    this.rules = keys.reduce((rules, key)=> {
      return Object.assign(rules, {[key]: new Rule(Object.assign(options.rules[key], {
        context: this.context,
        observe: (state) => {
          update(this, (next)=> {
            next.rules = Object.assign({}, next.rules, {[key]: state});
          });
          if (state.isRejected) {
            this.reject();
          } else if (this.prereqs.every((p)=> p.state.isFulfilled)) {
            this.evaluateCondition(state.input);
          } else if (this.prereqs.some((p)=> p.state.isPending)) {
            this.start();
          } else {
            this.idle();
          }
        }
      }))});
    }, {});

    this.state = new State({
      input: null,
      isRequired: this.isRequired,
      isPending: false,
      isFulfilled: !this.isRequired,
      isRejected: false,
      rules: keys.reduce((rules, key)=> {
        return Object.assign(rules, {[key]: this.rules[key].state });
      }, {})
    });
  }

  get prereqs() {
    return Object.keys(this.rules).map((key)=> this.rules[key]);
  }

  evaluate(input) {
    if (!input && this.isRequired) {
      this.reject("can't be blank");
      return Promise.reject("can't be blank");
    } else if (!input && !this.isRequired) {
      this.fulfill();
      return Promise.resolve();
    } else if (this.prereqs.length) {
      this.idle();
      return Promise.all(this.prereqs.map((p)=> p.evaluate(input)));
    } else {
      return this.evaluateCondition(input);
    }
  }

  start(input) {
    if (this.state.isPending) { return; }
    update(this, {
      input: input,
      isPending: true,
      isFulfilled: false,
      isRejected: false
    });
  }

  fulfill() {
    update(this, {
      isPending: false,
      isFulfilled: true
    });
  }

  reject(error) {
    update(this, {
      isPending: false,
      isFulfilled: false,
      isRejected: true,
      message: error
    });
  }

  idle() {
    if (this.state.isIdle) { return; }
    update(this, {
      isPending: false,
      isFulfilled: false,
      isRejected: false,
      input: undefined,
      message: undefined
    });
  }

  evaluateCondition(input) {
    this.start(input);
    return new Promise((resolve, reject)=> {
      return this.condition.apply(this.context, [input, resolve, reject]);
    }).then(()=> {
      this.fulfill();
    }).catch((error)=> {
      this.reject(error);
    });
  }

}


class State {
  constructor(previous = {}, change = ()=>{}) {
    Object.assign(this, previous);
    if (change.call) {
      change.call(this, this);
    } else {
      Object.assign(this, change);
    }
    // Object.freeze(this);
    // Object.freeze(this.rules);
  }

  get isOptional() {
    return !this.isRequired;
  }

  get isIdle() {
    return !this.isPending && !this.isSettled;
  }

  get isSettled() {
    return this.isFulfilled || this.isRejected;
  }

  get isUnfulfilled() {
    return !this.isFulfilled;
  }

  get all() {
    return Object.keys(this.rules).reduce((rules, key)=> {
      return rules.concat(this.rules[key]);
    }, []);
  }

  get idle() {
    return this.all.filter((rule)=> rule.isIdle);
  }

  get pending() {
    return this.all.filter((rule)=> rule.isPending);
  }

  get fulfilled() {
    return this.all.filter((rule)=> rule.isFulfilled);
  }

  get unfulfilled() {
    return this.all.filter((rule)=> rule.isUnfulfilled);
  }

  get rejected() {
    return this.all.filter((rule)=> rule.isRejected);
  }

  get settled() {
    return this.all.filter((rule)=> rule.isSettled);
  }
}
