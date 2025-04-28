const items = [
    {
        id: 1, name: '바인드큐브', cash: '1000'
    },
    {
        id: 2, name: '촉매제', cash: '2500'
    },
    {
        id: 3, name: '흑룡 아티팩트', cash: '33000'
    }
]

const main = document.querySelector('#main');

const MARKET_FEE = 0.1;
const TERA_TICK = 0.05;


const render = (target, items) => {
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
            updateResult(item.id, e.target.value);
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

const calculate = (auctionPrice, cash) => {
    const result = auctionPrice * (1 - MARKET_FEE) / cash;
    return {
        minus5: result * (1 - TERA_TICK),
        current: result,
        plus5: result * (1 + TERA_TICK)
    };
}

const updateResult = (id, auctionPrice) => {
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
    const { minus5, current, plus5 } = calculate(price, cash);
    document.querySelector(`#minus5-${id}`).textContent = `1 : ${(minus5).toFixed(2)}`;
    document.querySelector(`#current-${id}`).textContent = `1 : ${(current).toFixed(2)}`;
    document.querySelector(`#plus5-${id}`).textContent = `1 : ${(plus5).toFixed(2)}`;
}

const updateSellingItem = () => {
    const teraPrice = document.querySelector('#tera-price').value;
    const sellingItems = [];
       
    document.querySelectorAll('.current').forEach(item => {
        const id = item.id.split('-')[1];
        const cash = Number(item.textContent.split(':')[1]);
        sellingItems.push({
            id,
            cash
        });
    })

    sellingItems.sort((a, b) => b.cash - a.cash);

    const targetItem = sellingItems[0];
    const targetItemName = document.querySelector(`#selling-item-name`);
    targetItemName.textContent = items.find(item => item.id === Number(targetItem.id)).name;

    const averagePrice = document.querySelector(`#average-price`);
    const averagePer = document.querySelector(`#current-${targetItem.id}`).textContent.split(':')[1];
    console.log(teraPrice, averagePer, items.find(item => item.id === Number(targetItem.id)).cash);
    averagePrice.textContent = `${(teraPrice / averagePer).toFixed(2)}원`;

    const minus5Price = document.querySelector(`#minus5-price`);
    const minus5Per = document.querySelector(`#minus5-${targetItem.id}`).textContent.split(':')[1];
    minus5Price.textContent = `${(teraPrice / minus5Per).toFixed(2)}원`;
    
    const plus5Price = document.querySelector(`#plus5-price`);
    const plus5Per = document.querySelector(`#plus5-${targetItem.id}`).textContent.split(':')[1];
    plus5Price.textContent = `${(teraPrice / plus5Per).toFixed(2)}원`;
}

const init = () => {
    render(main, items);
}

init();