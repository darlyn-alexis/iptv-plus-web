/**
 * movies.js - TMDB Movies Integration
 */

// TMDB Core handles URLs and Fetching

// DOM Elements
const moviesSection = document.getElementById('movies-section');
const moviesTokenError = document.getElementById('moviesTokenError');
const moviesContentWrapper = document.getElementById('moviesContentWrapper');
const movieHeroBanner = document.getElementById('movieHeroBanner');
const movieCategorySearch = document.getElementById('movieCategorySearch');
const movieCategoryList = document.getElementById('movieCategoryList');
const activeMovieCategoryTitle = document.getElementById('activeMovieCategoryTitle');
const movieStreamSearch = document.getElementById('movieStreamSearch');
const movieGrid = document.getElementById('movieGrid');

// Detail View Elements
const movieDetailBackdrop = document.getElementById('movieDetailBackdrop');
const movieDetailTitle = document.getElementById('movieDetailTitle');
const movieDetailRating = document.getElementById('movieDetailRating');
const movieDetailYear = document.getElementById('movieDetailYear');
const movieDetailGenres = document.getElementById('movieDetailGenres');
const movieDetailOverview = document.getElementById('movieDetailOverview');
const movieDetailPlayBtn = document.getElementById('movieDetailPlayBtn');
const movieDetailMatchStatus = document.getElementById('movieDetailMatchStatus');

// Video Player Elements
const movieVideoContainer = document.getElementById('movieVideoContainer');
const movieVideoPlayer = document.getElementById('movieVideoPlayer');
const movieCloseVideoBtn = document.getElementById('movieCloseVideoBtn');
const movieAudioBtn = document.getElementById('movieAudioBtn');
const movieAudioMenu = document.getElementById('movieAudioMenu');
const movieAudioMenuList = document.getElementById('movieAudioMenuList');

let movieMpegtsPlayer = null;

// State
let moviesCategoriesLoaded = false;
let rawMovieCategories = [];
let currentMovieCategoryId = null;
let allMovies = [];
let movieGenres = {};

function getPosterFallback(title) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e1e24"/>
                <stop offset="100%" stop-color="#121215"/>
            </linearGradient>
        </defs>
        <rect width="342" height="513" fill="url(#g)"/>
        <g transform="translate(171, 200) scale(1.5)">
            <rect x="-20" y="-15" width="40" height="30" rx="3" fill="#2c2c35" stroke="#48484a" stroke-width="2"/>
            <circle cx="-8" cy="-5" r="3" fill="#8e8e93"/>
            <circle cx="8" cy="-5" r="3" fill="#8e8e93"/>
            <polygon points="20,-5 35,-15 35,15 20,5" fill="#2c2c35" stroke="#48484a" stroke-width="2"/>
            <circle cx="-25" cy="-25" r="12" fill="#2c2c35" stroke="#48484a" stroke-width="2"/>
            <circle cx="5" cy="-25" r="12" fill="#2c2c35" stroke="#48484a" stroke-width="2"/>
        </g>
        <text x="50%" y="350" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#8e8e93" font-weight="600">Sin Carátula</text>
        <text x="50%" y="380" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#636366" font-weight="500">${title.substring(0, 25)}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/**
 * Initialize movies section
 */
function showTokenError() {
    moviesTokenError.classList.remove('hidden');
    moviesContentWrapper.classList.add('hidden');
}

/**
 * Stop any currently playing movie inline video
 */
window.stopMovieInlineVideo = function() {
    if (movieMpegtsPlayer) {
        try {
            movieMpegtsPlayer.pause();
            movieMpegtsPlayer.unload();
            movieMpegtsPlayer.detachMediaElement();
            movieMpegtsPlayer.destroy();
        } catch(e) {
            console.error("Error destroying movie mpegts player:", e);
        }
        movieMpegtsPlayer = null;
    }
    
    if (movieVideoPlayer) {
        if (!movieVideoPlayer.paused) {
            movieVideoPlayer.pause();
        }
        movieVideoPlayer.src = '';
        movieVideoPlayer.load();
    }
    if (movieVideoContainer) {
        movieVideoContainer.classList.add('hidden');
    }
    const movieDetailView = document.getElementById('movie-detail-view');
    if (movieDetailView) {
        movieDetailView.classList.remove('video-playing');
    }
};

if (movieCloseVideoBtn) {
    movieCloseVideoBtn.addEventListener('click', window.stopMovieInlineVideo);
}

