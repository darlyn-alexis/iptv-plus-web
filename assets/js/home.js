/**
 * home.js - Home Page Hero Carousel & Dynamic Category Rows (Movies & Series)
 */

// DOM Elements
const homeHeroCarouselContainer = document.getElementById('homeHeroCarouselContainer');
const homeCarouselWrapper = document.getElementById('homeCarouselWrapper');
const homeCarouselDots = document.getElementById('homeCarouselDots');
const homeCategoriesContainer = document.getElementById('homeCategoriesContainer');
const homeSeriesCategoriesContainer = document.getElementById('homeSeriesCategoriesContainer');

// State
let homeCarouselTimer = null;
let currentSlideIndex = 0;
let carouselMovies = [];
let allValidBackdropMovies = [];
let isHomeInitialized = false;

/**
 * Initialize Home Page
 */
async function initHome() {
    // If already loaded once, shuffle the carousel cache, reload categories randomly and render immediately
    if (isHomeInitialized && allValidBackdropMovies.length > 0) {
        const shuffled = allValidBackdropMovies.sort(() => 0.5 - Math.random());
        carouselMovies = shuffled.slice(0, 5);
        currentSlideIndex = 0;
        renderCarousel();
        startCarouselTimer();
        
        // Re-shuffle and load random category rows to keep layout fresh
        initHomeCategoryRows();
        initHomeSeriesCategoryRows();
        return;
    }
    
    try {
        // Fetch a larger pool of streams to have more options with backdrops
        const response = await fetch('api/vod_catalog.php?action=get_streams&limit=200');
        const data = await response.json();
        
        if (!data.success || !data.streams || data.streams.length === 0) {
            showCarouselError();
            return;
        }
        
        // Enrich VOD streams with TMDB details
        const enrichedStreams = typeof window.enrichIPTVListWithTMDB !== 'undefined'
            ? await window.enrichIPTVListWithTMDB(data.streams)
            : data.streams;
            
        // Filter to select only items that have a valid horizontal backdrop image from TMDB
        allValidBackdropMovies = enrichedStreams.filter(movie => movie.backdrop_path && movie.backdrop_path.trim() !== '');
        
        if (allValidBackdropMovies.length === 0) {
            showCarouselError();
            return;
        }
        
        // Shuffle array and take 5 random movies for the carousel
        const shuffledMovies = allValidBackdropMovies.sort(() => 0.5 - Math.random());
        carouselMovies = shuffledMovies.slice(0, 5);
        
        renderCarousel();
        startCarouselTimer();
        isHomeInitialized = true;
        
        // Load the movie and series random category carousels
        initHomeCategoryRows();
        initHomeSeriesCategoryRows();
        
    } catch (err) {
        console.error("Error loading home carousel:", err);
        showCarouselError();
    }
}

/**
 * Load 5 random movie categories as horizontal carousels
 */
async function initHomeCategoryRows() {
    if (!homeCategoriesContainer) return;
    
    // Show spinner inside container
    homeCategoriesContainer.innerHTML = `
        <div class="loading-categories" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; gap: 1rem; color: rgba(255,255,255,0.4); font-size: 1.1rem;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: var(--primary-color);"></i>
            Cargando filas de películas...
        </div>
    `;
    
    try {
        const catRes = await fetch('api/vod_catalog.php?action=get_categories&type=movie');
        const catData = await catRes.json();
        
        if (!catData.success || !catData.categories || catData.categories.length === 0) {
            homeCategoriesContainer.innerHTML = '';
            return;
        }
        
        // Select 5 random categories
        const shuffledCategories = catData.categories.sort(() => 0.5 - Math.random());
        const selectedCategories = shuffledCategories.slice(0, 5);
        
        homeCategoriesContainer.innerHTML = '';
        
        for (const cat of selectedCategories) {
            const rowId = `catRow-${cat.category_id}`;
            
            const rowElement = document.createElement('div');
            rowElement.className = 'home-category-row';
            rowElement.innerHTML = `
                <h3 class="home-category-title">${cat.category_name}</h3>
                <div class="home-category-carousel">
                    <div class="home-category-track" id="${rowId}">
                        <div class="loading-item" style="color: rgba(255,255,255,0.3); font-size: 0.95rem; padding: 1rem 0;">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando títulos...
                        </div>
                    </div>
                </div>
            `;
            homeCategoriesContainer.appendChild(rowElement);
            
            loadCategoryRowStreams(cat.category_id, rowId);
        }
        
    } catch (err) {
        console.error("Error loading home movie categories:", err);
        homeCategoriesContainer.innerHTML = '';
    }
}

