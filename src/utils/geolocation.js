/**
 * `vue-browser-geolocation` has no Vue 3 release; Form.vue only needs a promise around
 * navigator.geolocation, which is what `$geolocation.getCurrentPosition(options)` provides.
 */
/* `vue-browser-geolocation` exposed `Vue.prototype.$getLocation(options)`; the forms call it
 * (`this.$getLocation({...}).then(...)`). Without this alias, every submission raised
 * `TypeError: this.$getLocation is not a function` and the button stayed stuck on its spinner. */
export const getLocation = (options = {}) => geolocation.getCurrentPosition(options)

export const geolocation = {
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('geolocation is not available'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    })
  },
}
