const websocket = new ReconnectingWebSocket("ws://localhost:555/");

websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    console.debug(event)
    switch(event.verb) {
        case "LISTED":
            window.dispatchEvent(new CustomEvent("listed", {detail: event}));
            break;
        case "OPENED":
            window.dispatchEvent(new CustomEvent("opened", {detail: event}));
            break;
        case "JOINED":
            window.dispatchEvent(new CustomEvent("joined", {detail: event}));
            break;
        case "NOAUTH":
            window.dispatchEvent(new CustomEvent("noauth", {detail: event}));
            break;
        case "SHARE":
            window.dispatchEvent(new CustomEvent("share", {detail: event}));
            break;
        case "ERROR":
            window.dispatchEvent(new CustomEvent("error", {detail: event}));
            console.error(event);
            window.alert(event);
            break;
    }
});

function OPEN(roomName, userName, gameEnum, boardType, width, height) {
    submission = {
        verb: "OPEN",
        roomName: document.getElementById("roomName").value,
        username: document.getElementById("username").value,
        gameEnum: parseInt(document.getElementById("game").value),
        boardType: parseInt(document.getElementById("board").value),
        width: parseInt(document.getElementById("width").value),
        height: parseInt(document.getElementById("height").value)
    };
    websocket.send(JSON.stringify(submission));
}