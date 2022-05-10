// this is the code which will be injected into a given page...

;(function () {
   var checkZestyDomain = window.location.host.includes("zesty")
   var head = document.getElementsByTagName("head")[0]
   var script = document.createElement("script")
   script.type = "text/javascript"

   script.src =
      "https://cdn.jsdelivr.net/gh/zesty-io/explorer@latest/dist/explorer.production.js"

   checkZestyDomain && head.appendChild(script)
   !checkZestyDomain && alert("Website Not Supported. Try again.")
})()
