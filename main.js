const websocket = new ReconnectingWebSocket("ws://localhost:555/");

// Response dispatch; rather than repeating listen code in subpages, distribute events as needed
websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    console.debug(event);
    if (event.verb == "ERROR") { console.error(event.message) }
    window.dispatchEvent(new CustomEvent(event.verb, {detail: event}));
});

function send(object) {
    console.debug("sending" + JSON.stringify(object));
    websocket.send(JSON.stringify(object));
}

function OPEN(roomName, username, game, board) {
    send({
        verb: "OPEN",
        roomName: roomName,
        username: username,
        game: game,
        board: board
    });
}

function GET_GENERATORS(game) {
    send({
        verb: "GET_GENERATORS",
        game: game
    });
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

function EXIT(roomId, userId) {
    send({
        verb: "EXIT",
        roomId: roomId,
        userId: userId
    });
}