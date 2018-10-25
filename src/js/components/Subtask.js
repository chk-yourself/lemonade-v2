export default class Subtask {
  constructor(text) {
    this.text = text;
    this.isDone = false;
  }

  toggleDone() {
    this.isDone = !this.isDone;
  }
}