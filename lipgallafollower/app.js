const addButton = document.getElementById('add-button');
const container = document.getElementById('entries-container');
const totalSolvedEl = document.getElementById('total-solved');
const totalTargetEl = document.getElementById('total-target');
const dateEl = document.getElementById('date-disp');

document.addEventListener('DOMContentLoaded', loadData);

addButton.addEventListener('click', function() {
    addEntryToDOM('', 100, 0);
    saveData();
});

container.addEventListener('input', function(e) {
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
            <!-- Changed from label to input -->
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
    if(entryToRemove) {
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

    localStorage.setItem('lipGallaFollowerData', JSON.stringify(data));
}

function wipeAtMidnight() {
    function scheduleReset() {
        const now = new Date();
        const midnight = new Date();

        midnight.setDate(now.getDate() + 1);
        midnight.setHours(0, 0, 0, 0);

        const msUntilMidnight = midnight - now;

        setTimeout(() => {
            const savedData = localStorage.getItem('lipGallaFollowerData');

            if (savedData) {
                const data = JSON.parse(savedData);

                if (Array.isArray(data)) {
                    data.forEach(item => {
                        item.solved = 0;
                    });

                    localStorage.setItem(
                        'lipGallaFollowerData',
                        JSON.stringify(data)
                    );
                }
            }
            scheduleReset();
        }, msUntilMidnight);
    }

    scheduleReset();
}
wipeAtMidnight();

function updateDate() {
    const date = new Date();
    dateEl.textContent = `${date.getDate().toString().padStart(2, "0")}/${date.getMonth().toString().padStart(2, "0")}`
}
updateDate();

function loadData() {
    const savedData = localStorage.getItem('lipGallaFollowerData');
    
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