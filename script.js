document.addEventListener('DOMContentLoaded',()=>{

    //UserProfile from localStorage

    let userProfile = JSON.parse(localStorage.getItem('user')) || { userName: 'Guest', curr: '$' };

    //Settings Elements
    const topbarName = document.getElementById('topbarName');
    const settingsForm = document.getElementById('settingsForm');
    const settingNameInput = document.getElementById('settingName');
    const settingCurrencyInput = document.getElementById('settingCurrency');

    //Modal Elements
    const modal = document.getElementById('transactionalModal');
    const addBtn = document.getElementById('openAddModalBtn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('transactionForm');
    const modalTitle = document.getElementById('modalTitle');
    const searchInput = document.getElementById('searchInput');

    //Important Elements
    const tableBody = document.getElementById('transactionTableBody');
    const balanceEl = document.getElementById('displayBalance');
    const incomeEl = document.getElementById('displayIncome');
    const expenseEl = document.getElementById('displayExpense');
    const countEl = document.getElementById('displayCount');
    const typeFilter = document.getElementById('typeFilter');

    //Create storage Key for This specific user

    let storageKey = `transactions_${userProfile.userName}`;
    let transactions = JSON.parse(localStorage.getItem(storageKey)) || [];
    let myChart = null;

    //UI interaction (modal)
    const openModal = ()=>{
        form.reset();
        document.getElementById('txId').value = ''; 
        document.getElementById('txDate').valueAsDate = new Date();
        modal.classList.add('active');
    }
    const closeModal = ()=>{
        modal.classList.remove('active');
    }

    addBtn.addEventListener('click',()=>{
        openModal();
    })

    closeBtn.addEventListener('click',()=>{
        closeModal();
    })
    window.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if(confirm('WARNING: This will delete all your transaction data permanently!')) {
            transactions = [];
            updateUI();
        }
    });

    //Filters
    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const filterType = typeFilter.value; 

        const filtered = transactions.filter(tx => {
            const matchesSearch = tx.description.toLowerCase().includes(term) || 
                                  tx.category.toLowerCase().includes(term);
            const matchesType = (filterType === 'all') || (tx.type === filterType);
            return matchesSearch && matchesType;
        });
        
        updateUI(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);


    //Chart.js

    function updateChart(income,expense){
        const ctx = document.getElementById('cashFlowChart');
        if (myChart) { myChart.destroy(); }

        myChart = new Chart(ctx, {
            type: 'bar',
        data: {
        labels: ["Income vs Expense"],
        datasets: [
                    { label: 'Income', data: [income], backgroundColor: '#166534', borderRadius: 4 , barThickness: 80,borderWidth: 1 },
                    { label: 'Expenses', data: [expense], backgroundColor: '#991b1b', borderRadius: 4, barThickness: 80 , borderWidth: 1}
                ]
        },
        options: {
                responsive: true, 
                maintainAspectRatio: false,
                scales: { 
                    y: { 
                        beginAtZero: true 
                    } 
                },
                plugins: { 
                    legend: { 
                        position: 'top' 
                    } 
                }
            }
        });
    }

    //Setting Form 
    settingsForm.addEventListener('submit',(e)=>{
        e.preventDefault();
        const newName = settingNameInput.value;
        const newCurrency = settingCurrencyInput.value;




        if (newName !== userProfile.userName) {
            const newStorageKey = `transactions_${newName}`;
            localStorage.setItem(newStorageKey, JSON.stringify(transactions));
            localStorage.removeItem(storageKey); // Clean up old data
            storageKey = newStorageKey; // Update active key
        }

        let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

        let registeredUser = users.find(u => u.userName === userProfile.userName);

        registeredUser.userName = newName;
        registeredUser.curr = newCurrency;
        localStorage.setItem('registeredUsers',JSON.stringify(users));
        userProfile = {
            userName: newName,
            curr: newCurrency
        };


        
        localStorage.setItem('user', JSON.stringify(userProfile)); 
        
        initProfile(); 
        updateUI();    
        alert('Settings saved successfully!');
    })

    //Update UI
    const generateID = () => Date.now();
    function updateUI(dataToRender = transactions) {
        tableBody.innerHTML = ''; 
        
        let totalIncome = 0;
        let totalExpense = 0;
        const cur = userProfile.curr || '$';

        dataToRender.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpense += tx.amount;
            }

            const sign = tx.type === 'income' ? '+' : '-';
            const colorClass = tx.type === 'income' ? 'text-green' : 'text-red';
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${tx.date}</td>
                <td><strong>${tx.description}</strong></td>
                <td><span class="tag">${tx.category}</span></td>
                <td class="${colorClass}">${sign}${cur}${tx.amount.toFixed(2)}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="editTransaction(${tx.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteTransaction(${tx.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Update Summary Cards with correct currency
        const balance = totalIncome - totalExpense;
        balanceEl.innerText = `${balance < 0 ? '-' : ''}${cur}${Math.abs(balance).toFixed(2)}`;
        incomeEl.innerText = `${cur}${totalIncome.toFixed(2)}`;
        expenseEl.innerText = `${cur}${totalExpense.toFixed(2)}`;
        countEl.innerText = dataToRender.length;

        // Save to the USER-SPECIFIC key
        localStorage.setItem(storageKey, JSON.stringify(transactions));
        updateChart(totalIncome, totalExpense);
    }
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('txId').value;
        const type = document.getElementById('txType').value;
        const description = document.getElementById('txDescription').value;
        const amount = parseFloat(document.getElementById('txAmount').value);
        const date = document.getElementById('txDate').value;
        const category = document.getElementById('txCategory').value;

        const newTx = {
            id: id ? parseInt(id) : generateID(),
            type, description, amount, date, category
        };

        if (id) {
            transactions = transactions.map(tx => tx.id === newTx.id ? newTx : tx);
        } else {
            transactions.push(newTx);
        }
        
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        closeModal();
        updateUI();
    });

    window.deleteTransaction = (id) => {
        if(confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(tx => tx.id !== id);
            updateUI();
        }
    };

    window.editTransaction = (id) => {
        const tx = transactions.find(t => t.id === id);
        if(!tx) return;

        document.getElementById('txId').value = tx.id;
        document.getElementById('txType').value = tx.type;
        document.getElementById('txDescription').value = tx.description;
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txCategory').value = tx.category;

        modalTitle.innerText = "Edit Transaction";
        modal.classList.add('active');
    };
    //logOut user

    document.getElementById('logoutBtn').addEventListener('click',()=>{
        localStorage.removeItem('user');
        window.location.replace('login.html');
    })

    //theme toggling

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        darkModeToggle.checked = true;
    }

    const darkModeToggle = document.getElementById('darkModeToggle');

    darkModeToggle.addEventListener('change', (e) => {

        // console.log(e)
        if (e.target.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    //Navigation
    const navItems = document.querySelectorAll('.nav-menu .nav-item[data-target]');
    // console.log(navItems)
    const views = document.querySelectorAll('.view-section');
    // console.log(views)

    navItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-menu .nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(item.getAttribute('data-target')).classList.add('active');
        });
    });

    //Profile Initialization

    function initProfile() {
        topbarName.innerText = userProfile.userName;
        settingNameInput.value = userProfile.userName;
        settingCurrencyInput.value = userProfile.curr || '$';
    }
    initProfile();
    updateUI();
})