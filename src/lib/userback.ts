import Userback, { getUserback, type UserbackWidget } from '@userback/widget'

const USERBACK_TOKEN = 'A-f6soiddQZ5zm9tHOdKtzYownJ'

const userbackReady = Userback(USERBACK_TOKEN).catch((error: unknown) => {
  console.error('Userback failed to load', error)
  return undefined
})

function keepLauncherVisible(widget: UserbackWidget) {
  widget.refresh()
  widget.showLauncher()
}

/** Load the Userback widget as early as possible during page load. */
export function initUserback() {
  void userbackReady
}

/** Tell Userback the URL changed (required for client-side routing). */
export function refreshUserback() {
  const widget = getUserback()
  if (widget) {
    keepLauncherVisible(widget)
    return
  }

  void userbackReady.then((widget) => {
    if (widget) keepLauncherVisible(widget)
  })
}
