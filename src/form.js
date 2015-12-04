import Rule from './rule';
import update from './update';

export default class Form {
  constructor(options = {}) {
    Object.assign(this, {
      observe: function() {},
      rules: {}
    }, options);
    this.rule = new Rule({
      rules: this.rules,
      observe: (ruleState)=> {
        update(this, {
          rule: ruleState
        });
      }
    });
    this.state = new FormState({
      type: this.type,
      rule: this.rule.state
    });
  }

  set(field, input) {
    return this.rule.rules[field].evaluate(input);
  }
}


class FormState {
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

  get isNew() {
    return this.type === "new";
  }

  get isEdit() {
    return this.type === "edit";
  }
  get isSubmittable() {
    return this.rule.isFulfilled;
  }

  get isUnsubmittable() {
    return !this.isSubmittable;
  }
}
