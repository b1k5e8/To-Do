let currentCategory = 'all';
let currentPriority = 'all';
let categoryToDelete = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateCategoryCounts();
    loadCustomCategories();
    setupEventListeners();
});

function setupEventListeners() {
    // Kategori tıklama eventleri
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterTasksByCategory(category);
        });
    });
    
    // Öncelik filtreleme eventleri
    document.querySelectorAll('.priority-filter-item').forEach(item => {
        item.addEventListener('click', function() {
            const priority = this.getAttribute('data-priority');
            filterTasksByPriority(priority);
        });
    });
    
    // Enter tuşu ile görev ekleme
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Kategori input'unda Enter tuşu
    document.getElementById('newCategoryInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewCategory();
        }
    });
}

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    
    if (taskText === '') {
        alert('Lütfen bir görev yazın!');
        return;
    }
    
    createTaskElement(taskText, category, priority, false);
    saveTaskToLocalStorage(taskText, category, priority, false);
    taskInput.value = '';
    updateTaskCount();
    updateCategoryCounts();
}

function createTaskElement(taskText, category, priority, isCompleted = false) {
    const taskList = document.getElementById('taskList');
    
    const taskItem = document.createElement('li');
    taskItem.className = `task-item priority-${priority} ${isCompleted ? 'completed' : ''}`;
    taskItem.setAttribute('data-category', category);
    taskItem.setAttribute('data-priority', priority);
    
    const categoryNames = {
        'work': '💼 İş',
        'personal': '👤 Kişisel', 
        'shopping': '🛒 Alışveriş',
        'health': '🏥 Sağlık'
    };
    
    const priorityNames = {
        'low': 'Düşük',
        'medium': 'Orta',
        'high': 'Yüksek',
        'urgent': 'Acil'
    };
    
    // Özel kategoriler için emoji ekle
    const customCategories = getCustomCategories();
    if (customCategories[category]) {
        categoryNames[category] = `📁 ${customCategories[category]}`;
    }
    
    taskItem.innerHTML = `
        <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTask(this)">
        <div class="task-content">
            <span class="task-text">${taskText}</span>
            <div class="task-meta">
                <span class="task-category">${categoryNames[category] || `📁 ${category}`}</span>
                <span class="task-priority ${priority}">${priorityNames[priority]}</span>
            </div>
        </div>
        <button class="delete-btn" onclick="deleteTask(this)">Sil</button>
    `;
    
    taskList.appendChild(taskItem);
}

function filterTasksByCategory(category) {
    currentCategory = category;
    
    // Aktif kategoriyi güncelle
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    updateCategoryTitle();
    applyFilters();
}

