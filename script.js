import items from './items.js';

const main = document.querySelector('#main');

const MARKET_FEE = 0.1;
const TERA_TICK = 0.05;

/** @typedef {import('./types').Item} Item */
/** @typedef {import('./types').teraPerWon} teraPerWon */


/**
 * @name 초기_랜더링
 * @description 처음 로드되면 실행되는 랜더링 함수.
 * @param {Element} target 
 * @param {items} items 
 */
const initRender = (target, items) => {
    const html = items.map(item => 
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
    ).join('');

    target.innerHTML = html;
}

/**
 * @name {} 경매장 테라 가격 input 이벤트 함수
 * @event
 * @param {Item} item
 * @param {Number} auctionPrice
 */
const onAuctionPriceInput = (item, auctionPrice) => {
    const teraPerWon = getteraPerWonRate(item, auctionPrice);
    updateItemWithTeraRate(item, auctionPrice, teraPerWon);
    renderTeraRate(item, auctionPrice);
}

/**
 * @name {} 경매장 태라 가격 원당 비율 계산 함수
 * @param {Item} item
 * @param {number} auctionPrice
 * @returns {teraPerWon}
 */
const getteraPerWonRate = (item, auctionPrice) => {
    return {
        teraPerWon_minus5: (auctionPrice * (1 - MARKET_FEE) * (1 - TERA_TICK) / item.cash).toFixed(2),
        teraPerWon_current: (auctionPrice * (1 - MARKET_FEE) / item.cash).toFixed(2),
        teraPerWon_plus5: (auctionPrice * (1 - MARKET_FEE) * (1 + TERA_TICK) / item.cash).toFixed(2)
    };
}

/**
 * @name {} 경매장 태라 가격 비율, 실수령가 업데이트 함수.
 * @param {Item} item
 * @param {number} auctionPrice
 * @param {teraPerWon} teraPerWon
 */
const updateItemWithTeraRate = (item, auctionPrice, teraPerWon) => {
    items[item.id].teraPerWon_minus5 = Number(teraPerWon.teraPerWon_minus5);
    items[item.id].teraPerWon_current = Number(teraPerWon.teraPerWon_current);
    items[item.id].teraPerWon_plus5 = Number(teraPerWon.teraPerWon_plus5);
    items[item.id].teraAfterFee_current = auctionPrice * (1 - MARKET_FEE);
    items[item.id].teraAfterFee_minus5 = auctionPrice * (1 - TERA_TICK) * (1 - MARKET_FEE);
    items[item.id].teraAfterFee_plus5 = auctionPrice * (1 + TERA_TICK) * (1 - MARKET_FEE);
}

/**
 * @name {} 테라당 원의 비율을 랜더링해주는 함수
 * @param {Item} item
 * @param {number} auctionPrice
 * @param {teraPerWon} teraPerWon
 */
const renderTeraRate = (item, auctionPrice) => {
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
    textNodes.minus5.textContent = `1 : ${(item.teraPerWon_minus5)}`;
    textNodes.current.textContent = `1 : ${(item.teraPerWon_current)}`;
    textNodes.plus5.textContent = `1 : ${(item.teraPerWon_plus5)}`;
}

/**
 * @name {} 그리디를 이용한 구매 계획
 * @param {Number} rawTargetData 
 * @returns {Item[]} purchasePlan
 */
