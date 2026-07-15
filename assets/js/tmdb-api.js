/**
 * tmdb-api.js - Core TMDB Logic
 * Handles tokens and generic fetch logic for Movies and Series
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const TMDB = {
    getToken: function() {
        return localStorage.getItem('tmdb_api_token');
    },

    isValidToken: function() {
        const token = this.getToken();
        return token && token.trim() !== '';
    },

    getImageUrl: function(path, size = 'w342') {
        if (!path) return '';
        return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
    },

    /**
     * Performs a fetch to TMDB endpoints supporting both v3 API Key and v4 Bearer Token
     */
    fetch: async function(endpoint, errorCallback) {
        const token = this.getToken();
        let url = `${TMDB_BASE_URL}${endpoint}`;
        let options = {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        };
        
        if (token && token.length > 50) {
            // v4 JWT Bearer Token
            options.headers['Authorization'] = `Bearer ${token}`;
        } else if (token) {
            // v3 API Key
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}api_key=${token}`;
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 401 && errorCallback) {
                    errorCallback();
                }
                throw new Error(`TMDB API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error("TMDB Fetch Error:", error);
            throw error;
        }
    }
};

window.TMDB = TMDB;
