var data = {
    stageCol: 20,
    stageRow: 20,
    spriteSize: 20,
    sidebarH: 0,
    sidebarW: 0,
}

var viewport = {
    height: window.innerHeight,
    width: window.innerWidth
}

const spritesheet = new Image()
spritesheet.src = 'cp437_20x20.png'
sprite = {
    'EMPTY': [0,0],
    'PLAYER': [2,0],
    'PLAYERDEAD': [1,0],
    'WALL': [11, 13],
    'CLOSEDOOR': [14,15],
    'OPENDOOR': [15,15],
    'STAIRS': [14,1],
    'BANDIT': [2,6],
    'POTION':[11,14],
    'ANT':[14,2],
    'DEMON': [4,4],
    "WEAPON": [9,10],
    "MONEY": [4,2]
}

stats = {
    alive: true,
    score: 0,
    stage: 1,
    hp: 5,
    power: 2,
}

var exit = null
var player = null
var enemies = []
var map = []
var gameLog = []

game = {
    title: function (){
        document.getElementById('startButton').style.display = 'inline'
        document.getElementById('mapContainer').innerHTML = ''
        document.getElementById('activeForMobile').style.display = 'none'
    },
    start: function (){
        if (window.mobileCheck()){
            document.getElementById('activeForMobile').style.display = 'inline'
            setTouchButtons(true)
        } else {
            document.getElementById('activeForMobile').style.display = 'none'
        }
        if (!stats.alive){
            document.addEventListener('keypress', moveAround)
            restoreToDefault()
        }
        playSound('start')
        document.getElementById('startButton').style.display = 'none'
        document.getElementById('mapContainer').innerHTML = ""
        map = []
        enemies = []
        buffer = []
        gameLog = []
        createMap()
        createCanvas()

        randomSpawnEnemy()
        randomSpawnItems()
        randomSpawn('player')
        randomSpawn('stairs')

        printMap()
    },
    tick: function (){
        for (let i=0;i<enemies.length;i++){
            if (enemies[i].dead){
                enemies.splice(i,1)
                if (enemies.length == 0){
                    collectAll()
                }
            } else {
                enemies[i].wander()
            }
        }
    },
}

function printGameOver(){
    let cnv = document.getElementById('gameCanvas')
    let ctx = cnv.getContext('2d')

    ctx.fillRect(data.spriteSize,data.spriteSize, cnv.width-(2*data.spriteSize),cnv.height-(2*data.spriteSize))
    ctx.font = "35px Courier"
    if (data.stageCol < 12){
        ctx.font = '20px Courier'
    }
    ctx.fillStyle = 'red'
    ctx.textAlign = 'center'
    ctx.fillText("GAME OVER", (cnv.width/2),(cnv.height/2))

    ctx.font = '20px Courier'
    ctx.fillText('Score: '+stats.score, (cnv.width/2), (cnv.height/2)+30)
    ctx.fillStyle = 'black'

    setTimeout(game.title, 3000)
}

function restoreToDefault(){
    stats.alive = true
    stats.stage = 1
    stats.score = 0
    stats.hp = 5
    stats.power = 2
}

function createCanvas(){
    let container = document.getElementById('mapContainer')
    let canvas = document.createElement('canvas')
    canvas.width = (data.stageCol*data.spriteSize)
    canvas.height = (data.stageRow*data.spriteSize)
    canvas.id = 'gameCanvas'

    container.append(canvas)

    let cnv = document.getElementById('gameCanvas')
    let ctx = cnv.getContext('2d')
    ctx.imageSmoothingEnabled = false

    container.prepend(createSidebar('helpSidebar'))
    container.append(createSidebar('gameLog'))
    prepSidebar()
    updateUI()
}


function createSidebar(id){
    let log = document.createElement('div')

    log.style.height = data.sidebarH+'px'
    log.style.width = data.sidebarW+'px'
    log.id = id
    log.style.border = 'solid white '+data.spriteSize+'px'
    log.style.display = 'inline-block'
    log.style.backgroundColor = 'black'
    log.style.color = 'white'
    log.style.verticalAlign = 'top'

    return log
}

