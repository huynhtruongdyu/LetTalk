
var connection = null;
var app = null;

document.addEventListener("DOMContentLoaded", function (event) {
    //do work
    injectLibs();
    setTimeout(() => {
        injectUI();
    }, 3000);


});


function injectLibs() {
    var jqueryScipt = document.createElement("script");
    jqueryScipt.src = "https://localhost:7055/lib/jquery/jquery.min.js";
    jqueryScipt.crossorigin = "anonymous";

    var signalRScipt = document.createElement("script");
    signalRScipt.src = "https://localhost:7055/lib/microsoft-signalr/signalr.min.js";
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
                <div id="lettalkMessages"></div>
                <input type="text" required style={width:100%} id="lettalkInput"/>
                <button type="button" class="btn" onclick="onSend()">Send</button>
                <button type="button" class="btn cancel" onclick="closeForm()">Close</button>
              </div>
            </div>`);
}

function openForm() {
    if (connection == null) {
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
        connection?.invoke("SendMessage", value.val());
    }
    value.val("");
}

function connectSignalR() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7055/chathub", {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

    async function start() {
        try {
            await connection.start();
            console.log("SignalR Connected.");
        } catch (err) {
            console.log(err);
            setTimeout(start, 5000);
        }
    };

    connection.onclose(async () => {
        await start();
    });
    connection.on("ReceiveMessage", (message) => {
        $("div#lettalkMessages").append(`<p>${message}</p>`);
        console.log(message);
    })

    // Start the connection.
    start();
}

