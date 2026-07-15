document.addEventListener('DOMContentLoaded', () => {
    // --- TV Live Stream State & Elements ---
    const categoryList = document.getElementById('categoryList');
    const categorySearch = document.getElementById('categorySearch');
    const activeCategoryTitle = document.getElementById('activeCategoryTitle');
    const channelsGrid = document.getElementById('channelsGrid');
    const channelSearch = document.getElementById('channelSearch');

    let categoriesLoaded = false;
    let currentCategoryId = null;
    let rawCategories = []; // Store loaded categories
    let favoriteCategoryIds = JSON.parse(localStorage.getItem('tv_favorite_categories') || '[]');
    let allChannels = []; // Store current category's channels for client-side search
    let CACHE_DURATION = parseInt(localStorage.getItem('tv_cache_duration') || '10') * 60 * 1000;

    // --- Router & Section Toggling ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.app-section');
    const brandLogo = document.getElementById('brandLogo');
    const btnGoToTv = document.getElementById('btnGoToTv');

    function showSection(targetId) {
        if (window.stopMovieInlineVideo) window.stopMovieInlineVideo();
        if (window.stopSeriesInlineVideo) window.stopSeriesInlineVideo();

        const tvPlayer = document.getElementById('tv-player-view');
        const tvBrowse = document.getElementById('tv-browse-view');
        const isMiniModeActive = tvPlayer && tvPlayer.classList.contains('mini-mode');
        const isPlayerVisible = tvPlayer && !tvPlayer.classList.contains('hidden');
        
        // If we switch away from TV section while a video is playing, enable mini-mode
        if (targetId !== 'tv-section' && isPlayerVisible && typeof currentPlayingStreamId !== 'undefined' && currentPlayingStreamId !== null) {
            if (tvPlayer) {
                tvPlayer.style.left = '';
                tvPlayer.style.top = '';
                tvPlayer.style.bottom = '30px';
                tvPlayer.style.right = '30px';
                tvPlayer.classList.add('mini-mode');
            }
        }
        
        // Hide content-container if we are in a detail view (since they are outside main)
        const mainContainer = document.querySelector('.content-container');
        if (targetId === 'movie-detail-view' || targetId === 'series-detail-view') {
            if (mainContainer) mainContainer.classList.add('hidden');
        } else {
            if (mainContainer) mainContainer.classList.remove('hidden');
        }

        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        
        // Ensure tv-browse-view visibility based on whether we are in TV section
        if (targetId === 'tv-section') {
            if (isPlayerVisible && (!tvPlayer.classList.contains('mini-mode'))) {
                // We are returning to TV section and the player is already full screen
                tvBrowse.classList.add('hidden');
            } else {
                tvBrowse.classList.remove('hidden');
            }
            loadCategories();
        } else if (targetId === 'movies-section') {
            if (window.initMovies) {
                window.initMovies();
            }
        } else if (targetId === 'series-section') {
            if (window.initSeries) {
                window.initSeries();
            }
        } else if (targetId === 'discover-section') {
            if (window.initDiscover) {
                window.initDiscover();
            }
        } else if (targetId === 'home-section') {
            if (window.initHome) {
                window.initHome();
            }
        }

        // Update Nav Active State ONLY if it's a main nav tab
        const correspondingNavItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (correspondingNavItem) {
            navItems.forEach(item => item.classList.remove('active'));
            correspondingNavItem.classList.add('active');
        }
    }

    // Global function to show section programmatically
    window.showSection = showSection;

    // Go Back functionality
    window.goBack = function() {
        if (window.stopMovieInlineVideo) window.stopMovieInlineVideo();
        if (window.stopSeriesInlineVideo) window.stopSeriesInlineVideo();
        
        if (window.previousSectionId) {
            showSection(window.previousSectionId);
        } else {
            showSection('home-section');
        }
    };

    // Nav bar click handlers
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            const hash = item.getAttribute('href');
            window.location.hash = hash;
            showSection(targetId);
        });
    });

    // Logo click goes home
    brandLogo.addEventListener('click', () => {
        window.location.hash = '#home';
        showSection('home-section');
    });

    // Home "Go to TV" card
    if (btnGoToTv) {
        btnGoToTv.addEventListener('click', () => {
            window.location.hash = '#tv';
            showSection('tv-section');
        });
    }

    // Handle initial hash routing
    function handleInitialRoute() {
        const hash = window.location.hash || '#home';
        let targetId = 'home-section';
        if (hash === '#tv') targetId = 'tv-section';
        if (hash === '#movies') targetId = 'movies-section';
        if (hash === '#series') targetId = 'series-section';
        showSection(targetId);
    }
    handleInitialRoute();


    // --- TV Live Stream Functionality ---

    // Fetch and load categories
    async function loadCategories() {
        if (categoriesLoaded) return;
        
        const cacheKey = 'tv_categories_cache';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                    rawCategories = parsed.data;
                    renderCategories();
                    categoriesLoaded = true;
                    return;
                }
            } catch (e) {
                console.warn('Error al parsear cache de categorías:', e);
            }
        }
        
        try {
            const response = await fetch('api/categories.php');
            if (!response.ok) throw new Error('Error al cargar categorías');
            
            rawCategories = await response.json();
            
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: rawCategories
            }));
            
            renderCategories();
            categoriesLoaded = true;
        } catch (error) {
            console.error('Error:', error);
            categoryList.innerHTML = '<li class="loading-item" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i> Error al cargar categorías.</li>';
        }
    }

    // Render category list with Favorites sub-section
    function renderCategories() {
        categoryList.innerHTML = '';
        const query = categorySearch.value.toLowerCase().trim();

        // Filter categories based on search query
        const filteredCategories = rawCategories.filter(cat => 
            cat.category_name.toLowerCase().includes(query)
        );

        if (rawCategories.length === 0) {
            categoryList.innerHTML = '<li class="loading-item">No se encontraron categorías.</li>';
            return;
        }

        // 1. Render Pinned Favorites
        const favorites = filteredCategories.filter(cat => favoriteCategoryIds.includes(String(cat.category_id)));
        
        if (favorites.length > 0) {
            const favHeader = document.createElement('li');
            favHeader.className = 'category-header';
            favHeader.innerHTML = '<i class="fa-solid fa-star" style="color: #ffcc00;"></i> Favoritos';
            categoryList.appendChild(favHeader);

            favorites.forEach(cat => {
                createCategoryItem(cat, true);
            });
        }

        // 2. Render Main Categories
        const mainHeader = document.createElement('li');
        mainHeader.className = 'category-header';
        mainHeader.innerHTML = '<i class="fa-solid fa-list"></i> Categorías';
        categoryList.appendChild(mainHeader);

        if (filteredCategories.length === 0) {
            const noResults = document.createElement('li');
            noResults.className = 'loading-item';
            noResults.textContent = 'Sin resultados';
            categoryList.appendChild(noResults);
        } else {
            filteredCategories.forEach(cat => {
                createCategoryItem(cat, false);
            });
        }
    }

    function createCategoryItem(cat, isFavoriteSection = false) {
        const li = document.createElement('li');
        li.className = 'category-item';
        if (currentCategoryId === String(cat.category_id)) {
            li.classList.add('active');
        }
        li.setAttribute('data-id', cat.category_id);
        
        // Text container
        const textSpan = document.createElement('span');
        textSpan.className = 'category-item-text';
        textSpan.textContent = cat.category_name;
        
        // Favorite toggle button
        const favBtn = document.createElement('button');
        favBtn.className = 'category-favorite-btn';
        favBtn.setAttribute('aria-label', 'Marcar favorito');
        const isFav = favoriteCategoryIds.includes(String(cat.category_id));
        if (isFav) {
            favBtn.classList.add('active');
            favBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
        } else {
            favBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
        }
        
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent selecting the category when favoriting
            toggleFavoriteCategory(String(cat.category_id));
        });

        li.appendChild(textSpan);
        li.appendChild(favBtn);

        li.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
            // Highlight this category across all sections (Favorites and Categories)
            document.querySelectorAll(`.category-item[data-id="${cat.category_id}"]`).forEach(item => {
                item.classList.add('active');
            });
            selectCategory(String(cat.category_id), cat.category_name);
        });

        categoryList.appendChild(li);
    }

    function toggleFavoriteCategory(categoryId) {
        const index = favoriteCategoryIds.indexOf(categoryId);
        if (index > -1) {
            favoriteCategoryIds.splice(index, 1);
        } else {
            favoriteCategoryIds.push(categoryId);
        }
        
        localStorage.setItem('tv_favorite_categories', JSON.stringify(favoriteCategoryIds));
        renderCategories();
    }

    // Handle category selection
    async function selectCategory(categoryId, categoryName) {
        currentCategoryId = categoryId;
        activeCategoryTitle.textContent = categoryName;
        channelSearch.value = ''; // Reset channel search input
        
        const cacheKey = `tv_channels_cache_${categoryId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                    allChannels = parsed.data;
                    renderChannels(allChannels);
                    return;
                }
            } catch (e) {
                console.warn(`Error al parsear cache de canales para la categoría ${categoryId}:`, e);
            }
        }

        channelsGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Cargando canales...</p></div>';
        
        try {
            const response = await fetch(`api/channels.php?category_id=${encodeURIComponent(categoryId)}`);
            if (!response.ok) throw new Error('Error al cargar canales');
            
            allChannels = await response.json();
            
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: allChannels
            }));
            
            renderChannels(allChannels);
        } catch (error) {
            console.error('Error:', error);
            channelsGrid.innerHTML = '<div class="empty-state" style="color: #ff453a;"><i class="fa-solid fa-circle-xmark"></i><p>Error al cargar canales.</p></div>';
        }
    }

    // Render channels in grid
    function renderChannels(channels) {
        channelsGrid.innerHTML = '';
        
        if (channels.length === 0) {
            channelsGrid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-tv"></i><p>No hay canales en esta categoría.</p></div>';
            return;
        }

        channels.forEach(channel => {
            const card = document.createElement('div');
            card.className = 'channel-card';
            card.setAttribute('data-stream-id', channel.stream_id);
            card.setAttribute('data-name', channel.name);

            // Channel logo block
            const logoContainer = document.createElement('div');
            logoContainer.className = 'channel-logo-container';

            if (channel.stream_icon && channel.stream_icon.trim() !== '') {
                const img = document.createElement('img');
                img.src = channel.stream_icon;
                img.alt = channel.name;
                img.loading = 'lazy';
                // Fallback image if source errors
                img.onerror = () => {
                    logoContainer.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo"></i>';
                };
                logoContainer.appendChild(img);
            } else {
                logoContainer.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo"></i>';
            }

            // Channel name block
            const nameEl = document.createElement('div');
            nameEl.className = 'channel-name';
            nameEl.textContent = channel.name;

            card.appendChild(logoContainer);
            card.appendChild(nameEl);

            // Click listener to play stream
            card.addEventListener('click', () => {
                playChannel(channel.stream_id, channel.name, channel.stream_icon, channel.container_extension);
            });

            channelsGrid.appendChild(card);
        });
    }

    // Client-side search filters
    categorySearch.addEventListener('input', () => {
        renderCategories();
    });

    channelSearch.addEventListener('input', () => {
        const query = channelSearch.value.toLowerCase().trim();
        const filtered = allChannels.filter(channel => 
            channel.name.toLowerCase().includes(query)
        );
        renderChannels(filtered);
    });


    // --- TV Player Views ---
    const tvBrowseView = document.getElementById('tv-browse-view');
    const tvPlayerView = document.getElementById('tv-player-view');
    const backToBrowseBtn = document.getElementById('backToBrowseBtn');
    const playerCategoryTitle = document.getElementById('playerCategoryTitle');
    const playerTitle = document.getElementById('playerTitle');
    const playerChannelLogo = document.getElementById('playerChannelLogo');
    const videoPlayer = document.getElementById('videoPlayer');
    const mainVideoContainer = document.getElementById('mainVideoContainer');
    const customVideoControls = document.getElementById('customVideoControls');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    let controlsTimeout;
    
    const videoError = document.getElementById('videoError');
    const sideChannelsList = document.getElementById('sideChannelsList');
    
    let mpegtsPlayer = null;
    let currentPlayingStreamId = null;

    // Draggable Mini Player States
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    function playChannel(streamId, channelName, streamIcon, extension = '') {
        currentPlayingStreamId = streamId;
        playerTitle.textContent = channelName;
        playerCategoryTitle.textContent = activeCategoryTitle.textContent;
        
        // Render logo
        playerChannelLogo.innerHTML = '';
        if (streamIcon && streamIcon.trim() !== '') {
            const img = document.createElement('img');
            img.src = streamIcon;
            img.alt = channelName;
            img.onerror = () => {
                playerChannelLogo.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo" style="font-size: 1.5rem;"></i>';
            };
            playerChannelLogo.appendChild(img);
        } else {
            playerChannelLogo.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo" style="font-size: 1.5rem;"></i>';
        }
        
        // Ensure TV section is active if we play a channel from elsewhere
        if (document.getElementById('tv-section').classList.contains('hidden')) {
            window.location.hash = '#tv';
            showSection('tv-section');
        }

        // Restore player from mini-mode/floating state to full-screen
        tvPlayerView.classList.remove('mini-mode');
        tvPlayerView.style.left = '';
        tvPlayerView.style.top = '';
        tvPlayerView.style.bottom = '';
        tvPlayerView.style.right = '';

        // Switch Views
        tvBrowseView.classList.add('hidden');
        tvPlayerView.classList.remove('hidden');
        videoError.classList.add('hidden');
        
        // Render Side Channels
        renderSideChannels();
        
        // Reset player state
        if (mpegtsPlayer) {
            mpegtsPlayer.destroy();
            mpegtsPlayer = null;
        }
        videoPlayer.pause();
        videoPlayer.src = '';
        
        // Build stream url to use the local PHP proxy to bypass CORS
        const streamUrl = `api/stream.php?stream_id=${encodeURIComponent(streamId)}&type=live&extension=${encodeURIComponent(extension || '')}`;

        if (mpegts.getFeatureList().mseLivePlayback) {
            mpegtsPlayer = mpegts.createPlayer({
                type: 'mpegts',
                isLive: true,
                url: streamUrl,
                cors: true
            });
            
            mpegtsPlayer.attachMediaElement(videoPlayer);
            mpegtsPlayer.load();
            
            mpegtsPlayer.play().catch(e => {
                console.warn('Autoplay block triggered or CORS error:', e);
            });

            mpegtsPlayer.on(mpegts.Events.ERROR, (errorType, errorDetail, errorInfo) => {
                console.error('MPEG-TS Error:', errorType, errorDetail, errorInfo);
                showVideoError();
            });
        } else {
            // Fallback if MSE is not supported
            videoPlayer.src = streamUrl;
            videoPlayer.play().catch(e => {
                console.warn('Autoplay fallback error:', e);
            });
            videoPlayer.addEventListener('error', () => {
                showVideoError();
            });
        }
    }

    function renderSideChannels() {
        sideChannelsList.innerHTML = '';
        allChannels.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'side-channel-item';
            if (channel.stream_id === currentPlayingStreamId) {
                item.classList.add('active');
            }

            // Channel logo
            const logoContainer = document.createElement('div');
            logoContainer.className = 'side-channel-logo';
            if (channel.stream_icon && channel.stream_icon.trim() !== '') {
                const img = document.createElement('img');
                img.src = channel.stream_icon;
                img.alt = channel.name;
                img.loading = 'lazy';
                img.onerror = () => {
                    logoContainer.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo" style="font-size: 1.2rem;"></i>';
                };
                logoContainer.appendChild(img);
            } else {
                logoContainer.innerHTML = '<i class="fa-solid fa-tv channel-fallback-logo" style="font-size: 1.2rem;"></i>';
            }

            // Channel info
            const infoContainer = document.createElement('div');
            infoContainer.className = 'side-channel-info';
            const nameEl = document.createElement('div');
            nameEl.className = 'side-channel-name';
            nameEl.textContent = channel.name;
            infoContainer.appendChild(nameEl);

            item.appendChild(logoContainer);
            item.appendChild(infoContainer);

            // Click listener
            item.addEventListener('click', () => {
                playChannel(channel.stream_id, channel.name, channel.stream_icon, channel.container_extension);
            });

            sideChannelsList.appendChild(item);
        });
    }

    function showVideoError() {
        videoError.classList.remove('hidden');
        if (mpegtsPlayer) {
            mpegtsPlayer.destroy();
            mpegtsPlayer = null;
        }
    }

    function goBackToBrowse() {
        if (currentPlayingStreamId !== null) {
            tvPlayerView.style.left = '';
            tvPlayerView.style.top = '';
            tvPlayerView.style.bottom = '30px';
            tvPlayerView.style.right = '30px';
            tvPlayerView.classList.add('mini-mode');
        } else {
            tvPlayerView.classList.add('hidden');
        }
        tvBrowseView.classList.remove('hidden');
    }

    function stopPlayback() {
        tvPlayerView.classList.add('hidden');
        tvPlayerView.classList.remove('mini-mode');
        tvPlayerView.style.left = '';
        tvPlayerView.style.top = '';
        tvPlayerView.style.bottom = '';
        tvPlayerView.style.right = '';
        videoPlayer.pause();
        videoPlayer.src = '';
        if (mpegtsPlayer) {
            mpegtsPlayer.destroy();
            mpegtsPlayer = null;
        }
        currentPlayingStreamId = null;
    }

    function expandMiniPlayerFn() {
        if (tvPlayerView.classList.contains('mini-mode')) {
            tvPlayerView.classList.remove('mini-mode');
            tvPlayerView.style.left = '';
            tvPlayerView.style.top = '';
            tvPlayerView.style.bottom = '';
            tvPlayerView.style.right = '';
            // Hide browse view if we are on the TV section
            if (!document.getElementById('tv-section').classList.contains('hidden')) {
                tvBrowseView.classList.add('hidden');
            } else {
                // If we are in another section (like Home), navigate back to TV section
                window.location.hash = '#tv';
                showSection('tv-section');
            }
        }
    }

    // Drag handlers
    function startDrag(e) {
        if (!tvPlayerView.classList.contains('mini-mode')) return;

        // Don't drag if clicking buttons
        if (e.target.closest('#closeMiniPlayer') || e.target.closest('#expandMiniPlayer')) {
            return;
        }

        isDragging = false; // reset flag, only true if moved

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        dragStartX = clientX;
        dragStartY = clientY;

        const rect = tvPlayerView.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    function drag(e) {
        if (!tvPlayerView.classList.contains('mini-mode')) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;

        // Consider it a drag only if pointer moved more than 5px
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isDragging = true;
            if (e.type === 'touchmove') e.preventDefault(); // prevent touch screen scrolling
        }

        if (isDragging) {
            tvPlayerView.style.bottom = 'auto';
            tvPlayerView.style.right = 'auto';

            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            const rect = tvPlayerView.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width - 30; // 30px safety margin
            const maxY = window.innerHeight - rect.height - 30;

            newLeft = Math.max(30, Math.min(newLeft, maxX));
            newTop = Math.max(30, Math.min(newTop, maxY));

            tvPlayerView.style.left = newLeft + 'px';
            tvPlayerView.style.top = newTop + 'px';
        }
    }

    function stopDrag() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchend', stopDrag);
    }

    // --- Custom Video Controls Logic ---
    function togglePlayPause() {
        if (videoPlayer.paused) {
            videoPlayer.play();
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

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayPause();
        });
    }

    videoPlayer.addEventListener('play', updatePlayPauseIcon);
    videoPlayer.addEventListener('pause', updatePlayPauseIcon);

    if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            videoPlayer.muted = !videoPlayer.muted;
            updateVolumeIcon();
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            videoPlayer.volume = volumeSlider.value;
            videoPlayer.muted = videoPlayer.volume === 0;
            updateVolumeIcon();
        });
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

    videoPlayer.addEventListener('volumechange', updateVolumeIcon);

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) {
                mainVideoContainer.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Auto-hide controls
    function resetControlsTimeout() {
        if (mainVideoContainer) {
            mainVideoContainer.classList.remove('hide-controls');
        }
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused && mainVideoContainer && !tvPlayerView.classList.contains('mini-mode')) {
                mainVideoContainer.classList.add('hide-controls');
            }
        }, 3000);
    }

    if (mainVideoContainer) {
        mainVideoContainer.addEventListener('mousemove', resetControlsTimeout);
        mainVideoContainer.addEventListener('mouseleave', () => {
            if (!videoPlayer.paused && !tvPlayerView.classList.contains('mini-mode')) {
                mainVideoContainer.classList.add('hide-controls');
            }
        });
        
        // Also toggle play/pause on clicking the video directly (if not dragging in mini-mode)
        mainVideoContainer.addEventListener('click', (e) => {
            if (!tvPlayerView.classList.contains('mini-mode')) {
                // If it's a click on the video itself and not a control button
                if (e.target === videoPlayer) {
                    togglePlayPause();
                }
            }
        });
    }

    // Back to browse events
    backToBrowseBtn.addEventListener('click', goBackToBrowse);
    
    // Wire up Detail View Back Buttons
    const movieDetailBackBtn = document.getElementById('movieDetailBackBtn');
    if (movieDetailBackBtn) {
        movieDetailBackBtn.addEventListener('click', window.goBack);
    }
    
    const seriesDetailBackBtn = document.getElementById('seriesDetailBackBtn');
    if (seriesDetailBackBtn) {
        seriesDetailBackBtn.addEventListener('click', window.goBack);
    }

    // Mini player events
    const closeMiniPlayerBtn = document.getElementById('closeMiniPlayer');
    const expandMiniPlayerBtn = document.getElementById('expandMiniPlayer');
    
    if (closeMiniPlayerBtn) {
        closeMiniPlayerBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent expanding
            stopPlayback();
        });
    }
    
    if (expandMiniPlayerBtn) {
        expandMiniPlayerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            expandMiniPlayerFn();
        });
    }
    
    // Clicking anywhere on the video container when in mini mode expands it
    if (mainVideoContainer) {
        mainVideoContainer.addEventListener('mousedown', startDrag);
        mainVideoContainer.addEventListener('touchstart', startDrag, { passive: true });

        mainVideoContainer.addEventListener('click', (e) => {
            if (tvPlayerView.classList.contains('mini-mode')) {
                e.preventDefault(); // Stop native video pause
                if (!isDragging) {
                    expandMiniPlayerFn();
                }
            }
        });
    }

    // --- User Profile Dropdown & Settings Modal Logic ---
    const userMenuTrigger = document.getElementById('userMenuTrigger');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const settingsModal = document.getElementById('settingsModal');
    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const btnClearCache = document.getElementById('btnClearCache');
    const settingsCacheSelect = document.getElementById('settingsCacheSelect');
    const settingsTmdbToken = document.getElementById('settingsTmdbToken');

    // Toggle user dropdown menu
    if (userMenuTrigger && userDropdownMenu) {
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
            userMenuTrigger.classList.toggle('active');
        });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (userDropdownMenu && !userDropdownMenu.classList.contains('hidden')) {
            if (!userDropdownMenu.contains(e.target) && !userMenuTrigger.contains(e.target)) {
                userDropdownMenu.classList.add('hidden');
                userMenuTrigger.classList.remove('active');
            }
        }
    });

    // Open Settings Modal
    if (btnOpenSettings && settingsModal) {
        btnOpenSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userDropdownMenu) {
                userDropdownMenu.classList.add('hidden');
                userMenuTrigger.classList.remove('active');
            }
            // Populate current cache duration in select
            const savedDuration = localStorage.getItem('tv_cache_duration') || '10';
            if (settingsCacheSelect) {
                settingsCacheSelect.value = savedDuration;
            }
            // Populate TMDB token
            const savedToken = localStorage.getItem('tmdb_api_token') || '';
            if (settingsTmdbToken) {
                settingsTmdbToken.value = savedToken;
            }
            settingsModal.classList.remove('hidden');
        });
    }

    // Close Settings Modal
    if (closeSettingsBtn && settingsModal) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            if (window.initMovies && !document.getElementById('movies-section').classList.contains('hidden')) {
                // Force a re-init when settings closes if on movies section
                window.initMovies();
            }
            if (window.initSeries && !document.getElementById('series-section').classList.contains('hidden')) {
                // Force a re-init when settings closes if on series section
                window.initSeries();
            }
            if (window.initDiscover && !document.getElementById('discover-section').classList.contains('hidden')) {
                window.initDiscover();
            }
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            // Close if clicking the backdrop, not the modal content itself
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
                if (window.initMovies && !document.getElementById('movies-section').classList.contains('hidden')) {
                    window.initMovies();
                }
                if (window.initSeries && !document.getElementById('series-section').classList.contains('hidden')) {
                    window.initSeries();
                }
                if (window.initDiscover && !document.getElementById('discover-section').classList.contains('hidden')) {
                    window.initDiscover();
                }
            }
        });
    }

    // Update Cache Duration from Select
    if (settingsCacheSelect) {
        settingsCacheSelect.addEventListener('change', () => {
            const minutes = settingsCacheSelect.value;
            localStorage.setItem('tv_cache_duration', minutes);
            CACHE_DURATION = parseInt(minutes) * 60 * 1000;
        });
    }

    // Save TMDB Token on Input change
    if (settingsTmdbToken) {
        settingsTmdbToken.addEventListener('input', () => {
            const token = settingsTmdbToken.value.trim();
            localStorage.setItem('tmdb_api_token', token);
        });
    }

    // Clear Cache Action
    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            // Remove TV categories cache
            localStorage.removeItem('tv_categories_cache');
            
            // Remove all TV channels caches
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('tv_channels_cache_')) {
                    localStorage.removeItem(key);
                    i--; // Decrement index since length decreased
                }
            }

            // Reset loaded state
            categoriesLoaded = false;
            
            // Re-fetch categories and update views
            loadCategories();

            alert('Caché local limpiada correctamente.');
            if (settingsModal) {
                settingsModal.classList.add('hidden');
            }
        });
    }
});
