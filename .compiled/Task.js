'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Task = function () {
  function Task(text) {
    var obj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, Task);

    if (!obj) {
      this.text = text;
      this.done = false;
      this.subtasks = [];
      this.note = '';
      this.tags = [];
      this.id = uniqueID();
      this.dueDate = null;
      this.isPriority = false;
      this.dateCreated = new Date();
      this.lastModified = null;
    } else {
      this.text = obj.text;
      this.done = obj.done;
      this.subtasks = obj.subtasks;
      this.note = obj.note;
      this.tags = obj.tags;
      this.id = obj.id;
      this.dueDate = obj.dueDate;
      this.isPriority = obj.isPriority;
      this.dateCreated = obj.dateCreated;
      this.lastModified = obj.lastModified;
    }
  }

  _createClass(Task, [{
    key: 'elem',
    get: function get() {
      return document.getElementById(this.id);
    }
  }, {
    key: 'tagSummary',
    get: function get() {
      return this.tags.map(function (tag) {
        return tag.text;
      }).join(', ');
    }
  }, {
    key: 'isDueToday',
    get: function get() {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(this.dueDate).valueOf() === today.valueOf();
    }
  }, {
    key: 'isDueTomorrow',
    get: function get() {
      var today = new Date();
      var currentDay = today.getDate();
      var currentMonthIndex = today.getMonth();
      var currentYear = today.getFullYear();
      var nextYear = currentYear + 1;
      var currentMonth = monthsArr[currentMonthIndex];
      var nextMonthIndex = currentMonth.name !== 'December' ? currentMonthIndex + 1 : 0;
      if (currentMonth.name === 'February') {
        currentMonth.daysTotal = isLeapYear(currentYear) ? 29 : 28;
      }
      var tomorrow = currentDay < currentMonth.daysTotal ? new Date(currentYear, currentMonthIndex, currentDay + 1) : nextMonthIndex !== 0 ? new Date(currentYear, nextMonthIndex, 1) : new Date(nextYear, nextMonthIndex, 1);
      return new Date(this.dueDate).valueOf() === tomorrow.valueOf();
    }
  }, {
    key: 'dueDateText',
    get: function get() {
      var dueDate = new Date(this.dueDate);
      var dueMonthIndex = dueDate.getMonth();
      var dueMonthAbbrev = monthsArr[dueMonthIndex].abbrev;
      var dueDay = dueDate.getDate();
      return dueMonthAbbrev + ' ' + dueDay;
    }
  }, {
    key: 'dueMonthAbbrev',
    get: function get() {
      var dueDate = new Date(this.dueDate);
      var dueMonthIndex = dueDate.getMonth();
      return monthsArr[dueMonthIndex].abbrev;
    }
  }, {
    key: 'dueDayNumStr',
    get: function get() {
      var dueDate = new Date(this.dueDate);
      var dayNum = dueDate.getDate();
      return dayNum > 9 ? '' + dayNum : '0' + dayNum;
    }
  }, {
    key: 'dueYearStr',
    get: function get() {
      var dueDate = new Date(this.dueDate);
      return '' + dueDate.getFullYear();
    }
  }, {
    key: 'dueDayOfWeek',
    get: function get() {
      var dueDate = new Date(this.dueDate);
      return this.isDueToday ? 'Today' : this.isDueTomorrow ? 'Tomorrow' : weekdaysArr[dueDate.getDay()].full;
    }
  }]);

  return Task;
}();

exports.default = Task;
//# sourceMappingURL=Task.js.map