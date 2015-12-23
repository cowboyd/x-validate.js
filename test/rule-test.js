import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect } from 'chai';

import Rule from '../src/rule';

describe("Rules:", function () {
  describe("Optional Rules:", function() {
    beforeEach(function() {
      this.rule = new Rule({
        isRequired: false,
        condition: isBob,
        observe: (state)=> { this.state = state; }
      });
      this.state = this.rule.state;
    });
    it("starts out as fulfilled", function() {
      expect(this.state.isFulfilled).to.equal(true);
    });
    it("is marked as optional", function() {
      expect(this.state.isOptional).to.equal(true);
      expect(this.state.isRequired).to.equal(false);
    });
    describe("evaluating the rule on invalid input", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        return this.rule.evaluate('not bob');
      });
      it("emits a new state", function() {
        expect(this.rule.state).not.to.equal(this.initial);
      });
      it("is marked as rejected", function() {
        expect(this.state.isRejected).to.equal(true);
      });
    });
    describe("evaluating the rule on valid input", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        return this.rule.evaluate('bob');
      });
      it("emits a new state", function() {
        expect(this.rule.state).not.to.equal(this.initial);
      });
      it("marks the rule as fulfilled", function() {
        expect(this.state.isFulfilled).to.equal(true);
        expect(this.state.isRejected).to.equal(false);
      });
      describe("then evaluating the rule on null", function() {
        beforeEach(function() {
          this.initial = this.rule.state;
          return this.rule.evaluate(null);
        });
        it("emits a new state", function() {
          expect(this.rule.state).not.to.equal(this.initial);
        });
        it("marks the rule as fulfilled", function() {
          expect(this.state.isFulfilled).to.equal(true);
        });
      });

    });
  });

  describe("Required Rules", function() {
    beforeEach(function() {
      this.rule = new Rule({
        isRequired: true,
        condition: isBob,
        observe: (state)=> { this.state = state; }
      });
      this.state = this.rule.state;
    });

    it("starts out as idle", function() {
      expect(this.state.isFulfilled).to.equal(false);
      expect(this.state.isIdle).to.equal(true);
    });

    describe("evaluating the rule on invalid input", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        return this.rule.evaluate('not bob');
      });
      it("emits a new state", function() {
        expect(this.rule.state).not.to.equal(this.initial);
      });
      it("is marked as rejected", function() {
        expect(this.state.isRejected).to.equal(true);
      });
      it("contains a mesage", function() {
        expect(this.state.message).to.equal("is not bob");
      });

      describe("and then evaluating on different input", function() {
        beforeEach(function() {
          this.rule.evaluate('different string');
        });
        it("resets the message", function() {
          expect(this.state.message).to.equal(null);
        });
      });

    });
    describe("evaluating the rule on valid input", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        return this.rule.evaluate('bob');
      });
      it("emits a new state", function() {
        expect(this.rule.state).not.to.equal(this.initial);
      });
      it("marks the rule as fulfilled", function() {
        expect(this.state.isFulfilled).to.equal(true);
        expect(this.state.isRejected).to.equal(false);
      });
      describe("then evaluating the rule on null", function() {
        beforeEach(function() {
          this.initial = this.rule.state;
          return this.rule.evaluate(null).catch(()=> this.wasRejected = true);
        });
        it("emits a new state", function() {
          expect(this.rule.state).not.to.equal(this.initial);
        });
        it("marks the rule as fulfilled", function() {
          expect(this.state.isFulfilled).to.equal(false);
          expect(this.state.isRejected).to.equal(true);
        });
        it("rejects the promise returned by evaluate", function() {
          expect(this.wasRejected).to.equal(true);
        });
      });

    });
  });

  describe("asynchronous rules", function() {
    beforeEach(function() {
      this.rule = new Rule({
        observe: (state)=> { this.state = state; },
        condition: (input, resolve, reject)=> {
          this.resolve = resolve;
          this.reject = reject;
        }
      });
      this.state = this.rule.state;
    });
    describe("evaluating it", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        this.promise = this.rule.evaluate('does not matter');
      });
      it("emits a new state", function() {
        expect(this.rule.state).not.to.equal(this.initial);
      });
      it("evaluates the condition", function() {
        expect(this.resolve).to.be.instanceOf(Function);
        expect(this.reject).to.be.instanceOf(Function);
      });
      it("marks itself as pending", function() {
        expect(this.state.isPending).to.equal(true);
        expect(this.state.isFulfilled).to.equal(false);
        expect(this.state.isIdle).to.equal(false);
      });
      describe("resolving the promise", function() {
        beforeEach(function() {
          this.initial = this.rule.state;
          this.resolve();
          return this.promise;
        });
        it("emits a new state", function() {
          expect(this.rule.state).not.to.equal(this.initial);
        });
        it("is marked as fulfilled", function() {
          expect(this.state.isFulfilled).to.equal(true);
          expect(this.state.isPending).to.equal(false);
        });
      });
      describe("rejecting the promise", function() {
        beforeEach(function() {
          this.initial = this.rule.state;
          this.reject("nope");
          return this.promise.catch(()=> {});
        });
        it("emits a new state", function() {
          expect(this.rule.state).not.to.equal(this.initial);
        });
        it("is marked as rejected", function() {
          expect(this.state.isRejected).to.equal(true);
          expect(this.state.isPending).to.equal(false);
        });
        it("captures the error message", function() {
          expect(this.state.message).to.equal("nope");
        });
      });

    });

  });

  describe("sub-rules", function() {
    beforeEach(function() {
      this.rule = new Rule({
        isRequired: true,
        condition: (input, resolve, reject)=> {
          if (input.length >= 2) {
            resolve();
          } else {
            reject("must be longer than 2");
          }
        },
        rules: {
          isBob: {
            isRequired: true,
            name: 'is-bob',
            condition: isBob
          }
        },
        observe: (next)=> { this.state = next; }
      });
    });
    it("can access dependents as a list or by name", function() {
      expect(this.rule.state.rules.isBob).to.equal(this.rule.state.all[0]);
    });
    it("has an initial state for it and its children", function() {
      expect(this.rule.state.isIdle).to.equal(true);
      expect(this.rule.state.all.length).to.equal(1);
      expect(this.rule.state.idle).to.deep.equal(this.rule.state.all);
      expect(this.rule.state.idle).to.deep.equal(this.rule.state.unfulfilled);
      let rule = this.rule.state.rules.isBob;
      expect(rule.isIdle).to.equal(true);
    });
    describe("when the parent rule is satisfied", function() {
      beforeEach(function() {
        return this.rule.evaluate('bob');
      });
      it("emits a new state with the child rule", function() {
        expect(this.state.rules.isBob.isFulfilled).to.equal(true);
      });
    });
    describe("when parent rule is not satisfied", function() {
      beforeEach(function() {
        return this.rule.evaluate('Jason');
      });
      it("emits a new state and is rejected", function() {
        expect(this.state.isRejected).to.equal(true);
      });
    });
  });

});

function isBob(input, resolve, reject) {
  if (input === 'bob') {
    resolve();
  } else {
    reject('is not bob');
  }
}
