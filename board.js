var urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
const userId = Cookies.get(roomId);
var teamDialog = null;

window.addEventListener("DOMContentLoaded", () => {
    teamDialog = document.getElementById("teamDialog");
});

/*
Coloris({
    //parent: "#teamDialog-wrapper",
    theme: "default",
    themeMode: 'dark',
    alpha: false,
    swatches: [
        "#cc6e8f",
    "#FF0000",
    "#FFA500",
    "#8B4513",
    "#FFFF00",
    "#00FF00",
    "#008080",
    "#00FFFF",
    "#000080",
    "#9400D3"
    ],
  });
*/

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

function fillBoard(boardData, teamColours) {
    let goals = boardData.goals;
    let marks = boardData.marks;
    if (goals != undefined) {
        for (const i in goals) {
            let goal = goals[i];
            const cell = document.getElementById("cell"+ i);
            const para = document.createElement("div");
            para.className = "bingo-cell-content";
            const node = document.createTextNode(goal.name);
            para.appendChild(node);
            cell.replaceChildren(para);
            cell.onclick = markGoal;
            fitText(para, 0.7);
        }
    }
    if (marks != undefined && teamColours != undefined) {
        var all_marks = {};
        for (const teamId in marks) {
            let colour = teamColours[teamId];
            for (const marked of marks[teamId]) {
                if (all_marks[marked] == undefined) {
                    all_marks[marked] = [colour];
                } else {
                    all_marks[marked] += colour;
                }
            }
        }
        for (const goalId in all_marks) {
            const cell = document.getElementById("cell"+ goalId); // TODO: actually use blocks for this
            cell.setAttribute("style", "background-color: " + all_marks[goalId][0] + ";");
        }
    }
    
}

function closeTeamDialog() {
    teamDialog.close();
}

function noPropagate(event) {
    event.stopPropagation();
}

function createTeamDialog() {
    teamDialog.showModal();
}

function createTeam() {
    CREATE_TEAM(roomId,
        document.getElementById("team-name").value,
        document.getElementById("team-color").value);
    
    teamDialog.close();
}

function joinTeam(el) {
    console.log(el);
    let teamid = el.getAttribute("teamid");
    JOIN_TEAM(roomId, teamid);
}

function markGoal(event) {
    let cell = event.target;
    if (event.target.className == "bingo-cell-content") {
        cell = event.target.parentElement;
    }
    const id = cell.id.replace("cell", "");
    MARK(roomId, id);
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
    fillBoard(event.boardMin, event.teamColours);
});

window.addEventListener("REJOINED", (data) => {
    const event = data.detail;
    setTitle(event.roomName);
    createBoard(event.boardMin);
    fillBoard(event.boardMin, event.teamColours);
});

window.addEventListener("MEMBERS", (data) => {
    const event = data.detail;
    const teamSelectorInner = document.getElementById("teamSelector-inner");
    teamSelectorInner.textContent = "";
    for (const teamId in event.teams) {
        teamView = event.teams[teamId];
        let teamWrapper = create_with_class("div", "team-wrapper");
        teamWrapper.setAttribute("teamId", teamId);
        teamWrapper.setAttribute("ondblclick", "joinTeam(this)");
        let teamBox = create_with_class("div", "team-box bordered");
        teamBox.setAttribute("style", "background-color: " + teamView.colour + ";");
        teamBox.innerText = teamView.name;
        teamWrapper.appendChild(teamBox);
        for (const member of teamView.members) {
            let memberPara = create_with_class("p", "team-member");
            memberPara.innerText = member.name;
            if (!member.connected) {
                memberPara.classList.add("disconnected");
            }
            teamWrapper.appendChild(memberPara);
        }
        teamSelectorInner.appendChild(teamWrapper);
    }
});

window.addEventListener("TEAM_JOINED", (data) => {
    const event = data.detail;
    createBoard(event.board);
    fillBoard(event.board, event.teamColours);
});

window.addEventListener("UPDATE", (data) => {
    const event = data.detail;
    fillBoard(event.board, event.teamColours);
});

window.addEventListener("NOAUTH", (data) => {
    revealLogin();
    Cookies.remove(roomId);
});