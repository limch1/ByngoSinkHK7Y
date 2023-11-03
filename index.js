websocket.addEventListener("open", () => {
    GAMES();
    LIST();
    const gameDropdown = document.getElementById("game");
    gameDropdown.addEventListener("input", (event) => {
        GET_GENERATORS(gameDropdown.value);
    });
});

// Response listeners
window.addEventListener("GAMES", (data) => {
    // Get games (on load)
    const event = data.detail;
    let games = event.games;
    const gameSelect = document.getElementById("game");
    for (const game of games) {
        gameSelect.add(new Option(game, game))
    }
    GET_GENERATORS(gameSelect.value);
});

window.addEventListener("GENERATORS", (data) => {
    // Get a game's generators (every time game updates)
    const event = data.detail;
    let gens = event.generators;
    const genSelect = document.getElementById("generator");
    let opts = genSelect.options;
    for (const element of opts) {
        genSelect.remove(element.value)
    }
    for (const gen of gens) {
        genSelect.add(new Option(gen, gen))
    }
});


window.addEventListener("LISTED", (data) => {
    const event = data.detail;
});

window.addEventListener("OPENED", (data) => {
    const event = data.detail;
    Cookies.set(event.roomId, event.userId, {sameSite: "strict"});
    window.location.href = "board.html?id=" + event.roomId;
});

function create_room() {
    document.getElementById("create_room").disabled = true;

    OPEN(document.getElementById("roomName").value,
        document.getElementById("username").value,
        document.getElementById("game").value,
        document.getElementById("board").value);
}

function join_room(roomId) {
    window.location.href = "board.html?id=" + roomId;
}

window.addEventListener("DOMContentLoaded", () => {

});

