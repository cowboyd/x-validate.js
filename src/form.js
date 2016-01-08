import Rule from './rule';
import update from './update';

export default class Form {
  constructor(options = {}) {
    Object.assign(this, {
      observe: function() {},
      rules: {},
      object: null,
      read(object, key) {
        return object[key];
      }
    }, options);
    this.rule = new Rule({
      isRequired: Object.keys(this.rules).some((k)=> {
        return this.rules[k].isRequired;
      }),
      rules: this.rules,
      observe: (ruleState)=> {
        update(this, {
          rule: ruleState
        });
      }
    });

    this.state = new FormState({
      object: this.object,
      rule: this.rule.state,
      read: this.read,
      isSubmitting: false
    });
  }

  reset() {
    this.rule = new Rule({
      isRequired: Object.keys(this.rules).some((k)=> {
        return this.rules[k].isRequired;
      }),
      rules: this.rules,
      observe: (ruleState)=> {
        update(this, {
          rule: ruleState
        });
      }
    });

    this.state = new FormState({
      object: this.object,
      rule: this.rule.state,
      read: this.read,
      isSubmitting: false
    });
    update(this, this.state);
  }

  set(field, input) {
    let wasClean = this.state.isClean;
    update(this, this.state.set(field, input));

    if (wasClean) {
      let keys = Object.keys(this.state.buffer);
      let rules = this.rule.rules;
      let buffer = this.state.buffer;
      return Promise.all(keys.map((key)=> rules[key].evaluate(buffer[key])));
    } else {
      return this.rule.rules[field].evaluate(input);
    }
  }

  submit(action) {
    update(this, this.state.submit());

    try {
      let result = action(this.state.buffer);
      if (result && result.then) {
        return result.then(()=> {
          this.reset();
        }).catch((error)=> {
          update(this, this.state.reject(error));
        });
      } else {
        this.reset();
        return Promise.resolve();
      }
    } catch (e) {
      update(this, this.state.reject(e));
      return Promise.reject(e);
    }
  }
}

class FormState {
  constructor(previous = {}, change = ()=>{}) {
    Object.assign(this, {}, previous);
    if (change.call) {
      change.call(this, this);
    } else {
      Object.assign(this, change);
    }

    this.buffer = this.buffer || this.value;

    // Object.freeze(this);
    // Object.freeze(this.rules);
  }

  set(key, value) {
    return new FormState(this, {
      buffer: Object.assign({}, this.buffer, {
        [key]: value
      })
    });
  }

  submit() {
    return new FormState(this, {
      isSubmitting: true
    });
  }

  reject(error) {
    return new FormState(this, {
      isSubmitting: false,
      error: error
    });
  }

  get value() {
    if (!this._value) {
      this._value =  Object.keys(this.rule.rules).reduce((buffer, name)=> {
        let value = null;
        if (this.object) {
          value = this.read(this.object, name);
        }
        return Object.assign(buffer, {[name]: value});
      }, {});
    }
    return this._value;
  }

  get isDirty() {
    return this.object == null || this.value !== this.buffer;
  }

  get isClean() {
    return !this.isDirty;
  }

  get isIdle() {
    return this.rule.isIdle;
  }

  get isPending() {
    return this.rule.isPending;
  }

  get isFulfilled() {
    return this.rule.isFulfilled;
  }

  get isRejected() {
    return this.rule.isRejected;
  }

  get isSubmittable() {
    return this.isDirty && !this.isSubmitting && this.rule.isFulfilled;
  }

  get isUnsubmittable() {
    return !this.isSubmittable;
  }
}
