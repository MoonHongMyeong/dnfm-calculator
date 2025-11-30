import { exchangeItems } from './data/exchange-items.js';
import { FIXED_FEE_RATE, PRICE_TICK } from './config/exchange-config.js';

export class ExchangeSection {
    constructor(rootElement){
        this.rootElement = rootElement;
        this.exchangeItemsTbody = rootElement.querySelector('#exchange-items-tbody');
        this.addRowsButton = rootElement.querySelector('#exchange-items-tfoot')
        this.exchangeItemTemplate = rootElement.querySelector('#exchange-item-row-template');
        this.exchangePlanTbody = rootElement.querySelector('#exchange-plan-tbody');
    }

    /**
     * @description 기본 정의되어 있는 환전용 아이템 추가
     */
    appendBasicItems() {
        this.exchangeItemsTbody.innerHTML = '';

        exchangeItems.forEach(exchangeItem => {
            const row = this.exchangeItemTemplate.content.cloneNode(true);
            
            const tr = row.querySelector('.exchange-item-row');
            tr.dataset.itemId = exchangeItem.id;

            const itemNameInput = row.querySelector('.item-name');
            const priceWonInput = row.querySelector('.price-won');
            const removeButton = row.querySelector('.btn-remove-exchange-row');

            itemNameInput.value = exchangeItem.name;
            itemNameInput.readOnly = true;
            priceWonInput.value = exchangeItem.cash;
            priceWonInput.readOnly = true;
            removeButton.style.display = 'none';
            removeButton.disabled = true;

            this.exchangeItemsTbody.append(row);
        });
    }

    /**
     * @description 판매 리스트 추가
     */
    addRows() {
        const cloneTemplate = this.exchangeItemTemplate.content.cloneNode(true);
        const lastId = this.exchangeItemsTbody.querySelector('tr:last-child').dataset.itemId;
    
        cloneTemplate.querySelector('tr').dataset.itemId = (Number(lastId) + 1);

        this.exchangeItemsTbody.append(cloneTemplate);
    }
    /**
     * @description 이벤트 바인딩
     */
    bindEvents() {
        this.exchangeItemsTbody.addEventListener('input', (e) => {
            const target = e.target;
            if (!target.classList.contains('target-price')) return;
            
            const row = target.closest('.exchange-item-row');
            if (!row) return;

            this.updateTargetPricesForRow(row);
        });

        this.addRowsButton.addEventListener('click', (e) => {
            this.addRows();
        })
    }

    /**
     * @description 입력받은 목표가로 목표가 랜더링
     */
    updateTargetPricesForRow(row) {
        const priceWonCell = row.querySelector('.price-won');
        const targetPriceInput = row.querySelector('.target-price');
        const minus5Cell = row.querySelector('.target-minus-5');
        const baseCell  = row.querySelector('.target-base');
        const plus5Cell = row.querySelector('.target-plus-5');

        const value = Number(targetPriceInput.value);
        const priceWon = Number(priceWonCell.value);
        if(!Number.isFinite(value)){
            minus5Cell.textContent = '-';
            baseCell.textContent = '-';
            plus5Cell.textContent = '-';
            return;
        }
        
        const minus5 = (value / priceWon * (1 - PRICE_TICK) * (1 - FIXED_FEE_RATE)).toFixed(2);
        const base =  (value / priceWon * (1 - FIXED_FEE_RATE)).toFixed(2);
        const plus5 = (value / priceWon * (1 + PRICE_TICK) * (1 - FIXED_FEE_RATE)).toFixed(2);

        minus5Cell.textContent = minus5.toLocaleString();
        baseCell.textContent   = base.toLocaleString();
        plus5Cell.textContent  = plus5.toLocaleString();
    }

    /**
     * @description 초기 랜더링 & 이벤트 바인드
     */
    initRender() {
        this.appendBasicItems();
        this.bindEvents();
    }
}
