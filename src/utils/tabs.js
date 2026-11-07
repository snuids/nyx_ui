/**
 * The name of a tab pane, whichever way Element Plus hands it over.
 *
 * Element UI 2 passed the pane component itself to `@tab-click`, so `tab.name` worked. Element Plus
 * passes a `TabsPaneContext`: the name lives in `paneName`, and `name` is undefined. Reading
 * `tab.name` therefore produced "/main/undefined", the router matched `/main/:recid`, and the view
 * tried to load an application that does not exist — the console crashed on the first tab click.
 */
export function paneNameOf(pane) {
  if (!pane) return undefined
  if (pane.paneName !== undefined) return pane.paneName
  if (pane.props && pane.props.name !== undefined) return pane.props.name
  return pane.name
}
