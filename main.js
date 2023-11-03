const websocket = new ReconnectingWebSocket("ws://localhost:555/");

// Response dispatch; rather than repeating listen code in subpages, distribute events as needed
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
        case "GENERATORS":
            window.dispatchEvent(new CustomEvent("generators", {detail: event}));
            break;
        case "GAMES":
            window.dispatchEvent(new CustomEvent("games", {detail: event}));
            break;
        case "ERROR":
            window.dispatchEvent(new CustomEvent("error", {detail: event}));
            console.error(event.message);
            break;
    }
});

function send(object) {
    console.debug(object);
    websocket.send(JSON.stringify(object));
}

function OPEN(roomName, username, game, board) {
    submission = {
        verb: "OPEN",
        roomName: roomName,
        username: username,
        game: game,
        board: board
    };
    send(submission);
}

function GET_GENERATORS(game) {
    submission = {
        verb: "GET_GENERATORS",
        game: game
    }
    send(submission);
}

function LIST() {
    send({verb: "LIST"});
}

function GAMES() {
    send({verb: "GET_GAMES"});
}

function JOIN(roomId, username) {
    send({
        verb: "JOIN",
        roomId: roomId,
        username: username
    });
}

function REJOIN(roomId, userId) {
    send({
        verb: "REJOIN",
        roomId: roomId,
        userId: userId
    });
}