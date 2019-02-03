let express = require('express');
let socket = require('socket.io');

// App setup
let app = express();
let server = app.listen(4000, function () {
    console.log('listening to requests on port 4000');
});

// Static files
app.use(express.static('public'));

// Socket setup
let io = socket(server);

let mapMargin = 50;

class Map {
    constructor(name, width, height, cityStartX, cityStartY, cityEndX, cityEndY, monstersLimit, city) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.cityStartX = cityStartX;
        this.cityStartY = cityStartY;
        this.cityEndX = cityEndX;
        this.cityEndY = cityEndY;
        this.monstersLimit = monstersLimit;
        this.monsters = [];
        this.items = [];
        this.players = [];
        this.skills = [];
        this.city = city;
    }
    addMonster() {
        // later make it a separate class !!!
        while (this.monsters.length < this.monstersLimit) {
            let monsterX = this.cityStartX;
            let monsterY = this.cityStartY;
            while (monsterX >= this.cityStartX && monsterX <= this.cityEndX) {
                monsterX = getRandomInt(this.width);
            }
            while (monsterY >= this.cityStartY && monsterY <= this.cityEndY) {
                monsterY = getRandomInt(this.height);
            }
            let id = this.monsters.length;
            let angle = getRandomPI();
            let name = 'Goblin';
            let health = 100;
            let walkSpeed = 3;
            let attackSpeed = 1000;
            let armor = 10;
            let damage = 5;
            let aggressive = true;
            let weapon = {
                name: 'Dragon Sword',
                damage: 15
            }
            let attackDistance = 100;
            let experience = 100;
            let monster = new Monster(monsterX, monsterY, angle, name, health, walkSpeed, attackSpeed, armor, damage, aggressive, weapon, experience, id, attackDistance);
            this.monsters.push(monster);
        }
    }
    deployCity(city) {
        console.log('deploying a city');
        this.city = city;
    }
    deleteItems() {
        if (this.items.length > 0) {
            console.log('will delete the item after few seconds or minutes');
        }
    }
}

class Monster {
    constructor(globalX, globalY, angle, name, health, walkSpeed, attackSpeed, armor, damage, aggressive, weapon, experience, id, attackDistance) {
        this.globalX = globalX;
        this.globalY = globalY;
        this.angle = angle;
        this.name = name;
        this.health = health;
        this.walkSpeed = walkSpeed;
        this.attackSpeed = attackSpeed;
        this.armor = armor;
        this.damage = damage;
        this.aggressive = aggressive;
        this.weapon = weapon;
        this.experience = experience;
        this.id = id;
        this.giveupRadius = 600;
        this.noticeRadius = 250;
        this.attackDistance = attackDistance;
        this.target = null;
        this.destinationX = null;
        this.destinationY = null;
        this.direction = null;
        this.walking = false;
        this.lastAttack = Date.now();
    }
    direct(x, y) {
        if (distance(this.globalX, this.globalY, x, y) < this.giveupRadius || distance(this.globalX, this.globalY, x, y) > this.attackDistance) {
            this.destinationX = x;
            this.destinationY = y;
            this.direction = findAngle(this.globalX, this.globalY, x, y);
            this.walking = true;
        }
    }
    move(x, y) {
        if (distance(this.globalX, this.globalY, x, y) > this.attackDistance && distance(this.globalX, this.globalY, x, y) < this.giveupRadius) {
            this.globalX += Math.cos(this.direction) * this.walkSpeed;
            this.globalY += Math.sin(this.direction) * this.walkSpeed;
        } else if (distance(this.globalX, this.globalY, x, y) < this.attackDistance) {
            this.destinationX = null;
            this.destinationY = null;
            this.walking = false;
            this.attack();
        } else if (distance(this.globalX, this.globalY, x, y) > this.giveupRadius) {
            this.destinationX = null;
            this.destinationY = null;
            this.walking = false;
            this.target = null;
        }
    }
    observe() {
        for (let i = 0; i < MAP.players.length; i++) {
            if (distance(MAP.players[i].globalX, MAP.players[i].globalY, this.globalX, this.globalY) < this.noticeRadius) {
                this.target = MAP.players[i];
                this.follow(MAP.players[i].globalX, MAP.players[i].globalY);
            }
        }
    }
    follow(x, y) {
        if (this.target) {
            this.direct(x, y);
            this.move(x, y);
        }
    }
    attack() {
        if (Date.now() - this.lastAttack > this.attackSpeed) {
            let i = findPlayerIndex(this.target.id);
            MAP.players[i].health -= this.damage;
            this.lastAttack = Date.now();
        }
    }
}

