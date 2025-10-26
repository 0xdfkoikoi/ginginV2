// Global variables
let isAdminLoggedIn = false;
let currentSessionId = null;
const API_BASE_URL = 'https://ginginv2.realganganadul.workers.dev';

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const loginModal = document.getElementById('loginModal');
const adminPanelModal = document.getElementById('adminPanelModal');
const loginForm = document.getElementById('loginForm');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeAdminModal = document.getElementById('closeAdminModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAdminSession();
});

function initializeApp() {
    // Generate a unique session ID for this user
    currentSessionId = generateSessionId();
    console.log('Session ID:', currentSessionId);
}

function setupEventListeners() {
    // Chat functionality
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Admin login
    adminLoginBtn.addEventListener('click', openLoginModal);
    closeLoginModal.addEventListener('click', closeLoginModalFunc);
    closeAdminModal.addEventListener('click', closeAdminModalFunc);
    loginForm.addEventListener('submit', handleLogin);

    // Modal close on outside click
    loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            closeLoginModalFunc();
        }
    });

    adminPanelModal.addEventListener('click', function(e) {
        if (e.target === adminPanelModal) {
            closeAdminModalFunc();
        }
    });

    // Admin panel tabs
    setupAdminTabs();
    setupAdminControls();
}

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Chat functionality
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    chatInput.value = '';
    sendBtn.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: currentSessionId
            })
        });

        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();

        if (data.success) {
            addMessageToChat(data.response, 'bot');
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        addMessageToChat('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
    } finally {
        sendBtn.disabled = false;
    }
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-coffee"></i>' : '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = `<p>${message}</p>`;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    content.appendChild(bubble);
    content.appendChild(time);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Admin functionality
function openLoginModal() {
    loginModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeLoginModalFunc() {
    loginModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    loginForm.reset();
}

function closeAdminModalFunc() {
    adminPanelModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            isAdminLoggedIn = true;
            localStorage.setItem('adminToken', data.token);
            closeLoginModalFunc();
            openAdminPanel();
            loadAdminData();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function openAdminPanel() {
    adminPanelModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

async function checkAdminSession() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                isAdminLoggedIn = true;
                adminLoginBtn.style.display = 'none';
            } else {
                localStorage.removeItem('adminToken');
            }
        } catch (error) {
            console.error('Session verification error:', error);
            localStorage.removeItem('adminToken');
        }
    }
}

// Admin panel functionality
function setupAdminTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function setupAdminControls() {
    // Inventory controls
    document.getElementById('addProductBtn').addEventListener('click', showAddProductForm);
    document.getElementById('refreshInventoryBtn').addEventListener('click', loadInventoryData);

    // Invoice controls
    document.getElementById('createInvoiceBtn').addEventListener('click', showCreateInvoiceForm);
    document.getElementById('refreshInvoicesBtn').addEventListener('click', loadInvoiceData);

    // Report controls
    document.getElementById('generateChatReportBtn').addEventListener('click', generateChatReport);
    document.getElementById('generateInvoiceReportBtn').addEventListener('click', generateInvoiceReport);
    document.getElementById('generateInventoryReportBtn').addEventListener('click', generateInventoryReport);
}

async function loadAdminData() {
    await Promise.all([
        loadDashboardStats(),
        loadInventoryData(),
        loadInvoiceData()
    ]);
}

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('totalCustomers').textContent = data.stats.totalCustomers || 0;
            document.getElementById('totalOrders').textContent = data.stats.totalOrders || 0;
            document.getElementById('totalRevenue').textContent = `$${data.stats.totalRevenue || 0}`;
            document.getElementById('totalProducts').textContent = data.stats.totalProducts || 0;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadInventoryData() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            const tbody = document.getElementById('inventoryTableBody');
            tbody.innerHTML = '';

            data.inventory.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${item.category || item.sku}</td>
                    <td>${item.quantity} kg</td>
                    <td>$${item.price}/kg</td>
                    <td>
                        <button class="btn-secondary" onclick="editProduct('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-secondary" onclick="deleteProduct('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading inventory data:', error);
    }
}