function initMovies() {
    if (!TMDB.isValidToken()) {
        showTokenError();
    } else {
        moviesTokenError.classList.add('hidden');
        moviesContentWrapper.classList.remove('hidden');
        
        loadMovieCategories();
    }
}

// Fetch and load categories
async function loadMovieCategories() {
    if (moviesCategoriesLoaded) return;
    
    movieCategoryList.innerHTML = '<li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando categorías...</li>';
    
    try {
        const response = await fetch('api/vod_catalog.php?action=get_categories&type=movie');
        const res = await response.json();
        
        if (!res.success) throw new Error(res.message);
        
        rawMovieCategories = res.categories;
        renderMovieCategories();
        moviesCategoriesLoaded = true;
        
        // Auto select first category if available
        if (rawMovieCategories.length > 0) {
            selectMovieCategory(String(rawMovieCategories[0].category_id), rawMovieCategories[0].category_name);
        }
    } catch (error) {
        console.error('Error al cargar categorías de películas:', error);
        movieCategoryList.innerHTML = '<li class="loading-item" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i> Error al cargar.</li>';
    }
}

// Render category list
function renderMovieCategories() {
    movieCategoryList.innerHTML = '';
    const query = movieCategorySearch.value.toLowerCase().trim();

    const filtered = rawMovieCategories.filter(cat => 
        cat.category_name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        movieCategoryList.innerHTML = '<li class="loading-item">Sin resultados</li>';
        return;
    }

    filtered.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (currentMovieCategoryId === String(cat.category_id)) {
            li.classList.add('active');
        }
        li.setAttribute('data-id', cat.category_id);
        li.textContent = cat.category_name;
        
        li.addEventListener('click', () => {
            document.querySelectorAll('#movieCategoryList .category-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            selectMovieCategory(String(cat.category_id), cat.category_name);
        });

        movieCategoryList.appendChild(li);
    });
}

// Select category and fetch streams
async function selectMovieCategory(categoryId, categoryName) {
    currentMovieCategoryId = categoryId;
    activeMovieCategoryTitle.textContent = categoryName;
    movieStreamSearch.value = '';
    
    movieGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Cargando películas...</p></div>';
    
    try {
        const response = await fetch(`api/vod_catalog.php?action=get_streams&type=movie&category_id=${encodeURIComponent(categoryId)}`);
        const res = await response.json();
        
        if (!res.success) throw new Error(res.message);
        
        allMovies = res.streams;
        
        // Enrich the top 30 movies with TMDB metadata for high performance
        const topMovies = allMovies.slice(0, 30);
        const remainingMovies = allMovies.slice(30);
        
        const enrichedTop = await enrichIPTVListWithTMDB(topMovies);
        const finalMovies = enrichedTop.concat(remainingMovies.map(m => ({
            ...m,
            poster_path: null,
            backdrop_path: null,
            overview: "Sin descripción disponible.",
            vote_average: parseFloat(m.rating) || 0.0,
            release_date: ""
        })));
        
        allMovies = finalMovies;
        
        renderMovieGrid(allMovies);
        
        // Update Hero Banner with first movie
        if (allMovies.length > 0) {
            renderHeroBanner(allMovies[0]);
        } else {
            movieHeroBanner.style.backgroundImage = '';
            movieHeroBanner.innerHTML = '';
        }
    } catch (error) {
        console.error('Error al cargar películas de la categoría:', error);
        movieGrid.innerHTML = '<div class="empty-state" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i><p>Error al cargar películas.</p></div>';
    }
}

// Render movie grid
function renderMovieGrid(movies) {
    movieGrid.innerHTML = '';
    
    const moviesWithPosters = movies.filter(movie => 
        (movie.poster_path && movie.poster_path.trim() !== '') || 
        (movie.stream_icon && movie.stream_icon.trim() !== '')
    );
    
    if (moviesWithPosters.length === 0) {
        movieGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-film"></i><p>No hay películas con carátula en esta categoría.</p></div>';
        return;
    }

    moviesWithPosters.forEach(movie => {
        let posterUrl = '';
        if (movie.poster_path) {
            posterUrl = TMDB.getImageUrl(movie.poster_path, 'w342');
        } else {
            posterUrl = movie.stream_icon || getPosterFallback(movie.name);
        }
        
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => openMovieDetails(movie);
        
        card.innerHTML = `
            <img src="${posterUrl}" alt="${movie.name}" loading="lazy" onerror="this.onerror=null; this.src='${getPosterFallback(movie.name)}'">
            <div class="movie-card-info">
                <div class="movie-card-title">${movie.name}</div>
                <div class="movie-card-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
            </div>
        `;
        
        movieGrid.appendChild(card);
    });
}