/**
 * Fetch VOD streams for a single category, enrich them, filter out poster-less and render inside the row track
 */
async function loadCategoryRowStreams(categoryId, trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;
    
    try {
        const response = await fetch(`api/vod_catalog.php?action=get_streams&type=movie&category_id=${categoryId}&limit=15`);
        const data = await response.json();
        
        if (!data.success || !data.streams || data.streams.length === 0) {
            track.innerHTML = '<div class="loading-item" style="color: rgba(255,255,255,0.25);">No hay títulos en esta categoría.</div>';
            return;
        }
        
        // Enrich VOD streams with TMDB details
        const enrichedStreams = typeof window.enrichIPTVListWithTMDB !== 'undefined'
            ? await window.enrichIPTVListWithTMDB(data.streams)
            : data.streams;
            
        // Filter out movies that have neither TMDB poster nor IPTV stream icon
        const streamsWithPosters = enrichedStreams.filter(movie => 
            (movie.poster_path && movie.poster_path.trim() !== '') || 
            (movie.stream_icon && movie.stream_icon.trim() !== '')
        );
        
        track.innerHTML = '';
        
        if (streamsWithPosters.length === 0) {
            track.innerHTML = '<div class="loading-item" style="color: rgba(255,255,255,0.25);">No hay títulos con carátula en esta categoría.</div>';
            return;
        }
        
        streamsWithPosters.forEach(movie => {
            let posterUrl = '';
            if (movie.poster_path) {
                posterUrl = TMDB.getImageUrl(movie.poster_path, 'w342');
            } else {
                posterUrl = movie.stream_icon || (typeof window.getPosterFallback !== 'undefined' ? window.getPosterFallback(movie.name) : '');
            }
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => {
                if (typeof window.openMovieDetails !== 'undefined') {
                    window.openMovieDetails(movie);
                }
            };
            
            card.innerHTML = `
                <img src="${posterUrl}" alt="${movie.name}" loading="lazy" onerror="this.onerror=null; this.src='${typeof window.getPosterFallback !== 'undefined' ? window.getPosterFallback(movie.name) : ''}'">
                <div class="movie-card-info">
                    <div class="movie-card-title">${movie.name}</div>
                    <div class="movie-card-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
                </div>
            `;
            track.appendChild(card);
        });
        
    } catch (err) {
        console.error(`Error loading VOD streams for category ${categoryId}:`, err);
        track.innerHTML = '<div class="loading-item" style="color: #ff3b30;"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar.</div>';
    }
}

/**
 * Load 5 random series categories as horizontal carousels
 */
