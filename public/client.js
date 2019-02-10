document.oncontextmenu = function () { return false; }
var socket = io.connect('http://localhost:4000');

let foundMyHero = false;
let calculator = false;
let calcOutput = 0;
let calcItem = '';

let width = 1200;
let height = 660;
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
let miniMapHeight = 150;
let miniMapMargin = 20;

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

let inventoryWidth = 300;
let inventoryMargin = 20;
let inventoryHeight = 510;
let inventoryX = null;
let inventoryY = inventoryMargin;

let gridWidth = 300;
let gridHeight = 300;
let wearablesHeight = 150;

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

function setup() {
    createCanvas(1200, 660);
    inventoryX = width - inventoryMargin - inventoryWidth; // because it depends on width have to make it after setup is run
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
    };
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
        miniMap();
        drawShops();
        if (state.skills) {
            drawRoundSkill(); // draw all skills will be in future
            drawBeamSkill();
            drawLightningSkill();
        }
        if (foundMyHero) {
            if (myHero.tradeStatus) {
                drawTrade();
            }
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
    if (calculator) {
        drawCalc();
    }
    checkState();
    writeMouseCoordinates();
}

let calcW = cellSide * 4;
let calcH = cellSide * 5;
let calcX = width / 2 - calcW / 2;
let calcY = height / 2 - calcH;

function drawCalc() {
    push();
    stroke(10, 10, 10);
    fill(200, 200, 200);
    rect(calcX, calcY, calcW, calcH);
    noFill();
    grid(calcX, calcY, calcX + calcW, calcY + calcH, cellSide);
    fill(200, 200, 200);
    rect(calcX, calcY, calcW, cellSide);
    rect(calcX + cellSide, calcY + cellSide * 4, cellSide * 2, cellSide);
    fill(10, 10, 10);
    addCalcNumText();
    pop();
}
function addCalcDigit(digit) {
    if (Math.floor(calcOutput / 100000000) == 0) {
        calcOutput = calcOutput * 10 + digit;
    }
}
function resetCalcValue() {
    calcOutput = 0;
}
function removeCalcDigit() {
    calcOutput = Math.floor(calcOutput / 10);
}
function cancelCalcValue() {
    calculator = false;
}
function addCalcNumText() {
    textSize(20);
    // first row
    text('1', calcX + 10, calcY + cellSide + 23);
    text('2', calcX + 10 + cellSide, calcY + cellSide + 23);
    text('3', calcX + 10 + cellSide * 2, calcY + cellSide + 23);
    text('C', calcX + 8 + cellSide * 3, calcY + cellSide + 23);
    // second row
    text('4', calcX + 10, calcY + cellSide * 2 + 23);
    text('5', calcX + 10 + cellSide, calcY + cellSide * 2 + 23);
    text('6', calcX + 10 + cellSide * 2, calcY + cellSide * 2 + 23);
    text('<', calcX + 10 + cellSide * 3, calcY + cellSide * 2 + 23);
    // third row
    text('7', calcX + 10, calcY + cellSide * 3 + 23);
    text('8', calcX + 10 + cellSide, calcY + cellSide * 3 + 23);
    text('9', calcX + 10 + cellSide * 2, calcY + cellSide * 3 + 23);
    text('V', calcX + 8 + cellSide * 3, calcY + cellSide * 3 + 23);
    // fourth row
    text('0', calcX + 10, calcY + cellSide * 4 + 23);
    text('ALL', calcX + 12 + cellSide, calcY + cellSide * 4 + 23);
    text('X', calcX + 8 + cellSide * 3, calcY + cellSide * 4 + 23);
    // value
    text(calcOutput, calcX + 10, calcY + 23);
}
function allInCalc() {
    if (calcItem == 'gold') {
        console.log('cac');
        if (myHero.gold > 999999999) {
            calcOutput = 999999999;
        } else {
            calcOutput = myHero.gold;
        }
    }
}
function sendCalcValue() {
    console.log('rqrqrqrqr');
    if (myHero.tradeStatus) {
        // trading some items
        if (calcItem == 'gold') {
            // trading gold with the calculator
            socket.emit('tradeAddGold', calcOutput);
            calculator = false;
        }
    }
}

