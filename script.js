// Get DOM elements
const gridContainer = document.getElementById('grid-container');
const timerDisplay = document.getElementById('timer');
const targetNumberDisplay = document.getElementById('target-number');
const resetButton = document.getElementById('reset-button');
const gridSizeSelect = document.getElementById('grid-size');
const instructionText = document.getElementById('instruction-text');
const bestTimeDisplay = document.getElementById('best-time'); // Moved up

// Game state variables
let numbers = [];
let currentNumber = 1;
let timerId = null;
let startTime = 0;
let gameInProgress = false;
let currentGridSize = 5;
let totalNumbers = 25;
let currentBestTime = Infinity;

// --- Core Functions ---

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Creates and populates the game grid based on selected size
 */
function createGrid() {
    // 1. Get selected grid size
    currentGridSize = parseInt(gridSizeSelect.value);
    totalNumbers = currentGridSize * currentGridSize;

    // 2. Reset game state
    stopTimer();
    gridContainer.innerHTML = ''; // Clear old grid
    currentNumber = 1;
    gameInProgress = false;
    timerDisplay.textContent = '0.00';
    targetNumberDisplay.textContent = '1';
    targetNumberDisplay.classList.remove('text-green-600');
    targetNumberDisplay.classList.add('text-blue-600');
    
    // Load and display best time for this grid size
    loadBestTime();

    // Update instruction text
    instructionText.textContent = `Click the numbers in order from 1 to ${totalNumbers}.`;
    
    // Set grid columns dynamically
    gridContainer.style.gridTemplateColumns = `repeat(${currentGridSize}, minmax(0, 1fr))`;

    // 3. Create and shuffle numbers
    numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
    shuffle(numbers);

    // 4. Create and append cells
    for (const number of numbers) {
        const cell = document.createElement('div');
        cell.textContent = number;
        cell.dataset.number = number;
        
        // Style the cell with Tailwind classes
        // Added 'cell' class for user-select: none
        // Added slight transparency and backdrop blur for a modern look
        cell.className = 'cell flex items-center justify-center aspect-square bg-white/50 border border-gray-200 rounded-lg text-xl sm:text-2xl font-medium text-gray-700 cursor-pointer transition-all duration-150 hover:bg-white hover:border-gray-300 hover:shadow-sm';
        
        // Add click event listener
        cell.addEventListener('click', handleCellClick);
        gridContainer.appendChild(cell);

        // Add pulse animation to '1'
        if (number === 1) {
            cell.classList.add('animate-pulse-once', 'border-blue-400');
        }
    }
}

/**
 * Handles the logic when a cell is clicked
 */
function handleCellClick(event) {
    const clickedElement = event.target;
    const clickedNumber = parseInt(clickedElement.dataset.number);

    // --- Game Start ---
    // Start timer on the first *correct* click
    if (!gameInProgress && clickedNumber === 1) {
        gameInProgress = true;
        startTimer();
        // Remove pulse from '1' once clicked
        clickedElement.classList.remove('animate-pulse-once', 'border-blue-400');
    }

    // Don't allow clicks if game hasn't started (unless it's '1')
    if (!gameInProgress) {
        if (clickedNumber !== 1) {
            flashCell(clickedElement, 'wrong');
        } else {
            // It was '1', so remove pulse
            clickedElement.classList.remove('animate-pulse-once', 'border-blue-400');
        }
        return;
    }

    // --- Game Logic ---
    if (clickedNumber === currentNumber) {
        // Correct click
        flashCell(clickedElement, 'correct');
        
        // Mark as found
        clickedElement.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-50');
        clickedElement.classList.add('bg-gray-100', 'text-gray-400', 'cursor-not-allowed');

        currentNumber++;

        if (currentNumber > totalNumbers) {
            // Game Won
            stopTimer();
            gameInProgress = false;
            targetNumberDisplay.textContent = 'Done!';
            targetNumberDisplay.classList.remove('text-blue-600');
            targetNumberDisplay.classList.add('text-green-600');
            
            // Check and save best time
            const finalTime = parseFloat(timerDisplay.textContent);
            saveBestTime(finalTime);

        } else {
            // Update to next number
            targetNumberDisplay.textContent = currentNumber;
        }
    } else {
        // Wrong click
        flashCell(clickedElement, 'wrong');
    }
}

/**
 * Starts the game timer
 */
function startTimer() {
    startTime = Date.now();
    timerId = setInterval(updateTimer, 40); // Update every 40ms for smooth 2-decimal display
}

/**
 * Updates the timer display
 */
function updateTimer() {
    const elapsedTime = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = elapsedTime.toFixed(2);
}

/**
 * Stops the game timer
 */
function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

/**
 * Flashes a cell 'correct' (green) or 'wrong' (red)
 */
function flashCell(element, type) {
    if (type === 'correct') {
        element.classList.add('bg-green-200', 'border-green-400');
        setTimeout(() => {
            // The 'correct' state is handled by the click handler
            // Only remove flash if it's not yet marked as "found"
            if (!element.classList.contains('bg-gray-100')) {
                element.classList.remove('bg-green-200', 'border-green-400');
            }
        }, 200);
    } else { // 'wrong'
        element.classList.add('bg-red-200', 'border-red-400', 'animate-shake');
        setTimeout(() => {
            element.classList.remove('bg-red-200', 'border-red-400', 'animate-shake');
        }, 300);
    }
}

// --- New Helper Functions for Best Time ---

/**
 * Loads the best time from localStorage for the current grid size
 */
function loadBestTime() {
    const key = `schulteBestTime_${currentGridSize}`;
    const best = localStorage.getItem(key);
    if (best) {
        currentBestTime = parseFloat(best);
        bestTimeDisplay.textContent = currentBestTime.toFixed(2);
    } else {
        currentBestTime = Infinity;
        bestTimeDisplay.textContent = '--.--';
    }
}

/**
 * Saves a new best time to localStorage if it's better than the current one
 */
function saveBestTime(time) {
    if (time < currentBestTime) {
        currentBestTime = time;
        const key = `schulteBestTime_${currentGridSize}`;
        localStorage.setItem(key, time.toString());
        bestTimeDisplay.textContent = time.toFixed(2);
    }
}


// --- Initialization ---

// Add listeners
resetButton.addEventListener('click', createGrid);
gridSizeSelect.addEventListener('change', createGrid);

// Create the initial grid on page load
createGrid();
