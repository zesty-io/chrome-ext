'use strict';

let avatar = document.getElementById('avatar');
let autoRefreshButton = document.getElementById('autoRefreshButton');
let autoRefreshIntervalInput = document.getElementById('autoRefreshIntervalInput');


let instanceDetails = document.getElementById('instanceDetails');

let instanceZuid = false
let instance = false

let authToken = false
let userZuid = false
let user = false
let models = false
let affectedZuidArray = []


chrome.storage.sync.get('autorefresh', function(data) {
  console.log(data.autorefresh)
  if(data.autorefresh == true){
    setTimeout(() => {
      console.log('refresh')
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'location.reload();'});
      });
    }, document.getElementById('autoRefreshWait').value * 1000);
  }
});


function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function splitAndUniqueZuidsKeys(str){
  let temparray = str.split(" ");
  return temparray.filter( onlyUnique );
}

function getInstanceZuid(arr){
  
  for (const str of arr) {
    if(str.match(/^8-/) !== null) {
      return str
    }
  }
  
}


autoRefreshButton.onclick = function(element) {

  autoRefreshButton.classList.toggle('start');
  autoRefreshButton.classList.toggle('stop');

  chrome.storage.sync.get('autoRefresh', function(data){
      // toggle on or off
      let autoRefresh = data.autoRefresh ? false : true;

      updateAutoRefresh(autoRefresh)

      if(autoRefresh) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }

  });
  
}

async function getCookies(domain, name, callback) {
    chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback && cookie) {
            callback(cookie.value);
        } else {
          console.log( name+ ' not available.')
        }
    });
}


getCookies("http://zesty.io", "APP_SID", async function(id) {
    if(id) {
      authToken = id
      userZuid = await verifyUserAndGetZUID(authToken);
      user = await getUserInfo(userZuid, authToken);
      setUserAvatar(user.avatar)

      chrome.storage.sync.get('viewAffectedResources', async function(data) {
        if(data.viewAffectedResources !== false){
          affectedZuidArray = splitAndUniqueZuidsKeys(data.viewAffectedResources);
          instanceZuid = getInstanceZuid(affectedZuidArray);
          await getInstanceInfo(instanceZuid, authToken);
          populateInstanceData(instance);
          let modelsAPIURL = instance.apiUrl + '/content/models';
          let models = await getDataFromAPICall(modelsAPIURL, authToken)
          let accessedModels = getUsedModelArray(affectedZuidArray, models)
          populateAccessedModels(accessedModels)
        }
      });
    }
});

function getUsedModelArray(affectedZuidArray, models){
  let modelsHit = []
  models.forEach(model => {
    affectedZuidArray.forEach(zuid => {
      if(zuid == model.ZUID) {
        modelsHit.push(model) 
      }
    })
  });

  return modelsHit;
}
function populateInstanceData(instance){
  if(instance.name == undefined){
    instanceDetails.innerHTML = `<p style="padding: 5px"><strong>You are not logged in.  </strong> <a href="https://accounts.zesty.io" target="_blank" class="button">Log in Now</a></p>`;
  } else {
    instanceDetails.innerHTML = `<strong>${instance.name}</strong><br> <span class="light">${instance.ZUID}</span> <a href="${instance.accountsUrl}" target="_blank">edit  settings</a>`;
  }

}

function populateAccessedModels(accessedModels){
  accessedModels = accessedModels.reverse()
  let html = ''

  accessedModels.forEach(model => {
    let managerUrl = instance.managerUrl + '/#!/content/' + model.ZUID
    html += `<strong>${model.name}</strong> <a href="${managerUrl}" target="_blank">edit</a> <span class="light">(${model.ZUID})</span> <br>`
  })

  document.getElementById('affectedZuids').innerHTML = html

}


// AUTO REFRESH FUNCTIONS

function startAutoRefresh(){
  let refreshInterval = autoRefreshIntervalInput.options[autoRefreshIntervalInput.selectedIndex].value;
  let interval = refreshInterval * 1000
  let timerId = setInterval(reloadCurrentPage, interval);
  chrome.storage.sync.set({'autoRefreshTimerId': timerId});
  autoRefreshButton.innerHTML = 'Stop'

}

function stopAutoRefresh() {
  chrome.storage.sync.get('autoRefreshTimerId', function(data) {
    clearInterval(data.autoRefreshTimerId);
  });
  autoRefreshButton.innerHTML = 'Start'
}

function reloadCurrentPage(){
  chrome.tabs.getSelected(null, function(tab) {
    var code = 'window.location.reload();';
    chrome.tabs.executeScript(tab.id, {code: code});
  });
}

function updateAutoRefresh(value) {        
  chrome.storage.sync.set({'autoRefresh': value});
}

// DOM CHANGING FUNCTIONS

function setUserAvatar(avatarUrl){
	avatar.setAttribute("src",avatarUrl);
}


// ZESTY API CALL FUNCTIONS

// handing with a users is logged in
async function verifyUserAndGetZUID(authToken){
	return fetch('https://auth.api.zesty.io/verify', {
		method: "GET",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Cache': 'no-cache',
			'Authorization': 'Bearer '+authToken
		},
		credentials: 'include'
	}).then(function(response) {
		return response.json();
	}).then(function(json) {
		return json.meta.userZuid;
	});
}

async function getUserInfo(zuid,authToken){  
	return fetch(`https://accounts.api.zesty.io/v1/users/${zuid}`, {
		method: "GET",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
				 'Authorization': 'Bearer '+authToken
		},
		credentials: 'include'
	}).then(function(response) {
		return response.json();
	}).then(function(json) {
    json.data.avatar = 'https://www.gravatar.com/avatar/'+json.data.emailHash
		return json.data;
	});
}

async function getInstanceInfo(zuid,authToken){
	return fetch(`https://accounts.api.zesty.io/v1/instances/${zuid}`, {
		method: "GET",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
				 'Authorization': 'Bearer '+ authToken
		},
		credentials: 'include'
	}).then(function(response) {
		return response.json();
	}).then(function(json) {
    instance = json.data
    instance.managerUrl = `https://${instance.randomHashID}.manage.zesty.io/`
    instance.accountsUrl = `https://accounts.zesty.io/instances/${instance.ZUID}`
    instance.apiUrl = `https://${instance.ZUID}.api.zesty.io/v1`
		return instance;
	});
}

async function getDataFromAPICall(apiUrl,authToken){
	return fetch(apiUrl, {
		method: "GET",
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer '+ authToken
		},
		credentials: 'include'
	}).then(function(response) {
		return response.json();
	}).then(function(json) {
		return json.data;
	});
}