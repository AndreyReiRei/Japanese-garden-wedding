/**
 * section.js — Логика страниц разделов
 * Эффект книги на Turn.js + светлячки
 */

( function () {
	'use strict';

	// ============================================
	// DOM
	// ============================================
	const loader = document.getElementById( 'loader' );
	const bookContainer = document.getElementById( 'bookContainer' );
	const flipbook = document.getElementById( 'flipbook' );
	const firefliesContainer = document.getElementById( 'firefliesContainer' );
	const currentPageEl = document.getElementById( 'currentPage' );
	const totalPagesEl = document.getElementById( 'totalPages' );

	// Флаг: книга уже инициализирована
	let bookInitialized = false;

	// Флаг: было взаимодействие с пользователем (для вибрации)
	let userInteracted = false;

	// ============================================
	// ОТСЛЕЖИВАНИЕ ВЗАИМОДЕЙСТВИЯ
	// ============================================

	document.addEventListener( 'click', () => { userInteracted = true; }, { once: true } );
	document.addEventListener( 'touchstart', () => { userInteracted = true; }, { once: true } );

	function safeVibrate( duration ) {
		if ( userInteracted && window.navigator?.vibrate ) {
			try { window.navigator.vibrate( duration ); } catch ( e ) { }
		}
	}

	// ============================================
	// ИНИЦИАЛИЗАЦИЯ КНИГИ
	// ============================================

	function checkDependencies() {
		if ( typeof jQuery === 'undefined' ) {
			console.error( '❌ jQuery не загружен!' );
			return false;
		}
		if ( !jQuery.fn.turn ) {
			console.error( '❌ Turn.js не загружен!' );
			return false;
		}
		return true;
	}

	function initBook() {
		if ( bookInitialized ) return;

		console.log( '📖 Инициализация книги...' );

		if ( !checkDependencies() ) {
			fallbackMode();
			return;
		}

		const $book = jQuery( flipbook );
		const $pages = $book.children( '.page' );
		const totalPages = $pages.length;

		if ( totalPages === 0 ) {
			console.error( '❌ Нет страниц в #flipbook!' );
			hideLoader();
			return;
		}

		if ( totalPagesEl ) totalPagesEl.textContent = totalPages;
		if ( currentPageEl ) currentPageEl.textContent = '1';

		const wrapper = flipbook.parentElement;
		const containerWidth = wrapper.clientWidth;
		const containerHeight = wrapper.clientHeight;

		const isMobile = window.innerWidth < 768;
		const displayMode = isMobile ? 'single' : 'double';

		let pageWidth, pageHeight;

		if ( isMobile ) {
			pageWidth = containerWidth * 0.9;
			pageHeight = containerHeight * 0.85;
		} else {
			pageWidth = Math.min( containerWidth * 0.45, 350 );
			pageHeight = Math.min( containerHeight, pageWidth * 1.45 );
		}

		const bookWidth = displayMode === 'double' ? pageWidth * 2 : pageWidth;

		console.log( '  Режим:', displayMode );
		console.log( '  Размер страницы:', pageWidth + 'x' + pageHeight );
		console.log( '  Размер книги:', bookWidth + 'x' + pageHeight );

		$book.css( {
			width: bookWidth + 'px',
			height: pageHeight + 'px',
			margin: '0 auto',
			position: 'relative'
		} );

		try {
			$book.turn( {
				width: bookWidth,
				height: pageHeight,
				autoCenter: true,
				display: displayMode,
				acceleration: true,
				gradients: true,
				elevation: 50,
				pages: totalPages,
				duration: 800,
				// ВАЖНО: включаем все углы для перелистывания
				corners: 'all',
				when: {
					turning: function ( event, page, view ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
						safeVibrate( 5 );
					},
					turned: function ( event, page, view ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
						console.log( '📄 Страница:', page );
					},
					start: function ( event, pageObject, corner ) {
						console.log( '👆 Листание из угла:', corner );
					},
					first: function () {
						console.log( '⏮️ Первая страница' );
					},
					last: function () {
						console.log( '⏭️ Последняя страница' );
					}
				}
			} );

			bookInitialized = true;
			console.log( '✅ Книга готова!' );

			// ДОБАВЛЯЕМ ПОДСКАЗКИ ДЛЯ ПЕРЕЛИСТЫВАНИЯ
			addNavigationHints( $book, totalPages );

			// ДОБАВЛЯЕМ КНОПКИ ВПЕРЁД/НАЗАД
			addNavigationButtons( $book, totalPages );

			// ДОБАВЛЯЕМ ПОДДЕРЖКУ СВАЙПОВ
			addSwipeSupport( $book, totalPages );

			// ДОБАВЛЯЕМ КЛИКИ ПО КРАЯМ СТРАНИЦ
			addClickZones( $book, totalPages );

		} catch ( error ) {
			console.error( '❌ Ошибка:', error );
			fallbackMode();
		}

		// Обработка изменения размера окна
		let resizeTimeout;
		window.addEventListener( 'resize', () => {
			clearTimeout( resizeTimeout );
			resizeTimeout = setTimeout( () => {
				if ( !bookInitialized ) return;

				const newIsMobile = window.innerWidth < 768;
				const newWrapper = flipbook.parentElement;
				const newContainerWidth = newWrapper.clientWidth;
				const newContainerHeight = newWrapper.clientHeight;

				let newPageWidth, newPageHeight, newBookWidth;
				const newDisplayMode = newIsMobile ? 'single' : 'double';

				if ( newIsMobile ) {
					newPageWidth = newContainerWidth * 0.9;
					newPageHeight = newContainerHeight * 0.85;
					newBookWidth = newPageWidth;
				} else {
					newPageWidth = Math.min( newContainerWidth * 0.45, 350 );
					newPageHeight = Math.min( newContainerHeight, newPageWidth * 1.45 );
					newBookWidth = newPageWidth * 2;
				}

				$book.turn( 'size', newBookWidth, newPageHeight );
				$book.turn( 'display', newDisplayMode );
			}, 300 );
		} );
	}

	// ============================================
	// КНОПКИ НАВИГАЦИИ (СТРЕЛКИ)
	// ============================================

	function addNavigationButtons( $book, totalPages ) {
		// Удаляем старые кнопки если есть
		document.querySelectorAll( '.turn-nav-btn' ).forEach( b => b.remove() );

		const wrapper = flipbook.parentElement;

		// Кнопка НАЗАД
		const prevBtn = document.createElement( 'button' );
		prevBtn.className = 'turn-nav-btn turn-nav-prev';
		prevBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        `;
		prevBtn.style.cssText = `
            position: absolute;
            left: -50px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            z-index: 10;
            transition: all 0.3s ease;
            -webkit-tap-highlight-color: transparent;
        `;

		prevBtn.addEventListener( 'click', ( e ) => {
			e.preventDefault();
			e.stopPropagation();
			if ( bookInitialized ) {
				$book.turn( 'previous' );
				safeVibrate( 8 );
			}
		} );

		prevBtn.addEventListener( 'mouseenter', () => {
			prevBtn.style.background = 'rgba(232,64,64,0.2)';
			prevBtn.style.borderColor = 'rgba(232,64,64,0.5)';
		} );
		prevBtn.addEventListener( 'mouseleave', () => {
			prevBtn.style.background = 'rgba(255,255,255,0.05)';
			prevBtn.style.borderColor = 'rgba(255,255,255,0.15)';
		} );

		// Кнопка ВПЕРЁД
		const nextBtn = document.createElement( 'button' );
		nextBtn.className = 'turn-nav-btn turn-nav-next';
		nextBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;
		nextBtn.style.cssText = `
            position: absolute;
            right: -50px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
            z-index: 10;
            transition: all 0.3s ease;
            -webkit-tap-highlight-color: transparent;
        `;

		nextBtn.addEventListener( 'click', ( e ) => {
			e.preventDefault();
			e.stopPropagation();
			if ( bookInitialized ) {
				$book.turn( 'next' );
				safeVibrate( 8 );
			}
		} );

		nextBtn.addEventListener( 'mouseenter', () => {
			nextBtn.style.background = 'rgba(232,64,64,0.2)';
			nextBtn.style.borderColor = 'rgba(232,64,64,0.5)';
		} );
		nextBtn.addEventListener( 'mouseleave', () => {
			nextBtn.style.background = 'rgba(255,255,255,0.05)';
			nextBtn.style.borderColor = 'rgba(255,255,255,0.15)';
		} );

		wrapper.style.position = 'relative';
		wrapper.appendChild( prevBtn );
		wrapper.appendChild( nextBtn );

		console.log( '🔘 Кнопки навигации добавлены' );
	}

	// ============================================
	// ПОДСКАЗКИ НА УГЛАХ СТРАНИЦ
	// ============================================

	function addNavigationHints( $book, totalPages ) {
		// Удаляем старые подсказки
		document.querySelectorAll( '.turn-hint' ).forEach( h => h.remove() );

		const $pages = $book.children( '.page' );

		$pages.each( function ( index ) {
			const $page = jQuery( this );

			// Подсказка в правом нижнем углу (листать вперёд)
			if ( index < totalPages - 1 ) {
				const hint = document.createElement( 'div' );
				hint.className = 'turn-hint';
				hint.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    width: 30px;
                    height: 30px;
                    border-right: 2px solid rgba(255,255,255,0.3);
                    border-bottom: 2px solid rgba(255,255,255,0.3);
                    border-radius: 0 0 6px 0;
                    z-index: 5;
                    pointer-events: none;
                    animation: hintPulse 2s ease-in-out infinite;
                    opacity: 0.7;
                `;
				this.appendChild( hint );
			}

			// Подсказка в левом нижнем углу (листать назад)
			if ( index > 0 ) {
				const hint = document.createElement( 'div' );
				hint.className = 'turn-hint';
				hint.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    width: 30px;
                    height: 30px;
                    border-left: 2px solid rgba(255,255,255,0.3);
                    border-bottom: 2px solid rgba(255,255,255,0.3);
                    border-radius: 0 0 0 6px;
                    z-index: 5;
                    pointer-events: none;
                    animation: hintPulse 2s ease-in-out infinite;
                    animation-delay: 1s;
                    opacity: 0.7;
                `;
				this.appendChild( hint );
			}
		} );

		// Анимация пульсации для подсказок
		if ( !document.getElementById( 'hint-style' ) ) {
			const style = document.createElement( 'style' );
			style.id = 'hint-style';
			style.textContent = `
                @keyframes hintPulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
            `;
			document.head.appendChild( style );
		}

		console.log( '💡 Подсказки на углах добавлены' );
	}

	// ============================================
	// ПОДДЕРЖКА СВАЙПОВ
	// ============================================

	function addSwipeSupport( $book, totalPages ) {
		let touchStartX = 0;
		let touchStartY = 0;
		let currentPage = 1;

		flipbook.addEventListener( 'touchstart', ( e ) => {
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		}, { passive: true } );

		flipbook.addEventListener( 'touchend', ( e ) => {
			const diffX = e.changedTouches[0].clientX - touchStartX;
			const diffY = e.changedTouches[0].clientY - touchStartY;

			// Только горизонтальные свайпы (не диагональные)
			if ( Math.abs( diffX ) > Math.abs( diffY ) && Math.abs( diffX ) > 50 ) {
				if ( diffX < 0 && currentPage < totalPages ) {
					// Свайп влево — следующая страница
					currentPage++;
					$book.turn( 'next' );
					safeVibrate( 5 );
				} else if ( diffX > 0 && currentPage > 1 ) {
					// Свайп вправо — предыдущая страница
					currentPage--;
					$book.turn( 'previous' );
					safeVibrate( 5 );
				}
			}
		} );

		// Обновляем currentPage при перелистывании
		$book.bind( 'turned', function ( event, page ) {
			currentPage = page;
		} );

		console.log( '👆 Поддержка свайпов добавлена' );
	}

	// ============================================
	// КЛИКАБЕЛЬНЫЕ ЗОНЫ (не конфликтуют с Turn.js)
	// ============================================

	function addClickZones( $book, totalPages ) {
		// Удаляем старые зоны
		document.querySelectorAll( '.click-zone' ).forEach( z => z.remove() );

		const bookWrapper = flipbook.parentElement;
		bookWrapper.style.position = 'relative';

		// Левая зона
		const leftZone = document.createElement( 'div' );
		leftZone.className = 'click-zone click-zone-left';
		leftZone.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 50%;
            z-index: 5;
            cursor: w-resize;
        `;

		// Не мешаем Turn.js — обрабатываем только клики, не перетаскивание
		leftZone.addEventListener( 'click', ( e ) => {
			// Проверяем, что это был именно клик, а не начало перетаскивания
			if ( e.target === leftZone || e.target.classList.contains( 'click-zone-left' ) ) {
				e.stopPropagation();
				$book.turn( 'previous' );
			}
		} );

		// Правая зона
		const rightZone = document.createElement( 'div' );
		rightZone.className = 'click-zone click-zone-right';
		rightZone.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 50%;
            z-index: 5;
            cursor: e-resize;
        `;

		rightZone.addEventListener( 'click', ( e ) => {
			if ( e.target === rightZone || e.target.classList.contains( 'click-zone-right' ) ) {
				e.stopPropagation();
				$book.turn( 'next' );
			}
		} );

		bookWrapper.appendChild( leftZone );
		bookWrapper.appendChild( rightZone );
	}

	// ============================================
	// РЕЗЕРВНЫЙ РЕЖИМ
	// ============================================

	function fallbackMode() {
		console.warn( '⚠️ Упрощённый режим' );

		flipbook.style.display = 'flex';
		flipbook.style.flexDirection = 'column';
		flipbook.style.gap = '12px';
		flipbook.style.overflowY = 'auto';
		flipbook.style.padding = '8px';
		flipbook.style.maxHeight = '75vh';
		flipbook.style.width = '100%';

		const pages = flipbook.querySelectorAll( '.page' );
		pages.forEach( page => {
			page.style.width = '100%';
			page.style.height = 'auto';
			page.style.aspectRatio = '3/4';
			page.style.borderRadius = '8px';
			page.style.border = '1px solid rgba(255,255,255,0.1)';
		} );

		if ( totalPagesEl ) totalPagesEl.textContent = pages.length;
		if ( currentPageEl ) currentPageEl.textContent = '—';

		hideLoader();
	}

	// ============================================
	// СВЕТЛЯЧКИ
	// ============================================

	const fireflyStyle = document.createElement( 'style' );
	fireflyStyle.textContent = `
        @keyframes fireflyFloat {
            0%, 100% { opacity: 0.1; transform: translate(0, 0) scale(0.7); }
            25% { opacity: 0.8; transform: translate(10px, -15px) scale(1.5); }
            50% { opacity: 0.2; transform: translate(-6px, -6px) scale(0.5); }
            75% { opacity: 0.9; transform: translate(-12px, -20px) scale(1.7); }
        }
    `;
	document.head.appendChild( fireflyStyle );

	function createFirefly() {
		const ff = document.createElement( 'div' );
		const size = Math.random() * 3 + 1.5;
		const duration = Math.random() * 5 + 3;

		ff.style.cssText = `
            position: absolute;
            top: ${Math.random() * 85}%;
            left: ${Math.random() * 90}%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255,220,160,0.9) 0%, rgba(255,180,100,0.5) 35%, transparent 70%);
            border-radius: 50%;
            box-shadow: 0 0 ${size * 3}px rgba(255,180,100,0.5), 0 0 ${size * 7}px rgba(255,150,60,0.2);
            animation: fireflyFloat ${duration}s ${Math.random() * 4}s ease-in-out infinite;
            pointer-events: none;
            z-index: 0;
        `;
		return ff;
	}

	for ( let i = 0; i < 6; i++ ) {
		firefliesContainer.appendChild( createFirefly() );
	}

	setInterval( () => {
		firefliesContainer.querySelectorAll( 'div' ).forEach( f => f.remove() );
		for ( let i = 0; i < 6; i++ ) {
			firefliesContainer.appendChild( createFirefly() );
		}
	}, 9000 );

	// ============================================
	// ЗАГРУЗКА
	// ============================================

	function hideLoader() {
		if ( loader ) {
			loader.classList.add( 'hidden' );
			setTimeout( () => loader?.remove(), 500 );
		}
		if ( bookContainer ) {
			bookContainer.classList.add( 'visible' );
		}
	}

	function waitForImages() {
		const images = flipbook.querySelectorAll( 'img' );
		console.log( '🖼️ Фото для загрузки:', images.length );

		if ( images.length === 0 ) {
			hideLoader();
			initBook();
			return;
		}

		let loaded = 0;
		const total = images.length;

		function onImageLoad() {
			loaded++;
			console.log( '  Загружено:', loaded + '/' + total );
			if ( loaded >= total ) {
				console.log( '✅ Все фото загружены' );
				setTimeout( () => {
					hideLoader();
					initBook();
				}, 200 );
			}
		}

		images.forEach( img => {
			if ( img.complete && img.naturalWidth > 0 ) {
				onImageLoad();
			} else {
				img.addEventListener( 'load', onImageLoad );
				img.addEventListener( 'error', () => {
					console.warn( '⚠️ Ошибка загрузки:', img.src );
					onImageLoad();
				} );
			}
		} );
	}

	// ============================================
	// ЗАПУСК
	// ============================================

	function init() {
		console.log( '📖 Инициализация раздела...' );
		console.log( '  Размер экрана:', window.innerWidth + 'x' + window.innerHeight );
		console.log( '  Мобильный:', window.innerWidth < 768 );
		waitForImages();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		setTimeout( init, 100 );
	}

} )();