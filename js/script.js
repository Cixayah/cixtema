class CustomerManager {
    constructor() {
        this.apiUrl = 'https://crud-api-ashy.vercel.app/customers/';
        this.currentCustomers = [];
        this.editingId = null;
        this.currentSearch = '';
        this.deleteId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormFormatting();
        this.showSearchInfo();

        // Tornar a instância globalmente acessível
        window.customerManagerInstance = this;
    }

    // Event Listeners
    setupEventListeners() {
        // Busca
        document.getElementById('search-btn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        document.getElementById('clear-search-btn').addEventListener('click', () => {
            this.clearSearch();
        });

        // Formulário
        document.getElementById('show-form-btn').addEventListener('click', () => {
            this.showForm();
        });

        document.getElementById('toggle-form-btn').addEventListener('click', () => {
            this.hideForm();
        });

        document.getElementById('customer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Modal
        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });
    }

    // Formatação de campos
    setupFormFormatting() {
        document.getElementById('phone').addEventListener('input', (e) => {
            e.target.value = this.formatPhone(e.target.value);
        });

        document.getElementById('cpf').addEventListener('input', (e) => {
            e.target.value = this.formatCPF(e.target.value);
        });

        document.getElementById('rg').addEventListener('input', (e) => {
            e.target.value = this.formatRG(e.target.value);
        });
    }

    formatPhone(value) {
        return value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    formatCPF(value) {
        return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    formatRG(value) {
        return value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    }

    // API Calls
    async apiCall(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro na requisição');
            }

            return await response.json();
        } catch (error) {
            this.showNotification(`Erro: ${error.message}`, 'error');
            throw error;
        }
    }

    // Busca
    async performSearch() {
        const searchTerm = document.getElementById('search-input').value.trim();

        if (!searchTerm) {
            this.showNotification('Digite um nome ou CPF para buscar', 'error');
            return;
        }

        this.currentSearch = searchTerm;
        this.showLoading(true);
        this.hideSearchInfo();

        try {
            const customers = await this.apiCall(`${this.apiUrl}?search=${encodeURIComponent(searchTerm)}`);
            this.currentCustomers = customers;
            this.renderCustomers();
        } catch (error) {
            console.error('Erro na busca:', error);
        } finally {
            this.showLoading(false);
        }
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.currentSearch = '';
        this.currentCustomers = [];
        this.renderCustomers();
        this.showSearchInfo();
    }

    // CRUD Operations
    async createCustomer(data) {
        try {
            await this.apiCall(this.apiUrl, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            this.showNotification('Cliente cadastrado com sucesso!', 'success');
            this.hideForm();
            this.clearForm();

            // Refazer a busca se houver uma busca ativa
            if (this.currentSearch) {
                await this.performSearch();
            }
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
        }
    }

    async updateCustomer(id, data) {
        try {
            await this.apiCall(`${this.apiUrl}${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });

            this.showNotification('Cliente atualizado com sucesso!', 'success');
            this.cancelEdit();

            // Refazer a busca se houver uma busca ativa
            if (this.currentSearch) {
                await this.performSearch();
            }
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
        }
    }

    async deleteCustomer(id) {
        try {
            await this.apiCall(`${this.apiUrl}${id}`, {
                method: 'DELETE'
            });

            this.showNotification('Cliente excluído com sucesso!', 'success');
            this.closeDeleteModal();

            // Refazer a busca se houver uma busca ativa
            if (this.currentSearch) {
                await this.performSearch();
            }
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
        }
    }

    // Form Management
    showForm() {
        document.getElementById('form-container').classList.remove('hidden');
        document.getElementById('show-form-btn').classList.add('hidden');
        document.getElementById('form-container').scrollIntoView({ behavior: 'smooth' });
    }

    hideForm() {
        document.getElementById('form-container').classList.add('hidden');
        document.getElementById('show-form-btn').classList.remove('hidden');
        this.cancelEdit();
    }

    submitForm() {
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            number: document.getElementById('number').value,
            neighborhood: document.getElementById('neighborhood').value,
            city: document.getElementById('city').value,
            rg: document.getElementById('rg').value,
            cpf: document.getElementById('cpf').value
        };

        if (this.editingId) {
            this.updateCustomer(this.editingId, formData);
        } else {
            this.createCustomer(formData);
        }
    }

    editCustomer(customerId) {
        const customer = this.currentCustomers.find(c => c.id === customerId);
        if (!customer) {
            this.showNotification('Cliente não encontrado', 'error');
            return;
        }

        this.editingId = customer.id;

        // Preencher o formulário
        document.getElementById('name').value = customer.name || '';
        document.getElementById('phone').value = customer.phone || '';
        document.getElementById('email').value = customer.email || '';
        document.getElementById('address').value = customer.address || '';
        document.getElementById('number').value = customer.number || '';
        document.getElementById('neighborhood').value = customer.neighborhood || '';
        document.getElementById('city').value = customer.city || '';
        document.getElementById('rg').value = customer.rg || '';
        document.getElementById('cpf').value = customer.cpf || '';

        // Atualizar UI
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit mr-3"></i>Editar cliente';
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i>Atualizar';
        document.getElementById('submit-btn').className = 'btn-primary px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105';
        document.getElementById('cancel-btn').style.display = 'block';

        this.showForm();
    }

    cancelEdit() {
        this.editingId = null;
        this.clearForm();
        document.getElementById('form-title').innerHTML = '<i class="fas fa-user-plus mr-3"></i>Novo cliente';
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save mr-2"></i>Cadastrar';
        document.getElementById('submit-btn').className = 'btn-success px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105';
        document.getElementById('cancel-btn').style.display = 'none';
    }

    clearForm() {
        document.getElementById('customer-form').reset();
    }

    // UI Management
    showLoading(show) {
        const loading = document.getElementById('loading');
        const container = document.getElementById('customers-container');

        if (show) {
            loading.classList.remove('hidden');
            container.classList.add('hidden');
        } else {
            loading.classList.add('hidden');
            container.classList.remove('hidden');
        }
    }

    showSearchInfo() {
        document.getElementById('search-info').classList.remove('hidden');
    }

    hideSearchInfo() {
        document.getElementById('search-info').classList.add('hidden');
    }

    // Rendering
    renderCustomers() {
        const noData = document.getElementById('no-data');
        const customersList = document.getElementById('customers-list');

        if (this.currentCustomers.length === 0) {
            noData.classList.remove('hidden');
            customersList.classList.add('hidden');

            if (this.currentSearch) {
                noData.innerHTML = `
                    <div class="text-8xl mb-6" style="color: var(--dracula-comment);">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4" style="color: var(--dracula-purple);">
                        Nenhum cliente encontrado
                    </h3>
                    <p class="text-lg" style="color: var(--dracula-comment);">
                        Não encontramos clientes com o termo: <span class="search-highlight">${this.currentSearch}</span>
                    </p>
                    <p class="text-sm mt-2" style="color: var(--dracula-comment);">
                        Tente buscar por nome completo ou CPF
                    </p>
                `;
            } else {
                noData.innerHTML = `
                    <div class="text-8xl mb-6" style="color: var(--dracula-comment);">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4" style="color: var(--dracula-purple);">
                        Nenhum cliente encontrado
                    </h3>
                    <p class="text-lg" style="color: var(--dracula-comment);">
                        Use a busca acima para encontrar clientes ou adicione um novo cliente
                    </p>
                `;
            }
            return;
        }

        noData.classList.add('hidden');
        customersList.classList.remove('hidden');

        customersList.innerHTML = this.currentCustomers.map(customer =>
            this.renderCustomerCard(customer)
        ).join('');
    }

    renderCustomerCard(customer) {
        const highlightText = (text, search) => {
            if (!search || !text) return text || '';
            const regex = new RegExp(`(${search})`, 'gi');
            return text.replace(regex, '<span class="search-highlight">$1</span>');
        };

        const highlightedName = highlightText(customer.name, this.currentSearch);
        const highlightedCPF = highlightText(customer.cpf, this.currentSearch);

        return `
<div class="customer-card p-4 sm:p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between">
            <div class="flex-1">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div class="space-y-2 sm:space-y-3">
                        <div>
                            <h4 class="text-lg sm:text-xl font-bold mb-1" style="color: var(--dracula-purple);">
                                <i class="fas fa-user mr-2"></i>${highlightedName}
                            </h4>
                            <p class="text-xs sm:text-sm" style="color: var(--dracula-comment);">
                                ID: ${customer.id}
                            </p>
                        </div>
                        <div class="space-y-1 sm:space-y-2">
                            <p class="text-xs sm:text-sm">
                                <i class="fas fa-phone mr-2" style="color: var(--dracula-cyan);"></i>
                                <span style="color: var(--dracula-foreground);">${customer.phone || ''}</span>
                            </p>
                            <p class="text-xs sm:text-sm">
                                <i class="fas fa-envelope mr-2" style="color: var(--dracula-cyan);"></i>
                                <span style="color: var(--dracula-foreground);">${customer.email || ''}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div class="space-y-2 sm:space-y-3">
                        <h5 class="font-semibold text-sm sm:text-base" style="color: var(--dracula-green);">
                            <i class="fas fa-map-marker-alt mr-2"></i>Endereço
                        </h5>
                        <div class="space-y-1 sm:space-y-2">
                            <p class="text-xs sm:text-sm" style="color: var(--dracula-foreground);">
                                ${customer.address || ''}, ${customer.number || ''}
                            </p>
                            <p class="text-xs sm:text-sm" style="color: var(--dracula-yellow);">
                                <span style="color: var(--dracula-comment);">Bairro:</span>
                                ${customer.neighborhood || ''}
                            </p>
                            <p class="text-xs sm:text-sm" style="color: var(--dracula-pink);">
                                <span style="color: var(--dracula-comment);">Cidade:</span>
                                ${customer.city || ''}
                            </p>
                        </div>
                    </div>
                    
                    <div class="space-y-2 sm:space-y-3">
                        <h5 class="font-semibold text-sm sm:text-base" style="color: var(--dracula-yellow);">
                            <i class="fas fa-id-card mr-2"></i>Documentos
                        </h5>
                        <div class="space-y-1 sm:space-y-2">
                            <p class="text-xs sm:text-sm">
                                <span style="color: var(--dracula-comment);">RG:</span>
                                <span style="color: var(--dracula-foreground);"> ${customer.rg || ''}</span>
                            </p>
                            <p class="text-xs sm:text-sm">
                                <span style="color: var(--dracula-comment);">CPF:</span>
                                <span style="color: var(--dracula-foreground);"> ${highlightedCPF}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-row md:flex-col gap-3 md:ml-6 mt-4 md:mt-0 justify-center md:justify-start">
                <button onclick="window.customerManagerInstance.editCustomer(${customer.id})" 
                        class="btn-primary px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base">
                    <i class="fas fa-edit mr-2"></i>Editar
                </button>
                <button onclick="window.customerManagerInstance.showDeleteModal(${customer.id})" 
                        class="btn-danger px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm md:text-base">
                    <i class="fas fa-trash mr-2"></i>Excluir
                </button>
            </div>
        </div>
    </div>

        `;

    }

    // Modal Management
    showDeleteModal(id) {
        this.deleteId = id;
        document.getElementById('delete-modal').classList.remove('hidden');

        // Limpar event listener anterior e adicionar novo
        const confirmBtn = document.getElementById('confirm-delete');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.onclick = () => {
            this.deleteCustomer(id);
        };
    }

    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        this.deleteId = null;
    }

    // Notifications
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'var(--dracula-green)' : 'var(--dracula-red)';
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';

        notification.className = 'notification fixed top-6 right-6 px-6 py-4 rounded-lg text-white z-50 transform transition-all duration-300 translate-x-full';
        notification.style.background = bgColor;
        notification.style.color = 'var(--dracula-bg)';
        notification.style.fontWeight = '600';
        notification.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';

        notification.innerHTML = `
            <div div class="flex items-center" >
                <i class="${icon} mr-3 text-lg"></i>
                <span>${message}</span>
            </div >
            `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Animate out
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CustomerManager();
});
