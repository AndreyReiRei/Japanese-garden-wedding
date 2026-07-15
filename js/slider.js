/**
 * ============================================================
 * slider.js — Полноэкранный слайдер на Swiper
 * ============================================================
 * 
 * НАЗНАЧЕНИЕ:
 *   Открывает фото в полноэкранном режиме с возможностью
 *   перелистывания, зума и перетаскивания увеличенного фото.
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
 *   6.  Состояние зума и константы
 *   7.  Функции управления зумом
 *   8.  Инициализация Swiper
 *   9.  Обновление счётчика
 *   10. Обработчики зума (двойной тап, пинч, кнопки)
 *   11. Перетаскивание увеличенного фото (мышь + тач)
 *   12. Блокировка/разблокировка Swiper
 *   13. Закрытие слайдера
 *   14. Запуск
 * ============================================================
 */

// ============================================================
// 1. ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ
// ============================================================
let swiperInstance = null;

// ============================================================
// 2. ФУНКЦИЯ openSlider(config)
// ============================================================
function openSlider( config ) {
	'use strict';

	const {
		photos,
		startIndex = 0,
		theme = 'garden'
	} = config;

	// ============================================================
	// 3. ЗАЩИТА ОТ ДУБЛИРОВАНИЯ
	// ============================================================
	if ( document.querySelector( '.slider-overlay' ) ) {
		console.warn( 'Слайдер уже открыт' );
		return;
	}

	if ( !photos || !photos.length ) {
		console.error( 'openSlider: массив photos пуст или не передан' );
		return;
	}

	// ============================================================
	// 4. ПОСТРОЕНИЕ HTML
	// ============================================================

	const overlay = document.createElement( 'div' );
	overlay.className = 'slider-overlay';
	overlay.setAttribute( 'data-theme', theme );

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

	overlay.innerHTML = `
        <!-- Кнопка закрытия -->
        <button class="slider-close" id="sliderClose" aria-label="Закрыть">✕</button>
        
        <!-- Контейнер Swiper -->
        <div class="slider-container">
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${slidesHTML}
                </div>
                
                <div class="swiper-pagination"></div>
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

	document.body.appendChild( overlay );

	// ============================================================
	// 5. АНИМАЦИЯ ПОЯВЛЕНИЯ
	// ============================================================
	requestAnimationFrame( () => {
		overlay.classList.add( 'open' );
	} );

	// ============================================================
	// 6. СОСТОЯНИЕ ЗУМА И КОНСТАНТЫ
	// ============================================================

	let zoomState = {
		active: false,
		img: null,
		wrapper: null,
		scale: 1,
		currentScale: 1,
		translateX: 0,
		translateY: 0,
		startDistance: 0,
		startScale: 1,
		startTranslateX: 0,
		startTranslateY: 0,
		lastTapTime: 0,
		animFrameId: null,        // ID requestAnimationFrame для плавности
	};

	let dragState = {
		active: false,
		startX: 0,
		startY: 0,
		startTranslateX: 0,
		startTranslateY: 0,
		isTouch: false,
	};

	const MAX_SCALE = 4;
	const MIN_SCALE = 1;
	const DOUBLE_TAP_DELAY = 300;
	const ZOOM_STEP = 0.5;          // Шаг зума кнопками +/−
	const ZOOM_ANIM_DURATION = 300; // Длительность анимации зума в мс

	// ============================================================
	// 7. ФУНКЦИИ УПРАВЛЕНИЯ ЗУМОМ
	// ============================================================

	/**
	 * 7.1. Обновляет подсказку и кнопки зума.
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
	 */
	function resetAllZooms() {
		// Отменяем текущую анимацию
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}

		const allWrappers = overlay.querySelectorAll( '[data-zoom-wrapper]' );
		const allImages = overlay.querySelectorAll( '[data-zoom-img]' );

		allWrappers.forEach( w => {
			w.style.transform = '';
			w.style.cursor = '';
			w.classList.remove( 'zoomed' );
		} );

		allImages.forEach( img => {
			img.style.transition = '';
			img.style.transform = '';
			img.style.cursor = '';
			img.classList.remove( 'zoomed' );
		} );

		zoomState.active = false;
		zoomState.img = null;
		zoomState.wrapper = null;
		zoomState.scale = 1;
		zoomState.currentScale = 1;
		zoomState.translateX = 0;
		zoomState.translateY = 0;

		dragState.active = false;

		setSwiperLocked( false );
		updateZoomUI();
	}

	/**
	 * 7.4. Плавно устанавливает зум с анимацией.
	 * 
	 * @param {HTMLElement} img - Изображение
	 * @param {HTMLElement} wrapper - Обёртка
	 * @param {number} targetScale - Целевой масштаб (1–4)
	 * @param {number} [targetX=0] - Целевое смещение X
	 * @param {number} [targetY=0] - Целевое смещение Y
	 * @param {boolean} [animate=true] - Плавная анимация или мгновенно
	 */
	function setZoom( img, wrapper, targetScale, targetX = 0, targetY = 0, animate = true ) {
		// Отменяем предыдущую анимацию
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}

		const clampedScale = Math.max( MIN_SCALE, Math.min( MAX_SCALE, targetScale ) );
		const willBeActive = clampedScale > MIN_SCALE;

		// Обновляем состояние
		zoomState.img = img;
		zoomState.wrapper = wrapper;
		zoomState.scale = clampedScale;
		zoomState.translateX = targetX;
		zoomState.translateY = targetY;

		// Функция применения трансформации
		function applyTransform( scale, tx, ty ) {
			if ( !img ) return;
			img.style.transform = `scale(${scale}) translate(${tx / scale}px, ${ty / scale}px)`;
			img.style.cursor = scale > MIN_SCALE ? 'grab' : '';
			img.classList.toggle( 'zoomed', scale > MIN_SCALE );
			if ( wrapper ) {
				wrapper.classList.toggle( 'zoomed', scale > MIN_SCALE );
			}
			zoomState.currentScale = scale;
		}

		if ( animate && zoomState.currentScale !== clampedScale ) {
			// Плавная анимация через requestAnimationFrame
			const startScale = zoomState.currentScale;
			const startX = zoomState.translateX;
			const startY = zoomState.translateY;
			const startTime = performance.now();

			function animateZoom( now ) {
				const elapsed = now - startTime;
				const progress = Math.min( elapsed / ZOOM_ANIM_DURATION, 1 );

				// Ease-out кривая
				const eased = 1 - Math.pow( 1 - progress, 3 );

				const currentScale = startScale + ( clampedScale - startScale ) * eased;
				const currentX = startX + ( targetX - startX ) * eased;
				const currentY = startY + ( targetY - startY ) * eased;

				applyTransform( currentScale, currentX, currentY );

				if ( progress < 1 ) {
					zoomState.animFrameId = requestAnimationFrame( animateZoom );
				} else {
					// Финальное состояние
					applyTransform( clampedScale, targetX, targetY );
					zoomState.animFrameId = null;
					zoomState.active = willBeActive;
					setSwiperLocked( willBeActive );
					updateZoomUI();
				}
			}

			// Начинаем анимацию
			img.style.transition = 'none';
			zoomState.animFrameId = requestAnimationFrame( animateZoom );
		} else {
			// Мгновенное применение
			img.style.transition = 'none';
			applyTransform( clampedScale, targetX, targetY );
			zoomState.active = willBeActive;
			setSwiperLocked( willBeActive );
			updateZoomUI();
		}
	}

	// ============================================================
	// 8. ИНИЦИАЛИЗАЦИЯ SWIPER
	// ============================================================
	swiperInstance = new Swiper( overlay.querySelector( '.swiper' ), {
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

		navigation: {
			nextEl: overlay.querySelector( '.swiper-button-next' ),
			prevEl: overlay.querySelector( '.swiper-button-prev' ),
		},

		pagination: {
			el: overlay.querySelector( '.swiper-pagination' ),
			clickable: true,
		},

		mousewheel: {
			thresholdDelta: 50,
			sensitivity: 1,
		},

		keyboard: {
			enabled: true,
			onlyInViewport: true,
		},

		breakpoints: {
			320: { slidesPerView: 1.1, spaceBetween: 16 },
			481: { slidesPerView: 1.2, spaceBetween: 24 },
			769: { slidesPerView: 1.4, spaceBetween: 32 },
			993: { slidesPerView: 1.5, spaceBetween: 40 },
		},

		on: {
			slideChange: function () {
				resetAllZooms();
				updateCounter( this.activeIndex, photos.length );
			},
			slideChangeTransitionStart: function () {
				resetAllZooms();
			},
		},
	} );

	// ============================================================
	// 9. ОБНОВЛЕНИЕ СЧЁТЧИКА
	// ============================================================
	function updateCounter( index, total ) {
		const counter = document.getElementById( 'sliderCounter' );
		if ( counter ) {
			counter.textContent = `${index + 1} / ${total}`;
		}
	}

	// ============================================================
	// 10. ОБРАБОТЧИКИ ЗУМА
	// ============================================================

	const swiperEl = overlay.querySelector( '.swiper' );

	// 10.1. Двойной тап — переключение зума
	swiperEl.addEventListener( 'click', function ( e ) {
		const now = Date.now();
		const timeSinceLastTap = now - zoomState.lastTapTime;

		const img = e.target.closest( '[data-zoom-img]' );
		if ( !img ) {
			zoomState.lastTapTime = now;
			return;
		}

		if ( timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0 ) {
			e.preventDefault();
			e.stopPropagation();
			handleDoubleTap( e );
			zoomState.lastTapTime = 0;
		} else {
			zoomState.lastTapTime = now;
		}
	} );

	/**
	 * 10.2. Логика двойного тапа.
	 */
	function handleDoubleTap( e ) {
		const img = e.target.closest( '[data-zoom-img]' );
		if ( !img ) return;

		const wrapper = img.closest( '[data-zoom-wrapper]' );
		if ( !wrapper ) return;

		const rect = img.getBoundingClientRect();
		const tapX = e.clientX - rect.left;
		const tapY = e.clientY - rect.top;
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		if ( zoomState.active && zoomState.img === img ) {
			// Сбрасываем зум — плавно
			setZoom( img, wrapper, MIN_SCALE, 0, 0, true );
		} else {
			// Увеличиваем с центром на точку тапа — плавно
			const targetScale = 2.5;
			const offsetX = ( centerX - tapX ) * ( targetScale - 1 );
			const offsetY = ( centerY - tapY ) * ( targetScale - 1 );

			resetAllZooms();
			setZoom( img, wrapper, targetScale, offsetX, offsetY, true );
		}

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	}

	// 10.3. Кнопки зума +/−
	const zoomInBtn = overlay.querySelector( '#zoomIn' );
	const zoomOutBtn = overlay.querySelector( '#zoomOut' );

	zoomInBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !zoomState.img ) return;

		const newScale = zoomState.currentScale + ZOOM_STEP;
		setZoom(
			zoomState.img,
			zoomState.wrapper,
			newScale,
			zoomState.translateX,
			zoomState.translateY,
			true
		);
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	zoomOutBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !zoomState.img ) return;

		const newScale = zoomState.currentScale - ZOOM_STEP;
		if ( newScale <= MIN_SCALE ) {
			resetAllZooms();
		} else {
			setZoom(
				zoomState.img,
				zoomState.wrapper,
				newScale,
				zoomState.translateX,
				zoomState.translateY,
				true
			);
		}
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	// 10.4. Пинч (два пальца) — плавный зум без анимации

	function handlePinchStart( e ) {
		if ( e.touches.length !== 2 ) return;

		const img = e.target.closest( '[data-zoom-img]' );
		if ( !img ) return;

		const wrapper = img.closest( '[data-zoom-wrapper]' );

		// Отменяем анимацию для мгновенного отклика
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}
		if ( zoomState.img ) {
			zoomState.img.style.transition = 'none';
		}

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

		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		zoomState.startDistance = Math.sqrt( dx * dx + dy * dy );
		zoomState.startScale = zoomState.currentScale;
		zoomState.startTranslateX = zoomState.translateX;
		zoomState.startTranslateY = zoomState.translateY;

		e.preventDefault();
	}

	function handlePinchMove( e ) {
		if ( e.touches.length !== 2 ) return;
		if ( !zoomState.img || zoomState.startDistance === 0 ) return;

		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		const distance = Math.sqrt( dx * dx + dy * dy );
		const ratio = distance / zoomState.startDistance;
		const newScale = zoomState.startScale * ratio;

		// Мгновенное применение (без анимации для пинча)
		setZoom(
			zoomState.img,
			zoomState.wrapper,
			newScale,
			zoomState.translateX,
			zoomState.translateY,
			false  // Без анимации
		);

		e.preventDefault();
	}

	function handlePinchEnd() {
		if ( !zoomState.img ) return;

		if ( zoomState.currentScale < 1.05 ) {
			resetAllZooms();
		}

		zoomState.startDistance = 0;
		updateZoomUI();
	}

	swiperEl.addEventListener( 'touchstart', handlePinchStart, { passive: false } );
	swiperEl.addEventListener( 'touchmove', handlePinchMove, { passive: false } );
	swiperEl.addEventListener( 'touchend', handlePinchEnd );
	swiperEl.addEventListener( 'touchcancel', handlePinchEnd );

	// ============================================================
	// 11. ПЕРЕТАСКИВАНИЕ УВЕЛИЧЕННОГО ФОТО
	// Работает ТОЛЬКО при активном зуме
	// Swiper заблокирован — перелистывания не будет
	// ============================================================

	function handleDragStart( e ) {
		// Перетаскивание только при активном зуме
		if ( !zoomState.active || !zoomState.img ) return;

		const isTouch = !!e.touches;

		// Для тача — только один палец (пинч обрабатывается отдельно)
		if ( isTouch && e.touches.length !== 1 ) return;

		const clientX = isTouch ? e.touches[0].clientX : e.clientX;
		const clientY = isTouch ? e.touches[0].clientY : e.clientY;

		dragState.active = true;
		dragState.isTouch = isTouch;
		dragState.startX = clientX;
		dragState.startY = clientY;
		dragState.startTranslateX = zoomState.translateX;
		dragState.startTranslateY = zoomState.translateY;

		// Отключаем анимацию на время перетаскивания
		if ( zoomState.animFrameId ) {
			cancelAnimationFrame( zoomState.animFrameId );
			zoomState.animFrameId = null;
		}
		zoomState.img.style.transition = 'none';
		zoomState.img.style.cursor = 'grabbing';

		e.preventDefault();
		e.stopPropagation();
	}

	function handleDragMove( e ) {
		if ( !dragState.active || !zoomState.active || !zoomState.img ) return;

		const isTouch = dragState.isTouch;
		const clientX = isTouch ? e.touches[0].clientX : e.clientX;
		const clientY = isTouch ? e.touches[0].clientY : e.clientY;

		const deltaX = clientX - dragState.startX;
		const deltaY = clientY - dragState.startY;

		setZoom(
			zoomState.img,
			zoomState.wrapper,
			zoomState.currentScale,
			dragState.startTranslateX + deltaX,
			dragState.startTranslateY + deltaY,
			false  // Без анимации — мгновенное следование
		);
	}

	function handleDragEnd() {
		if ( !dragState.active ) return;

		dragState.active = false;
		if ( zoomState.img ) {
			zoomState.img.style.cursor = 'grab';
		}
	}

	// Мышь: перетаскивание
	swiperEl.addEventListener( 'mousedown', function ( e ) {
		if ( zoomState.active && e.target.closest( '[data-zoom-img]' ) ) {
			handleDragStart( e );
		}
	} );

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

	// Тач: перетаскивание одним пальцем (только при зуме)
	swiperEl.addEventListener( 'touchstart', function ( e ) {
		// Не перехватываем пинч (2 пальца)
		if ( e.touches.length !== 1 ) return;
		if ( zoomState.active && e.target.closest( '[data-zoom-img]' ) ) {
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
	// 12. ЗАКРЫТИЕ СЛАЙДЕРА
	// ============================================================

	function closeSlider() {
		overlay.classList.remove( 'open' );

		setTimeout( () => {
			if ( swiperInstance ) {
				swiperInstance.destroy( true, true );
				swiperInstance = null;
			}
			resetAllZooms();
			overlay.remove();
			document.body.style.overflow = '';
		}, 400 );

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	}

	const closeBtn = overlay.querySelector( '#sliderClose' );
	closeBtn.addEventListener( 'click', closeSlider );

	overlay.addEventListener( 'click', function ( e ) {
		if ( e.target === overlay || e.target.classList.contains( 'slider-container' ) ) {
			closeSlider();
		}
	} );

	function handleEscape( e ) {
		if ( e.key === 'Escape' ) {
			closeSlider();
			document.removeEventListener( 'keydown', handleEscape );
		}
	}
	document.addEventListener( 'keydown', handleEscape );

	document.body.style.overflow = 'hidden';

	// ============================================================
	// 13. ЗАПУСК
	// ============================================================

	updateZoomUI();

	if ( window.navigator?.vibrate ) {
		window.navigator.vibrate( 10 );
	}

	console.log( `📸 Слайдер открыт: фото ${startIndex + 1} из ${photos.length}` );
	console.log( '💡 Двойной тап — увеличить | Пинч — зум | +/− — кнопки | Drag — двигать' );
}