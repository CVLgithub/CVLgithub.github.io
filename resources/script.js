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

//login
function resolveLogin(custom){
  const form = document.getElementById("loginForm")
  let user
  let password
  let hash = false
  console.log("custom: " + custom)
  if(custom) {
    user = custom[0] 
    hash = custom[1]
  } else {
    user = form[0].value
    password = form[1].value
    hash = true
  }
  console.log(user + password)
  apirequestPOST("login",[user,password,hash],true)
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
function apirequestGET(url, process = true, callback) {
  fetch(`https://inka.mywire.org/api/${url}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Request to (${url}) made successfully`);
      
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
function apirequestPOST(url, content, login = false) {
  console.log(`Post request to url: ${url}, with content: ${content}`)
  console.log(``)
  fetch(`https://inka.mywire.org/api/${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  })
    //Response
    .then(response => {
      if (response.ok) {
        if (login){
          const responseValue = response.json()
          responseValue.then(data => {
              data = data[1]
              if (content[2]){
                document.cookie=`hash=${data}; max-age=86400; path=/;`
                console.log("cookie created")
              }
          })
        }
        console.log('Post-Abonnement erfolgreich erstellt');
      } else {
        console.error('Fehler beim Erstellen des Push-Abonnements:', response.status);
      }
    })
    //Eroor catch
    .catch(error => {
      console.error('Fehler beim Senden der Anfrage:', error);
    });

}

//toggle login
let loginState
loginState = false


//Menu
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
    
    /* buttons.forEach(element => {
      element.style.display = 'block'
    });  */
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

function handleClick(str){
  /* document.getElementById("vocablist").style.display = "none" */
  currentTable = str
  changeInVocab = str
  handleMainView("abfrage")
  apirequestGET(`vocab/table/${currentTable}`)
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

function handleSave(){
  document.getElementById("saveReminder").style.display = "none"
  console.log("request ->")
  url = `vocab/table/${currentTable}/save`
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

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      let startCookie = 0
      for (let i = 0; i < c.length; i++) {
        if (c.charAt(i) == "@"){
          startCookie = i
          console.log(i)
        }
      }
      return [true, [c.substring(name.length, startCookie), c.substring(startCookie + 1, c.length)]];
    }
  }
  return [false,"no cookie"];
}

function checkLogin() {
  console.log("check cookies")
  const cookieRes = getCookie("hash")
  console.log(cookieRes)
  if (cookieRes[0]) {
    const cookieValues = cookieRes[1]
    resolveLogin([cookieValues[0], cookieValues[1]])
  } 
  return cookieRes[1]
  

}

function start(){
  checkLogin()
  console.log("request ->")
  apirequestGET("vocab/tables", false, chooseVocab)
}
start()

/* note: speichern der vokabeln, eigen hochladen


  zusatz. Mobile Optimieren
*/