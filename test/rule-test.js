import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect } from 'chai';

import Rule from '../src/rule';

describe("Rule", function() {
  beforeEach(function() {
    this.rule = new Rule({
      name: 'is-bob',
      condition: (input, resolve, reject)=> {
        if (input === 'bob') {
          resolve();
        } else {
          reject('is not bob');
        }
      },
      observe: (next)=> { this.state = next; }
    });
    this.state = this.rule.state;
  });
  it("has an initial state", function() {
    expect(this.state.isIdle).to.equal(true);
    expect(this.state.isPending).to.equal(false);
    expect(this.state.isFulfilled).to.equal(false);
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
      expect(this.rule.state.isIdle).to.equal(false);
      expect(this.rule.state.isPending).to.equal(false);
      expect(this.rule.state.isRejected).to.equal(true);
      expect(this.rule.state.message).to.equal('is not bob');
    });
    describe("reseting a rule", function() {
      beforeEach(function() {
        this.initial = this.rule.state;
        this.rule.reset();
      });
      it("emits a new state", function() {
        expect(this.rule.state.isIdle).to.equal(true);
        expect(this.rule.state.isPending).to.equal(false);
        expect(this.rule.state.isFulfilled).to.equal(false);
        expect(this.rule.state.isRejected).to.equal(false);
        expect(this.rule.state.isSettled).to.equal(false);
      });
    });
  });
});
