import PubSub from '../lib/PubSub.js';

export default class Store {
  constructor(props) {
    let self = this;
    this.actions = {};
    this.mutations = {};
    this.state = {};
    this.status = 'resting';
    this.events = new PubSub();

    if (Object.prototype.hasOwnProperty.call(props, 'actions')) {
      this.actions = props.actions;
    }

    if (Object.prototype.hasOwnProperty.call(props, 'mutations')) {
      this.mutations = props.mutations;
    }
    this.state = new Proxy(props.state || {}, {
      set(state, key, value) {
        state[key] = value;

        console.log(`stateChange: ${key}: ${value}`);

        self.events.publish('stateChange', self.state);

        if (self.status !== 'mutation') {
          console.warn(`You should use a mutation to set ${key}`);
        }

        self.status = 'resting';

        return true;
      }
    });
  }

  // Calls an action, which passes a payload to a mutation
  dispatch(actionKey, payload) {

    if (typeof this.actions[actionKey] !== 'function') {
      console.error(`Action "${actionKey} doesn't exist.`);
      return false;
    }

    console.groupCollapsed(`ACTION: ${actionKey}`);

    this.status = 'action';

    // Call the action and pass it the Store context and whatever data was passed
    this.actions[actionKey](this, payload);

    console.groupEnd();

    return true;
  }

  // Calls a mutation, which commits the data to store
  commit(mutationKey, payload) {

    if (typeof this.mutations[mutationKey] !== 'function') {
      console.log(`Mutation "${mutationKey}" doesn't exist`);
      return false;
    }

    this.status = 'mutation';

    const newState = this.mutations[mutationKey](this.state, payload);

    this.state = Object.assign({}, this.state, newState);

    if (Object.prototype.hasOwnProperty.call(this.state, 'todoLists')) {
      localStorage.setItem('todoLists', JSON.stringify(this.state.todoLists));
    }

    return true;
  }
}
