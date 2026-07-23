/**
 * ============================================================
 * main.js — Логика обложки свадебного альбома
 * «Красная нить» — японская эстетика
 * ============================================================
 * 
 * СОДЕРЖАНИЕ:
 *   1.  DOM-элементы
 *   2.  Состояние приложения
 *   3.  Мягкий 3D-эффект фонового фото
 *   4.  Оверлей «История одного дня»
 *   5.  Навигация между разделами
 *   6.  Обратный отсчёт до годовщины (реальное время)
 *   7.  Анимация появления
 *   8.  Запуск приложения
 * 
 * ЗАВИСИМОСТИ:
 *   - effects.js (для светлячков в оверлее)
 *   - cover.css
 * ============================================================
 */

( function () {
	'use strict';

	// ============================================================
	// 1. DOM-ЭЛЕМЕНТЫ
	// Кешируем ссылки на все нужные элементы страницы.
	// ============================================================

	const storyToggle = document.getElementById( 'storyToggle' );
	const storyOverlay = document.getElementById( 'storyOverlay' );
	const storyClose = document.getElementById( 'storyClose' );
	const navItems = document.querySelectorAll( '.nav-item' );
	const photoBgWrapper = document.getElementById( 'photoBgWrapper' );

	// ============================================================
	// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
	// Флаги и переменные, которые меняются во время работы.
	// ============================================================

	/** Открыт ли оверлей с историей */
	let isStoryOpen = false;

	/** Текущий активный раздел (сад / загс / дом) */
	let activeSection = 'garden';

	/** Контроллер светлячков в оверлее (возвращается из effects.js) */
	let overlayFirefliesController = null;

	// ============================================================
	// 3. МЯГКИЙ 3D-ЭФФЕКТ ФОНОВОГО ФОТО
	// Фото на весь экран плавно смещается при движении
	// мыши, пальца или наклоне устройства (гироскоп).
	// ============================================================

	/**
	 * Максимальное смещение фона в пикселях.
	 * Чем больше — тем заметнее эффект.
	 */
	const MAX_MOVE = 12;

	/**
	 * Коэффициент плавности (0..1).
	 * Чем меньше — тем мягче и медленнее движение.
	 */
	const SMOOTHING = 0.06;

	/** Текущее положение фона (плавно меняется каждый кадр) */
	let currentMoveX = 0;
	let currentMoveY = 0;

	/** Целевое положение (меняется резко при движении мыши/пальца) */
	let targetMoveX = 0;
	let targetMoveY = 0;

	/**
	 * 3.1. Главный цикл анимации фона.
	 * Вызывается 60 раз в секунду через requestAnimationFrame.
	 * Плавно приближает текущее положение к целевому.
	 */
	function updateBackgroundMove() {
		if ( !photoBgWrapper ) return;

		// Линейная интерполяция: каждый кадр приближаемся на SMOOTHING * 100%
		currentMoveX += ( targetMoveX - currentMoveX ) * SMOOTHING;
		currentMoveY += ( targetMoveY - currentMoveY ) * SMOOTHING;

		// Применяем трансформацию + небольшой зум чтобы не было полей
		photoBgWrapper.style.transform =
			`translate(${currentMoveX}px, ${currentMoveY}px) scale(1.04)`;

		// Рекурсивно продолжаем цикл
		requestAnimationFrame( updateBackgroundMove );
	}

	/**
	 * 3.2. Движение мыши (десктоп).
	 * Вычисляем отклонение курсора от центра экрана.
	 */
	function handleMouseMove( e ) {
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		// Нормализация: -1 (край слева/сверху) до +1 (край справа/снизу)
		const normalizedX = ( e.clientX - centerX ) / centerX;
		const normalizedY = ( e.clientY - centerY ) / centerY;

		// Смещаем фон в противоположную сторону для эффекта параллакса
		targetMoveX = -normalizedX * MAX_MOVE;
		targetMoveY = -normalizedY * MAX_MOVE;
	}

	/** 3.3. Сброс при уходе мыши с экрана */
	function handleMouseLeave() {
		targetMoveX = 0;
		targetMoveY = 0;
	}

	/**
	 * 3.4. Гироскоп (мобильные устройства).
	 * beta  — наклон вперёд-назад (-180 до 180)
	 * gamma — наклон влево-вправо (-90 до 90)
	 */
	function handleOrientation( e ) {
		const beta = e.beta || 0;
		const gamma = e.gamma || 0;

		// Ограничиваем углы и нормализуем
		const normalizedBeta = Math.max( -30, Math.min( 30, beta ) ) / 30;
		const normalizedGamma = Math.max( -20, Math.min( 20, gamma ) ) / 20;

		// Уменьшаем чувствительность (0.6)
		targetMoveX = -normalizedGamma * MAX_MOVE * 0.6;
		targetMoveY = -normalizedBeta * MAX_MOVE * 0.6;
	}

	/**
	 * 3.5. Запрос разрешения на гироскоп.
	 * На iOS 13+ нужно явно запрашивать разрешение.
	 * На Android работает без запроса.
	 */
	function requestGyroPermission() {
		if ( typeof DeviceOrientationEvent !== 'undefined' &&
			typeof DeviceOrientationEvent.requestPermission === 'function' ) {
			// iOS 13+
			DeviceOrientationEvent.requestPermission()
				.then( permission => {
					if ( permission === 'granted' ) {
						window.addEventListener( 'deviceorientation', handleOrientation );
						console.log( '📱 Гироскоп активирован (iOS)' );
					}
				} )
				.catch( () => {
					console.log( '📱 Гироскоп отклонён' );
				} );
		} else if ( 'DeviceOrientationEvent' in window ) {
			// Android и старые iOS
			window.addEventListener( 'deviceorientation', handleOrientation );
			console.log( '📱 Гироскоп активирован (Android)' );
		} else {
			console.log( '📱 Гироскоп не поддерживается' );
		}
	}

	/**
	 * 3.6. Касание пальцем (мобильные).
	 * Аналогично мыши, но с меньшей чувствительностью.
	 */
	function handleTouchMove( e ) {
		if ( e.touches.length === 0 ) return;

		const touch = e.touches[0];
		const centerX = window.innerWidth / 2;
		const centerY = window.innerHeight / 2;

		const normalizedX = ( touch.clientX - centerX ) / centerX;
		const normalizedY = ( touch.clientY - centerY ) / centerY;

		// Чувствительность 0.5 (вдвое меньше чем мышь)
		targetMoveX = -normalizedX * MAX_MOVE * 0.5;
		targetMoveY = -normalizedY * MAX_MOVE * 0.5;
	}

	/** 3.7. Сброс при окончании касания */
	function handleTouchEnd() {
		targetMoveX = 0;
		targetMoveY = 0;
	}

	/**
	 * 3.8. Инициализация 3D-эффекта.
	 * Определяет тип устройства и вешает нужные обработчики.
	 */
	function init3D() {
		// Десктоп (есть hover — значит есть мышь)
		if ( window.matchMedia( '(hover: hover)' ).matches ) {
			document.addEventListener( 'mousemove', handleMouseMove );
			document.addEventListener( 'mouseleave', handleMouseLeave );
			console.log( '🖱️ 3D: режим мыши' );
		}

		// Мобильные устройства
		document.addEventListener( 'touchmove', handleTouchMove, { passive: true } );
		document.addEventListener( 'touchend', handleTouchEnd );
		document.addEventListener( 'touchcancel', handleTouchEnd );

		// Пробуем подключить гироскоп
		requestGyroPermission();

		// Запускаем цикл анимации
		updateBackgroundMove();
		console.log( '✨ 3D-эффект фона активирован' );
	}

	// ============================================================
	// 4. ОВЕРЛЕЙ «ИСТОРИЯ ОДНОГО ДНЯ»
	// Панель выезжает снизу и перекрывает весь экран.
	// Внутри панели — светлячки из effects.js.
	// ============================================================

	/**
	 * 4.1. Открывает панель с историей.
	 */
	function openStory() {
		if ( isStoryOpen ) return;
		isStoryOpen = true;

		// Добавляем CSS-класс, который меняет transform
		storyOverlay.classList.add( 'open' );

		// Поворачиваем стрелку на кнопке
		const icon = storyToggle.querySelector( '.story-icon' );
		if ( icon ) icon.style.transform = 'rotate(180deg)';

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}

		// Запускаем светлячков в оверлее (функция из effects.js)
		if ( typeof window.startOverlayFireflies === 'function' ) {
			overlayFirefliesController = window.startOverlayFireflies( storyOverlay );
		}
	}

	/**
	 * 4.2. Закрывает панель с историей.
	 */
	function closeStory() {
		if ( !isStoryOpen ) return;
		isStoryOpen = false;

		storyOverlay.classList.remove( 'open' );

		// Возвращаем стрелку
		const icon = storyToggle.querySelector( '.story-icon' );
		if ( icon ) icon.style.transform = 'rotate(0deg)';

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}

		// Останавливаем светлячков в оверлее (функция из effects.js)
		if ( typeof window.stopOverlayFireflies === 'function' ) {
			window.stopOverlayFireflies( overlayFirefliesController );
			overlayFirefliesController = null;
		}
	}

	// 4.3. Подписка на события оверлея

	/** Клик по кнопке «История одного дня...» */
	storyToggle.addEventListener( 'click', () => {
		isStoryOpen ? closeStory() : openStory();
	} );

	/** Клик по кнопке «Свернуть» */
	storyClose.addEventListener( 'click', closeStory );

	/** Свайп вниз для закрытия */
	let touchStartY = 0;
	storyOverlay.addEventListener( 'touchstart', e => {
		touchStartY = e.touches[0].clientY;
	}, { passive: true } );

	storyOverlay.addEventListener( 'touchmove', e => {
		const diff = e.touches[0].clientY - touchStartY;
		// Если палец ушёл вниз больше чем на 70px — закрываем
		if ( diff > 70 && isStoryOpen ) {
			closeStory();
		}
	}, { passive: true } );

	/** Клик по затемнённому фону (мимо панели) — закрываем */
	storyOverlay.addEventListener( 'click', e => {
		if ( e.target === storyOverlay ) {
			closeStory();
		}
	} );

	// ============================================================
	// 5. НАВИГАЦИЯ МЕЖДУ РАЗДЕЛАМИ
	// Кнопки в верхней части обложки: Сад | ЗАГС | Дом.
	// При клике — переход на соответствующую страницу.
	// ============================================================

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

	// ============================================================
	// 6. ОБРАТНЫЙ ОТСЧЁТ ДО СЛЕДУЮЩЕЙ ГОДОВЩИНЫ
	// Отслеживает реальное время и дату.
	// Обновляется каждую минуту.
	// ============================================================

	/**
	 * ДАТА СВАДЬБЫ
	 * Измени на свою. Формат: 'YYYY-MM-DD'
	 * Месяц: 01 (январь) – 12 (декабрь)
	 */
	const WEDDING_DATE = new Date( '2024-05-15' );

	/**
	 * Вычисляет следующую годовщину и обновляет счётчик на странице.
	 * Вызывается сразу при загрузке и затем каждые 60 секунд.
	 */
	function updateCountdown() {
		const now = new Date();

		/*
		 * Берём текущий год + месяц и день свадьбы.
		 * Если эта дата уже прошла — добавляем год.
		 * Так счётчик всегда показывает время до БЛИЖАЙШЕЙ годовщины.
		 */
		const anniversary = new Date(
			now.getFullYear(),
			WEDDING_DATE.getMonth(),
			WEDDING_DATE.getDate()
		);

		// Если годовщина в этом году уже прошла — следующая в следующем году
		if ( now > anniversary ) {
			anniversary.setFullYear( anniversary.getFullYear() + 1 );
		}

		// Разница в миллисекундах
		const diff = anniversary - now;

		// Перевод в дни, часы, минуты
		const days = Math.floor( diff / ( 1000 * 60 * 60 * 24 ) );
		const hours = Math.floor( ( diff % ( 1000 * 60 * 60 * 24 ) ) / ( 1000 * 60 * 60 ) );
		const minutes = Math.floor( ( diff % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );

		// DOM-элементы счётчика
		const daysEl = document.getElementById( 'countdownDays' );
		const hoursEl = document.getElementById( 'countdownHours' );
		const minutesEl = document.getElementById( 'countdownMinutes' );

		// Обновляем текст
		if ( daysEl ) daysEl.textContent = days;
		if ( hoursEl ) hoursEl.textContent = hours;
		if ( minutesEl ) minutesEl.textContent = minutes;
	}

	// Первый запуск
	updateCountdown();

	// Обновление каждые 60 секунд
	setInterval( updateCountdown, 60000 );

	// ============================================================
	// 7. АНИМАЦИЯ ПОЯВЛЕНИЯ
	// Плавное появление контейнера при загрузке страницы.
	// ============================================================

	function entranceAnimation() {
		const container = document.querySelector( '.cover-container' );
		if ( container ) {
			container.style.opacity = '0';
			container.style.transition = 'opacity 1s ease';
			requestAnimationFrame( () => {
				container.style.opacity = '1';
			} );
		}
	}

	// ============================================================
	// 8. ЗАПУСК ПРИЛОЖЕНИЯ
	// Главная функция init — запускает всё.
	// ============================================================

	function init() {
		entranceAnimation();
		init3D();
		updateCountdown();
		console.log( '🖤❤️ Обложка готова — фото на весь экран' );
		console.log( '📖 Разделы: Сад | ЗАГС | Дом' );
		console.log( '⏳ Обратный отсчёт активирован' );
	}

	// Ждём загрузки DOM, затем запускаем
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		// DOM уже загружен — запускаем сразу
		init();
	}

} )();