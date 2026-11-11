/**
 * ============================================================================
 * CSV HANDLER (Sistem Pendukung Keputusan - Weighted Product)
 * ============================================================================
 * Modul pemrosesan data CSV menggunakan library PapaParse:
 * 1. parseCSVFile(file)        : Membaca berkas CSV dari File API (Picker / Drop)
 * 2. parseCSVString(str)       : Membaca teks mentah CSV menjadi struktur objek
 * 3. loadDefaultData()         : Memuat otomatis data 5 supplier default
 * 4. resetToDefaultData()      : Mengembalikan data ke sample supplier awal
 * 5. initDropzone(...)         : Handler interaktif Drag & Drop + File Picker
 * 6. exportToCSV(data, fname)  : Ekspor data hasil perangkingan ke berkas .CSV
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Konten data default 5 supplier (identik dengan sample_supplier_default_5.csv)
  var DEFAULT_CSV_STRING = 
`Kode_Supplier,Nama_Supplier,Harga_Penawaran,Kualitas_Material,Keandalan_Pengiriman,Fleksibilitas_Pembayaran
S001,PT Krakatau Steel,4,5,4,3
S002,PT Gunung Raja Paksi,3,4,3,4
S003,PT Baja Utama Nusantara,2,3,2,2
S004,CV Sumber Makmur Baja,5,4,5,3
S005,PT Metalindo Jaya,3,5,4,5`;

  // Konfigurasi kriteria default untuk 5 supplier di atas
  var DEFAULT_CRITERIA_CONFIG = [
    { key: 'Harga_Penawaran', name: 'Harga Penawaran', weight: 4, type: 'cost' },
    { key: 'Kualitas_Material', name: 'Kualitas Material', weight: 5, type: 'benefit' },
    { key: 'Keandalan_Pengiriman', name: 'Keandalan Pengiriman', weight: 4, type: 'benefit' },
    { key: 'Fleksibilitas_Pembayaran', name: 'Fleksibilitas Pembayaran', weight: 3, type: 'benefit' }
  ];

  /**
   * Helper internal: Ekstraksi kolom identitas dan kolom numerik (kriteria)
   *
   * @param {Array} headers - Daftar nama kolom dari CSV
   * @param {Object} sampleRow - Baris sampel untuk pengecekan tipe data
   * @returns {Object} { codeCol, nameCol, criteriaCols }
   */
  function inspectColumns(headers, sampleRow) {
    if (!Array.isArray(headers) || headers.length === 0) {
      return { codeCol: '', nameCol: '', criteriaCols: [] };
    }

    var codeCol = '';
    var nameCol = '';
    var criteriaCols = [];

    // Cari kolom kode alternatif
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase();
      if (!codeCol && (h.includes('kode') || h.includes('id') || h.includes('code'))) {
        codeCol = headers[i];
      } else if (!nameCol && (h.includes('nama') || h.includes('supplier') || h.includes('name') || h.includes('perusahaan'))) {
        nameCol = headers[i];
      }
    }

    // Jika belum ketemu, pakai indeks 0 sebagai kode dan indeks 1 sebagai nama
    if (!codeCol && headers.length > 0) codeCol = headers[0];
    if (!nameCol && headers.length > 1) nameCol = headers[1];

    // Kolom lainnya dijadikan kandidat kriteria
    headers.forEach(function (col) {
      if (col !== codeCol && col !== nameCol) {
        var val = sampleRow ? sampleRow[col] : null;
        var num = parseFloat(val);
        // Prioritaskan kolom numerik
        criteriaCols.push({
          key: col,
          name: col.replace(/_/g, ' '),
          isNumeric: !isNaN(num),
          sampleValue: val
        });
      }
    });

    return {
      codeCol: codeCol,
      nameCol: nameCol,
      criteriaCols: criteriaCols
    };
  }

  /**
   * 1. Parsing Berkas CSV dari File Object
   *
   * @param {File} file - Berkas File dari input/dropzone
   * @returns {Promise<Object>} Mengembalikan { data, headers, meta, columnInfo, file }
   */
  function parseCSVFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        return reject(new Error('Berkas tidak ditemukan.'));
      }

      if (typeof Papa === 'undefined') {
        return reject(new Error('Library PapaParse belum termuat. Pastikan CDN PapaParse aktif.'));
      }

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
          if (!results.data || results.data.length === 0) {
            return reject(new Error('Berkas CSV kosong atau format tidak sesuai.'));
          }

          var headers = (results.meta && results.meta.fields) ? results.meta.fields : Object.keys(results.data[0]);
          var colInfo = inspectColumns(headers, results.data[0]);

          resolve({
            data: results.data,
            headers: headers,
            meta: results.meta,
            columnInfo: colInfo,
            rowCount: results.data.length,
            file: {
              name: file.name,
              size: file.size,
              sizeFormatted: (file.size / 1024).toFixed(1) + ' KB',
              type: file.type
            }
          });
        },
        error: function (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * 2. Parsing Teks String CSV
   *
   * @param {string} csvText - Teks CSV mentah
   * @param {string} fileName - Nama file acuan (opsional)
   * @returns {Object} { data, headers, meta, columnInfo, rowCount }
   */
  function parseCSVString(csvText, fileName) {
    if (typeof Papa === 'undefined') {
      throw new Error('Library PapaParse belum termuat.');
    }

    var results = Papa.parse(csvText.trim(), {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    if (!results.data || results.data.length === 0) {
      throw new Error('Data CSV mentah kosong.');
    }

    var headers = (results.meta && results.meta.fields) ? results.meta.fields : Object.keys(results.data[0]);
    var colInfo = inspectColumns(headers, results.data[0]);

    return {
      data: results.data,
      headers: headers,
      meta: results.meta,
      columnInfo: colInfo,
      rowCount: results.data.length,
      file: {
        name: fileName || 'sample_supplier_default_5.csv',
        size: csvText.length,
        sizeFormatted: (csvText.length / 1024).toFixed(1) + ' KB'
      }
    };
  }

  /**
   * 3. Memuat Data Default 5 Supplier (Auto-load saat web pertama dibuka)
   * Mengambil file sample_supplier_default_5.csv via fetch, dan fallback ke
   * DEFAULT_CSV_STRING jika dibuka via protokol file:// (menghindari CORS browser).
   *
   * @returns {Promise<Object>}
   */
  function loadDefaultData() {
    return new Promise(function (resolve) {
      // Coba fetch berkas lokal
      if (typeof window !== 'undefined' && window.fetch) {
        fetch('sample_supplier_default_5.csv')
          .then(function (res) {
            if (!res.ok) throw new Error('Gagal fetch berkas sample.');
            return res.text();
          })
          .then(function (text) {
            var parsed = parseCSVString(text, 'sample_supplier_default_5.csv');
            parsed.defaultCriteria = DEFAULT_CRITERIA_CONFIG;
            resolve(parsed);
          })
          .catch(function () {
            // Fallback aman ke string default jika CORS atau offline
            var parsedFallback = parseCSVString(DEFAULT_CSV_STRING, 'sample_supplier_default_5.csv');
            parsedFallback.defaultCriteria = DEFAULT_CRITERIA_CONFIG;
            resolve(parsedFallback);
          });
      } else {
        var parsedSync = parseCSVString(DEFAULT_CSV_STRING, 'sample_supplier_default_5.csv');
        parsedSync.defaultCriteria = DEFAULT_CRITERIA_CONFIG;
        resolve(parsedSync);
      }
    });
  }

  /**
   * 4. Reset Data ke Default 5 Supplier
   *
   * @returns {Object} Data default 5 supplier yang siap digunakan
   */
  function resetToDefaultData() {
    var parsed = parseCSVString(DEFAULT_CSV_STRING, 'sample_supplier_default_5.csv');
    parsed.defaultCriteria = DEFAULT_CRITERIA_CONFIG;
    return parsed;
  }

  /**
   * 5. Inisialisasi Interaktif Drag & Drop + File Picker
   *
   * @param {HTMLElement} dropzoneEl - Elemen dropzone UI
   * @param {HTMLInputElement} fileInputEl - Elemen hidden input file
   * @param {Function} onFileLoaded - Callback saat berkas berhasil diparsing
   * @param {Function} onError - Callback saat terjadi kesalahan
   */
  function initDropzone(dropzoneEl, fileInputEl, onFileLoaded, onError) {
    if (!dropzoneEl || !fileInputEl) return;

    // Klik pada area dropzone akan memicu input file
    dropzoneEl.addEventListener('click', function (e) {
      // Hindari infinite loop jika elemen yang diklik adalah input file itu sendiri
      if (e.target !== fileInputEl) {
        fileInputEl.click();
      }
    });

    // Pilihan file dari file picker dialog
    fileInputEl.addEventListener('change', function () {
      if (fileInputEl.files && fileInputEl.files[0]) {
        handleFile(fileInputEl.files[0]);
      }
    });

    // Event Drag Over
    dropzoneEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.add('border-teal-500', 'bg-teal-50/50', 'ring-2', 'ring-teal-400/40');
    });

    // Event Drag Leave
    dropzoneEl.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('border-teal-500', 'bg-teal-50/50', 'ring-2', 'ring-teal-400/40');
    });

    // Event Drop
    dropzoneEl.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzoneEl.classList.remove('border-teal-500', 'bg-teal-50/50', 'ring-2', 'ring-teal-400/40');

      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        var droppedFile = dt.files[0];
        handleFile(droppedFile);
      }
    });

    function handleFile(file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        var err = new Error('Format berkas tidak didukung! Harap unggah berkas berekstensi .CSV.');
        if (typeof onError === 'function') onError(err);
        return;
      }

      parseCSVFile(file)
        .then(function (result) {
          if (typeof onFileLoaded === 'function') {
            onFileLoaded(result);
          }
        })
        .catch(function (err) {
          if (typeof onError === 'function') {
            onError(err);
          }
        });
    }
  }

  /**
   * 6. Ekspor Hasil Perangkingan ke File CSV
   *
   * @param {Array} rankingData - Array data hasil dari rankSuppliers
   * @param {string} filename - Nama berkas CSV unduhan (default: hasil_ranking_wp.csv)
   */
  function exportToCSV(rankingData, filename) {
    if (!Array.isArray(rankingData) || rankingData.length === 0) {
      alert('Tidak ada data hasil perangkingan untuk diekspor.');
      return;
    }

    if (typeof Papa === 'undefined') {
      alert('Library PapaParse tidak tersedia untuk proses ekspor.');
      return;
    }

    // Format data untuk ekspor yang rapi
    var exportRows = rankingData.map(function (item) {
      return {
        'Peringkat': item.rank,
        'Kode_Alternatif': item.code,
        'Nama_Alternatif': item.name,
        'Nilai_Vektor_S': typeof item.S === 'number' ? item.S.toFixed(6) : item.S,
        'Nilai_Vektor_V': typeof item.V === 'number' ? item.V.toFixed(6) : item.V,
        'Kontribusi_Persentase': typeof item.percent === 'number' ? item.percent.toFixed(2) + '%' : item.percent,
        'Status_Rekomendasi': item.status || (item.rank === 1 ? 'Pemenang Utama' : 'Alternatif')
      };
    });

    var csvString = Papa.unparse(exportRows, {
      quotes: true,
      header: true
    });

    // Tambahkan UTF-8 Byte Order Mark (BOM) agar simbol dan karakter terbaca rapi di Microsoft Excel
    var blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var downloadLink = document.createElement('a');

    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', filename || 'hasil_ranking_wp.csv');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // ==========================================================================
  // EXPORT KE WINDOW GLOBAL OBJECT
  // ==========================================================================
  var CSVHandler = {
    DEFAULT_CSV_STRING: DEFAULT_CSV_STRING,
    DEFAULT_CRITERIA_CONFIG: DEFAULT_CRITERIA_CONFIG,
    parseCSVFile: parseCSVFile,
    parseCSVString: parseCSVString,
    loadDefaultData: loadDefaultData,
    resetToDefaultData: resetToDefaultData,
    initDropzone: initDropzone,
    exportToCSV: exportToCSV,
    inspectColumns: inspectColumns
  };

  // Export sebagai namespace
  window.CSVHandler = CSVHandler;

  // Export juga fungsi individual langsung ke window
  window.parseCSVFile = parseCSVFile;
  window.parseCSVString = parseCSVString;
  window.loadDefaultData = loadDefaultData;
  window.resetToDefaultData = resetToDefaultData;
  window.initDropzone = initDropzone;
  window.exportToCSV = exportToCSV;
  window.DEFAULT_CSV_STRING = DEFAULT_CSV_STRING;
  window.DEFAULT_CRITERIA_CONFIG = DEFAULT_CRITERIA_CONFIG;

})(typeof window !== 'undefined' ? window : this);
