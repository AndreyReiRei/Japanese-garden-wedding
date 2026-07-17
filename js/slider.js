/**
 * ============================================================
 * slider.js — Полноэкранный слайдер на Swiper
 * ============================================================
 * 
 * НАЗНАЧЕНИЕ:
 *   Открывает фото в полноэкранном режиме с возможностью
 *   перелистывания, зума (двойной тап / пинч) и перетаскивания.
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   openSlider({
 *       photos: [{ src: '...', alt: '...' }, ...],
 *       startIndex: 0,
 *       theme: 'garden'
 *   });
 * 
 * ЗАВИСИМОСТИ:
 *   - Swiper 11 (CDN: swiper-bundle.min.js)
 *   - slider.css
 * 
 * СОДЕРЖАНИЕ:
 *   1.  Глобальная переменная swiperInstance
 *   2.  Функция openSlider(config)
 *   3.  Защита от дублирования
 *   4.  Построение HTML
 *   5.  Анимация появления
 *   6.  Состояние зума (переменные)
 *   7.  Функции зума
 *   8.  Инициализация Swiper
 *   9.  Обновление счётчика
 *   10. Обработчики зума (двойной тап, кнопки)
 *   11. Пинч (два пальца)
 *   12. Перетаскивание увеличенного фото (мышь + тач)
 *   13. Закрытие слайдера
 *   14. Запуск
 * ============================================================
 */

// ============================================================
// 1. ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
// Хранит единственный экземпляр Swiper
// ============================================================
let swiperInstance = null;

