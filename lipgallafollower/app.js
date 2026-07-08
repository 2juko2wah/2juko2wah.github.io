const addButton = document.getElementById('add-button');
const container = document.getElementById('entries-container');
const totalSolvedEl = document.getElementById('total-solved');
const totalTargetEl = document.getElementById('total-target');
const dateEl = document.getElementById('date-disp');

let TAB_ID;
let STORAGE_KEY;
let LAST_RESET_KEY;

document.addEventListener('DOMContentLoaded', function () {
    TAB_ID = getTabId();
    STORAGE_KEY = `lipGallaFollowerData_${TAB_ID}`;
    LAST_RESET_KEY = `lipGallaLastReset_${TAB_ID}`;

    loadData();
    updateDate();
    wipeAtMidnight();
});

function getTabId() {
    const params = new URLSearchParams(window.location.search);
    let tabId = params.get('id');

    if (!tabId) {
        tabId = crypto.randomUUID();

        try {
            history.replaceState({}, '', window.location.pathname + '?id=' + tabId);
        } catch (e) {
            window.location.search = '?id=' + tabId;
        }
    }

    return tabId;
}

addButton.addEventListener('click', function () {
    addEntryToDOM('', 100, 0);
    saveData();
});

container.addEventListener('input', function (e) {
    if (e.target.tagName === 'INPUT') {
        saveData();
    }
});

function addEntryToDOM(courseVal, targetVal, solvedVal) {
    const newEntry = document.createElement('div');
    newEntry.classList.add('titles', 'entry');

    newEntry.innerHTML = `
        <div> 
            <h2> Hedef </h2>
            <input type="number" class="target-input" value="${targetVal}" min="0" required>
        </div>
        <div> 
            <h2> Ders </h2>
            <input type="text" class="course-input" value="${courseVal}" placeholder="Ad" required>
        </div>
        <div> 
            <h2> Çözülen </h2>
            <input type="number" class="solved-input" value="${solvedVal}" min="0" required>
        </div>
        <div class="action-div">
            <button class="remove-button" onclick="removeEntry(this)">Sil</button>
        </div>
    `;

    container.appendChild(newEntry);
}

function removeEntry(buttonElement) {
    const entryToRemove = buttonElement.closest('.entry');
    if (entryToRemove) {
        entryToRemove.remove();
        saveData();
    }
}

function saveData() {
    const entries = document.querySelectorAll('.entry');
    const data = [];
    let totalTarget = 0;
    let totalSolved = 0;

    entries.forEach(entry => {
        const target = parseInt(entry.querySelector('.target-input').value) || 0;
        const course = entry.querySelector('.course-input').value;
        const solved = parseInt(entry.querySelector('.solved-input').value) || 0;

        totalTarget += target;
        totalSolved += solved;

        data.push({ target, course, solved });
    });

    totalTargetEl.textContent = totalTarget;
    totalSolvedEl.textContent = totalSolved;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function checkMidnightReset() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem(LAST_RESET_KEY);

    if (lastReset !== today) {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (savedData) {
            const data = JSON.parse(savedData);

            if (Array.isArray(data)) {
                data.forEach(item => {
                    item.solved = 0;
                });

                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
        }

        localStorage.setItem(LAST_RESET_KEY, today);
    }
}

function wipeAtMidnight() {
    function scheduleReset() {
        const now = new Date();
        const midnight = new Date();

        midnight.setDate(now.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);

        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            checkMidnightReset();
            loadDataIntoDOM();
            updateDate();
            scheduleReset();
        }, msUntilMidnight);
    }

    scheduleReset();
}

function updateDate() {
    const date = new Date();

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    dateEl.textContent = `${day}/${month}`;
}

function loadDataIntoDOM() {
    container.innerHTML = '';

    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.length > 0) {
            data.forEach(item => {
                addEntryToDOM(item.course, item.target, item.solved);
            });
        } else {
            addEntryToDOM('', 100, 0);
        }
    } else {
        addEntryToDOM('', 100, 0);
    }

    saveData();
}

function loadData() {
    checkMidnightReset();
    loadDataIntoDOM();
}