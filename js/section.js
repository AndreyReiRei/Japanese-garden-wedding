/**
 * section.js — Turn.js с двойными страницами
 * Использует scissor() для разделения .double на две половины
 */

( function () {
	'use strict';

	// ============================================
	// DOM
	// ============================================
	var loader = document.getElementById( 'loader' );
	var flipbook = document.getElementById( 'flipbook' );
	var currentPageEl = document.getElementById( 'currentPage' );
	var totalPagesEl = document.getElementById( 'totalPages' );

	// ============================================
	// ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ
	// ============================================

	function preloadImages( callback ) {
		var pages = flipbook.querySelectorAll( '.page, .double' );
		var urls = [];

		pages.forEach( function ( page ) {
			var style = page.style.backgroundImage;
			if ( style && style !== 'none' ) {
				var match = style.match( /url\(["']?([^"')]+)["']?\)/ );
				if ( match && match[1] ) {
					urls.push( match[1] );
				}
			}
		} );

		if ( urls.length === 0 ) {
			callback();
			return;
		}

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
	// ИНИЦИАЛИЗАЦИЯ TURN.JS
	// ============================================

	function initBook() {
		if ( !flipbook || typeof jQuery === 'undefined' ) {
			console.warn( '⚠️ jQuery не загружен' );
			hideLoader();
			return;
		}

		// Ждём пока CSS загрузится и размеры применятся
		var $book = jQuery( flipbook );

		function tryInit() {
			if ( $book.width() === 0 || $book.height() === 0 ) {
				setTimeout( tryInit, 10 );
				return;
			}

			// Применяем scissor к двойным страницам
			// Это разделяет .double на две половины для правильного перелистывания
			$book.find( '.double' ).scissor();

			// Считаем общее количество «страниц» для индикатора
			// Каждый .double считается за 2 страницы (разворот)
			var totalPages = $book.children( '.page' ).length +
				( $book.children( '.double' ).length * 2 );
			if ( totalPagesEl ) totalPagesEl.textContent = totalPages;
			if ( currentPageEl ) currentPageEl.textContent = '1';

			// Инициализация Turn.js
			$book.turn( {
				elevation: 50,
				gradients: true,
				autoCenter: true,
				display: 'double',
				acceleration: true,
				when: {
					turning: function ( event, page ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
						if ( window.navigator && window.navigator.vibrate ) {
							window.navigator.vibrate( 4 );
						}
					},
					turned: function ( event, page ) {
						if ( currentPageEl ) currentPageEl.textContent = page;
					}
				}
			} );

			console.log( '📖 Книга с двойными страницами готова' );
		}

		tryInit();
	}

	// ============================================
	// ЗАГРУЗКА СКРИПТОВ (как в оригинале — yepnope)
	// ============================================

	function loadScripts( callback ) {
		// Проверяем поддержку CSS transforms через Modernizr
		var hasCSSTransforms = typeof Modernizr !== 'undefined' && Modernizr.csstransforms;

		var turnScript = hasCSSTransforms
			? '../lib/turn.min.js'
			: '../lib/turn.html4.min.js';

		var scriptsToLoad = [turnScript];

		// scissor нужен для .double
		if ( hasCSSTransforms ) {
			scriptsToLoad.push( '../lib/scissor.min.js' );
		}

		var loadedCount = 0;

		scriptsToLoad.forEach( function ( src ) {
			var script = document.createElement( 'script' );
			script.src = src;
			script.onload = function () {
				loadedCount++;
				if ( loadedCount >= scriptsToLoad.length ) {
					callback();
				}
			};
			script.onerror = function () {
				loadedCount++;
				if ( loadedCount >= scriptsToLoad.length ) {
					callback();
				}
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

			// Загружаем Turn.js и scissor, затем инициализируем
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