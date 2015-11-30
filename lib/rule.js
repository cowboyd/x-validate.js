'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _defineProperty = require('babel-runtime/helpers/define-property')['default'];

var _Object$assign3 = require('babel-runtime/core-js/object/assign')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Object$freeze = require('babel-runtime/core-js/object/freeze')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _update = require('./update');

var _update2 = _interopRequireDefault(_update);

var Rule = (function () {
  function Rule() {
    var _this = this;

    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Rule);

    options = _Object$assign3({
      condition: function condition() {
        return _Promise.resolve();
      },
      observe: function observe() {},
      rules: {}
    }, options);
    this.observe = options.observe;
    this.condition = options.condition;

    var keys = _Object$keys(options.rules);
    this.rules = keys.reduce(function (rules, key) {
      return _Object$assign3(rules, _defineProperty({}, key, new Rule(_Object$assign3(options.rules[key], {
        observe: function observe(state) {
          (0, _update2['default'])(_this, function (next) {
            next.rules[key] = state;
          });
          if (_this.prereqs.every(function (p) {
            return p.state.isFulfilled;
          })) {
            _this.evaluateCondition(state.input);
          }
        }
      }))));
    }, {});

    this.state = new State({
      input: null,
      isPending: false,
      isFulfilled: false,
      isRejected: false,
      rules: keys.reduce(function (rules, key) {
        return _Object$assign3(rules, _defineProperty({}, key, _this.rules[key].state));
      }, {})
    });
  }

  _createClass(Rule, [{
    key: 'evaluate',
    value: function evaluate(input) {
      if (this.prereqs.length) {
        this.reset();
        return _Promise.all(this.prereqs.map(function (p) {
          return p.evaluate(input);
        }));
      } else {
        return this.evaluateCondition(input);
      }
    }
  }, {
    key: 'evaluateCondition',
    value: function evaluateCondition(input) {
      var _this2 = this;

      (0, _update2['default'])(this, {
        isPending: true,
        isFulfiled: false,
        isRejected: false
      });
      return new _Promise(function (resolve, reject) {
        return _this2.condition(input, resolve, reject);
      }).then(function () {
        (0, _update2['default'])(_this2, {
          isPending: false,
          isFulfilled: true
        });
      })['catch'](function (error) {
        (0, _update2['default'])(_this2, {
          isPending: false,
          isRejected: true,
          message: error
        });
      });
    }
  }, {
    key: 'reset',
    value: function reset() {
      (0, _update2['default'])(this, {
        isPending: false,
        isFulfilled: false,
        isRejected: false
      });
    }
  }, {
    key: 'prereqs',
    get: function get() {
      var _this3 = this;

      return _Object$keys(this.rules).map(function (key) {
        return _this3.rules[key];
      });
    }
  }]);

  return Rule;
})();

exports['default'] = Rule;

var State = (function () {
  function State() {
    var previous = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var change = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

    _classCallCheck(this, State);

    _Object$assign3(this, previous);
    if (change.call) {
      change.call(this, this);
    } else {
      _Object$assign3(this, change);
    }
    _Object$freeze(this);
  }

  _createClass(State, [{
    key: 'isIdle',
    get: function get() {
      return !this.isPending && !this.isSettled;
    }
  }, {
    key: 'isSettled',
    get: function get() {
      return this.isFulfilled || this.isRejected;
    }
  }, {
    key: 'all',
    get: function get() {
      var _this4 = this;

      return _Object$keys(this.rules).reduce(function (rules, key) {
        return rules.concat(_this4.rules[key]);
      }, []);
    }
  }, {
    key: 'idle',
    get: function get() {
      return this.all.filter(function (rule) {
        return rule.isIdle;
      });
    }
  }, {
    key: 'pending',
    get: function get() {
      return this.all.filter(function (rule) {
        return rule.isPending;
      });
    }
  }, {
    key: 'fulfilled',
    get: function get() {
      return this.all.filter(function (rule) {
        return rule.isFulfilled;
      });
    }
  }, {
    key: 'rejected',
    get: function get() {
      return this.all.filter(function (rule) {
        return rule.isRejected;
      });
    }
  }, {
    key: 'settled',
    get: function get() {
      return this.all.filter(function (rule) {
        return rule.isSettled;
      });
    }
  }]);

  return State;
})();

module.exports = exports['default'];