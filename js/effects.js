/**
 * ============================================================
 * effects.js — Лепестки сакуры и светлячки
 * Общие эффекты для всех страниц альбома.
 * 
 * Использование:
 *   - Автоматически добавляет лепестки и светлячков на фон.
 *   - Для светлячков в оверлее вызвать:
 *       startOverlayFireflies(overlayElement)
 *       stopOverlayFireflies(overlayElement)
 * ============================================================
 */

( function () {
	'use strict';

	// Ждём загрузки DOM
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

	function init() {
		// Находим или создаём контейнер для фоновых эффектов
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

		// Добавляем анимации в document.head (один раз)
		injectStyles();

		// Запускаем фоновые эффекты
		initPetals( container );
		initFireflies( container );

		console.log( '🌸🪲 Эффекты активированы (фон)' );
	}

	// ============================================================
	// СТИЛИ АНИМАЦИЙ
	// ============================================================

	function injectStyles() {
		if ( document.getElementById( 'effects-styles' ) ) return;

		const style = document.createElement( 'style' );
		style.id = 'effects-styles';
		style.textContent = `
            @keyframes petalFall {
                0% { transform: translateY(-40px) rotate(0deg) translateX(0px); opacity: 0; }
                8% { opacity: 0.8; }
                50% { opacity: 0.6; }
                85% { opacity: 0.3; }
                100% { transform: translateY(110vh) rotate(420deg) translateX(-20px); opacity: 0; }
            }
            @keyframes petalSway {
                0%, 100% { margin-left: 0px; }
                30% { margin-left: 18px; }
                70% { margin-left: -14px; }
            }
            @keyframes fireflyFloat {
                0%, 100% { 
                    opacity: 0.15; 
                    transform: translate(0, 0) scale(0.8); 
                }
                20% { 
                    opacity: 0.9; 
                    transform: translate(12px, -18px) scale(1.6); 
                }
                40% { 
                    opacity: 0.25; 
                    transform: translate(-8px, -8px) scale(0.6); 
                }
                60% { 
                    opacity: 0.85; 
                    transform: translate(-14px, -22px) scale(1.8); 
                }
                80% { 
                    opacity: 0.3; 
                    transform: translate(6px, -12px) scale(0.9); 
                }
            }
        `;
		document.head.appendChild( style );
	}

	// ============================================================
	// ЛЕПЕСТКИ САКУРЫ (фон)
	// ============================================================

	function initPetals( container ) {
		function createPetal() {
			const petal = document.createElement( 'div' );
			const size = Math.random() * 8 + 5;
			const startX = Math.random() * 95;
			const duration = Math.random() * 9 + 8;
			const delay = Math.random() * 8;
			const opacity = Math.random() * 0.2 + 0.06;
			const isPink = Math.random() > 0.4;

			petal.className = 'petal-leaf';
			petal.style.cssText = `
                position: absolute;
                top: -25px;
                left: ${startX}%;
                width: ${size}px;
                height: ${size * 1.5}px;
                background: radial-gradient(ellipse at 30% 30%,
                    ${isPink ? 'rgba(232, 64, 64,' : 'rgba(201, 169, 110,'} ${opacity + 0.08}) 0%,
                    ${isPink ? 'rgba(176, 32, 32,' : 'rgba(160, 130, 80,'} ${opacity}) 100%);
                border-radius: ${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
                box-shadow: 
                    0 0 6px ${isPink ? 'rgba(255, 80, 80, 0.4)' : 'rgba(220, 180, 100, 0.3)'},
                    0 0 14px ${isPink ? 'rgba(255, 50, 50, 0.2)' : 'rgba(200, 160, 80, 0.15)'};
                animation: petalFall ${duration}s ${delay}s linear infinite,
                           petalSway ${duration * 0.6}s ${delay}s ease-in-out infinite;
                pointer-events: none;
                z-index: 0;
            `;
			return petal;
		}

		const PETAL_COUNT = 15;
		for ( let i = 0; i < PETAL_COUNT; i++ ) {
			container.appendChild( createPetal() );
		}

		setInterval( () => {
			const petals = container.querySelectorAll( '.petal-leaf' );
			if ( petals.length < PETAL_COUNT + 8 ) {
				container.appendChild( createPetal() );
			}
			if ( petals.length > PETAL_COUNT + 16 && petals[0] ) {
				petals[0].remove();
			}
		}, 4000 );
	}

	// ============================================================
	// СВЕТЛЯЧКИ (фон)
	// ============================================================

	function initFireflies( container ) {
		function createFirefly() {
			const firefly = document.createElement( 'div' );
			const size = Math.random() * 3 + 1.5;
			const startX = Math.random() * 90;
			const startY = Math.random() * 80;
			const duration = Math.random() * 6 + 4;
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
                animation: fireflyFloat ${duration}s ${delay}s ease-in-out infinite;
                pointer-events: none;
                z-index: 0;
            `;
			return firefly;
		}

		const FIREFLY_COUNT = 10;
		for ( let i = 0; i < FIREFLY_COUNT; i++ ) {
			setTimeout( () => {
				container.appendChild( createFirefly() );
			}, i * 400 );
		}

		setInterval( () => {
			const fireflies = container.querySelectorAll( '.firefly' );
			fireflies.forEach( f => f.remove() );
			for ( let i = 0; i < FIREFLY_COUNT; i++ ) {
				setTimeout( () => {
					container.appendChild( createFirefly() );
				}, i * 300 );
			}
		}, 10000 );
	}

	// ============================================================
	// СВЕТЛЯЧКИ ДЛЯ ОВЕРЛЕЯ (публичные функции)
	// ============================================================

	/**
	 * Запускает светлячков внутри указанного элемента.
	 * @param {HTMLElement} overlayElement - DOM-элемент оверлея
	 * @returns {Object} объект с массивом fireflies и intervalId
	 */
	window.startOverlayFireflies = function ( overlayElement ) {
		if ( !overlayElement ) return null;

		const fireflies = [];
		const OVERLAY_FIREFLY_COUNT = 8;

		function createOverlayFirefly() {
			const firefly = document.createElement( 'div' );
			const size = Math.random() * 4 + 2;
			const startX = Math.random() * 90;
			const startY = Math.random() * 85;
			const duration = Math.random() * 5 + 3;
			const delay = Math.random() * 4;

			const glowColor = 'rgba(255, 210, 150, 0.8)';
			const outerGlow = 'rgba(255, 170, 90, 0.4)';

			firefly.className = 'overlay-firefly';
			firefly.style.cssText = `
                position: absolute;
                top: ${startY}%;
                left: ${startX}%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(
                    circle at center,
                    rgba(255, 230, 180, 1) 0%,
                    ${glowColor} 30%,
                    transparent 70%
                );
                border-radius: 50%;
                box-shadow: 
                    0 0 ${size * 2.5}px ${glowColor},
                    0 0 ${size * 6}px ${outerGlow},
                    0 0 ${size * 12}px rgba(255, 150, 60, 0.2);
                animation: fireflyFloat ${duration}s ${delay}s ease-in-out infinite;
                pointer-events: none;
                z-index: 101;
                will-change: transform, opacity;
            `;

			return firefly;
		}

		// Создаём первых светлячков
		for ( let i = 0; i < OVERLAY_FIREFLY_COUNT; i++ ) {
			setTimeout( () => {
				const ff = createOverlayFirefly();
				fireflies.push( ff );
				overlayElement.appendChild( ff );
			}, i * 250 );
		}

		// Периодически обновляем
		const intervalId = setInterval( () => {
			fireflies.forEach( f => f.remove() );
			fireflies.length = 0;

			for ( let i = 0; i < OVERLAY_FIREFLY_COUNT; i++ ) {
				setTimeout( () => {
					const ff = createOverlayFirefly();
					fireflies.push( ff );
					overlayElement.appendChild( ff );
				}, i * 250 );
			}
		}, 8000 );

		// Возвращаем управляющий объект
		return { fireflies, intervalId };
	};

	/**
	 * Останавливает светлячков в оверлее.
	 * @param {Object} controller - объект, возвращённый startOverlayFireflies
	 */
	window.stopOverlayFireflies = function ( controller ) {
		if ( !controller ) return;

		if ( controller.intervalId ) {
			clearInterval( controller.intervalId );
			controller.intervalId = null;
		}

		if ( controller.fireflies ) {
			controller.fireflies.forEach( f => f.remove() );
			controller.fireflies.length = 0;
		}
	};

} )();