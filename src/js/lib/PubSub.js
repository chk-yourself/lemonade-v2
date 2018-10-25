export default class PubSub {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!Object.prototype.hasOwnProperty.call(this.events, event)) {
      this.events[event] = [];
    }
    return this.events[event].push(callback);
  }

  unsubscribe(event, callback) {
    if (Object.prototype.hasOwnProperty.call(this.events, event)) {
      const subscribers = this.events[event];
      this.events[event] = subscribers.filter(
        (subscriber) => subscriber !== callback
      );
    }
  }

  publish(event, data = {}) {
    if (!Object.prototype.hasOwnProperty.call(this.events, event)) {
      return [];
    }
    return this.events[event].map((callback) => callback(data));
  }
}
