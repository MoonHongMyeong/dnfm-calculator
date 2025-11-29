import items from './items.js';

const main = document.querySelector('#main');

const MARKET_FEE = 0.1;
const PRICE_TICK = 0.05;

/**
 * @typedef {Object} Item
 * @property {Number} id
 * @property {String} name
 * @property {Number} cash
 * @property {Number} limit
 * @property {Number} current
 * @property {Number} plus
 * @property {Number} minus
 */

/**
 * @typedef {Object} Scenario
 * @property { "current" | "plus" | "minus" } id
 * @property {Element} container
 */

/**
 * @typedef { "current" | "plus" | "minus" } ScenarioId
 */ 

/**
 * @name 처음 로드되면 실행되는 랜더링 함수.
 * @param {Element} target
 * @param {Item[]} items
 */
const initRender = (target, items) => {
    const html = items.map(item => 
            `<div class="flex-row">
                <div class="flex-cell">${item.name}</div>
                <div class="flex-cell">${item.cash}</div>
                <div class="flex-cell">
                    <input type="number" id="tera-${item.id}">
                </div>
                <div class="flex-cell" id="minus-${item.id}"></div>
                <div class="flex-cell" id="current-${item.id}"></div>
                <div class="flex-cell" id="plus-${item.id}"></div>
            </div>`
    ).join('');

    target.innerHTML = html;
}

/**
 * @name {} 1원당 테라 비율 계산 함수 (소수점 2자리까지)
 * @param {Item} item
 * @param {Number} price
 * @returns {Number}
 */
const calculateTeraPerWon = (item, price) => {
    return Math.floor(price * (1 - MARKET_FEE) / item.cash * 100) / 100;
}

/**
 * @name {} item 비율 업데이트
 * @param {Item} item
 * @param {Number} avg
 * @param {Number} plus
 * @param {Number} minus
 */
const updateItemRate = (item, avg, plus, minus) => {
    item.current = avg;
    item.plus = plus;
    item.minus = minus;
}

/**
 * @name {} 경매장 테라 비율 랜더링
 * @param {Item} item
 */
const renderTeraPerWon = (item) => {
    const current = document.querySelector(`#current-${item.id}`);
    const plus = document.querySelector(`#plus-${item.id}`);
    const minus = document.querySelector(`#minus-${item.id}`);
    
    current.textContent = `1 : ${item.current}`;
    plus.textContent = `1 : ${item.plus}`;
    minus.textContent = `1 : ${item.minus}`;
}

/**
 * @name {} 목표 테라 구매 계획 랜더링
 * @param {Item[]} purchasePlan
 * @param {Scenario} scenario
 */
const renderPurchasePlan = (purchasePlan, scenario) => {
    if ( !purchasePlan || purchasePlan.length === 0 || !scenario.container ) return;

    const container = scenario.container;
    const sortedPlan = purchasePlan.sort(
        (a, b) => (b[scenario.id] * b.cash * b.count) - (a[scenario.id] * a.cash * a.count)
    );

    let html = '';
    let totalTera = 0;
    let totalCost = 0;

    html = sortedPlan.map(item => {
        const tera = Math.round(item[scenario.id] * item.cash * item.count);
        const cost = item.cash * item.count;
        totalTera += tera;
        totalCost += cost;

        return `<p>${item.name} : ${item.count}개 (${tera})</p>`;
    }).join('')
    + `<p>총 테라 : ${totalTera} 테라</p>
    <p>총 비용 : ${totalCost} 원</p>`;

    container.innerHTML = html;
}

const purchaseScenarios = [
    {
        id: "current",
        container: document.querySelector('#average-item-list')
    },
    {
        id: "plus",
        container: document.querySelector('#plus-item-list')
    },
    {
        id: "minus",
        container: document.querySelector('#minus-item-list')
    }
]

/**
 * @name {} 일일 구매제한 유효성 체크
 * @param {Item} item 
 * @param {Number} maxCount 
 */
const getAvailableCount = (item, maxCount) => {
    return Math.min(item.limit ?? Infinity, maxCount);
}

/**
 * @name {} 그리디를 이용한 구매계획
 * @param {Number} value
 * @param { ScenarioId } scenarioId
 */
const getGreedyPurchasePlan = (value, scenarioId) => {
    const targetTera = value;
    const minimumTeraAmount = Math.min(...items.map(item => item[scenarioId] * item.cash));

    // 목표 테라가 최소 테라보다 적음
    if ( targetTera < minimumTeraAmount ) return []; 

    const sortedItemsOrderByRate = [...items].sort(
        (a, b) => Number(b[scenarioId]) - Number(a[scenarioId])
    );

    const purchasePlan = [];
    let totalTera = 0;

    for ( const item of sortedItemsOrderByRate ) {
        if ( totalTera >= targetTera ) break;

        const remainingTera = targetTera - totalTera;
        const maxCount = Math.floor(remainingTera / Number(item[scenarioId] * item.cash));
        const finalCount = getAvailableCount(item, maxCount);

        if ( finalCount > 0 ) {
            purchasePlan.push(
                {
                    ...item,
                    count: finalCount
                }
            )
            
            totalTera += finalCount * Number(item[scenarioId] * item.cash);
        }
    }

    return purchasePlan;
}

/**
 * @name {} 경매장 테라 가격 input 이벤트 함수
 * @event
 */
const onAuctionPriceInput = (item, price) => {
    const avgRate = calculateTeraPerWon(item, price);
    const plusRate = calculateTeraPerWon(item, price * (1 + PRICE_TICK));
    const minusRate = calculateTeraPerWon(item, price * (1 - PRICE_TICK));

    updateItemRate(item, avgRate, plusRate, minusRate);
    renderTeraPerWon(item);
}

/**
 * @name {} 필요한 테라 가격 input 이벤트 함수
 * @event
 */
const onNeededForTeraInput = (value) => {
    purchaseScenarios.map((scenario) => {
        const purchasePlan = getGreedyPurchasePlan(Number(value), scenario.id);
        renderPurchasePlan(purchasePlan, scenario);
    }) 
    
}

/**
 * @name {} 이벤트 주입 함수
 * @event
 */
const addInputEvents = () => {
    items.forEach((item) => {
        const input = document.querySelector(`#tera-${item.id}`);
        if (input) {
            input.addEventListener('input', (e) => onAuctionPriceInput(item, e.target.value));
        }
    });

    const teraInput = document.querySelector('#target-tera');
    if (teraInput) {
        teraInput.addEventListener('input', (e) => onNeededForTeraInput(e.target.value));
    }
}

const init = () => {
    initRender(main, items);
    addInputEvents();
}

init();

