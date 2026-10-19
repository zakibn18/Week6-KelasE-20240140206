/**
 * TokoKita — JavaScript DOM, Event Handling & Fetch API
 * Praktikum Pemrograman Aplikasi Web (PAW) - Pertemuan 6
 * 
 * Fitur Utama:
 * 1. Fetch API Data Produk dari DummyJSON (https://dummyjson.com/products)
 *    - Async/await fetch dengan try-catch
 *    - Loading skeleton & spinner
 *    - Error handling dengan retry button
 *    - Render kartu produk ke DOM secara dinamis
 *    - Search & category filter interaktif
 * 2. Form Tambah Produk dengan DOM & Event Handling
 *    - Event 'input': live character counter & live preview card update
 *    - Event 'blur': validasi field saat fokus keluar
 *    - Event 'submit': validasi komprehensif, feedback dinamis, dan penambahan produk ke DOM katalog
 * 3. Modal Detail Produk & Notifikasi Toast
 */

// ==========================================
// 1. STATE & VARIABEL GLOBAL
// ==========================================
const API_URL = 'https://dummyjson.com/products';

// Menyimpan data produk yang didapat dari API dan produk baru yang ditambahkan user
let productsData = [];
let userAddedCount = 0;

// Default fallback image jika gambar produk bermasalah / kosong
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';

// ==========================================
// 2. DOM ELEMENTS SELECTORS
// ==========================================

// Navigasi & Stats
const navKatalog = document.getElementById('nav-katalog');
const navForm = document.getElementById('nav-form');
const totalCountElem = document.getElementById('total-count');
const apiStatusElem = document.getElementById('api-status');
const addedCountElem = document.getElementById('added-count');

// Katalog & API Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const btnRetryFetch = document.getElementById('btn-retry-fetch');
const productsGrid = document.getElementById('products-grid');
const emptyState = document.getElementById('empty-state');
const btnReloadApi = document.getElementById('btn-reload-api');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const categoryFilter = document.getElementById('category-filter');
const btnResetFilter = document.getElementById('btn-reset-filter');

// Form Elements
const productForm = document.getElementById('product-form');
const inputTitle = document.getElementById('product-title');
const inputPrice = document.getElementById('product-price');
const inputCategory = document.getElementById('product-category');
const inputRating = document.getElementById('product-rating');
const inputImage = document.getElementById('product-image');
const inputDesc = document.getElementById('product-description');
const btnResetForm = document.getElementById('btn-reset-form');

// Counters & Error Feedbacks
const titleCounter = document.getElementById('title-counter');
const descCounter = document.getElementById('description-counter');
const titleError = document.getElementById('title-error');
const priceError = document.getElementById('price-error');
const categoryError = document.getElementById('category-error');
const ratingError = document.getElementById('rating-error');
const imageError = document.getElementById('image-error');
const descError = document.getElementById('description-error');

// Live Preview Card Elements
const previewImg = document.getElementById('preview-img');
const previewBadge = document.getElementById('preview-badge');
const previewTitle = document.getElementById('preview-title');
const previewDesc = document.getElementById('preview-desc');
const previewPrice = document.getElementById('preview-price');
const previewRating = document.getElementById('preview-rating');

