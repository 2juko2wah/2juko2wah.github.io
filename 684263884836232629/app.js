const addButton = document.getElementById('add-button');
const container = document.getElementById('entries-container');
const totalSolvedEl = document.getElementById('total-solved');
const totalTargetEl = document.getElementById('total-target');

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
            <h2> Hedef Soru Sayısı </h2>
            <input type="number" class="target-input" value="${targetVal}" min="0" required>
        </div>
        <div> 
            <h2> Ders Adı </h2>
            <input type="text" class="course-input" value="${courseVal}" placeholder="Ders Adı" required>
        </div>
        <div> 
            <h2> Çözülen Soru Sayısı </h2>
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