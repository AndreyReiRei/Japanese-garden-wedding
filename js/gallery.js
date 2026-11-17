/**
 * ============================================================
 * gallery.js — Динамическая галерея с сеткой
 * ============================================================
 * 
 * НАЗНАЧЕНИЕ:
 *   Строит адаптивную сетку фотографий.
 *   При клике на фото — открывает полноэкранный слайдер (slider.js).
 *   Поддерживает ленивую подгрузку (кнопка "Показать все").
 *   Поддерживает адаптивные изображения (thumb для сетки, full для слайдера).
 *   Управляет кнопкой «Наверх» (плавный скролл).
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   initGallery({
 *       section: 'garden',           // Идентификатор раздела (для темы слайдера)
 *       gridId: 'galleryGridA',      // ID контейнера сетки (по умолчанию 'galleryGrid')
 *       initialCount: 15,            // Сколько фото показать сразу (0 = все)
 *       photos: [                    // Массив фото
 *           { 
 *               src: '.../thumbs/1.avif',     // Маленькое фото для сетки (1000px)
 *               srcFull: '.../full/1.avif',   // Большое фото для слайдера (3000px)
 *               alt: '...' 
 *           },
 *           ...
 *       ]
 *   });
 * 
 * ЗАВИСИМОСТИ:
 *   - slider.js (функция openSlider)
 *   - gallery.css (стили сетки)
 * ============================================================
 */