class City {
    constructor(name, width, height, shops, respawnStartX, respawnEndX, respawnStartY, respawnEndY, warehouse) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.respawnStartX = respawnStartX;
        this.respawnEndX = respawnEndX;
        this.respawnStartY = respawnStartY;
        this.respawnEndY = respawnEndY;
        this.shops = shops;
        this.warehouse = warehouse
    }
}

class Player {
    constructor(x, y) {
        this.globalX = x;
        this.globalY = y;
        this.angle = 0;
        this.direction = 0;
        this.gold = 0;
        this.walking = false;
        this.radius = 20;
        this.buffs = []; // list
        this.inventory = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.draggingItem; // obj
        this.invFreeSpace = 100;
        this.invOccupiedSpace = 0;
        this.items = []; // list
        this.leftWeapon; // obj
        this.rightWeapon; // obj
        this.leftRing; // obj
        this.rightRing; // obj
        this.pendant; // obj
        this.wingCape; // obj
        this.destinationX = this.globalX;
        this.destinationY = this.globalY;
        this.lastSkill = Date.now();
        this.walkSpeed = 10;
        this.level = 1;
        this.experience = 0 + 150; // temporarily add fake exp
        this.maxExperience = getNextExperience(this.level);
        this.blockTimestamp = 0;
        this.blockTimeLimit = 0;
        this.warehouseItems = [];
        this.warehouse = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
        this.warehouseOpened = false;
    };

    direct(x, y, angle) {
        if (x > mapMargin && x < mapWidth - mapMargin && y > mapMargin && y < mapHeight - mapMargin) {
            let dist = distance(this.globalX, this.globalY, this.destinationX, this.destinationY);
            this.direction = angle;
            this.destinationX = x;
            this.destinationY = y;
            if (dist > this.radius) {
                this.walking = true;
            }
        }
    }
    move() {
        if (Date.now() - this.blockTimestamp > this.blockTimeLimit) {
            let dist = distance(this.globalX, this.globalY, this.destinationX, this.destinationY);
            if (dist > this.radius) {
                this.globalX += Math.cos(this.direction) * this.walkSpeed;
                this.globalY += Math.sin(this.direction) * this.walkSpeed;
            } else {
                this.destinationX = this.globalX;
                this.destinationY = this.globalY;
                this.walking = false;
            }
        }
    }
    teleport(newX, newY) {
        this.globalX = newX;
        this.globalY = newY;
    }
    die() {
        let nick = this.nick;
        let newId = this.id;
        let hero = this.hero;
        for (let i = 0; i < state.players.length; i++) {
            if (state.players[i].id == this.id) {
                state.players.splice(i, 1);
                break;
            }
        }
        addNewPlayer(nick, newId, hero);
    }
}

class Skill {
    constructor(globalX, globalY, name, damage, attackerId, lastSkill) {
        this.globalX = globalX;
        this.globalY = globalY;
        this.name = name;
        this.damage = damage;
        this.attackerId = attackerId;
        this.lastSkill = lastSkill;
    }
}

class Mage extends Player {
    constructor(socketId, nickname, globalX, globalY, gold, buffs, weapons, jewelry, flyings) {
        super(globalX, globalY, gold, buffs, weapons, jewelry, flyings);
        this.id = socketId;
        this.nickname = nickname;
        this.race = 'Mage';
        this.health = 400;
        this.mana = 300;
        this.healthRegen = 1;
        this.manaRegen = 1;
        this.maxHealth = 500;
        this.maxMana = 400;
        this.armor = 12;
        this.damage = 53;
        this.attackSpeed = 1000;
        this.activeSkill = {
            skillName: 'hellfire',
            skillDamage: 60,
            skillMana: 30
        };
        this.learnedSkills = [
            {
                skillName: 'fireBall',
                skillDamage: 44,
                skillMana: 10,
                skillSpeed: 12
            },
            {
                skillName: 'hellfire',
                skillDamage: 60,
                skillMana: 20
            }
        ];
    }
    healthManaRegen() {
        if (this.mana <= this.maxMana - this.manaRegen) {
            this.mana += this.manaRegen;
        } else if (this.mana < this.maxMana && this.mana > this.maxMana - this.manaRegen) {
            this.mana = this.maxMana;
        }
        if (this.health <= this.maxHealth - this.healthRegen) {
            this.health += this.healthRegen;
        } else if (this.health < this.maxHealth && this.health > this.maxHealth - this.healthRegen) {
            this.health = this.maxHealth;
        }
    }
    totalDamage() {
        return totalDamage;
    }
    totalArmor() {
        return totalArmor;
    }
    totalWalkSpeed() {
        return totalSpeed;
    }
    totalAttackSpeed() {
        return totalAttackSpeed;
    }
    attack() {
        console.log('attacking');
    }
    // skill is the object that describes everything about the skill to be used
    useSkill(skillInfo) {
        //console.log('using skill', skillInfo);
    }
}

