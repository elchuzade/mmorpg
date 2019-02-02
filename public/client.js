document.oncontextmenu = function () { return false; }
var socket = io.connect('http://localhost:4000');

let state = {};
let changes = {};
let angle = 0;
let localX = 0; let localY = 0;
let localMapX = 0; let localMapY = 0;
let myHero = {};
let barLength = 300;
let inventoryStatus = false;
let itemPickedStatus = false; // later merge it with pickedItem
let pickedItem = {};
let cellSide = 30; // size of a cell in inventory
let gridX;
let gridY;
let debugColor = 50;

function setup() {
    createCanvas(1000, 680);
    socket.emit('joined', {
        nickname: 'Kurush',
        race: 'Mage'
    });
    socket.on('initialState', function (initialState) {
        state = initialState;
    });
    localX = width / 2;
    localY = height / 2;
    if (state.players) {
        findMyHero(socket.id);
        updateCoordinates();
    }
    gridX = width - inventoryMargin - inventoryWidth;
    gridY = inventoryMargin + wearablesHeight;
    socket.emit('changeAngle', angle);
}
function draw() {
    background(0);
    if (state.players) {
        drawMap();
        drawCity();
        //drawGrid();
        drawLimits();
        drawShops();
        if (state.skills) {
            drawRoundSkill(); // draw all skills will be in future
        }
        drawMonsters();
        drawUI();
        if (inventoryStatus) {
            drawInventory();
        }
        drawMyHero();
        drawallHeroes();
    }
    if (state.items) {
        drawItems();
    }
    if (itemPickedStatus && myHero.draggingItem) {
        draggingPickedItem();
    }
    checkState();
    writeMouseCoordinates();
}
function drawShops() {
    drawWarehouseShop();
    if (myHero.warehouseOpened) {
        drawWarehouse();
    }
}
let statusBarMargin = 10;
let statusBarWidth = 320;
let statusBarHeight = 140;

let warehouseWidth = 300;
let warehouseMargin = 20;
let warehouseHeight = 480;
let warehouseGridX = warehouseMargin;
let warehouseGridY = warehouseMargin + statusBarMargin + statusBarHeight;
let gridWarehousedWidth = 300; // to be fixed later
let gridWarehouseHeight = 480; // to be fixed later

function drawWarehouse() {
    push();
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(150, 150, 150);
    translate(warehouseGridX, warehouseGridY)
    rect(0, 0, warehouseWidth, warehouseHeight);
    fill(175, 175, 175);
    grid(0, 0, gridWarehousedWidth, gridWarehouseHeight, cellSide);
    if (myHero.warehouseItems.length > 0) {
        addWarehouseItems(cellSide);
    }
    pop();
    // change to warehouse gridX and gridY and gridWidth and gridHeight
    if (mouseX > warehouseGridX && mouseX < warehouseMargin + warehouseWidth &&
        mouseY > warehouseGridY && mouseY < warehouseMargin + warehouseHeight) {
        hoverItem();
    }
}

function addWarehouseItems(cellSide) {
    for (let i = 0; i < myHero.warehouseItems.length; i++) {
        fill(myHero.warehouseItems[i].colorR, myHero.warehouseItems[i].colorG, myHero.warehouseItems[i].colorB);
        rect(myHero.warehouseItems[i].globalX * cellSide, myHero.warehouseItems[i].globalY * cellSide, myHero.warehouseItems[i].width * cellSide, myHero.warehouseItems[i].height * cellSide);
    }
}

function drawWarehouseShop() {
    let localWarehouseX = localMapX + state.city.warehouse.globalX + state.cityStartX;
    let localWarehouseY = localMapY + state.city.warehouse.globalY + state.cityStartY;
    push();
    fill(0, 0, debugColor);
    ellipse(localWarehouseX, localWarehouseY, state.city.warehouse.side);
    pop();
}

