/**
 * ============================================================
 * effects.js — Лепестки сакуры и светлячки
 * Общие эффекты для всех страниц альбома.
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

	// Определяем, мобильное ли устройство
	const IS_MOBILE = window.matchMedia( '(max-width: 768px)' ).matches;

	// ============================================================
	// 1. ИНИЦИАЛИЗАЦИЯ
	// ============================================================

	function init() {
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

		injectStyles();
		initPetals( container );

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
            /* Падение вниз (на внешней обертке) */
            @keyframes petalFall {
                0%   { transform: translateY(-40px); opacity: 0; }
                8%   { opacity: 0.8; }
                50%  { opacity: 0.6; }
                85%  { opacity: 0.3; }
                100% { transform: translateY(110vh); opacity: 0; }
            }
            
            /* Покачивание и вращение (на внутреннем элементе) */
            @keyframes petalSway {
                0%   { transform: translateX(0px) rotate(0deg); }
                30%  { transform: translateX(18px) rotate(90deg); }
                70%  { transform: translateX(-14px) rotate(270deg); }
                100% { transform: translateX(0px) rotate(420deg); }
            }
            
            /* Светлячки */
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
	// 3. ЛЕПЕСТКИ САКУРЫ
	// ============================================================

	function initPetals( container ) {
		function createPetal() {
			// Внешняя обертка (отвечает за падение)
			const wrapper = document.createElement( 'div' );
			wrapper.className = 'petal-wrapper';

			const startX = Math.random() * 95;
			const dur = Math.random() * 9 + 8;
			const delay = Math.random() * 8;

			wrapper.style.cssText = `
				position: absolute;
				top: -30px;
				left: ${startX}%;
				width: 10px;
				height: 15px;
				animation: petalFall ${dur}s ${delay}s linear infinite;
				pointer-events: none;
				z-index: 0;
				will-change: transform;
			`;

			// Внутренний элемент (сам лепесток, отвечает за покачивание)
			const petal = document.createElement( 'div' );
			const size = Math.random() * 8 + 5;
			const op = Math.random() * 0.2 + 0.06;
			const isPink = Math.random() > 0.4;

			petal.className = 'petal-leaf';
			petal.style.cssText = `
				width: ${size}px;
				height: ${size * 1.5}px;
				background: radial-gradient(ellipse at 30% 30%,
					${isPink ? 'rgba(232, 64, 64,' : 'rgba(201, 169, 110,'} ${op + 0.08}) 0%,
					${isPink ? 'rgba(176, 32, 32,' : 'rgba(160, 130, 80,'} ${op}) 100%);
				border-radius: ${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
				box-shadow: 
					0 0 6px ${isPink ? 'rgba(255, 80, 80, 0.4)' : 'rgba(220, 180, 100, 0.3)'},
					0 0 14px ${isPink ? 'rgba(255, 50, 50, 0.2)' : 'rgba(200, 160, 80, 0.15)'};
				animation: petalSway ${dur * 0.6}s ${delay}s ease-in-out infinite;
				will-change: transform;
			`;

			wrapper.appendChild( petal );
			return wrapper;
		}

		const COUNT = 15;
		for ( let i = 0; i < COUNT; i++ ) {
			container.appendChild( createPetal() );
		}

		// Поддержание количества лепестков
		setInterval( () => {
			const petals = container.querySelectorAll( '.petal-wrapper' );
			if ( petals.length < COUNT + 8 ) {
				container.appendChild( createPetal() );
			}
			if ( petals.length > COUNT + 16 && petals[0] ) {
				petals[0].remove();
			}
		}, 6000 );
	}

	// ============================================================
	// 4. ФОНОВЫЕ СВЕТЛЯЧКИ
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
                will-change: transform, opacity;
            `;
			return firefly;
		}

		const COUNT = IS_MOBILE ? 6 : 10;

		for ( let i = 0; i < COUNT; i++ ) {
			setTimeout( () => {
				container.appendChild( createFirefly() );
			}, i * 400 );
		}

		setInterval( () => {
			const fireflies = container.querySelectorAll( '.firefly' );
			fireflies.forEach( f => f.remove() );
			for ( let i = 0; i < COUNT; i++ ) {
				setTimeout( () => {
					container.appendChild( createFirefly() );
				}, i * 300 );
			}
		}, 30000 );
	}

	// ============================================================
	// 5. СВЕТЛЯЧКИ ДЛЯ ОВЕРЛЕЯ / СВИТКА
	// ============================================================

	window.startOverlayFireflies = function ( el ) {
		if ( !el ) return null;

		const fireflies = [];
		const COUNT = IS_MOBILE ? 6 : 14;

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
                will-change: transform, opacity;
            `;
			return f;
		}

		for ( let i = 0; i < COUNT; i++ ) {
			setTimeout( () => {
				const ff = create();
				fireflies.push( ff );
				el.appendChild( ff );
			}, i * 250 );
		}

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
		}, 15000 );

		return { fireflies, intervalId };
	};

	window.stopOverlayFireflies = function ( ctrl ) {
		if ( !ctrl ) return;
		if ( ctrl.intervalId ) clearInterval( ctrl.intervalId );
		if ( ctrl.fireflies ) ctrl.fireflies.forEach( f => f.remove() );
	};

} )();