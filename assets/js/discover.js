/**
 * discover.js - IPTV Global Search Integration
 */

// DOM Elements
const discoverSection = document.getElementById('discover-section');
const discoverTokenError = document.getElementById('discoverTokenError');
const discoverContentWrapper = document.getElementById('discoverContentWrapper');
const searchInput = document.getElementById('searchInput');
const searchGridMovies = document.getElementById('searchGridMovies');
const searchGridSeries = document.getElementById('searchGridSeries');
const searchCategoryMovies = document.getElementById('searchCategoryMovies');
const searchCategorySeries = document.getElementById('searchCategorySeries');
const searchResultsLoader = document.getElementById('searchResultsLoader');
const searchResultsEmpty = document.getElementById('searchResultsEmpty');

// State
let searchTimeout = null;

/**
 * Initialize discover section
 */
function initDiscover() {
    // Search is local-first, always available even without TMDB token
    if (discoverTokenError) {
        discoverTokenError.classList.add('hidden');
    }
    if (discoverContentWrapper) {
        discoverContentWrapper.classList.remove('hidden');
    }
    
    // Auto-focus input when entering the section
    setTimeout(() => {
        if (searchInput) {
            searchInput.focus();
        }
    }, 100);
}

/**
 * Search Input Handler with Debounce
 */
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            // Clear results if query is empty or too short
            searchGridMovies.innerHTML = '';
            searchGridSeries.innerHTML = '';
            searchCategoryMovies.classList.add('hidden');
            searchCategorySeries.classList.add('hidden');
            searchResultsEmpty.classList.add('hidden');
            searchResultsLoader.classList.add('hidden');
            return;
        }
        
        // Show loader
        searchGridMovies.innerHTML = '';
        searchGridSeries.innerHTML = '';
        searchCategoryMovies.classList.add('hidden');
        searchCategorySeries.classList.add('hidden');
        searchResultsEmpty.classList.add('hidden');
        searchResultsLoader.classList.remove('hidden');
        
        // Set new timeout (Debounce 500ms)
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    });
}

/**
 * Perform IPTV Catalog Search
 */
async function performSearch(query) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`api/vod_catalog.php?action=search&query=${encodedQuery}`);
        const data = await response.json();
        
        searchResultsLoader.classList.add('hidden');
        
        if (!data.success) {
            searchResultsEmpty.classList.remove('hidden');
            return;
        }
        
        const movies = data.movies || [];
        const series = data.series || [];
        
        if (movies.length === 0 && series.length === 0) {
            searchResultsEmpty.classList.remove('hidden');
            return;
        }
        
        // Enrich results using the global helper functions from movies.js and series.js
        const enrichedMovies = typeof window.enrichIPTVListWithTMDB !== 'undefined' 
            ? await window.enrichIPTVListWithTMDB(movies) 
            : movies;
            
        const enrichedSeries = typeof window.enrichIPTVSeriesListWithTMDB !== 'undefined'
            ? await window.enrichIPTVSeriesListWithTMDB(series)
            : series;
            
        renderSearchResults(enrichedMovies, enrichedSeries);
        
    } catch (error) {
        console.error("Search Error:", error);
        searchResultsLoader.classList.add('hidden');
    }
}

/**
 * Render Search Results
 */
function renderSearchResults(movies, series) {
    searchGridMovies.innerHTML = '';
    searchGridSeries.innerHTML = '';
    
    const moviesWithPosters = movies.filter(movie => 
        (movie.poster_path && movie.poster_path.trim() !== '') || 
        (movie.stream_icon && movie.stream_icon.trim() !== '')
    );
    const seriesWithPosters = series.filter(item => 
        (item.poster_path && item.poster_path.trim() !== '') || 
        (item.stream_icon && item.stream_icon.trim() !== '')
    );
    
    let hasMovies = moviesWithPosters.length > 0;
    let hasSeries = seriesWithPosters.length > 0;
    
    // Render Movies
    moviesWithPosters.forEach(movie => {
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
        searchGridMovies.appendChild(card);
    });
    
    // Render Series
    seriesWithPosters.forEach(item => {
        let posterUrl = '';
        if (item.poster_path) {
            posterUrl = TMDB.getImageUrl(item.poster_path, 'w342');
        } else {
            posterUrl = item.stream_icon || (typeof window.getSeriesPosterFallback !== 'undefined' ? window.getSeriesPosterFallback(item.name) : '');
        }
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => {
            if (typeof window.openSeriesDetails !== 'undefined') {
                window.openSeriesDetails(item);
            }
        };
        
        card.innerHTML = `
            <img src="${posterUrl}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.src='${typeof window.getSeriesPosterFallback !== 'undefined' ? window.getSeriesPosterFallback(item.name) : ''}'">
            <div class="movie-card-info">
                <div class="movie-card-title">${item.name}</div>
                <div class="movie-card-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
            </div>
        `;
        searchGridSeries.appendChild(card);
    });
    
    // Toggle visibility based on content
    if (hasMovies) {
        searchCategoryMovies.classList.remove('hidden');
    } else {
        searchCategoryMovies.classList.add('hidden');
    }
    
    if (hasSeries) {
        searchCategorySeries.classList.remove('hidden');
    } else {
        searchCategorySeries.classList.add('hidden');
    }
}

// Expose init globally
window.initDiscover = initDiscover;

// Check if loaded directly
if (discoverSection && !discoverSection.classList.contains('hidden')) {
    initDiscover();
}
