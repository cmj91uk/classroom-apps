import Userback from '@userback/widget'

const USERBACK_TOKEN = 'A-f6soiddQZ5zm9tHOdKtzYownJ'

/** Load the Userback widget as early as possible during page load. */
export function initUserback() {
  void Userback(USERBACK_TOKEN)
}
