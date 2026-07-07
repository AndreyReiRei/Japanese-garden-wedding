/**
 * main.js — Обложка с фото на весь экран
 * Мягкий 3D-эффект | Красная нить
 */

( function () {
	'use strict';

	// ============================================
	// DOM
	// ============================================
	const storyToggle = document.getElementById( 'storyToggle' );
	const storyOverlay = document.getElementById( 'storyOverlay' );
	const storyClose = document.getElementById( 'storyClose' );
	const navItems = document.querySelectorAll( '.nav-item' );
	const petalsContainer = document.getElementById( 'petalsContainer' );
	const photoBgWrapper = document.getElementById( 'photoBgWrapper' );

	// ============================================
	// СОСТОЯНИЕ
	// ============================================
	let isStoryOpen = false;
	let activeSection = 'garden';

	// Таймеры для светлячков оверлея
	let overlayFirefliesInterval = null;
	let overlayFireflies = [];

	// ============================================
	// МЯГКИЙ 3D-ЭФФЕКТ ФОНА
	// ============================================

	const MAX_MOVE = 12;
	const SMOOTHING = 0.06;

	let currentMoveX = 0;
	let currentMoveY = 0;
	let targetMoveX = 0;
	let targetMoveY = 0;

	function updateBackgroundMove() {
		if ( !photoBgWrapper ) return;

		currentMoveX += ( targetMoveX - currentMoveX ) * SMOOTHING;
		currentMoveY += ( targetMoveY - currentMoveY ) * SMOOTHING;

		photoBgWrapper.style.transform = `translate(${currentMoveX}px, ${currentMoveY}px) scale(1.04)`;

		requestAnimationFrame( updateBackgroundMove );
	}

	function handleMouseMove( e ) {
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		const normalizedX = ( e.clientX - centerX ) / centerX;
		const normalizedY = ( e.clientY - centerY ) / centerY;

		targetMoveX = -normalizedX * MAX_MOVE;
		targetMoveY = -normalizedY * MAX_MOVE;
	}

	function handleMouseLeave() {
		targetMoveX = 0;
		targetMoveY = 0;
	}

	function handleOrientation( e ) {
		const beta = e.beta || 0;
		const gamma = e.gamma || 0;

		const normalizedBeta = Math.max( -30, Math.min( 30, beta ) ) / 30;
		const normalizedGamma = Math.max( -20, Math.min( 20, gamma ) ) / 20;

		targetMoveX = -normalizedGamma * MAX_MOVE * 0.6;
		targetMoveY = -normalizedBeta * MAX_MOVE * 0.6;
	}

	function requestGyroPermission() {
		if ( typeof DeviceOrientationEvent !== 'undefined' &&
			typeof DeviceOrientationEvent.requestPermission === 'function' ) {
			DeviceOrientationEvent.requestPermission()
				.then( permission => {
					if ( permission === 'granted' ) {
						window.addEventListener( 'deviceorientation', handleOrientation );
					}
				} )
				.catch( () => { } );
		} else if ( 'DeviceOrientationEvent' in window ) {
			window.addEventListener( 'deviceorientation', handleOrientation );
		}
	}

	function handleTouchMove( e ) {
		if ( e.touches.length === 0 ) return;

		const touch = e.touches[0];
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		const normalizedX = ( touch.clientX - centerX ) / centerX;
		const normalizedY = ( touch.clientY - centerY ) / centerY;

		targetMoveX = -normalizedX * MAX_MOVE * 0.5;
		targetMoveY = -normalizedY * MAX_MOVE * 0.5;
	}

	function handleTouchEnd() {
		targetMoveX = 0;
		targetMoveY = 0;
	}

	function init3D() {
		if ( window.matchMedia( '(hover: hover)' ).matches ) {
			document.addEventListener( 'mousemove', handleMouseMove );
			document.addEventListener( 'mouseleave', handleMouseLeave );
		}

		document.addEventListener( 'touchmove', handleTouchMove, { passive: true } );
		document.addEventListener( 'touchend', handleTouchEnd );
		document.addEventListener( 'touchcancel', handleTouchEnd );

		requestGyroPermission();
		updateBackgroundMove();
	}

	// ============================================
	// ИСТОРИЯ (ОВЕРЛЕЙ)
	// ============================================

	function openStory() {
		if ( isStoryOpen ) return;
		isStoryOpen = true;
		storyOverlay.classList.add( 'open' );

		const icon = storyToggle.querySelector( '.story-icon' );
		if ( icon ) icon.style.transform = 'rotate(180deg)';

		if ( window.navigator?.vibrate ) window.navigator.vibrate( 10 );

		// Запускаем светлячков в оверлее
		startOverlayFireflies();
	}

	function closeStory() {
		if ( !isStoryOpen ) return;
		isStoryOpen = false;
		storyOverlay.classList.remove( 'open' );

		const icon = storyToggle.querySelector( '.story-icon' );
		if ( icon ) icon.style.transform = 'rotate(0deg)';

		if ( window.navigator?.vibrate ) window.navigator.vibrate( 8 );

		// Останавливаем светлячков в оверлее
		stopOverlayFireflies();
	}

	storyToggle.addEventListener( 'click', () => isStoryOpen ? closeStory() : openStory() );
	storyClose.addEventListener( 'click', closeStory );

	let touchStartY = 0;
	storyOverlay.addEventListener( 'touchstart', e => {
		touchStartY = e.touches[0].clientY;
	}, { passive: true } );

	storyOverlay.addEventListener( 'touchmove', e => {
		if ( e.touches[0].clientY - touchStartY > 70 && isStoryOpen ) closeStory();
	}, { passive: true } );

	storyOverlay.addEventListener( 'click', e => {
		if ( e.target === storyOverlay ) closeStory();
	} );

	// ============================================
	// НАВИГАЦИЯ (ОБНОВЛЁННАЯ — с переходами)
	// ============================================

	/**
	 * Карта переходов: какой data-section ведёт на какую страницу.
	 * Если нужно изменить URL — меняем здесь.
	 */
	const SECTION_PAGES = {
		garden: 'pages/garden.html',
		zags: 'pages/zags.html',
		home: 'pages/home.html'
	};

	/**
	 * Обработчик клика по кнопке навигации.
	 * Подсвечивает активную кнопку и переходит на страницу раздела.
	 */
	navItems.forEach( item => {
		item.addEventListener( 'click', function () {
			const section = this.getAttribute( 'data-section' );

			// Если тап по уже активному разделу — всё равно переходим
			// (на случай если пользователь хочет вернуться)

			// Обновляем активный раздел
			activeSection = section;
			navItems.forEach( n => {
				const isActive = n.getAttribute( 'data-section' ) === section;
				n.classList.toggle( 'active', isActive );
			} );

			// Тактильный отклик
			if ( window.navigator?.vibrate ) {
				window.navigator.vibrate( 15 );
			}

			// Переход на страницу раздела
			const targetPage = SECTION_PAGES[section];
			if ( targetPage ) {
				console.log( `📍 Переход в раздел: ${section} → ${targetPage}` );

				// Небольшая задержка для анимации нажатия
				setTimeout( () => {
					window.location.href = targetPage;
				}, 150 );
			} else {
				console.warn( `⚠️ Неизвестный раздел: ${section}` );
			}
		} );
	} );

	// ============================================
	// ЛЕПЕСТКИ САКУРЫ
	// ============================================

	const petalStyle = document.createElement( 'style' );
	petalStyle.textContent = `
        @keyframes petalFall {
            0% { transform: translateY(-30px) rotate(0deg) translateX(0px); opacity: 0; }
            10% { opacity: 1; }
            60% { transform: translateY(60vh) rotate(180deg) translateX(35px); opacity: 0.7; }
            100% { transform: translateY(105vh) rotate(360deg) translateX(-10px); opacity: 0; }
        }
        @keyframes petalSway {
            0%, 100% { margin-left: 0; }
            25% { margin-left: 10px; }
            75% { margin-left: -6px; }
        }
    `;
	document.head.appendChild( petalStyle );

	function createPetal() {
		const petal = document.createElement( 'div' );
		const size = Math.random() * 8 + 5;
		const duration = Math.random() * 10 + 8;
		const delay = Math.random() * 10;
		const opacity = Math.random() * 0.2 + 0.06;
		const isPink = Math.random() > 0.4;

		petal.style.cssText = `
            position: absolute;
            top: -25px;
            left: ${Math.random() * 95}%;
            width: ${size}px;
            height: ${size * 1.5}px;
            background: radial-gradient(ellipse at 30% 30%,
                ${isPink ? 'rgba(232, 64, 64,' : 'rgba(201, 169, 110,'} ${opacity + 0.08}) 0%,
                ${isPink ? 'rgba(176, 32, 32,' : 'rgba(160, 130, 80,'} ${opacity}) 100%);
            border-radius: ${Math.random() > 0.5 ? '50% 0 50% 0' : '0 50% 0 50%'};
            animation: petalFall ${duration}s ${delay}s linear infinite,
                       petalSway ${duration * 0.6}s ${delay}s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
        `;
		return petal;
	}

	const PETAL_COUNT = 15;
	for ( let i = 0; i < PETAL_COUNT; i++ ) {
		petalsContainer.appendChild( createPetal() );
	}

	setInterval( () => {
		const petals = petalsContainer.querySelectorAll( 'div:not(.firefly):not(.overlay-firefly)' );
		if ( petals.length < PETAL_COUNT + 8 ) petalsContainer.appendChild( createPetal() );
		if ( petals.length > PETAL_COUNT + 16 && petals[0] ) petals[0].remove();
	}, 4000 );

	// ============================================
	// СВЕТЛЯЧКИ (ОСНОВНОЙ ЭКРАН)
	// ============================================

	const fireflyStyle = document.createElement( 'style' );
	fireflyStyle.textContent = `
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
	document.head.appendChild( fireflyStyle );

	function createFirefly() {
		const firefly = document.createElement( 'div' );

		const size = Math.random() * 3 + 1.5;
		const startX = Math.random() * 90;
		const startY = Math.random() * 80;
		const duration = Math.random() * 6 + 4;
		const delay = Math.random() * 5;

		const glowColor = 'rgba(255, 200, 140, 0.7)';
		const outerGlow = 'rgba(255, 160, 80, 0.35)';

		firefly.className = 'firefly';
		firefly.style.cssText = `
			position: absolute;
			top: ${startY}%;
			left: ${startX}%;
			width: ${size}px;
			height: ${size}px;
			background: radial-gradient(
				circle at center,
				rgba(255, 220, 170, 0.95) 0%,
				${glowColor} 35%,
				transparent 70%
			);
			border-radius: 50%;
			box-shadow: 
				0 0 ${size * 2}px ${glowColor},
				0 0 ${size * 5}px ${outerGlow},
				0 0 ${size * 10}px rgba(255, 140, 50, 0.15);
			animation: fireflyFloat ${duration}s ${delay}s ease-in-out infinite;
			pointer-events: none;
			z-index: 4;
			will-change: transform, opacity;
		`;

		return firefly;
	}

	const FIREFLY_COUNT = 10;
	for ( let i = 0; i < FIREFLY_COUNT; i++ ) {
		setTimeout( () => {
			petalsContainer.appendChild( createFirefly() );
		}, i * 400 );
	}

	setInterval( () => {
		const oldFireflies = petalsContainer.querySelectorAll( '.firefly' );
		oldFireflies.forEach( f => f.remove() );

		for ( let i = 0; i < FIREFLY_COUNT; i++ ) {
			setTimeout( () => {
				petalsContainer.appendChild( createFirefly() );
			}, i * 300 );
		}
	}, 10000 );

	// ============================================
	// СВЕТЛЯЧКИ (ОВЕРЛЕЙ)
	// ============================================

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

	function startOverlayFireflies() {
		const OVERLAY_FIREFLY_COUNT = 8;

		for ( let i = 0; i < OVERLAY_FIREFLY_COUNT; i++ ) {
			setTimeout( () => {
				const ff = createOverlayFirefly();
				overlayFireflies.push( ff );
				storyOverlay.appendChild( ff );
			}, i * 250 );
		}

		overlayFirefliesInterval = setInterval( () => {
			overlayFireflies.forEach( f => f.remove() );
			overlayFireflies = [];

			for ( let i = 0; i < OVERLAY_FIREFLY_COUNT; i++ ) {
				setTimeout( () => {
					const ff = createOverlayFirefly();
					overlayFireflies.push( ff );
					storyOverlay.appendChild( ff );
				}, i * 250 );
			}
		}, 8000 );
	}

	function stopOverlayFireflies() {
		if ( overlayFirefliesInterval ) {
			clearInterval( overlayFirefliesInterval );
			overlayFirefliesInterval = null;
		}

		overlayFireflies.forEach( f => f.remove() );
		overlayFireflies = [];
	}

	// ============================================
	// ПЛАВНОЕ ПОЯВЛЕНИЕ
	// ============================================
	function entranceAnimation() {
		const container = document.querySelector( '.cover-container' );
		if ( container ) {
			container.style.opacity = '0';
			container.style.transition = 'opacity 1s ease';
			requestAnimationFrame( () => container.style.opacity = '1' );
		}
	}

	// ============================================
	// ЗАПУСК
	// ============================================
	function init() {
		entranceAnimation();
		init3D();
		console.log( '🖤❤️ Обложка готова — фото на весь экран' );
		console.log( '📖 Разделы: Сад | ЗАГС | Дом' );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}

} )();