let tradeGridW = cellSide * 8;
let tradeGridH = cellSide * 6;
let tradeGridMargin = cellSide;
let tradeGoldBarMargin = cellSide / 2;
let tradeGoldBarH = cellSide;
let tradeGoldBarW = cellSide * 4;
let tradeBtnH = cellSide;
let tradeBtnW = cellSide * 2;
let tradeW = tradeGridW * 2 + tradeGridMargin;
let tradeH = tradeGridH + tradeGoldBarH + tradeGoldBarMargin * 2;
let tradeX = width / 2 - tradeW / 2;
let tradeMargin = 50; // this value will be calculated according to the height of the bottom center bar for active skills
let tradeY = height - tradeMargin - tradeH;
let tradeGoldBarLeftX = tradeX + tradeGoldBarMargin;
let tradeGoldBarRightX = tradeX + tradeW - tradeGoldBarMargin - tradeGoldBarW;
let tradeGoldBarY = tradeY + tradeGridH + tradeGoldBarMargin;
let tradeBtnY = tradeGoldBarY;
let tradeGoldBtnX = tradeX + tradeGoldBarMargin * 2 + tradeGoldBarW;
let tradeCancelBtnX = tradeGoldBtnX + tradeBtnW + tradeGoldBarMargin;
let tradeAcceptBtnX = tradeCancelBtnX + tradeBtnW + tradeGoldBarMargin;