// Toast Container & Modal
const toastContainer = document.getElementById('toast-container');
const productModal = document.getElementById('product-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalContentBody = document.getElementById('modal-content-body');


// ==========================================
// 3. FITUR 1: FETCH API — DATA PRODUK DUMMYJSON
// ==========================================

/**
 * Mengambil data produk dari DummyJSON API menggunakan Fetch API
 */
async function fetchProducts() {
  // Update UI ke status Loading
  showLoadingState();
  updateApiStatus('Memuat...', '#f59e0b');

  try {
    const response = await fetch(API_URL);

    // Validasi apakah response HTTP berstatus 200-299
    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status} (${response.statusText})`);
    }

    // Mengurai (parsing) JSON dari response stream
    const data = await response.json();

    if (!data || !Array.isArray(data.products)) {
      throw new Error('Format data produk yang diterima dari API tidak valid.');
    }

    // Simpan data produk ke array lokal
    productsData = data.products;

    // Render data produk ke halaman web menggunakan manipulasi DOM
    renderProducts(productsData);

    // Populate dropdown filter kategori berdasarkan data aktual
    populateCategoryFilter(productsData);

    // Update status UI sukses
    updateApiStatus('Terhubung', '#10b981');
    showToast('Berhasil mengambil data produk dari DummyJSON!', 'success');

  } catch (error) {
    console.error('Kesalahan Fetch API:', error);
    // Tampilkan penanganan error pada DOM
    showErrorState(error.message || 'Gagal memuat produk dari DummyJSON.');
    updateApiStatus('Gagal', '#ef4444');
    showToast('Gagal mengambil data dari DummyJSON API.', 'error');
  }
}

/**
 * Menampilkan loading state dan menyembunyikan state lainnya
 */
function showLoadingState() {
  loadingState.style.display = 'flex';
  errorState.style.display = 'none';
  productsGrid.style.display = 'none';
  emptyState.style.display = 'none';
}

/**
 * Menampilkan error state jika Fetch API gagal
 * @param {string} msg Pesan error
 */
function showErrorState(msg) {
  loadingState.style.display = 'none';
  productsGrid.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'block';
  errorMessage.textContent = msg;
}

/**
 * Update indikator status API di Hero Section
 */
function updateApiStatus(text, color) {
  apiStatusElem.innerHTML = `<span class="status-dot" style="background-color: ${color}; box-shadow: 0 0 0 3px ${color}33;"></span> ${text}`;
}

/**
 * Merender daftar produk ke dalam container DOM (#products-grid)
 * @param {Array} items Array objek produk
 */
function renderProducts(items) {
  loadingState.style.display = 'none';
  errorState.style.display = 'none';

  // Jika hasil filter kosong
  if (items.length === 0) {
    productsGrid.style.display = 'none';
    emptyState.style.display = 'block';
    totalCountElem.textContent = '0';
    return;
  }

  emptyState.style.display = 'none';
  productsGrid.style.display = 'grid';

  // Bersihkan isi kontainer sebelum diisi ulang
  productsGrid.innerHTML = '';

  // Render setiap item produk menggunakan DOM
  items.forEach(product => {
    const card = createProductCardElement(product);
    productsGrid.appendChild(card);
  });

  // Update statistik total produk
  totalCountElem.textContent = items.length;
}

/**
 * Membuat elemen kartu produk DOM
 * @param {Object} product Objek data produk
 * @returns {HTMLElement} Elemen kartu produk
 */
function createProductCardElement(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.id = `product-${product.id}`;

  // Ambil URL gambar pertama atau thumbnail, dengan fallback
  const imgUrl = product.thumbnail || (product.images && product.images[0]) || DEFAULT_IMAGE;
  const ratingVal = typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0';
  const priceVal = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgUrl}" alt="${escapeHtml(product.title)}" loading="lazy" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';">
      <span class="card-badge">${escapeHtml(product.category || 'Umum')}</span>
    </div>
    <div class="card-body">
      <div class="card-rating">
        <i class="fa-solid fa-star"></i> <span>${ratingVal}</span>
      </div>
      <h4 class="card-title" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h4>
      <p class="card-desc">${escapeHtml(product.description || 'Tidak ada deskripsi.')}</p>
      <div class="card-footer">
        <span class="card-price">$${priceVal}</span>
        <button type="button" class="btn-card-action" data-id="${product.id}">
          <i class="fa-solid fa-circle-info"></i> Detail
        </button>
      </div>
    </div>
  `;

  // Pasang Event Listener click pada tombol Detail
  const detailBtn = card.querySelector('.btn-card-action');
  detailBtn.addEventListener('click', () => openProductDetail(product));

  return card;
}

/**
 * Menambahkan daftar kategori unik ke elemen dropdown filter
 * @param {Array} items 
 */
function populateCategoryFilter(items) {
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))].sort();
  
  // Simpan nilai pilihan saat ini jika ada
  const currentVal = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="all">Semua Kategori</option>';

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(opt);
  });

  if (categories.includes(currentVal)) {
    categoryFilter.value = currentVal;
  }
}

/**
 * Filter produk berdasarkan kata kunci pencarian dan kategori terpilih
 */
function filterProducts() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCat = categoryFilter.value;

  // Tampilkan/sembunyikan tombol clear search
  searchClearBtn.style.display = searchTerm.length > 0 ? 'inline' : 'none';

  const filtered = productsData.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                          (product.description && product.description.toLowerCase().includes(searchTerm));
    const matchesCategory = selectedCat === 'all' || product.category === selectedCat;
    return matchesSearch && matchesCategory;
  });

  renderProducts(filtered);
}


