import Form from '../src/form';
import { describe, before, beforeEach, it } from 'mocha';
import { expect } from 'chai';

function createForm(test, object) {
  test.form = new Form({
    object: object,
    observe: (state)=> { test.state = state; },
    rules: {
      name: {
        isRequired: true
      },
      description: {
        isRequired: true
      },
      gender: {
        isRequired: false,
        condition: (input, resolve, reject)=> {
          if (input === 'M' || input === 'F') {
            resolve();
          } else {
            reject("must be M/F");
          }
        }
      }
    }
  });
  test.state = test.form.state;
}

describe("Form: ", function() {
  describe("a new form", function() {
    beforeEach(function() {
      createForm(this, null);
    });
    it("has an initial value", function() {
      expect(this.state.value).to.deep.equal({
        name: null,
        description: null,
        gender: null
      });
    });
    it("has a current buffer", function() {
      expect(this.state.buffer).to.deep.equal({
        name: null,
        description: null,
        gender: null
      });
    });
    it("starts out dirty", function() {
      expect(this.state.isDirty).to.equal(true);
      expect(this.state.isClean).to.equal(false);
    });
    it("starts out as idle", function() {
      expect(this.state.isIdle).to.equal(true);
      expect(this.state.isFulfilled).to.equal(false);
      expect(this.state.isPending).to.equal(false);
      expect(this.state.isRejected).to.equal(false);
    });
    it("is not submittable", function() {
      expect(this.state.isSubmittable).to.equal(false);
      expect(this.state.isUnsubmittable).to.equal(true);
    });
    it("is not submitting", function() {
      expect(this.state.isSubmitting).to.equal(false);
    });
    describe("entering in valid values", function() {
      beforeEach(function() {
        this.initial = this.state;
        return this.form.set('name', 'Jimothy').then(()=> {
          return this.form.set('description', 'Dat Guy');
        });
      });
      it("emits a new state", function() {
        expect(this.state).to.not.equal(this.initial);
      });
      it("becomes submittable", function() {
        expect(this.state.isSubmittable).to.equal(true);
      });

      describe("subitting the form asynchronously", function() {
        beforeEach(function() {
          this.initial = this.state;
          this.promise = this.form.submit((buffer)=> {
            this.buffer = buffer;
            return new Promise((resolve, reject)=> {
              this.resolve = resolve;
              this.reject = reject;
            });
          });
        });
        it("emits a new state", function() {
          expect(this.state).not.to.equal(this.initial);
        });
        it("marks itself as submitting", function() {
          expect(this.state.isSubmitting).to.equal(true);
        });
        it("is no longer submittable", function() {
          expect(this.state.isSubmittable).to.equal(false);
        });
        it("passes the current buffer to the submit action", function() {
          expect(this.buffer).to.deep.equal({
            name: "Jimothy",
            description: "Dat Guy",
            gender: null
          });
        });
        describe("when the action resolves", function() {
          beforeEach(function() {
            this.initial = this.state;
            this.resolve();
            return this.promise;
          });
          it("emits a new state", function() {
            expect(this.state).not.to.equal(this.initial);
          });
          it("is still not submittable", function() {
            expect(this.state.isSubmittable).to.equal(false);
          });
          it("resets the form", function() {
            expect(this.state.isClean).to.equal(false);
          });
        });
        describe("when the action rejects", function() {
          beforeEach(function() {
            this.initial = this.state;
            this.reject("nope");
            return this.promise.catch(()=> {});
          });
          it("emits a new state", function() {
            expect(this.state).not.to.equal(this.initial);
          });
          it("has an error", function() {
            expect(this.state.error).to.equal("nope");
          });
          it("is still submittable", function() {
            expect(this.state.isSubmittable).to.equal(true);
          });
          it("is not submitting", function() {
            expect(this.state.isSubmitting).to.equal(false);
          });
        });
      });

      describe("submitting the form synchronously", function() {
        beforeEach(function() {
          this.initial = this.state;
          return this.form.submit((buffer)=> { this.buffer = buffer;});
        });
        it("emits a new state", function() {
          expect(this.state).not.to.equal(this.initial);
        });
        it("passes the buffer to the submit action", function() {
          expect(this.buffer).to.deep.equal({
            name: "Jimothy",
            description: "Dat Guy",
            gender: null
          });
        });
        it("is not submittable", function() {
          expect(this.state.isSubmittable).to.equal(false);
        });
      });

      describe("submitting the form synchronously with an error", function() {
        beforeEach(function() {
          this.initial = this.state;
          return this.form.submit(()=> { throw 'nope';}).catch(()=> {});
        });
        it("emits a new state", function() {
          expect(this.state).not.to.equal(this.initial);
        });
        it("is submittable", function() {
          expect(this.state.isSubmittable).to.equal(true);
        });
        it("captures the error mesages", function() {
          expect(this.state.error).to.equal('nope');
        });
      });
    });
  });

  describe("an edit form", function() {
    beforeEach(function() {
      createForm(this, {
        name: "Jimothy",
        description: "That guy",
        gender: null
      });
    });
    it("is not submittable", function() {
      expect(this.state.isUnsubmittable).to.equal(true);
      expect(this.state.isSubmittable).to.equal(false);
    });
    it("starts out as clean", function() {
      expect(this.state.isClean).to.equal(true);
    });
    it("contains the initial values in the buffer", function() {
      expect(this.state.buffer).to.deep.equal({
        name: "Jimothy",
        description: "That guy",
        gender: null
      });
    });
    it("starts out as idle", function() {
      expect(this.state.isIdle).to.equal(true);
    });
    describe("setting the gender to M", function() {
      beforeEach(function() {
        this.initial = this.form.state;
        return this.form.set('gender', 'M');
      });
      it("emits a new state", function() {
        expect(this.state).not.to.equal(this.initial);
      });
      it("is submittable", function() {
        expect(this.state.isSubmittable).to.equal(true);
      });
      it("is dirty", function() {
        expect(this.state.isDirty).to.equal(true);
      });
      it("is fulfilled", function() {
        expect(this.state.isFulfilled).to.equal(true);
      });
      describe("submitting the form synchronously", function() {
        beforeEach(function() {
          this.initial = this.state;
          return this.form.submit((buffer)=> { this.buffer = buffer;});
        });
        it("resets the form", function() {
          expect(this.state.isClean).to.equal(true);
        });
      });
    });

  });
});
