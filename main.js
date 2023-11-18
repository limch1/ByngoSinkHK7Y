var wsUrl = Cookies.get("wsUrl");
if (wsUrl == undefined) {
    wsUrl = "wss://byngosink-ws.manicjamie.com:555/"
}
console.debug("Starting connection to " + wsUrl);
var websocket = new ReconnectingWebSocket(wsUrl); 

// Response dispatch; rather than repeating listen code in subpages, distribute events as needed
websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    console.debug(event);
    if (event.verb == "ERROR") { console.error(event.message) }
    window.dispatchEvent(new CustomEvent(event.verb, {detail: event}));
});

websocket.addEventListener("error", (event) => {
    console.error(event);
});

function send(object) {
    console.debug("sending" + JSON.stringify(object));
    websocket.send(JSON.stringify(object));
}

function OPEN(roomName, username, game, generator, board, seed) {
    send({
        verb: "OPEN",
        roomName: roomName,
        username: username,
        game: game,
        generator: generator,
        board: board,
        seed: seed
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

function CREATE_TEAM(roomId, team_name, colour) {
    send({
        verb: "CREATE_TEAM",
        roomId: roomId,
        name: team_name,
        colour: colour
    });
}

function JOIN_TEAM(roomId, teamId) {
    send({
        verb: "JOIN_TEAM",
        roomId: roomId,
        teamId: teamId
    });
}

function MARK(roomId, goalId) {
    send({
        verb: "MARK",
        roomId: roomId,
        goalId: goalId
    });
}