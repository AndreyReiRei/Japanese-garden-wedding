/**
 * section.js — Turn.js с двойными страницами
 * Исправлено: свайпы на мобильных работают всегда,
 * уголки кликабельны, книга не прыгает
 */

( function () {
	'use strict';

	var loader = document.getElementById( 'loader' );
	var flipbook = document.getElementById( 'flipbook' );
	var currentPageEl = document.getElementById( 'currentPage' );
	var totalPagesEl = document.getElementById( 'totalPages' );

	// ============================================
	// ПРЕДЗАГРУЗКА
	// ============================================
	function preloadImages( callback ) {
		var pages = flipbook.querySelectorAll( '.page, .double' );
		var urls = [];

		pages.forEach( function ( page ) {
			var style = page.style.backgroundImage;
			if ( style && style !== 'none' ) {
				var match = style.match( /url\(["']?([^"')]+)["']?\)/ );
				if ( match && match[1] ) urls.push( match[1] );
			}
		} );

		if ( urls.length === 0 ) { callback(); return; }

		var loaded = 0;
		urls.forEach( function ( url ) {
			var img = new Image();
			img.onload = function () {
				loaded++;
				if ( loaded >= urls.length ) callback();
			};
			img.onerror = function () {
				loaded++;
				if ( loaded >= urls.length ) callback();
			};
			img.src = url;
		} );
	}

	function hideLoader() {
		if ( loader ) {
			loader.classList.add( 'hidden' );
			setTimeout( function () {
				if ( loader.parentNode ) loader.parentNode.removeChild( loader );
			}, 500 );
		}
	}

	// ============================================
	// СВАЙПЫ ДЛЯ МОБИЛЬНЫХ
	// ============================================
	function setupSwipeGestures( $book ) {
		var viewport = document.querySelector( '.flipbook-viewport' );
		if ( !viewport ) return;

		var touchStartX = 0;
		var touchStartY = 0;
		var isSwiping = false;

		viewport.addEventListener( 'touchstart', function ( e ) {
			if ( e.touches.length === 1 ) {
				touchStartX = e.touches[0].clientX;
				touchStartY = e.touches[0].clientY;
				isSwiping = true;
			}
		}, { passive: true } );

		viewport.addEventListener( 'touchmove', function ( e ) {
			if ( !isSwiping || e.touches.length !== 1 ) return;

			var diffX = e.touches[0].clientX - touchStartX;
			var diffY = e.touches[0].clientY - touchStartY;

			// Если горизонтальное движение больше вертикального — это свайп
			if ( Math.abs( diffX ) > Math.abs( diffY ) && Math.abs( diffX ) > 30 ) {
				e.preventDefault();  // Предотвращаем скролл страницы
			}
		}, { passive: false } );

		viewport.addEventListener( 'touchend', function ( e ) {
			if ( !isSwiping ) return;
			isSwiping = false;

			var diffX = e.changedTouches[0].clientX - touchStartX;
			var diffY = e.changedTouches[0].clientY - touchStartY;
			var threshold = 50;  // Минимальное расстояние для свайпа

			// Только если горизонтальное движение больше вертикального
			if ( Math.abs( diffX ) > Math.abs( diffY ) && Math.abs( diffX ) > threshold ) {
				var currentPage = $book.turn( 'page' );
				var totalPages = $book.turn( 'pages' );

				if ( diffX < 0 && currentPage < totalPages ) {
					// Свайп влево → следующая страница
					$book.turn( 'next' );
					if ( window.navigator && window.navigator.vibrate ) {
						window.navigator.vibrate( 6 );
					}
				} else if ( diffX > 0 && currentPage > 1 ) {
					// Свайп вправо → предыдущая страница
					$book.turn( 'previous' );
					if ( window.navigator && window.navigator.vibrate ) {
						window.navigator.vibrate( 6 );
					}
				}
			}
		} );
	}

	// ============================================
	// КЛИКИ ПО УГОЛКАМ
	// ============================================
	function setupCornerClicks( $book ) {
		$book.on( 'click', '.page-corner-tr', function ( e ) {
			e.stopPropagation();
			e.preventDefault();
			var currentPage = $book.turn( 'page' );
			var totalPages = $book.turn( 'pages' );
			if ( currentPage < totalPages ) {
				$book.turn( 'next' );
				if ( window.navigator && window.navigator.vibrate ) {
					window.navigator.vibrate( 6 );
				}
			}
		} );

		$book.on( 'click', '.page-corner-tl', function ( e ) {
			e.stopPropagation();
			e.preventDefault();
			var currentPage = $book.turn( 'page' );
			if ( currentPage > 1 ) {
				$book.turn( 'previous' );
				if ( window.navigator && window.navigator.vibrate ) {
					window.navigator.vibrate( 6 );
				}
			}
		} );
	}

	// ============================================
	// ИНИЦИАЛИЗАЦИЯ
	// ============================================
	function initBook() {
		if ( !flipbook || typeof jQuery === 'undefined' ) {
			console.warn( 'jQuery не загружен' );
			hideLoader();
			return;
		}

		var $book = jQuery( flipbook );

		function tryInit() {
			if ( $book.width() === 0 || $book.height() === 0 ) {
				setTimeout( tryInit, 10 );
				return;
			}

			// Scissor для двойных страниц
			if ( typeof $book.find( '.double' ).scissor === 'function' ) {
				$book.find( '.double' ).scissor();
			}

			// Счётчик страниц
			var singlePages = $book.children( '.page' ).length;
			var doublePages = $book.children( '.double' ).length;
			var totalPages = singlePages + ( doublePages * 2 );
			if ( totalPagesEl ) totalPagesEl.textContent = totalPages;
			if ( currentPageEl ) currentPageEl.textContent = '1';

			// Turn.js
			$book.turn( {
				elevation: 50,
				gradients: true,
				autoCenter: true,
				display: 'double',
				acceleration: true,
				page: 1,
				duration: 600,         // Быстрее на мобильных
				when: {
					turning: function ( event, page ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
					},
					turned: function ( event, page ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
					}
				}
			} );

			// Подключаем свайпы и уголки
			setupSwipeGestures( $book );
			setupCornerClicks( $book );

			console.log( 'Книга готова. Страниц: ' + totalPages );
			console.log( 'Свайпы и уголки активны' );
		}

		tryInit();
	}

	// ============================================
	// ЗАГРУЗКА СКРИПТОВ
	// ============================================
	function loadScripts( callback ) {
		var hasCSSTransforms = typeof Modernizr !== 'undefined' && Modernizr.csstransforms;
		var turnScript = hasCSSTransforms ? '../lib/turn.min.js' : '../lib/turn.html4.min.js';
		var scriptsToLoad = [turnScript];
		if ( hasCSSTransforms ) scriptsToLoad.push( '../lib/scissor.min.js' );

		var loadedCount = 0;
		scriptsToLoad.forEach( function ( src ) {
			var script = document.createElement( 'script' );
			script.src = src;
			script.onload = function () {
				loadedCount++;
				if ( loadedCount >= scriptsToLoad.length ) callback();
			};
			script.onerror = function () {
				loadedCount++;
				if ( loadedCount >= scriptsToLoad.length ) callback();
			};
			document.head.appendChild( script );
		} );
	}

	// ============================================
	// ЗАПУСК
	// ============================================
	function start() {
		preloadImages( function () {
			hideLoader();
			loadScripts( function () {
				setTimeout( initBook, 200 );
			} );
		} );
	}

	function waitForjQuery( callback ) {
		if ( typeof jQuery !== 'undefined' ) {
			callback();
		} else {
			setTimeout( function () { waitForjQuery( callback ); }, 50 );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', function () {
			waitForjQuery( start );
		} );
	} else {
		waitForjQuery( start );
	}

} )();