import Form from '../src/form';
import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';

describe("Custom Object Reader", function() {
  beforeEach(function() {
    this.form = new Form({
      read(object, key) {
        if (typeof object.get === 'function') {
          return object.get(key);
        } else {
          return object[key];
        }
      },
      object: {
        get(key) {
          return `value-of-${key}`;
        }
      },
      rules: {
        first: {},
        second: {}
      }
    });
  });
  it("reads the value of a property using the custom reader", function() {
    expect(this.form.state.value).to.deep.equal({
      first: 'value-of-first',
      second: 'value-of-second'
    });
  });

});
