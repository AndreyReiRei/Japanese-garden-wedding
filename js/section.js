/**
 * ============================================================
 * section.js — Логика страниц разделов свадебного альбома
 * «Красная нить» — японская эстетика
 * ============================================================
 * 
 * СОДЕРЖАНИЕ:
 *   1.  Инициализация и DOM-элементы
 *   2.  Состояние приложения
 *   3.  Безопасная вибрация
 *   4.  Вычисление размеров книги
 *   5.  Проверка зависимостей
 *   6.  Инициализация книги (Turn.js)
 *   7.  Резервный режим (без Turn.js)
 *   8.  Светлячки
 *   9.  Загрузка изображений
 *   10. Запуск приложения
 * ============================================================
 */

// Оборачиваем всё в IIFE (Immediately Invoked Function Expression),
// чтобы изолировать переменные от глобальной области видимости.
( function () {
	'use strict';    // Строгий режим — запрещает небезопасные операции

	// ============================================================
	// 1. ИНИЦИАЛИЗАЦИЯ И DOM-ЭЛЕМЕНТЫ
	// ============================================================

	/**
	 * Кешируем ссылки на все DOM-элементы, с которыми будем работать.
	 * Используем const, потому что ссылки не меняются после получения.
	 * 
	 * loader             — индикатор загрузки (показывается пока грузятся фото)
	 * bookContainer      — основной контейнер всей страницы
	 * flipbook           — контейнер для Turn.js (внутри него страницы)
	 * firefliesContainer — контейнер для светлячков (фон)
	 * currentPageEl      — элемент, показывающий номер текущей страницы
	 * totalPagesEl       — элемент, показывающий общее количество страниц
	 */
	const loader = document.getElementById( 'loader' );
	const bookContainer = document.getElementById( 'bookContainer' );
	const flipbook = document.getElementById( 'flipbook' );
	const firefliesContainer = document.getElementById( 'firefliesContainer' );
	const currentPageEl = document.getElementById( 'currentPage' );
	const totalPagesEl = document.getElementById( 'totalPages' );

	// ============================================================
	// 2. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
	// ============================================================

	/**
	 * bookInitialized — флаг, показывающий что Turn.js уже запущен.
	 * Защищает от повторной инициализации при множественных вызовах.
	 */
	let bookInitialized = false;

	/**
	 * userInteracted — флаг, показывающий что пользователь уже 
	 * взаимодействовал со страницей (клик/тач).
	 * Нужен для безопасного вызова вибрации (браузеры блокируют 
	 * вибрацию до первого взаимодействия).
	 */
	let userInteracted = false;

	// ============================================================
	// 3. БЕЗОПАСНАЯ ВИБРАЦИЯ
	// ============================================================

	/**
	 * Отслеживаем первое взаимодействие пользователя.
	 * Браузеры (особенно Chrome) требуют, чтобы вибрация вызывалась
	 * только после жеста пользователя. Без этого — ошибка в консоли.
	 * 
	 * { once: true } — обработчик сработает один раз и удалится.
	 */
	document.addEventListener( 'click', function () {
		userInteracted = true;
	}, { once: true } );

	document.addEventListener( 'touchstart', function () {
		userInteracted = true;
	}, { once: true } );

	/**
	 * Безопасный вызов вибрации.
	 * Проверяет все условия перед вызовом:
	 * - было ли взаимодействие с пользователем
	 * - поддерживает ли устройство вибрацию
	 * - обёрнуто в try-catch на случай любой ошибки
	 * 
	 * @param {number} duration — длительность вибрации в миллисекундах
	 */
	function safeVibrate( duration ) {
		if ( userInteracted && window.navigator && window.navigator.vibrate ) {
			try {
				window.navigator.vibrate( duration );
			} catch ( error ) {
				// Игнорируем — вибрация не критична для работы
			}
		}
	}

	// ============================================================
	// 4. ВЫЧИСЛЕНИЕ РАЗМЕРОВ КНИГИ
	// ============================================================

	/**
	 * Вычисляет оптимальные размеры книги под текущий экран.
	 * 
	 * Принцип работы:
	 * - Определяем тип устройства по ширине экрана
	 * - На мобильном (< 768px): одна страница почти во весь экран
	 * - На планшете (768-1023px): разворот, страницы до 380px
	 * - На десктопе (>= 1024px): большой разворот, страницы до 480px
	 * - Соотношение сторон страницы ~ 3:4 (портретная ориентация)
	 * 
	 * @returns {Object} Объект с размерами:
	 *   - width:       общая ширина книги
	 *   - height:      высота книги
	 *   - pageWidth:   ширина одной страницы
	 *   - pageHeight:  высота одной страницы
	 *   - display:     режим отображения ('single' или 'double')
	 *   - isMobile:    флаг мобильного устройства
	 */
	function calculateBookSize() {
		// Получаем размеры контейнера-обёртки и экрана
		var wrapper = flipbook.parentElement;
		var containerWidth = wrapper.clientWidth;
		var containerHeight = wrapper.clientHeight;
		var screenWidth = window.innerWidth;
		var screenHeight = window.innerHeight;

		// ── Определяем тип устройства ──────────────────────────
		var isMobile = screenWidth < 768;
		var isTablet = screenWidth >= 768 && screenWidth < 1024;
		var isDesktop = screenWidth >= 1024;
		var displayMode = isMobile ? 'single' : 'double';

		var pageWidth;
		var pageHeight;
		var bookWidth;

		// ── Мобильный: одна страница почти на весь экран ───────
		if ( isMobile ) {
			// Берём 94% ширины и 88% высоты контейнера
			pageWidth = containerWidth * 0.94;
			pageHeight = containerHeight * 0.88;

			// Корректируем по соотношению 3:4
			// Идеальная высота = ширина x 1.4 (с небольшим запасом)
			var idealHeight = pageWidth * 1.4;

			if ( idealHeight > pageHeight ) {
				// Фото не влезает по высоте -> уменьшаем ширину
				pageWidth = pageHeight / 1.4;
			} else if ( idealHeight < pageHeight * 0.7 ) {
				// Экран слишком широкий -> ограничиваем высотой
				pageHeight = idealHeight;
			}

			bookWidth = pageWidth;
		}

		// ── Планшет: разворот, страницы поменьше ───────────────
		else if ( isTablet ) {
			var maxPageWidth = containerWidth * 0.46;   // Две страницы по 46%
			var maxPageHeight = containerHeight * 0.85;

			pageWidth = Math.min( maxPageWidth, 380 );
			pageHeight = Math.min( maxPageHeight, pageWidth * 1.45 );
			bookWidth = pageWidth * 2;
		}

		// ── Десктоп: большой разворот ──────────────────────────
		else {
			var maxPageWidthDesk = Math.min( containerWidth * 0.44, 480 );
			var maxPageHeightDesk = Math.min( containerHeight * 0.88, maxPageWidthDesk * 1.5 );

			pageWidth = maxPageWidthDesk;
			pageHeight = maxPageHeightDesk;
			bookWidth = pageWidth * 2;
		}

		// ── Округляем до целых пикселей ────────────────────────
		pageWidth = Math.round( pageWidth );
		pageHeight = Math.round( pageHeight );
		bookWidth = Math.round( bookWidth );

		// ── Логируем для отладки ───────────────────────────────
		console.log( '📐 Размеры книги:' );
		console.log( '  Экран:', screenWidth + '×' + screenHeight );
		console.log( '  Режим:', displayMode,
			isMobile ? '(мобильный)' :
				isTablet ? '(планшет)' :
					'(десктоп)' );
		console.log( '  Страница:', pageWidth + '×' + pageHeight );
		console.log( '  Книга:', bookWidth + '×' + pageHeight );

		// Возвращаем объект с размерами
		return {
			width: bookWidth,
			height: pageHeight,
			pageWidth: pageWidth,
			pageHeight: pageHeight,
			display: displayMode,
			isMobile: isMobile
		};
	}

	// ============================================================
	// 5. ПРОВЕРКА ЗАВИСИМОСТЕЙ
	// ============================================================

	/**
	 * Проверяет, загружены ли все необходимые библиотеки.
	 * 
	 * Для работы нужны:
	 * - jQuery (должен быть загружен до Turn.js)
	 * - Turn.js (должен быть загружен после jQuery)
	 * 
	 * Если что-то не загружено — выводим ошибку в консоль
	 * и включаем резервный режим.
	 * 
	 * @returns {boolean} true если всё в порядке
	 */
	function checkDependencies() {
		console.log( '🔍 Проверка зависимостей...' );

		// Проверяем jQuery
		var hasJQuery = ( typeof jQuery !== 'undefined' );
		console.log( '  jQuery:', hasJQuery ? '✅ v' + jQuery.fn.jquery : '❌ НЕТ' );

		// Проверяем Turn.js (это плагин jQuery, доступен через jQuery.fn.turn)
		var hasTurn = hasJQuery && ( typeof jQuery.fn.turn !== 'undefined' );
		console.log( '  Turn.js:', hasTurn ? '✅' : '❌ НЕТ' );

		if ( !hasJQuery ) {
			console.error( '❌ jQuery не загружен!' );
			console.error( '   Проверь интернет-соединение или путь к CDN' );
			return false;
		}

		if ( !hasTurn ) {
			console.error( '❌ Turn.js не загружен!' );
			console.error( '   Проверь наличие файла lib/turn.min.js' );
			console.error( '   Важно: Turn.js должен подключаться ПОСЛЕ jQuery' );
			return false;
		}

		return true;
	}

	// ============================================================
	// 6. ИНИЦИАЛИЗАЦИЯ КНИГИ (TURN.JS)
	// ============================================================

	/**
	 * Основная функция инициализации книги.
	 * 
	 * Порядок действий:
	 * 1. Проверяем что книга ещё не инициализирована
	 * 2. Проверяем зависимости (jQuery + Turn.js)
	 * 3. Считаем количество страниц
	 * 4. Вычисляем размеры под текущий экран
	 * 5. Запускаем Turn.js с нужными параметрами
	 * 6. Вешаем обработчик ресайза окна
	 * 
	 * Если на любом этапе ошибка — включаем резервный режим.
	 */
	function initBook() {
		// Защита от повторной инициализации
		if ( bookInitialized ) {
			return;
		}

		console.log( '📖 Инициализация книги...' );

		// ── Проверка зависимостей ──────────────────────────────
		if ( !checkDependencies() ) {
			fallbackMode();    // Нет библиотек -> упрощённый режим
			return;
		}

		// ── jQuery-объект книги ────────────────────────────────
		var $book = jQuery( flipbook );
		var $pages = $book.children( '.page' );
		var totalPages = $pages.length;

		console.log( '  Страниц:', totalPages );

		// Если страниц нет — скрываем загрузчик и выходим
		if ( totalPages === 0 ) {
			console.error( '❌ Нет страниц в #flipbook!' );
			hideLoader();
			return;
		}

		// ── Обновляем счётчики ─────────────────────────────────
		if ( totalPagesEl ) {
			totalPagesEl.textContent = totalPages;
		}
		if ( currentPageEl ) {
			currentPageEl.textContent = '1';
		}

		// ── Вычисляем размеры ──────────────────────────────────
		var size = calculateBookSize();

		// Устанавливаем размеры контейнера через CSS
		$book.css( {
			width: size.width + 'px',
			height: size.height + 'px',
			margin: '0 auto'
		} );

		// ── Запуск Turn.js ─────────────────────────────────────
		try {
			$book.turn( {
				// Основные размеры
				width: size.width,
				height: size.height,

				// Центрирование книги в контейнере
				autoCenter: true,

				// Режим: одна страница или разворот
				display: size.display,

				// Аппаратное ускорение (на мобильных отключаем — стабильнее)
				acceleration: !size.isMobile,

				// Градиенты теней при перелистывании
				gradients: true,

				// Глубина 3D-эффекта поднятия страницы
				elevation: 50,

				// Общее количество страниц
				pages: totalPages,

				// Длительность анимации перелистывания (мс)
				duration: 600,

				// ── Обработчики событий ─────────────────────────
				when: {

					/**
					 * Страница переворачивается (в процессе анимации).
					 * Обновляем счётчик текущей страницы.
					 */
					turning: function ( event, page, view ) {
						if ( currentPageEl ) {
							currentPageEl.textContent = page;
						}
						// Лёгкая вибрация при перелистывании
						safeVibrate( 5 );
					},

					/**
					 * Страница полностью перевёрнута.
					 */
					turned: function ( event, page, view ) {
						if ( currentPageEl ) {
							currentPageEl.textContent = page;
						}
					},

					/**
					 * Пользователь начал перелистывание.
					 * corner — угол, за который потянули ('tl', 'tr', 'bl', 'br')
					 */
					start: function ( event, pageObject, corner ) {
						// Работает молча, без логов в продакшене
					},

					/**
					 * Достигнута первая страница.
					 */
					first: function () {
						// Можно добавить визуальный эффект
					},

					/**
					 * Достигнута последняя страница.
					 */
					last: function () {
						// Можно добавить визуальный эффект
					}
				}
			} );

			// Отмечаем что книга готова
			bookInitialized = true;
			console.log( '✅ Книга готова! Листайте страницы.' );

		} catch ( error ) {
			// Если Turn.js упал с ошибкой — включаем резервный режим
			console.error( '❌ Ошибка инициализации Turn.js:', error );
			fallbackMode();
		}

		// ── Обработчик изменения размера окна ──────────────────
		// Используем debounce (задержку) чтобы не дёргать Turn.js 
		// на каждое движение мыши при ресайзе
		var resizeTimeout;

		window.addEventListener( 'resize', function () {
			// Сбрасываем предыдущий таймер
			clearTimeout( resizeTimeout );

			// Запускаем новый таймер на 250мс
			resizeTimeout = setTimeout( function () {
				// Книга могла быть уничтожена к этому моменту
				if ( !bookInitialized ) {
					return;
				}

				// Пересчитываем размеры
				var newSize = calculateBookSize();

				// Обновляем CSS контейнера
				$book.css( {
					width: newSize.width + 'px',
					height: newSize.height + 'px'
				} );

				// Обновляем Turn.js (без пересоздания)
				$book.turn( 'size', newSize.width, newSize.height );
				$book.turn( 'display', newSize.display );

				console.log( '🔄 Книга обновлена:', newSize.width + '×' + newSize.height );
			}, 250 );
		} );
	}

	// ============================================================
	// 7. РЕЗЕРВНЫЙ РЕЖИМ (БЕЗ TURN.JS)
	// ============================================================

	/**
	 * Упрощённый режим отображения — если Turn.js не загрузился.
	 * 
	 * Вместо эффекта перелистывания страницы показываются
	 * вертикальным списком с прокруткой.
	 * Это гарантирует что пользователь увидит фото даже при ошибках.
	 */
	function fallbackMode() {
		console.warn( '⚠️ Включён упрощённый режим (без эффекта перелистывания)' );

		// Меняем layout контейнера на вертикальный список
		flipbook.style.display = 'flex';
		flipbook.style.flexDirection = 'column';
		flipbook.style.gap = '12px';
		flipbook.style.overflowY = 'auto';
		flipbook.style.overflowX = 'hidden';
		flipbook.style.padding = '8px';
		flipbook.style.maxHeight = '75vh';
		flipbook.style.width = '100%';
		flipbook.style.maxWidth = '600px';
		flipbook.style.margin = '0 auto';

		// Стилизуем каждую страницу как отдельную карточку
		var pages = flipbook.querySelectorAll( '.page' );
		pages.forEach( function ( page, index ) {
			var isLast = ( index === pages.length - 1 );

			page.style.width = '100%';
			page.style.height = 'auto';
			page.style.aspectRatio = '3 / 4';
			page.style.borderRadius = '8px';
			page.style.overflow = 'hidden';
			page.style.border = '1px solid rgba(255, 255, 255, 0.1)';
			page.style.marginBottom = isLast ? '0' : '8px';
		} );

		// Обновляем счётчики
		if ( totalPagesEl ) {
			totalPagesEl.textContent = pages.length;
		}
		if ( currentPageEl ) {
			currentPageEl.textContent = '—';
		}

		// Скрываем загрузчик
		hideLoader();
	}

	// ============================================================
	// 8. СВЕТЛЯЧКИ
	// ============================================================

	/**
	 * Создаём и анимируем светящиеся точки (светлячков).
	 * 
	 * Каждый светлячок — это div с радиальным градиентом и свечением.
	 * Используем CSS-анимации для производительности (GPU).
	 * Светлячки обновляются каждые 9 секунд — меняют позиции.
	 */

	// Добавляем ключевые кадры анимации мерцания
	var fireflyStyle = document.createElement( 'style' );
	fireflyStyle.textContent = '' +
		'@keyframes fireflyFloat {' +
		'0%, 100% {' +
		'opacity: 0.1;' +
		'transform: translate(0, 0) scale(0.7);' +
		'}' +
		'25% {' +
		'opacity: 0.8;' +
		'transform: translate(10px, -15px) scale(1.5);' +
		'}' +
		'50% {' +
		'opacity: 0.2;' +
		'transform: translate(-6px, -6px) scale(0.5);' +
		'}' +
		'75% {' +
		'opacity: 0.9;' +
		'transform: translate(-12px, -20px) scale(1.7);' +
		'}' +
		'}';
	document.head.appendChild( fireflyStyle );

	/**
	 * Фабрика светлячков.
	 * Создаёт DOM-элемент со случайными параметрами.
	 * 
	 * @returns {HTMLElement} Готовый светлячок
	 */
	function createFirefly() {
		var firefly = document.createElement( 'div' );

		// Случайные параметры для разнообразия
		var size = Math.random() * 3 + 1.5;     // Размер: 1.5–4.5px
		var startX = Math.random() * 90;          // Позиция X: 0–90%
		var startY = Math.random() * 85;          // Позиция Y: 0–85%
		var duration = Math.random() * 5 + 3;        // Длительность цикла: 3–8с
		var delay = Math.random() * 4;            // Задержка старта: 0–4с

		// Тёплый янтарный цвет (как настоящие светлячки)
		var glowColor = 'rgba(255, 220, 160, 0.9)';
		var outerGlow = 'rgba(255, 180, 100, 0.5)';

		firefly.style.cssText = '' +
			'position: absolute;' +
			'top: ' + startY + '%;' +
			'left: ' + startX + '%;' +
			'width: ' + size + 'px;' +
			'height: ' + size + 'px;' +
			'background: radial-gradient(circle at center, ' + glowColor + ' 0%, ' + outerGlow + ' 35%, transparent 70%);' +
			'border-radius: 50%;' +
			'box-shadow: 0 0 ' + ( size * 3 ) + 'px rgba(255, 180, 100, 0.5), 0 0 ' + ( size * 7 ) + 'px rgba(255, 150, 60, 0.2);' +
			'animation: fireflyFloat ' + duration + 's ' + delay + 's ease-in-out infinite;' +
			'pointer-events: none;' +
			'z-index: 0;' +
			'will-change: transform, opacity;';

		return firefly;
	}

	// Создаём первых светлячков
	var FIREFLY_COUNT = 6;
	for ( var i = 0; i < FIREFLY_COUNT; i++ ) {
		firefliesContainer.appendChild( createFirefly() );
	}

	// Обновляем светлячков каждые 9 секунд
	setInterval( function () {
		// Удаляем старых
		var oldFireflies = firefliesContainer.querySelectorAll( 'div' );
		oldFireflies.forEach( function ( f ) {
			f.remove();
		} );

		// Создаём новых на новых позициях
		for ( var j = 0; j < FIREFLY_COUNT; j++ ) {
			firefliesContainer.appendChild( createFirefly() );
		}
	}, 9000 );

	// ============================================================
	// 9. ЗАГРУЗКА ИЗОБРАЖЕНИЙ
	// ============================================================

	/**
	 * Скрывает индикатор загрузки и показывает книгу.
	 * Вызывается когда все фото загружены.
	 */
	function hideLoader() {
		if ( loader ) {
			// Плавно скрываем
			loader.classList.add( 'hidden' );

			// Удаляем из DOM через 500мс (после завершения анимации)
			setTimeout( function () {
				if ( loader && loader.parentNode ) {
					loader.remove();
				}
			}, 500 );
		}

		// Показываем книгу
		if ( bookContainer ) {
			bookContainer.classList.add( 'visible' );
		}
	}

	/**
	 * Ожидает загрузки всех изображений в книге.
	 * 
	 * Для каждого <img> на странице:
	 * - Если уже загружено (из кеша) — сразу считаем
	 * - Если нет — вешаем обработчики load и error
	 * 
	 * Когда все фото готовы:
	 * - Скрываем загрузчик
	 * - Запускаем инициализацию книги
	 */
	function waitForImages() {
		var images = flipbook.querySelectorAll( 'img' );
		console.log( '🖼️ Фото для загрузки:', images.length );

		// Если фото нет — запускаем книгу сразу
		if ( images.length === 0 ) {
			console.log( '  Нет фото — инициализируем книгу сразу' );
			hideLoader();
			initBook();
			return;
		}

		var loaded = 0;
		var total = images.length;

		/**
		 * Вызывается при загрузке каждого фото.
		 * Когда все загружены — запускает книгу.
		 */
		function onImageLoad() {
			loaded = loaded + 1;
			console.log( '  Загружено: ' + loaded + '/' + total );

			if ( loaded >= total ) {
				console.log( '✅ Все фото загружены' );

				// Небольшая задержка чтобы браузер отрисовал фото
				setTimeout( function () {
					hideLoader();
					initBook();
				}, 200 );
			}
		}

		// Проверяем каждое изображение
		images.forEach( function ( img ) {
			if ( img.complete && img.naturalWidth > 0 ) {
				// Уже загружено (из кеша браузера)
				onImageLoad();
			} else {
				// Ждём загрузки
				img.addEventListener( 'load', onImageLoad );

				// На случай ошибки загрузки — всё равно продолжаем
				img.addEventListener( 'error', function () {
					console.warn( '⚠️ Ошибка загрузки:', img.src );
					onImageLoad();
				} );
			}
		} );
	}

	// ============================================================
	// 10. ЗАПУСК ПРИЛОЖЕНИЯ
	// ============================================================

	/**
	 * Главная функция инициализации.
	 * Запускает весь процесс: загрузка фото -> книга -> светлячки.
	 */
	function init() {
		console.log( '📖 Инициализация раздела...' );
		console.log( '  Заголовок:', document.title );
		console.log( '  Размер экрана:', window.innerWidth + '×' + window.innerHeight );
		console.log( '  Мобильный:', ( window.innerWidth < 768 ) );

		// Начинаем с загрузки изображений
		waitForImages();
	}

	/**
	 * Безопасный запуск с учётом готовности DOM.
	 * 
	 * Если DOM ещё загружается — ждём события DOMContentLoaded.
	 * Если DOM уже готов — запускаем с небольшой задержкой,
	 * чтобы все скрипты (jQuery, Turn.js) успели выполниться.
	 */
	if ( document.readyState === 'loading' ) {
		// DOM ещё не готов — ждём
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		// DOM готов, но скрипты могли не успеть
		// Небольшая задержка для надёжности
		setTimeout( init, 100 );
	}

} )();  // Конец IIFE