import update from './update';

export default class Rule {
  constructor(options = {}) {
    options = Object.assign({
      condition: function() { return Promise.resolve(); },
      observe: function() {},
      rules: {}
    }, options);
    this.observe = options.observe;
    this.condition = options.condition;

    let keys = Object.keys(options.rules);
    this.rules = keys.reduce((rules, key)=> {
      return Object.assign(rules, {[key]: new Rule(Object.assign(options.rules[key], {
        observe: (state) => {
          update(this, (next)=> {
            next.rules[key] = state;
          });
          if (this.prereqs.every((p)=> p.state.isFulfilled)) {
            this.evaluateCondition(state.input);
          }
        }
      }))});
    }, {});

    this.state = new State({
      input: null,
      isPending: false,
      isFulfilled: false,
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
    if (this.prereqs.length) {
      this.reset();
      return Promise.all(this.prereqs.map((p)=> p.evaluate(input)));
    } else {
      return this.evaluateCondition(input);
    }
  }

  evaluateCondition(input) {
    update(this, {
      isPending: true,
      isFulfiled: false,
      isRejected: false
    });
    return new Promise((resolve, reject)=> {
      return this.condition(input, resolve, reject);
    }).then(()=> {
      update(this, {
        isPending: false,
        isFulfilled: true
      });
    }).catch((error)=> {
      update(this, {
        isPending: false,
        isRejected: true,
        message: error
      });
    });
  }

  reset() {
    update(this, {
      isPending: false,
      isFulfilled: false,
      isRejected: false
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
    Object.freeze(this);
  }

  get isIdle() {
    return !this.isPending && !this.isSettled;
  }

  get isSettled() {
    return this.isFulfilled || this.isRejected;
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

  get rejected() {
    return this.all.filter((rule)=> rule.isRejected);
  }

  get settled() {
    return this.all.filter((rule)=> rule.isSettled);
  }
}