function filterTasksByPriority(priority) {
    currentPriority = priority;
    
    // Aktif önceliği güncelle
    document.querySelectorAll('.priority-filter-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-priority="${priority}"]`).classList.add('active');
    
    applyFilters();
}

function applyFilters() {
    const tasks = document.querySelectorAll('.task-item');
    let visibleCount = 0;
    
    tasks.forEach(task => {
        const taskCategory = task.getAttribute('data-category');
        const taskPriority = task.getAttribute('data-priority');
        
        const categoryMatch = currentCategory === 'all' || taskCategory === currentCategory;
        const priorityMatch = currentPriority === 'all' || taskPriority === currentPriority;
        
        if (categoryMatch && priorityMatch) {
            task.style.display = 'flex';
            visibleCount++;
        } else {
            task.style.display = 'none';
        }
    });
    
    updateTaskCount();
}

function updateCategoryTitle() {
    const categoryTitles = {
        'all': '📋 Tüm Görevler',
        'work': '💼 İş Görevleri',
        'personal': '👤 Kişisel Görevler',
        'shopping': '🛒 Alışveriş Listesi',
        'health': '🏥 Sağlık Görevleri'
    };
    
    const customCategories = getCustomCategories();
    if (customCategories[currentCategory]) {
        document.getElementById('currentCategoryTitle').textContent = `📁 ${customCategories[currentCategory]} Görevleri`;
    } else {
        document.getElementById('currentCategoryTitle').textContent = categoryTitles[currentCategory] || `📁 ${currentCategory} Görevleri`;
    }
}

function sortTasks() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect.value;
    
    const taskList = document.getElementById('taskList');
    const tasks = Array.from(taskList.querySelectorAll('.task-item'));
    
    if (sortValue === 'default') {
        // Varsayılan sıralama - oluşturulma sırası
        tasks.sort((a, b) => {
            return Array.from(taskList.children).indexOf(a) - Array.from(taskList.children).indexOf(b);
        });
    } else if (sortValue === 'priority') {
        // Önceliğe göre sırala
        const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
        tasks.sort((a, b) => {
            const aPriority = a.getAttribute('data-priority');
            const bPriority = b.getAttribute('data-priority');
            return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
    } else if (sortValue === 'name') {
        // İsme göre sırala
        tasks.sort((a, b) => {
            const aText = a.querySelector('.task-text').textContent.toLowerCase();
            const bText = b.querySelector('.task-text').textContent.toLowerCase();
            return aText.localeCompare(bText);
        });
    }
    
    // Görevleri yeniden sırala
    taskList.innerHTML = '';
    tasks.forEach(task => taskList.appendChild(task));
}

function updateCategoryCounts() {
    const tasks = getTasksFromLocalStorage();
    
    document.querySelectorAll('.category-item').forEach(item => {
        const category = item.getAttribute('data-category');
        let count = 0;
        
        if (category === 'all') {
            count = tasks.filter(task => !task.completed).length;
        } else {
            count = tasks.filter(task => task.category === category && !task.completed).length;
        }
        
        const countElement = item.querySelector('.task-count');
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

function addNewCategory() {
    const newCategoryInput = document.getElementById('newCategoryInput');
    const categoryName = newCategoryInput.value.trim();
    
    if (categoryName === '') {
        alert('Lütfen kategori adı girin!');
        return;
    }
    
    // Kategori adı kontrolü
    const existingCategories = getCustomCategories();
    if (existingCategories[categoryName.toLowerCase()] || 
        ['all', 'work', 'personal', 'shopping', 'health'].includes(categoryName.toLowerCase())) {
        alert('Bu kategori zaten mevcut!');
        return;
    }
    
    // Basit bir ID oluştur
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Yeni kategoriyi sidebar'a ekle
    const categoryList = document.getElementById('categoryList');
    const newCategoryItem = document.createElement('div');
    newCategoryItem.className = 'category-item';
    newCategoryItem.setAttribute('data-category', categoryId);
    newCategoryItem.innerHTML = `
        <div class="category-content">
            <span>📁 ${categoryName}</span>
            <span class="task-count">0</span>
        </div>
        <div class="category-actions">
            <button class="delete-category-btn" onclick="event.stopPropagation(); deleteCategory('${categoryId}')">×</button>
        </div>
    `;
    
    categoryList.appendChild(newCategoryItem);
    
    // Select kutusuna ekle
    const categorySelect = document.getElementById('categorySelect');
    const newOption = document.createElement('option');
    newOption.value = categoryId;
    newOption.textContent = `📁 ${categoryName}`;
    categorySelect.appendChild(newOption);
    
    // Event listener ekle
    newCategoryItem.addEventListener('click', function() {
        const category = this.getAttribute('data-category');
        filterTasksByCategory(category);
    });
    
    // LocalStorage'a kaydet
    saveCustomCategory(categoryId, categoryName);
    
    newCategoryInput.value = '';
    updateCategoryCounts();
}

function deleteCategory(categoryId) {
    const tasks = getTasksFromLocalStorage();
    const categoryTasks = tasks.filter(task => task.category === categoryId);
    
    let message = `"${getCategoryName(categoryId)}" kategorisini silmek istediğinizden emin misiniz?`;
    
    if (categoryTasks.length > 0) {
        message += `\n\nBu kategoride ${categoryTasks.length} görev bulunuyor. Silmek istiyor musunuz?`;
    }
    
    categoryToDelete = categoryId;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('deleteModal').style.display = 'flex';
}

function cancelDelete() {
    document.getElementById('deleteModal').style.display = 'none';
    categoryToDelete = null;
}

function confirmDelete() {
    if (!categoryToDelete) return;
    
    const categoryId = categoryToDelete;
    
    // Kategoriyi sidebar'dan kaldır
    const categoryElement = document.querySelector(`[data-category="${categoryId}"]`);
    if (categoryElement) {
        categoryElement.remove();
    }
    
    // Select kutusundan kaldır
    const categorySelect = document.getElementById('categorySelect');
    const optionToRemove = categorySelect.querySelector(`option[value="${categoryId}"]`);
    if (optionToRemove) {
        optionToRemove.remove();
    }
    
    // Bu kategorideki görevleri sil
    const tasks = getTasksFromLocalStorage();
    const filteredTasks = tasks.filter(task => task.category !== categoryId);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
    
    // Kategoriyi custom categories'den sil
    removeCustomCategory(categoryId);
    
    // Eğer silinen kategori aktif kategoriyse, "Tümü" kategorisine geç
    if (currentCategory === categoryId) {
        filterTasksByCategory('all');
    }
    
    // Sayfayı yenile
    loadTasks();
    updateCategoryCounts();
    
    // Modal'ı kapat
    document.getElementById('deleteModal').style.display = 'none';
    categoryToDelete = null;
}

function getCategoryName(categoryId) {
    const customCategories = getCustomCategories();
    if (customCategories[categoryId]) {
        return customCategories[categoryId];
    }
    
    const defaultCategories = {
        'work': 'İş',
        'personal': 'Kişisel',
        'shopping': 'Alışveriş',
        'health': 'Sağlık',
        'all': 'Tümü'
    };
    
    return defaultCategories[categoryId] || categoryId;
}

// Custom Categories Functions
function getCustomCategories() {
    return JSON.parse(localStorage.getItem('customCategories')) || {};
}

function saveCustomCategory(categoryId, categoryName) {
    const customCategories = getCustomCategories();
    customCategories[categoryId] = categoryName;
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

function removeCustomCategory(categoryId) {
    const customCategories = getCustomCategories();
    delete customCategories[categoryId];
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
}

function loadCustomCategories() {
    const customCategories = getCustomCategories();
    const categoryList = document.getElementById('categoryList');
    const categorySelect = document.getElementById('categorySelect');
    
    Object.keys(customCategories).forEach(categoryId => {
        const categoryName = customCategories[categoryId];
        
        // Sidebar'a ekle
        const newCategoryItem = document.createElement('div');
        newCategoryItem.className = 'category-item';
        newCategoryItem.setAttribute('data-category', categoryId);
        newCategoryItem.innerHTML = `
            <div class="category-content">
                <span>📁 ${categoryName}</span>
                <span class="task-count">0</span>
            </div>
            <div class="category-actions">
                <button class="delete-category-btn" onclick="event.stopPropagation(); deleteCategory('${categoryId}')">×</button>
            </div>
        `;
        
        categoryList.appendChild(newCategoryItem);
        
        // Select kutusuna ekle
        const newOption = document.createElement('option');
        newOption.value = categoryId;
        newOption.textContent = `📁 ${categoryName}`;
        categorySelect.appendChild(newOption);
        
        // Event listener ekle
        newCategoryItem.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterTasksByCategory(category);
        });
    });
}

// LocalStorage Functions
function saveTaskToLocalStorage(taskText, category, priority, completed = false) {
    const tasks = getTasksFromLocalStorage();
    tasks.push({ 
        text: taskText, 
        category: category, 
        priority: priority,
        completed: completed,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasksFromLocalStorage() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function loadTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    const tasks = getTasksFromLocalStorage();
    tasks.forEach(task => createTaskElement(task.text, task.category, task.priority, task.completed));
    updateTaskCount();
    updateCategoryCounts();
    applyFilters();
}

function toggleTask(checkbox) {
    const taskItem = checkbox.parentElement;
    const taskText = taskItem.querySelector('.task-text').textContent;
    const category = taskItem.getAttribute('data-category');
    const priority = taskItem.getAttribute('data-priority');
    
    taskItem.classList.toggle('completed');
    updateTaskInLocalStorage(taskText, category, priority, checkbox.checked);
    updateTaskCount();
    updateCategoryCounts();
}

function updateTaskInLocalStorage(taskText, category, priority, completed) {
    const tasks = getTasksFromLocalStorage();
    const taskIndex = tasks.findIndex(task => 
        task.text === taskText && 
        task.category === category && 
        task.priority === priority
    );
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function deleteTask(button) {
    const taskItem = button.parentElement;
    const taskText = taskItem.querySelector('.task-text').textContent;
    const category = taskItem.getAttribute('data-category');
    const priority = taskItem.getAttribute('data-priority');
    
    if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
        taskItem.remove();
        removeTaskFromLocalStorage(taskText, category, priority);
        updateTaskCount();
        updateCategoryCounts();
    }
}

function removeTaskFromLocalStorage(taskText, category, priority) {
    const tasks = getTasksFromLocalStorage();
    const filteredTasks = tasks.filter(task => 
        !(task.text === taskText && 
          task.category === category && 
          task.priority === priority)
    );
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
}

function clearCompleted() {
    const completedTasks = document.querySelectorAll('.task-item.completed');
    if (completedTasks.length === 0) {
        alert('Tamamlanmış görev bulunmuyor!');
        return;
    }
    
    if (confirm(`${completedTasks.length} tamamlanmış görevi silmek istediğinizden emin misiniz?`)) {
        completedTasks.forEach(task => {
            const taskText = task.querySelector('.task-text').textContent;
            const category = task.getAttribute('data-category');
            const priority = task.getAttribute('data-priority');
            removeTaskFromLocalStorage(taskText, category, priority);
            task.remove();
        });
        updateTaskCount();
        updateCategoryCounts();
    }
}

function updateTaskCount() {
    const visibleTasks = document.querySelectorAll('.task-item[style=""]');
    const completedTasks = document.querySelectorAll('.task-item.completed[style=""]');
    const taskCount = document.getElementById('taskCount');
    taskCount.textContent = `${completedTasks.length}/${visibleTasks.length} tamamlandı`;
}

function exportTasks() {
    const tasks = getTasksFromLocalStorage();
    if (tasks.length === 0) {
        alert('Dışa aktarılacak görev bulunmuyor!');
        return;
    }
    
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'gorevler-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
}
