var urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
const userId = Cookies.get(roomId);
var teamDialog = null;
var boardDims = null;
const areaSkew = 0.7;

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

function create_svg(type) {
    return document.createElementNS("http://www.w3.org/2000/svg", type);
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
            cell.id = "cell" + index;
            let svgDiv = create_with_class("div", "svg-container");
            let svg = create_svg("svg");
            svg.id = "cell-bg" + index;
            svgDiv.appendChild(svg);
            cell.appendChild(svgDiv);
            let textDiv = create_with_class("div", "bingo-cell-content");
            textDiv.id = "cell-text" + index
            cell.appendChild(textDiv);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    boardDims = boardMin;
}

function skew(frac) {
    return Math.pow(frac, areaSkew);
}

function reverseSkew(frac) {
    return 1 - skew(1 - frac);
}

function topPoint(pct) {
    if (pct <= 0.5) return [skew(pct / 0.5), 0];
    else return [1, reverseSkew((pct - 0.5) / 0.5)];
}

function botPoint(pct) {
    if (pct <= 0.5) return [0, skew(pct / 0.5)];
    else return [reverseSkew((pct - 0.5) / 0.5), 1];
}

function computePolygon(startPct, endPct) {
    const points = []
    if (startPct > 0) {
        points.push(topPoint(startPct));
    } else {
        points.push([0, 0])
    }
    if (startPct < 0.5 && endPct > 0.5) {
        points.push([1, 0]);
    }
    if (endPct < 1) {
        points.push(topPoint(endPct));
        points.push(botPoint(endPct));
    } else {
        points.push([1, 1]);
    }
    if (startPct < 0.5 && endPct > 0.5) {
        points.push([0, 1]);
    }
    if (startPct > 0) {
        points.push(botPoint(startPct));
    }

    return points;
}

function computePolygons(count) {
    pcts = [0];
    for (i = 1; i < count; i++) {
        // TODO: Use non-linear distribution for better area sharing
        pcts.push(i * 1.0 / count);
    }
    pcts.push(1);

    polygons = [];
    for (i = 0; i < pcts.length - 1; i++) {
        polygons.push(computePolygon(pcts[i], pcts[i + 1]));
    }
    return polygons;
}

function pointPrinter(width, height) {
    function scaler(point) {
        let [x, y] = point;
        return `${x * width},${y * height}`
    }
    return scaler;
}

function buildSvgShapes(colours, svg, cell) {
    if (colours.length == 0) {
        svg.width = 0;
        svg.height = 0;
        return;
    }

    let rect = cell.getBoundingClientRect();
    let width = Math.trunc(rect.right - rect.left) + 4;
    let height = Math.trunc(rect.bottom - rect.top);
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);

    polygons = computePolygons(colours.length);
    nodes = [];
    for (i = 0; i < polygons.length; i++) {
        node = create_svg("polygon");
        node.setAttribute('points', polygons[i].map(pointPrinter(width, height)).join(' '));
        // TODO: make hover work with SVG colors
        node.style = `fill:${colours[i]};stroke:black;stroke-width:1`;
        svg.appendChild(node);
    }
    return nodes;
}

function fillBoard(boardData, teamColours) {
    let goals = boardData.goals;
    let marks = boardData.marks;
    if (goals != undefined) {
        for (const i in goals) {
            let goal = goals[i];
            const textDiv = document.getElementById("cell-text" + i);
            const node = document.createTextNode(goal.name);
            textDiv.replaceChildren(node);
            fitText(textDiv, 0.7);

            const cell = document.getElementById("cell" + i);
            cell.onclick = markGoal(i);
        }
    }
    if (marks != undefined && teamColours != undefined) {
        var all_marks = {};
        let maxId = boardDims.width * boardDims.height;
        for (i = 0; i < maxId; i++) all_marks[i] = [];
        for (const teamId in marks) {
            let colour = teamColours[teamId];
            for (const marked of marks[teamId]) {
                all_marks[marked].push(colour);
            }
        }

        // We have to loop over all ids in case some goal was unmarked.
        for (cellId = 0; cellId < maxId; cellId++) {
            const cell = document.getElementById("cell" + cellId);
            let svg = document.getElementById("cell-bg" + cellId);
            svg.replaceChildren([]);
            buildSvgShapes(all_marks[cellId], svg, cell);
        }
        console.log("Filled things");
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

function markGoal(index) {
    function handleEvent(event) {
        MARK(roomId, `${index}`);
    }
    return handleEvent;
}

websocket.addEventListener("open", getBoard);

// Websocket listeners
window.addEventListener("NOTFOUND", (data) => {
    window.location.href = "notfound.html";
});

window.addEventListener("JOINED", (data) => {
    const event = data.detail;
    Cookies.set(roomId, event.userId, {sameSite: "strict"});
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

window.addEventListener("TEAM_CREATED", (data) => {
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