var urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
const userId = Cookies.get(roomId);
// Get board on websocket load
function getBoard() {
    if (userId === undefined) {
        revealLogin();
    } else {
        REJOIN(roomId, userId);
    }
}

function revealLogin() {
    document.getElementById("room").hidden = true;
    document.getElementById("login-main").hidden = false;
    document.getElementById("login").disabled = false;
}

function login() {
    document.getElementById("login").disabled = true;
    JOIN(roomId, document.getElementById("username").value);
}

function exit() {
    EXIT(roomId, userId);
    window.location.href = "index.html";
}

function setTitle(title) {
    document.title = title;
    document.getElementsByTagName("h1")[0].innerText = "ByngoSink: " + title;
}

function create_with_class(type, cls) {
    let element = document.createElement(type)
    element.classList += cls
    return element
}

function createBoard(boardMin) {
    let height = boardMin.height;
    let width = boardMin.width;
    let table = document.getElementById("board");
    table.replaceChildren([]);
    let headerRow = create_with_class("thead", "bingo-col-header-row");
    let corner = create_with_class("th", "bingo-col-header");
    headerRow.appendChild(corner);
    for (let x = 1; x <= width; x++) {
        let header = create_with_class("th", "bingo-col-header");
        header.innerText = x;
        headerRow.appendChild(header);
    }
    table.appendChild(headerRow);
    for (let y = 1; y <= height; y++) {
        let row = create_with_class("tr", "")
        let rowHeader = create_with_class("th", "bingo-row-header");
        rowHeader.innerText = y;
        row.appendChild(rowHeader);
        for (let x = 1; x <= width; x++) {
            let index = (y - 1) * width + x - 1
            let cell = create_with_class("td", "bingo-cell");
            cell.id = "cell" + index
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

function fillBoard(boardData) {
    let goals = boardData.goals;
    let marks = boardData.marks;
    if (goals != undefined) {
        for (const i in goals) {
            goal = goals[i];
            const cell = document.getElementById("cell"+ i);
            const para = document.createElement("div");
            para.className = "bingo-cell-content";
            const node = document.createTextNode(goal.name);
            para.appendChild(node);
            cell.replaceChildren(para);
            cell.onclick = markGoal;
        }
    }
    if (marks != undefined) {
        for (const i in marks) {

        }
    }
}

function markGoal(event) {
    let cell = event.target;
    if (event.target.className == "bingo-cell-content") {
        cell = event.target.parentElement;
    }
    const id = cell.id.replace("cell", "");
    console.log(id);
    
}

websocket.addEventListener("open", getBoard);

// Websocket listeners
window.addEventListener("NOTFOUND", (data) => {
    window.location.href = "notfound.html";
});

window.addEventListener("JOINED", (data) => {
    const event = data.detail;
    Cookies.set(event.roomId, event.userId, {sameSite: "strict"});
    document.getElementById("room").hidden = false;
    document.getElementById("login-main").hidden = true;
    setTitle(event.roomName);
    createBoard(event.boardMin);
    fillBoard(event.boardMin);
});

window.addEventListener("REJOINED", (data) => {
    const event = data.detail;
    setTitle(event.roomName);
    createBoard(event.boardMin);
    fillBoard(event.boardMin);
});

window.addEventListener("NOAUTH", (data) => {
    revealLogin();
    Cookies.remove(roomId);
});