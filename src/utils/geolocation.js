/**
 * `vue-browser-geolocation` has no Vue 3 release; Form.vue only needs a promise around
 * navigator.geolocation, which is what `$geolocation.getCurrentPosition(options)` provides.
 */
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
