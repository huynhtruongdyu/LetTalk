var signalRConnection = null;
var app = null;

document.addEventListener("DOMContentLoaded", function (event) {
  injectLibs();
  setTimeout(() => {
    injectUI();
  }, 3000);
});

window.onbeforeunload = function (event) {
  var roomId = localStorage.getItem("roomId");
  if (roomId) {
    signalRConnection?.invoke("OutRoom", roomId);
    localStorage.removeItem("roomId");
  }
};

Date.prototype.withoutTime = function () {
  var d = new Date(this);
  d.setHours(0, 0, 0, 0);
  return d;
};

function injectLibs() {
  var jqueryScipt = document.createElement("script");
  jqueryScipt.src = "https://localhost:7055/lib/jquery/jquery.min.js";
  jqueryScipt.crossorigin = "anonymous";

  var signalRScipt = document.createElement("script");
  signalRScipt.src =
    "https://localhost:7055/lib/microsoft-signalr/signalr.min.js";
  signalRScipt.crossorigin = "anonymous";

  document.body.appendChild(jqueryScipt);
  document.body.appendChild(signalRScipt);
}

function injectUI() {
  var chatboxStyle = document.createElement("link");
  chatboxStyle.href = "https://localhost:7055/chatbox/lettalk.css";
  chatboxStyle.rel = "stylesheet";
  document.head.appendChild(chatboxStyle);

  app = $("#lettalk");
  app.append(`
    <button class="open-button" onclick="openForm()">Chat</button>
    <div class="chat-popup" id="myForm">
        <div class="form-container">
        <h1>Chat</h1>

        <label for="msg"><b>Message</b></label>
        <div id="lettalkMessages" style="max-height: 30vh; overflow-y: auto;"></div>
        <input type="text" required style={width:100%} id="lettalkInput"/>
        <button type="button" class="btn" onclick="onSend()">Send</button>
        <button type="button" class="btn" onclick="onClear()">Clear</button>
        <button type="button" class="btn" onclick="onJoin()">Join</button>
        <button type="button" class="btn cancel" onclick="closeForm()">Close</button>
        </div>
    </div>`);
}

function onClear() {
  $("div#lettalkMessages").empty();
}

function onJoin() {
  var roomId = prompt("enter room id");
  if (roomId) {
    signalRConnection.invoke("JoinRoom", roomId);
    localStorage.setItem("roomId", roomId);
  }
}

function openForm() {
  if (signalRConnection == null) {
    connectSignalR();
  }
  document.getElementById("myForm").style.display = "block";
}

function closeForm() {
  document.getElementById("myForm").style.display = "none";
}

function onSend() {
  var value = $("input#lettalkInput");
  if (value.val()) {
    signalRConnection?.invoke("SendMessage", "1", value.val());
  }
  value.val("");
}

function connectSignalR() {
  signalRConnection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7055/chathub", {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .configureLogging(signalR.LogLevel.Debug)
    .build();

  async function start() {
    try {
      await signalRConnection.start();
      console.log("SignalR Connected.");
    } catch (err) {
      console.log(err);
      setTimeout(start, 5000);
    }
  }

  signalRConnection.onclose(async () => {
    await start();
  });
  signalRConnection.on("ReceiveMessage", (message) => {
    $("div#lettalkMessages").append(`<p>${message}</p>`);
  });

  // Start the signalRConnection.
  start().then(() => {});
}