function prepSidebar(){
    let bar = document.getElementById('helpSidebar')

    bar.append(createP('playerHp'))
    bar.append(createP('playerPower'))
    bar.append(createP('playerScore'))
    bar.append(createP('playerStage'))

    bar.append(createP('controls', data.spriteSize))
    document.getElementById('controls').innerHTML = "<u>Controls</u>\nMove: WASD\nAscend: E"

    bar.append(createP('legend', (data.spriteSize)))
    document.getElementById('legend').innerHTML = '<u>Legend</u>\n. - Ant\nb - Bandit\nD - Demon\n▲ - Stairs\n$ - Money\n⌐ - Powerup\nδ - Potion'
}

function updateUI(){
    if (stats.hp < 0){
        stats.hp = 0
    }
    document.getElementById('playerHp').innerHTML = "HP: "+stats.hp
    document.getElementById('playerPower').innerHTML = 'Power: '+stats.power
    document.getElementById('playerStage').innerHTML = 'Floor: '+stats.stage
    document.getElementById('playerScore').innerHTML = "Score: "+stats.score
}

function createP(id, spacing=0){
    let p = document.createElement('p')
    p.style.marginTop = spacing+'px'
    p.style.marginBottom = '0px'
    p.id = id
    p.style.whiteSpace = 'pre'
    return p
}

function printLog(){
    let log = document.getElementById('gameLog')
    log.innerHTML = ''
    let total = 0
    for (let i=0;i<gameLog.length;i++){
        let p = document.createElement('p')
        p.style.marginTop = '0px'
        p.style.marginBottom = '20px'
        p.innerHTML = gameLog[i]
        if (total >= data.sidebarH*0.9){
            log.innerHTML = ''
            total = 0
        }
        log.append(p)
        total += p.offsetHeight+20
    }
}

function loadSounds(){
    sounds = {
        attack: new Audio('sfx/hurt.wav'),
        eat: new Audio('sfx/eat.wav'),
        start: new Audio('sfx/start.wav'),
        heal: new Audio('sfx/heal.wav'),
        powerup: new Audio('sfx/powerup.wav'),
        money: new Audio('sfx/money.wav'),
        hurt: new Audio('sfx/hurt2.wav')
    }
}

function playSound(name){
    sounds[name].currentTime = 0
    sounds[name].volume = 0.2
    sounds[name].play()
}

function changeStyles(){
    
    data.sidebarH = 18*data.spriteSize
    data.sidebarW = 6*data.spriteSize

    //scale game to screen size
    if (viewport.width <= 400){
        data.stageCol = 10
    } else if (viewport.width <= 700){
        data.stageCol = 13
    } else if (viewport.width <= 800){
        data.stageCol = 17
    } 

    if (viewport.height < 400){
        data.stageRow = Math.floor(viewport.height/data.spriteSize)
        data.sidebarH = (data.stageRow*data.spriteSize)-2*data.spriteSize
    }

    let root = document.querySelector(':root')
    let btnWidth = ((data.stageCol+14)*data.spriteSize)
    let margin = ((viewport.height-(data.stageRow*data.spriteSize))/2)+'px'
    if (btnWidth > viewport.width){
        btnWidth = data.stageCol*data.spriteSize
        data.stageRow = 13
        margin = 0
    }

    root.style.setProperty('--buttonWidth', btnWidth+'px')
    root.style.setProperty('--gameMarginTop', margin)
    root.style.setProperty('--gameMarginBottom', margin)

}

window.onload = function(){
    const startBtn = document.getElementById('startButton')
    startBtn.addEventListener('click', game.start)
    startBtn.style.display = 'inline'
    let btn = document.getElementById('startButton')
    btn.innerHTML= 'Enter the Tower'

    changeStyles()
    loadSounds()

    setTouchButtons(true)
}

function setTouchButtons(isActive){
    if (isActive){
        let buttons = document.getElementsByClassName('moveButton')
        for (let i=0;i<buttons.length;i++){
            buttons[i].addEventListener('touchstart', processTouch)
        }
    } else {
        let buttons = document.getElementsByClassName('moveButton')
        for (let i=0;i<buttons.length;i++){
            buttons[i].removeEventListener('touchstart', processTouch)
        }
    }
}
window.onorientationchange = function() { 
    var orientation = screen.orientation; 
        switch(orientation.angle) { 
            case 0:
            case 90:
            case -90: window.location.reload(); 
            break; } 
};

function processTouch(event){
    let dir = event.target.getAttribute('key')
    moveAround(dir)
}

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

