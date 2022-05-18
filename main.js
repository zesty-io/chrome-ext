// this is the code which will be injected into a given page...

;(function () {
   var head = document.getElementsByTagName("head")[0]
   var script = document.createElement("script")
   script.type = "text/javascript"

   let developmentMode =
      window.location.hostname === "test.zesty.io" ||
      window.location.hostname === "localhost"

   let prodSrc =
      "https://cdn.jsdelivr.net/gh/zesty-io/explorer@latest/dist/explorer.production.js"

   let devSrc = "http://test.zesty.io:5500/dist/explorer.production.js"

   script.src = developmentMode ? devSrc : prodSrc
   head.appendChild(script)
})()
