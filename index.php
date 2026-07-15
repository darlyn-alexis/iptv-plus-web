<?php
session_start();

// If not logged in, redirect to login page
if (!isset($_SESSION['iptv_username']) || !isset($_SESSION['iptv_password']) || !isset($_SESSION['iptv_server'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPTV+ - Tu Plataforma de Entretenimiento</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Stylesheet -->
    <link rel="stylesheet" href="assets/css/platform.css">
</head>
<body>

    <!-- Header Navigation Bar -->
    <header class="main-header">
        <div class="header-container">
            <!-- Brand Logo -->
            <div class="brand" id="brandLogo">
                <i class="fa-solid fa-square-play brand-icon"></i>
                <span class="brand-name">iptv<span>+</span></span>
            </div>
            
            <!-- Navigation Links -->
            <nav class="nav-menu">
                <a href="#home" class="nav-item active" data-target="home-section"><i class="fa-solid fa-house"></i> <span>Home</span></a>
                <a href="#tv" class="nav-item" data-target="tv-section"><i class="fa-solid fa-tv"></i> <span>Tv</span></a>
                <a href="#movies" class="nav-item" data-target="movies-section"><i class="fa-solid fa-film"></i> <span>Películas</span></a>
                <a href="#series" class="nav-item" data-target="series-section"><i class="fa-solid fa-clapperboard"></i> <span>Series</span></a>
                <a href="#discover" class="nav-item" data-target="discover-section"><i class="fa-solid fa-magnifying-glass"></i> <span>Descubrir</span></a>
            </nav>

            <!-- User Options / Dropdown -->
            <div class="user-menu" id="userMenuContainer">
                <div class="user-profile-trigger" id="userMenuTrigger">
                    <i class="fa-solid fa-circle-user"></i>
                    <span class="user-name"><?php echo htmlspecialchars($_SESSION['iptv_username']); ?></span>
                    <i class="fa-solid fa-chevron-down chevron-icon" id="userMenuChevron"></i>
                </div>
                <div class="user-dropdown-menu hidden" id="userDropdownMenu">
                    <button class="dropdown-item" id="btnOpenSettings">
                        <i class="fa-solid fa-gear"></i> Ajustes
                    </button>
                    <div class="dropdown-divider"></div>
                    <a href="dashboard.php?action=logout" class="dropdown-item logout-item">
                        <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="content-container">
        
        <!-- Home Section -->
        <section id="home-section" class="app-section">
            <!-- Hero Carousel -->
            <div class="home-hero-carousel-container" id="homeHeroCarouselContainer">
                <div class="home-carousel-wrapper" id="homeCarouselWrapper">
                    <div class="loading-carousel" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 1rem; color: rgba(255,255,255,0.4); font-size: 1.2rem;">
                        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i>
                        Cargando carrusel de películas...
                    </div>
                </div>
                <div class="carousel-dots" id="homeCarouselDots"></div>
            </div>
            
            <!-- Category Rows Container -->
            <div class="home-categories-container" id="homeCategoriesContainer"></div>
            
            <!-- Series Category Rows Container -->
            <div class="home-categories-container" id="homeSeriesCategoriesContainer" style="margin-top: 3rem;"></div>
        </section>

        <!-- TV Section -->
        <section id="tv-section" class="app-section hidden">
            <!-- Browse View -->
            <div id="tv-browse-view" class="tv-browse-view">
                <div class="tv-layout">
                    <!-- Sidebar categories -->
                    <aside class="tv-sidebar">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="categorySearch" placeholder="Buscar categoría...">
                        </div>
                        <ul class="category-list" id="categoryList">
                            <li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando categorías...</li>
                        </ul>
                    </aside>

                    <!-- Channels Main Grid -->
                    <div class="tv-channels-area">
                        <header class="channels-header">
                            <h2 id="activeCategoryTitle">Selecciona una categoría</h2>
                            <div class="search-box channel-search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" id="channelSearch" placeholder="Buscar canal...">
                            </div>
                        </header>
                        
                        <div class="channels-grid" id="channelsGrid">
                            <div class="empty-state">
                                <i class="fa-solid fa-arrow-left"></i>
                                <p>Elige una categoría de la izquierda para ver los canales de televisión.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </section>

        <!-- Movies Section -->
        <section id="movies-section" class="app-section hidden">
            <!-- Token Error State -->
            <div id="moviesTokenError" class="empty-section hidden">
                <i class="fa-solid fa-key" style="color: #ffcc00; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>Falta Token de TMDB</h2>
                <p>Para ver el catálogo de películas necesitas configurar tu Token de lectura (v4) de The Movie Database.</p>
                <button class="settings-btn" onclick="document.getElementById('btnOpenSettings').click()" style="width: auto; padding: 0.8rem 2rem; margin-top: 1rem; background: var(--primary-color); border: none; color: #fff;">
                    <i class="fa-solid fa-gear"></i> Ir a Ajustes
                </button>
            </div>

            <!-- Movies Content -->
            <div id="moviesContentWrapper" class="tv-browse-view hidden">
                <div class="tv-layout">
                    <!-- Sidebar categories -->
                    <aside class="tv-sidebar">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="movieCategorySearch" placeholder="Buscar categoría...">
                        </div>
                        <ul class="category-list" id="movieCategoryList">
                            <li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando categorías...</li>
                        </ul>
                    </aside>

                    <!-- Movies Main Area -->
                    <div class="tv-channels-area vod-content-area">
                        <div class="movie-hero-banner" id="movieHeroBanner" style="margin-bottom: 2rem;">
                            <!-- Hero content injected here -->
                        </div>

                        <header class="channels-header">
                            <h2 id="activeMovieCategoryTitle">Selecciona una categoría</h2>
                            <div class="search-box channel-search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" id="movieStreamSearch" placeholder="Buscar película...">
                            </div>
                        </header>
                        
                        <div class="channels-grid" id="movieGrid">
                            <div class="empty-state">
                                <i class="fa-solid fa-arrow-left"></i>
                                <p>Elige una categoría de la izquierda para ver las películas.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Series Section -->
        <section id="series-section" class="app-section hidden">
            <!-- Token Error State -->
            <div id="seriesTokenError" class="empty-section hidden">
                <i class="fa-solid fa-key" style="color: #ffcc00; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>Falta Token de TMDB</h2>
                <p>Para ver el catálogo de series necesitas configurar tu Token de lectura (v4) de The Movie Database.</p>
                <button class="settings-btn" onclick="document.getElementById('btnOpenSettings').click()" style="width: auto; padding: 0.8rem 2rem; margin-top: 1rem; background: var(--primary-color); border: none; color: #fff;">
                    <i class="fa-solid fa-gear"></i> Ir a Ajustes
                </button>
            </div>

            <!-- Series Content -->
            <div id="seriesContentWrapper" class="tv-browse-view hidden">
                <div class="tv-layout">
                    <!-- Sidebar categories -->
                    <aside class="tv-sidebar">
                        <div class="search-box">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <input type="text" id="seriesCategorySearch" placeholder="Buscar categoría...">
                        </div>
                        <ul class="category-list" id="seriesCategoryList">
                            <li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando categorías...</li>
                        </ul>
                    </aside>

                    <!-- Series Main Area -->
                    <div class="tv-channels-area vod-content-area">
                        <div class="movie-hero-banner" id="seriesHeroBanner" style="margin-bottom: 2rem;">
                            <!-- Hero content injected here -->
                        </div>

                        <header class="channels-header">
                            <h2 id="activeSeriesCategoryTitle">Selecciona una categoría</h2>
                            <div class="search-box channel-search">
                                <i class="fa-solid fa-magnifying-glass"></i>
                                <input type="text" id="seriesStreamSearch" placeholder="Buscar serie...">
                            </div>
                        </header>
                        
                        <div class="channels-grid" id="seriesGrid">
                            <div class="empty-state">
                                <i class="fa-solid fa-arrow-left"></i>
                                <p>Elige una categoría de la izquierda para ver las series.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Discover Section (TMDB Powered) -->
        <section id="discover-section" class="app-section hidden">
            <!-- Token Error State -->
            <div id="discoverTokenError" class="empty-section hidden">
                <i class="fa-solid fa-key" style="color: #ffcc00; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>Falta Token de TMDB</h2>
                <p>Para buscar películas y series necesitas configurar tu Token de lectura (v4) de The Movie Database.</p>
                <button class="settings-btn" onclick="document.getElementById('btnOpenSettings').click()" style="width: auto; padding: 0.8rem 2rem; margin-top: 1rem; background: var(--primary-color); border: none; color: #fff;">
                    <i class="fa-solid fa-gear"></i> Ir a Ajustes
                </button>
            </div>

            <!-- Search Content -->
            <div id="discoverContentWrapper" class="discover-wrapper hidden">
                <div class="search-header">
                    <h2 class="search-title">Buscar</h2>
                    <div class="search-input-container">
                        <i class="fa-solid fa-magnifying-glass search-icon"></i>
                        <input type="text" id="searchInput" class="search-input" placeholder="Películas, Series, o Actores..." autocomplete="off">
                    </div>
                </div>

                <div class="search-results-container">
                    <div id="searchResultsLoader" class="search-loader hidden">
                        <i class="fa-solid fa-spinner fa-spin"></i> Buscando...
                    </div>
                    <div id="searchResultsEmpty" class="search-empty hidden">
                        No se encontraron resultados para tu búsqueda.
                    </div>
                    
                    <div id="searchCategoryMovies" class="search-category hidden">
                        <h3 class="movie-row-title">Películas</h3>
                        <div class="search-results-grid" id="searchGridMovies"></div>
                    </div>
                    
                    <div id="searchCategorySeries" class="search-category hidden">
                        <h3 class="movie-row-title">Series</h3>
                        <div class="search-results-grid" id="searchGridSeries"></div>
                    </div>
                </div>
            </div>
        </section>

    <!-- Player View (Global / Floating when mini) -->
    <div id="tv-player-view" class="tv-player-view hidden">
        <header class="player-view-header">
            <button id="backToBrowseBtn" class="back-btn">
                <i class="fa-solid fa-arrow-left"></i> Volver
            </button>
            <h2 id="playerCategoryTitle" class="player-category-title">Categoría</h2>
        </header>
        <div class="player-layout">
            <!-- Main Video Area -->
            <div class="player-main-col">
                <div class="video-container" id="mainVideoContainer">
                    <video id="videoPlayer" autoplay playsinline></video>
                    
                    <!-- Custom Video Controls -->
                    <div class="custom-video-controls" id="customVideoControls">
                        <div class="controls-bottom-bar">
                            <button class="control-btn play-pause-btn" id="playPauseBtn" title="Play/Pausa">
                                <i class="fa-solid fa-pause"></i>
                            </button>
                            
                            <div class="volume-container">
                                <button class="control-btn mute-btn" id="muteBtn" title="Silenciar">
                                    <i class="fa-solid fa-volume-high"></i>
                                </button>
                                <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.05" value="1">
                            </div>
                            
                            <div class="live-indicator">
                                <span class="live-dot"></span> EN VIVO
                            </div>
                            
                            <div class="controls-spacer"></div>
                            
                            <button class="control-btn fullscreen-btn" id="fullscreenBtn" title="Pantalla Completa">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Mini Player Overlay -->
                    <div class="mini-player-overlay hidden" id="miniPlayerOverlay">
                        <div class="mini-player-expand" id="expandMiniPlayer" title="Expandir">
                            <i class="fa-solid fa-expand"></i>
                        </div>
                        <button class="mini-player-close" id="closeMiniPlayer" title="Cerrar video">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div id="videoError" class="video-error-overlay hidden">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <p>No se pudo reproducir este canal. Intenta con otro.</p>
                    </div>
                </div>
                <div class="player-info">
                    <div class="player-channel-meta">
                        <div class="player-channel-logo" id="playerChannelLogo"></div>
                        <h3 id="playerTitle">Nombre del Canal</h3>
                    </div>
                </div>
            </div>
            <!-- Side Channels List Wrapper -->
            <div class="player-side-wrapper">
                <aside class="player-side-col">
                    <h4 class="side-col-title">Siguientes canales</h4>
                    <div class="side-channels-list" id="sideChannelsList">
                        <!-- Populated dynamically -->
                    </div>
                </aside>
            </div>
        </div>
    </div>

    </main>

    <!-- Settings Modal -->
    <div id="settingsModal" class="settings-modal hidden">
        <div class="settings-modal-content">
            <header class="settings-modal-header">
                <h3><i class="fa-solid fa-gear"></i> Ajustes</h3>
                <button class="settings-close-btn" id="closeSettingsBtn" title="Cerrar Ajustes">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <div class="settings-modal-body">
                <div class="settings-group">
                    <label>Servidor IPTV</label>
                    <input type="text" class="settings-input" value="<?php echo htmlspecialchars($_SESSION['iptv_server']); ?>" disabled>
                </div>
                <div class="settings-group">
                    <label>Usuario</label>
                    <input type="text" class="settings-input" value="<?php echo htmlspecialchars($_SESSION['iptv_username']); ?>" disabled>
                </div>
                <div class="settings-group">
                    <label>Tiempo de Expiración de Caché</label>
                    <select id="settingsCacheSelect" class="settings-select">
                        <option value="5">5 minutos</option>
                        <option value="10" selected>10 minutos (Por defecto)</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                    </select>
                </div>
                <div class="settings-group">
                    <label>Token Movie Database (TMDB v4)</label>
                    <input type="password" id="settingsTmdbToken" class="settings-input" placeholder="Introduce tu Read Access Token de TMDB...">
                </div>
                <div class="settings-actions">
                    <button class="settings-btn btn-clear-cache" id="btnClearCache">
                        <i class="fa-solid fa-trash-can"></i> Limpiar Caché Local
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Movie Detail View -->
    <section id="movie-detail-view" class="app-section detail-view-container hidden">
        <button class="detail-back-btn" id="movieDetailBackBtn"><i class="fa-solid fa-arrow-left"></i> Volver</button>
        <div class="detail-hero-backdrop" id="movieDetailBackdrop">
            <div class="detail-hero-gradient"></div>
            <div id="movieVideoContainer" class="detail-video-container hidden">
                <video id="movieVideoPlayer" playsinline></video>
                
                <!-- Custom Video Controls -->
                <div class="custom-video-controls" id="movieVideoControls">
                    <div class="progress-bar-container">
                        <input type="range" class="seek-slider" id="movieSeekSlider" min="0" max="100" value="0" step="0.1">
                        <div class="progress-bar-fill" id="movieProgressFill"></div>
                    </div>
                    
                    <div class="controls-bottom-bar">
                        <button class="control-btn play-pause-btn" id="moviePlayPauseBtn" title="Play/Pausa">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        
                        <button class="control-btn skip-btn" id="movieRewindBtn" title="Retroceder 10s">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button class="control-btn skip-btn" id="movieForwardBtn" title="Adelantar 10s">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        
                        <div class="volume-container">
                            <button class="control-btn mute-btn" id="movieMuteBtn" title="Silenciar">
                                <i class="fa-solid fa-volume-high"></i>
                            </button>
                            <input type="range" class="volume-slider" id="movieVolumeSlider" min="0" max="1" step="0.05" value="1">
                        </div>
                        
                        <div class="time-display">
                            <span id="movieCurrentTime">00:00:00</span> / <span id="movieDuration">00:00:00</span>
                        </div>
                        
                        <div class="controls-spacer"></div>
                        
                        <button class="control-btn audio-btn" id="movieAudioBtn" title="Pistas de Audio">
                            <i class="fa-solid fa-headphones"></i>
                        </button>
                        
                        <button class="control-btn fullscreen-btn" id="movieFullscreenBtn" title="Pantalla Completa">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Audio Menu Overlay -->
                <div class="audio-menu hidden" id="movieAudioMenu">
                    <div class="audio-menu-header">Pistas de Audio</div>
                    <div class="audio-menu-list" id="movieAudioMenuList"></div>
                </div>
                
                <button class="close-video-btn" id="movieCloseVideoBtn"><i class="fa-solid fa-xmark"></i> Cerrar Video</button>
            </div>
        </div>
        <div class="detail-content-wrapper">
            <div class="detail-info-card">
                <h2 class="detail-title" id="movieDetailTitle">Título de Película</h2>
                <div class="detail-meta">
                    <span class="detail-rating" id="movieDetailRating"><i class="fa-solid fa-star"></i> 8.5</span>
                    <span id="movieDetailYear">2023</span>
                    <span id="movieDetailGenres">Acción, Sci-Fi</span>
                </div>
                <p class="detail-overview" id="movieDetailOverview">Descripción completa...</p>
                <div class="detail-actions">
                    <button class="movie-play-btn" id="movieDetailPlayBtn">
                        <i class="fa-solid fa-play"></i> Reproducir
                    </button>
                    <div id="movieDetailMatchStatus" class="match-status"></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Series Detail View -->
    <section id="series-detail-view" class="app-section detail-view-container hidden">
        <button class="detail-back-btn" id="seriesDetailBackBtn"><i class="fa-solid fa-arrow-left"></i> Volver</button>
        <div class="detail-hero-backdrop" id="seriesDetailBackdrop">
            <div class="detail-hero-gradient"></div>
            <div id="seriesVideoContainer" class="detail-video-container hidden">
                <video id="seriesVideoPlayer" playsinline></video>
                
                <!-- Custom Video Controls -->
                <div class="custom-video-controls" id="seriesVideoControls">
                    <div class="progress-bar-container">
                        <input type="range" class="seek-slider" id="seriesSeekSlider" min="0" max="100" value="0" step="0.1">
                        <div class="progress-bar-fill" id="seriesProgressFill"></div>
                    </div>
                    
                    <div class="controls-bottom-bar">
                        <button class="control-btn play-pause-btn" id="seriesPlayPauseBtn" title="Play/Pausa">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        
                        <button class="control-btn skip-btn" id="seriesRewindBtn" title="Retroceder 10s">
                            <i class="fa-solid fa-rotate-left"></i>
                        </button>
                        <button class="control-btn skip-btn" id="seriesForwardBtn" title="Adelantar 10s">
                            <i class="fa-solid fa-rotate-right"></i>
                        </button>
                        
                        <div class="volume-container">
                            <button class="control-btn mute-btn" id="seriesMuteBtn" title="Silenciar">
                                <i class="fa-solid fa-volume-high"></i>
                            </button>
                            <input type="range" class="volume-slider" id="seriesVolumeSlider" min="0" max="1" step="0.05" value="1">
                        </div>
                        
                        <div class="time-display">
                            <span id="seriesCurrentTime">00:00:00</span> / <span id="seriesDuration">00:00:00</span>
                        </div>
                        
                        <div class="controls-spacer"></div>
                        
                        <button class="control-btn audio-btn" id="seriesAudioBtn" title="Pistas de Audio">
                            <i class="fa-solid fa-headphones"></i>
                        </button>
                        
                        <button class="control-btn fullscreen-btn" id="seriesFullscreenBtn" title="Pantalla Completa">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Audio Menu Overlay -->
                <div class="audio-menu hidden" id="seriesAudioMenu">
                    <div class="audio-menu-header">Pistas de Audio</div>
                    <div class="audio-menu-list" id="seriesAudioMenuList"></div>
                </div>
                
                <button class="close-video-btn" id="seriesCloseVideoBtn"><i class="fa-solid fa-xmark"></i> Cerrar Video</button>
            </div>
        </div>
        <div class="detail-content-wrapper">
            <div class="detail-info-card">
                <h2 class="detail-title" id="seriesDetailTitle">Título de Serie</h2>
                <div class="detail-meta">
                    <span class="detail-rating" id="seriesDetailRating"><i class="fa-solid fa-star"></i> 8.5</span>
                    <span id="seriesDetailYear">2023</span>
                    <span id="seriesDetailSeasons">3 Temporadas</span>
                    <span id="seriesDetailGenres">Drama</span>
                </div>
                <p class="detail-overview" id="seriesDetailOverview">Descripción completa...</p>
                <div class="detail-actions" style="display: none;">
                    <button class="movie-play-btn" id="seriesDetailPlayBtn">
                        <i class="fa-solid fa-play"></i> Reproducir
                    </button>
                    <div id="seriesDetailMatchStatus" class="match-status"></div>
                </div>

                <!-- Seasons & Episodes Selection -->
                <div class="episodes-container" id="seriesEpisodesSection" style="margin-top: 2.5rem; border-top: 1px solid var(--border-color); padding-top: 2rem; width: 100%;">
                    <div class="episodes-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
                        <h3 style="font-size: 1.5rem; font-weight: 600; margin: 0;">Episodios</h3>
                        <select id="seriesSeasonSelect" class="season-select" style="background: var(--surface-color); color: #fff; padding: 0.6rem 1.2rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; cursor: pointer; outline: none; transition: border-color 0.3s;">
                            <option value="">Cargando temporadas...</option>
                        </select>
                    </div>
                    <div class="episodes-grid" id="seriesEpisodesGrid">
                        <!-- Episode cards will be injected here -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Resource Selection Modal -->
    <div id="resourceModal" class="modal-overlay hidden">
        <div class="resource-modal-content">
            <div class="resource-modal-header">
                <h3><i class="fa-solid fa-folder-open"></i> Seleccionar Recurso</h3>
                <button id="closeResourceModalBtn" class="resource-close-btn">&times;</button>
            </div>
            <div class="resource-modal-body">
                <div id="resourceModalList"></div>
            </div>
            <div class="resource-modal-footer">
                <button id="confirmResourceBtn" class="resource-confirm-btn">Confirmar Selección</button>
            </div>
        </div>
    </div>

    <!-- mpegts.js for playing raw TS streams -->
    <script src="https://cdn.jsdelivr.net/npm/mpegts.js@latest/dist/mpegts.min.js"></script>
    <script>
        window.IPTV_CONFIG = {
            server: <?php echo json_encode($_SESSION['iptv_server']); ?>,
            username: <?php echo json_encode($_SESSION['iptv_username']); ?>,
            password: <?php echo json_encode($_SESSION['iptv_password']); ?>
        };
    </script>
    <!-- TV logic and Navigation routing -->
    <script src="assets/js/tv.js"></script>
    <!-- TMDB API Core -->
    <script src="assets/js/tmdb-api.js"></script>
    <!-- TMDB Movies logic -->
    <script src="assets/js/movies.js"></script>
    <!-- TMDB Series logic -->
    <script src="assets/js/series.js"></script>
    <!-- TMDB Discover Search logic -->
    <script src="assets/js/discover.js"></script>
    <!-- Home carousel logic -->
    <script src="assets/js/home.js"></script>
</body>
</html>
