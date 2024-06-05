

let octogons = document.getElementsByClassName("octogon");

for(let i=0;i<octogons.length;i++){
    let width = 15
    let height = width
    let triangles = []
    let postions = [
        ["top","left",180],
        ["top","right",270],
        ["bottom","right",0],
        ["bottom","left",90],
    ]
    for(let o=0;o<4;o++){
        let triangle = document.createElement("div")
        triangle.innerHTML = `<svg width="${width}px" height="${height}px" viewBox="0 0 100 100" fill="cyan" xmlns="http://www.w3.org/2000/svg"><path d="M100 100V0L0 100H100Z" fill="var(--backgroundColor)"/></svg>`

        triangle.style.position = "absolute"
        triangle.style[postions[o][0]] = "0px"
        triangle.style[postions[o][1]] = "0px"

        triangle.style.maxWidth = width+"px"
        triangle.style.maxHeight = height+"px"

        triangle.style.transform = `rotate(${postions[o][2]}deg)`

        octogons[i].style.padding = `${width*1.2}px`
        octogons[i].appendChild(triangle)
    }
}