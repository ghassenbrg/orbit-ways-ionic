// Environment for the packaged Capacitor iOS app.
//
// Unlike the web deploy (served same-origin behind nginx at /orbitways/), the
// iOS WebView serves the bundle from capacitor://localhost, so online play must
// talk to the backend over an ABSOLUTE URL. This is the public Orbit Ways
// backend (nginx proxies /orbitways/api + /orbitways/orbitways-websocket to the
// orbit-ways-be service). The player can override it in the Settings screen.
export const environment = {
  production: true,
  basePath: 'https://ghassen.io/orbitways',
};
