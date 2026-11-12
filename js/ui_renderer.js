/**
 * ============================================================================
 * UI RENDERER (Sistem Pendukung Keputusan - Weighted Product)
 * ============================================================================
 * Modul untuk rendering antarmuka dinamis Glassmorphism:
 * 1. switchTab(tabId)                   : Tab switching fluid & instant
 * 2. renderStatCards(state)             : Stat cards (Alternatif, Kriteria, Status, Kolom)
 * 3. renderCSVPreview(state)            : Preview tabel CSV + Search bar + Pagination
 * 4. renderCriteriaCards(state)         : Input bobot (slider/number) & Translucent Badges
 * 5. renderNormalizedWeightsTable(norm) : Tabel normalisasi bobot w_j
 * 6. renderProcessTables(state)         : 3 Langkah komputasi WP (Matriks X, Vektor S, Vektor V)
 * 7. renderRanking(state)               : Glowing Emerald Hero Card & Tabel Ranking
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Helper aman untuk render icon Lucide
  function refreshIcons() {
    if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Helper escape HTML untuk proteksi XSS
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 1. Tab Switching Controller Fluid
   *
   * @param {string} tabId - ID tab yang dituju ('tab-data', 'tab-kriteria', 'tab-proses', 'tab-ranking')
   */
  function switchTab(tabId) {
    var validTabs = ['tab-data', 'tab-kriteria', 'tab-proses', 'tab-ranking'];
    if (!validTabs.includes(tabId)) tabId = 'tab-data';

    // 1. Tampilkan kontainer tab aktif & sembunyikan yang lain dengan animasi fade
    validTabs.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) {
        if (id === tabId) {
          section.classList.remove('hidden');
          section.classList.add('block');
          section.style.opacity = '0';
          setTimeout(function () {
            section.style.transition = 'opacity 0.25s ease-out';
            section.style.opacity = '1';
          }, 10);
        } else {
          section.classList.add('hidden');
          section.classList.remove('block');
        }
      }
    });

    // 2. Perbarui state visual tombol navigasi sidebar desktop & mobile drawer
    var allNavBtns = document.querySelectorAll('.tab-nav-btn[data-tab-target]');
    allNavBtns.forEach(function (btn) {
      var target = btn.getAttribute('data-tab-target');
      if (target === tabId) {
        // Active state: Glowing Teal/Emerald Gradient
        btn.className = btn.className
          .replace(/text-slate-600|hover:text-slate-900|hover:bg-white\/60/g, '')
          .trim();
        if (!btn.classList.contains('bg-gradient-to-r')) {
          btn.classList.add('bg-gradient-to-r', 'from-teal-500', 'to-emerald-500', 'text-white', 'shadow-md', 'shadow-teal-500/20');
        }
      } else {
        // Inactive state: Translucent Hover
        btn.classList.remove('bg-gradient-to-r', 'from-teal-500', 'to-emerald-500', 'text-white', 'shadow-md', 'shadow-teal-500/20');
        btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-white/60');
      }
    });

    // 3. Perbarui Header Title & Deskripsi Konteks
    var headerTitleEl = document.getElementById('active-tab-title');
    var headerDescEl = document.getElementById('active-tab-desc');
    
    var metaInfo = {
      'tab-data': {
        title: 'Dataset & Upload CSV',
        desc: 'Unggah berkas CSV alternatif supplier/kandidat untuk memulai analisis Weighted Product.'
      },
      'tab-kriteria': {
        title: 'Mapping Kolom & Bobot Kriteria',
        desc: 'Tentukan sifat Benefit/Cost dan sesuaikan bobot kepentingan kriteria evaluasi (W_j).'
      },
      'tab-proses': {
        title: 'Proses Komputasi Weighted Product',
        desc: 'Transparansi matematis langkah per langkah: Matriks Keputusan, Vektor S, dan Vektor V.'
      },
      'tab-ranking': {
        title: 'Hasil Akhir & Rekomendasi Peringkat',
        desc: 'Peringkat prioritas alternatif terbaik berdasarkan preferensi relatif Vektor V tertinggi.'
      }
    };

    if (headerTitleEl && metaInfo[tabId]) headerTitleEl.textContent = metaInfo[tabId].title;
    if (headerDescEl && metaInfo[tabId]) headerDescEl.textContent = metaInfo[tabId].desc;

    // Refresh icons
    refreshIcons();
  }

  /**
   * 2. Render Stat Cards Grid pada Tab Data
   *
   * @param {Object} state - State aplikasi (data, criteria, filename, dll)
   */
  function renderStatCards(state) {
    var alternativesEl = document.getElementById('stat-alternatives');
    var criteriaEl = document.getElementById('stat-criteria');
    var statusEl = document.getElementById('stat-status');
    var columnsEl = document.getElementById('stat-columns');

    var countRows = state.data ? state.data.length : 0;
    var countCrit = state.criteria ? state.criteria.length : 0;
    var countCols = state.headers ? state.headers.length : 0;

    if (alternativesEl) alternativesEl.textContent = countRows + ' Alternatif';
    if (criteriaEl) criteriaEl.textContent = countCrit + ' Kriteria';
    if (columnsEl) columnsEl.textContent = countCols + ' Kolom';

    if (statusEl) {
      if (countRows > 0 && countCrit > 0) {
        statusEl.textContent = 'Data Siap';
        statusEl.className = 'text-lg font-bold text-emerald-600 mt-1';
      } else {
        statusEl.textContent = 'Menunggu CSV';
        statusEl.className = 'text-lg font-bold text-amber-600 mt-1';
      }
    }

    // Perbarui file bar info
    var loadedBar = document.getElementById('loaded-file-bar');
    var fileNameEl = document.getElementById('file-info-name');
    var fileMetaEl = document.getElementById('file-info-meta');

    if (loadedBar) {
      if (countRows > 0) {
        loadedBar.classList.remove('hidden');
        if (fileNameEl) fileNameEl.textContent = state.filename || 'sample_supplier_default_5.csv';
        if (fileMetaEl) fileMetaEl.textContent = countRows + ' baris data terdeteksi \u2022 ' + countCols + ' kolom aktif';
      } else {
        loadedBar.classList.add('hidden');
      }
    }
  }

  /**
   * 3. Render Tabel Preview CSV + Real-time Search + Pagination
   *
   * @param {Object} state - State aplikasi
   * @param {Function} onPageChange - Callback saat halaman pagination berganti
   */
  function renderCSVPreview(state, onPageChange) {
    var thead = document.getElementById('thead-csv-preview');
    var tbody = document.getElementById('tbody-csv-preview');
    var badgeRows = document.getElementById('badge-csv-rows');
    var paginationContainer = document.getElementById('csv-preview-pagination');

    if (!thead || !tbody) return;

    var data = state.data || [];
    var headers = state.headers || [];
    var searchQuery = (state.previewPagination && state.previewPagination.search || '').trim().toLowerCase();
    var currentPage = (state.previewPagination && state.previewPagination.page) || 1;
    var perPage = (state.previewPagination && state.previewPagination.perPage) || 5;

    // 1. Filter data berdasarkan search query
    var filteredData = data;
    if (searchQuery) {
      filteredData = data.filter(function (row) {
        return headers.some(function (h) {
          var val = String(row[h] || '').toLowerCase();
          return val.includes(searchQuery);
        });
      });
    }

    if (badgeRows) {
      badgeRows.textContent = filteredData.length + ' dari ' + data.length + ' Data';
    }

    // 2. Render Header Kolom
    if (headers.length === 0) {
      thead.innerHTML = '<tr><th class="py-3 px-4 text-center text-slate-600">Tidak ada kolom</th></tr>';
      tbody.innerHTML = '<tr id="empty-row-preview"><td class="py-10 text-center text-slate-600 text-xs">Belum ada file CSV yang dimuat.</td></tr>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    var theadHTML = '<tr class="bg-slate-100/80 font-bold text-slate-700 text-xs uppercase tracking-wider">';
    theadHTML += '<th class="py-3.5 px-4 text-center w-12">#</th>';
    headers.forEach(function (h) {
      var isCode = (h === state.codeCol);
      var isName = (h === state.nameCol);
      var badgeTag = '';
      if (isCode) {
        badgeTag = ' <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-semibold">ID</span>';
      } else if (isName) {
        badgeTag = ' <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">Nama</span>';
      }
      theadHTML += '<th class="py-3.5 px-4 whitespace-nowrap">' + escapeHTML(h) + badgeTag + '</th>';
    });
    theadHTML += '</tr>';
    thead.innerHTML = theadHTML;

    // 3. Render Body dengan Pagination Slicing
    if (filteredData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="' + (headers.length + 1) + '" class="py-12 text-center text-slate-600 text-xs font-medium">' +
        (searchQuery ? 'Tidak ada data yang cocok dengan pencarian "' + escapeHTML(searchQuery) + '".' : 'Data kosong.') +
        '</td></tr>';
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    var totalPages = Math.ceil(filteredData.length / perPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    if (state.previewPagination) state.previewPagination.page = currentPage;

    var startIndex = (currentPage - 1) * perPage;
    var endIndex = Math.min(startIndex + perPage, filteredData.length);
    var pagedData = filteredData.slice(startIndex, endIndex);

    var tbodyHTML = '';
    pagedData.forEach(function (row, rowIdx) {
      var globalNum = startIndex + rowIdx + 1;
      tbodyHTML += '<tr class="hover:bg-white/80 transition-colors duration-150 border-b border-slate-100/80">';
      tbodyHTML += '<td class="py-3 px-4 text-center text-xs font-mono text-slate-600">' + globalNum + '</td>';
      headers.forEach(function (h) {
        var val = row[h];
        var isNum = typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
        var align = isNum ? 'text-right font-mono' : 'text-left font-medium';
        tbodyHTML += '<td class="py-3 px-4 text-xs text-slate-800 whitespace-nowrap ' + align + '">' + escapeHTML(val !== null && val !== undefined ? val : '-') + '</td>';
      });
      tbodyHTML += '</tr>';
    });
    tbody.innerHTML = tbodyHTML;

    // 4. Render Pagination Controls
    if (paginationContainer) {
      var pagHTML = '<div class="text-xs text-slate-600">';
      pagHTML += 'Menampilkan <span class="font-bold text-slate-800">' + (startIndex + 1) + '</span> - <span class="font-bold text-slate-800">' + endIndex + '</span> dari <span class="font-bold text-slate-800">' + filteredData.length + '</span> data';
      pagHTML += '</div>';

      pagHTML += '<div class="flex items-center space-x-1">';
      // Tombol Prev
      pagHTML += '<button id="pag-btn-prev" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ' + (currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-teal-50 hover:text-teal-700') + '" ' + (currentPage === 1 ? 'disabled' : '') + '>&laquo; Prev</button>';

      // Halaman angka
      for (var p = 1; p <= totalPages; p++) {
        if (totalPages <= 7 || p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
          var isActive = (p === currentPage);
          pagHTML += '<button data-page="' + p + '" class="pag-num-btn px-3 py-1.5 rounded-lg text-xs font-bold ' + (isActive ? 'bg-teal-600 text-white shadow-sm' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700') + '">' + p + '</button>';
        } else if (p === currentPage - 2 || p === currentPage + 2) {
          pagHTML += '<span class="px-1 text-slate-600">...</span>';
        }
      }

      // Tombol Next
      pagHTML += '<button id="pag-btn-next" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold ' + (currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-teal-50 hover:text-teal-700') + '" ' + (currentPage === totalPages ? 'disabled' : '') + '>Next &raquo;</button>';
      pagHTML += '</div>';

      paginationContainer.innerHTML = pagHTML;

      // Pasang event listener pagination
      var prevBtn = document.getElementById('pag-btn-prev');
      var nextBtn = document.getElementById('pag-btn-next');
      var numBtns = paginationContainer.querySelectorAll('.pag-num-btn');

      if (prevBtn && currentPage > 1) {
        prevBtn.addEventListener('click', function () {
          if (typeof onPageChange === 'function') onPageChange(currentPage - 1);
        });
      }
      if (nextBtn && currentPage < totalPages) {
        nextBtn.addEventListener('click', function () {
          if (typeof onPageChange === 'function') onPageChange(currentPage + 1);
        });
      }
      numBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var targetP = parseInt(btn.getAttribute('data-page'), 10);
          if (typeof onPageChange === 'function') onPageChange(targetP);
        });
      });
    }

    refreshIcons();
  }

  /**
   * 4. Render Form Mapping Kolom & Kartu Pengaturan Bobot (Tab Kriteria)
   * Menyertakan Badge Kriteria Translucent yang dipersyaratkan:
   *   - Benefit: bg-emerald-500/10 text-emerald-700 border border-emerald-500/20
   *   - Cost:    bg-amber-500/10 text-amber-700 border border-amber-500/20
   *
   * @param {Object} state - State aplikasi
   * @param {Function} onCriteriaChange - Callback saat nilai bobot/tipe diubah
   */
  function renderCriteriaCards(state, onCriteriaChange) {
    var selectCode = document.getElementById('select-col-code');
    var selectName = document.getElementById('select-col-name');
    var cardsGrid = document.getElementById('criteria-cards-grid');
    var totalBadge = document.getElementById('badge-total-initial-weight');

    if (!cardsGrid) return;

    var headers = state.headers || [];
    var criteria = state.criteria || [];

    // 1. Populate Dropdown Mapping Kolom
    if (selectCode && selectName) {
      var currentCode = state.codeCol || '';
      var currentName = state.nameCol || '';

      var optionsHTML = '<option value="">-- Pilih Kolom --</option>';
      headers.forEach(function (h) {
        optionsHTML += '<option value="' + escapeHTML(h) + '">' + escapeHTML(h) + '</option>';
      });

      selectCode.innerHTML = optionsHTML;
      selectName.innerHTML = optionsHTML;

      if (currentCode) selectCode.value = currentCode;
      if (currentName) selectName.value = currentName;
    }

    // 2. Render Kartu Bobot Kriteria
    if (criteria.length === 0) {
      cardsGrid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-600 bg-white/40 border border-dashed border-slate-200 rounded-2xl">' +
        '<i data-lucide="layers" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>' +
        '<p class="text-xs font-semibold">Tidak ada kolom kriteria yang terdeteksi.</p>' +
        '<p class="text-[11px] text-slate-600 mt-1">Pastikan CSV memiliki kolom numerik selain kolom kode dan nama alternatif.</p>' +
        '</div>';
      if (totalBadge) totalBadge.textContent = '0';
      refreshIcons();
      return;
    }

    // Hitung total bobot awal
    var sumInitial = criteria.reduce(function (acc, c) {
      return acc + (parseFloat(c.weight) || 1);
    }, 0);
    if (totalBadge) totalBadge.textContent = sumInitial;

    var cardsHTML = '';
    criteria.forEach(function (c, idx) {
      var isBenefit = (String(c.type || 'benefit').toLowerCase() === 'benefit');
      var badgeClass = isBenefit
        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-700 border border-amber-500/20';
      var badgeIcon = isBenefit ? 'trending-up' : 'trending-down';
      var badgeText = isBenefit ? 'Benefit (Makin Besar Baik)' : 'Cost (Makin Kecil Baik)';

      cardsHTML += '<div class="bg-white/80 backdrop-blur-md border border-white/90 shadow-md shadow-slate-200/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 space-y-4">';
      
      // Header Kartu
      cardsHTML += '<div class="flex items-start justify-between gap-2">';
      cardsHTML += '<div>';
      cardsHTML += '<span class="text-[10px] font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">C' + (idx + 1) + '</span>';
      cardsHTML += '<h4 class="text-sm font-bold text-slate-900 mt-1">' + escapeHTML(c.name || c.key) + '</h4>';
      cardsHTML += '<p class="text-[11px] font-mono text-slate-600">' + escapeHTML(c.key) + '</p>';
      cardsHTML += '</div>';

      // Badge Kriteria Translucent yang dipersyaratkan
      cardsHTML += '<span class="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold ' + badgeClass + '">';
      cardsHTML += '<i data-lucide="' + badgeIcon + '" class="w-3 h-3 mr-1"></i>';
      cardsHTML += isBenefit ? 'Benefit' : 'Cost';
      cardsHTML += '</span>';
      cardsHTML += '</div>';

      // Tipe Selector Buttons
      cardsHTML += '<div class="space-y-1.5">';
      cardsHTML += '<label class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tipe Atribut</label>';
      cardsHTML += '<div class="grid grid-cols-2 gap-2">';
      cardsHTML += '<button type="button" data-crit-idx="' + idx + '" data-crit-type="benefit" class="btn-toggle-type px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ' +
        (isBenefit ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600') + '">Benefit</button>';
      cardsHTML += '<button type="button" data-crit-idx="' + idx + '" data-crit-type="cost" class="btn-toggle-type px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ' +
        (!isBenefit ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600') + '">Cost</button>';
      cardsHTML += '</div>';
      cardsHTML += '<p class="text-[10px] text-slate-600">' + badgeText + '</p>';
      cardsHTML += '</div>';

      // Input Bobot (Slider + Number Input Terhubung)
      cardsHTML += '<div class="space-y-2 pt-2 border-t border-slate-100">';
      cardsHTML += '<div class="flex items-center justify-between text-xs">';
      cardsHTML += '<label for="crit-num-' + idx + '" class="font-bold text-slate-700">Bobot Kepentingan (W<sub>' + (idx + 1) + '</sub>):</label>';
      cardsHTML += '<div class="flex items-center space-x-1">';
      cardsHTML += '<input type="number" id="crit-num-' + idx + '" min="1" max="100" step="1" data-crit-idx="' + idx + '" value="' + (c.weight || 1) + '" class="input-crit-weight w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">';
      cardsHTML += '<span class="text-[11px] text-slate-600">Poin</span>';
      cardsHTML += '</div>';
      cardsHTML += '</div>';

      // Range Slider
      cardsHTML += '<input type="range" min="1" max="10" step="1" data-crit-idx="' + idx + '" value="' + (c.weight || 1) + '" class="slider-crit-weight w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600">';
      cardsHTML += '<div class="flex justify-between text-[10px] font-mono text-slate-600 px-0.5">';
      cardsHTML += '<span>1 (Sangat Rendah)</span><span>5 (Standar)</span><span>10 (Prioritas)</span>';
      cardsHTML += '</div>';
      cardsHTML += '</div>';

      cardsHTML += '</div>';
    });

    cardsGrid.innerHTML = cardsHTML;

    // Pasang Event Listeners untuk Slider dan Number input
    var numberInputs = cardsGrid.querySelectorAll('.input-crit-weight');
    var sliderInputs = cardsGrid.querySelectorAll('.slider-crit-weight');
    var typeButtons = cardsGrid.querySelectorAll('.btn-toggle-type');

    numberInputs.forEach(function (numInput) {
      numInput.addEventListener('input', function () {
        var idx = parseInt(numInput.getAttribute('data-crit-idx'), 10);
        var val = parseFloat(numInput.value) || 1;
        var correspondingSlider = cardsGrid.querySelector('.slider-crit-weight[data-crit-idx="' + idx + '"]');
        if (correspondingSlider) correspondingSlider.value = val;
        if (typeof onCriteriaChange === 'function') {
          onCriteriaChange(idx, { weight: val });
        }
      });
    });

    sliderInputs.forEach(function (slider) {
      slider.addEventListener('input', function () {
        var idx = parseInt(slider.getAttribute('data-crit-idx'), 10);
        var val = parseFloat(slider.value) || 1;
        var correspondingNum = cardsGrid.querySelector('.input-crit-weight[data-crit-idx="' + idx + '"]');
        if (correspondingNum) correspondingNum.value = val;
        if (typeof onCriteriaChange === 'function') {
          onCriteriaChange(idx, { weight: val });
        }
      });
    });

    typeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-crit-idx'), 10);
        var newType = btn.getAttribute('data-crit-type');
        if (typeof onCriteriaChange === 'function') {
          onCriteriaChange(idx, { type: newType });
        }
      });
    });

    refreshIcons();
  }

  /**
   * 5. Render Tabel Hasil Normalisasi Bobot w_j (Tab Kriteria)
   *
   * @param {Object} normResult - Hasil dari WPEngine.normalizeWeights
   */
  function renderNormalizedWeightsTable(normResult) {
    var tbody = document.getElementById('tbody-normalized-weights');
    var tfootRaw = document.getElementById('tfoot-total-raw-w');
    var tfootNorm = document.getElementById('tfoot-total-norm-w');

    if (!tbody || !normResult || !normResult.details) return;

    var details = normResult.details;
    var rowsHTML = '';

    details.forEach(function (item, idx) {
      var isBenefit = (item.type === 'benefit');
      var badgeClass = isBenefit
        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-700 border border-amber-500/20';

      rowsHTML += '<tr class="hover:bg-white/80 transition-colors border-b border-slate-100/80 text-xs">';
      rowsHTML += '<td class="py-3 px-4 text-center font-mono text-slate-600">' + (idx + 1) + '</td>';
      rowsHTML += '<td class="py-3 px-4 font-mono font-bold text-teal-800">C' + (idx + 1) + '</td>';
      rowsHTML += '<td class="py-3 px-4 font-semibold text-slate-800">' + escapeHTML(item.name) + '</td>';
      rowsHTML += '<td class="py-3 px-4"><span class="px-2 py-0.5 rounded-lg font-bold text-[11px] ' + badgeClass + '">' + item.typeLabel + '</span></td>';
      rowsHTML += '<td class="py-3 px-4 text-right font-mono font-bold text-slate-800">' + item.rawWeight + '</td>';
      rowsHTML += '<td class="py-3 px-4 text-right font-mono font-bold text-teal-700">' + item.normWeight.toFixed(4) + '</td>';
      rowsHTML += '<td class="py-3 px-4 text-center font-mono font-bold ' + (isBenefit ? 'text-emerald-700' : 'text-amber-700') + '">' +
        (item.exponent >= 0 ? '+' : '') + item.exponent.toFixed(4) + '</td>';
      rowsHTML += '</tr>';
    });

    tbody.innerHTML = rowsHTML;

    if (tfootRaw) tfootRaw.textContent = normResult.totalWeight;
    if (tfootNorm) tfootNorm.textContent = (normResult.sumNormalized || 1.0).toFixed(4);

    refreshIcons();
  }

  /**
   * 6. Render Tabel Step-by-step Komputasi WP (Tab Proses)
   *   - Langkah 1: Matriks Keputusan X_ij
   *   - Langkah 2: Perhitungan Vektor S_i
   *   - Langkah 3: Perhitungan Vektor V_i
   *
   * @param {Object} state - State aplikasi lengkap
   */
  function renderProcessTables(state) {
    var criteria = state.criteria || [];
    var data = state.data || [];
    var vectorS = state.vectorS || [];
    var vectorV = state.vectorV || [];

    // --- STEP 1: Matriks Keputusan X_ij ---
    var theadX = document.getElementById('thead-matrix-x');
    var tbodyX = document.getElementById('tbody-matrix-x');

    if (theadX && tbodyX && criteria.length > 0 && data.length > 0) {
      var thX = '<tr class="bg-slate-100/80 font-bold text-slate-700 text-xs uppercase">';
      thX += '<th class="py-3 px-4 text-center">#</th>';
      thX += '<th class="py-3 px-4">Kode</th>';
      thX += '<th class="py-3 px-4">Nama Alternatif</th>';
      criteria.forEach(function (c, idx) {
        thX += '<th class="py-3 px-4 text-right font-mono">C' + (idx + 1) + '<br><span class="text-[10px] text-slate-500 font-normal">(' + escapeHTML(c.name) + ')</span></th>';
      });
      thX += '</tr>';
      theadX.innerHTML = thX;

      var tbX = '';
      data.forEach(function (row, idx) {
        var code = row[state.codeCol] || ('A' + (idx + 1));
        var name = row[state.nameCol] || code;
        tbX += '<tr class="hover:bg-white/80 transition-colors border-b border-slate-100/80 text-xs">';
        tbX += '<td class="py-2.5 px-4 text-center font-mono text-slate-600">' + (idx + 1) + '</td>';
        tbX += '<td class="py-2.5 px-4 font-mono font-bold text-slate-800">' + escapeHTML(code) + '</td>';
        tbX += '<td class="py-2.5 px-4 font-semibold text-slate-800">' + escapeHTML(name) + '</td>';
        criteria.forEach(function (c) {
          var val = row[c.key];
          tbX += '<td class="py-2.5 px-4 text-right font-mono text-slate-700">' + (val !== undefined ? val : '-') + '</td>';
        });
        tbX += '</tr>';
      });
      tbodyX.innerHTML = tbX;
    }

    // --- STEP 2: Vektor S_i ---
    var theadS = document.getElementById('thead-vector-s');
    var tbodyS = document.getElementById('tbody-vector-s');
    var labelTotalS = document.getElementById('label-total-s');
    var tfootSumS = document.getElementById('tfoot-sum-s');

    if (theadS && tbodyS && vectorS.length > 0) {
      var totalSVal = typeof vectorS.totalS === 'number' ? vectorS.totalS : vectorS.reduce(function (sum, item) { return sum + item.S; }, 0);
      if (labelTotalS) labelTotalS.textContent = totalSVal.toFixed(6);
      if (tfootSumS) tfootSumS.textContent = totalSVal.toFixed(6);

      var tbS = '';
      vectorS.forEach(function (item, idx) {
        var formulaString = (item.terms || []).map(function (t) {
          return t.formulaStr;
        }).join(' &times; ');

        tbS += '<tr class="hover:bg-white/80 transition-colors border-b border-slate-100/80 text-xs">';
        tbS += '<td class="py-3 px-4 text-center font-mono text-slate-600">' + (idx + 1) + '</td>';
        tbS += '<td class="py-3 px-4 font-mono font-bold text-slate-800">' + escapeHTML(item.code) + '</td>';
        tbS += '<td class="py-3 px-4 font-semibold text-slate-800">' + escapeHTML(item.name) + '</td>';
        tbS += '<td class="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-md truncate" title="' + escapeHTML(formulaString) + '">' + formulaString + '</td>';
        tbS += '<td class="py-3 px-4 text-right font-mono font-extrabold text-teal-700">' + item.S.toFixed(6) + '</td>';
        tbS += '</tr>';
      });
      tbodyS.innerHTML = tbS;
    }

    // --- STEP 3: Vektor V_i ---
    var theadV = document.getElementById('thead-vector-v');
    var tbodyV = document.getElementById('tbody-vector-v');
    var tfootSumV = document.getElementById('tfoot-sum-v');
    var tfootSumPercent = document.getElementById('tfoot-sum-percent');

    if (theadV && tbodyV && vectorV.length > 0) {
      if (tfootSumV) tfootSumV.textContent = (vectorV.totalV || 1.0).toFixed(4);
      if (tfootSumPercent) tfootSumPercent.textContent = '100.00%';

      var tbV = '';
      vectorV.forEach(function (item, idx) {
        tbV += '<tr class="hover:bg-white/80 transition-colors border-b border-slate-100/80 text-xs">';
        tbV += '<td class="py-3 px-4 text-center font-mono text-slate-600">' + (idx + 1) + '</td>';
        tbV += '<td class="py-3 px-4 font-mono font-bold text-slate-800">' + escapeHTML(item.code) + '</td>';
        tbV += '<td class="py-3 px-4 font-semibold text-slate-800">' + escapeHTML(item.name) + '</td>';
        tbV += '<td class="py-3 px-4 text-right font-mono text-slate-700">' + item.S.toFixed(6) + '</td>';
        tbV += '<td class="py-3 px-4 text-right font-mono text-slate-500">' + item.sumS.toFixed(6) + '</td>';
        tbV += '<td class="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">' + item.V.toFixed(6) + '</td>';
        tbV += '<td class="py-3 px-4 text-right font-mono font-bold text-teal-800">' + item.percent.toFixed(2) + '%</td>';
        tbV += '</tr>';
      });
      tbodyV.innerHTML = tbV;
    }

    refreshIcons();
  }

  /**
   * 7. Render Tab Ranking (Hero Card Rank #1 & Tabel Ranking Lengkap)
   *
   * @param {Object} state - State aplikasi
   */
  function renderRanking(state) {
    var ranking = state.ranking || [];
    var heroCard = document.getElementById('hero-winner-card');
    var tbodyRanking = document.getElementById('tbody-ranking');

    if (!heroCard || !tbodyRanking) return;

    if (ranking.length === 0) {
      tbodyRanking.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-slate-600 text-xs">Belum ada hasil ranking. Pastikan dataset dan kriteria telah dihitung.</td></tr>';
      return;
    }

    // 1. Render Glowing Emerald Glass Hero Card untuk Peringkat #1
    var winner = ranking[0];
    var winnerCodeEl = document.getElementById('hero-winner-code');
    var winnerNameEl = document.getElementById('hero-winner-name');
    var winnerScoreVEl = document.getElementById('hero-winner-score-v');
    var winnerPercentEl = document.getElementById('hero-winner-percent');
    var winnerScoreSEl = document.getElementById('hero-winner-score-s');
    var winnerDescEl = document.getElementById('hero-winner-desc');

    if (winnerCodeEl) winnerCodeEl.textContent = winner.code;
    if (winnerNameEl) winnerNameEl.textContent = winner.name;
    if (winnerScoreVEl) winnerScoreVEl.textContent = winner.V.toFixed(6);
    if (winnerPercentEl) winnerPercentEl.textContent = 'Preferensi ' + winner.percent.toFixed(2) + '%';
    if (winnerScoreSEl) winnerScoreSEl.textContent = winner.S.toFixed(6);
    if (winnerDescEl) {
      winnerDescEl.textContent = 'Pemasok/Alternatif ' + winner.name + ' (' + winner.code + ') direkomendasikan sebagai pilihan nomor 1 dengan perolehan nilai preferensi Vektor V tertinggi sebesar ' +
        winner.V.toFixed(6) + ' (' + winner.percent.toFixed(2) + '% kontribusi preferensi relatif).';
    }

    // 2. Render Tabel Peringkat Lengkap
    var rowsHTML = '';
    ranking.forEach(function (item) {
      var isRank1 = (item.rank === 1);
      var isRank2 = (item.rank === 2);
      var isRank3 = (item.rank === 3);

      var rankBadge = '';
      if (isRank1) {
        rankBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm"><i data-lucide="crown" class="w-3 h-3 mr-1"></i>#1</span>';
      } else if (isRank2) {
        rankBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">#2</span>';
      } else if (isRank3) {
        rankBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">#3</span>';
      } else {
        rankBadge = '<span class="font-mono text-slate-500 font-semibold">#' + item.rank + '</span>';
      }

      var rowClass = isRank1
        ? 'bg-emerald-50/50 hover:bg-emerald-50/80 font-semibold border-b border-emerald-200/60'
        : 'hover:bg-white/80 transition-colors border-b border-slate-100/80';

      var statusBadgeClass = isRank1
        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
        : (isRank2 || isRank3 ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-600');

      rowsHTML += '<tr class="' + rowClass + ' text-xs">';
      rowsHTML += '<td class="py-3.5 px-4 text-center">' + rankBadge + '</td>';
      rowsHTML += '<td class="py-3.5 px-4 font-mono font-bold text-slate-900">' + escapeHTML(item.code) + '</td>';
      rowsHTML += '<td class="py-3.5 px-4 font-bold text-slate-800">' + escapeHTML(item.name) + '</td>';
      rowsHTML += '<td class="py-3.5 px-4 text-right font-mono text-slate-700">' + item.S.toFixed(6) + '</td>';
      rowsHTML += '<td class="py-3.5 px-4 text-right font-mono font-extrabold ' + (isRank1 ? 'text-emerald-700 text-sm' : 'text-slate-800') + '">' + item.V.toFixed(6) + '</td>';
      rowsHTML += '<td class="py-3.5 px-4 text-right font-mono font-bold text-teal-800">' + item.percent.toFixed(2) + '%</td>';
      rowsHTML += '<td class="py-3.5 px-4 text-center"><span class="px-2.5 py-1 rounded-full text-[11px] ' + statusBadgeClass + '">' + item.status + '</span></td>';
      rowsHTML += '</tr>';
    });

    tbodyRanking.innerHTML = rowsHTML;
    refreshIcons();
  }

  /**
   * Helper: Menampilkan banner notifikasi dinamis
   */
  function showNotification(message, type) {
    var banner = document.getElementById('global-notification');
    var msgEl = document.getElementById('global-notification-msg');
    if (!banner || !msgEl) return;

    msgEl.textContent = message;
    banner.classList.remove('hidden');

    if (type === 'error') {
      banner.className = 'mb-6 rounded-2xl p-4 bg-rose-50/90 backdrop-blur-md border border-rose-200 shadow-sm flex items-center justify-between text-sm text-rose-900 transition-all duration-300';
    } else {
      banner.className = 'mb-6 rounded-2xl p-4 bg-teal-50/90 backdrop-blur-md border border-teal-200 shadow-sm flex items-center justify-between text-sm text-teal-900 transition-all duration-300';
    }

    refreshIcons();

    setTimeout(function () {
      banner.classList.add('hidden');
    }, 4500);
  }

  // ==========================================================================
  // EXPORT KE WINDOW GLOBAL OBJECT
  // ==========================================================================
  var UIRenderer = {
    refreshIcons: refreshIcons,
    switchTab: switchTab,
    renderStatCards: renderStatCards,
    renderCSVPreview: renderCSVPreview,
    renderCriteriaCards: renderCriteriaCards,
    renderNormalizedWeightsTable: renderNormalizedWeightsTable,
    renderProcessTables: renderProcessTables,
    renderRanking: renderRanking,
    showNotification: showNotification
  };

  window.UIRenderer = UIRenderer;
  window.refreshIcons = refreshIcons;
  window.switchTab = switchTab;
  window.showNotification = showNotification;

})(typeof window !== 'undefined' ? window : this);
