const STORAGE_KEY = "unitConverterStateV1";
const MAX_HISTORY = 10;
const MAX_ABS_VALUE = 1e9;

const categoryMap = {
    length: {
        label: "Length",
        metricUnit: "meters",
        imperialUnit: "feet",
        factor: 3.28084,
        tip: "1 meter = 3.28084 feet",
        allowNegative: false
    },
    weight: {
        label: "Weight",
        metricUnit: "kilograms",
        imperialUnit: "pounds",
        factor: 2.20462,
        tip: "1 kilogram = 2.20462 pounds",
        allowNegative: false
    },
    volume: {
        label: "Volume",
        metricUnit: "liters",
        imperialUnit: "gallons",
        factor: 0.264172,
        tip: "1 liter = 0.264172 gallons",
        allowNegative: false
    },
    temperature: {
        label: "Temperature",
        metricUnit: "C",
        imperialUnit: "F",
        tip: "Formula: C x 9/5 + 32 = F, and (F - 32) x 5/9 = C",
        allowNegative: true
    }
};

const btnEl = document.getElementById("btn-el");
const inputEl = document.getElementById("input-el");
const categoryEl = document.getElementById("category-el");
const decimalsEl = document.getElementById("decimals-el");
const swapBtn = document.getElementById("swap-btn");
const clearBtn = document.getElementById("clear-btn");
const themeBtn = document.getElementById("theme-btn");
const copyBtn = document.getElementById("copy-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const resultTitleEl = document.getElementById("result-title");
const resultEl = document.getElementById("result-el");
const unitTipEl = document.getElementById("unit-tip");
const historyEl = document.getElementById("history-el");
const chipButtons = document.querySelectorAll(".chip-btn");
const bodyEl = document.body;

let appState = {
    inputValue: "",
    category: "length",
    decimals: 3,
    direction: "metric-to-imperial",
    theme: "light",
    history: [],
    lastResult: ""
};

initialize();

function initialize() {
    hydrateState();
    applyStateToUI();
    renderHistory();
    renderConversion(false);
    bindEvents();
}

function bindEvents() {
    btnEl.addEventListener("click", function() {
        renderConversion(true);
    });

    inputEl.addEventListener("input", function() {
        appState.inputValue = inputEl.value;
        renderConversion(false);
    });

    categoryEl.addEventListener("change", function() {
        appState.category = categoryEl.value;
        renderConversion(false);
    });

    decimalsEl.addEventListener("change", function() {
        appState.decimals = Number(decimalsEl.value);
        renderConversion(false);
    });

    swapBtn.addEventListener("click", function() {
        appState.direction =
            appState.direction === "metric-to-imperial"
                ? "imperial-to-metric"
                : "metric-to-imperial";
        renderConversion(false);
    });

    clearBtn.addEventListener("click", clearInput);

    themeBtn.addEventListener("click", function() {
        appState.theme = appState.theme === "light" ? "dark" : "light";
        applyTheme();
        persistState();
    });

    copyBtn.addEventListener("click", copyResult);

    clearHistoryBtn.addEventListener("click", function() {
        appState.history = [];
        renderHistory();
        persistState();
    });

    chipButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            inputEl.value = button.dataset.value;
            appState.inputValue = inputEl.value;
            renderConversion(true);
        });
    });

    inputEl.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            renderConversion(true);
        }

        if (event.key === "Escape") {
            event.preventDefault();
            clearInput();
        }
    });
}

function renderConversion(saveToHistory) {
    const categoryConfig = categoryMap[appState.category];
    const validation = validateInput(inputEl.value, categoryConfig.allowNegative);

    updateHeader(categoryConfig);
    updateTip(categoryConfig);

    if (!validation.valid) {
        setResult(validation.message, true);
        appState.lastResult = validation.message;
        persistState();
        return;
    }

    const numericValue = validation.numericValue;
    const resultText = buildResultText(numericValue, categoryConfig);

    setResult(resultText, false);
    appState.inputValue = inputEl.value;
    appState.lastResult = resultText;

    if (saveToHistory) {
        pushHistory({
            category: categoryConfig.label,
            input: numericValue,
            result: resultText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });
        renderHistory();
    }

    persistState();
}