// ==========================================
// 4. FITUR 2: FORM — DOM & EVENT HANDLING
// ==========================================

/**
 * Validasi per input field
 * Mengembalikan objek { isValid: boolean, message: string }
 */
function validateField(inputElement) {
  const id = inputElement.id;
  const value = inputElement.value.trim();

  switch (id) {
    case 'product-title':
      if (!value) return { isValid: false, message: 'Nama produk wajib diisi.' };
      if (value.length < 3) return { isValid: false, message: 'Nama produk minimal 3 karakter.' };
      if (value.length > 60) return { isValid: false, message: 'Nama produk maksimal 60 karakter.' };
      return { isValid: true, message: '' };

    case 'product-price':
      if (!value) return { isValid: false, message: 'Harga produk wajib diisi.' };
      const priceNum = parseFloat(value);
      if (isNaN(priceNum) || priceNum <= 0) return { isValid: false, message: 'Harga harus berupa angka lebih dari 0.' };
      return { isValid: true, message: '' };

    case 'product-category':
      if (!value) return { isValid: false, message: 'Pilih salah satu kategori.' };
      return { isValid: true, message: '' };

    case 'product-rating':
      if (!value) return { isValid: false, message: 'Rating wajib diisi.' };
      const ratingNum = parseFloat(value);
      if (isNaN(ratingNum) || ratingNum < 1.0 || ratingNum > 5.0) {
        return { isValid: false, message: 'Rating harus antara 1.0 sampai 5.0.' };
      }
      return { isValid: true, message: '' };

    case 'product-image':
      if (value) {
        // Validasi format URL sederhana
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
        if (!urlPattern.test(value)) {
          return { isValid: false, message: 'Format URL gambar tidak valid (awali dengan https://).' };
        }
      }
      return { isValid: true, message: '' };

    case 'product-description':
      if (!value) return { isValid: false, message: 'Deskripsi produk wajib diisi.' };
      if (value.length < 10) return { isValid: false, message: 'Deskripsi minimal 10 karakter.' };
      if (value.length > 200) return { isValid: false, message: 'Deskripsi maksimal 200 karakter.' };
      return { isValid: true, message: '' };

    default:
      return { isValid: true, message: '' };
  }
}

/**
 * Menampilkan status error atau valid pada elemen form
 */
function applyFieldValidationState(inputElement, result) {
  const group = inputElement.closest('.form-group');
  const errorElem = group ? group.querySelector('.error-feedback') : null;

  if (!result.isValid) {
    group.classList.add('has-error');
    group.classList.remove('is-valid');
    if (errorElem) {
      errorElem.textContent = result.message;
      errorElem.style.display = 'block';
    }
  } else {
    group.classList.remove('has-error');
    if (inputElement.value.trim() !== '') {
      group.classList.add('is-valid');
    } else {
      group.classList.remove('is-valid');
    }
    if (errorElem) {
      errorElem.textContent = '';
      errorElem.style.display = 'none';
    }
  }
}

/**
 * Update panel Live Preview Card secara real-time via DOM
 */
function updateLivePreview() {
  const title = inputTitle.value.trim();
  const price = parseFloat(inputPrice.value);
  const category = inputCategory.value;
  const rating = parseFloat(inputRating.value);
  const imgUrl = inputImage.value.trim();
  const desc = inputDesc.value.trim();

  // Update teks & elemen DOM preview
  previewTitle.textContent = title || 'Nama Produk Muncul Disini';
  previewPrice.textContent = !isNaN(price) && price > 0 ? `$${price.toFixed(2)}` : '$0.00';
  previewBadge.textContent = category ? (category.charAt(0).toUpperCase() + category.slice(1)) : 'Kategori';
  previewRating.querySelector('span').textContent = !isNaN(rating) && rating >= 1 ? rating.toFixed(1) : '5.0';
  previewDesc.textContent = desc || 'Deskripsi produk akan langsung terupdate saat Anda mengetik di formulir...';

  // Update gambar preview
  if (imgUrl) {
    previewImg.src = imgUrl;
  } else {
    previewImg.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  }
}

/**
 * Handle form submission
 * @param {Event} e 
 */
