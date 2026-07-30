/**
 * ============================================================
 * effects.js — Лепестки сакуры и светлячки
 * Общие эффекты для всех страниц альбома.
 * ============================================================
 * 
 * ЧТО ДЕЛАЕТ:
 *   - Добавляет падающие лепестки сакуры на фон страницы (всегда).
 *   - Добавляет летающих светлячков на фон страницы (только на главной).
 *   - Предоставляет функции для светлячков в оверлее/свитке.
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   Подключается на странице — лепестки запускаются автоматически.
 *   Фоновые светлячки — только если на странице есть #storyToggle.
 *   Для светлячков в модальном окне/свитке:
 *     const ctrl = window.startOverlayFireflies( element );
 *     window.stopOverlayFireflies( ctrl );
 * 
 * ВАЖНО:
 *   - Фоновые светлячки (position: fixed) — только на главной.
 *   - Оверлейные светлячки (position: fixed) — на всём экране,
 *     добавляются в переданный элемент, удаляются при закрытии.
 *   - Лепестки — на всех страницах.
 * ============================================================
 */

( function () {
	'use strict';

	// Ждём загрузки DOM, затем запускаем
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

	// ============================================================
	// 1. ИНИЦИАЛИЗАЦИЯ
	// ============================================================

	function init() {
		// Контейнер для фоновых эффектов (лепестки + фоновые светлячки)
		let container = document.getElementById( 'effectsContainer' );
		if ( !container ) {
			container = document.createElement( 'div' );
			container.id = 'effectsContainer';
			container.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 5;
                pointer-events: none;
                overflow: hidden;
            `;
			document.body.appendChild( container );
		}

		// Добавляем CSS-анимации в <head> (один раз)
		injectStyles();

		// Лепестки сакуры — на всех страницах
		initPetals( container );

		/*
		 * Фоновые светлячки — ТОЛЬКО на главной странице.
		 * Главную определяем по наличию элемента #storyToggle.
		 * На страницах галерей светлячки включаются только в свитке.
		 */
		if ( document.getElementById( 'storyToggle' ) ) {
			initFireflies( container );
			console.log( '🌸🪲 Эффекты запущены (лепестки + фоновые светлячки)' );
		} else {
			console.log( '🌸 Эффекты запущены (только лепестки)' );
		}
	}

	// ============================================================
	// 2. CSS-АНИМАЦИИ
	// ============================================================

	function injectStyles() {
		if ( document.getElementById( 'effects-styles' ) ) return;

		const style = document.createElement( 'style' );
		style.id = 'effects-styles';
		style.textContent = `
            @keyframes petalFall {
                0%   { transform: translateY(-40px) rotate(0deg) translateX(0px); opacity: 0; }
                8%   { opacity: 0.8; }
                50%  { opacity: 0.6; }
                85%  { opacity: 0.3; }
                100% { transform: translateY(110vh) rotate(420deg) translateX(-20px); opacity: 0; }
            }
            @keyframes petalSway {
                0%, 100% { margin-left: 0px; }
                30%      { margin-left: 18px; }
                70%      { margin-left: -14px; }
            }
            @keyframes fireflyFloat {
                0%, 100% { opacity: 0.15; transform: translate(0, 0) scale(0.8); }
                20%      { opacity: 0.9;  transform: translate(12px, -18px) scale(1.6); }
                40%      { opacity: 0.25; transform: translate(-8px, -8px) scale(0.6); }
                60%      { opacity: 0.85; transform: translate(-14px, -22px) scale(1.8); }
                80%      { opacity: 0.3;  transform: translate(6px, -12px) scale(0.9); }
            }
        `;
		document.head.appendChild( style );
	}

	// ============================================================
	// 3. ЛЕПЕСТКИ САКУРЫ (ФОН)
	// Всегда активны на всех страницах.
	// ============================================================

	function initPetals( container ) {
		function createPetal() {
			const petal = document.createElement( 'div' );
			const size = Math.random() * 8 + 5;
			const startX = Math.random() * 95;
			const dur = Math.random() * 9 + 8;
			const delay = Math.random() * 8;
			const op = Math.random() * 0.2 + 0.06;
			const isPink = Math.random() > 0.4;

			petal.className = 'petal-leaf';
			petal.style.cssText = `
                position: absolute;
                top: -25px;
                left: ${startX}%;
                width: ${size}px;
                height: ${size * 1.5}px;
                background: radial-gradient(ellipse at 30% 30%,
                    ${isPink ? 'rgba(232, 64, 64,' : 'rgba(201, 169, 110,'} ${op + 0.08}) 0%,
                    ${isPink ? 'rgba(176, 32, 32,' : 'rgba(160, 130, 80,'} ${op}) 100%);
                border-radius: ${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
                box-shadow: 
                    0 0 6px ${isPink ? 'rgba(255, 80, 80, 0.4)' : 'rgba(220, 180, 100, 0.3)'},
                    0 0 14px ${isPink ? 'rgba(255, 50, 50, 0.2)' : 'rgba(200, 160, 80, 0.15)'};
                animation: petalFall ${dur}s ${delay}s linear infinite,
                           petalSway ${dur * 0.6}s ${delay}s ease-in-out infinite;
                pointer-events: none;
                z-index: 0;
            `;
			return petal;
		}

		const COUNT = 15;
		for ( let i = 0; i < COUNT; i++ ) {
			container.appendChild( createPetal() );
		}

		// Поддержание количества лепестков
		setInterval( () => {
			const petals = container.querySelectorAll( '.petal-leaf' );
			if ( petals.length < COUNT + 8 ) {
				container.appendChild( createPetal() );
			}
			if ( petals.length > COUNT + 16 && petals[0] ) {
				petals[0].remove();
			}
		}, 4000 );
	}

	// ============================================================
	// 4. ФОНОВЫЕ СВЕТЛЯЧКИ (только на главной странице)
	// position: absolute внутри effectsContainer (position: fixed).
	// Летают по всему экрану.
	// ============================================================

	function initFireflies( container ) {
		function createFirefly() {
			const firefly = document.createElement( 'div' );
			const size = Math.random() * 3 + 1.5;
			const startX = Math.random() * 90;
			const startY = Math.random() * 80;
			const dur = Math.random() * 6 + 4;
			const delay = Math.random() * 5;

			firefly.className = 'firefly';
			firefly.style.cssText = `
                position: absolute;
                top: ${startY}%;
                left: ${startX}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle at center,
                    rgba(255, 220, 170, 0.95) 0%,
                    rgba(255, 200, 140, 0.7) 35%,
                    transparent 70%);
                border-radius: 50%;
                box-shadow: 
                    0 0 ${size * 2}px rgba(255, 200, 140, 0.7),
                    0 0 ${size * 5}px rgba(255, 160, 80, 0.35),
                    0 0 ${size * 10}px rgba(255, 140, 50, 0.15);
                animation: fireflyFloat ${dur}s ${delay}s ease-in-out infinite;
                pointer-events: none;
                z-index: 0;
            `;
			return firefly;
		}

		const COUNT = 10;
		for ( let i = 0; i < COUNT; i++ ) {
			setTimeout( () => {
				container.appendChild( createFirefly() );
			}, i * 400 );
		}

		// Обновление светлячков каждые 10 секунд
		setInterval( () => {
			const fireflies = container.querySelectorAll( '.firefly' );
			fireflies.forEach( f => f.remove() );
			for ( let i = 0; i < COUNT; i++ ) {
				setTimeout( () => {
					container.appendChild( createFirefly() );
				}, i * 300 );
			}
		}, 10000 );
	}

	// ============================================================
	// 5. СВЕТЛЯЧКИ ДЛЯ ОВЕРЛЕЯ / СВИТКА
	//    position: fixed — всегда на экране, не скроллятся.
	//    Добавляются в переданный элемент (document.body или другой).
	//    При закрытии полностью удаляются через stopOverlayFireflies.
	// ============================================================

	/**
	 * Создаёт светлячков на весь экран и добавляет их в переданный элемент.
	 * Светлячки используют position: fixed — они всегда видны,
	 * независимо от скролла внутри свитка.
	 * 
	 * @param {HTMLElement} el — DOM-элемент-контейнер для светлячков.
	 *        Обычно document.body (для оверлея на главной)
	 *        или .scroll-paper (для свитка).
	 * @returns {Object} { fireflies: HTMLElement[], intervalId: number }
	 */
	window.startOverlayFireflies = function ( el ) {
		if ( !el ) return null;

		const fireflies = [];
		const COUNT = 14;

		/**
		 * Создаёт одного светлячка.
		 * position: fixed — привязан к окну браузера, не скроллится.
		 */
		function create() {
			const f = document.createElement( 'div' );
			const s = Math.random() * 4 + 2;
			const sx = Math.random() * 90;
			const sy = Math.random() * 85;
			const dur = Math.random() * 5 + 3;
			const del = Math.random() * 4;

			f.className = 'overlay-firefly';
			f.style.cssText = `
                position: fixed;
                top: ${sy}%;
                left: ${sx}%;
                width: ${s}px;
                height: ${s}px;
                background: radial-gradient(circle at center,
                    rgba(255, 230, 180, 1) 0%,
                    rgba(255, 210, 150, 0.8) 30%,
                    transparent 70%);
                border-radius: 50%;
                box-shadow: 
                    0 0 ${s * 2.5}px rgba(255, 210, 150, 0.8),
                    0 0 ${s * 6}px rgba(255, 170, 90, 0.4),
                    0 0 ${s * 12}px rgba(255, 150, 60, 0.2);
                animation: fireflyFloat ${dur}s ${del}s ease-in-out infinite;
                pointer-events: none;
                z-index: 101;
            `;
			return f;
		}

		// Создаём первых светлячков с задержкой
		for ( let i = 0; i < COUNT; i++ ) {
			setTimeout( () => {
				const ff = create();
				fireflies.push( ff );
				el.appendChild( ff );
			}, i * 250 );
		}

		// Обновляем светлячков каждые 8 секунд
		const intervalId = setInterval( () => {
			fireflies.forEach( f => f.remove() );
			fireflies.length = 0;
			for ( let i = 0; i < COUNT; i++ ) {
				setTimeout( () => {
					const ff = create();
					fireflies.push( ff );
					el.appendChild( ff );
				}, i * 250 );
			}
		}, 8000 );

		return { fireflies, intervalId };
	};

	/**
	 * Удаляет светлячков, созданных через startOverlayFireflies.
	 * 
	 * @param {Object} ctrl — объект, возвращённый startOverlayFireflies.
	 */
	window.stopOverlayFireflies = function ( ctrl ) {
		if ( !ctrl ) return;
		if ( ctrl.intervalId ) clearInterval( ctrl.intervalId );
		if ( ctrl.fireflies ) ctrl.fireflies.forEach( f => f.remove() );
	};

} )();