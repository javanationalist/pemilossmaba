//Prevent right click
document.oncontextmenu = () => {
    alert("Right click isn't allowed here.")
    return false
}

document.onkeydown = e => {
    if(e.key == "F12") {
        alert ("Don't press the F12 key!")
        return false
    }

    if(e.ctrlKey && e.key == "u") {
        alert ("Can't do that.")
        return false
    }

    if(e.ctrlKey && e.key == "c") {
        alert ("Failed copying this website. Please don't try again.")
        return false
    }
   
    if(e.ctrlKey && e.key == "v") {
        alert ("Can't paste anything to this website. Please don't try again.")
        return false

    }
}
