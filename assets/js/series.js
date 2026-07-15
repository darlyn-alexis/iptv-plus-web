/**
 * series.js - TMDB Series Integration
 */

// DOM Elements
const seriesSection = document.getElementById('series-section');
const seriesTokenError = document.getElementById('seriesTokenError');
const seriesContentWrapper = document.getElementById('seriesContentWrapper');
const seriesHeroBanner = document.getElementById('seriesHeroBanner');
const seriesCategorySearch = document.getElementById('seriesCategorySearch');
const seriesCategoryList = document.getElementById('seriesCategoryList');
const activeSeriesCategoryTitle = document.getElementById('activeSeriesCategoryTitle');
const seriesStreamSearch = document.getElementById('seriesStreamSearch');
const seriesGrid = document.getElementById('seriesGrid');

// Detail View Elements
const seriesDetailBackdrop = document.getElementById('seriesDetailBackdrop');
const seriesDetailTitle = document.getElementById('seriesDetailTitle');
const seriesDetailRating = document.getElementById('seriesDetailRating');
const seriesDetailYear = document.getElementById('seriesDetailYear');
const seriesDetailSeasons = document.getElementById('seriesDetailSeasons');
const seriesDetailGenres = document.getElementById('seriesDetailGenres');
const seriesDetailOverview = document.getElementById('seriesDetailOverview');
const seriesDetailPlayBtn = document.getElementById('seriesDetailPlayBtn');
const seriesDetailMatchStatus = document.getElementById('seriesDetailMatchStatus');
const seriesSeasonSelect = document.getElementById('seriesSeasonSelect');
const seriesEpisodesGrid = document.getElementById('seriesEpisodesGrid');

// Video Player Elements
const seriesVideoContainer = document.getElementById('seriesVideoContainer');
const seriesVideoPlayer = document.getElementById('seriesVideoPlayer');
const seriesCloseVideoBtn = document.getElementById('seriesCloseVideoBtn');

let seriesMpegtsPlayer = null;

// State
let seriesCategoriesLoaded = false;
let rawSeriesCategories = [];
let currentSeriesCategoryId = null;
let allSeries = [];
let seriesGenres = {};

function getSeriesPosterFallback(title) {
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

function showSeriesTokenError() {
    seriesTokenError.classList.remove('hidden');
    seriesContentWrapper.classList.add('hidden');
}

/**
 * Stop any currently playing series inline video
 */
window.stopSeriesInlineVideo = function() {
    if (seriesMpegtsPlayer) {
        try {
            seriesMpegtsPlayer.pause();
            seriesMpegtsPlayer.unload();
            seriesMpegtsPlayer.detachMediaElement();
            seriesMpegtsPlayer.destroy();
        } catch(e) {
            console.error("Error destroying series mpegts player:", e);
        }
        seriesMpegtsPlayer = null;
    }
    
    if (seriesVideoPlayer) {
        if (!seriesVideoPlayer.paused) {
            seriesVideoPlayer.pause();
        }
        seriesVideoPlayer.src = '';
        seriesVideoPlayer.load();
    }
    if (seriesVideoContainer) {
        seriesVideoContainer.classList.add('hidden');
    }
    const seriesDetailView = document.getElementById('series-detail-view');
    if (seriesDetailView) {
        seriesDetailView.classList.remove('video-playing');
    }
};

if (seriesCloseVideoBtn) {
    seriesCloseVideoBtn.addEventListener('click', window.stopSeriesInlineVideo);
}

function initSeries() {
    if (!TMDB.isValidToken()) {
        showSeriesTokenError();
    } else {
        seriesTokenError.classList.add('hidden');
        seriesContentWrapper.classList.remove('hidden');
        
        loadSeriesCategories();
    }
}

/**
 * Main function to load all TMDB series data
 */
// Fetch and load categories
async function loadSeriesCategories() {
    if (seriesCategoriesLoaded) return;
    
    seriesCategoryList.innerHTML = '<li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando categorías...</li>';
    
    try {
        const response = await fetch('api/vod_catalog.php?action=get_categories&type=series');
        const res = await response.json();
        
        if (!res.success) throw new Error(res.message);
        
        rawSeriesCategories = res.categories;
        renderSeriesCategories();
        seriesCategoriesLoaded = true;
        
        // Auto select first category if available
        if (rawSeriesCategories.length > 0) {
            selectSeriesCategory(String(rawSeriesCategories[0].category_id), rawSeriesCategories[0].category_name);
        }
    } catch (error) {
        console.error('Error al cargar categorías de series:', error);
        seriesCategoryList.innerHTML = '<li class="loading-item" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i> Error al cargar.</li>';
    }
}

// Render category list
function renderSeriesCategories() {
    seriesCategoryList.innerHTML = '';
    const query = seriesCategorySearch.value.toLowerCase().trim();

    const filtered = rawSeriesCategories.filter(cat => 
        cat.category_name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        seriesCategoryList.innerHTML = '<li class="loading-item">Sin resultados</li>';
        return;
    }

    filtered.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (currentSeriesCategoryId === String(cat.category_id)) {
            li.classList.add('active');
        }
        li.setAttribute('data-id', cat.category_id);
        li.textContent = cat.category_name;
        
        li.addEventListener('click', () => {
            document.querySelectorAll('#seriesCategoryList .category-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            selectSeriesCategory(String(cat.category_id), cat.category_name);
        });

        seriesCategoryList.appendChild(li);
    });
}

