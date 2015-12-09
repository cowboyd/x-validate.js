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
    });
  });
});


describe.skip('Form: ', function () {
  function createForm(test, type) {
    function required(input, resolve, reject) {
      if (!!input) {
        resolve();
      } else {
        reject("can't be blank");
      }
    }
    test.form = new Form({
      observe: (state)=> { test.state = state; },
      type: type,
      rules: {
        name: {
          rules: {
            required: {
              condition: required
            }
          }
        },
        description: {
          condition: required
        }
      }
    });
    test.state = test.form.state;
  }

  describe("a create form", function() {
    beforeEach(function() {
      createForm(this, "new");
    });
    it("has a state", function() {
      expect(this.state).to.be.instanceOf(Object);
    });
    it("is a create form", function() {
      expect(this.state.isNew).to.equal(true);
      expect(this.state.isEdit).to.equal(false);
    });
    describe("setting a valid name", function() {
      beforeEach(function() {
        this.initial = this.state;
        return this.form.set('name', 'Jimothy');
      });
      it("emits a new state", function() {
        expect(this.state).to.not.equal(this.initial);
      });
      it("is not submittable", function() {
        expect(this.state.isSubmittable).to.equal(false);
        expect(this.state.isUnsubmittable).to.equal(true);
      });
      it("has an idle top rule", function() {
        expect(this.state.rule.isIdle).to.equal(true);
      });
      it("resolves the name rule", function() {
        expect(this.state.rule.rules.name.isFulfilled).to.equal(true);
      });

      describe("setting a valid description", function() {
        beforeEach(function() {
          this.inital = this.state;
          return this.form.set('description', 'Dat Guy');
        });
        it("emits a new state", function() {
          expect(this.initial).to.not.equal(this.state);
        });
        it("is submittable", function() {
          expect(this.state.isSubmittable).to.equal(true);
          expect(this.state.isUnsubmittable).to.equal(false);
        });
        it("fulfills the top rule", function() {
          expect(this.state.rule.isFulfilled).to.equal(true);
        });
      });

    });

  });

  describe("an edit form", function() {

  });

  describe("an unknown type of form", function() {
    before(function() {
      this.type = "what the heck?";
    });

  });


});