function initGallery( config ) {
	'use strict';

	// ============================================================
	// 1. ДЕСТРУКТУРИЗАЦИЯ КОНФИГА
	// ============================================================

	const {
		section,        // 'garden' | 'zags' | 'home'
		photos,         // Массив объектов фото
		gridId = 'galleryGrid', // ID сетки
		initialCount = 15       // Сколько показывать сразу
	} = config;

	// Защита: если нет секции или фото — выходим
	if ( !section || !photos || !photos.length ) {
		console.error( `initGallery [${section || 'unknown'}]: не указан section или photos` );
		return;
	}

	// ============================================================
	// 2. ПОЛУЧЕНИЕ DOM-ЭЛЕМЕНТОВ
	// ============================================================

	const galleryGrid = document.getElementById( gridId );

	// Если сетки нет на странице — выходим
	if ( !galleryGrid ) {
		console.error( `initGallery: не найден #${gridId}` );
		return;
	}

	// Вычисляем, сколько фото показать сразу и сколько останется
	const showAll = initialCount <= 0 || initialCount >= photos.length;
	const visiblePhotos = showAll ? photos : photos.slice( 0, initialCount );
	const hiddenPhotos = showAll ? [] : photos.slice( initialCount );
	const hiddenCount = hiddenPhotos.length;

	// Флаг, чтобы не запускать повторную отрисовку
	let isRenderedAll = showAll;

	// ============================================================
	// 3. ФАБРИКА: СОЗДАНИЕ ОДНОГО ЭЛЕМЕНТА СЕТКИ
	// ============================================================

	function createPhotoItem( photo, index ) {
		// --- Контейнер (скрыт, пока фото не загрузилось) ---
		const item = document.createElement( 'div' );
		item.className = 'gallery-item is-loading';

		if ( photo.span ) {
			item.classList.add( 'span-' + photo.span );
		}

		// Задержка анимации (каскад), не больше 10 шагов
		item.style.transitionDelay = ( ( index % 10 ) * 0.08 ) + 's';

		// --- Изображение ---
		const img = document.createElement( 'img' );
		const srcThumb = photo.srcSmall || photo.src;

		img.alt = photo.alt || '';
		img.loading = 'lazy';
		img.decoding = 'async';

		// Показать ячейку только после успешной загрузки
		const reveal = function () {
			item.classList.remove( 'is-loading' );
			item.classList.add( 'is-ready', 'visible' );
			setItemSpan( item );
		};

		img.onload = reveal;

		// Битое фото — убираем ячейку, без пустого квадрата
		img.onerror = function () {
			if ( item.parentNode ) {
				item.parentNode.removeChild( item );
			}
		};

		// src в конце, чтобы не пропустить onload из кэша
		img.src = srcThumb;

		if ( img.complete && img.naturalWidth > 0 ) {
			reveal();
		}

		item.appendChild( img );

		// --- Подпись ---
		if ( photo.alt ) {
			const caption = document.createElement( 'div' );
			caption.className = 'gallery-caption';
			caption.textContent = photo.alt;
			item.appendChild( caption );
		}

		// --- Клик: открытие слайдера ---
		item.addEventListener( 'click', function () {
			if ( typeof openSlider === 'function' ) {
				openSlider( {
					photos: photos,
					startIndex: index,
					theme: section
				} );
			} else {
				console.warn( 'openSlider не найден. Подключён ли slider.js?' );
			}
		} );

		return item;
	}

	// ============================================================
	// 4. ПОСТРОЕНИЕ ВСЕЙ СЕТКИ
	// ============================================================

	// Храним обработчики на самом элементе сетки, чтобы не было утечек памяти
	if ( galleryGrid._resizeHandler ) {
		window.removeEventListener( 'resize', galleryGrid._resizeHandler );
	}
	if ( galleryGrid._resizeTimer ) {
		clearTimeout( galleryGrid._resizeTimer );
	}

	/**
	 * Вычисляет, сколько строк (высотой 1px + gap) занимает элемент.
	 */
	function setItemSpan( item ) {
		if ( !item || !item.isConnected ) return;

		const img = item.querySelector( 'img' );
		if ( !img ) return;

		if ( !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0 ) {
			return;
		}

		const itemWidth = item.getBoundingClientRect().width;
		if ( itemWidth === 0 ) return;

		const imgHeight = ( img.naturalHeight / img.naturalWidth ) * itemWidth;

		const gridStyle = getComputedStyle( galleryGrid );
		const gap = parseFloat( gridStyle.rowGap ) || 12;

		const rowSpan = Math.max( 1, Math.ceil( ( imgHeight + gap ) / ( 1 + gap ) ) );

		item.style.gridRowEnd = 'span ' + rowSpan;
	}

	/**
	 * Пересчитывает ВСЕ элементы сетки.
	 */
	function recalcAllSpans() {
		const items = galleryGrid.querySelectorAll( '.gallery-item' );
		items.forEach( function ( item ) {
			setItemSpan( item );
		} );
	}

	/**
	 * Навешивает обработчики загрузки на новые элементы,
	 * чтобы высчитать их высоту и не сломать сетку.
	 */
	function watchImages( items, callback ) {
		let loadedCount = 0;
		const totalImages = items.length;

		if ( totalImages === 0 ) {
			if ( callback ) callback();
			return;
		}

		items.forEach( function ( item ) {
			const img = item.querySelector( 'img' );
			if ( !img ) {
				loadedCount++;
				if ( loadedCount === totalImages && callback ) callback();
				return;
			}

			if ( img.complete && img.naturalHeight > 0 ) {
				setItemSpan( item );
				loadedCount++;
				if ( loadedCount === totalImages && callback ) callback();
			} else {
				img.addEventListener( 'load', function () {
					setItemSpan( item );
					loadedCount++;
					if ( loadedCount === totalImages && callback ) callback();
				}, { once: true } );

				img.addEventListener( 'error', function () {
					// createPhotoItem сам удаляет битый item
					loadedCount++;
					if ( loadedCount === totalImages && callback ) callback();
				}, { once: true } );
			}
		} );
	}

	/**
	 * Добавляет элементы в сетку.
	 * Класс visible ставит createPhotoItem после load — здесь не трогаем opacity.
	 */
	function appendPhotos( photosToAdd, startIndexOffset ) {
		if ( startIndexOffset === undefined ) startIndexOffset = 0;

		const newItems = [];

		photosToAdd.forEach( function ( photo, index ) {
			const item = createPhotoItem( photo, startIndexOffset + index );
			galleryGrid.appendChild( item );
			newItems.push( item );
		} );

		watchImages( newItems, function () {
			recalcAllSpans();
		} );

		return newItems;
	}

	function buildGrid() {
		// Очищаем сетку
		galleryGrid.innerHTML = '';

		// Рисуем первую партию
		appendPhotos( visiblePhotos, 0 );

		// Дополнительный пересчет
		requestAnimationFrame( function () {
			requestAnimationFrame( recalcAllSpans );
		} );

		// Обработчик ресайза
		galleryGrid._resizeHandler = function () {
			clearTimeout( galleryGrid._resizeTimer );
			galleryGrid._resizeTimer = setTimeout( recalcAllSpans, 150 );
		};
		window.addEventListener( 'resize', galleryGrid._resizeHandler );
	}

	// ============================================================
	// 5. ЛОГИКА КНОПКИ "ПОКАЗАТЬ ВСЕ"
	// ============================================================

	function setupLoadMoreButton() {
		if ( isRenderedAll || hiddenCount === 0 ) return;

		// Ищем кнопку, привязанную к этой сетке
		const loadMoreBtn = document.querySelector( `.gallery-load-more[data-target="${gridId}"]` );
		if ( !loadMoreBtn ) {
			console.warn( `gallery.js: не найдена кнопка .gallery-load-more[data-target="${gridId}"]` );
			return;
		}

		// Показываем кнопку и пишем количество
		loadMoreBtn.style.display = 'inline-flex';
		const titleEl = loadMoreBtn.querySelector( '.bottom-nav-title' );
		if ( titleEl ) {
			titleEl.textContent = `Показать все фото (+${hiddenCount})`;
		}

		// Обработчик клика
		loadMoreBtn.addEventListener( 'click', () => {
			if ( isRenderedAll ) return;
			isRenderedAll = true;

			// Скрываем кнопку
			loadMoreBtn.style.display = 'none';

			// Дорисовываем оставшиеся фото
			appendPhotos( hiddenPhotos, visiblePhotos.length );
		}, { once: true } );
	}

	// ============================================================
	// 6. КНОПКА «НАВЕРХ» (SCROLL TO TOP)
	// ============================================================

	function setupScrollToTop() {
		const btn = document.getElementById( 'scrollToTop' );
		if ( !btn ) return;

		// Показ/скрытие при скролле
		const toggleVisibility = () => {
			if ( window.scrollY > 400 ) {
				btn.classList.add( 'visible' );
			} else {
				btn.classList.remove( 'visible' );
			}
		};

		window.addEventListener( 'scroll', toggleVisibility, { passive: true } );

		// Плавный скролл наверх
		btn.addEventListener( 'click', () => {
			window.scrollTo( {
				top: 0,
				behavior: 'smooth'
			} );
		} );
	}

	// ============================================================
	// 7. ЗАПУСК
	// ============================================================

	buildGrid();
	setupLoadMoreButton();
	setupScrollToTop();

	console.log(
		`📸 Галерея «${section}» [${gridId}] готова — ` +
		`показано ${visiblePhotos.length} из ${photos.length} фото`
	);
}