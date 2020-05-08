// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

var views = chrome.extension.getViews({
    type: "popup"
});

// for (var i = 0; i < views.length; i++) {
//     views[i].document.getElementById('x').innerHTML = "My Custom Value";
// }

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });
  chrome.storage.sync.set({viewAffectedResources: false});
  chrome.storage.sync.set({viewBranch: false});
  chrome.storage.sync.set({viewLanguage: false});

  chrome.storage.sync.set({autoRefresh: false});
  
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostSuffix: 'preview.zesty.io'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.webRequest.onHeadersReceived.addListener(function(details){
  for(let i = 0; details.responseHeaders.length > i; i++ ){
    let header = details.responseHeaders[i];
    if(header.name == 'surrogate-key'){
      
      chrome.storage.sync.get('viewAffectedResources', function(data) {
        // continue to appended as this hits the CSS and JS file, and other requests made
        if(data.viewAffectedResources) {
          chrome.storage.sync.set({'viewAffectedResources': data.viewAffectedResources +' ' +header.value});
        } else {
          chrome.storage.sync.set({'viewAffectedResources': header.value});
        }

      })
      
      //views[0].document.getElementById('affectedZuids').innerHTML = header.value;
    }
    if(header.name == 'z-branch'){
      chrome.storage.sync.set({'viewBranch': header.value});
    }
    if(header.name == 'content-language'){
      chrome.storage.sync.set({'viewLanguage': header.value});
    }
  }
},
{urls: ["https://*/*"]},["responseHeaders"]);