async function initHomeSeriesCategoryRows() {
    if (!homeSeriesCategoriesContainer) return;
    
    // Show spinner inside container
    homeSeriesCategoriesContainer.innerHTML = `
        <div class="loading-categories" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; gap: 1rem; color: rgba(255,255,255,0.4); font-size: 1.1rem;">
            <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.8rem; color: var(--primary-color);"></i>
            Cargando filas de series...
        </div>
    `;
    
    try {
        const catRes = await fetch('api/vod_catalog.php?action=get_categories&type=series');
        const catData = await catRes.json();
        
        if (!catData.success || !catData.categories || catData.categories.length === 0) {
            homeSeriesCategoriesContainer.innerHTML = '';
            return;
        }
        
        // Select 5 random categories
        const shuffledCategories = catData.categories.sort(() => 0.5 - Math.random());
        const selectedCategories = shuffledCategories.slice(0, 5);
        
        homeSeriesCategoriesContainer.innerHTML = '';
        
        for (const cat of selectedCategories) {
            const rowId = `seriesCatRow-${cat.category_id}`;
            
            const rowElement = document.createElement('div');
            rowElement.className = 'home-category-row';
            rowElement.innerHTML = `
                <h3 class="home-category-title" style="border-left-color: #007aff;">${cat.category_name}</h3>
                <div class="home-category-carousel">
                    <div class="home-category-track" id="${rowId}">
                        <div class="loading-item" style="color: rgba(255,255,255,0.3); font-size: 0.95rem; padding: 1rem 0;">
                            <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando series...
                        </div>
                    </div>
                </div>
            `;
            homeSeriesCategoriesContainer.appendChild(rowElement);
            
            loadSeriesCategoryRowStreams(cat.category_id, rowId);
        }
        
    } catch (err) {
        console.error("Error loading home series categories:", err);
        homeSeriesCategoriesContainer.innerHTML = '';
    }
}

/**
 * Fetch series streams for a single category, enrich them, filter out poster-less and render inside the row track
 */
async function loadSeriesCategoryRowStreams(categoryId, trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;
    
    try {
        const response = await fetch(`api/vod_catalog.php?action=get_streams&type=series&category_id=${categoryId}&limit=15`);
        const data = await response.json();
        
        if (!data.success || !data.streams || data.streams.length === 0) {
            track.innerHTML = '<div class="loading-item" style="color: rgba(255,255,255,0.25);">No hay series en esta categoría.</div>';
            return;
        }
        
        // Enrich VOD streams with TMDB details
        const enrichedStreams = typeof window.enrichIPTVSeriesListWithTMDB !== 'undefined'
            ? await window.enrichIPTVSeriesListWithTMDB(data.streams)
            : data.streams;
            
        // Filter out series that have neither TMDB poster nor IPTV cover/stream_icon
        const streamsWithPosters = enrichedStreams.filter(series => 
            (series.poster_path && series.poster_path.trim() !== '') || 
            (series.stream_icon && series.stream_icon.trim() !== '')
        );
        
        track.innerHTML = '';
        
        if (streamsWithPosters.length === 0) {
            track.innerHTML = '<div class="loading-item" style="color: rgba(255,255,255,0.25);">No hay series con carátula en esta categoría.</div>';
            return;
        }
        
        streamsWithPosters.forEach(series => {
            let posterUrl = '';
            if (series.poster_path) {
                posterUrl = TMDB.getImageUrl(series.poster_path, 'w342');
            } else {
                posterUrl = series.stream_icon || (typeof window.getSeriesPosterFallback !== 'undefined' ? window.getSeriesPosterFallback(series.name) : '');
            }
            const rating = series.vote_average ? series.vote_average.toFixed(1) : '';
            
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.onclick = () => {
                if (typeof window.openSeriesDetails !== 'undefined') {
                    window.openSeriesDetails(series);
                }
            };
            
            card.innerHTML = `
                <img src="${posterUrl}" alt="${series.name}" loading="lazy" onerror="this.onerror=null; this.src='${typeof window.getSeriesPosterFallback !== 'undefined' ? window.getSeriesPosterFallback(series.name) : ''}'">
                <div class="movie-card-info">
                    <div class="movie-card-title">${series.name}</div>
                    <div class="movie-card-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
                </div>
            `;
            track.appendChild(card);
        });
        
    } catch (err) {
        console.error(`Error loading series streams for category ${categoryId}:`, err);
        track.innerHTML = '<div class="loading-item" style="color: #ff3b30;"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar.</div>';
    }
}