function draggingPickedItem() {
    push();
    fill(myHero.draggingItem.colorR, myHero.draggingItem.colorG, myHero.draggingItem.colorB);
    translate(mouseX, mouseY);
    rect(0, 0, myHero.draggingItem.width * cellSide, myHero.draggingItem.height * cellSide);
    pop();
}
function drawRoundSkill() {
    for (let i = 0; i < state.skills.length; i++) {
        if (state.skills[i].name == 'hellfire') {
            let localSkillX = localMapX + state.skills[i].globalX;
            let localSkillY = localMapY + state.skills[i].globalY;
            push();
            fill(200, 0, 200);
            ellipse(localSkillX, localSkillY, state.skills[i].radius * 2);
            pop();
        }
    }
}
function drawMonsters() {
    for (let i = 0; i < state.monsters.length; i++) {
        let localMonsterX = localMapX + state.monsters[i].globalX;
        let localMonsterY = localMapY + state.monsters[i].globalY;
        //let monsterMouseAngle = state.players[i].angle;
        push();
        fill(255, 0, 0);
        noStroke();
        ellipse(localMonsterX, localMonsterY, 50);
        pop();
    }
}
function writeMouseCoordinates() {
    push();
    textSize(20);
    fill(255, 255, 255);
    text(mouseX + ' : ' + mouseY, mouseX - 100, mouseY + 20);
    pop();
}
function drawUI() {
    push();
    translate(statusBarMargin, statusBarMargin);
    statusBar();
    //buffBar();
    //skillBar();
    //menuBar();
    //miniMap();
    pop();
}
function statusBar() {
    frame();
    level();
    nickname();
    healthBar();
    manaBar();
    expBar();
}
function frame() {
    fill(225, 225, 225, 150);
    rect(0, 0, statusBarWidth, statusBarHeight);
}
function level() {
    fill(255, 255, 255);
    rect(10, 10, 30, 30);
}
function nickname() {
    rect(50, 10, 260, 30);
}
function healthBar() {
    let factor = myHero.maxHealth / barLength;
    let healthLength = myHero.health / factor;
    push();
    fill(120, 120, 120);
    rect(10, 50, barLength, 20);
    fill(255, 0, 0);
    rect(10, 50, healthLength, 20);
    stroke(25, 25, 25);
    strokeWeight(3);
    line(10 + healthLength, 55, 10 + healthLength, 65);
    textSize(16);
    noStroke();
    fill(255, 255, 255);
    text(myHero.health + ' / ' + myHero.maxHealth, 20, 66);
    pop();
}
function manaBar() {
    let factor = myHero.maxMana / barLength;
    let manaLength = myHero.mana / factor;
    push();
    fill(120, 120, 120);
    rect(10, 80, barLength, 20);
    fill(0, 0, 255);
    rect(10, 80, manaLength, 20);
    stroke(25, 25, 25);
    strokeWeight(3);
    line(10 + manaLength, 85, 10 + manaLength, 95);
    textSize(16);
    noStroke();
    fill(255, 255, 255);
    text(myHero.mana + ' / ' + myHero.maxMana, 20, 96);
    pop();
}
function expBar() {
    let factor = myHero.maxExperience / barLength;
    let expLength = myHero.experience / factor;
    push();
    fill(120, 120, 120);
    rect(10, 110, barLength, 20);
    fill(180, 126, 22);
    rect(10, 110, expLength, 20);
    stroke(25, 25, 25);
    strokeWeight(3);
    line(10 + expLength, 115, 10 + expLength, 125);
    textSize(16);
    noStroke();
    fill(255, 255, 255);
    text(myHero.experience + ' / ' + myHero.maxExperience, 20, 126);
    pop();
}
function drawMap() {
    push();
    fill(30, 30, 30);
    rect(localMapX, localMapY, state.width, state.height);
    pop();
}
function drawCity() {
    push();
    fill(60, 60, 60);
    translate(localMapX, localMapY);
    rect(state.cityStartX, state.cityStartY, state.cityEndX - state.cityStartX, state.cityEndY - state.cityStartY);
    pop();
}
function findMyHero(socketId) {
    for (let i = 0; i < state.players.length; i++) {
        if (state.players[i].id == socketId) {
            myHero = state.players[i];
        }
    }
}
function movePlayer() {
    //changes.leftClick = true; // check if left click is even needed ???
    let newMouseX = myHero.globalX - localX + mouseX;
    let newMouseY = myHero.globalY - localY + mouseY;
    let mouseCoords = {
        newMouseX,
        newMouseY
    }
    socket.emit('directing', mouseCoords);
    // make a new socket emit later for moving only
}
function dropPickedItem() {
    socket.emit('dropPickedItem');
    itemPickedStatus = false;
}
function checkState() {
    socket.emit('updating');
    socket.on('refreshState', function (refreshedState) {
        state = refreshedState;
    });
    // left click of a mouse and hold to move the player non stop
    if (mouseIsPressed && mouseButton == LEFT) {
        if (!inventoryStatus) {
            movePlayer();
        } else {
            if (mouseX < width - inventoryMargin - inventoryWidth ||
                mouseX > width - inventoryMargin ||
                mouseY < inventoryMargin ||
                mouseY > inventoryMargin + inventoryHeight) {
                movePlayer();
            }
        }
    }
    // right click of a mouse and hold to use skill every skill refresh seconds
    if (mouseIsPressed && mouseButton == RIGHT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        socket.emit('usingSkill');
    }
    if (state.players) {
        findMyHero(socket.id);
    }
    updateCoordinates();
}
function mousePressed() {
    if (mouseButton == LEFT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        // clicking left mouse button in the browser area
        if (!inventoryStatus) {
            // inventory is closed any left click should be a walk command or drop item command
            if (itemPickedStatus) {
                // drop item
                dropPickedItem();
            } else {
                // no item picked sp just walk
                // moving the player
                movePlayer();
            }
        } else {
            // inventory is opened only clicks out of inventory should be a walk command
            if (mouseX > width - inventoryWidth - inventoryMargin &&
                mouseX < width - inventoryMargin &&
                mouseY > inventoryMargin &&
                mouseY < inventoryMargin + inventoryHeight) {
                // clicking inside inventory
                // checking which item to pick up while no item is picked
                if (mouseX > gridX &&
                    mouseX < gridX + gridWidth &&
                    mouseY > gridY &&
                    mouseY < gridY + gridHeight) {
                    // clicking inside the grid of an inventory
                    if (itemPickedStatus) {
                        // Update the item's position to a new place in inventory if allowed
                        let mouseCoords = {
                            x: Math.floor((mouseX - gridX) / cellSide),
                            y: Math.floor((mouseY - gridY) / cellSide)
                        };
                        socket.emit('placingItemInventory', mouseCoords);
                        socket.on('replacingItemResult', function (result) {
                            if (result) {
                                pickedItem = {};
                                itemPickedStatus = false;
                            }
                        });
                    } else {
                        // Pick an item up
                        myHero.items.forEach(function (item) {
                            if (mouseX > gridX + item.globalX * cellSide &&
                                mouseX < gridX + (item.globalX + item.width) * cellSide &&
                                mouseY > gridY + item.globalY * cellSide &&
                                mouseY < gridY + (item.globalY + item.height) * cellSide) {
                                pickedItem = item;
                                itemPickedStatus = true;
                                socket.emit('inventoryPickItem', pickedItem);
                            }
                        });
                    }
                }
                // dealing with a pendant slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + pendantX &&
                    mouseX < width - inventoryMargin - inventoryWidth + pendantX + ringPendantSide &&
                    mouseY > inventoryMargin + ringPendantY &&
                    mouseY < inventoryMargin + ringPendantY + ringPendantSide) {
                    // clicking on a pendant area
                    if (itemPickedStatus) {
                        // clicking on a pendant area with an item picked
                        // change the pendant
                        if (myHero.pendant) {
                            // change the pendant to a picked item if it is a pendant
                            socket.emit('changePendant');
                        } else {
                            // i dont have a pendant so assign a picked item as a pendant
                            socket.emit('putOnPendant');
                            socket.on('putOnPendantResult', function (action) {
                                if (action) {
                                    // this way i make sure that the pendant is being placed in a pendant place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the pendant if exists or do nothing if doesnt exist a pendant
                        if (myHero.pendant) {
                            // pick up the pendant from a pendant area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutPendant');
                        }
                    }
                }
                // dealing with a wing cape slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + wingCapeX &&
                    mouseX < width - inventoryMargin - inventoryWidth + wingCapeX + wingCapeWidth &&
                    mouseY > inventoryMargin + wingCapeY &&
                    mouseY < inventoryMargin + wingCapeY + wingCapeHeight) {
                    // clicking on a wing cape area
                    if (itemPickedStatus) {
                        // clicking on a wing cape area with an item picked
                        // change the wing cape
                        if (myHero.wingCape) {
                            // change the wing cape to a picked item if it is a wing cape
                            socket.emit('changeWingCape');
                        } else {
                            // i dont have a wing cape so assign a picked item as a wing cape
                            socket.emit('putOnWingCape');
                            socket.on('putOnWingCapeResult', function (action) {
                                if (action) {
                                    // this way i make sure that the wing cape is being placed in a wing cape place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the wing cape if exists or do nothing if doesnt exist a wing cape
                        if (myHero.wingCape) {
                            // pick up the wing cape from a wing cape area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutWingCape');
                        }
                    }
                }
                // dealing with a left weapon slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + leftWeaponX &&
                    mouseX < width - inventoryMargin - inventoryWidth + leftWeaponX + weaponWidth &&
                    mouseY > inventoryMargin + weaponY &&
                    mouseY < inventoryMargin + weaponY + weaponHeight) {
                    // clicking on a left weapon area
                    if (itemPickedStatus) {
                        // clicking on a left weapon area with an item picked
                        // change the left weapon
                        if (myHero.leftWeapon) {
                            // change the left weapon to a picked item if it is a left weapon
                            socket.emit('changeLeftWeapon');
                        } else {
                            // i dont have a left weapon so assign a picked item as a left weapon
                            socket.emit('putOnLeftWeapon');
                            socket.on('putOnLeftWeaponResult', function (action) {
                                if (action) {
                                    // this way i make sure that the left weapon is being placed in a left weapon place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the left weapon if exists or do nothing if doesnt exist a left weapon
                        if (myHero.leftWeapon) {
                            // pick up the left weapon from a left weapon area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutLeftWeapon');
                        }
                    }
                }
                // dealing with a right weapon slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + rightWeaponX &&
                    mouseX < width - inventoryMargin - inventoryWidth + rightWeaponX + weaponWidth &&
                    mouseY > inventoryMargin + weaponY &&
                    mouseY < inventoryMargin + weaponY + weaponHeight) {
                    // clicking on a right weapon area
                    if (itemPickedStatus) {
                        // clicking on a right weapon area with an item picked
                        // change the right weapon
                        if (myHero.rightWeapon) {
                            // change the right weapon to a picked item if it is a right weapon
                            socket.emit('changeRightWeapon');
                        } else {
                            // i dont have a right weapon so assign a picked item as a right weapon
                            socket.emit('putOnRightWeapon');
                            socket.on('putOnRightWeaponResult', function (action) {
                                if (action) {
                                    // this way i make sure that the right weapon is being placed in a right weapon place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the right weapon if exists or do nothing if doesnt exist a right weapon
                        if (myHero.rightWeapon) {
                            // pick up the right weapon from a right weapon area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutRightWeapon');
                        }
                    }
                }
                // dealing with a right ring slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + leftRingX &&
                    mouseX < width - inventoryMargin - inventoryWidth + leftRingX + ringPendantSide &&
                    mouseY > inventoryMargin + ringPendantY &&
                    mouseY < inventoryMargin + ringPendantY + ringPendantSide) {
                    // clicking on a left ring area
                    if (itemPickedStatus) {
                        // clicking on a left ring area with an item picked
                        // change the left ring
                        if (myHero.leftRing) {
                            // change the left ring to a picked item if it is a left ring
                            socket.emit('changeLeftRing');
                        } else {
                            // i dont have a left ring so assign a picked item as a left ring
                            socket.emit('putOnLeftRing');
                            socket.on('putOnLeftRingResult', function (action) {
                                if (action) {
                                    // this way i make sure that the left ring is being placed in a left ring place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the left ring if exists or do nothing if doesnt exist a left ring
                        if (myHero.leftRing) {
                            // pick up the left ring from a left ring area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutLeftRing');
                        }
                    }
                }
                // dealing with a right ring slot in the inventory
                if (mouseX > width - inventoryMargin - inventoryWidth + rightRingX &&
                    mouseX < width - inventoryMargin - inventoryWidth + rightRingX + ringPendantSide &&
                    mouseY > inventoryMargin + ringPendantY &&
                    mouseY < inventoryMargin + ringPendantY + ringPendantSide) {
                    // clicking on a right ring area
                    if (itemPickedStatus) {
                        // clicking on a right ring area with an item picked
                        // change the right ring
                        if (myHero.rightRing) {
                            // change the right ring to a picked item if it is a right ring
                            socket.emit('changeRightRing');
                        } else {
                            // i dont have a right ring so assign a picked item as a right ring
                            socket.emit('putOnRightRing');
                            socket.on('putOnRightRingResult', function (action) {
                                if (action) {
                                    // this way i make sure that the right ring is being placed in a right ring place
                                    itemPickedStatus = false;
                                }
                            });
                        }
                    } else {
                        // no item is picked so pick the right ring if exists or do nothing if doesnt exist a right ring
                        if (myHero.rightRing) {
                            // pick up the right ring from a right ring area of my hero
                            itemPickedStatus = true;
                            socket.emit('takeOutRightRing');
                        }
                    }
                }
            } else {
                // clicking outside of inventory
                if (itemPickedStatus) {
                    dropPickedItem();
                    // drop item
                } else {
                    // no item picked sp just walk
                    // moving the player
                    movePlayer();
                }
            }
        }
    } else if (mouseButton == RIGHT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let localWarehouseCenterX = localMapX + state.cityStartX + state.city.warehouse.globalX;
        let localWarehouseCenterY = localMapY + state.cityStartY + state.city.warehouse.globalY;
        // kind of a radius for the warehouse center
        if (dist(mouseX, mouseY, localWarehouseCenterX, localWarehouseCenterY) < state.city.warehouse.side / 2) {
            socket.emit('openWarehouse');
        } else {
            socket.emit('usingSkill');
        }
    }
}
function updateCoordinates() {
    localMapX = localX - myHero.globalX;
    localMapY = localY - myHero.globalY;
}
function mouseMoved() {
    determineMouseAngle();
    mouseHover();
}
function mouseHover() {
    let localWarehouseCenterX = localMapX + state.cityStartX + state.city.warehouse.globalX;
    let localWarehouseCenterY = localMapY + state.cityStartY + state.city.warehouse.globalY;
    if (itemPickedStatus) {
        noCursor();
    } else {
        if (dist(mouseX, mouseY, localWarehouseCenterX, localWarehouseCenterY) < state.city.warehouse.side / 2) {
            cursor('help');
        } else {
            cursor('auto');
        }
    }
}
function mouseDragged() {
    determineMouseAngle();
}
function determineMouseAngle() {
    let dx = width / 2 - mouseX;
    let dy = height / 2 - mouseY;
    angle = Math.atan2(-dy, -dx);
    socket.emit('changeAngle', angle);
}
function drawallHeroes() {
    for (let i = 0; i < state.players.length; i++) {
        if (state.players[i].id != socket.id) {
            let localMobX = localMapX + state.players[i].globalX;
            let localMobY = localMapY + state.players[i].globalY;
            let mobMouseAngle = state.players[i].angle;
            push();
            fill(255, 0, 255);
            noStroke();
            translate(localMobX, localMobY);
            rotate(mobMouseAngle);
            drawHeroTemplate();
            pop();
        }
    }
}
function drawGrid() {
    push();
    strokeWeight(1);
    stroke(127, 63, 120);
    for (let i = -myHero.globalX % 100; i < state.width; i += 100) {
        line(i, 0, i, state.height);
    }
    for (let j = -myHero.globalY % 100; j < state.height; j += 100) {
        line(0, j, state.width, j);
    }
    pop();
}
function drawLimits() {
    push();
    noFill();
    stroke(222, 222, 222);
    rect(localMapX, localMapY, state.width, state.height);
    pop();
}
function drawMyHero() {
    push();
    fill(255, 255, 255);
    noStroke();
    translate(localX, localY);
    if (myHero.angle) {
        rotate(myHero.angle);
    }
    drawHeroTemplate();
    pop();
}
function drawHeroTemplate() {
    push();
    stroke(255, 255, 255);
    strokeWeight(4);
    noFill();
    // head
    ellipse(0, 0, 50, 50);
    // arms
    line(0, 25, 40, 35);
    line(0, -25, 40, -35);
    // hands
    fill(255, 255, 255);
    ellipse(40, 30, 10, 10);
    ellipse(40, -30, 10, 10);
    noStroke();
    pop();
}
function drawItems() {
    for (let i = 0; i < state.items.length; i++) {
        let localItemX = localMapX + state.items[i].globalX;
        let localItemY = localMapY + state.items[i].globalY;
        rect(localItemX, localItemY, 20, 20);
    }
}
function keyPressed() {
    if (key.charCodeAt(0) == 32) {
        socket.emit('pickitup');
        //addItem();
    };
    //console.log(key.charCodeAt(0));
    if (key.charCodeAt(0) == 118) {
        if (inventoryStatus) {
            inventoryStatus = false;
        } else {
            inventoryStatus = true;
        }
    }
}
let inventoryWidth = 300;
let inventoryMargin = 20;
let inventoryHeight = 510;
let gridWidth = 300;
let gridHeight = 300;
let wearablesHeight = 150;
function drawInventory() {
    push();
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(150, 150, 150);
    translate(width - inventoryWidth - inventoryMargin, inventoryMargin)
    rect(0, 0, inventoryWidth, inventoryHeight);
    line(0, wearablesHeight, inventoryWidth, wearablesHeight);
    line(0, wearablesHeight + gridHeight, inventoryWidth, wearablesHeight + gridHeight);
    fill(175, 175, 175);
    // drawing all the wearables
    wearables();
    // dressing up wearables
    dressUp();
    // making a grid for carryables
    translate(0, wearablesHeight);
    grid(0, 0, gridWidth, gridHeight, cellSide);
    // add hero characteristics
    heroInfoBar();
    // add gold bar
    goldBar();
    if (myHero.items.length > 0) {
        addInventoryItems(cellSide);
    }
    pop();
    if (!itemPickedStatus) {
        if (mouseX > gridX + heroInfoX &&
            mouseX < gridX + heroInfoX + heroInfoSide &&
            mouseY > gridY + heroInfoY &&
            mouseY < gridY + heroInfoY + heroInfoSide) {
            showInventoryHeroInfo();
        }
    }
    if (mouseX > gridX && mouseX < gridX + gridWidth &&
        mouseY > gridY && mouseY < gridY + gridHeight) {
        hoverItem();
    }
}

function dressUp() {
    // drawing a pendant if exists
    if (myHero.pendant) {
        push();
        fill(myHero.pendant.colorR, myHero.pendant.colorG, myHero.pendant.colorB);
        rect(pendantX, ringPendantY, ringPendantSide, ringPendantSide);
        pop();
    }
    if (myHero.wingCape) {
        push();
        fill(myHero.wingCape.colorR, myHero.wingCape.colorG, myHero.wingCape.colorB);
        rect(wingCapeX, wingCapeY, wingCapeWidth, wingCapeHeight);
        pop();
    }
    if (myHero.leftWeapon) {
        push();
        fill(myHero.leftWeapon.colorR, myHero.leftWeapon.colorG, myHero.leftWeapon.colorB);
        rect(leftWeaponX, weaponY, weaponWidth, weaponHeight);
        pop();
    }
    if (myHero.rightWeapon) {
        push();
        fill(myHero.rightWeapon.colorR, myHero.rightWeapon.colorG, myHero.rightWeapon.colorB);
        rect(rightWeaponX, weaponY, weaponWidth, weaponHeight);
        pop();
    }
    if (myHero.leftRing) {
        push();
        fill(myHero.leftRing.colorR, myHero.leftRing.colorG, myHero.leftRing.colorB);
        rect(leftRingX, ringPendantY, ringPendantSide, ringPendantSide);
        pop();
    }
    if (myHero.rightRing) {
        push();
        fill(myHero.rightRing.colorR, myHero.rightRing.colorG, myHero.rightRing.colorB);
        rect(rightRingX, ringPendantY, ringPendantSide, ringPendantSide);
        pop();
    }
}

function addInventoryItems(cellSide) {
    for (let i = 0; i < myHero.items.length; i++) {
        fill(myHero.items[i].colorR, myHero.items[i].colorG, myHero.items[i].colorB);
        rect(myHero.items[i].globalX * cellSide, myHero.items[i].globalY * cellSide, myHero.items[i].width * cellSide, myHero.items[i].height * cellSide);
    }
}

let leftWeaponX = 15;
let weaponY = 15;
let rightWeaponX = 225;
let weaponWidth = 60;
let weaponHeight = 120;

let wingCapeX = 90;
let wingCapeY = 15;
let wingCapeWidth = 120;
let wingCapeHeight = 75;

let leftRingX = 90;
let pendantX = 135;
let rightRingX = 180;
let ringPendantY = 105;
let ringPendantSide = 30;

let heroInfoX = 15;
let heroInfoY = 315;
let heroInfoSide = 30;

let goldBarX = 60;
let goldBarY = 315;
let goldBarWidth = 225;
let goldBarHeight = 30;

let infoWidth = 200;
let infoHeight = 400;
let infoMargin = 10;

let itemInfoWidth = 200;
let itemInfoHeight = 300;

function wearables() {
    rect(leftWeaponX, weaponY, weaponWidth, weaponHeight);              // left hand weapon
    rect(wingCapeX, wingCapeY, wingCapeWidth, wingCapeHeight);          // wings or capes
    rect(rightWeaponX, weaponY, weaponWidth, weaponHeight);             // right hand weapon
    rect(leftRingX, ringPendantY, ringPendantSide, ringPendantSide);    // left ring
    rect(pendantX, ringPendantY, ringPendantSide, ringPendantSide);     // pendant
    rect(rightRingX, ringPendantY, ringPendantSide, ringPendantSide);   // right ring
}
function heroInfoBar() {
    rect(heroInfoX, heroInfoY, heroInfoSide, heroInfoSide);
}
function goldBar() {
    rect(goldBarX, goldBarY, goldBarWidth, goldBarHeight);
    addGoldNumber();
}
function addGoldNumber() {
    push();
    textSize(20);
    fill(0, 0, 0);
    text(myHero.gold, goldBarX + 10, goldBarY + 22);
    pop();
}
function grid(startX, startY, endX, endY, cellSide) {
    for (let i = 0; i < Math.floor((endX - startX) / cellSide); i++) {
        line(startX + cellSide * i, startY, startX + cellSide * i, endY);
    }
    for (let j = 0; j < Math.floor((endY - startY) / cellSide); j++) {
        line(startX, startY + cellSide * j, endX, startY + cellSide * j);
    }
}
function showInventoryHeroInfo() {
    push();
    fill(200, 200, 200);
    rect(width - inventoryWidth - inventoryMargin - infoWidth - infoMargin, inventoryHeight + inventoryMargin - infoHeight, infoWidth, infoHeight);
    pop();
}
function hoverItem() {
    if (!itemPickedStatus) {
        myHero.items.forEach(function (item) {
            if (mouseX > gridX + item.globalX * cellSide &&
                mouseX < gridX + (item.globalX + item.width) * cellSide &&
                mouseY > gridY + item.globalY * cellSide &&
                mouseY < gridY + (item.globalY + item.height) * cellSide) {
                showItemInfo();
            }
        });
    }
}
function showItemInfo() {
    push();
    translate(gridX - itemInfoWidth - infoMargin, gridY - itemInfoHeight / 2);
    fill(200, 200, 200);
    rect(0, 0, itemInfoWidth, itemInfoHeight);
    pop();
}