var buffer = []
document.addEventListener('keypress', moveAround)
function moveAround(e){
    if (typeof e == 'string'){
        buffer.push(e)
    } else {
        buffer.push(e.key)
    }
    let key = buffer.shift()
    switch (key){
        case 'w':
            player.move(-1, 0)
            break
        case 's':
            player.move(1, 0)
            break
        case 'a':
            player.move(0, -1)
            break
        case 'd':
            player.move(0, 1)
            break
        case 'e':
            if (player.tile == exit){
                stats.stage += 1
                exit.ascend()
            }
            break
        default:
            console.log(key)
            break
    }
}

function createMap(){
    map = []
    let addTile = ''
    for (let i=0; i<data.stageRow;i++){
        map.push([]) //add row
        for (let j=0;j<data.stageCol; j++){
            if (j == 0 || j == data.stageCol-1 || i == 0 || i == data.stageRow-1){
                addTile = new Wall(i,j)
            } else {
                addTile = new Tile(i,j)
            }
            map[i].push(addTile) //add cols
        }
    }
}

function printMap(){
    for (let i=0;i<data.stageRow;i++){
        for (let j=0;j<data.stageCol;j++){
            map[i][j].draw()

            if (map[i][j].object !== null){
                map[i][j].object.draw()
            }
            if (map[i][j].creature !== null){
                map[i][j].creature.draw()
            }

        }
    }
}

function printSprite(obj){
    let cnv = document.getElementById('gameCanvas')
    let ctx = cnv.getContext('2d')

    ctx.drawImage(
        spritesheet, 
        obj.sprite[0]*data.spriteSize, 
        obj.sprite[1]*data.spriteSize, 
        data.spriteSize, 
        data.spriteSize,
        obj.col*data.spriteSize,
        obj.row*data.spriteSize,
        data.spriteSize,
        data.spriteSize
    )
}


function randIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function coinFlip(){
    let chance = randIntBetween(0,100)
    if (chance >= 50){
        return 1
    } else {
        return -1
    }
}

function getRandomTile(){
    let spawnCol = randIntBetween(1, data.stageCol-1)
    let spawnRow = randIntBetween(1, data.stageRow-1)
    let target = map[spawnRow][spawnCol]

    return target
}

function randomSpawn(item){
    let target = getRandomTile()

    switch(item){
        case 'player':
            player = target.creature = new Player(target)
            break
        case 'stairs':
            exit = map[target.row][target.col] = new Stairs(target.row, target.col)
            break
        default:
            console.log('random spawn error')
            break
    }
}
var enemyOptions = ['bandit', 'ant', 'demon']
function randomSpawnEnemy(){
    for (let i=0;i<Math.floor(stats.stage*1.2);i++){
        let randomEnemy = enemyOptions[randIntBetween(0, enemyOptions.length)]

        let target = getRandomTile()

        let newEnemy = null

        if (stats.stage % 10 == 0 || stats.stage > 20){
            randomEnemy = 'demon'
        }

        switch (randomEnemy){
            case 'bandit':
                newEnemy = target.creature = new Bandit(target, enemies.length)
                break
            case 'ant':
                newEnemy = target.creature = new Ant(target, enemies.length)
                break
            case 'demon':
                newEnemy = target.creature = new Demon(target, enemies.length)
                break
            default:
                console.log('spawn enemy error')
                break
        }
        enemies.push(newEnemy)
    }
}

var itemOptions = ['potion', 'money', 'weapon']
function randomSpawnItems(){
    for (let i=0;i<stats.stage;i++){
        let target = getRandomTile()
        let random = randIntBetween(0,100)
        if (random >= 50){
            target.object = new Potion(target)
        }
    }

    for (let i=0;i<stats.stage;i++){
        let target = getRandomTile()

        target.object = new Money(target)
    }

    for (let i=0;i<stats.stage;i++){
        let target = getRandomTile()
        let random = randIntBetween(0,100)
        if (random <= 20){
            target.object = new Weapon(target)
        }
    }
}

function collectAll(){
    for (let i=0;i<data.stageRow; i++){
        for (let j=0;j<data.stageCol;j++){
            if (map[i][j].object !== null){
                map[i][j].object.pickup()
                map[i][j].draw()
            }
        }
    }
}