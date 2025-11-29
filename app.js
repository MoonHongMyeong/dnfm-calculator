import { ExchangeSection } from "./exchange/exchange.js";

let menus;
let sections;

const navigate = (id) => {
    sections.forEach(section => {
        section.classList.toggle('active', section.id === id);
    });

    menus.forEach(menu => {
        menu.classList.toggle('active', menu.dataset.id === id);
    })
}

const addEvents = () => {
    menus.forEach(menu => {
        menu.addEventListener('click', ()=>{
            const targetId = menu.dataset.id;
            if (!targetId) return;
            navigate(targetId);
        });
    });
}

const init = () => {
    menus = document.querySelectorAll('.menu');
    sections = document.querySelectorAll('.section');
    const exchangeSection = document.querySelector('#exchange');

    const exchange = new ExchangeSection(exchangeSection);
    exchange.initRender();

    addEvents();

    // 초기 섹션 지정
    const firstMenu = Array.from(menus).find(menu => menu.dataset.id === "exchange");
    if (firstMenu) navigate(firstMenu.dataset.id);
}

document.addEventListener('DOMContentLoaded', init);