// Search input handlers
movieCategorySearch.addEventListener('input', () => {
    renderMovieCategories();
});

movieStreamSearch.addEventListener('input', () => {
    const query = movieStreamSearch.value.toLowerCase().trim();
    const filtered = allMovies.filter(movie => 
        movie.name.toLowerCase().includes(query)
    );
    renderMovieGrid(filtered);
});

/**
 * Helper to fetch TMDB metadata for a list of IPTV items in parallel
 */
async function enrichIPTVListWithTMDB(items) {
    const promises = items.map(async (item) => {
        let tmdbData = null;
        
        // 1. Try to fetch directly by TMDB ID if present in the IPTV stream data
        if (item.tmdb_id && String(item.tmdb_id).trim() !== '' && String(item.tmdb_id) !== '0') {
            try {
                tmdbData = await TMDB.fetch(`/movie/${item.tmdb_id}?language=es-ES`);
            } catch (e) {
                console.warn(`Could not fetch details by TMDB ID ${item.tmdb_id} for movie: ${item.name}`, e);
            }
        }
        
        // 2. Fallback to searching TMDB by name if direct lookup didn't yield results
        if (!tmdbData) {
            try {
                const cleanedName = item.name
                    .replace(/\[[^\]]*\]/g, '')
                    .replace(/\[/g, '')
                    .replace(/\]/g, '')
                    .replace(/[()]/g, ' ')
                    .replace(/[._]/g, ' ')
                    .replace(/\b(1080p|720p|4k|uhd|h264|hevc|x264|x265|dual|latino|castellano|sub|eng|esp|dsnp|nf|netflix|amzn|prime|hbo|max|hmax|aptv|apple|hulu|paramount|r\d+|dv|hdr|sdr|lat|hd|sd|fhd|cam|ts|hq|bluray|web-dl|webdl|dvdrip|rip|xvid|multi|spanish|english|bdrip)\b/gi, '')
                    .replace(/[-\s]+$/, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (cleanedName !== '') {
                    const query = encodeURIComponent(cleanedName);
                    const searchRes = await TMDB.fetch(`/search/movie?query=${query}&language=es-ES&page=1`);
                    if (searchRes && searchRes.results && searchRes.results.length > 0) {
                        tmdbData = searchRes.results[0];
                    }
                }
            } catch (e) {
                console.warn("Error searching TMDB by name for movie:", item.name, e);
            }
        }
        
        // 3. Map findings or fall back to IPTV cover/metadata
        if (tmdbData) {
            return {
                ...item,
                tmdb_id: tmdbData.id,
                poster_path: tmdbData.poster_path,
                backdrop_path: tmdbData.backdrop_path,
                overview: tmdbData.overview || "Sin descripción disponible.",
                vote_average: tmdbData.vote_average,
                release_date: tmdbData.release_date || ""
            };
        }
        
        // Fallback: Use IPTV stream_icon if available
        return {
            ...item,
            poster_path: null,
            backdrop_path: null,
            overview: "Disponible en el catálogo IPTV.",
            vote_average: parseFloat(item.rating) || 0.0,
            release_date: ""
        };
    });
    return Promise.all(promises);
}

/**
 * Render the Hero Banner
 */
function renderHeroBanner(movie) {
    let backdropUrl = '';
    if (movie.backdrop_path) {
        backdropUrl = TMDB.getImageUrl(movie.backdrop_path, 'original');
    } else {
        backdropUrl = movie.stream_icon || '';
    }
    
    movieHeroBanner.style.backgroundImage = `url('${backdropUrl}')`;
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    movieHeroBanner.innerHTML = `
        <div class="hero-content">
            <h1 class="hero-title">${movie.name}</h1>
            <div class="hero-meta">
                <span class="hero-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                <span>${movie.release_date ? movie.release_date.split('-')[0] : ''}</span>
            </div>
            <p class="hero-overview">${movie.overview}</p>
            <button class="hero-btn" id="movieHeroBtn">
                <i class="fa-solid fa-info-circle"></i> Más Información
            </button>
        </div>
    `;

    document.getElementById('movieHeroBtn').onclick = () => {
        openMovieDetails(movie);
    };
}

