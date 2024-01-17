const dictionaries = {};
let vocab = {"test": "2"}

const test = [{"latein": "1", "deutsch":"2"}, {"latein":"3", "deutsch": "4"}]
let tablenames
let currentTable
let currentTableData
let orgList
let currentMainView = "start"
let changeInVocab
let active
let currentUser 


async function resolveRegister(){
  return new Promise(async (resolve, reject) => {
    const form = document.getElementById("loginForm")
    const user = form[0].value
    const password = form[1].value
    console.log(user + password)
    await apirequestPOST("register",[user,password])
    resolve()
  })
}

async function resolveLogin(custom){
  return new Promise(async (resolve, reject) => {
    const form = document.getElementById("loginForm")
    let user
    let password
    let hash = false
    console.log("custom: " + custom)
    if(custom) {
      user = custom[0] 
      password = false
      hash = custom[1]
    } else {
      user = form[0].value
      password = form[1].value
      hash = true
    }
    console.log(user + password)
    await apirequestPOST("login",[user,password,hash])
    resolve()
  })
}

//UserData
function viewUser(){
  getCookie("user").then((value) => { 
    const user = value[1][1]
    console.log(user)
    if (user == "o"){
      handleMainView("login")
    }
    else{
      document.getElementById("user").textContent = `logged in as "${user}"`
      handleMainView("account")
    }
    
  }) 

  //verify login

  checkLogin()


}


//takes list of vocabs as dictionarys and handels it
async function processList(list) {
  console.log("processList start");
  const lateinValueElement = document.getElementById('lateinValue');
  const GrammatikValueElement = document.getElementById('Grammatik');
  const DeutschValueElement = document.getElementById('Deutsch');

  list.sort((a, b) => a["learned"] - b["learned"]);
  for (let x in list) {
    const currentDictionary = list[x]

    //show warte
    document.getElementById("right").style.display = 'none';
    document.getElementById("false").style.display = 'none';
    document.getElementById("weiter").style.display = 'block';


    lateinValueElement.textContent = currentDictionary.latein;
    GrammatikValueElement.textContent = "Warte";
    DeutschValueElement.textContent = "Warte";
    
    

    await waitForButtonPressWeiter(); // Lösung anzeigen

    //hide weiter button
    document.getElementById("right").style.display = 'block';
    document.getElementById("false").style.display = 'block';
    document.getElementById("weiter").style.display = 'none';
    console.log("button hide");

    lateinValueElement.textContent = currentDictionary.latein;
    GrammatikValueElement.textContent =  currentDictionary.grammatik;
    DeutschValueElement.textContent = currentDictionary.deutsch;

    const buttonPress = await waitForButtonPressTrueFalse()
    console.log(buttonPress)
    if (buttonPress === "true") {
      currentDictionary["learned"] = currentDictionary["learned"] + 1;
      console.log(currentDictionary)
      
    } 
    else if(buttonPress === "false"){
      currentDictionary["learned"] = currentDictionary["learned"] - 1;
      console.log(currentDictionary)
    } else {
      console.log("next")
    }
    SaveReminder()

    //update table data
    currentTableData = list

    //showScore(currentDictionary.latein, currentDictionary["learned"]);
    console.log("button press");
    // Hier kannst du weitere Aktionen ausführen, nachdem der Knopf gedrückt wurde
  };
  //}
  document.getElementById("right").style.display = 'none';
  document.getElementById("false").style.display = 'none';
  document.getElementById("weiter").style.display = 'block';
  lateinValueElement.textContent = "Zu Ende gelernt"
  handleMainView("finishedlearning")
  /* await waitForButtonPressTrueFalse(); */
  //processList()
}

//handels the true and false buttons
function waitForButtonPressTrueFalse() {
/*   if (active != changeInVocab){
    console.log(active, changeInVocab)
        return("next")
      }
  active = changeInVocab */
  return new Promise(resolve => {
    
    //true button
    const buttontrue = document.getElementById('right');
    buttontrue.addEventListener('click', () => {
      resolve("true");
    });
    //false button
    const buttonfalse = document.getElementById('false');
    buttonfalse.addEventListener('click', () => {
      resolve("false");
    });

  });
}


