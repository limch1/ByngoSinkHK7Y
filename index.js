function list() {
    console.log("sending");
    websocket.send(JSON.stringify({verb: "LIST"}));
}

websocket.addEventListener("open", list);

window.addEventListener("listed", (data) => {
    const event = data.detail;
});

window.addEventListener("opened", (data) => {
    const event = data.detail;
    Cookies.set(event.roomId, event.userId, {sameSite: "strict"});
    window.location.href = "board.html?id=" + event.roomId;
});

function create_room() {
    document.getElementById("create_room").disabled = true;
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

function join_room(roomId) {
    window.location.href = "board.html?id=" + roomId;
}