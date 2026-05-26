/**
 * FLIXFINDER - Netflix-Style Movie Details Finder
 * Core JavaScript Logic
 * 
 * This script handles user interactions, API integration with OMDB API,
 * state changes (loading, results, errors), and storing configuration key locally.
 */

// --- Constants & Global State ---
// The default API Key provided by the user
const DEFAULT_API_KEY = "81776180";
// Variable to store the currently active API key
let activeApiKey = DEFAULT_API_KEY;

// --- DOM Elements Selection ---
// Search elements
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const searchSubmitBtn = document.getElementById("search-submit-btn");

// Suggestion pills
const suggestionsContainer = document.getElementById("suggestions-container");
const suggestionPills = document.querySelectorAll(".pill-btn");

// State containers
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const errorRetryBtn = document.getElementById("error-retry-btn");
const movieDetailsContainer = document.getElementById("movie-details-container");

// Header and Modal elements
const brandLogo = document.getElementById("brand-logo");
const settingsToggleBtn = document.getElementById("settings-toggle-btn");
const settingsModal = document.getElementById("settings-modal");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal-btn");
const apiKeyInput = document.getElementById("api-key-input");
const toggleKeyVisibilityBtn = document.getElementById("toggle-key-visibility");
const saveKeyBtn = document.getElementById("save-key-btn");
const resetKeyBtn = document.getElementById("reset-key-btn");

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Load saved API Key from localStorage if it exists
    const savedKey = localStorage.getItem("omdb_api_key");
    if (savedKey) {
        activeApiKey = savedKey;
        apiKeyInput.value = savedKey;
    } else {
        apiKeyInput.value = DEFAULT_API_KEY;
    }
    
    // Check if the search input already has text (for clear button visibility)
    toggleClearButtonVisibility();
});

// --- Event Listeners ---

// 1. Search Form Submission
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        fetchMovieDetails(query);
    }
});

// 2. Clear Search Input
clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    toggleClearButtonVisibility();
});

// Show/hide clear button on input
searchInput.addEventListener("input", toggleClearButtonVisibility);

// 3. Quick Suggestion Pills clicks
suggestionPills.forEach(pill => {
    pill.addEventListener("click", () => {
        const movieName = pill.getAttribute("data-movie");
        searchInput.value = movieName;
        toggleClearButtonVisibility();
        fetchMovieDetails(movieName);
        
        // Scroll smoothly to details container on mobile
        window.scrollTo({
            top: searchForm.getBoundingClientRect().top + window.scrollY - 20,
            behavior: 'smooth'
        });
    });
});

// 4. Retry Search Button (in Error State)
errorRetryBtn.addEventListener("click", () => {
    hideAllStates();
    searchInput.focus();
    searchInput.select();
});

// 5. Settings Modal Controls
settingsToggleBtn.addEventListener("click", openSettingsModal);
closeModalBtn.addEventListener("click", closeSettingsModal);
modalOverlay.addEventListener("click", closeSettingsModal);

// Close modal on Escape key press
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !settingsModal.classList.contains("hidden")) {
        closeSettingsModal();
    }
});

// Save settings key
saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        activeApiKey = key;
        localStorage.setItem("omdb_api_key", key);
        showToast("✓ API Key saved successfully!");
        closeSettingsModal();
    } else {
        showToast("⚠ Please enter a valid API Key");
    }
});

// Reset key to default
resetKeyBtn.addEventListener("click", () => {
    activeApiKey = DEFAULT_API_KEY;
    apiKeyInput.value = DEFAULT_API_KEY;
    localStorage.removeItem("omdb_api_key");
    showToast("↺ Reset to default key");
    closeSettingsModal();
});