// Select category and fetch streams
async function selectSeriesCategory(categoryId, categoryName) {
    currentSeriesCategoryId = categoryId;
    activeSeriesCategoryTitle.textContent = categoryName;
    seriesStreamSearch.value = '';
    
    seriesGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Cargando series...</p></div>';
    
    try {
        const response = await fetch(`api/vod_catalog.php?action=get_streams&type=series&category_id=${encodeURIComponent(categoryId)}`);
        const res = await response.json();
        
        if (!res.success) throw new Error(res.message);
        
        allSeries = res.streams;
        
        // Enrich the top 30 series with TMDB metadata for high performance
        const topSeries = allSeries.slice(0, 30);
        const remainingSeries = allSeries.slice(30);
        
        const enrichedTop = await enrichIPTVSeriesListWithTMDB(topSeries);
        const finalSeries = enrichedTop.concat(remainingSeries.map(s => ({
            ...s,
            poster_path: null,
            backdrop_path: null,
            overview: "Sin descripción disponible.",
            vote_average: parseFloat(s.rating) || 0.0,
            first_air_date: ""
        })));
        
        allSeries = finalSeries;
        
        renderSeriesGrid(allSeries);
        
        // Update Hero Banner with first series
        if (allSeries.length > 0) {
            renderSeriesHeroBanner(allSeries[0]);
        } else {
            seriesHeroBanner.style.backgroundImage = '';
            seriesHeroBanner.innerHTML = '';
        }
    } catch (error) {
        console.error('Error al cargar series de la categoría:', error);
        seriesGrid.innerHTML = '<div class="empty-state" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i><p>Error al cargar series.</p></div>';
    }
}

// Render series grid
function renderSeriesGrid(seriesList) {
    seriesGrid.innerHTML = '';
    
    const seriesWithPosters = seriesList.filter(series => 
        (series.poster_path && series.poster_path.trim() !== '') || 
        (series.stream_icon && series.stream_icon.trim() !== '')
    );
    
    if (seriesWithPosters.length === 0) {
        seriesGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-tv"></i><p>No hay series con carátula en esta categoría.</p></div>';
        return;
    }

    seriesWithPosters.forEach(series => {
        let posterUrl = '';
        if (series.poster_path) {
            posterUrl = TMDB.getImageUrl(series.poster_path, 'w342');
        } else {
            posterUrl = series.stream_icon || getSeriesPosterFallback(series.name);
        }
        
        const rating = series.vote_average ? series.vote_average.toFixed(1) : '';
        
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => openSeriesDetails(series);
        
        card.innerHTML = `
            <img src="${posterUrl}" alt="${series.name}" loading="lazy" onerror="this.onerror=null; this.src='${getSeriesPosterFallback(series.name)}'">
            <div class="movie-card-info">
                <div class="movie-card-title">${series.name}</div>
                <div class="movie-card-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
            </div>
        `;
        
        seriesGrid.appendChild(card);
    });
}