function drawTrade() { // fix all the colors later
    push();
    fill(200, 200, 200);
    rect(tradeX, tradeY, tradeW, tradeH);
    stroke(10, 10, 10);
    fill(150, 150, 150);
    grid(tradeX, tradeY, tradeX + tradeGridW, tradeY + tradeGridH, cellSide);
    grid(tradeX + tradeGridW + tradeGridMargin, tradeY, tradeX + 2 * tradeGridW + tradeGridMargin, tradeY + tradeGridH, cellSide);
    rect(tradeGoldBarLeftX, tradeGoldBarY, tradeGoldBarW, tradeGoldBarH);
    rect(tradeGoldBarRightX, tradeGoldBarY, tradeGoldBarW, tradeGoldBarH);
    rect(tradeGoldBtnX, tradeBtnY, tradeBtnW, tradeBtnH);
    rect(tradeCancelBtnX, tradeBtnY, tradeBtnW, tradeBtnH);
    rect(tradeAcceptBtnX, tradeBtnY, tradeBtnW, tradeBtnH);
    tradeGoldBarText();
    pop();
}
function tradeGoldBarText() {
    push();
    textSize(20);
    stroke(10, 10, 10);
    fill(10, 10, 10);
    text(myHero.trade.gold, tradeGoldBarLeftX + 10, tradeGoldBarY + 22);
    text(myHero.tradeFor.gold, tradeGoldBarRightX + 10, tradeGoldBarY + 22);
    text('gold', tradeGoldBtnX + 10, tradeBtnY + 22);
    text('X', tradeCancelBtnX + 10, tradeBtnY + 22);
    text('V', tradeAcceptBtnX + 10, tradeBtnY + 22);
    pop();
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max + 1));
}
// WAREHOUSE
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
        hoverItemWarehouse();
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
// JEWELRY SHOP
function drawJewelry() {
    push();
    stroke(0, 0, 0);
    strokeWeight(1);
    fill(150, 150, 150);
    translate(warehouseGridX, warehouseGridY)
    rect(0, 0, warehouseWidth, warehouseHeight);
    fill(175, 175, 175);
    grid(0, 0, gridWarehousedWidth, gridWarehouseHeight, cellSide);
    if (state.city.jewelryShop.shopItems.length > 0) {
        addJewelryShopItems(cellSide);
    }
    pop();
    // change to warehouse gridX and gridY and gridWidth and gridHeight
    if (mouseX > warehouseGridX && mouseX < warehouseMargin + warehouseWidth &&
        mouseY > warehouseGridY && mouseY < warehouseMargin + warehouseHeight) {
        hoverItemWarehouse();
    }
}
function addJewelryShopItems(cellSide) {
    for (let i = 0; i < state.city.jewelryShop.shopItems.length; i++) {
        fill(state.city.jewelryShop.shopItems[i].colorR, state.city.jewelryShop.shopItems[i].colorG, state.city.jewelryShop.shopItems[i].colorB);
        rect(state.city.jewelryShop.shopItems[i].globalX * cellSide, state.city.jewelryShop.shopItems[i].globalY * cellSide, state.city.jewelryShop.shopItems[i].width * cellSide, state.city.jewelryShop.shopItems[i].height * cellSide);
    }
}
function hoverItemJewelryShop() {
    if (!itemPickedStatus) {
        state.city.jewelryShop.shopItems.forEach(function (jewelryItem) {
            if (mouseX > warehouseGridX + jewelryItem.globalX * cellSide &&
                mouseX < warehouseGridX + (jewelryItem.globalX + jewelryItem.width) * cellSide &&
                mouseY > warehouseGridY + jewelryItem.globalY * cellSide &&
                mouseY < warehouseGridY + (jewelryItem.globalY + jewelryItem.height) * cellSide) {
                showItemInfo(jewelryItem);
            }
        });
    }
}
function drawJewelryShop() {
    let localJewelryShopX = localMapX + state.city.jewelryShop.globalX + state.cityStartX;
    let localJewelryShopY = localMapY + state.city.jewelryShop.globalY + state.cityStartY;
    push();
    fill(0, 0, debugColor);
    ellipse(localJewelryShopX, localJewelryShopY, state.city.jewelryShop.side);
    pop();
    // for shop items hover
    if (mouseX > warehouseGridX && mouseX < warehouseMargin + warehouseWidth &&
        mouseY > warehouseGridY && mouseY < warehouseMargin + warehouseHeight) {
        hoverItemJewelryShop();
    }
}
// DRAW STATUS BAR
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
    push();
    fill(255, 255, 255);
    rect(10, 10, 30, 30);
    fill(0, 0, 0);
    textSize(20);
    if (myHero.level) {
        if (myHero.level > 9) {
            text(myHero.level, 14, 33);
        } else {
            text(myHero.level, 14 + 6, 33);
        }
    }
    pop();
}
function nickname() {
    push();
    rect(50, 10, 260, 30);
    noStroke();
    fill(0, 0, 0);
    textSize(20);
    if (myHero.nickname) {
        text(myHero.nickname, 60, 33);
    }
    pop();
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
// DRAWING MAP, CITY, SHOPS, MINIMAP & UI
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
function miniMap() {
    push();
    fill(255, 255, 255, 150);
    translate(miniMapMargin, height - miniMapHeight - miniMapMargin);
    let factor = state.height / miniMapHeight;
    let miniMapWidth = state.width / factor;
    let miniX = myHero.globalX / factor;
    let miniY = myHero.globalY / factor;
    rect(0, 0, miniMapWidth, miniMapHeight);
    noFill();
    rect(state.cityStartX / factor, state.cityStartY / factor, state.city.width / factor, state.city.height / factor);
    translate(miniX, miniY);
    if (myHero.angle) {
        rotate(myHero.angle);
    }
    fill(0, 0, 0);
    triangle(-6, 4, -6, -4, 6, 0);
    pop();
}
function writeMouseCoordinates() {
    push();
    textSize(20);
    fill(255, 255, 255);
    text(mouseX + ' : ' + mouseY, mouseX - 100, mouseY + 20);
    pop();
}
function updateCoordinates() {
    localMapX = localX - myHero.globalX;
    localMapY = localY - myHero.globalY;
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
function drawShops() {
    drawWarehouseShop();
    drawJewelryShop();
    if (myHero.jewelryShopOpened) {
        drawJewelry();
    } else if (myHero.warehouseOpened) {
        drawWarehouse();
    }
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
// MOUSE & KEYPRESS
function mouseMoved() {
    determineMouseAngle();
    if (state.city) {
        mouseHover();
    }
}
function mouseHover() {
    let localWarehouseCenterX = localMapX + state.cityStartX + state.city.warehouse.globalX;
    let localWarehouseCenterY = localMapY + state.cityStartY + state.city.warehouse.globalY;
    let localJewelryShopCenterX = localMapX + state.cityStartX + state.city.jewelryShop.globalX;
    let localJewelryShopCenterY = localMapY + state.cityStartY + state.city.jewelryShop.globalY;
    if (itemPickedStatus) {
        noCursor();
    } else {
        if (dist(mouseX, mouseY, localWarehouseCenterX, localWarehouseCenterY) < state.city.warehouse.side / 2 ||
            dist(mouseX, mouseY, localJewelryShopCenterX, localJewelryShopCenterY) < state.city.jewelryShop.side / 2) {
            cursor('help');
        } else {
            cursor('auto');
        }
    }
}
function mouseDragged() {
    determineMouseAngle();
}
function keyPressed() {
    if (key.charCodeAt(0) == 32) {
        socket.emit('pickitup');
        //addItem();
    };
    if (key.charCodeAt(0) == 118) {
        if (inventoryStatus) {
            inventoryStatus = false;
        } else {
            inventoryStatus = true;
        }
    }
}
function mousePressed() {
    if (mouseButton == LEFT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        if (calculator) {
            // first row
            if (mouseX > calcX && mouseX < calcX + cellSide &&
                mouseY > calcY + cellSide && mouseY < calcY + cellSide * 2) {
                console.log('click 1');
                addCalcDigit(1);
            } else if (mouseX > calcX + cellSide && mouseX < calcX + cellSide * 2 &&
                mouseY > calcY + cellSide && mouseY < calcY + cellSide * 2) {
                console.log('click 2');
                addCalcDigit(2);
            } else if (mouseX > calcX + cellSide * 2 && mouseX < calcX + cellSide * 3 &&
                mouseY > calcY + cellSide && mouseY < calcY + cellSide * 2) {
                console.log('click 3');
                addCalcDigit(3);
            } else if (mouseX > calcX + cellSide * 3 && mouseX < calcX + cellSide * 4 &&
                mouseY > calcY + cellSide && mouseY < calcY + cellSide * 2) {
                console.log('click C');
                resetCalcValue();
            }
            // second row
            else if (mouseX > calcX && mouseX < calcX + cellSide &&
                mouseY > calcY + cellSide * 2 && mouseY < calcY + cellSide * 3) {
                console.log('click 4');
                addCalcDigit(4);
            } else if (mouseX > calcX + cellSide && mouseX < calcX + cellSide * 2 &&
                mouseY > calcY + cellSide * 2 && mouseY < calcY + cellSide * 3) {
                console.log('click 5');
                addCalcDigit(5);
            } else if (mouseX > calcX + cellSide * 2 && mouseX < calcX + cellSide * 3 &&
                mouseY > calcY + cellSide * 2 && mouseY < calcY + cellSide * 3) {
                console.log('click 6');
                addCalcDigit(6);
            } else if (mouseX > calcX + cellSide * 3 && mouseX < calcX + cellSide * 4 &&
                mouseY > calcY + cellSide * 2 && mouseY < calcY + cellSide * 3) {
                console.log('click <-');
                removeCalcDigit();
            }
            // third row
            else if (mouseX > calcX && mouseX < calcX + cellSide &&
                mouseY > calcY + cellSide * 3 && mouseY < calcY + cellSide * 4) {
                console.log('click 7');
                addCalcDigit(7);
            } else if (mouseX > calcX + cellSide && mouseX < calcX + cellSide * 2 &&
                mouseY > calcY + cellSide * 3 && mouseY < calcY + cellSide * 4) {
                console.log('click 8');
                addCalcDigit(8);
            } else if (mouseX > calcX + cellSide * 2 && mouseX < calcX + cellSide * 3 &&
                mouseY > calcY + cellSide * 3 && mouseY < calcY + cellSide * 4) {
                console.log('click 9');
                addCalcDigit(9);
            } else if (mouseX > calcX + cellSide * 3 && mouseX < calcX + cellSide * 4 &&
                mouseY > calcY + cellSide * 3 && mouseY < calcY + cellSide * 4) {
                console.log('click V');
                sendCalcValue();
            }
            // fourth row
            else if (mouseX > calcX && mouseX < calcX + cellSide &&
                mouseY > calcY + cellSide * 4 && mouseY < calcY + cellSide * 5) {
                console.log('click 0');
                addCalcDigit(0);
            } else if (mouseX > calcX + cellSide && mouseX < calcX + cellSide * 3 &&
                mouseY > calcY + cellSide * 4 && mouseY < calcY + cellSide * 5) {
                console.log('click ALL');
                allInCalc();
            } else if (mouseX > calcX + cellSide * 3 && mouseX < calcX + cellSide * 4 &&
                mouseY > calcY + cellSide * 4 && mouseY < calcY + cellSide * 5) {
                console.log('click X');
                cancelCalcValue();
            }
        } else {
            if (mouseX > warehouseGridX && mouseX < warehouseGridX + warehouseWidth &&
                mouseY > warehouseGridY && mouseY < warehouseGridY + warehouseHeight) {
                // clicking inside the warehouse area
                if (myHero.warehouseOpened) {
                    // clicking in warehouse while the warehouse is ooened
                    if (itemPickedStatus) {
                        // clicking on a warehouse area having an item picked
                        let mouseCoords = {
                            x: Math.floor((mouseX - warehouseGridX) / cellSide),
                            y: Math.floor((mouseY - warehouseGridY) / cellSide)
                        };
                        socket.emit('placingItemWarehouse', mouseCoords);
                        socket.on('replacingItemWarehouseResult', function (result) {
                            if (result) {
                                pickedItem = {};
                                itemPickedStatus = false;
                            }
                        });
                    } else {
                        // no item is picked and clicking on a warehouse area
                        for (let i = 0; i < myHero.warehouseItems.length; i++) {
                            if (mouseX > warehouseGridX + myHero.warehouseItems[i].globalX * cellSide &&
                                mouseX < warehouseGridX + (myHero.warehouseItems[i].globalX + myHero.warehouseItems[i].width) * cellSide &&
                                mouseY > warehouseGridY + myHero.warehouseItems[i].globalY * cellSide &&
                                mouseY < warehouseGridY + (myHero.warehouseItems[i].globalY + myHero.warehouseItems[i].height) * cellSide) {
                                pickedItem = myHero.warehouseItems[i];
                                itemPickedStatus = true;
                                socket.emit('warehousePickItem', pickedItem);
                            }
                        }
                    }
                } else if (myHero.jewelryShopOpened) {
                    // clicking in jewelryshop grid while the jewelryshop is ooened
                    if (itemPickedStatus) {
                        // clicking on a jewelryshop area having an item picked
                        socket.emit('sellItem');
                        pickedItem = {};
                        itemPickedStatus = false;
                    } else {
                        // no item is picked and clicking on a jewelryshop area
                        for (let i = 0; i < state.city.jewelryShop.shopItems.length; i++) {
                            if (mouseX > warehouseGridX + state.city.jewelryShop.shopItems[i].globalX * cellSide &&
                                mouseX < warehouseGridX + (state.city.jewelryShop.shopItems[i].globalX + state.city.jewelryShop.shopItems[i].width) * cellSide &&
                                mouseY > warehouseGridY + state.city.jewelryShop.shopItems[i].globalY * cellSide &&
                                mouseY < warehouseGridY + (state.city.jewelryShop.shopItems[i].globalY + state.city.jewelryShop.shopItems[i].height) * cellSide) {
                                socket.emit('buyJewelryItem', i);
                            }
                        }
                    }
                } else {
                    // warehouse grid is closed
                    if (itemPickedStatus) {
                        // clicking on the area of warehouse when its closed and having item picked
                        dropPickedItem();
                    } else {
                        // clicking on a warehouse area with no item picked and warehouse closed
                        // just walk
                        console.log('1');
                        movePlayer();
                    }
                }
            } else if (mouseX > width - inventoryWidth - inventoryMargin && mouseX < width - inventoryMargin &&
                mouseY > inventoryMargin && mouseY < inventoryMargin + inventoryHeight) {
                // clicking on the inventory area
                if (inventoryStatus) {
                    // clicking on the inventory area with inventory opened
                    // need to specify where exactly is the mouse click
                    if (mouseX > gridX &&
                        mouseX < gridX + gridWidth &&
                        mouseY > gridY &&
                        mouseY < gridY + gridHeight) {
                        // clicking inside the grid of an inventory
                        if (itemPickedStatus) {
                            // having item picked and inventory opened clicking on the inventory grid area
                            // some item is picked and clicking inside a grid inventory so trying to place it
                            // Update the item's position to a new place in inventory if allowed
                            let mouseCoords = {
                                x: Math.floor((mouseX - gridX) / cellSide),
                                y: Math.floor((mouseY - gridY) / cellSide)
                            };
                            socket.emit('placingItemInventory', mouseCoords);
                            socket.on('replacingItemInventoryResult', function (result) {
                                if (result) {
                                    pickedItem = {};
                                    itemPickedStatus = false;
                                }
                            });
                        } else {
                            // no item is picked and clicking inside inventory grid so trying to grab it
                            // Pick an item up
                            for (let i = 0; i < myHero.items.length; i++) {
                                if (mouseX > gridX + myHero.items[i].globalX * cellSide &&
                                    mouseX < gridX + (myHero.items[i].globalX + myHero.items[i].width) * cellSide &&
                                    mouseY > gridY + myHero.items[i].globalY * cellSide &&
                                    mouseY < gridY + (myHero.items[i].globalY + myHero.items[i].height) * cellSide) {
                                    pickedItem = myHero.items[i];
                                    itemPickedStatus = true;
                                    socket.emit('inventoryPickItem', pickedItem);
                                }
                            }
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
                    // clicking on the inventory area with inventory closed
                    // just walk
                    movePlayer();
                    console.log('2');
                }
            } else if (mouseX > tradeX && mouseX < tradeX + tradeW &&
                mouseY > tradeY && mouseY < tradeY + tradeH) {
                // clicking somewhere in the trade window area
                if (myHero.tradeStatus) {
                    if (mouseX > tradeX && mouseX < tradeX + tradeGridW &&
                        mouseY > tradeY && mouseY < tradeY + tradeGridH) {
                        // clicking on your grid inside tradewindow while trading
                    } else if (mouseX > tradeGoldBtnX && mouseX < tradeGoldBtnX + tradeBtnW &&
                        mouseY > tradeBtnY && mouseY < tradeBtnY + tradeBtnH) {
                        // clicking on the gold button to add some amount of gold to trade
                        calculator = true;
                        calcItem = 'gold';
                    } else if (mouseX > tradeCancelBtnX && mouseX < tradeCancelBtnX + tradeBtnW &&
                        mouseY > tradeBtnY && mouseY < tradeBtnY + tradeBtnH) {
                        // clicking on the cancel button
                        socket.emit('tradeCancel');
                    } else if (mouseX > tradeAcceptBtnX && mouseX < tradeAcceptBtnX + tradeBtnW &&
                        mouseY > tradeBtnY && mouseY < tradeBtnY + tradeBtnH) {
                        // clicking on the accept button
                    }
                    // clicking on the area of the trade window while the player is trading
                } else {
                    // clicking on the area of the trade window while the player is not trading so just walk
                    movePlayer();
                    console.log('3');
                }
            } else {
                // clicking outside of an inventory area
                if (itemPickedStatus) {
                    // clicking outside of an inventory area with item picked
                    dropPickedItem();
                } else {
                    // clicking outside of an inventory area with no item picked
                    // just walk
                    movePlayer();
                    console.log('4');
                }
            }
        }
    } else if (mouseButton == RIGHT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let localWarehouseCenterX = localMapX + state.cityStartX + state.city.warehouse.globalX;
        let localWarehouseCenterY = localMapY + state.cityStartY + state.city.warehouse.globalY;
        let localJewelryShopCenterX = localMapX + state.cityStartX + state.city.jewelryShop.globalX;
        let localJewelryShopCenterY = localMapY + state.cityStartY + state.city.jewelryShop.globalY;
        // kind of a radius for the warehouse center
        if (dist(mouseX, mouseY, localWarehouseCenterX, localWarehouseCenterY) < state.city.warehouse.side / 2) {
            if (dist(localX, localY, localWarehouseCenterX, localWarehouseCenterY) > state.city.warehouse.activeRadius) {
                movePlayer();
                console.log('5');
            } else {
                socket.emit('openWarehouse');
            }
        } else if (dist(mouseX, mouseY, localJewelryShopCenterX, localJewelryShopCenterY) < state.city.jewelryShop.side / 2) {
            if (dist(localX, localY, localJewelryShopCenterX, localJewelryShopCenterY) > state.city.jewelryShop.activeRadius) {
                movePlayer();
                console.log('6');
            } else {
                socket.emit('openJewelryShop');
            }
        } else {
            socket.emit('usingSkill');
        }
    }
}
function draggingPickedItem() {
    push();
    fill(myHero.draggingItem.colorR, myHero.draggingItem.colorG, myHero.draggingItem.colorB);
    translate(mouseX, mouseY);
    rect(0, 0, myHero.draggingItem.width * cellSide, myHero.draggingItem.height * cellSide);
    pop();
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
    if (!inventoryStatus && !myHero.warehouseOpened && !myHero.jewelryShopOpened && !myHero.tradeStatus) {
        if (mouseIsPressed && mouseButton == LEFT && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            movePlayer();
            console.log('8');
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
// DETERMINING SOME VALUES
function determineMouseAngle() {
    let dx = width / 2 - mouseX;
    let dy = height / 2 - mouseY;
    angle = Math.atan2(-dy, -dx);
    socket.emit('changeAngle', angle);
}
function findMyHero(socketId) {
    for (let i = 0; i < state.players.length; i++) {
        if (state.players[i].id == socketId) {
            myHero = state.players[i];
            foundMyHero = true;
        }
    }
}
// DRAW HEROES, MONSTERS
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
// INVENTORY
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
        if (mouseX > inventoryX && mouseX < inventoryX + inventoryWidth &&
            mouseY > inventoryY && mouseY < inventoryY + inventoryHeight) {
            hoverItem();
            if (mouseX > gridX + heroInfoX &&
                mouseX < gridX + heroInfoX + heroInfoSide &&
                mouseY > gridY + heroInfoY &&
                mouseY < gridY + heroInfoY + heroInfoSide) {
                showInventoryHeroInfo();
            }
        }
    }
}
function drawItems() {
    for (let i = 0; i < state.items.length; i++) {
        let localItemX = localMapX + state.items[i].globalX;
        let localItemY = localMapY + state.items[i].globalY;
        rect(localItemX, localItemY, 20, 20);
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
    for (let i = 0; i <= Math.floor((endX - startX) / cellSide); i++) {
        line(startX + cellSide * i, startY, startX + cellSide * i, endY);
    }
    for (let j = 0; j <= Math.floor((endY - startY) / cellSide); j++) {
        line(startX, startY + cellSide * j, endX, startY + cellSide * j);
    }
}
function showInventoryHeroInfo() {
    push();
    fill(200, 200, 200);
    rect(width - inventoryWidth - inventoryMargin - infoWidth - infoMargin, inventoryHeight + inventoryMargin - infoHeight, infoWidth, infoHeight);
    pop();
}
// HOVERING ITEMS
function hoverItem() {
    if (myHero.leftWeapon && mouseX > inventoryX + leftWeaponX &&
        mouseX < inventoryX + inventoryWidth + leftWeaponX + weaponWidth &&
        mouseY > inventoryY + weaponY &&
        mouseY < inventoryY + weaponY + weaponHeight) {
        showItemInfo(myHero.leftWeapon);
    }
    if (myHero.rightWeapon && mouseX > inventoryX + rightWeaponX &&
        mouseX < inventoryX + inventoryWidth + rightWeaponX + weaponWidth &&
        mouseY > inventoryY + weaponY &&
        mouseY < inventoryY + weaponY + weaponHeight) {
        showItemInfo(myHero.rightWeapon);
    }
    if (myHero.wingCape && mouseX > inventoryX + wingCapeX &&
        mouseX < inventoryX + inventoryWidth + wingCapeX + wingCapeWidth &&
        mouseY > inventoryY + wingCapeY &&
        mouseY < inventoryY + wingCapeY + wingCapeHeight) {
        showItemInfo(myHero.wingCape);
    }
    if (myHero.leftRing && mouseX > inventoryX + leftRingX &&
        mouseX < inventoryX + inventoryWidth + leftRingX + ringPendantSide &&
        mouseY > inventoryY + ringPendantY &&
        mouseY < inventoryY + ringPendantY + ringPendantSide) {
        showItemInfo(myHero.leftRing);
    }
    if (myHero.rightRing && mouseX > inventoryX + rightRingX &&
        mouseX < inventoryX + inventoryWidth + rightRingX + ringPendantSide &&
        mouseY > inventoryY + ringPendantY &&
        mouseY < inventoryY + ringPendantY + ringPendantSide) {
        showItemInfo(myHero.rightRing);
    }
    if (myHero.pendant && mouseX > inventoryX + pendantX &&
        mouseX < inventoryX + inventoryWidth + pendantX + ringPendantSide &&
        mouseY > inventoryY + ringPendantY &&
        mouseY < inventoryY + ringPendantY + ringPendantSide) {
        showItemInfo(myHero.pendant);
    }
    myHero.items.forEach(function (item) {
        if (mouseX > gridX + item.globalX * cellSide &&
            mouseX < gridX + (item.globalX + item.width) * cellSide &&
            mouseY > gridY + item.globalY * cellSide &&
            mouseY < gridY + (item.globalY + item.height) * cellSide) {
            showItemInfo(item);
        }
    });
}
function hoverItemWarehouse() {
    if (!itemPickedStatus) {
        myHero.warehouseItems.forEach(function (warehouseItem) {
            if (mouseX > warehouseGridX + warehouseItem.globalX * cellSide &&
                mouseX < warehouseGridX + (warehouseItem.globalX + warehouseItem.width) * cellSide &&
                mouseY > warehouseGridY + warehouseItem.globalY * cellSide &&
                mouseY < warehouseGridY + (warehouseItem.globalY + warehouseItem.height) * cellSide) {
                showItemInfo(warehouseItem);
            }
        });
    }
}
function showItemInfo(item) {
    push();
    translate(gridX - itemInfoWidth - infoMargin, gridY - itemInfoHeight / 2);
    fill(200, 200, 200);
    rect(0, 0, itemInfoWidth, itemInfoHeight);
    textSize(20);
    stroke(0, 0, 0);
    fill(0, 0, 0);
    text(item.name, 20, 20);
    pop();
}
// DRAW SKILLS
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
function drawBeamSkill() {
    for (let i = 0; i < state.skills.length; i++) {
        //let skill = state.skills[i];
        if (state.skills[i].name == 'beam') {
            let localSkillX = localMapX + skill.globalX;
            let localSkillY = localMapY + skill.globalY;
            let localSkillEndX = localMapX + skill.endX;
            let localSkillEndY = localMapY + skill.endY;
            // let localSkillEndX = localSkillX + skill.length * Math.cos(skill.angle);
            // let localSkillEndY = localSkillY + skill.length * Math.sin(skill.angle);
            push();
            strokeWeight(4);
            stroke(200, 0, 200);
            line(localSkillX, localSkillY, localSkillEndX, localSkillEndY);
            pop();
        }
    }
}
function drawLightningSkill() {
    for (let i = 0; i < state.skills.length; i++) {
        if (state.skills[i].name == 'lightning') {
            push();
            strokeWeight(3);
            stroke(0, 255, 255);
            fill(0, 255, 255);
            let distance = state.skills[i].distance; // constant at which the player can shoot
            let stepAmount = Math.floor(distance / 50);
            let stepDistance = distance / stepAmount;
            applyMatrix(1, 0, 0, 1, localX, localY);
            rotate(state.skills[i].angle);
            let cumulativeDistance = 0;
            let lightningStartY = 0;
            let lightningEndY = 0;
            for (let i = 0; i < stepAmount; i++) {
                lightningEndY = getRandomInt(60) - 30;
                if (i == 0) {
                    lightningStartY = 0;
                } else if (i == 7) {
                    lightningEndY = 0;
                }
                line(cumulativeDistance, lightningStartY, cumulativeDistance + stepDistance, lightningEndY);
                cumulativeDistance += stepDistance;
                lightningStartY = lightningEndY;
            }
            resetMatrix();
            pop();
        }
    }
}