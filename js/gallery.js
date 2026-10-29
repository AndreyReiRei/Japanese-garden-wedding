/**
 * ============================================================
 * gallery.js — Динамическая галерея с сеткой
 * ============================================================
 * 
 * НАЗНАЧЕНИЕ:
 *   Строит адаптивную сетку фотографий.
 *   При клике на фото — открывает полноэкранный слайдер (slider.js).
 *   Поддерживает ленивую подгрузку (кнопка "Показать все").
 *   Поддерживает адаптивные изображения (srcset: маленькие для сетки, большие для лайтбокса).
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   initGallery({
 *       section: 'garden',           // Идентификатор раздела (для темы слайдера)
 *       gridId: 'galleryGridA',      // ID контейнера сетки (по умолчанию 'galleryGrid')
 *       counterId: 'photoCounterA',  // ID счетчика (по умолчанию 'photoCounter')
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
		gridId = 'galleryGrid',       // ID сетки
		counterId = 'photoCounter',   // ID счетчика
		initialCount = 15             // Сколько показывать сразу
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
	const photoCounter = document.getElementById( counterId );

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
	// 3. УТИЛИТА: ОБНОВЛЕНИЕ СЧЁТЧИКА ФОТО
	// ============================================================

	function updateCounter() {
		if ( photoCounter ) {
			photoCounter.textContent = `${photos.length} фото`;
		}
	}

	// ============================================================
	// 4. ФАБРИКА: СОЗДАНИЕ ОДНОГО ЭЛЕМЕНТА СЕТКИ
	// ============================================================

	function createPhotoItem( photo, index ) {
		// --- Контейнер ---
		const item = document.createElement( 'div' );
		item.className = 'gallery-item';

		if ( photo.span ) {
			item.classList.add( `span-${photo.span}` );
		}

		// Задержка анимации (каскадный эффект).
		// Ограничиваем задержку для больших списков, чтобы не ждать долго.
		item.style.transitionDelay = `${( index % 15 ) * 0.04}s`;

		// --- Изображение ---
		const img = document.createElement( 'img' );

		// Логика адаптивных изображений:
		// Если переданы srcSmall и srcFull (или src), используем их.
		const srcThumb = photo.srcSmall || photo.src;
		const srcFull = photo.srcFull || photo.src;

		// Для сетки всегда используем превью (srcThumb)
		img.src = srcThumb;

		// Если хотите, чтобы браузер на Retina-экранах мог подгрузить более качественную версию,
		// можно добавить srcset. Но для экономии трафика лучше оставить только thumb.
		// img.srcset = `${srcThumb} 600w, ${srcFull} 1600w`; 

		img.alt = photo.alt || '';
		img.loading = 'lazy';
		img.decoding = 'async';

		// Заглушка, если фото не загрузилось
		img.onerror = function () {
			this.src = 'data:image/svg+xml,' +
				'%3Csvg xmlns=\'http://www.w3.org/2000/svg\' ' +
				'width=\'400\' height=\'300\'%3E' +
				'%3Crect fill=\'%231a1a1a\' width=\'400\' height=\'300\'/%3E' +
				'%3Ctext fill=\'%23555\' x=\'50%25\' y=\'50%25\' ' +
				'text-anchor=\'middle\' dy=\'.3em\' font-size=\'14\'%3E' +
				'Фото не найдено%3C/text%3E%3C/svg%3E';
		};

		item.appendChild( img );

		// --- Подпись ---
		if ( photo.alt ) {
			const caption = document.createElement( 'div' );
			caption.className = 'gallery-caption';
			caption.textContent = photo.alt;
			item.appendChild( caption );
		}

		// --- Клик: открытие слайдера ---
		item.addEventListener( 'click', () => {
			if ( typeof openSlider === 'function' ) {
				openSlider( {
					photos: photos,           // Передаем ВСЕ фото (слайдер сам возьмет srcFull для показа)
					startIndex: index,        // С какого начать
					theme: section            // Тема для цветов
				} );
			} else {
				console.warn( 'openSlider не найден. Подключён ли slider.js?' );
			}
		} );

		return item;
	}

	// ============================================================
	// 5. ПОСТРОЕНИЕ ВСЕЙ СЕТКИ
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

		item.style.gridRowEnd = `span ${rowSpan}`;
	}

	/**
	 * Пересчитывает ВСЕ элементы сетки.
	 */
	function recalcAllSpans() {
		const items = galleryGrid.querySelectorAll( '.gallery-item' );
		items.forEach( item => setItemSpan( item ) );
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

		items.forEach( item => {
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
				img.addEventListener( 'load', () => {
					setItemSpan( item );
					loadedCount++;
					if ( loadedCount === totalImages && callback ) callback();
				}, { once: true } );

				img.addEventListener( 'error', () => {
					item.style.gridRowEnd = 'span 300';
					loadedCount++;
					if ( loadedCount === totalImages && callback ) callback();
				}, { once: true } );
			}
		} );
	}

	/**
	 * Добавляет элементы в сетку и запускает анимацию.
	 */
	function appendPhotos( photosToAdd, startIndexOffset = 0 ) {
		const newItems = [];

		photosToAdd.forEach( ( photo, index ) => {
			const item = createPhotoItem( photo, startIndexOffset + index );
			galleryGrid.appendChild( item );
			newItems.push( item );
		} );

		// Анимация появления
		requestAnimationFrame( () => {
			newItems.forEach( item => item.classList.add( 'visible' ) );
		} );

		// Считаем высоты
		watchImages( newItems, () => {
			recalcAllSpans();
		} );

		return newItems;
	}

	function buildGrid() {
		// Очищаем сетку
		galleryGrid.innerHTML = '';

		// Рисуем первую партию
		appendPhotos( visiblePhotos, 0 );

		updateCounter();

		// Дополнительный пересчет через requestAnimationFrame
		requestAnimationFrame( () => {
			requestAnimationFrame( recalcAllSpans );
		} );

		// Обработчик ресайза
		galleryGrid._resizeHandler = () => {
			clearTimeout( galleryGrid._resizeTimer );
			galleryGrid._resizeTimer = setTimeout( recalcAllSpans, 150 );
		};
		window.addEventListener( 'resize', galleryGrid._resizeHandler );
	}

	// ============================================================
	// 6. ЛОГИКА КНОПКИ "ПОКАЗАТЬ ВСЕ"
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
	// 7. ЗАПУСК
	// ============================================================

	buildGrid();
	setupLoadMoreButton();

	console.log(
		`📸 Галерея «${section}» [${gridId}] готова — ` +
		`показано ${visiblePhotos.length} из ${photos.length} фото`
	);
}