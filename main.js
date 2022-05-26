// this is the code which will be injected into a given page...

(function () {
  var head = document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.onload = function () {
    callFunctionFromScript();
  };

  script.src =
    "https://cdn.jsdelivr.net/gh/zesty-io/live-editor@latest/dist/live-editor.production.js";
  head.appendChild(script);
})();
