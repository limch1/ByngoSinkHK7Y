function getBoard() {
    urlParams = new URLSearchParams(window.location.search)
    roomId = urlParams.get("id")
    userId = Cookies.get(roomId)
    if (userId === undefined) {
        
    } else {
        REJOIN(roomId, userId);
    }
}

websocket.addEventListener("open", getBoard);