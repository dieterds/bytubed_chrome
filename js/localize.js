$(document).ready(function () {
  var objects = document.getElementsByTagName('*'), i;
  for (i = 0; i < objects.length; i++) {
    if (objects[i].dataset && objects[i].dataset.message) {
      objects[i].innerHTML = chrome.i18n.getMessage(objects[i].dataset.message);
    }
  }
});