class RoundSkill extends Skill {
    constructor(globalX, globalY, name, damage, attackerId, lastSkill, radius) {
        super(globalX, globalY, name, damage, attackerId, lastSkill);
        this.radius = radius;
        this.timestamp = Date.now();
    }
    attack() {
        for (let i = 0; i < MAP.monsters.length; i++) {
            if (distance(MAP.monsters[i].globalX, MAP.monsters[i].globalY, this.globalX, this.globalY) < this.radius) {
                MAP.monsters[i].health -= this.damage;
                if (MAP.monsters[i].health <= 0) {
                    let ii = findPlayerIndex(this.attackerId);
                    MAP.players[ii].experience += MAP.monsters[i].experience;
                    findAndDestroy(MAP.monsters[i].id, 'monster');
                }
            }
        }
    }
    move() {
        if (Date.now() >= 500 + this.timestamp) {
            this.destroy();
        }
    }
    destroy() {
        findAndDestroy(this.timestamp, 'skill');
    }
}

function findAngle(x1, y1, x2, y2) {
    let angleRadians = Math.atan2(y2 - y1, x2 - x1);
    return angleRadians;
}

function findAndDestroy(id, thing) {
    if (thing == 'skill') {
        for (let i = 0; i < MAP.skills.length; i++) {
            if (MAP.skills[i].timestamp == id) {
                console.log('found a skill');
                MAP.skills.splice(i, 1);
            }
        }
    } else if (thing == 'monster') {
        for (let i = 0; i < MAP.monsters.length; i++) {
            if (MAP.monsters[i].id == id) {
                console.log('found a monster');
                MAP.monsters.splice(i, 1);
            }
        }
    }
}

function getNextExperience(level) {
    let result = 99999999;
    switch (level) {
        case 1:
            result = 1000;
            break;
        case 2:
            result = 2000;
            break;
        case 3:
            result = 5000;
            break;
        case 4:
            result = 10000;
            break;
        default:
            return result;
    }
    return result;
}

function getRandomPI() {
    // to be changed when i have a connection to the internet
    let alfa = getRandomInt(314);
    return alfa / 100;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max + 1));
}

function createDeviasMap(deviasCity) {
    let name = 'Devias';
    let width = 2000;
    let height = 2000;
    let cityStartX = (width - deviasCity.width) / 2;
    let cityStartY = (height - deviasCity.height) / 2;
    let cityEndX = cityStartX + deviasCity.width;
    let cityEndY = cityStartY + deviasCity.height;
    let monstersLimit = 30;
    devias = new Map(name, width, height, cityStartX, cityStartY, cityEndX, cityEndY, monstersLimit, deviasCity);
}

function createDeviasCity() {
    let name = 'Devias';
    let width = 600;
    let height = 600;
    let respawnStartX = 100;
    let respawnEndX = width - respawnStartX;
    let respawnStartY = 100;
    let respawnEndY = height - respawnStartY;
    let shops = [];
    let warehouse = {
        name: 'warehouse',
        activeRadius: 100,
        globalX: 100,
        globalY: 100,
        side: 50 // every shop will have a side of the effecting area to be able to click on the shop
    };
    deviasCity = new City(name, width, height, shops, respawnStartX, respawnEndX, respawnStartY, respawnEndY, warehouse);
}

function addNewPlayer(id, nickname, race) {
    let x = getRandomInt(MAP.city.respawnEndX - MAP.city.respawnStartX) + MAP.cityStartX + MAP.city.respawnStartX;
    let y = getRandomInt(MAP.city.respawnEndY - MAP.city.respawnStartY) + MAP.cityStartY + MAP.city.respawnStartY;
    let newPlayer = {};
    if (race == 'Mage') {
        newPlayer = new Mage(id, nickname, x, y);
        MAP.players.push(newPlayer);
    }
}

