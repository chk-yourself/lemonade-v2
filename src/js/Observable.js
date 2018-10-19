export class Observable {
  constructor() {
    this.observers = [];
  }

  subscribe(fx) {
    this.observers.push(fx);
  }

  unsubscribe(fx) {
    this.observers = this.observers.filter((subscriber) => subscriber !== fx);
  }

  notify(data) {
    this.observers.forEach((observer) => observer(data));
  }
}