// Toggle password text visibility in Key settings input
toggleKeyVisibilityBtn.addEventListener("click", () => {
    const icon = toggleKeyVisibilityBtn.querySelector("i");
    if (apiKeyInput.type === "password") {
        apiKeyInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        apiKeyInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
});

// Logo resets search screen
brandLogo.addEventListener("click", () => {
    searchInput.value = "";
    toggleClearButtonVisibility();
    hideAllStates();
    // Re-show suggestion panel at the top
    suggestionsContainer.classList.remove("hidden");
});

// --- Helper Functions ---

/**
 * Shows/Hides the input clear button based on text length
 */
function toggleClearButtonVisibility() {
    if (searchInput.value.length > 0) {
        clearSearchBtn.classList.add("visible");
    } else {
        clearSearchBtn.classList.remove("visible");
    }
}

/**
 * Hides all main state displays (loading, error, details)
 */
function hideAllStates() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    movieDetailsContainer.classList.add("hidden");
}

/**
 * Open API key configuration modal
 */
function openSettingsModal() {
    settingsModal.classList.remove("hidden");
    // Ensure visibility toggle icon matches password state on load
    apiKeyInput.type = "password";
    const icon = toggleKeyVisibilityBtn.querySelector("i");
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
}

/**
 * Close API key configuration modal
 */
function closeSettingsModal() {
    settingsModal.classList.add("hidden");
}

/**
 * Utility to display a clean Netflix-style feedback toast message
 */
function showToast(message) {
    // Check if toast already exists, otherwise create it
    let toast = document.querySelector(".toast-msg");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast-msg";
        document.body.appendChild(toast);
    }
    
    // Set message
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    
    // Animate in
    toast.classList.add("show");
    
    // Animate out after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// --- API & Data Fetching ---

/**
 * Fetches movie details from OMDB API based on search query
 * @param {string} query - The movie name
 */