function buildResultText(value, config) {
    const decimals = appState.decimals;
    const metricFirst = appState.direction === "metric-to-imperial";
    const roundedInput = formatNumber(value, decimals);

    if (appState.category === "temperature") {
        const cToF = formatNumber(value * (9 / 5) + 32, decimals);
        const fToC = formatNumber((value - 32) * (5 / 9), decimals);
        const lineOne = `${roundedInput}${config.metricUnit} = ${cToF}${config.imperialUnit}`;
        const lineTwo = `${roundedInput}${config.imperialUnit} = ${fToC}${config.metricUnit}`;
        return metricFirst ? `${lineOne} | ${lineTwo}` : `${lineTwo} | ${lineOne}`;
    }

    const metricToImperial = formatNumber(value * config.factor, decimals);
    const imperialToMetric = formatNumber(value / config.factor, decimals);
    const lineOne = `${roundedInput} ${config.metricUnit} = ${metricToImperial} ${config.imperialUnit}`;
    const lineTwo = `${roundedInput} ${config.imperialUnit} = ${imperialToMetric} ${config.metricUnit}`;

    return metricFirst ? `${lineOne} | ${lineTwo}` : `${lineTwo} | ${lineOne}`;
}

function updateHeader(config) {
    const directionLabel =
        appState.direction === "metric-to-imperial"
            ? `${config.metricUnit} -> ${config.imperialUnit}`
            : `${config.imperialUnit} -> ${config.metricUnit}`;
    resultTitleEl.textContent = `${config.label} Conversion (${directionLabel})`;
}

function updateTip(config) {
    unitTipEl.textContent = config.tip;
    unitTipEl.title = config.tip;
}

function setResult(message, hasError) {
    resultEl.textContent = message;
    resultEl.classList.toggle("error-text", hasError);
    resultEl.classList.remove("flash");
    void resultEl.offsetWidth;
    resultEl.classList.add("flash");
}

function validateInput(rawValue, allowNegative) {
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) {
        return { valid: false, message: "Enter a number to see conversion results." };
    }

    const numericValue = Number(trimmed);
    if (Number.isNaN(numericValue)) {
        return { valid: false, message: "Only numbers are allowed in the input field." };
    }

    if (!allowNegative && numericValue < 0) {
        return { valid: false, message: "Negative values are not allowed for this category." };
    }

    if (Math.abs(numericValue) > MAX_ABS_VALUE) {
        return { valid: false, message: "Value is too large. Enter a number below 1,000,000,000." };
    }

    return { valid: true, numericValue: numericValue };
}

function copyResult() {
    const content = resultEl.textContent;
    if (!content) {
        return;
    }

    navigator.clipboard.writeText(content).then(
        function() {
            setResult("Result copied to clipboard.", false);
        },
        function() {
            setResult("Copy failed. Browser clipboard permission is blocked.", true);
        }
    );
}

function clearInput() {
    inputEl.value = "";
    appState.inputValue = "";
    renderConversion(false);
}

function pushHistory(entry) {
    appState.history.unshift(entry);
    appState.history = appState.history.slice(0, MAX_HISTORY);
}

function renderHistory() {
    if (appState.history.length === 0) {
        historyEl.innerHTML = "<li class='history-empty'>No conversions yet.</li>";
        return;
    }

    historyEl.innerHTML = appState.history
        .map(function(item) {
            return `<li><strong>${item.time}</strong> ${item.category}: ${item.input} -> ${item.result}</li>`;
        })
        .join("");
}

function formatNumber(value, decimals) {
    return Number(value).toFixed(decimals);
}

function hydrateState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        applyTheme();
        return;
    }

    try {
        const parsed = JSON.parse(stored);
        appState = {
            ...appState,
            ...parsed,
            history: Array.isArray(parsed.history) ? parsed.history.slice(0, MAX_HISTORY) : []
        };
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
    }

    applyTheme();
}

function applyStateToUI() {
    inputEl.value = appState.inputValue;
    categoryEl.value = appState.category;
    decimalsEl.value = String(appState.decimals);
}

function applyTheme() {
    bodyEl.classList.toggle("dark-theme", appState.theme === "dark");
}

function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}