/**
 * Render Carousel Slides and Dots
 */
function renderCarousel() {
    homeCarouselWrapper.innerHTML = '';
    homeCarouselDots.innerHTML = '';
    
    carouselMovies.forEach((movie, index) => {
        const backdropUrl = TMDB.getImageUrl(movie.backdrop_path, 'w1280');
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.0';
        const year = movie.release_date ? movie.release_date.split('-')[0] : '';
        const overview = movie.overview 
            ? (movie.overview.length > 200 ? movie.overview.substring(0, 200) + '...' : movie.overview) 
            : 'No hay descripción disponible.';
            
        // 1. Create Slide Element
        const slide = document.createElement('div');
        slide.className = `home-slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${backdropUrl}')`;
        
        slide.innerHTML = `
            <div class="home-slide-gradient"></div>
            <div class="home-slide-content">
                <h2 class="home-slide-title">${movie.name}</h2>
                <div class="home-slide-meta">
                    <span class="rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                    <span class="year">${year}</span>
                </div>
                <p class="home-slide-overview">${overview}</p>
                <div class="home-slide-actions">
                    <button class="slide-btn play-btn" id="carouselPlay-${index}">
                        <i class="fa-solid fa-play"></i> Ver Ahora
                    </button>
                    <button class="slide-btn info-btn" id="carouselInfo-${index}">
                        <i class="fa-solid fa-info-circle"></i> Información
                    </button>
                </div>
            </div>
        `;
        homeCarouselWrapper.appendChild(slide);
        
        // Wire Action Buttons
        setTimeout(() => {
            const playBtn = document.getElementById(`carouselPlay-${index}`);
            const infoBtn = document.getElementById(`carouselInfo-${index}`);
            
            if (playBtn) {
                playBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof window.openMovieDetails !== 'undefined') {
                        window.openMovieDetails(movie);
                        const playActionBtn = document.getElementById('movieDetailPlayBtn');
                        if (playActionBtn) {
                            playActionBtn.click();
                        }
                    }
                };
            }
            
            if (infoBtn) {
                infoBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof window.openMovieDetails !== 'undefined') {
                        window.openMovieDetails(movie);
                    }
                };
            }
        }, 100);
        
        // 2. Create Dot Indicator
        const dot = document.createElement('button');
        dot.className = `dot-indicator ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => {
            goToSlide(index);
        };
        homeCarouselDots.appendChild(dot);
    });
}

/**
 * Change Active Slide
 */
function goToSlide(index) {
    if (index === currentSlideIndex) return;
    
    const slides = homeCarouselWrapper.querySelectorAll('.home-slide');
    const dots = homeCarouselDots.querySelectorAll('.dot-indicator');
    
    if (slides.length === 0 || dots.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');
    
    currentSlideIndex = index;
    
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');
    
    startCarouselTimer();
}

/**
 * Start/Reset Carousel Auto-rotation Timer
 */
function startCarouselTimer() {
    if (homeCarouselTimer) {
        clearInterval(homeCarouselTimer);
    }
    
    homeCarouselTimer = setInterval(() => {
        const nextIndex = (currentSlideIndex + 1) % carouselMovies.length;
        goToSlide(nextIndex);
    }, 2000);
}

/**
 * Show Fallback error message inside Carousel
 */
function showCarouselError() {
    homeCarouselWrapper.innerHTML = `
        <div class="loading-carousel" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem; color: rgba(255,255,255,0.4); font-size: 1.2rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: #ff3b30;"></i>
            No se pudo cargar el carrusel de películas.
        </div>
    `;
}

// Expose globally
window.initHome = initHome;

// Auto-run on startup since Home is the default view
document.addEventListener('DOMContentLoaded', () => {
    const homeSection = document.getElementById('home-section');
    if (homeSection && !homeSection.classList.contains('hidden')) {
        initHome();
    }
});