async function fetchMovieDetails(query) {
    // 1. Setup UI for loading state
    hideAllStates();
    loadingState.classList.remove("hidden");
    
    // Build the request URL
    // We request 'plot=full' to retrieve the complete overview/plot
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=${activeApiKey}&plot=full`;
    
    try {
        const response = await fetch(url);
        
        // Check for network errors (HTTP status not 200 OK)
        if (!response.ok) {
            throw new Error(`HTTP network error: status ${response.status}`);
        }
        
        const data = await response.json();
        
        // 2. Parse API response state
        if (data.Response === "True") {
            // Success: Display movie details
            renderMovieDetails(data);
        } else {
            // OMDB API Error (e.g. movie not found)
            displayError("Movie Not Found", data.Error || "We couldn't find the movie. Try checking the spelling.");
        }
    } catch (error) {
        console.error("Fetch error details: ", error);
        displayError(
            "Service Temporarily Unavailable", 
            "A network or system error occurred while fetching details. Please verify your API Key or try again later."
        );
    }
}

/**
 * Renders the fetched movie data into the HTML container
 * @param {Object} movieData - The JSON response from OMDB API
 */
function renderMovieDetails(movieData) {
    hideAllStates();
    
    // Destructure necessary fields with clean fallbacks
    const {
        Title = "Unknown Title",
        Year = "N/A",
        Rated = "Not Rated",
        Released = "N/A",
        Runtime = "N/A",
        Genre = "N/A",
        Director = "N/A",
        Writer = "N/A",
        Actors = "N/A",
        Plot = "No overview description available.",
        Language = "N/A",
        Country = "N/A",
        Poster = "N/A",
        Ratings = []
    } = movieData;

    // Helper to find specific source scores from Ratings array
    const findRating = (sourceName) => {
        const ratingObj = Ratings.find(r => r.Source === sourceName);
        return ratingObj ? ratingObj.Value : null;
    };

    const imdbScore = findRating("Internet Movie Database") || movieData.imdbRating || "N/A";
    const rtScore = findRating("Rotten Tomatoes") || "N/A";
    const metaScore = findRating("Metacritic") || movieData.Metascore || "N/A";

    // Setup Poster markup - fallback to blank icon placeholder if Poster is 'N/A'
    let posterHtml = "";
    if (Poster && Poster !== "N/A") {
        posterHtml = `<img src="${Poster}" alt="${Title} Poster" class="movie-poster" loading="lazy">`;
    } else {
        posterHtml = `
            <div class="no-poster">
                <i class="fas fa-film"></i>
                <span>No Poster Available</span>
            </div>
        `;
    }

    // Dynamic HTML template injection
    movieDetailsContainer.innerHTML = `
        <div class="movie-card">
            <!-- Dynamic ambient background using the poster path if available -->
            <div class="movie-card-backdrop" style="background-image: url('${Poster && Poster !== 'N/A' ? Poster : ''}')"></div>
            
            <!-- Poster left column -->
            <div class="movie-poster-wrapper">
                ${posterHtml}
                
                <!-- Action Buttons (Aesthetic) -->
                <div class="movie-actions-row">
                    <button class="netflix-btn btn-play" onclick="handleAestheticClick('Play Trailer')">
                        <i class="fas fa-play"></i> Play
                    </button>
                    <button class="netflix-btn btn-list" onclick="handleAestheticClick('Add to My List')">
                        <i class="fas fa-plus"></i> My List
                    </button>
                </div>
            </div>
            
            <!-- Metadata right column -->
            <div class="movie-info-panel">
                <!-- Title Row -->
                <div class="movie-title-row">
                    <h2>${Title}</h2>
                </div>
                
                <!-- Metadata Badges -->
                <div class="movie-meta-badges">
                    <span class="meta-item badge-age">${Rated}</span>
                    <span class="meta-item">${Year}</span>
                    <span class="meta-item"><i class="far fa-clock"></i> ${Runtime}</span>
                    <span class="meta-item badge-hd">HD</span>
                </div>
                
                <!-- Ratings Score Box -->
                <div class="movie-ratings-row">
                    <!-- IMDb Score -->
                    <div class="rating-badge imdb" title="IMDb Rating">
                        <i class="fas fa-star"></i>
                        <div class="score-info">
                            <span class="rating-score">${imdbScore}</span>
                            <span class="rating-source">IMDb</span>
                        </div>
                    </div>
                    <!-- Rotten Tomatoes Score -->
                    ${rtScore !== "N/A" ? `
                    <div class="rating-badge rotten" title="Rotten Tomatoes Score">
                        <i class="fas fa-apple-whole"></i>
                        <div class="score-info">
                            <span class="rating-score">${rtScore}</span>
                            <span class="rating-source">Rotten Tomatoes</span>
                        </div>
                    </div>
                    ` : ''}
                    <!-- Metacritic Score -->
                    ${metaScore !== "N/A" ? `
                    <div class="rating-badge meta" title="Metascore">
                        <i class="fas fa-gauge-high"></i>
                        <div class="score-info">
                            <span class="rating-score">${metaScore}</span>
                            <span class="rating-source">Metascore</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Plot Box -->
                <div class="movie-plot-box">
                    <h4 class="plot-title">Overview</h4>
                    <p class="movie-plot">${Plot}</p>
                </div>
                
                <!-- Expanded Metadata Grid -->
                <div class="movie-details-grid">
                    <div class="detail-row">
                        <span class="detail-label">Starring</span>
                        <span class="detail-value">${Actors}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Director</span>
                        <span class="detail-value">${Director}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Writer</span>
                        <span class="detail-value">${Writer}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Language</span>
                        <span class="detail-value">${Language}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Released</span>
                        <span class="detail-value">${Released} (${Country})</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Display movie details element
    movieDetailsContainer.classList.remove("hidden");
}

/**
 * Prepares the error display container
 * @param {string} title - Brief error header title
 * @param {string} message - Suggestive descriptive error message
 */
function displayError(title, message) {
    hideAllStates();
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorState.classList.remove("hidden");
}

/**
 * Handle clicks on dynamic trailer/watchlist buttons (aesthetic mockup behavior)
 * @param {string} actionType - 'Play Trailer' or 'Add to My List'
 */
function handleAestheticClick(actionType) {
    if (actionType === 'Play Trailer') {
        showToast("▶ Playing trailer... (Mock action)");
    } else {
        showToast("✓ Added to My List! (Mock action)");
    }
}