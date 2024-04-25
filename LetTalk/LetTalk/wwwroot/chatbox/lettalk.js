var signalRConnection = null;
var chatdb = null;
var app = null;

document.addEventListener("DOMContentLoaded", function (event) {
    //do work
    injectLibs();
    setTimeout(() => {
        injectUI();
        initDbConnection();
        initLocalMessages();
    }, 3000);
});

Date.prototype.withoutTime = function () {
    var d = new Date(this);
    d.setHours(0, 0, 0, 0);
    return d;
}

function injectLibs() {
    var jqueryScipt = document.createElement("script");
    jqueryScipt.src = "https://localhost:7055/lib/jquery/jquery.min.js";
    jqueryScipt.crossorigin = "anonymous";

    var signalRScipt = document.createElement("script");
    signalRScipt.src = "https://localhost:7055/lib/microsoft-signalr/signalr.min.js";
    signalRScipt.crossorigin = "anonymous";

    var pouchdbScipt = document.createElement("script");
    pouchdbScipt.src = "https://localhost:7055/lib/pouchdb/pouchdb.min.js";
    pouchdbScipt.crossorigin = "anonymous";

    document.body.appendChild(jqueryScipt);
    document.body.appendChild(signalRScipt);
    document.body.appendChild(pouchdbScipt);
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
        signalRConnection?.invoke("SendMessage", value.val());
    }
    value.val("");
}

function connectSignalR() {
    signalRConnection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7055/chathub", {
            skipNegotiation: true,
            transport: signalR.HttpTransportType.WebSockets
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
    };

    signalRConnection.onclose(async () => {
        await start();
    });
    signalRConnection.on("ReceiveMessage", (message) => {
        chatdb?.post({
            "_id": new Date().toString(),
            "message": message
        }).then(function (response) {
            // handle response
        }).catch(function (err) {
            console.error(err);
        });
    })

    // Start the signalRConnection.
    start();
};

function initDbConnection() {
    chatdb = new PouchDB('chatdb');
    chatdb.changes({
        since: 'now',
        live: true,
        include_docs: true
    }).on('change', function (change) {
        // handle change
        $("div#lettalkMessages").append(`<p>${change.doc?.message}</p>`);
    }).on('complete', function (info) {
        // changes() was canceled
    }).on('error', function (err) {
        console.log(err);
    });
};

function initLocalMessages() {
    chatdb.allDocs({
        include_docs: true,
        attachments: true
    }).then(function (result) {
        var todayMessages = result?.rows?.filter(x => new Date(x?.id).withoutTime() - new Date().withoutTime() == 0);
        var messages = todayMessages?.rows?.map(x => x?.doc?.message);
        messages?.forEach(message => {
            $("div#lettalkMessages").append(`<p>${message}</p>`);
        })
    }).catch(function (err) {
        console.log(err);
    });
}