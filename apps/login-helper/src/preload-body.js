// Concatenated after capture.js; no remote page receives a Node/IPC API.
const { ipcRenderer } = require('electron');
if (isOfficialPage(location.href)) {
  let reported = false;
  observeEmbeddings(document, () => location.href, MutationObserver,
    value => ipcRenderer.send('ddclassico-launch-session', value),
    () => {
      if (!reported) ipcRenderer.send('ddclassico-capture-problem');
      reported = true;
    });
  ipcRenderer.send('ddclassico-observer-ready');
}
