websocket.addEventListener("open", () => {
    GAMES();
    LIST();
    const gameDropdown = document.getElementById("game");
    gameDropdown.addEventListener("input", (event) => {
        GET_GENERATORS(gameDropdown.value);
    });
});

function setLargeBoards() {
    let genDropdown = document.getElementById("generator");
    let bool = genDropdown.options[genDropdown.selectedIndex].classList.contains("small");
    for (const opt of document.getElementById("board").getElementsByClassName("large")) {
        opt.disabled = bool;
    }
    let boardDropdown = document.getElementById("board");
    boardDropdown.selectedIndex = 0;
}

// Response listeners
window.addEventListener("GAMES", (data) => {
    // Get games (on load)
    const event = data.detail;
    let games = event.games;
    const gameSelect = document.getElementById("game");
    for (const element of gameSelect.options) {
        gameSelect.remove(element.value);
    }
    for (const game of games) {
        gameSelect.add(new Option(game, game))
    }
    GET_GENERATORS(gameSelect.value);
});

window.addEventListener("GENERATORS", (data) => {
    // Get a game's generators (every time game updates)
    const event = data.detail;
    gens = event.generators; 
    const genSelect = document.getElementById("generator");
    for (const element of genSelect.options) {
        genSelect.remove(element.value);
    }
    for (const gen of gens) {
        let opt = new Option(gen.name, gen.name);
        if (gen.small) { opt.classList.add("small"); }
        genSelect.add(opt);
    }
    if (gens.length == 1) { genSelect.disabled = true; } 
    else { genSelect.disabled = false; }
    setLargeBoards();
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
        document.getElementById("generator").value,
        document.getElementById("board").value,
        document.getElementById("seed").value);
}

function join_room(roomId) {
    window.location.href = "board.html?id=" + roomId;
}

window.addEventListener("DOMContentLoaded", () => {

});

