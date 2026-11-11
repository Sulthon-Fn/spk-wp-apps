/**
 * ============================================================================
 * APP CONTROLLER & STATE MANAGER (SPK Weighted Product)
 * ============================================================================
 * Modul orkestrator utama:
 * 1. Manajemen Central State (Dataset CSV, Kriteria, Vektor S, Vektor V, Ranking)
 * 2. Inisialisasi Event Listeners (Tab Switching, Mobile Drawer, Drag & Drop)
 * 3. Sinkronisasi Real-time Perubahan Bobot & Tipe Kriteria
 * 4. Aksi Ekspor CSV, Cetak Laporan PDF, & Reset Data
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // State Tunggal Aplikasi
  var appState = {
    data: [],
    headers: [],
    codeCol: 'Kode_Supplier',
    nameCol: 'Nama_Supplier',
    criteria: [], // [{ key, name, weight, type }, ...]
    normWeights: null,
    vectorS: [],
    vectorV: [],
    ranking: [],
    filename: 'sample_supplier_default_5.csv',
    activeTab: 'tab-data',
    previewPagination: {
      page: 1,
      perPage: 5,
      search: ''
    }
  };

  /**
   * Hitung Ulang Seluruh Matematis Weighted Product
   */
  function recalculateWP() {
    if (!appState.data || appState.data.length === 0 || !appState.criteria || appState.criteria.length === 0) {
      return;
    }

    try {
      // 1. Normalisasi Bobot W_j -> w_j
      appState.normWeights = window.WPEngine.normalizeWeights(appState.criteria);

      // 2. Hitung Vektor S_i = Π (X_ij ^ w_j)
      appState.vectorS = window.WPEngine.calculateVectorS(appState.data, appState.criteria, appState.normWeights);

      // 3. Hitung Vektor V_i = S_i / ΣS
      appState.vectorV = window.WPEngine.calculateVectorV(appState.vectorS);

      // 4. Perangkingan Supplier
      appState.ranking = window.WPEngine.rankSuppliers(appState.vectorV);

      // 5. Perbarui tampilan komponen yang bergantung pada perhitungan WP
      window.UIRenderer.renderNormalizedWeightsTable(appState.normWeights);
      window.UIRenderer.renderProcessTables(appState);
      window.UIRenderer.renderRanking(appState);
    } catch (err) {
      console.error('Terjadi kesalahan saat menghitung WP:', err);
      window.UIRenderer.showNotification('Kesalahan perhitungan WP: ' + err.message, 'error');
    }
  }

  /**
   * Set data CSV yang berhasil dimuat dan setup kriteria
   */
  function setLoadedData(parsedResult) {
    if (!parsedResult || !parsedResult.data || parsedResult.data.length === 0) {
      window.UIRenderer.showNotification('Data CSV tidak memiliki baris data yang valid.', 'error');
      return;
    }

    appState.data = parsedResult.data;
    appState.headers = parsedResult.headers || Object.keys(parsedResult.data[0]);
    appState.filename = (parsedResult.file && parsedResult.file.name) ? parsedResult.file.name : 'dataset.csv';

    // Deteksi kolom identitas
    var colInfo = parsedResult.columnInfo || window.CSVHandler.inspectColumns(appState.headers, appState.data[0]);
    appState.codeCol = colInfo.codeCol || appState.headers[0];
    appState.nameCol = colInfo.nameCol || (appState.headers.length > 1 ? appState.headers[1] : appState.codeCol);

    // Setup kriteria: prioritaskan default kriteria jika tersedia (contohnya data default supplier)
    if (parsedResult.defaultCriteria && parsedResult.defaultCriteria.length > 0) {
      appState.criteria = JSON.parse(JSON.stringify(parsedResult.defaultCriteria));
    } else {
      // Bentuk kriteria dari kolom numerik selain kode & nama
      appState.criteria = [];
      appState.headers.forEach(function (h) {
        if (h !== appState.codeCol && h !== appState.nameCol) {
          var sampleVal = appState.data[0] ? appState.data[0][h] : null;
          var isCost = h.toLowerCase().includes('harga') || h.toLowerCase().includes('cost') || h.toLowerCase().includes('biaya');
          appState.criteria.push({
            key: h,
            name: h.replace(/_/g, ' '),
            weight: 3, // Default bobot moderat
            type: isCost ? 'cost' : 'benefit'
          });
        }
      });
    }

    // Reset pagination
    appState.previewPagination.page = 1;
    appState.previewPagination.search = '';

    // Hitung seluruh formula WP
    recalculateWP();

    // Render seluruh antarmuka
    window.UIRenderer.renderStatCards(appState);
    window.UIRenderer.renderCSVPreview(appState, function (newPage) {
      appState.previewPagination.page = newPage;
      window.UIRenderer.renderCSVPreview(appState);
    });
    window.UIRenderer.renderCriteriaCards(appState, handleCriteriaChange);

    var searchInput = document.getElementById('search-preview-csv');
    if (searchInput) searchInput.value = '';

    window.UIRenderer.showNotification('Berhasil memuat ' + appState.data.length + ' data alternatif dari ' + appState.filename, 'success');
  }

  /**
   * Handler saat bobot atau tipe kriteria diubah pengguna
   */
  function handleCriteriaChange(index, updates) {
    if (!appState.criteria[index]) return;

    if (typeof updates.weight !== 'undefined') {
      appState.criteria[index].weight = updates.weight;
      var totalBadge = document.getElementById('badge-total-initial-weight');
      if (totalBadge) {
        var total = appState.criteria.reduce(function (sum, c) { return sum + (parseFloat(c.weight) || 1); }, 0);
        totalBadge.textContent = total;
      }
    }

    if (typeof updates.type !== 'undefined') {
      appState.criteria[index].type = updates.type;
      // Re-render kartu kriteria agar badge benefit/cost diperbarui
      window.UIRenderer.renderCriteriaCards(appState, handleCriteriaChange);
    }

    // Hitung ulang secara real-time
    recalculateWP();
  }

  /**
   * Inisialisasi Seluruh Event Listeners UI
   */
  function initEventListeners() {
    // 1. Controller Tab Switching Fluid
    var navButtons = document.querySelectorAll('.tab-nav-btn[data-tab-target]');
    navButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetTab = btn.getAttribute('data-tab-target');
        appState.activeTab = targetTab;
        window.UIRenderer.switchTab(targetTab);
        closeMobileDrawer();
      });
    });

    // 2. Mobile Drawer Toggle & Backdrop
    var mobileToggle = document.getElementById('mobile-drawer-toggle');
    var mobileClose = document.getElementById('mobile-drawer-close');
    var mobileBackdrop = document.getElementById('mobile-drawer-backdrop');

    if (mobileToggle) {
      mobileToggle.addEventListener('click', openMobileDrawer);
    }
    if (mobileClose) {
      mobileClose.addEventListener('click', closeMobileDrawer);
    }
    if (mobileBackdrop) {
      mobileBackdrop.addEventListener('click', closeMobileDrawer);
    }

    function openMobileDrawer() {
      var drawer = document.getElementById('mobile-drawer');
      var backdrop = document.getElementById('mobile-drawer-backdrop');
      if (drawer) drawer.classList.remove('-translate-x-full');
      if (backdrop) backdrop.classList.remove('hidden');
    }

    function closeMobileDrawer() {
      var drawer = document.getElementById('mobile-drawer');
      var backdrop = document.getElementById('mobile-drawer-backdrop');
      if (drawer) drawer.classList.add('-translate-x-full');
      if (backdrop) backdrop.classList.add('hidden');
    }

    // 3. Dropzone CSV & File Picker
    var dropzoneEl = document.getElementById('csv-dropzone');
    var fileInputEl = document.getElementById('csv-file-input');
    var browseBtn = document.getElementById('btn-browse-file');

    if (browseBtn && fileInputEl) {
      browseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        fileInputEl.click();
      });
    }

    if (dropzoneEl && fileInputEl) {
      window.CSVHandler.initDropzone(
        dropzoneEl,
        fileInputEl,
        function (parsedResult) {
          setLoadedData(parsedResult);
        },
        function (err) {
          window.UIRenderer.showNotification(err.message, 'error');
        }
      );
    }

    // 4. Tombol Muat Sample Data (Header & Dropzone)
    var sampleBtnDropzone = document.getElementById('btn-load-sample');
    var sampleBtnHeader = document.getElementById('btn-load-sample-header');

    function loadSampleHandler() {
      window.CSVHandler.loadDefaultData().then(function (sampleData) {
        setLoadedData(sampleData);
        window.UIRenderer.showNotification('Sample data 5 supplier berhasil dimuat.', 'success');
      });
    }

    if (sampleBtnDropzone) sampleBtnDropzone.addEventListener('click', loadSampleHandler);
    if (sampleBtnHeader) sampleBtnHeader.addEventListener('click', loadSampleHandler);

    // 5. Tombol Reset Data
    var resetBtn = document.getElementById('btn-reset-all');
    var clearFileBtn = document.getElementById('btn-clear-file');

    function resetHandler() {
      if (confirm('Apakah Anda yakin ingin mereset seluruh data kembali ke kondisi sample awal?')) {
        var defaultData = window.CSVHandler.resetToDefaultData();
        setLoadedData(defaultData);
        window.UIRenderer.switchTab('tab-data');
        window.UIRenderer.showNotification('Data telah berhasil direset ke 5 supplier default.', 'success');
      }
    }

    if (resetBtn) resetBtn.addEventListener('click', resetHandler);
    if (clearFileBtn) clearFileBtn.addEventListener('click', resetHandler);

    // 6. Filter Search Real-time pada Tabel Preview CSV
    var searchPreviewInput = document.getElementById('search-preview-csv');
    if (searchPreviewInput) {
      searchPreviewInput.addEventListener('input', function (e) {
        appState.previewPagination.search = e.target.value;
        appState.previewPagination.page = 1;
        window.UIRenderer.renderCSVPreview(appState, function (newPage) {
          appState.previewPagination.page = newPage;
          window.UIRenderer.renderCSVPreview(appState);
        });
      });
    }

    // 7. Mapping Kolom Selects
    var selectCode = document.getElementById('select-col-code');
    var selectName = document.getElementById('select-col-name');

    if (selectCode) {
      selectCode.addEventListener('change', function (e) {
        appState.codeCol = e.target.value;
        recalculateWP();
        window.UIRenderer.renderCSVPreview(appState);
      });
    }
    if (selectName) {
      selectName.addEventListener('change', function (e) {
        appState.nameCol = e.target.value;
        recalculateWP();
        window.UIRenderer.renderCSVPreview(appState);
      });
    }

    // 8. Bobot Kriteria Actions: Bobot Sama & Normalisasi
    var equalizeBtn = document.getElementById('btn-equalize-weights');
    if (equalizeBtn) {
      equalizeBtn.addEventListener('click', function () {
        appState.criteria.forEach(function (c) {
          c.weight = 3;
        });
        window.UIRenderer.renderCriteriaCards(appState, handleCriteriaChange);
        recalculateWP();
        window.UIRenderer.showNotification('Semua bobot kriteria telah diseragamkan ke nilai 3.', 'success');
      });
    }

    var normalizeBtn = document.getElementById('btn-normalize-weights');
    if (normalizeBtn) {
      normalizeBtn.addEventListener('click', function () {
        recalculateWP();
        window.UIRenderer.showNotification('Normalisasi bobot kriteria berhasil diperbarui.', 'success');
      });
    }

    // 9. Tombol Hitung Ulang pada Tab Proses
    var recalcBtn = document.getElementById('btn-recalculate-wp');
    if (recalcBtn) {
      recalcBtn.addEventListener('click', function () {
        recalculateWP();
        window.UIRenderer.showNotification('Komputasi Weighted Product berhasil dihitung ulang.', 'success');
      });
    }

    // 10. Ekspor CSV Hasil Perangkingan
    var exportCsvBtn = document.getElementById('btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function () {
        if (!appState.ranking || appState.ranking.length === 0) {
          window.UIRenderer.showNotification('Tidak ada hasil perangkingan untuk diekspor.', 'error');
          return;
        }
        window.CSVHandler.exportToCSV(appState.ranking, 'hasil_ranking_weighted_product.csv');
        window.UIRenderer.showNotification('Berkas CSV perangkingan berhasil diunduh.', 'success');
      });
    }

    // 11. Cetak Laporan PDF
    var printBtn = document.getElementById('btn-print-ranking');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }

    // 12. Tombol Tutup Banner Notifikasi
    var dismissNotifBtn = document.getElementById('btn-dismiss-notification');
    if (dismissNotifBtn) {
      dismissNotifBtn.addEventListener('click', function () {
        var banner = document.getElementById('global-notification');
        if (banner) banner.classList.add('hidden');
      });
    }
  }

  /**
   * Bootstrapping Aplikasi saat Halaman Siap
   */
  function initApp() {
    initEventListeners();

    // Auto-load data default 5 supplier saat aplikasi pertama kali dibuka
    window.CSVHandler.loadDefaultData()
      .then(function (defaultData) {
        setLoadedData(defaultData);
        window.UIRenderer.switchTab('tab-data');
      })
      .catch(function (err) {
        console.error('Inisialisasi data gagal:', err);
        // Fallback langsung ke reset
        var fallbackData = window.CSVHandler.resetToDefaultData();
        setLoadedData(fallbackData);
        window.UIRenderer.switchTab('tab-data');
      });
  }

  // Jalankan saat DOM telah siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // Simpan referensi ke window untuk debugging/inspeksi
  window.SPKApp = {
    getState: function () { return appState; },
    recalculate: recalculateWP,
    setLoadedData: setLoadedData
  };

})(typeof window !== 'undefined' ? window : this, document);
