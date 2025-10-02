//Prevent right click
document.oncontextmenu = () => {
    alert("Right click isn't allowed here.")
    return false
}

document.onkeydown = e => {
    if(e.ctrlKey && e.key == "u") {
        alert ("Can't do that.")
        return false
    }

    if(e.ctrlKey && e.key == "c") {
        alert ("Failed copying this website.")
        return false
    }
}