const getGreedyPurchasePlan = (rawTargetData, scenarioId) => {
    const targetTera = Number(rawTargetData);
    
    const teraRateKey = `teraPerWon_${scenarioId}`;
    const teraAfterFeeKey = `teraAfterFee_${scenarioId}`;

    const sortedItemsOrderByRate = [...items].sort(
        (a, b) => Number(b[teraRateKey]) - Number(a[teraRateKey])
    );

    console.log(sortedItemsOrderByRate)
    
    
    const minimumTeraAfterFee = Math.min(...items.map((item) => item[teraAfterFeeKey]));
    // 어떤 아이템을 구매해도 의미없음.
    if ( targetTera < minimumTeraAfterFee) {
        return [];
    }

    const purchasePlan = [];
    let totalTera = 0;

    // 1. greedy 방식으로 targetTera의 이하 근사값을 구한다.
    for (const product of sortedItemsOrderByRate) {
        if (totalTera >= targetTera) break;

        const remainingTera = targetTera - totalTera;
        const maxCount = Math.floor(remainingTera / Number(product[teraAfterFeeKey]));
        const finalCount = getAvailableCount(product, maxCount);

        if (finalCount > 0) {
            purchasePlan.push(
                {
                    ...product,
                    count: finalCount
                }
            );
            totalTera += finalCount * Number(product[teraAfterFeeKey]);
        }
    }

    // 2. 그리디 방식으로 이하 최적해에서 추가 보정
    if (totalTera < targetTera) {
        const remainingTera = targetTera - totalTera;
        let bestCandidate; //최적 후보

        for (const product of sortedItemsOrderByRate) {
            const teraAfterFee = Number(product[teraAfterFeeKey]);
            const desiredCount = Math.ceil(remainingTera / teraAfterFee);
            const finalCount = getAvailableCount(product, desiredCount);
            const addedTera = finalCount * teraAfterFee;
            const overAmount = addedTera - remainingTera;
            const purchaseCost = finalCount * product.cash;

            if (!bestCandidate ||
                overAmount < bestCandidate.overAmount ||
                (overAmount === bestCandidate.overAmount &&
                 purchaseCost < bestCandidate.purchaseCost)) {
                bestCandidate = {
                    product,
                    finalCount,
                    addedTera,
                    overAmount,
                    purchaseCost
                };
            }
        }

        if (bestCandidate) {
            const existing = purchasePlan.find(p => p.id === bestCandidate.product.id);
            if (existing) {
                existing.count += bestCandidate.finalCount;
            } else {
                purchasePlan.push({
                    ...bestCandidate.product,
                    count: bestCandidate.finalCount
                });
            }
            totalTera += bestCandidate.addedTera;
        }
    }
    return purchasePlan;
}

/**
 * @name {} 구매계획 랜더링
 * @param {Item[]} purchasePlan 
 */
const renderPurchasePlan = (purchasePlan, scenario) => {
    if (!purchasePlan || purchasePlan.length === 0 || !scenario.container) return;

    const teraAfterFeeKey = `teraAfterFee_${scenario.id}`;
    const container = scenario.container;    
    const sortedPlan = purchasePlan.sort((a, b) => (b[teraAfterFeeKey] * b.count) - (a[teraAfterFeeKey] * a.count));

    let html = ``;
    let totalTera = 0;
    let totalCost = 0;

    html = sortedPlan.map(item => {
        const tera = Math.round(item[teraAfterFeeKey]) * item.count;
        const cost = item.cash * item.count;
        totalTera += tera;
        totalCost += cost;
        return `<p>${item.name} : ${item.count}개 (${tera})</p>`;
    }).join('') + `
    <p>총 테라 : ${totalTera} 테라</p>
    <p>총 비용 : ${totalCost} 원</p>`;

    container.innerHTML = html;
}

const planScenarios = [
    {
        id: "current",
        container: document.querySelector('#average-item-list')
    },
    {
        id: "minus5",
        container: document.querySelector('#minus5-item-list')
    },
    {
        id: "plus5",
        container: document.querySelector('#plus5-item-list')
    }
];

/**
 * @name {} 목표테라 input 입력 이벤트 함수 
 * @event
 * @param {*} inputEvent 
 */
const onNeededForTeraInput = (e) => {
    planScenarios.map((scenario) => {
        const purchasePlan = getGreedyPurchasePlan(e.target.value, scenario.id);
        renderPurchasePlan(purchasePlan, scenario);
    })
}

/**
 * @name {} 일일 구매제한 유효성 체크
 * @param {Item} item 
 * @param {Number} maxCount 
 * @returns {Number} availablePurchaseCount
 */
const getAvailableCount = (item, maxCount) => {
    return Math.min(item.limit ?? Infinity, maxCount);
}

/**
 * @name 이벤트 주입 함수
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
        teraInput.addEventListener('input', onNeededForTeraInput);
    }
}

const init = () => {
    initRender(main, items);
    addInputEvents();
}

init();

console.log([23789, 59766, 784329]);