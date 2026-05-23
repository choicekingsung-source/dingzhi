export function createUndoStack() {
  return {
    history: [],
    push(snapshot) {
      this.history.unshift(snapshot);
      this.history = this.history.slice(0, 5);
    },
    pop() {
      return this.history.shift() || null;
    },
    peek() {
      return this.history[0] || null;
    },
  };
}