//handels "next" button
function waitForButtonPressWeiter() {
  return new Promise(resolve => {
    const buttontrue = document.getElementById('weiter');
    buttontrue.addEventListener('click', () => {
      resolve("true");
    });
  });
}

//makes Api request to /api/${custom}
function apirequestGET(url, process = true, callback, req = false) {
  let reqUrl = `https://inka.mywire.org/api/${url}` 
  console.log(`Post request to url: ${reqUrl}, with content: ${req}`)
  if (req){
    reqUrl = reqUrl + "?" + String(req)
  }

  fetch(reqUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {

      if(!data){console.log("SERVER DENIED"); return}
      console.log(`Request to (${reqUrl}) made successfully with data${data}`);
      
      if (process) {
        processList(data);
      } else {
        tablenames = data;
        if (callback && typeof callback === 'function') {
          console.log("Callback");
          callback();
        }
      }
    })
    .catch(error => {
      console.error("Error ->", error);
    });
}


//Api Post function
async function apirequestPOST(url, content) {
  return new Promise(async (resolve, reject) => {
    console.log(`Post request to url: ${url}, with content: ${content}`)
    fetch(`https://inka.mywire.org/api/${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    })
      //Response
      .then(async response =>  {
        if (response.ok) {
          console.log('Post-Abonnement erfolgreich erstellt');
          const responseValue = response.json()


          //Antwort verarbeiten

          if (url == "login"){
            resolve(await processlogin(responseValue, content))
          }

          if (url == "register"){
            resolve(await processRegister(responseValue))
          }

          
        } else {
          console.error('Fehler beim Erstellen des Push-Abonnements:', response.status);
        }
      })
      //Eroor catch
      .catch(error => {
        console.error('Fehler beim Senden der Anfrage:', error);
      });
  })
}

async function processlogin(response, content){
  return new Promise(async (resolve, reject) => {
    console.log("try loggin")
    response.then(async data => {
      const loginSuccess = data[0]
      const responseStr = data[1]
      const responseHash = data[2]

      if (!loginSuccess){
        deleteAllCookies()
        console.log("couldn't login")
        document.getElementById("loginRes").textContent = "Error:  " + responseStr
        resolve()
        return
      }
      console.log("logged in succesfully")          
                    

      if (responseHash){
        console.log("creating cookie")
        document.cookie=`hash=${responseHash}; max-age=86400; path=/;`
        document.cookie=`user=${content[0]}; max-age=86400; path=/;`
      }
      else{
        console.log("logged in with hash")
      } 

      currentUser = (await getCookie("user"))[1][1]
      console.log("currentuser is set to: " + currentUser)

      document.getElementById("loginRes").textContent = "logged in as " + currentUser
      resolve()
    })
  })
}

async function processRegister(response){
  return new Promise(async (resolve, reject) => {
    document.getElementById("loginRes").textContent = response[1]
    resolve()
  })
}





//toggle login
let loginState
loginState = false


/* //Menu
let menuState
menuState = false
function toggleMenu() {
  menuState = !menuState
  console.log("menu toggle");
  const buttons = document.getElementsByClassName("menu");
  if (menuState) {
    //chnage size of menu 
    document.getElementById('menu').style.height = "150px";
    document.getElementById('menu').style.width = "120px";

    //hide menu bars
    document.getElementById("balkenContainer").style.display = "none";
    
    //buttons.forEach(element => {
      //element.style.display = 'block'
    //}); 
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].style.display = 'block'
    }

  } else {
    //revert changes
    document.getElementById('menu').style.height = "100px";
    document.getElementById('menu').style.width = "100px";

    document.getElementById("balkenContainer").style.display = "block";

    for (let i = 0; i < buttons.length; i++) {
      buttons[i].style.display = 'none'
    }
  }
}
 */


//Turns Vocab List visible
function chooseVocab() {
  console.log("choseVocab")
  cleartable()
  const List = document.querySelector("#vocablist");

  tablenames.forEach((str) => {
    /* document.getElementById("vocablist").style.display = "block" */
    const li = document.createElement("li");
    li.textContent = str;
    li.classList.add("listitem");
    // Hinzufügen der onClick-Funktion für jedes div
    li.addEventListener("click", function() {
      handleClick(str);
    });
    List.appendChild(li);
  });
 /*  document.getElementById("vocablistcontainer").style.display = "block" */
}

async function handleClick(str){
  /* document.getElementById("vocablist").style.display = "none" */
  currentTable = str
  changeInVocab = str
  handleMainView("abfrage")
  const hash = (await getCookie("hash"))[1][1]
  apirequestGET(`vocab/table?user=${currentUser}&hash=${hash}&table=${str}`)
}

function cleartable() {
  if (document.getElementById("vocablist").hasChildNodes()) {
    // It has at least one
    const myNode = document.getElementById("vocablist");
      while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
      }
  }
  
}

async function handleSave(){
  document.getElementById("saveReminder").style.display = "none"
  console.log("request ->")
  const hash = (await getCookie("hash"))[1][1]
  url = `vocab/table/save?user=${currentUser}&hash=${hash}&table=${currentTable}`
  apirequestPOST(url, currentTableData)
}

function SaveReminder(){
  document.getElementById("saveReminder").style.display = "block"
}

function handleMainView(newView){
  const hide = document.getElementById(currentMainView)
  currentMainView = newView
  
  hide.style.display = "none"

  newView = document.getElementById(newView)
  newView.style.display = "block"
  
}

async function getCookie(cname) {
  return new Promise((resolve, reject) => {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        let startCookie = name.length - 1
        for (let i = 0; i < c.length; i++) {
          if (c.charAt(i) == "@"){
            startCookie = i
            //console.log(i)
          }
        }
        resolve([true, [c.substring(c.indexOf(name), startCookie), c.substring(startCookie + 1, c.length)]])
        return ;
      }
    }
    resolve([false,"no cookie"]) ;
  })
}

function deleteAllCookies() {
  var allCookies = document.cookie.split(';'); 
                
                // The "expire" attribute of every cookie is  
                // Set to "Thu, 01 Jan 1970 00:00:00 GMT" 
                for (var i = 0; i < allCookies.length; i++) 
                    document.cookie = allCookies[i] + "=;expires=" 
                    + new Date(0).toUTCString(); 
  
                displayCookies.innerHTML = document.cookie;
}

async function checkLogin() {
  return new Promise(async(resolve, reject) => {
    console.log("check cookies")
    const cookieRes = await getCookie("hash")
    console.log(cookieRes)
    if (cookieRes[0]) {
      const cookieValues = cookieRes[1]
      await resolveLogin([cookieValues[0].substring(5), cookieValues[1]])
    } 
    resolve(cookieRes[0])
    console.log("console:" + cookieRes[1]) 
  })
}

function save(){
  const notifyDiv = document.getElementById("notifyHeader")
  console.log("saved")
  handleSave()
  notifyDiv.innerHTML = "Auto Saved"
  setTimeout(function(){console.log("delete notification"); notifyDiv.innerHTML = ""}, 3000);
}

function setAutoSave(time){
  if (time == 0){
    autoSave = 0
    return
  }
  autoSave = setTimeout(save, time*60000);
}

async function start(){
  const loginSuccess = await checkLogin()
  console.log("startlogin = ", loginSuccess)
  if (loginSuccess){
    console.log("start request ->")
    apirequestGET("vocab/tables", false, chooseVocab, `userName=${currentUser}&hash=${(await getCookie("hash"))[1][1]}`)
  }
  
}
start()

//auto save
let autoSave = setInterval(save, 60000);