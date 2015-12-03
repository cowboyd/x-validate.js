import update from './update';

export default class Rule {
  constructor(options = {}) {
    Object.assign(this, {
      condition: function() { return Promise.resolve(); },
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
          if (this.prereqs.every((p)=> p.state.isFulfilled)) {
            this.evaluateCondition(state.input);
          } else if (state.isRejected) {
            update(this, {
              isPending: false,
              isFulfilled: false,
              isRejected: true
            });
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
      input: input,
      isPending: true,
      isFulfilled: false,
      isRejected: false
    });
    return new Promise((resolve, reject)=> {
      return this.condition.apply(this.context, [input, resolve, reject]);
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
    // Object.freeze(this);
    // Object.freeze(this.rules);
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