// Search input handlers
seriesCategorySearch.addEventListener('input', () => {
    renderSeriesCategories();
});

seriesStreamSearch.addEventListener('input', () => {
    const query = seriesStreamSearch.value.toLowerCase().trim();
    const filtered = allSeries.filter(series => 
        series.name.toLowerCase().includes(query)
    );
    renderSeriesGrid(filtered);
});

/**
 * Helper to fetch TMDB metadata for a list of IPTV series items in parallel
 */
async function enrichIPTVSeriesListWithTMDB(items) {
    const promises = items.map(async (item) => {
        let tmdbData = null;
        
        // 1. Try to fetch directly by TMDB ID if present in the IPTV stream data
        if (item.tmdb_id && String(item.tmdb_id).trim() !== '' && String(item.tmdb_id) !== '0') {
            try {
                tmdbData = await TMDB.fetch(`/tv/${item.tmdb_id}?language=es-ES`);
            } catch (e) {
                console.warn(`Could not fetch details by TMDB ID ${item.tmdb_id} for series: ${item.name}`, e);
            }
        }
        
        // 2. Fallback to searching TMDB by name if direct lookup didn't yield results
        if (!tmdbData) {
            try {
                const cleanedName = item.name
                    .replace(/\[[^\]]*\]/g, '')
                    .replace(/\[/g, '')
                    .replace(/\]/g, '')
                    .replace(/\([^)]*\)/g, '')
                    .replace(/[._]/g, ' ')
                    .replace(/\b(1080p|720p|4k|uhd|h264|hevc|x264|x265|dual|latino|castellano|sub|eng|esp|dsnp|nf|netflix|amzn|prime|hbo|max|hmax|aptv|apple|hulu|paramount|r\d+|dv|hdr|sdr|lat|hd|sd|fhd|cam|ts|hq|bluray|web-dl|webdl|dvdrip|rip|xvid|multi|spanish|english|bdrip)\b/gi, '')
                    .replace(/[-\s]+$/, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (cleanedName !== '') {
                    const query = encodeURIComponent(cleanedName);
                    const searchRes = await TMDB.fetch(`/search/tv?query=${query}&language=es-ES&page=1`);
                    if (searchRes && searchRes.results && searchRes.results.length > 0) {
                        tmdbData = searchRes.results[0];
                    }
                }
            } catch (e) {
                console.warn("Error searching TMDB by name for series:", item.name, e);
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
                first_air_date: tmdbData.first_air_date || ""
            };
        }
        
        // Fallback: Use IPTV stream_icon if available
        return {
            ...item,
            poster_path: null,
            backdrop_path: null,
            overview: "Disponible en el catálogo IPTV.",
            vote_average: parseFloat(item.rating) || 0.0,
            first_air_date: ""
        };
    });
    return Promise.all(promises);
}

function renderSeriesHeroBanner(series) {
    let backdropUrl = '';
    if (series.backdrop_path) {
        backdropUrl = TMDB.getImageUrl(series.backdrop_path, 'original');
    } else {
        backdropUrl = series.stream_icon || '';
    }
    
    seriesHeroBanner.style.backgroundImage = `url('${backdropUrl}')`;
    
    const rating = series.vote_average ? series.vote_average.toFixed(1) : 'N/A';
    
    seriesHeroBanner.innerHTML = `
        <div class="hero-content">
            <h1 class="hero-title">${series.name}</h1>
            <div class="hero-meta">
                <span class="hero-rating"><i class="fa-solid fa-star"></i> ${rating}</span>
                <span>${series.first_air_date ? series.first_air_date.split('-')[0] : ''}</span>
            </div>
            <p class="hero-overview">${series.overview}</p>
            <button class="hero-btn" id="seriesHeroBtn">
                <i class="fa-solid fa-info-circle"></i> Más Información
            </button>
        </div>
    `;

    document.getElementById('seriesHeroBtn').onclick = () => {
        openSeriesDetails(series);
    };
}