/**
 * Open Movie Details View
 */
let selectedMovieMatch = null;

function openMovieDetails(movie) {
    if (movie.backdrop_path) {
        const backdropUrl = TMDB.getImageUrl(movie.backdrop_path, 'w1280');
        movieDetailBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    } else {
        movieDetailBackdrop.style.backgroundImage = movie.stream_icon ? `url('${movie.stream_icon}')` : '';
    }
    
    movieDetailTitle.textContent = movie.name;
    movieDetailRating.innerHTML = `<i class="fa-solid fa-star"></i> ${movie.vote_average.toFixed(1)}`;
    movieDetailYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : '';
    
    movieDetailGenres.textContent = movie.container_extension ? movie.container_extension.toUpperCase() : 'MP4';
    movieDetailOverview.textContent = movie.overview || "No hay descripción disponible.";
    
    selectedMovieMatch = {
        id: movie.id,
        name: movie.name,
        container_extension: movie.container_extension || 'mp4'
    };
    
    movieDetailMatchStatus.className = 'match-status found';
    movieDetailMatchStatus.innerHTML = '<i class="fa-solid fa-check-circle"></i> Recurso disponible';
    movieDetailMatchStatus.onclick = null;
    
    movieDetailPlayBtn.disabled = false;
    movieDetailPlayBtn.style.opacity = '1';
    
    movieDetailPlayBtn.onclick = () => {
        if (selectedMovieMatch) {
            const streamId = selectedMovieMatch.id;
            const ext = selectedMovieMatch.container_extension || '';
            const streamUrl = `api/stream.php?type=movie&stream_id=${streamId}&extension=${ext}`;
            
            movieVideoContainer.classList.remove('hidden');
            const movieDetailView = document.getElementById('movie-detail-view');
            if (movieDetailView) {
                movieDetailView.classList.add('video-playing');
            }
            
            if (ext.toLowerCase() === 'ts') {
                if (typeof mpegts !== 'undefined' && mpegts.getFeatureList().mseLivePlayback) {
                    movieMpegtsPlayer = mpegts.createPlayer({
                        type: 'mpegts',
                        url: streamUrl,
                        isLive: false
                    });
                    movieMpegtsPlayer.attachMediaElement(movieVideoPlayer);
                    movieMpegtsPlayer.load();
                    movieMpegtsPlayer.play().catch(err => {
                        console.error("mpegts.js Play error:", err);
                    });
                } else {
                    alert("Tu navegador no soporta mpegts.js para reproducir archivos TS.");
                }
            } else {
                movieVideoPlayer.src = streamUrl;
                movieVideoPlayer.play().catch(err => {
                    console.error("Autoplay prevented or video error:", err);
                    alert("El formato de este video podría no ser soportado nativamente por tu navegador o requieres interactuar para iniciar el audio.");
                });
            }
        }
    };
    
    if (window.showSection) {
        window.showSection('movie-detail-view');
    }
}

/**
 * Close Modal
 */
// No modal click listeners needed since back button handles closing

