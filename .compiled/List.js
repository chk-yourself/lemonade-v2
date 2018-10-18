"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var List = function () {
  function List(name, folder) {
    var obj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, List);

    if (!obj) {
      this.name = name;
      this.folder = folder;
      this.id = camelCased(name) + "-" + Date.now();
      this.tasks = [];
    } else {
      this.name = obj.name;
      this.folder = obj.folder;
      this.id = obj.id;
      this.tasks = obj.tasks;
    }
  }

  _createClass(List, [{
    key: "getTask",
    value: function getTask(taskId) {
      return this.tasks.find(function (task) {
        return task.id === taskId;
      });
    }
  }, {
    key: "findTaskIndex",
    value: function findTaskIndex(taskId) {
      return this.tasks.findIndex(function (task) {
        return task.id === taskId;
      });
    }
  }, {
    key: "elem",
    get: function get() {
      return document.getElementById(this.id);
    }
  }, {
    key: "activeTaskCount",
    get: function get() {
      return this.tasks.filter(function (task) {
        return !task.done;
      }).length;
    }
  }]);

  return List;
}();

exports.default = List;
//# sourceMappingURL=List.js.map