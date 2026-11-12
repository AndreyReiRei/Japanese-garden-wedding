/**
 * ============================================================
 * effects.js — Лепестки сакуры, светлячки и плавные переходы
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
	// 1. ПЕРЕМЕННЫЕ СОСТОЯНИЯ
	// ============================================================

	let isEffectsEnabled = true;
	let effectsContainer = null;
	let petalInterval = null;
	let fireflyInterval = null;

	// Ключ для localStorage
	const STORAGE_KEY = 'wedding_effects_enabled';

	// ============================================================
	// 2. ИНИЦИАЛИЗАЦИЯ
	// ============================================================

	function init() {
		// Проверяем сохраненную настройку (по умолчанию — включено)
		const savedSetting = localStorage.getItem( STORAGE_KEY );
		isEffectsEnabled = savedSetting !== 'false';

		// Настраиваем тумблер (если он есть на странице)
		setupToggle();

		// Запускаем или не запускаем эффекты
		if ( isEffectsEnabled ) {
			startEffects();
		} else {
			console.log( '🌸 Эффекты отключены пользователем (из памяти)' );
		}

		// Переходы запускаем всегда (не зависят от эффектов)
		initPageTransitions();
	}

	// ============================================================
	// 3. НАСТРОЙКА ТУМБЛЕРА
	// ============================================================

	function setupToggle() {
		const toggle = document.getElementById( 'effectsToggle' );
		if ( !toggle ) return;

		// Устанавливаем состояние: checked = эффекты включены
		toggle.checked = isEffectsEnabled;

		// Обработчик клика
		toggle.addEventListener( 'change', () => {
			isEffectsEnabled = toggle.checked;
			localStorage.setItem( STORAGE_KEY, isEffectsEnabled );

			if ( isEffectsEnabled ) {
				startEffects();
				console.log( '🌸 Эффекты включены' );
			} else {
				stopEffects();
				console.log( '🌸 Эффекты отключены' );
			}
		} );
	}

	// ============================================================
	// 4. ЗАПУСК И ОСТАНОВКА ЭФФЕКТОВ
	// ============================================================

	function startEffects() {
		// Создаем контейнер, если его нет
		if ( !effectsContainer ) {
			effectsContainer = document.getElementById( 'effectsContainer' );
			if ( !effectsContainer ) {
				effectsContainer = document.createElement( 'div' );
				effectsContainer.id = 'effectsContainer';
				effectsContainer.style.cssText = `
					position: fixed;
					inset: 0;
					z-index: 5;
					pointer-events: none;
					overflow: hidden;
				`;
				document.body.appendChild( effectsContainer );
			}
			// Внедряем CSS (один раз)
			injectStyles();
		}

		// Очищаем контейнер перед запуском
		effectsContainer.innerHTML = '';

		// Запускаем лепестки
		initPetals( effectsContainer );

		// Фоновые светлячки (только на главной)
		if ( document.getElementById( 'storyToggle' ) ) {
			initFireflies( effectsContainer );
			console.log( '🌸🪲 Эффекты запущены (лепестки + фоновые светлячки)' );
		} else {
			console.log( '🌸 Эффекты запущены (только лепестки)' );
		}
	}

	function stopEffects() {
		// Очищаем интервалы
		if ( petalInterval ) {
			clearInterval( petalInterval );
			petalInterval = null;
		}
		if ( fireflyInterval ) {
			clearInterval( fireflyInterval );
			fireflyInterval = null;
		}

		// Удаляем все элементы из контейнера
		if ( effectsContainer ) {
			effectsContainer.innerHTML = '';
		}
	}

	// ============================================================
	// 5. CSS-АНИМАЦИИ ДЛЯ ЭФФЕКТОВ
	// ============================================================

	function injectStyles() {
		if ( document.getElementById( 'effects-styles' ) ) return;

		const style = document.createElement( 'style' );
		style.id = 'effects-styles';
		style.textContent = `
			@keyframes petalFall {
				0%   { transform: translateY(-40px); opacity: 0; }
				8%   { opacity: 0.8; }
				50%  { opacity: 0.6; }
				85%  { opacity: 0.3; }
				100% { transform: translateY(110vh); opacity: 0; }
			}
			@keyframes petalSway {
				0%   { transform: translateX(0px) rotate(0deg); }
				30%  { transform: translateX(18px) rotate(90deg); }
				70%  { transform: translateX(-14px) rotate(270deg); }
				100% { transform: translateX(0px) rotate(420deg); }
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
	// 6. ЛЕПЕСТКИ САКУРЫ
	// ============================================================

	function initPetals( container ) {
		function createPetal() {
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
		petalInterval = setInterval( () => {
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
	// 7. ФОНОВЫЕ СВЕТЛЯЧКИ
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

		fireflyInterval = setInterval( () => {
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
	// 8. СВЕТЛЯЧКИ ДЛЯ ОВЕРЛЕЯ / СВИТКА
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

	/**
 * ============================================================
 * 9. ПЕРЕХОДЫ МЕЖДУ СТРАНИЦАМИ + PREFETCH
 * ============================================================
 * 1) Показывает занавес (#page-curtain) перед уходом
 * 2) Prefetch HTML соседних страниц (быстрее клик)
 * 3) Перехватывает <a> и кнопки [data-section] на обложке
 *
 * ВАЖНО: это ЕДИНСТВЕННЫЙ обработчик переходов.
 * В main.js не дублируйте location.href по тем же кнопкам.
 * ============================================================
 */
	function initPageTransitions() {

		// ----------------------------------------------------------
		// 1. ЗАНАВЕС
		// Тёмный слой поверх страницы. Класс .active запускает
		// CSS-анимацию. Если элемента ещё нет — создаём.
		// ----------------------------------------------------------
		let curtain = document.getElementById( 'page-curtain' );

		if ( !curtain ) {
			curtain = document.createElement( 'div' );
			curtain.id = 'page-curtain';
			document.body.appendChild( curtain );
		}

		// ----------------------------------------------------------
		// 2. PREFETCH
		// Браузер заранее качает HTML, но не открывает его.
		// Set — чтобы один и тот же URL не prefetch'ить дважды.
		// ----------------------------------------------------------
		const prefetched = new Set();

		/**
		 * Ставит в <head> тег <link rel="prefetch">
		 * @param {string} url — путь к странице
		 */
		function prefetch( url ) {
			if ( !url ) return;
			if ( prefetched.has( url ) ) return;
			if ( url.startsWith( '#' ) ) return;
			if ( url.startsWith( 'mailto:' ) ) return;
			if ( url.startsWith( 'tel:' ) ) return;

			prefetched.add( url );

			const link = document.createElement( 'link' );
			link.rel = 'prefetch';
			link.href = url;
			link.as = 'document';
			document.head.appendChild( link );
		}

		/**
		 * Анимация занавеса → переход на url
		 * 600ms должно совпадать с длительностью CSS у #page-curtain
		 */
		function navigateTo( href ) {
			prefetch( href );                 // догружаем, если ещё не успели
			curtain.classList.add( 'active' ); // показываем занавес

			setTimeout( () => {
				window.location.href = href;
			}, 600 );
		}

		// ----------------------------------------------------------
		// 3. ОБЫЧНЫЕ ССЫЛКИ <a>
		// «На главную», «Следующий раздел» и т.п. на pages/*
		// ----------------------------------------------------------
		const links = document.querySelectorAll(
			'a[href]:not([target="_blank"]):not([href^="#"])'
		);

		links.forEach( link => {
			const href = link.getAttribute( 'href' );

			if ( !href ) return;
			if ( href.startsWith( 'mailto:' ) ) return;
			if ( href.startsWith( 'tel:' ) ) return;

			// Навели / коснулись — начинаем качать страницу
			link.addEventListener( 'mouseenter', () => prefetch( href ), { passive: true } );
			link.addEventListener( 'touchstart', () => prefetch( href ), { passive: true } );

			// Клик — занавес и переход
			link.addEventListener( 'click', ( e ) => {
				// Ctrl/Cmd/Shift/Alt + клик = новая вкладка, не мешаем
				if ( e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ) return;

				e.preventDefault();
				navigateTo( href );
			} );
		} );

		// ----------------------------------------------------------
		// 4. КНОПКИ ОБЛОЖКИ [data-section]
		// Сад / ЗАГС / Дом / Видео на главной
		// ----------------------------------------------------------
		const navButtons = document.querySelectorAll( 'button[data-section]' );

		// На страницах разделов таких кнопок нет — выходим из этого куска,
		// но prefetch ссылок (блок 3) и фоновый prefetch (блок 5) уже настроены
		if ( navButtons.length > 0 ) {

			// Карта: data-section → реальный путь
			const SECTION_PAGES = {
				garden: 'pages/garden.html',
				zags: 'pages/zags.html',
				home: 'pages/home.html',
				video: 'pages/video.html'
			};

			navButtons.forEach( btn => {
				const section = btn.getAttribute( 'data-section' );
				const href = SECTION_PAGES[section];
				if ( !href ) return;

				btn.addEventListener( 'mouseenter', () => prefetch( href ), { passive: true } );
				btn.addEventListener( 'touchstart', () => prefetch( href ), { passive: true } );

				btn.addEventListener( 'click', ( e ) => {
					e.preventDefault();
					navigateTo( href );
				} );
			} );
		}

		// ----------------------------------------------------------
		// 5. ФОНОВЫЙ PREFETCH СОСЕДЕЙ
		// Только внутри /pages/ — подтягиваем главную и другие разделы
		// ----------------------------------------------------------
		if ( location.pathname.includes( '/pages/' ) ) {
			const neighbors = [
				'../index.html',
				'garden.html',
				'zags.html',
				'home.html',
				'video.html'
			];

			neighbors.forEach( ( url, i ) => {
				// По очереди, с небольшой задержкой после загрузки страницы
				setTimeout( () => prefetch( url ), 800 + i * 150 );
			} );
		}
	}

	// ============================================================
	// 10. ПУБЛИЧНЫЕ ФУНКЦИИ ДЛЯ ВНЕШНЕГО МИРА
	// ============================================================

	/**
	 * Проверяет, включены ли эффекты.
	 * Возвращает true, если эффекты активны, и false, если отключены.
	 * Используется в scroll.js, чтобы не запускать светлячков, если они отключены.
	 */
	window.areEffectsEnabled = function () {
		return isEffectsEnabled;
	};

} )();