// ============================================================
// 2. ФУНКЦИЯ openSlider(config)
// Главная точка входа — создаёт и открывает слайдер
// ============================================================
function openSlider( config ) {
	'use strict';

	// Деструктуризация с значениями по умолчанию
	const {
		photos,
		startIndex = 0,
		theme = 'garden'
	} = config;

	// ============================================================
	// 3. ЗАЩИТА ОТ ДУБЛИРОВАНИЯ
	// Если слайдер уже открыт — не создаём второй
	// ============================================================
	if ( document.querySelector( '.slider-overlay' ) ) {
		console.warn( 'Слайдер уже открыт' );
		return;
	}

	// Проверка входных данных
	if ( !photos || !photos.length ) {
		console.error( 'openSlider: массив photos пуст или не передан' );
		return;
	}

	// ============================================================
	// 4. ПОСТРОЕНИЕ HTML
	// Создаём всю структуру слайдера в памяти
	// ============================================================

	// 4.1. Контейнер-оверлей (фон)
	const overlay = document.createElement( 'div' );
	overlay.className = 'slider-overlay';
	overlay.setAttribute( 'data-theme', theme );

	// 4.2. HTML-строка слайдов
	const slidesHTML = photos.map( ( photo, i ) => `
        <div class="swiper-slide">
            <div class="image-wrapper" data-zoom-wrapper>
                <img 
                    src="${photo.src}" 
                    alt="${photo.alt || ''}" 
                    data-swiper-parallax-x="30%" 
                    data-zoom-img
                    data-index="${i}"
                    loading="lazy"
                    draggable="false"
                >
            </div>
            ${photo.alt ? `<p class="slide-caption">${photo.alt}</p>` : ''}
        </div>
    ` ).join( '' );

	// 4.3. Полный HTML оверлея
	overlay.innerHTML = `
        <!-- Кнопка закрытия -->
        <button class="slider-close" id="sliderClose" aria-label="Закрыть">✕</button>
        
        <!-- Контейнер Swiper -->
        <div class="slider-container">
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${slidesHTML}
                </div>
                
                <!-- Пагинация (точки) -->
                <div class="swiper-pagination"></div>
                
                <!-- Стрелки навигации -->
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        </div>
        
        <!-- Счётчик фото -->
        <span class="slider-counter" id="sliderCounter">
            ${startIndex + 1} / ${photos.length}
        </span>
        
        <!-- Кнопки зума -->
        <div class="slider-zoom-controls" id="sliderZoomControls">
            <button class="zoom-btn zoom-out" id="zoomOut" aria-label="Уменьшить">−</button>
            <span class="zoom-level" id="zoomLevel">1×</span>
            <button class="zoom-btn zoom-in" id="zoomIn" aria-label="Увеличить">+</button>
        </div>
        
        <!-- Подсказка о зуме -->
        <span class="slider-zoom-hint" id="sliderZoomHint">
            Двойной тап — увеличить
        </span>
    `;

	// 4.4. Добавляем в DOM
	document.body.appendChild( overlay );

	// 4.5. Блокируем скролл страницы пока слайдер открыт
	document.body.style.overflow = 'hidden';

	// ============================================================
	// 5. АНИМАЦИЯ ПОЯВЛЕНИЯ
	// Добавляем класс .open после отрисовки кадра
	// ============================================================
	requestAnimationFrame( () => {
		overlay.classList.add( 'open' );
	} );

	// ============================================================
	// 6. СОСТОЯНИЕ ЗУМА
	// Все переменные для отслеживания зума/пинча/перетаскивания
	// ВАЖНО: объявляем ДО функций и ДО Swiper
	// ============================================================

	const zoomState = {
		active: false,          // Активен ли зум
		img: null,              // DOM-элемент изображения
		wrapper: null,          // DOM-элемент обёртки
		scale: 1,               // Целевой масштаб
		currentScale: 1,        // Текущий масштаб
		translateX: 0,          // Смещение по X
		translateY: 0,          // Смещение по Y
		startDistance: 0,       // Начальное расстояние между пальцами
		startScale: 1,          // Масштаб на момент начала пинча
		startTranslateX: 0,     // Смещение X на момент начала пинча
		startTranslateY: 0,     // Смещение Y на момент начала пинча
		lastTapTime: 0,         // Время последнего тапа (для двойного)
		animFrameId: null,      // ID requestAnimationFrame для плавности
	};

	// Состояние перетаскивания
	const dragState = {
		active: false,
		startX: 0,
		startY: 0,
		startTranslateX: 0,
		startTranslateY: 0,
		isTouch: false,
	};

	// Константы зума
	const MAX_SCALE = 4;              // Максимальное увеличение
	const MIN_SCALE = 1;              // Минимальное (нормальный размер)
	const DOUBLE_TAP_DELAY = 300;     // Миллисекунды между тапами
	const ZOOM_STEP = 0.5;            // Шаг зума кнопками +/−
	const ZOOM_ANIM_DURATION = 300;   // Длительность анимации зума в мс

	// ============================================================
	// 7. ФУНКЦИИ ЗУМА
	// ВАЖНО: объявляем ДО Swiper, который их вызывает в on.slideChange
	// ============================================================

	/**
	 * 7.1. Обновляет подсказку, уровень зума и видимость кнопок.
	 */
	function updateZoomUI() {
		const hint = document.getElementById( 'sliderZoomHint' );
		const zoomLevel = document.getElementById( 'zoomLevel' );
		const zoomControls = document.getElementById( 'sliderZoomControls' );

		// Подсказка
		if ( hint ) {
			if ( zoomState.active ) {
				hint.textContent = 'Двойной тап — уменьшить';
				hint.classList.add( 'visible' );
			} else {
				hint.textContent = 'Двойной тап — увеличить';
				hint.classList.add( 'visible' );
				clearTimeout( hint._timeout );
				hint._timeout = setTimeout( () => {
					hint.classList.remove( 'visible' );
				}, 3000 );
			}
		}

		// Уровень зума
		if ( zoomLevel ) {
			zoomLevel.textContent = `${Math.round( zoomState.currentScale * 10 ) / 10}×`;
		}

		// Показываем/скрываем кнопки
		if ( zoomControls ) {
			zoomControls.classList.toggle( 'visible', zoomState.active );
		}
	}

	/**
	 * 7.2. Блокирует или разблокирует Swiper.
	 * При активном зуме — Swiper нельзя перелистывать.
	 */
	function setSwiperLocked( locked ) {
		if ( !swiperInstance ) return;

		if ( locked ) {
			swiperInstance.allowTouchMove = false;
			swiperInstance.allowSlideNext = false;
			swiperInstance.allowSlidePrev = false;
			swiperInstance.mousewheel?.disable();
		} else {
			swiperInstance.allowTouchMove = true;
			swiperInstance.allowSlideNext = true;
			swiperInstance.allowSlidePrev = true;
			swiperInstance.mousewheel?.enable();
		}
	}

	/**
	 * 7.3. Сбрасывает зум для всех слайдов.
	 * 
	 * Вызывается при:
	 * - смене слайда
	 * - закрытии слайдера
	 * - уменьшении масштаба до 1×
	 * 
	 * Сбрасывает ВСЁ:
	 * - трансформации изображений
	 * - overflow у обёрток и слайдов
	 * - CSS-классы .zoomed и .zoomed-slide
	 * - состояние zoomState и dragState
	 * - блокировку Swiper
	 * - интерфейс (подсказка, кнопки)
	 */
	function resetAllZooms() {
		// --- 1. Отменяем текущую анимацию зума ---
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}

		// --- 2. Сбрасываем все изображения ---
		const allImages = overlay.querySelectorAll( '[data-zoom-img]' );
		allImages.forEach( img => {
			// Убираем инлайновые стили
			img.style.transition = '';
			img.style.transform = '';
			img.style.cursor = '';
			// Убираем класс зума
			img.classList.remove( 'zoomed' );
		} );

		// --- 3. Сбрасываем все обёртки ---
		const allWrappers = overlay.querySelectorAll( '[data-zoom-wrapper]' );
		allWrappers.forEach( wrapper => {
			// Убираем инлайновый overflow (возвращаем к CSS-значению hidden)
			wrapper.style.overflow = '';
			// Убираем класс зума
			wrapper.classList.remove( 'zoomed' );
		} );

		// --- 4. Сбрасываем все слайды ---
		// Это важно: при зуме слайд получал overflow: visible,
		// чтобы увеличенное изображение не обрезалось.
		// Теперь возвращаем обратно.
		const allSlides = overlay.querySelectorAll( '.swiper-slide' );
		allSlides.forEach( slide => {
			// Убираем инлайновый overflow (возвращаем к CSS-значению hidden)
			slide.style.overflow = '';
			// Убираем класс, который делал слайд видимым поверх других
			slide.classList.remove( 'zoomed-slide' );
		} );

		// --- 5. Сбрасываем состояние зума ---
		zoomState.active = false;
		zoomState.img = null;
		zoomState.wrapper = null;
		zoomState.scale = 1;
		zoomState.currentScale = 1;
		zoomState.translateX = 0;
		zoomState.translateY = 0;
		zoomState.startDistance = 0;
		zoomState.startScale = 1;
		zoomState.startTranslateX = 0;
		zoomState.startTranslateY = 0;

		// --- 6. Сбрасываем состояние перетаскивания ---
		dragState.active = false;
		dragState.startX = 0;
		dragState.startY = 0;
		dragState.startTranslateX = 0;
		dragState.startTranslateY = 0;
		dragState.isTouch = false;

		// --- 7. Разблокируем Swiper ---
		// При зуме Swiper был заблокирован, чтобы не перелистывать слайды.
		// Теперь возвращаем возможность перелистывания.
		setSwiperLocked( false );

		// --- 8. Обновляем интерфейс ---
		// Скрываем кнопки +/−, обновляем подсказку и уровень зума
		updateZoomUI();

		console.log( '🔄 Зум сброшен для всех слайдов' );
	}

	/**
	 * 7.4. Плавно устанавливает зум через scale.
	 * 
	 * Принцип:
	 * - Изображение ВСЕГДА object-fit: contain
	 * - Увеличение = transform: scale() на img
	 * - Слайд получает overflow: visible + z-index: 100
	 * - Псевдоэлемент слайда затемняет фон
	 * - Swiper получает класс для скрытия стрелок и пагинации
	 * - Подпись и затемнение скрываются
	 * - Фильтры (grayscale, brightness) убираются
	 * 
	 * @param {HTMLElement} img - Изображение
	 * @param {HTMLElement} wrapper - Обёртка изображения
	 * @param {number} targetScale - Целевой масштаб (1–4)
	 * @param {number} [targetX=0] - Целевое смещение X
	 * @param {number} [targetY=0] - Целевое смещение Y
	 * @param {boolean} [animate=true] - Плавная анимация или мгновенно
	 */
	function setZoom( img, wrapper, targetScale, targetX = 0, targetY = 0, animate = true ) {

		// --- 1. Отменяем предыдущую анимацию ---
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}

		// --- 2. Вычисляем целевой масштаб ---
		const clampedScale = Math.max( MIN_SCALE, Math.min( MAX_SCALE, targetScale ) );
		const willBeActive = clampedScale > MIN_SCALE;

		// --- 3. Находим родительские элементы ---
		const slide = wrapper ? wrapper.closest( '.swiper-slide' ) : null;

		// --- 4. Обновляем состояние ---
		zoomState.img = img;
		zoomState.wrapper = wrapper;
		zoomState.scale = clampedScale;
		zoomState.translateX = targetX;
		zoomState.translateY = targetY;

		/**
		 * 4.1. Применяет трансформацию и обновляет все классы.
		 * Вызывается на каждом кадре анимации или мгновенно.
		 * 
		 * @param {number} scale - Текущий масштаб
		 * @param {number} tx - Смещение по X
		 * @param {number} ty - Смещение по Y
		 */
		function applyTransform( scale, tx, ty ) {
			if ( !img ) return;

			// --- Изображение ---
			img.style.transform = `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px)`;
			img.style.cursor = scale > MIN_SCALE ? 'grab' : '';
			img.classList.toggle( 'zoomed', scale > MIN_SCALE );

			// --- Обёртка ---
			if ( wrapper ) {
				wrapper.classList.toggle( 'zoomed', scale > MIN_SCALE );
				wrapper.style.overflow = scale > MIN_SCALE ? 'visible' : 'hidden';
			}

			// --- Слайд ---
			if ( slide ) {
				slide.classList.toggle( 'zoomed-slide', scale > MIN_SCALE );
				slide.style.overflow = scale > MIN_SCALE ? 'visible' : 'hidden';
			}

			// --- Swiper-контейнер: скрываем стрелки и пагинацию ---
			if ( swiperEl ) {
				swiperEl.classList.toggle( 'swiper-has-zoomed-slide', scale > MIN_SCALE );
			}

			// --- Сохраняем текущий масштаб ---
			zoomState.currentScale = scale;
		}

		// --- 5. Анимация или мгновенное применение ---

		if ( animate && Math.abs( zoomState.currentScale - clampedScale ) > 0.01 ) {

			// === ПЛАВНАЯ АНИМАЦИЯ ===

			const startScale = zoomState.currentScale;
			const startX = zoomState.translateX;
			const startY = zoomState.translateY;
			const startTime = performance.now();

			// Отключаем CSS-переходы на время JS-анимации
			img.style.transition = 'none';

			/**
			 * Один шаг анимации.
			 * Вызывается рекурсивно через requestAnimationFrame.
			 * 
			 * @param {number} now - Время вызова (от performance.now)
			 */
			function animateZoom( now ) {
				const elapsed = now - startTime;
				const progress = Math.min( elapsed / ZOOM_ANIM_DURATION, 1 );

				// Ease-out кривая (кубическая)
				const eased = 1 - Math.pow( 1 - progress, 3 );

				// Промежуточные значения
				const currentScale = startScale + ( clampedScale - startScale ) * eased;
				const currentX = startX + ( targetX - startX ) * eased;
				const currentY = startY + ( targetY - startY ) * eased;

				// Применяем
				applyTransform( currentScale, currentX, currentY );

				// Продолжаем или заканчиваем
				if ( progress < 1 ) {
					zoomState.animFrameId = requestAnimationFrame( animateZoom );
				} else {
					// --- Финальное состояние ---
					applyTransform( clampedScale, targetX, targetY );
					zoomState.animFrameId = null;
					zoomState.active = willBeActive;

					// Блокируем или разблокируем Swiper
					setSwiperLocked( willBeActive );

					// Обновляем интерфейс (подсказка, кнопки +/−, уровень зума)
					updateZoomUI();
				}
			}

			// Запускаем анимацию
			zoomState.animFrameId = requestAnimationFrame( animateZoom );

		} else {

			// === МГНОВЕННОЕ ПРИМЕНЕНИЕ ===
			// Используется для: пинча, перетаскивания, сброса зума

			img.style.transition = 'none';
			applyTransform( clampedScale, targetX, targetY );
			zoomState.active = willBeActive;

			// Блокируем или разблокируем Swiper
			setSwiperLocked( willBeActive );

			// Обновляем интерфейс
			updateZoomUI();
		}
	}

	// ============================================================
	// 8. ИНИЦИАЛИЗАЦИЯ SWIPER
	// Все функции зума уже объявлены — можно безопасно использовать
	// ============================================================

	const swiperEl = overlay.querySelector( '.swiper' );

	/**
	 * СТРАТЕГИЯ ЦЕНТРИРОВАНИЯ:
	 * 
	 * Проблема: Swiper инициализируется и показывает слайды до того,
	 * как изображения загружены и их размеры известны.
	 * → Соседние слайды неправильно центрированы.
	 * 
	 * Решение:
	 * 1. Скрываем swiper через visibility: hidden
	 * 2. Инициализируем Swiper
	 * 3. Ждём загрузки ВСЕХ изображений
	 * 4. Делаем несколько принудительных обновлений
	 * 5. Переходим к стартовому слайду
	 * 6. Показываем swiper через visibility: visible
	 */

	// Шаг 1: скрываем swiper до готовности
	swiperEl.style.visibility = 'hidden';
	swiperEl.style.opacity = '0';
	swiperEl.style.transition = 'opacity 0.3s ease';

	swiperInstance = new Swiper( swiperEl, {
		grabCursor: true,
		slidesPerView: 1.5,
		centeredSlides: true,
		initialSlide: startIndex,
		speed: 900,
		parallax: true,
		spaceBetween: 40,
		watchSlidesProgress: true,
		preventClicks: false,
		preventClicksPropagation: false,

		// Навигация
		navigation: {
			nextEl: overlay.querySelector( '.swiper-button-next' ),
			prevEl: overlay.querySelector( '.swiper-button-prev' ),
		},

		// Пагинация
		pagination: {
			el: overlay.querySelector( '.swiper-pagination' ),
			clickable: true,
		},

		// Колёсико мыши
		mousewheel: {
			thresholdDelta: 50,
			sensitivity: 1,
		},

		// Клавиатура
		keyboard: {
			enabled: true,
			onlyInViewport: true,
		},

		// Адаптивность
		breakpoints: {
			320: { slidesPerView: 1.1, spaceBetween: 12 },
			481: { slidesPerView: 1.2, spaceBetween: 20 },
			769: { slidesPerView: 1.4, spaceBetween: 30 },
			993: { slidesPerView: 1.5, spaceBetween: 40 },
		},

		// События
		on: {
			// При смене слайда — сбрасываем зум и обновляем счётчик
			slideChange: function () {
				resetAllZooms();
				updateCounter( this.activeIndex, photos.length );
			},
			// При начале перехода — тоже сбрасываем зум
			slideChangeTransitionStart: function () {
				resetAllZooms();
			},
		},
	} );

	/**
	 * Принудительно обновляет Swiper и переходит к стартовому слайду.
	 */
	function refreshSwiper() {
		if ( !swiperInstance || swiperInstance.destroyed ) return;
		swiperInstance.updateSize();
		swiperInstance.updateSlides();
		swiperInstance.update();
		swiperInstance.slideTo( startIndex, 0 );
	}

	/**
	 * Показывает swiper после полной готовности.
	 */
	function showSwiper() {
		if ( !swiperEl ) return;
		swiperEl.style.visibility = 'visible';
		swiperEl.style.opacity = '1';
		console.log( '📸 Слайдер показан — позиции скорректированы' );
	}

	/**
	 * Отслеживание загрузки всех изображений.
	 * Когда все готовы — обновляем Swiper и показываем его.
	 */
	const allSliderImages = overlay.querySelectorAll( '[data-zoom-img]' );
	const totalImages = allSliderImages.length;
	let loadedCount = 0;
	let isReady = false;

	function onImageReady() {
		loadedCount++;
		if ( loadedCount >= totalImages && !isReady ) {
			isReady = true;

			// Даём браузеру время на пересчёт layout
			requestAnimationFrame( () => {
				// Тройное обновление для надёжности
				refreshSwiper();

				requestAnimationFrame( () => {
					refreshSwiper();

					requestAnimationFrame( () => {
						refreshSwiper();
						showSwiper();
					} );
				} );
			} );
		}
	}

	allSliderImages.forEach( img => {
		if ( img.complete && img.naturalWidth > 0 ) {
			// Уже загружено (из кеша)
			onImageReady();
		} else {
			// Ждём загрузки
			img.addEventListener( 'load', onImageReady, { once: true } );
			img.addEventListener( 'error', onImageReady, { once: true } );
		}
	} );

	// Запасной вариант: если что-то пошло не так —
	// показываем слайдер принудительно через 1.5 секунды
	setTimeout( () => {
		if ( !isReady ) {
			isReady = true;
			refreshSwiper();
			showSwiper();
			console.warn( '📸 Таймаут загрузки — слайдер показан принудительно' );
		}
	}, 1500 );

	// ============================================================
	// 9. ОБНОВЛЕНИЕ СЧЁТЧИКА
	// ============================================================

	/**
	 * Обновляет текст счётчика «3 / 12».
	 */
	function updateCounter( index, total ) {
		const counter = document.getElementById( 'sliderCounter' );
		if ( counter ) {
			counter.textContent = `${index + 1} / ${total}`;
		}
	}

	// ============================================================
	// 10. ОБРАБОТЧИКИ ЗУМА — ДВОЙНОЙ ТАП И КНОПКИ
	// ============================================================

	/**
	 * 10.1. Двойной тап для переключения зума.
	 * 
	 * Как это работает:
	 * - Для ДЕСКТОПА: используем событие click (мышь, тачпад).
	 * - Для МОБИЛЬНЫХ: используем событие touchend (быстрее, без задержки 300мс).
	 * - Swiper не блокирует touchend на слайдах.
	 * - Отслеживаем время между двумя последовательными касаниями.
	 *   Если разница меньше DOUBLE_TAP_DELAY (300мс) — это двойной тап.
	 * - Проверяем что касания были в одном месте (смещение не больше MAX_TAP_DISTANCE),
	 *   чтобы отличить двойной тап от двух быстрых свайпов.
	 * - При двойном тапе: увеличиваем фото с центром в точке тапа,
	 *   либо сбрасываем зум если фото уже увеличено.
	 */

	// Координаты последнего тапа для проверки что тапы в одном месте
	let lastTapX = 0;
	let lastTapY = 0;
	const MAX_TAP_DISTANCE = 20; // Максимальное расстояние между тапами в пикселях

	/**
	 * Универсальный обработчик тапа.
	 * Вызывается из click (десктоп) и touchend (мобильные).
	 * 
	 * @param {number} clientX - X-координата тапа
	 * @param {number} clientY - Y-координата тапа
	 * @param {Event} originalEvent - Исходное событие для preventDefault
	 */
	function handleTap( clientX, clientY, originalEvent ) {
		// Находим элемент под точкой тапа
		const elementAtPoint = document.elementFromPoint( clientX, clientY );
		if ( !elementAtPoint ) return;

		// Проверяем что тап был по изображению (или его потомку)
		const zoomImg = elementAtPoint.closest( '[data-zoom-img]' );
		if ( !zoomImg ) {
			// Тап мимо фото — сбрасываем таймер двойного тапа
			zoomState.lastTapTime = 0;
			return;
		}

		const now = Date.now();
		const timeSinceLastTap = now - zoomState.lastTapTime;

		// Вычисляем расстояние между текущим и предыдущим тапом
		const tapDistance = Math.sqrt(
			Math.pow( clientX - lastTapX, 2 ) +
			Math.pow( clientY - lastTapY, 2 )
		);

		// Проверяем условия двойного тапа:
		// 1. Прошло меньше DOUBLE_TAP_DELAY с прошлого тапа
		// 2. Это не первый тап вообще (timeSinceLastTap > 0)
		// 3. Тапы были в одном месте (расстояние < MAX_TAP_DISTANCE)
		if (
			timeSinceLastTap < DOUBLE_TAP_DELAY &&
			timeSinceLastTap > 0 &&
			tapDistance < MAX_TAP_DISTANCE
		) {
			// ЭТО ДВОЙНОЙ ТАП — выполняем зум

			// Предотвращаем стандартное поведение и всплытие
			if ( originalEvent && originalEvent.preventDefault ) {
				originalEvent.preventDefault();
			}
			if ( originalEvent && originalEvent.stopPropagation ) {
				originalEvent.stopPropagation();
			}

			// Находим обёртку изображения
			const wrapper = zoomImg.closest( '[data-zoom-wrapper]' );
			if ( !wrapper ) return;

			// Координаты тапа относительно изображения
			const rect = zoomImg.getBoundingClientRect();
			const tapX = clientX - rect.left;
			const tapY = clientY - rect.top;
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;

			if ( zoomState.active && zoomState.img === zoomImg ) {
				// Фото уже увеличено — плавно сбрасываем зум до 1×
				setZoom( zoomImg, wrapper, MIN_SCALE, 0, 0, true );
			} else {
				// Фото ещё не увеличено — увеличиваем до 2.5×
				// Центрируем увеличение на точке тапа
				const targetScale = 2.5;
				const offsetX = ( centerX - tapX ) * ( targetScale - 1 );
				const offsetY = ( centerY - tapY ) * ( targetScale - 1 );

				// Сбрасываем предыдущий зум если был на другом слайде
				resetAllZooms();

				// Запускаем плавное увеличение
				setZoom( zoomImg, wrapper, targetScale, offsetX, offsetY, true );
			}

			// Сбрасываем таймер после двойного тапа
			zoomState.lastTapTime = 0;

			// Тактильный отклик на телефоне
			if ( window.navigator?.vibrate ) {
				window.navigator.vibrate( 8 );
			}

			console.log( '👆 Двойной тап — зум переключён' );

		} else {
			// Это первый тап — запоминаем время и координаты
			zoomState.lastTapTime = now;
			lastTapX = clientX;
			lastTapY = clientY;
		}
	}

	// --- Десктоп: отслеживаем click (мышь, тачпад) ---
	swiperEl.addEventListener( 'click', function ( e ) {
		// Не обрабатываем если это тач-событие
		// (для тач-устройств работает отдельный обработчик touchend)
		if ( e.pointerType === 'touch' ) return;

		handleTap( e.clientX, e.clientY, e );
	} );

	// --- Мобильные: отслеживаем touchend (быстрее click, нет задержки 300мс) ---
	swiperEl.addEventListener( 'touchend', function ( e ) {
		// Игнорируем если это был пинч (больше одного пальца)
		if ( e.changedTouches.length !== 1 ) return;

		// Игнорируем если Swiper в процессе анимации перелистывания
		if ( swiperInstance && swiperInstance.animating ) return;

		// Игнорируем если только что закончилось перетаскивание увеличенного фото
		if ( dragState.active ) return;

		// Берём координаты первого (и единственного) пальца
		const touch = e.changedTouches[0];
		handleTap( touch.clientX, touch.clientY, e );
	} );

	/**
	 * 10.2. Кнопки зума +/−.
	 * 
	 * Как это работает:
	 * - Кнопки видны только когда фото увеличено (через CSS .visible).
	 * - «+» увеличивает масштаб на ZOOM_STEP (0.5×).
	 * - «−» уменьшает масштаб на ZOOM_STEP (0.5×).
	 * - Если после уменьшения масштаб становится ≤ 1× — полностью сбрасываем зум.
	 * - Каждое нажатие даёт тактильный отклик.
	 * - stopPropagation предотвращает закрытие слайдера при клике на кнопку.
	 */

	const zoomInBtn = overlay.querySelector( '#zoomIn' );
	const zoomOutBtn = overlay.querySelector( '#zoomOut' );

	// Кнопка «+» — увеличить
	zoomInBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation(); // Не закрываем слайдер
		if ( !zoomState.img ) return;

		const newScale = zoomState.currentScale + ZOOM_STEP;
		setZoom(
			zoomState.img,
			zoomState.wrapper,
			newScale,
			zoomState.translateX,
			zoomState.translateY,
			true // Плавная анимация
		);
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	// Кнопка «−» — уменьшить
	zoomOutBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation(); // Не закрываем слайдер
		if ( !zoomState.img ) return;

		const newScale = zoomState.currentScale - ZOOM_STEP;
		if ( newScale <= MIN_SCALE ) {
			// Масштаб стал 1× или меньше — полностью сбрасываем зум
			resetAllZooms();
		} else {
			setZoom(
				zoomState.img,
				zoomState.wrapper,
				newScale,
				zoomState.translateX,
				zoomState.translateY,
				true // Плавная анимация
			);
		}
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	// ============================================================
	// 11. ПИНЧ (ДВА ПАЛЬЦА)
	// ============================================================

	/**
	 * Обработка пинча для плавного зума.
	 * 
	 * Как это работает:
	 * - Отслеживаем касания двух пальцев через touchstart/touchmove/touchend.
	 * - При начале пинча запоминаем расстояние между пальцами (startDistance)
	 *   и текущий масштаб (startScale).
	 * - При движении пальцев вычисляем новый масштаб пропорционально
	 *   изменению расстояния: newScale = startScale * (currentDistance / startDistance).
	 * - Масштаб ограничен значениями MIN_SCALE (1) и MAX_SCALE (4).
	 * - При окончании пинча проверяем: если масштаб < 1.05 — сбрасываем зум.
	 * - Все изменения применяются мгновенно (без анимации) для точного следования за пальцами.
	 * - passive: false нужен для возможности вызвать preventDefault.
	 */

	function handlePinchStart( e ) {
		// Пинч — только когда два пальца на экране
		if ( e.touches.length !== 2 ) return;

		// Проверяем что один из пальцев на изображении
		const img = e.target.closest( '[data-zoom-img]' );
		if ( !img ) return;

		const wrapper = img.closest( '[data-zoom-wrapper]' );

		// Отменяем текущую анимацию зума если она идёт
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}
		// Убираем transition с изображения для мгновенного отклика
		if ( zoomState.img ) {
			zoomState.img.style.transition = 'none';
		}

		// Если зум ещё не активен или активен для другого изображения —
		// инициализируем зум для текущего
		if ( !zoomState.active || zoomState.img !== img ) {
			resetAllZooms();
			zoomState.img = img;
			zoomState.wrapper = wrapper;
			zoomState.currentScale = 1;
			zoomState.translateX = 0;
			zoomState.translateY = 0;
			zoomState.active = true;
			setSwiperLocked( true );
		}

		// Вычисляем и запоминаем начальное расстояние между пальцами
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		zoomState.startDistance = Math.sqrt( dx * dx + dy * dy );
		zoomState.startScale = zoomState.currentScale;
		zoomState.startTranslateX = zoomState.translateX;
		zoomState.startTranslateY = zoomState.translateY;

		e.preventDefault();
	}

	function handlePinchMove( e ) {
		// Продолжаем только если два пальца и зум активен
		if ( e.touches.length !== 2 ) return;
		if ( !zoomState.img || zoomState.startDistance === 0 ) return;

		// Текущее расстояние между пальцами
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		const distance = Math.sqrt( dx * dx + dy * dy );

		// Новый масштаб = начальный масштаб × отношение расстояний
		const ratio = distance / zoomState.startDistance;
		const newScale = zoomState.startScale * ratio;

		// Применяем мгновенно, без анимации
		setZoom(
			zoomState.img,
			zoomState.wrapper,
			newScale,
			zoomState.translateX,
			zoomState.translateY,
			false
		);

		e.preventDefault();
	}

	function handlePinchEnd() {
		if ( !zoomState.img ) return;

		// Если пальцы свели почти до исходного размера — сбрасываем зум
		if ( zoomState.currentScale < 1.05 ) {
			resetAllZooms();
		}

		// Сбрасываем начальное расстояние
		zoomState.startDistance = 0;

		// Обновляем интерфейс (кнопки +/−, подсказка)
		updateZoomUI();
	}

	// Навешиваем обработчики пинча на swiper-контейнер
	swiperEl.addEventListener( 'touchstart', handlePinchStart, { passive: false } );
	swiperEl.addEventListener( 'touchmove', handlePinchMove, { passive: false } );
	swiperEl.addEventListener( 'touchend', handlePinchEnd );
	swiperEl.addEventListener( 'touchcancel', handlePinchEnd );

	// ============================================================
	// 12. ПЕРЕТАСКИВАНИЕ УВЕЛИЧЕННОГО ФОТО
	// ============================================================

	/**
	 * Перетаскивание увеличенного изображения.
	 * 
	 * Как это работает:
	 * - Перетаскивание возможно ТОЛЬКО когда фото увеличено (zoomState.active = true).
	 * - Swiper в этот момент заблокирован через setSwiperLocked(true),
	 *   поэтому перелистывание слайдов не происходит.
	 * - Поддерживается два способа ввода:
	 *   1. Мышь (десктоп): mousedown → mousemove → mouseup
	 *   2. Один палец (мобильный): touchstart → touchmove → touchend
	 * - При начале перетаскивания запоминаем позицию курсора/пальца
	 *   и текущее смещение изображения.
	 * - При движении вычисляем дельту и применяем новое смещение.
	 * - Все изменения применяются мгновенно (без анимации)
	 *   для точного следования за курсором/пальцем.
	 * - Курсор меняется на 'grabbing' при перетаскивании.
	 */

	// Переменные для отслеживания перетаскивания мышью
	// (сам объект dragState объявлен в секции 6)

	/**
	 * Начало перетаскивания.
	 * Вызывается при mousedown (десктоп) или touchstart (мобильный, 1 палец).
	 */
	function handleDragStart( e ) {
		// Только при активном зуме
		if ( !zoomState.active || !zoomState.img ) return;

		// Определяем тип события: тач или мышь
		const isTouch = !!e.touches;

		// Для тача — только один палец (пинч обрабатывается отдельно)
		if ( isTouch && e.touches.length !== 1 ) return;

		// Координаты курсора или пальца
		const clientX = isTouch ? e.touches[0].clientX : e.clientX;
		const clientY = isTouch ? e.touches[0].clientY : e.clientY;

		// Запоминаем начальные позиции
		dragState.active = true;
		dragState.isTouch = isTouch;
		dragState.startX = clientX;
		dragState.startY = clientY;
		dragState.startTranslateX = zoomState.translateX;
		dragState.startTranslateY = zoomState.translateY;

		// Отменяем анимацию зума если она идёт
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}

		// Убираем transition для мгновенного следования
		zoomState.img.style.transition = 'none';
		zoomState.img.style.cursor = 'grabbing';

		// Предотвращаем стандартное поведение браузера
		if ( e.preventDefault ) e.preventDefault();
		if ( e.stopPropagation ) e.stopPropagation();
	}

	/**
	 * Движение при перетаскивании.
	 * Вызывается при mousemove или touchmove.
	 */
	function handleDragMove( e ) {
		// Только если перетаскивание активно
		if ( !dragState.active || !zoomState.img ) return;

		// Координаты в зависимости от типа события
		const clientX = dragState.isTouch ? e.touches[0].clientX : e.clientX;
		const clientY = dragState.isTouch ? e.touches[0].clientY : e.clientY;

		// Вычисляем смещение от начальной точки
		const deltaX = clientX - dragState.startX;
		const deltaY = clientY - dragState.startY;

		// Применяем новое смещение мгновенно
		setZoom(
			zoomState.img,
			zoomState.wrapper,
			zoomState.currentScale,
			dragState.startTranslateX + deltaX,
			dragState.startTranslateY + deltaY,
			false
		);
	}

	/**
	 * Окончание перетаскивания.
	 * Вызывается при mouseup или touchend.
	 */
	function handleDragEnd() {
		if ( !dragState.active ) return;

		// Сбрасываем флаг перетаскивания
		dragState.active = false;

		// Возвращаем курсор grab (готов к следующему перетаскиванию)
		if ( zoomState.img ) {
			zoomState.img.style.cursor = 'grab';
		}
	}

	// --- Перетаскивание мышью (десктоп) ---

	swiperEl.addEventListener( 'mousedown', function ( e ) {
		// Начинаем перетаскивание только если кликнули по увеличенному изображению
		if ( zoomState.active && e.target.closest( '[data-zoom-img]' ) ) {
			handleDragStart( e );
		}
	} );

	// mousemove и mouseup вешаем на document,
	// чтобы перетаскивание работало даже если курсор вышел за пределы слайдера
	document.addEventListener( 'mousemove', function ( e ) {
		if ( dragState.active && !dragState.isTouch ) {
			handleDragMove( e );
		}
	} );

	document.addEventListener( 'mouseup', function () {
		if ( dragState.active && !dragState.isTouch ) {
			handleDragEnd();
		}
	} );

	// --- Перетаскивание одним пальцем (мобильные) ---

	swiperEl.addEventListener( 'touchstart', function ( e ) {
		// Начинаем перетаскивание только если:
		// - один палец (не пинч)
		// - зум активен
		// - палец на увеличенном изображении
		if ( e.touches.length === 1 && zoomState.active && e.target.closest( '[data-zoom-img]' ) ) {
			handleDragStart( e );
		}
	}, { passive: false } );

	swiperEl.addEventListener( 'touchmove', function ( e ) {
		if ( dragState.active && dragState.isTouch ) {
			handleDragMove( e );
		}
	}, { passive: false } );

	swiperEl.addEventListener( 'touchend', function () {
		if ( dragState.active && dragState.isTouch ) {
			handleDragEnd();
		}
	} );

	// ============================================================
	// 13. ЗАКРЫТИЕ СЛАЙДЕРА
	// ============================================================

	/**
	 * Закрывает слайдер с анимацией и очищает ресурсы.
	 */
	function closeSlider() {
		// Убираем класс, запускаем анимацию исчезновения
		overlay.classList.remove( 'open' );

		// Ждём окончания анимации (400мс), затем удаляем из DOM
		setTimeout( () => {
			if ( swiperInstance ) {
				swiperInstance.destroy( true, true );
				swiperInstance = null;
			}
			resetAllZooms();
			overlay.remove();
			document.body.style.overflow = '';
		}, 400 );

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	}

	// 13.1. Кнопка закрытия (крестик)
	const closeBtn = overlay.querySelector( '#sliderClose' );
	closeBtn.addEventListener( 'click', closeSlider );

	// 13.2. Клик по затемнённому фону (мимо слайда)
	overlay.addEventListener( 'click', function ( e ) {
		if ( e.target === overlay || e.target.classList.contains( 'slider-container' ) ) {
			closeSlider();
		}
	} );

	// 13.3. Клавиша Escape
	function handleEscape( e ) {
		if ( e.key === 'Escape' ) {
			closeSlider();
			document.removeEventListener( 'keydown', handleEscape );
		}
	}
	document.addEventListener( 'keydown', handleEscape );

	// ============================================================
	// 14. ЗАПУСК
	// ============================================================

	// Показываем подсказку о зуме
	updateZoomUI();

	// Тактильный отклик при открытии
	if ( window.navigator?.vibrate ) {
		window.navigator.vibrate( 10 );
	}

	// Логирование
	console.log( `📸 Слайдер открыт: фото ${startIndex + 1} из ${photos.length}` );
	console.log( '💡 Двойной тап — увеличить | Пинч — плавный зум | +/− — кнопки | Drag — двигать' );
}