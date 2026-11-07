/**
 * `vue-browser-geolocation` has no Vue 3 release; Form.vue only needs a promise around
 * navigator.geolocation, which is what `$geolocation.getCurrentPosition(options)` provides.
 */
/* `vue-browser-geolocation` exposait `Vue.prototype.$getLocation(options)` ; les formulaires
 * l'appellent (`this.$getLocation({...}).then(...)`). Sans cet alias, chaque soumission levait
 * `TypeError: this.$getLocation is not a function` et le bouton restait bloque sur son spinner. */
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