// Setup custom controls for movie player
function initVODPlayerControls(
    videoPlayer, videoContainer, controlsEl, seekSlider, progressFill,
    playPauseBtn, rewindBtn, forwardBtn, muteBtn, volumeSlider,
    currentTimeText, durationText, fullscreenBtn
) {
    let controlsTimeout;

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return "00:00:00";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    }

    function togglePlayPause() {
        if (videoPlayer.paused) {
            videoPlayer.play().catch(e => console.warn(e));
        } else {
            videoPlayer.pause();
        }
    }

    function updatePlayPauseIcon() {
        if (videoPlayer.paused) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        } else {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        }
    }

    function updateVolumeIcon() {
        if (volumeSlider) {
            volumeSlider.value = videoPlayer.volume;
        }
        if (videoPlayer.muted || videoPlayer.volume === 0) {
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        } else if (videoPlayer.volume < 0.5) {
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
        } else {
            muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        }
    }

    // Play/Pause handlers
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    videoPlayer.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
    });

    videoPlayer.addEventListener('play', updatePlayPauseIcon);
    videoPlayer.addEventListener('pause', updatePlayPauseIcon);

    // Skip handlers
    rewindBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
    });

    forwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoPlayer.currentTime = Math.min(videoPlayer.duration || 0, videoPlayer.currentTime + 10);
    });

    // Volume handlers
    muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeIcon();
    });

    volumeSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        videoPlayer.volume = volumeSlider.value;
        videoPlayer.muted = videoPlayer.volume === 0;
        updateVolumeIcon();
    });

    videoPlayer.addEventListener('volumechange', updateVolumeIcon);

    // Seek/Progress handlers
    videoPlayer.addEventListener('timeupdate', () => {
        if (videoPlayer.duration) {
            const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            seekSlider.value = pct;
            progressFill.style.width = pct + '%';
        }
        currentTimeText.textContent = formatTime(videoPlayer.currentTime);
    });

    videoPlayer.addEventListener('durationchange', () => {
        durationText.textContent = formatTime(videoPlayer.duration);
    });

    videoPlayer.addEventListener('loadedmetadata', () => {
        durationText.textContent = formatTime(videoPlayer.duration);
    });

    seekSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        if (videoPlayer.duration) {
            const time = (seekSlider.value / 100) * videoPlayer.duration;
            videoPlayer.currentTime = time;
            progressFill.style.width = seekSlider.value + '%';
        }
    });

    // Fullscreen handler
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });
    
    // Audio Tracks handler
    const audioBtn = videoContainer.querySelector('.audio-btn');
    const audioMenu = videoContainer.querySelector('.audio-menu');
    const audioMenuList = videoContainer.querySelector('.audio-menu-list');

    if (audioBtn && audioMenu && audioMenuList) {
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            audioMenu.classList.toggle('hidden');
            if (!audioMenu.classList.contains('hidden')) {
                renderAudioTracks();
            }
        });

        document.addEventListener('click', () => {
            audioMenu.classList.add('hidden');
        });

        audioMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        function renderAudioTracks() {
            audioMenuList.innerHTML = '';
            if (videoPlayer.audioTracks && videoPlayer.audioTracks.length > 0) {
                for (let i = 0; i < videoPlayer.audioTracks.length; i++) {
                    const track = videoPlayer.audioTracks[i];
                    const item = document.createElement('div');
                    item.className = `audio-track-item ${track.enabled ? 'active' : ''}`;
                    item.textContent = track.label || track.language || `Audio ${i + 1}`;
                    
                    item.onclick = () => {
                        for (let j = 0; j < videoPlayer.audioTracks.length; j++) {
                            videoPlayer.audioTracks[j].enabled = (j === i);
                        }
                        renderAudioTracks();
                        audioMenu.classList.add('hidden');
                    };
                    audioMenuList.appendChild(item);
                }
            } else {
                const item = document.createElement('div');
                item.className = 'audio-track-item active';
                item.textContent = 'Audio Original (Por Defecto)';
                audioMenuList.appendChild(item);
            }
        }
        
        videoPlayer.addEventListener('loadedmetadata', () => {
            if (!audioMenu.classList.contains('hidden')) {
                renderAudioTracks();
            }
        });
    }

    // Auto-hide controls helper
    function resetControlsTimeout() {
        videoContainer.classList.remove('hide-controls');
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused) {
                videoContainer.classList.add('hide-controls');
            }
        }, 3000);
    }

    videoContainer.addEventListener('mousemove', resetControlsTimeout);
    videoContainer.addEventListener('mouseleave', () => {
        if (!videoPlayer.paused) {
            videoContainer.classList.add('hide-controls');
        }
    });

    // Initial icon state
    updatePlayPauseIcon();
    updateVolumeIcon();
}

// Initialize custom controls for movie player on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initVODPlayerControls(
        document.getElementById('movieVideoPlayer'),
        document.getElementById('movieVideoContainer'),
        document.getElementById('movieVideoControls'),
        document.getElementById('movieSeekSlider'),
        document.getElementById('movieProgressFill'),
        document.getElementById('moviePlayPauseBtn'),
        document.getElementById('movieRewindBtn'),
        document.getElementById('movieForwardBtn'),
        document.getElementById('movieMuteBtn'),
        document.getElementById('movieVolumeSlider'),
        document.getElementById('movieCurrentTime'),
        document.getElementById('movieDuration'),
        document.getElementById('movieFullscreenBtn')
    );
});

// Expose VOD setup globally so series.js can use it too
window.initVODPlayerControls = initVODPlayerControls;

// Expose init function globally so tv.js can call it when switching to the movies section
window.initMovies = initMovies;
window.openMovieDetails = openMovieDetails;

// If we are already on the movies section on load (unlikely but possible), init it
if (!moviesSection.classList.contains('hidden')) {
    initMovies();
}
