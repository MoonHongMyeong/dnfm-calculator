import items from './items.js';

const main = document.querySelector('#main');

const MARKET_FEE = 0.1;
const TERA_TICK = 0.05;

/** @typedef {import('./types').Item} Item */
/** @typedef {import('./types').TeraPerWon} TeraPerWon */

/**
 * @name 초기_랜더링
 * @description 처음 로드되면 실행되는 랜더링 함수.
 * @param {Element} target 
 * @param {items} items 
 */
const initRender = (target, items) => {
    const html = items.map(item => {
        `<div class="flex-row">
            <div class="flex-cell">${item.name}</div>
            <div class="flex-cell">${item.cash}</div>
            <div class="flex-cell">
                <input type="number" id="tera-${item.id}">
            </div>
            <div class="flex-cell minus5" id="minus5-${item.id}"></div>
            <div class="flex-cell current" id="current-${item.id}"></div>
            <div class="flex-cell plus5" id="plus5-${item.id}"></div>
        </div>`
    }).join('');

    target.innerHTML = html;
}

/**
 * @name {} 경매장 테라 가격 input 이벤트 함수
 * @event
 * @param {Item} item
 * @param {Number} auctionPrice
 */
const onAuctionPriceInput = (item, auctionPrice) => {
    const teraPerWon = getTeraPerWonRate(item, auctionPrice);
    updateItemWithTeraRate(item, auctionPrice, teraPerWon);
    renderTeraRate(item, auctionPrice, teraPerWon);
}

/**
 * @name {} 경매장 태라 가격 원당 비율 계산 함수
 * @param {Item} item
 * @param {number} auctionPrice
 * @returns {TeraPerWon}
 */
const getTeraPerWonRate = (item, auctionPrice) => {
    const result = auctionPrice * (1 - MARKET_FEE) / item.cash;
    return {
        minus5: result * (1 - TERA_TICK),
        current: result,
        plus5: result * (1 + TERA_TICK)
    };
}

/**
 * @name {} 경매장 태라 가격 원당 비율 계산 함수
 * @param {Item} item
 * @param {number} auctionPrice
 * @param {TeraPerWon} teraPerWon
 */
const updateItemWithTeraRate = (item, auctionPrice, teraPerWon) => {
    items[item.id].minus5 = teraPerWon.minus5;
    items[item.id].current = teraPerWon.current;
    items[item.id].plus5 = teraPerWon.plus5;
    items[item.id].receiveTera = auctionPrice * (1 - MARKET_FEE)
}
/**
 * @name {} 테라당 원의 비율을 랜더링해주는 함수
 * @param {Item} item
 * @param {number} auctionPrice
 * @param {TeraPerWon} teraPerWon
 */
const renderTeraRate = (item, auctionPrice, teraPerWon) => {
    if (!item) return;

    // 자주 바뀌는 노드 캐싱
    const textNodes = {
        minus5 : document.querySelector(`#minus5-${item.id}`),
        current : document.querySelector(`#current-${item.id}`),
        plus5 : document.querySelector(`#plus5-${item.id}`)
    }
    
    // 입력값이 없으면 결과 초기화
    if (!auctionPrice || isNaN(auctionPrice)) {
        textNodes.minus5.textContent = ``;
        textNodes.current.textContent = ``;
        textNodes.plus5.textContent = ``;
        return;
    }
    textNodes.minus5.textContent = `1 : ${(teraPerWon.minus5).toFixed(2)}`;
    textNodes.current.textContent = `1 : ${(teraPerWon.current).toFixed(2)}`;
    textNodes.plus5.textContent = `1 : ${(teraPerWon.plus5).toFixed(2)}`;
}


const calculateCashNeededForTera = (e) => {
    let targetTera = Number(e.target.value);
    const result = [];
    const sortedItems = items.sort((a, b) => {
        return b.perCurrent - a.perCurrent;
    });

    let totalTera = 0;
    const minimumReceiveTera = Math.min(...items.map((x) => x.receiveTera));

    // 어떤 아이템을 구매해도 의미없음.
    if ( targetTera < minimumReceiveTera) {
        console.log(targetTera, sortedItems[sortedItems.length -1].receiveTera)
        document.querySelector('#average-item-list').textContent = ``;
        return;
    }

    // greedy 방식으로 targetTera의 이하 근사값을 구한다.
    for (const product of sortedItems) {
        if (totalTera >= targetTera) break;

        const remainingTera = targetTera - totalTera;
        const maxCount = Math.floor(remainingTera / product.receiveTera);

        if (maxCount > 0) {
            product['count'] = maxCount;
            result.push(product);
            totalTera += maxCount * product.receiveTera;
        }
    }
    
    // 추가 보정
    if (totalTera < targetTera) {
        const remainingTera = targetTera - totalTera;
        let bestCandidate; //최적 후보

        for (const product of sortedItems) {
            const count = Math.ceil(remainingTera / product.receiveTera);
            const addedTera = count * product.receiveTera;
            const overAmount = addedTera - remainingTera;
            const purchaseCost = count * product.cash;

            if (!bestCandidate 
                || overAmount < bestCandidate.overAmount 
                || (overAmount === bestCandidate.overAmount 
                    && purchaseCost < bestCandidate.purchaseCost)
                ) {
                bestCandidate = {
                    name: product.name,
                    count,
                    addedTera,
                    overAmount,
                    purchaseCost
                }
            }
        }

        if (bestCandidate) {
            const bestCandidateItem = result.find((element) => element.name == bestCandidate.name);
            bestCandidateItem.count += bestCandidate.count;
            totalTera += bestCandidate.addedTera;
        }
    }

    displayCashNeededForTera(result);
}

const displayCashNeededForTera = (calculateResult) => {
    calculateResult.sort((a, b) => (b.receiveTera * b.count) - (a.receiveTera * a.count));

    const list = document.querySelector(`#average-item-list`);
    let html = ``;
    let totalTera = 0;
    let totalCost = 0;

    for ( let i=0; i < calculateResult.length; i++ ) {
        html += `<p>${calculateResult[i].name} : ${calculateResult[i].count} (${calculateResult[i].receiveTera * calculateResult[i].count})</p>`;
        totalTera += calculateResult[i].receiveTera * calculateResult[i].count;
        totalCost += calculateResult[i].cash * calculateResult[i].count;
    }

    html += `<p>${totalTera} 테라</p>`;
    html += `<p>${totalCost} 원</p>`

    list.innerHTML = html;
}

/**
 * @name 이벤트 주입 함수
 */
const addInputEvents = () => {
    for ( let i=0; i < items.length; i++ ) {
        document.querySelector(`#tera-${i}`).addEventListener('input', (e) => onAuctionPriceInput(items[i], e.target.value));
    }
    document.querySelector('#target-tera').addEventListener('input', calculateCashNeededForTera);
}

const init = () => {
    initRender(main, items);
    addInputEvents();
}

init();