function handleFormSubmit(e) {
  e.preventDefault(); // Mencegah reload halaman

  const inputs = [inputTitle, inputPrice, inputCategory, inputRating, inputImage, inputDesc];
  let isFormValid = true;
  let firstInvalidInput = null;

  // Periksa semua input
  inputs.forEach(input => {
    const result = validateField(input);
    applyFieldValidationState(input, result);
    if (!result.isValid) {
      isFormValid = false;
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
    }
  });

  // Jika ada input yang belum valid, arahkan fokus ke elemen tersebut
  if (!isFormValid) {
    if (firstInvalidInput) firstInvalidInput.focus();
    showToast('Harap periksa dan lengkapi data formulir yang bertanda merah.', 'error');
    return;
  }

  // Siapkan objek produk baru
  const newProduct = {
    id: `local-${Date.now()}`,
    title: inputTitle.value.trim(),
    price: parseFloat(inputPrice.value),
    category: inputCategory.value,
    rating: parseFloat(inputRating.value),
    thumbnail: inputImage.value.trim() || DEFAULT_IMAGE,
    description: inputDesc.value.trim(),
    isCustom: true // Penanda bahwa ini produk inputan pengguna
  };

  // 1. Tambahkan ke array state produk (di posisi paling awal)
  productsData.unshift(newProduct);

  // 2. Manipulasi DOM: Sisipkan kartu produk baru langsung ke awal #products-grid
  if (productsGrid.style.display === 'none') {
    productsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
  }

  const newCardElement = createProductCardElement(newProduct);
  newCardElement.classList.add('new-item-highlight');
  
  // Menggunakan insertBefore untuk menambahkan elemen di paling atas DOM grid
  if (productsGrid.firstChild) {
    productsGrid.insertBefore(newCardElement, productsGrid.firstChild);
  } else {
    productsGrid.appendChild(newCardElement);
  }

  // 3. Update counter dan filter
  userAddedCount++;
  addedCountElem.textContent = userAddedCount;
  totalCountElem.textContent = productsData.length;
  populateCategoryFilter(productsData);

  // 4. Feedback sukses melalui Toast Notification dinamis
  showToast(`Produk "${newProduct.title}" berhasil ditambahkan ke katalog!`, 'success');

  // 5. Reset form dan kembalikan preview ke default
  resetFormState();

  // 6. Smooth scroll ke produk baru di katalog
  newCardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Reset form dan bersihkan class validasi
 */
function resetFormState() {
  productForm.reset();
  titleCounter.textContent = '0/60';
  descCounter.textContent = '0/200';

  const groups = productForm.querySelectorAll('.form-group');
  groups.forEach(g => {
    g.classList.remove('has-error', 'is-valid');
    const err = g.querySelector('.error-feedback');
    if (err) err.style.display = 'none';
  });

  updateLivePreview();
}


// ==========================================
// 5. DETAIL MODAL & TOAST NOTIFICATION
// ==========================================

/**
 * Menampilkan detail produk pada Modal via DOM
 */
function openProductDetail(product) {
  const imgUrl = product.thumbnail || (product.images && product.images[0]) || DEFAULT_IMAGE;
  const ratingVal = typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating;
  const priceVal = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

  modalContentBody.innerHTML = `
    <img src="${imgUrl}" alt="${escapeHtml(product.title)}" class="modal-detail-img" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';">
    <div class="modal-detail-info">
      <div class="modal-detail-meta">
        <span class="badge badge-info">${escapeHtml(product.category || 'Umum')}</span>
        <span class="card-rating"><i class="fa-solid fa-star"></i> ${ratingVal}</span>
        ${product.brand ? `<span class="badge" style="background:#f1f5f9; color:#475569;">Brand: ${escapeHtml(product.brand)}</span>` : ''}
      </div>
      <h3 class="modal-detail-title">${escapeHtml(product.title)}</h3>
      <div class="modal-detail-price">$${priceVal}</div>
      <p style="color: var(--text-secondary); line-height: 1.6;">${escapeHtml(product.description || 'Tidak ada deskripsi detail.')}</p>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn btn-secondary" onclick="closeProductModal()">Tutup</button>
      </div>
    </div>
  `;

  productModal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Kunci scroll latar belakang
}

/**
 * Menutup modal detail
 */
function closeProductModal() {
  productModal.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * Menampilkan dynamic Toast Notification
 * @param {string} message Pesan
 * @param {string} type 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' 
    ? 'fa-circle-check' 
    : type === 'error' 
    ? 'fa-circle-xmark' 
    : 'fa-circle-info';

  const titleText = type === 'success' ? 'Sukses' : type === 'error' ? 'Peringatan' : 'Informasi';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-body">
      <div class="toast-title">${titleText}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="Tutup notifikasi">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Animasi muncul
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Tombol close toast
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  // Otomatis hilang setelah 4 detik
  setTimeout(() => {
    removeToast(toast);
  }, 4000);
}

function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentElement) toast.parentElement.removeChild(toast);
  }, 350);
}

