var urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
const userId = Cookies.get(roomId);
var currentTeamId = null;
var teamDialog = null;
var cellStates = {};
var lastHover = -1;

const cellBgColor = "#181818";
const hoverColour = "#616161";
const hoverPct = 0.5;
const activePct = 0.5;
const activePolygonPct = Math.sqrt(activePct);
const svgXOffset = 4;
const svgYOffset = 0;

class CellState {
    goal = "";
    hover = false;
    marked = [];
    activeTeamId = null;

    updateGoal(newGoal) {
        if (this.goal != newGoal) {
            this.goal = newGoal;
            return true;
        }
        return false;
    }

    updateHover(newHover) {
        if (this.hover != newHover) {
            this.hover = newHover;
            return true;
        }
        return false;
    }

    updateMarked(newMarked) {
        if (this.marked !== newMarked) {
            this.marked = newMarked;
            return true;
        }
        return false;
    }

    updateActiveTeamId(newActiveTeamId) {
        if (this.activeTeamId == newActiveTeamId) return false;
        var prevId = this.activeTeamId;
        this.activeTeamId = newActiveTeamId;

        for (var marking of this.marked) {
            if (marking[0] == newActiveTeamId || marking[0] == prevId) return true;
        }
        return false;
    }

    isMarkedFor(teamId) {
        if (teamId == null) return false;
        for (var marking of this.marked) {
            if (marking[0] == teamId) return true;
        }
        return false;
    }

    getColourFor(teamId) {
        for (var marking of this.marked) {
            if (marking[0] == teamId) return marking[1];
        }
        return null;
    }

    isFull() {
        // TODO: Fill the cell if the goal cannot be claimed by anyone else (lockout formats)
        return false;
    }
}

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
    cellStates = {};
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
            cellStates[index] = new CellState();
            let cell = create_with_class("td", "bingo-cell");
            cell.id = "cell" + index;
            cell.addEventListener("mouseover", onCellHoverChanged(index));
            cell.addEventListener("mouseleave", onCellHoverChanged(index));
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
}

function pointPrinter(width, height) {
    function scaler(point) {
        let [x, y] = point;
        return `${x * width},${y * height}`
    }
    return scaler;
}

function getRGB(colour) {
    return [parseInt(colour.substring(1, 3), 16), parseInt(colour.substring(3, 5), 16), parseInt(colour.substring(5, 7), 16)];
}

function interpolate(colour1, colour2, pct) {
    var [r1, g1, b1] = getRGB(colour1);
    var [r2, g2, b2] = getRGB(colour2);
    const r = Math.round(r1 + (r2 - r1) * pct);
    const g = Math.round(g1 + (g2 - g1) * pct);
    const b = Math.round(b1 + (b2 - b1) * pct);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const squarePolygon = [[0, 0], [1, 0], [1, 1], [0, 1]];
const activePolygon = [[0, activePolygonPct], [activePolygonPct, 0], [1, 0], [1, 1 - activePolygonPct], [1 - activePolygonPct, 1], [0, 1]];

function renderPolygon(svg, width, height, polygon, colour, hover) {
    let node = create_svg("polygon");
    node.setAttribute('points', polygon.map(pointPrinter(width, height)).join(' '));
    if (hover) colour = interpolate(colour, hoverColour, hoverPct);
    node.style = `fill:${colour};stroke:black;stroke-width:1`;
    svg.appendChild(node);
}

function skew(frac) {
    return Math.pow(frac, areaSkew);
}

function reverseSkew(frac) {
    return 1 - skew(1 - frac);
}

function topLeftPoint(pct) {
    if (pct <= 1) return [0, 1 - pct];
    else return [pct - 1, 0];
}

function bottomRightPoint(pct) {
    if (pct <= 1) return [pct, 1];
    else return [1, 2 - pct];
}

// Given a triangle with sides |size|, |size|, and |size| * sqrt(2), divide it evenly into N sections perpendicular to the hypotenuse.
// Results are coordinates along the hypotenuse, scaled to [0, 2*size]
function splitTriangle(size, sections) {
    let totalArea = size * size / 2.0;
    let share = totalArea / sections;

    let splits = [];
    let currentShare = 0;
    let half = ((sections % 2 == 0) ? (sections - 2) : (sections - 1)) / 2;
    for (i = 0; i < half; i++) {
        currentShare += share;

        // x^2/2 = currentShare; x = sqrt(2 * currentShare)
        // dist = sqrt(2) * x; dist = 2 * sqrt(currentShare)
        splits.push(2 * Math.sqrt(currentShare));
    }

    if (sections % 2 == 0) splits.push(size);
    for (i = 0; i < half; i++) splits.push(2 * size - splits[half - 1 - i]);
    return splits;
}

function computeCrossPolygon(startPct, endPct) {
    const points = []
    if (startPct > 0) {
        points.push(bottomRightPoint(startPct));
        points.push(topLeftPoint(startPct));
    } else {
        points.push([0, 1]);
    }
    if (startPct < 1 && endPct > 1) {
        points.push([0, 0]);
    }
    if (endPct < 2) {
        points.push(topLeftPoint(endPct));
        points.push(bottomRightPoint(endPct));
    } else {
        points.push([1, 0]);
    }
    if (startPct < 1 && endPct > 1) {
        points.push([1, 1]);
    }

    return points;
}

function renderCrossPolygons(svg, width, height, markings, hover, leaveGap) {
    if (markings.length == 0) return;

    let pcts = [];
    if (leaveGap) {
        pcts.push(1 - activePolygonPct);
        for (var split of splitTriangle(activePolygonPct, markings.length)) {
            pcts.push(1 - activePolygonPct + split);
        }
        pcts.push(1 + activePolygonPct);
    } else {
        pcts.push(0);
        pcts.push(...splitTriangle(1, markings.length));
        pcts.push(2);
    }

    console.log("pcts: " + pcts + "; " + markings.length);
    for (i = 0; i + 1 < pcts.length; i++) {
        let polygon = computeCrossPolygon(pcts[i], pcts[i + 1]);
        renderPolygon(svg, width, height, polygon, markings[i][1], hover);
    }
}

function buildSvgShapes(cell, svg, state) {
    if (state.marked.length == 0) {
        svg.width = 0;
        svg.height = 0;
        return;
    }

    let rect = cell.getBoundingClientRect();
    let width = Math.trunc(rect.right - rect.left) + svgXOffset;
    let height = Math.trunc(rect.bottom - rect.top) + svgYOffset;
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);

    if (state.marked.length == 1 && state.isFull()) {
       renderPolygon(svg, width, height, squarePolygon, state.marked[0][1], state.hover);
       return;
    }

    if (!state.isFull() || state.isMarkedFor(currentTeamId)) {
        let filtered = [];
        for (var marking of state.marked) {
            if (marking[0] != currentTeamId) {
                filtered.push(marking);
            }
        }
        renderCrossPolygons(svg, width, height, filtered, state.hover, true);
        renderPolygon(svg, width, height, activePolygon, state.isMarkedFor(currentTeamId) ? state.getColourFor(currentTeamId) : cellBgColor, state.hover);
    } else {
        renderCrossPolygons(svg, width, height, state.marked, state.hover, false);
    }
}