function populateMonsters(map) {
    map.addMonster();
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function fakeItem() {
    // pendant
    let newPendant1 = {
        id: 521321,
        inBag: false,
        inWarehouse: false,
        width: 1,
        height: 1,
        type: 'pendant',
        name: 'pendant of fire',
        colorR: 100,
        colorG: 20,
        colorB: 150,
        globalX: 600,
        globalY: 600
    }
    MAP.items.push(newPendant1);
    let newPendant2 = {
        id: 525361,
        inBag: false,
        inWarehouse: false,
        width: 1,
        height: 1,
        type: 'pendant',
        name: 'pendant of ice',
        colorR: 50,
        colorG: 220,
        colorB: 130,
        globalX: 650,
        globalY: 650
    }
    MAP.items.push(newPendant2);
    // ring
    let newRing1 = {
        id: 998998,
        inBag: false,
        inWarehouse: false,
        width: 1,
        height: 1,
        type: 'ring',
        name: 'ring of poison',
        colorR: 230,
        colorG: 200,
        colorB: 190,
        globalX: 900,
        globalY: 900
    }
    MAP.items.push(newRing1);
    let newRing2 = {
        id: 908918,
        inBag: false,
        inWarehouse: false,
        width: 1,
        height: 1,
        type: 'ring',
        name: 'ring of heart',
        colorR: 190,
        colorG: 240,
        colorB: 220,
        globalX: 920,
        globalY: 920
    }
    MAP.items.push(newRing2);
    // wing
    let newWing1 = {
        id: 492321,
        inBag: false,
        inWarehouse: false,
        width: 4,
        height: 3,
        type: 'wingCape',
        name: 'dragon wings',
        colorR: 87,
        colorG: 20,
        colorB: 210,
        globalX: 700,
        globalY: 700
    }
    MAP.items.push(newWing1);
    let newWing2 = {
        id: 472121,
        inBag: false,
        inWarehouse: false,
        width: 4,
        height: 3,
        type: 'wingCape',
        name: 'angel wings',
        colorR: 187,
        colorG: 40,
        colorB: 150,
        globalX: 750,
        globalY: 750
    }
    MAP.items.push(newWing2);
    // left weapon
    let newLeftWeapon1 = {
        id: 412320,
        inBag: false,
        inWarehouse: false,
        width: 2,
        height: 4,
        type: 'weapon',
        name: 'dragon Sword',
        colorR: 187,
        colorG: 20,
        colorB: 110,
        globalX: 800,
        globalY: 800
    }
    MAP.items.push(newLeftWeapon1);
    let newLeftWeapon2 = {
        id: 411121,
        inBag: false,
        inWarehouse: false,
        width: 2,
        height: 4,
        type: 'weapon',
        name: 'angel sword',
        colorR: 217,
        colorG: 140,
        colorB: 10,
        globalX: 780,
        globalY: 780
    }
    MAP.items.push(newLeftWeapon2);
    // right weapon
    let newRightWeapon1 = {
        id: 472320,
        inBag: false,
        inWarehouse: false,
        width: 2,
        height: 4,
        type: 'weapon',
        name: 'dragon Sword',
        colorR: 17,
        colorG: 90,
        colorB: 80,
        globalX: 820,
        globalY: 820
    }
    MAP.items.push(newRightWeapon1);
    let newRightWeapon2 = {
        id: 416121,
        inBag: false,
        inWarehouse: false,
        width: 2,
        height: 4,
        type: 'weapon',
        name: 'angel sword',
        colorR: 27,
        colorG: 1,
        colorB: 90,
        globalX: 850,
        globalY: 850
    }
    MAP.items.push(newRightWeapon2);
    let gold1 = {
        id: 173283,
        name: 'gold',
        globalX: 250,
        globalY: 550,
        amount: 5000
    }
    MAP.items.push(gold1);
    let gold2 = {
        id: 522213,
        name: 'gold',
        globalX: 250,
        globalY: 600,
        amount: 1550
    }
    MAP.items.push(gold2);
    let gold3 = {
        id: 123315,
        name: 'gold',
        globalX: 250,
        globalY: 650,
        amount: 1850
    }
    MAP.items.push(gold3);
}

let deviasCity = {};
let devias = {};
createDeviasCity();
createDeviasMap(deviasCity);
let MAP = devias;
populateMonsters(devias);
let mapWidth = MAP.width;
let mapHeight = MAP.height;
let pickupRadius = 100;
fakeItem();

let inventoryWidth = 10;
let inventoryHeight = 10;

function pickNearObject(socketId) {
    let i = findPlayerIndex(socketId);
    for (let j = 0; j < MAP.items.length; j++) {
        let dist = distance(MAP.players[i].globalX, MAP.players[i].globalY, MAP.items[j].globalX, MAP.items[j].globalY);
        if (dist < pickupRadius) {
            addItem(i, j);
            break;
        }
    }
}
function addItem(playerIndex, itemIndex) {
    if (MAP.items[itemIndex].name == 'gold') {
        addGoldAmount(playerIndex, itemIndex);
    } else {
        for (let i = 0; i <= inventoryHeight - MAP.items[itemIndex].height; i++) {
            for (let j = 0; j <= inventoryWidth - MAP.items[itemIndex].width; j++) {
                if (!MAP.items[itemIndex].inBag) {
                    if (checkItemCells(playerIndex, itemIndex, i, j)) {
                        // checking if any free space exists and fitting the object
                        return;
                    }
                } else { return }
            }
        }
    }
}
function addGoldAmount(playerIndex, itemIndex) {
    MAP.players[playerIndex].gold += MAP.items[itemIndex].amount;
    deleteFromMap(itemIndex);
}
function checkItemCells(playerIndex, itemIndex, i, j) {
    let counter = MAP.items[itemIndex].width * MAP.items[itemIndex].height;
    for (let ii = 0; ii < MAP.items[itemIndex].height; ii++) {
        for (let jj = 0; jj < MAP.items[itemIndex].width; jj++) {
            if (MAP.players[playerIndex].inventory[i + ii][j + jj] == 0) {
                counter--;
                if (counter == 0) {
                    fitItem(playerIndex, itemIndex, i, ii, j, jj);
                    addToPlayerItems(playerIndex, itemIndex);
                    deleteFromMap(itemIndex);
                    return true;
                }
            }
        }
    }
    return false;
}
function fitItem(playerIndex, itemIndex, i, ii, j, jj) {
    // ii - height of an item
    // jj - width of an item
    MAP.items[itemIndex].inBag = true;
    MAP.items[itemIndex].globalX = j;
    MAP.items[itemIndex].globalY = i;
    for (let iii = 0; iii <= ii; iii++) {
        for (let jjj = 0; jjj <= jj; jjj++) {
            MAP.players[playerIndex].inventory[i + iii][j + jjj] = 1;
        }
    }
}
function useSkill(socketId) {
    let i = findPlayerIndex(socketId);
    if (MAP.players[i].globalX < MAP.cityStartX || MAP.players[i] > MAP.cityEndX || MAP.players[i].globalY < MAP.cityStartY || MAP.players[i].globalY > MAP.cityEndY) {
        if (MAP.players[i].mana >= MAP.players[i].activeSkill.skillMana && MAP.players[i].lastSkill < Date.now() - MAP.players[i].attackSpeed) {
            let newSkillRadius = 100; // different for different skills each skill will have its own class that extends normal skill class
            let newSkill = new RoundSkill(MAP.players[i].globalX, MAP.players[i].globalY, MAP.players[i].activeSkill.skillName, MAP.players[i].activeSkill.skillDamage, socketId, Date.now(), newSkillRadius);
            MAP.players[i].blockTimestamp = Date.now();
            MAP.players[i].blockTimeLimit = 500; // different for different skills each skill will have its own class that extends normal skill class
            newSkill.attack();
            MAP.skills.push(newSkill);
            MAP.players[i].mana -= MAP.players[i].activeSkill.skillMana;
            MAP.players[i].lastSkill = Date.now();
        }
    }
}
function addToPlayerItems(playerIndex, itemIndex) {
    MAP.players[playerIndex].items.push(MAP.items[itemIndex]);
}
function deleteFromMap(itemIndex) {
    MAP.items.splice(itemIndex, 1);
}
let connections = [];

function refreshServerState() {
    if (MAP.players) {
        for (let i = 0; i < MAP.players.length; i++) {
            MAP.players[i].healthManaRegen();
        }
    }
}
// Pendant
function takeOutPendant(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].pendant;
    MAP.players[i].pendant = null;
}
function putOnPendant(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'pendant') {
        MAP.players[i].pendant = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changePendant(socketId) {
    let i = findPlayerIndex(socketId)
    let oldPendant = MAP.players[i].pendant;
    let newPendant = MAP.players[i].draggingItem;
    MAP.players[i].pendant = newPendant;
    MAP.players[i].draggingItem = oldPendant;
}
// Wing Cape
function takeOutWingCape(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].wingCape;
    MAP.players[i].wingCape = null;
}
function putOnWingCape(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'wingCape') {
        MAP.players[i].wingCape = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changeWingCape(socketId) {
    let i = findPlayerIndex(socketId)
    let oldWingCape = MAP.players[i].wingCape;
    let newWingCape = MAP.players[i].draggingItem;
    MAP.players[i].wingCape = newWingCape;
    MAP.players[i].draggingItem = oldWingCape;
}
// Left Weapon
function takeOutLeftWeapon(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].leftWeapon;
    MAP.players[i].leftWeapon = null;
}
function putOnLeftWeapon(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'weapon') {
        MAP.players[i].leftWeapon = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changeLeftWeapon(socketId) {
    let i = findPlayerIndex(socketId)
    let oldLeftWeapon = MAP.players[i].leftWeapon;
    let newLeftWeapon = MAP.players[i].draggingItem;
    MAP.players[i].leftWeapon = newLeftWeapon;
    MAP.players[i].draggingItem = oldLeftWeapon;
}
// Right Weapon
function takeOutRightWeapon(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].rightWeapon;
    MAP.players[i].rightWeapon = null;
}
function putOnRightWeapon(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'weapon') {
        MAP.players[i].rightWeapon = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changeRightWeapon(socketId) {
    let i = findPlayerIndex(socketId)
    let oldRightWeapon = MAP.players[i].rightWeapon;
    let newRightWeapon = MAP.players[i].draggingItem;
    MAP.players[i].rightWeapon = newRightWeapon;
    MAP.players[i].draggingItem = oldRightWeapon;
}
// Left Ring
function takeOutLeftRing(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].leftRing;
    MAP.players[i].leftRing = null;
}
function putOnLeftRing(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'ring') {
        MAP.players[i].leftRing = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changeLeftRing(socketId) {
    let i = findPlayerIndex(socketId)
    let oldLeftRing = MAP.players[i].leftRing;
    let newLeftRing = MAP.players[i].draggingItem;
    MAP.players[i].leftRing = newLeftRing;
    MAP.players[i].draggingItem = oldLeftRing;
}
// Right Ring
function takeOutRightRing(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem = MAP.players[i].rightRing;
    MAP.players[i].rightRing = null;
}
function putOnRightRing(socketId) {
    let i = findPlayerIndex(socketId);
    let action = false;
    if (MAP.players[i].draggingItem.type == 'ring') {
        MAP.players[i].rightRing = MAP.players[i].draggingItem;
        MAP.players[i].draggingItem = null;
        action = true;
    }
    return action;
}
function changeRightRing(socketId) {
    let i = findPlayerIndex(socketId)
    let oldRight = MAP.players[i].rightRing;
    let newRight = MAP.players[i].draggingItem;
    MAP.players[i].rightRing = newRight;
    MAP.players[i].draggingItem = oldRight;
}

function moveAllPlayers() {
    for (let i = 0; i < MAP.players.length; i++) {
        MAP.players[i].move();
        if (MAP.players[i].warehouseOpened) {
            if (distance(MAP.players[i].globalX, MAP.players[i].globalY, MAP.cityStartX + MAP.city.warehouse.globalX, MAP.cityStartY + MAP.city.warehouse.globalY) > MAP.city.warehouse.activeRadius) {
                MAP.players[i].warehouseOpened = false;
            }
        }
    }
}
function assignNewAngle(socketId, angle) {
    if (MAP.players.length > 0) {
        let i = findPlayerIndex(socketId);
        MAP.players[i].angle = angle;
    }
}
function directPlayer(socketId, mouseCoords) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].direct(mouseCoords.newMouseX, mouseCoords.newMouseY, MAP.players[i].angle);
}
function findPlayerIndex(socketId) {
    for (let i = 0; i < MAP.players.length; i++) {
        if (MAP.players[i].id === socketId) {
            return i;
        }
    }
}
// warehouse
function placingItemWarehouse(socketId, mouseCoords) {
    let i = findPlayerIndex(socketId);
    let status = false;
    if (checkItemCellsReplaceWarehouse(i, mouseCoords.y, mouseCoords.x)) {
        // checking if any free space exists and fitting the object
        status = true;
    }
    return status;
}
function checkItemCellsReplaceWarehouse(playerIndex, i, j) {
    let counter = MAP.players[playerIndex].draggingItem.width * MAP.players[playerIndex].draggingItem.height;
    if (i + MAP.players[playerIndex].draggingItem.height <= 10 && // warehouse width in cells
        j + MAP.players[playerIndex].draggingItem.width <= 16) { // warehouse height in cells
        for (let ii = 0; ii < MAP.players[playerIndex].draggingItem.height; ii++) {
            for (let jj = 0; jj < MAP.players[playerIndex].draggingItem.width; jj++) {
                if (MAP.players[playerIndex].warehouse[i + ii][j + jj] == 0) {
                    counter--;
                    if (counter == 0) {
                        fitItemReplaceWarehouse(playerIndex, i, ii, j, jj);
                        addToPlayerItemsReplaceWarehouse(playerIndex);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
function fitItemReplaceWarehouse(playerIndex, i, ii, j, jj) {
    // ii - height of an item
    // jj - width of an item
    MAP.players[playerIndex].draggingItem.inWarehouse = true;
    MAP.players[playerIndex].draggingItem.inBag = false;
    MAP.players[playerIndex].draggingItem.globalX = j;
    MAP.players[playerIndex].draggingItem.globalY = i;
    for (let iii = 0; iii <= ii; iii++) {
        for (let jjj = 0; jjj <= jj; jjj++) {
            MAP.players[playerIndex].warehouse[i + iii][j + jjj] = 1;
        }
    }
}
function addToPlayerItemsReplaceWarehouse(playerIndex) {
    MAP.players[playerIndex].warehouseItems.push(MAP.players[playerIndex].draggingItem);
    MAP.players[playerIndex].draggingItem = null;
}
function emptyWarehouseItemSpace(playerIndex, draggingItem) {
    // make zeros where the item was located
    for (let i = draggingItem.globalY; i < draggingItem.globalY + draggingItem.height; i++) {
        for (let j = draggingItem.globalX; j < draggingItem.globalX + draggingItem.width; j++) {
            MAP.players[playerIndex].warehouse[i][j] = 0;
        }
    }
}
function assignPickedItemWarehouse(socketId, pickedItem) {
    let i = findPlayerIndex(socketId);
    for (let j = 0; j < MAP.players[i].warehouseItems.length; j++) {
        if (MAP.players[i].warehouseItems[j].id == pickedItem.id) {
            MAP.players[i].draggingItem = MAP.players[i].warehouseItems[j];
            MAP.players[i].warehouseItems.splice(j, 1);
            MAP.players[i].draggingItem.inWarehouse = false;
            // emptyInventoryItemSpace(i, MAP.players[i].draggingItem);
            emptyWarehouseItemSpace(i, MAP.players[i].draggingItem);
        }
    }
}
// inventory
function placingItemInventory(socketId, mouseCoords) {
    let i = findPlayerIndex(socketId);
    let status = false;
    console.log(mouseCoords.y, mouseCoords.x);
    if (checkItemCellsReplace(i, mouseCoords.y, mouseCoords.x)) {
        // checking if any free space exists and fitting the object
        status = true;
    }
    return status;
}
function checkItemCellsReplace(playerIndex, i, j) {
    let counter = MAP.players[playerIndex].draggingItem.width * MAP.players[playerIndex].draggingItem.height;
    if (i + MAP.players[playerIndex].draggingItem.height <= 10 &&
        j + MAP.players[playerIndex].draggingItem.width <= 10) {
        // 10 is the amount of cells in the inventory width and height
        for (let ii = 0; ii < MAP.players[playerIndex].draggingItem.height; ii++) {
            for (let jj = 0; jj < MAP.players[playerIndex].draggingItem.width; jj++) {
                if (MAP.players[playerIndex].inventory[i + ii][j + jj] == 0) {
                    counter--;
                    if (counter == 0) {
                        fitItemReplace(playerIndex, i, ii, j, jj);
                        addToPlayerItemsReplace(playerIndex);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
function fitItemReplace(playerIndex, i, ii, j, jj) {
    // ii - height of an item
    // jj - width of an item
    MAP.players[playerIndex].draggingItem.inBag = true;
    MAP.players[playerIndex].draggingItem.inWarehouse = false;
    MAP.players[playerIndex].draggingItem.globalX = j;
    MAP.players[playerIndex].draggingItem.globalY = i;
    for (let iii = 0; iii <= ii; iii++) {
        for (let jjj = 0; jjj <= jj; jjj++) {
            MAP.players[playerIndex].inventory[i + iii][j + jjj] = 1;
        }
    }
}
function addToPlayerItemsReplace(playerIndex) {
    MAP.players[playerIndex].items.push(MAP.players[playerIndex].draggingItem);
    MAP.players[playerIndex].draggingItem = null;
}
function emptyInventoryItemSpace(playerIndex, draggingItem) {
    // make zeros where the item was located
    for (let i = draggingItem.globalY; i < draggingItem.globalY + draggingItem.height; i++) {
        for (let j = draggingItem.globalX; j < draggingItem.globalX + draggingItem.width; j++) {
            MAP.players[playerIndex].inventory[i][j] = 0;
        }
    }
}
function assignPickedItem(socketId, pickedItem) {
    let i = findPlayerIndex(socketId);
    for (let j = 0; j < MAP.players[i].items.length; j++) {
        if (MAP.players[i].items[j].id == pickedItem.id) {
            MAP.players[i].draggingItem = MAP.players[i].items[j];
            MAP.players[i].draggingItem.inBag = false;
            MAP.players[i].items.splice(j, 1);
            emptyInventoryItemSpace(i, MAP.players[i].draggingItem);
        }
    }
}
// dropping item
function dropPickedItem(socketId) {
    let i = findPlayerIndex(socketId);
    MAP.players[i].draggingItem.globalX = MAP.players[i].globalX;
    MAP.players[i].draggingItem.globalY = MAP.players[i].globalY;
    MAP.items.push(MAP.players[i].draggingItem);
    MAP.players[i].draggingItem = {};
}
function moveAllSkills() {
    for (let i = 0; i < MAP.skills.length; i++) {
        MAP.skills[i].move();
    }
}

function moveAllMonsters() {
    for (let i = 0; i < MAP.monsters.length; i++) {
        MAP.monsters[i].observe();
        if (MAP.monsters[i].walking) {
            MAP.monsters[i].move();
        }
    }
}

function openWarehouse(socketId) {
    let i = findPlayerIndex(socketId);
    if (!MAP.players[i].warehouseOpened) {
        if (distance(MAP.players[i].globalX, MAP.players[i].globalY, MAP.cityStartX + MAP.city.warehouse.globalX, MAP.cityStartY + MAP.city.warehouse.globalY) <= MAP.city.warehouse.activeRadius) {
            MAP.players[i].warehouseOpened = true;
        }
    }
}

function everyFrame() {
    moveAllSkills();
    moveAllPlayers();
    moveAllMonsters();
}

setInterval(everyFrame, 15);
setInterval(refreshServerState, 1000);

io.sockets.on('connection', function (socket) {
    connections.push(socket);

    // disconnect
    socket.on('disconnect', function () {
        let i = findPlayerIndex(socket.id)
        MAP.players.splice(i, 1);
    });

    socket.on('joined', function (data) {
        let nickname = data.nickname;
        let race = data.race;
        let id = socket.id;
        addNewPlayer(id, nickname, race);
        io.sockets.emit('initialState', MAP);
    });
    socket.on('pickitup', function () {
        pickNearObject(socket.id);
    });
    socket.on('updating', function () {
        //updatePlayerPosition(changes, socket.id);
        io.sockets.emit('refreshState', MAP);
    });
    socket.on('usingSkill', function () {
        useSkill(socket.id);
    });
    socket.on('changeAngle', function (angle) {
        assignNewAngle(socket.id, angle);
    });
    socket.on('directing', function (mouseCoords) {
        directPlayer(socket.id, mouseCoords);
    });

    // warehouse general actions
    socket.on('warehousePickItem', function (pickedItem) {
        assignPickedItemWarehouse(socket.id, pickedItem);
    });
    socket.on('placingItemWarehouse', function (mouseCoords) {
        let result = placingItemWarehouse(socket.id, mouseCoords);
        socket.emit('replacingItemWarehouseResult', result);
    });

    // inventory general actions
    socket.on('inventoryPickItem', function (pickedItem) {
        assignPickedItem(socket.id, pickedItem);
    });
    socket.on('placingItemInventory', function (mouseCoords) {
        let result = placingItemInventory(socket.id, mouseCoords);
        socket.emit('replacingItemInventoryResult', result);
    });
    // dropping item
    socket.on('dropPickedItem', function () {
        dropPickedItem(socket.id);
    });
    // pendant actions
    socket.on('takeOutPendant', function () {
        takeOutPendant(socket.id);
    });
    socket.on('putOnPendant', function () {
        let action = putOnPendant(socket.id);
        socket.emit('putOnPendantResult', action);
    });
    socket.on('changePendant', function () {
        changePendant(socket.id);
    });
    // wing cape actions
    socket.on('takeOutWingCape', function () {
        takeOutWingCape(socket.id);
    });
    socket.on('putOnWingCape', function () {
        let action = putOnWingCape(socket.id);
        socket.emit('putOnWingCapeResult', action);
    });
    socket.on('changeWingCape', function () {
        changeWingCape(socket.id);
    });
    // left weapon action
    socket.on('takeOutLeftWeapon', function () {
        takeOutLeftWeapon(socket.id);
    });
    socket.on('putOnLeftWeapon', function () {
        let action = putOnLeftWeapon(socket.id);
        socket.emit('putOnLeftWeaponResult', action);
    });
    socket.on('changeLeftWeapon', function () {
        changeLeftWeapon(socket.id);
    });
    // right weapon action
    socket.on('takeOutRightWeapon', function () {
        takeOutRightWeapon(socket.id);
    });
    socket.on('putOnRightWeapon', function () {
        let action = putOnRightWeapon(socket.id);
        socket.emit('putOnRightWeaponResult', action);
    });
    socket.on('changeRightWeapon', function () {
        changeRightWeapon(socket.id);
    });
    // left ring action
    socket.on('takeOutLeftRing', function () {
        takeOutLeftRing(socket.id);
    });
    socket.on('putOnLeftRing', function () {
        let action = putOnLeftRing(socket.id);
        socket.emit('putOnLeftRingResult', action);
    });
    socket.on('changeLeftRing', function () {
        changeLeftRing(socket.id);
    });
    // right ring action
    socket.on('takeOutRightRing', function () {
        takeOutRightRing(socket.id);
    });
    socket.on('putOnRightRing', function () {
        let action = putOnRightRing(socket.id);
        socket.emit('putOnRightRingResult', action);
    });
    socket.on('changeRightRing', function () {
        changeRightRing(socket.id);
    });
    socket.on('openWarehouse', function () {
        openWarehouse(socket.id);
    });
});