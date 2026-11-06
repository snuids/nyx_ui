import mitt from 'mitt'

// Vue 2 used `new Vue()` as an event bus. Vue 3 dropped $on/$off from component instances, so the
// two buses become mitt emitters. The `$`-prefixed aliases keep the ~18 existing call sites
// (`$globalbus.$emit('messagereceived', …)`) working unchanged.
function createBus() {
  const emitter = mitt()
  emitter.$on = emitter.on
  emitter.$off = emitter.off
  emitter.$emit = emitter.emit
  return emitter
}

export const globalBus = createBus()
export const localBus = createBus()
