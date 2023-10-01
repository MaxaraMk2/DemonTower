class Tile{
    constructor(row, col){
        this.row = row
        this.col = col
        this.passable = true
        this.sprite = sprite.EMPTY
        this.creature = null;
        this.object = null
    }

    draw(){
        printSprite(this)
    }
}

class Wall extends Tile{
    constructor(row,col){
        super(row,col)
        this.passable = false
        this.sprite = sprite.WALL
    }
}

class Stairs extends Tile{
    constructor(row,col){
        super(row,col)
        this.sprite = sprite.STAIRS
    }

    ascend(){
        if (this.creature == player){
            game.start()
        }
    }
}

class Item{
    constructor(tile){
        this.tile = tile
        this.row = tile.row
        this.col = tile.col
        this.tile.object = this
    }

    draw(){
        printSprite(this)
    }

    pickup(){
        printLog()
        updateUI()
    }
}

class Potion extends Item{
    constructor(tile){
        super(tile)
        this.sprite = sprite.POTION
    }

    pickup(){
        if (this.tile.creature == player || enemies.length == 0){
            player.hp++
            stats.hp++
            playSound('heal')
            gameLog.push('You drink a healing potion!')
            this.tile.object = null
        }
        super.pickup()
    }
}

class Money extends Item{
    constructor(tile){
        super(tile)
        this.sprite = sprite.MONEY
    }

    pickup(){
        if (this.tile.creature == player || enemies.length == 0){
            stats.score++
            playSound('money')
            gameLog.push('You find some money!')
            this.tile.object = null
        }
        super.pickup()
    }
}

class Weapon extends Item{
    constructor(tile){
        super(tile)
        this.sprite = sprite.WEAPON
    }

    pickup(){
        if (this.tile.creature == player || enemies.length == 0){
            stats.power++
            player.power++
            playSound('powerup')
            gameLog.push('Your weapon is stronger now!')
            this.tile.object = null
        }
        super.pickup()
    }
}


class Creature{
    constructor(tile, sprite){
        this.row = tile.row
        this.col = tile.col
        this.tile = tile
        this.sprite = sprite
        this.dead = false
    }

    draw(){
        printSprite(this)
    }

    move(dRow,dCol){
        let target = map[this.row+dRow][this.col+dCol]
        if (target.creature == null){
            if (target.passable){
                this.tile.creature = null
                this.tile.draw()
                if (this.tile.object !== null){
                    this.tile.object.draw()
                }
                this.row += dRow
                this.col += dCol
                this.tile = map[this.row][this.col]
                map[this.row][this.col].creature = this
                target.creature.draw()
            }
        } else {
            this.attack(target.creature)
        }
    }

    attack(creature){
        if (creature.name == this.name){
            return
        }

        gameLog.push(this.name+" attacks "+creature.name+" for "+this.power+" damage!")
        creature.hp -= this.power
        if (creature.player){
            stats.hp -= this.power
        }
        
        playSound('hurt')
        if (creature.hp <= 0){
            if (!creature.player){
                gameLog.push(creature.name+" is killed!")
                creature.tile.creature = null
                creature.dead = true
                creature.tile.draw()
                if (creature.tile.object !== null){
                    creature.tile.object.draw()
                }
            } else if (creature.player){
                player.sprite = sprite.PLAYERDEAD
                player.draw()
                gameLog.push('You died!')
                stats.alive = false
                setTimeout(printGameOver, 1000)
                document.removeEventListener('keypress', moveAround)
                setTouchButtons(false)
            }
        }
        printLog()
        updateUI()
    }

    wander(){
        let result = randIntBetween(0,2)
        switch(result){
            case 0:
                this.move(coinFlip(), 0)
                break
            case 1:
                this.move(0, coinFlip())
                break
            default:
                console.log('wander error')
                break
        }
    }
}

class Player extends Creature{
    constructor(tile){
        super(tile)
        this.name = "Player"
        this.sprite = sprite.PLAYER
        this.player = true
        this.hp = stats.hp
        this.power = stats.power
    }

    attack(creature){
        gameLog.push("You attack the "+creature.name+" for "+this.power+" damage!")
        creature.hp -= this.power
        playSound('attack')
        if (creature.hp <= 0){
            stats.score += creature.score
            gameLog.push("You killed the "+creature.name+"!")
            creature.tile.creature = null
            creature.dead = true
            creature.tile.draw()
            if (creature.tile.object !== null){
                creature.tile.object.draw()
            }
        }
        printLog()
        updateUI()
    }

    move(dRow,dCol){
        super.move(dRow,dCol)
        if (this.tile.object !== null){
            this.tile.object.pickup()
        }
        game.tick()
    }
}

class Bandit extends Creature{
    constructor(tile, ){
        super(tile)
        this.name = 'Bandit'
        this.sprite = sprite.BANDIT
        this.hp = 5
        this.power = 1
        this.score = 3
    }
}

class Ant extends Creature{
    constructor(tile){
        super(tile)
        this.name = "Ant"
        this.sprite = sprite.ANT
        this.hp = 2
        this.power = 1
        this.score = 1
    }
}

class Demon extends Creature{
    constructor(tile){
        super(tile)
        this.name = 'Demon'
        this.sprite = sprite.DEMON
        this.hp = 8
        this.power = 2
        this.score = 6
    }
}
