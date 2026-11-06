/**
 * A button icon can come from a configuration record, where it was saved as an Element UI 2 font
 * class (`el-icon-download`). Element Plus wants a component, so a stored name would render nothing.
 * This maps the old names onto the SVG components, and accepts an Element Plus name as well for
 * records saved after the migration.
 */
const LEGACY = {
  'delete': 'Delete', 'refresh': 'Refresh', 'plus': 'Plus', 'download': 'Download',
  'edit': 'Edit', 'copy-document': 'CopyDocument', 'setting': 'Setting', 'search': 'Search',
  'arrow-up': 'ArrowUp', 'arrow-down': 'ArrowDown', 'notebook-2': 'Notebook',
  'info': 'InfoFilled', 'warning': 'WarningFilled', 'user': 'User',
  'refresh-right': 'RefreshRight', 'refresh-left': 'RefreshLeft', 'more': 'MoreFilled',
  'key': 'Key', 'document': 'Document', 'caret-right': 'CaretRight',
  'arrow-right': 'ArrowRight', 'arrow-left': 'ArrowLeft', 'location': 'Location',
  'menu': 'Menu', 'question': 'QuestionFilled', 'upload': 'Upload', 'd-caret': 'DCaret',
}

/** The icon component for a stored name, or undefined when the name is not one we know. */
export function iconComponent(name, icons) {
  if (!name) return undefined
  if (icons && icons[name]) return icons[name]
  const legacy = LEGACY[String(name).replace(/^el-icon-/, '')]
  return legacy && icons ? icons[legacy] : undefined
}
