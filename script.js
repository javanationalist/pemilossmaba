//Prevent right click
document.oncontextmenu = () => {
    alert("Jangan klik kanan woi")
    return false
}

document.onkeydown = e => {
    if(e.key == "F12") {
        alert ("Ojok diinspect web iki.")
        return false
    }

    if(e.ctrlKey && e.key == "u") {
        alert ("Wes gak aneh aneh.")
        return false
    }

    if(e.ctrlKey && e.key == "c") {
        alert ("Wes gak woiii gak aneh aneh.")
        return false
    }
   
    if(e.ctrlKey && e.key == "v") {
        alert ("Wes gak aneh aneh wes diam yah.")
        return false

    }
}