async function loadInvoiceData() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/invoices`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            const tbody = document.getElementById('invoiceTableBody');
            tbody.innerHTML = '';

            data.invoices.forEach(invoice => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${invoice.invoiceNumber}</td>
                    <td>${invoice.customerName}</td>
                    <td>$${invoice.amount}</td>
                    <td>${new Date(invoice.date).toLocaleDateString()}</td>
                    <td><span class="status-badge ${invoice.status}">${invoice.status}</span></td>
                    <td>
                        <button class="btn-secondary" onclick="viewInvoice('${invoice.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-secondary" onclick="downloadInvoice('${invoice.id}')">
                            <i class="fas fa-download"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
    }
}

function showAddProductForm() {
    const coffeeVariety = prompt('Coffee Variety (e.g., Arabica Bourbon):');
    if (!coffeeVariety) return;

    const origin = prompt('Origin (e.g., Ethiopia, Colombia):');
    if (!origin) return;

    const stock = prompt('Stock in kg:');
    if (!stock) return;

    const pricePerKg = prompt('Price per kg ($):');
    if (!pricePerKg) return;

    addProduct({
        name: coffeeVariety,
        sku: `${origin.toUpperCase()}-${coffeeVariety.replace(/\s+/g, '-').toUpperCase()}`,
        quantity: parseInt(stock),
        price: parseFloat(pricePerKg),
        category: origin
    });
}

async function addProduct(productData) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Product added successfully!');
            loadInventoryData();
        } else {
            alert('Failed to add product. Please try again.');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product. Please try again.');
    }
}

function showCreateInvoiceForm() {
    const buyerName = prompt('Buyer/Importer Name:');
    if (!buyerName) return;

    const coffeeVariety = prompt('Coffee Variety:');
    if (!coffeeVariety) return;

    const quantity = prompt('Quantity (kg):');
    if (!quantity) return;

    const pricePerKg = prompt('Price per kg ($):');
    if (!pricePerKg) return;

    const totalAmount = parseFloat(quantity) * parseFloat(pricePerKg);

    createInvoice({
        customerName: buyerName,
        amount: totalAmount,
        notes: `${coffeeVariety} - ${quantity}kg @ $${pricePerKg}/kg`
    });
}

async function createInvoice(invoiceData) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Invoice created successfully!');
            loadInvoiceData();
        } else {
            alert('Failed to create invoice. Please try again.');
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        alert('Failed to create invoice. Please try again.');
    }
}

async function generateChatReport() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/reports/chat`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            alert('Chat report generated and sent to Telegram!');
        } else {
            alert('Failed to generate chat report. Please try again.');
        }
    } catch (error) {
        console.error('Error generating chat report:', error);
        alert('Failed to generate chat report. Please try again.');
    }
}

async function generateInvoiceReport() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/reports/invoices`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            alert('Invoice report generated and sent to Telegram!');
        } else {
            alert('Failed to generate invoice report. Please try again.');
        }
    } catch (error) {
        console.error('Error generating invoice report:', error);
        alert('Failed to generate invoice report. Please try again.');
    }
}

async function generateInventoryReport() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/reports/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            alert('Inventory report generated and sent to Telegram!');
        } else {
            alert('Failed to generate inventory report. Please try again.');
        }
    } catch (error) {
        console.error('Error generating inventory report:', error);
        alert('Failed to generate inventory report. Please try again.');
    }
}

// Global functions for table actions
async function editProduct(productId) {
    const newQuantity = prompt('New Stock (kg):');
    if (newQuantity === null) return;

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: parseInt(newQuantity) })
        });

        const data = await response.json();
        if (data.success) {
            alert('Product updated successfully!');
            loadInventoryData();
        } else {
            alert('Failed to update product. Please try again.');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product. Please try again.');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/inventory/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            alert('Product deleted successfully!');
            loadInventoryData();
        } else {
            alert('Failed to delete product. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
    }
}

async function viewInvoice(invoiceId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.success) {
            alert(`Invoice Details:\n\nCustomer: ${data.invoice.customerName}\nAmount: $${data.invoice.amount}\nDate: ${new Date(data.invoice.date).toLocaleDateString()}\nStatus: ${data.invoice.status}`);
        } else {
            alert('Failed to load invoice details. Please try again.');
        }
    } catch (error) {
        console.error('Error viewing invoice:', error);
        alert('Failed to load invoice details. Please try again.');
    }
}

async function downloadInvoice(invoiceId) {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/admin/invoices/${invoiceId}/download`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Failed to download invoice. Please try again.');
        }
    } catch (error) {
        console.error('Error downloading invoice:', error);
        alert('Failed to download invoice. Please try again.');
    }
}