function updateCellMarkings(index, teamMarkings) {
    if (index == -1) return;

    const cell = document.getElementById("cell" + index);
    let newHover = cell.matches(':hover');
    if (newHover) lastHover = index;
    let updated = false;

    let state = cellStates[index];
    if (teamMarkings != null && state.updateMarked(teamMarkings)) updated = true;
    if (state.updateActiveTeamId(currentTeamId)) updated = true;
    if (state.updateHover(newHover)) updated = true;
    if (!updated) return;

    const svg = document.getElementById("cell-bg" + index);
    svg.replaceChildren([]);
    buildSvgShapes(cell, svg, state);
}

function updateCurrentTeamId(newTeamId) {
    currentTeamId = newTeamId;

    for (const cellId in cellStates) {
        updateCellMarkings(cellId, null);
    }
}

function fillBoard(boardData, teamColours) {
    // Update local state.
    let goals = boardData.goals;
    let marks = boardData.marks;
    if (goals != undefined) {
        for (const i in goals) {
            let goal = goals[i];
            let state = cellStates[i];
            if (state.updateGoal(goal)) {
                const textDiv = document.getElementById("cell-text" + i);
                const node = document.createTextNode(goal.name);
                textDiv.replaceChildren(node);
                fitText(textDiv, 0.7);

                // TODO: Separate revelation from markability (for Invasion)
                const cell = document.getElementById("cell" + i);
                cell.onclick = markOrUnmarkGoal(i);
            }
        }
    }
    if (marks != undefined && teamColours != undefined) {
        var all_marks = {};
        for (const cellId in cellStates) {
            all_marks[cellId] = [];
        }
        for (const teamId in marks) {
            let colour = teamColours[teamId];
            for (const marked of marks[teamId]) {
                all_marks[marked].push([teamId, colour]);
            }
        }

        // We have to loop over all ids in case some goal was unmarked.
        for (const cellId in cellStates) {
            updateCellMarkings(cellId, all_marks[cellId]);
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

function onCellHoverChanged(id) {
    function func(event) {
        updateCellMarkings(lastHover, null);
        updateCellMarkings(id, null);
    }
    return func;
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

function markOrUnmarkGoal(index) {
    function handleEvent(event) {
        let state = cellStates[index];
        if (state.isMarkedFor(currentTeamId)) {
            UNMARK(roomId, `${index}`)
        } else {
            MARK(roomId, `${index}`)
        }
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
    updateCurrentTeamId(null);
    Cookies.set(roomId, event.userId, {sameSite: "strict"});
    document.getElementById("room").hidden = false;
    document.getElementById("login-main").hidden = true;
    setTitle(event.roomName);
    createBoard(event.boardMin);
    fillBoard(event.boardMin, event.teamColours);
});

window.addEventListener("REJOINED", (data) => {
    const event = data.detail;
    updateCurrentTeamId(event.teamId);
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
    updateCurrentTeamId(event.teamId);
    createBoard(event.board);
    fillBoard(event.board, event.teamColours);
});

window.addEventListener("TEAM_CREATED", (data) => {
    const event = data.detail;
    updateCurrentTeamId(event.teamId);
    createBoard(event.board);
    fillBoard(event.board, event.teamColours);
});

window.addEventListener("TEAM_LEFT", (data) => {
    updateCurrentTeamId(null);
});

window.addEventListener("UPDATE", (data) => {
    const event = data.detail;
    fillBoard(event.board, event.teamColours);
});

window.addEventListener("NOAUTH", (data) => {
    revealLogin();
    Cookies.remove(roomId);
});

window.addEventListener("DOMContentLoaded", () => {
    let wsUrl = Cookies.get("wsUrl");
    if (wsUrl != null) {
        document.getElementById("websocket-url").value = wsUrl;
    }
    document.getElementById("websocket-url").addEventListener("change", (event) => {
        console.log("Websocket chaning to " + event.target.value);
        websocket = new ReconnectingWebSocket(event.target.value);
        subscribeWebsocket();
        Cookies.set("wsUrl", event.target.value, {sameSite: "strict"});
    });
});