/**
 * Sanitasi string untuk mencegah injeksi XSS pada DOM
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ==========================================
// 6. EVENT LISTENERS SETUP
// ==========================================

function initEventListeners() {
  // --- Form Event Listeners ---

  // Event 'submit' pada Form
  productForm.addEventListener('submit', handleFormSubmit);

  // Event 'click' untuk Reset Form
  btnResetForm.addEventListener('click', resetFormState);

  // Event 'input' & 'blur' pada Title: real-time counter, preview, & validasi
  inputTitle.addEventListener('input', () => {
    titleCounter.textContent = `${inputTitle.value.length}/60`;
    applyFieldValidationState(inputTitle, validateField(inputTitle));
    updateLivePreview();
  });
  inputTitle.addEventListener('blur', () => {
    applyFieldValidationState(inputTitle, validateField(inputTitle));
  });

  // Event 'input' & 'blur' pada Price
  inputPrice.addEventListener('input', () => {
    applyFieldValidationState(inputPrice, validateField(inputPrice));
    updateLivePreview();
  });
  inputPrice.addEventListener('blur', () => {
    applyFieldValidationState(inputPrice, validateField(inputPrice));
  });

  // Event 'change' pada Category
  inputCategory.addEventListener('change', () => {
    applyFieldValidationState(inputCategory, validateField(inputCategory));
    updateLivePreview();
  });

  // Event 'input' & 'blur' pada Rating
  inputRating.addEventListener('input', () => {
    applyFieldValidationState(inputRating, validateField(inputRating));
    updateLivePreview();
  });
  inputRating.addEventListener('blur', () => {
    applyFieldValidationState(inputRating, validateField(inputRating));
  });

  // Event 'input' pada Image URL
  inputImage.addEventListener('input', () => {
    applyFieldValidationState(inputImage, validateField(inputImage));
    updateLivePreview();
  });

  // Event 'input' & 'blur' pada Description: real-time counter & preview
  inputDesc.addEventListener('input', () => {
    descCounter.textContent = `${inputDesc.value.length}/200`;
    applyFieldValidationState(inputDesc, validateField(inputDesc));
    updateLivePreview();
  });
  inputDesc.addEventListener('blur', () => {
    applyFieldValidationState(inputDesc, validateField(inputDesc));
  });

  // --- Katalog & API Event Listeners ---

  // Event 'click' Retry saat Fetch API gagal
  btnRetryFetch.addEventListener('click', fetchProducts);

  // Event 'click' Reload data API
  btnReloadApi.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    categoryFilter.value = 'all';
    fetchProducts();
  });

  // Event 'input' untuk Search produk
  searchInput.addEventListener('input', filterProducts);

  // Event 'click' tombol clear search
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    filterProducts();
    searchInput.focus();
  });

  // Event 'change' untuk dropdown filter kategori
  categoryFilter.addEventListener('change', filterProducts);

  // Event 'click' reset filter ketika empty state muncul
  btnResetFilter.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    categoryFilter.value = 'all';
    filterProducts();
  });

  // --- Modal Event Listeners ---
  modalCloseBtn.addEventListener('click', closeProductModal);

  // Klik di luar konten modal untuk menutup
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });

  // Tombol Escape keyboard untuk menutup modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.style.display === 'flex') {
      closeProductModal();
    }
  });

  // --- Header Sticky Shadow on Scroll ---
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}


// ==========================================
// 7. INITIALIZATION PADA DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Pasang seluruh Event Listener
  initEventListeners();

  // Inisialisasi tampilan preview awal
  updateLivePreview();

  // Panggil Fetch API untuk memuat produk awal
  fetchProducts();
});
