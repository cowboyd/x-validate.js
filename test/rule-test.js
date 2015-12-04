import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect } from 'chai';

import Rule from '../src/rule';

describe("Rule", function() {
  function isBob(input, resolve, reject) {
    if (input === 'bob') {
      resolve();
    } else {
      reject('is not bob');
    }
  }
  beforeEach(function() {
    this.rule = new Rule({
      name: 'is-bob',
      condition: isBob,
      observe: (next)=> { this.state = next; }
    });
    this.state = this.rule.state;
  });
  it("has an initial state", function() {
    expect(this.state.isIdle).to.equal(true);
    expect(this.state.isPending).to.equal(false);
    expect(this.state.isFulfilled).to.equal(false);
    expect(this.state.isUnfulfilled).to.equal(true);
    expect(this.state.isRejected).to.equal(false);
    expect(this.state.isSettled).to.equal(false);
  });
  describe("running the rule on valid input", function() {
    beforeEach(function() {
      this.initial = this.rule.state;
      this.promise = this.rule.evaluate('bob');
    });
    afterEach(function() {
      this.initial = this.rule.state;
    });
    it("returns a promise", function() {
      expect(this.promise.then).to.be.instanceOf(Function);
    });
    it("emits a new state", function() {
      expect(this.initial).to.not.equal(this.rule.state);
    });
    it("indicates that it is no longer idle, but pending", function() {
      expect(this.state.isIdle).to.equal(false);
      expect(this.state.isPending).to.equal(true);
    });
    describe("when the promise resolves", function() {
      beforeEach(function() {
        return this.promise;
      });
      it("emits a new state", function() {
        expect(this.initial).to.not.equal(this.rule.state);
      });
      it("indicates that it is no longer pending, but resolved", function() {
        expect(this.rule.state.isPending).to.equal(false);
        expect(this.rule.state.isFulfilled).to.equal(true);
        expect(this.rule.state.isUnfulfilled).to.equal(false);
      });
    });
  });
  describe("running the rule on an invalid input", function() {
    beforeEach(function() {
      this.initial = this.rule.state;
    });
    beforeEach(function() {
      return this.rule.evaluate('kevin').catch((err)=> {this.error = err; });
    });
    it("emits a new state", function() {
      expect(this.initial).to.not.equal(this.rule.state);
    });
    it("indicates that it is not idle but rejected", function() {
      expect(this.state.isIdle).to.equal(false);
      expect(this.state.isPending).to.equal(false);
      expect(this.state.isRejected).to.equal(true);
      expect(this.state.message).to.equal('is not bob');
    });
    describe("reseting a rule", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        this.rule.idle();
      });
      it("emits a new state", function() {
        expect(this.state.isIdle).to.equal(true);
        expect(this.state.isPending).to.equal(false);
        expect(this.state.isFulfilled).to.equal(false);
        expect(this.state.isRejected).to.equal(false);
        expect(this.state.isSettled).to.equal(false);
        expect(this.state.input).to.equal(undefined);
        expect(this.state.message).to.equal(undefined);
      });
    });
  });
  describe("with sub-rules", function() {
    beforeEach(function() {
      this.rule = new Rule({
        name: 'required',
        condition: (input, resolve, reject)=> {
          if (!!input) {
            resolve();
          } else {
            reject("can't be blank");
          }
        },
        rules: {
          isBob: {
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