let selectedSeriesMatch = null;
let currentSeriesInfo = null;
let currentSeriesName = '';

async function openSeriesDetails(series) {
    currentSeriesName = series.name || '';
    if (series.backdrop_path) {
        const backdropUrl = TMDB.getImageUrl(series.backdrop_path, 'w1280');
        seriesDetailBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    } else {
        seriesDetailBackdrop.style.backgroundImage = series.stream_icon ? `url('${series.stream_icon}')` : '';
    }
    
    seriesDetailTitle.textContent = series.name;
    seriesDetailRating.innerHTML = `<i class="fa-solid fa-star"></i> ${series.vote_average.toFixed(1)}`;
    seriesDetailYear.textContent = series.first_air_date ? series.first_air_date.split('-')[0] : '';
    
    seriesDetailGenres.textContent = series.container_extension ? series.container_extension.toUpperCase() : 'MP4';
    seriesDetailOverview.textContent = series.overview || "No hay descripción disponible.";
    
    seriesSeasonSelect.innerHTML = '<option value="">Cargando temporadas...</option>';
    seriesEpisodesGrid.innerHTML = '<div class="loading-item" style="grid-column: 1/-1;"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando capítulos de IPTV...</div>';
    
    if (window.showSection) {
        window.showSection('series-detail-view');
    }

    try {
        const response = await fetch(`api/series_info.php?series_id=${series.id}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || "Error al cargar capítulos");
        }
        
        currentSeriesInfo = data;
        
        seriesSeasonSelect.innerHTML = '';
        const seasons = data.seasons || [];
        const episodesDict = data.episodes || {};
        
        const validSeasons = seasons.filter(s => {
            const num = String(s.season_number);
            return episodesDict[num] && episodesDict[num].length > 0;
        });
        
        if (validSeasons.length === 0) {
            seriesSeasonSelect.innerHTML = '<option value="">Sin temporadas</option>';
            seriesEpisodesGrid.innerHTML = '<div class="loading-item" style="grid-column: 1/-1;">No hay episodios disponibles para esta serie en IPTV.</div>';
            return;
        }
        
        validSeasons.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.season_number;
            opt.textContent = s.name || `Temporada ${s.season_number}`;
            seriesSeasonSelect.appendChild(opt);
        });
        
        seriesDetailSeasons.textContent = validSeasons.length === 1 ? '1 Temporada' : `${validSeasons.length} Temporadas`;
        
        renderSeasonEpisodes(validSeasons[0].season_number);
        
        seriesSeasonSelect.onchange = (e) => {
            renderSeasonEpisodes(e.target.value);
        };
        
    } catch (err) {
        console.error("Error loading series info:", err);
        seriesEpisodesGrid.innerHTML = '<div class="loading-item" style="color: #ff453a; grid-column: 1/-1;"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar episodios del servidor IPTV.</div>';
    }
}

function renderSeasonEpisodes(seasonNum) {
    seriesEpisodesGrid.innerHTML = '';
    
    if (!currentSeriesInfo || !currentSeriesInfo.episodes) return;
    
    const episodes = currentSeriesInfo.episodes[String(seasonNum)] || [];
    
    if (episodes.length === 0) {
        seriesEpisodesGrid.innerHTML = '<div class="loading-item" style="grid-column: 1/-1;">No hay capítulos en esta temporada.</div>';
        return;
    }
    
    episodes.forEach(ep => {
        let thumbUrl = '';
        if (ep.info && ep.info.movie_image && ep.info.movie_image.trim() !== '') {
            thumbUrl = ep.info.movie_image;
        } else {
            thumbUrl = 'assets/img/poster-fallback.png';
        }
        
        const card = document.createElement('div');
        card.className = 'episode-card';
        
        card.onclick = () => {
            const streamId = ep.id;
            const ext = ep.container_extension || 'mp4';
            const streamUrl = `api/stream.php?type=series&stream_id=${streamId}&extension=${ext}`;
            
            // Update synopsis text with the episode description or custom playback template
            const epNum = ep.episode_num || '';
            const epPlot = (ep.info && ep.info.plot && ep.info.plot.trim() !== '') 
                ? ep.info.plot 
                : `Estás viendo: ${currentSeriesName} - Temporada ${seasonNum} Capítulo ${epNum}`;
            seriesDetailOverview.textContent = epPlot;
            
            seriesVideoContainer.classList.remove('hidden');
            const seriesDetailView = document.getElementById('series-detail-view');
            if (seriesDetailView) {
                seriesDetailView.classList.add('video-playing');
            }
            
            if (ext.toLowerCase() === 'ts') {
                if (typeof mpegts !== 'undefined' && mpegts.getFeatureList().mseLivePlayback) {
                    if (seriesMpegtsPlayer) {
                        seriesMpegtsPlayer.destroy();
                    }
                    seriesMpegtsPlayer = mpegts.createPlayer({
                        type: 'mpegts',
                        url: streamUrl,
                        isLive: false
                    });
                    seriesMpegtsPlayer.attachMediaElement(seriesVideoPlayer);
                    seriesMpegtsPlayer.load();
                    seriesMpegtsPlayer.play().catch(err => {
                        console.error("mpegts.js Play error:", err);
                    });
                } else {
                    alert("Tu navegador no soporta mpegts.js para reproducir archivos TS.");
                }
            } else {
                seriesVideoPlayer.src = streamUrl;
                seriesVideoPlayer.play().catch(err => {
                    console.error("Autoplay prevented or video error:", err);
                    alert("El formato de este video podría no ser soportado nativamente por tu navegador o requieres interactuar para iniciar el audio.");
                });
            }
        };
        
        const epNum = ep.episode_num || '';
        const epTitle = ep.title ? ep.title.trim() : `Episodio ${epNum}`;
        
        card.innerHTML = `
            <div class="episode-thumbnail-container">
                <img src="${thumbUrl}" alt="${epTitle}" loading="lazy" onerror="this.onerror=null; this.src='${getSeriesPosterFallback(epTitle)}'">
                <div class="episode-play-overlay"><i class="fa-solid fa-play"></i></div>
            </div>
            <div class="episode-info">
                <div class="episode-num">Capítulo ${epNum}</div>
                <div class="episode-title">${epTitle}</div>
            </div>
        `;
        
        seriesEpisodesGrid.appendChild(card);
    });
}

// No modal click listeners needed since back button handles closing

window.initSeries = initSeries;
window.openSeriesDetails = openSeriesDetails;

// Initialize custom controls for series player on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (window.initVODPlayerControls) {
        window.initVODPlayerControls(
            document.getElementById('seriesVideoPlayer'),
            document.getElementById('seriesVideoContainer'),
            document.getElementById('seriesVideoControls'),
            document.getElementById('seriesSeekSlider'),
            document.getElementById('seriesProgressFill'),
            document.getElementById('seriesPlayPauseBtn'),
            document.getElementById('seriesRewindBtn'),
            document.getElementById('seriesForwardBtn'),
            document.getElementById('seriesMuteBtn'),
            document.getElementById('seriesVolumeSlider'),
            document.getElementById('seriesCurrentTime'),
            document.getElementById('seriesDuration'),
            document.getElementById('seriesFullscreenBtn')
        );
    }
});

if (!seriesSection.classList.contains('hidden')) {
    initSeries();
}
