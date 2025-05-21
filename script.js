import items from './items.js';

const main = document.querySelector('#main');

const MARKET_FEE = 0.1;
const TERA_TICK = 0.05;


const initRender = (target, items) => {
    items.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('flex-row');
        
        const name = document.createElement('div');
        name.classList.add('flex-cell');
        name.textContent = item.name;
        row.appendChild(name);

        const cash = document.createElement('div');
        cash.classList.add('flex-cell');
        cash.textContent = item.cash;
        row.appendChild(cash);
        target.appendChild(row);

        const tera = document.createElement('div');
        tera.classList.add('flex-cell');
        
        const teraInput = document.createElement('input');
        teraInput.type = 'number';
        teraInput.id = `tera-${item.id}`;
        teraInput.oninput = (e) => {
            displayTeraPerWon(item.id, e.target.value);
        }

        tera.appendChild(teraInput);
        row.appendChild(tera);

        const minus5 = document.createElement('div');
        minus5.classList.add('flex-cell');
        minus5.classList.add('minus5');
        minus5.id = `minus5-${item.id}`;
        row.appendChild(minus5);

        const current = document.createElement('div');
        current.classList.add('flex-cell');
        current.classList.add('current');
        current.id = `current-${item.id}`;
        row.appendChild(current);

        const plus5 = document.createElement('div');
        plus5.classList.add('flex-cell');
        plus5.classList.add('plus5');
        plus5.id = `plus5-${item.id}`;
        row.appendChild(plus5);

        target.appendChild(row);
    });    
}

const calculateTeraPerWon = (auctionPrice, cash) => {
    const result = auctionPrice * (1 - MARKET_FEE) / cash;
    return {
        minus5: result * (1 - TERA_TICK),
        current: result,
        plus5: result * (1 + TERA_TICK)
    };
}

const displayTeraPerWon = (id, auctionPrice) => {
    const item = items.find(item => item.id === Number(id));
    if (!item) return;
    const cash = Number(item.cash);
    const price = Number(auctionPrice);
    if (!price) {
        // 입력값이 없으면 결과 초기화
        document.querySelector(`#minus5-${id}`).textContent = '';
        document.querySelector(`#current-${id}`).textContent = '';
        document.querySelector(`#plus5-${id}`).textContent = '';
        return;
    }
    const { minus5, current, plus5 } = calculateTeraPerWon(price, cash);
    // 데이터셋에 넣기
    items[id].perMinus5 = minus5;
    items[id].perCurrent = current;
    items[id].perPlus5 = plus5;
    items[id].receiveTera = Math.ceil(auctionPrice * (1 - MARKET_FEE));// ceil(올림)일지 round(반올림)일지 모르겠음.

    document.querySelector(`#minus5-${id}`).textContent = `1 : ${(minus5).toFixed(2)}`;
    document.querySelector(`#current-${id}`).textContent = `1 : ${(current).toFixed(2)}`;
    document.querySelector(`#plus5-${id}`).textContent = `1 : ${(plus5).toFixed(2)}`;
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

const init = () => {
    initRender(main, items);
    document.querySelector('#target-tera').addEventListener('input', calculateCashNeededForTera);
}

init();