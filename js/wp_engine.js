/**
 * ============================================================================
 * WP ENGINE (Sistem Pendukung Keputusan - Weighted Product)
 * ============================================================================
 * Modul murni engine matematika Weighted Product (WP):
 * 1. normalizeWeights(kriteria)     : w_j = W_j / ΣW (Cost: -w_j, Benefit: +w_j)
 * 2. calculateVectorS(data, kriteria, w_norm) : S_i = Π (X_ij ^ w_j) via Math.pow
 * 3. calculateVectorV(vectorS)      : V_i = S_i / ΣS
 * 4. rankSuppliers(vectorV)         : Urutkan Vektor V tertinggi ke terendah
 * ============================================================================
 */

(function (window) {
  'use strict';

  /**
   * 1. Normalisasi Bobot Kriteria (w_j)
   * Formula:
   *   w_j = W_j / Σ W_k
   * Ketentuan Pangkat Eksponen:
   *   - Jika kriteria bertipe BENEFIT : w_j bernilai POSITIF (+w_j)
   *   - Jika kriteria bertipe COST    : w_j bernilai NEGATIF (-w_j)
   *
   * @param {Array|Object} kriteria - Array kriteria: [{ key, name, weight, type }, ...]
   *                                  atau objek mapping kriteria.
   * @returns {Object} Hasil normalisasi bobot lengkap dengan map dan array list.
   */
  function normalizeWeights(kriteria) {
    if (!kriteria) {
      throw new Error('Data kriteria wajib disediakan untuk normalisasi bobot.');
    }

    // Ubah ke format array standar jika input berupa object dictionary
    let critArray = [];
    if (Array.isArray(kriteria)) {
      critArray = kriteria;
    } else if (typeof kriteria === 'object') {
      critArray = Object.keys(kriteria).map(function (key) {
        var item = kriteria[key];
        return {
          key: key,
          name: item.name || key,
          weight: typeof item.weight === 'number' ? item.weight : parseFloat(item.weight || item.w || 1),
          type: (item.type || 'benefit').toLowerCase()
        };
      });
    }

    if (critArray.length === 0) {
      throw new Error('Daftar kriteria tidak boleh kosong.');
    }

    // 1. Hitung Total Bobot Awal (Σ W_j)
    var totalWeight = critArray.reduce(function (sum, c) {
      var w = parseFloat(c.weight);
      return sum + (isNaN(w) || w <= 0 ? 1 : w);
    }, 0);

    if (totalWeight <= 0) {
      throw new Error('Total bobot kriteria harus lebih besar dari 0.');
    }

    // 2. Hitung Normalisasi Tiap Bobot (w_j) & Pangkat Eksponen (±w_j)
    var weightMap = {};
    var weightDetails = [];
    var sumNormalized = 0;

    critArray.forEach(function (c, idx) {
      var key = c.key || c.kode || ('C' + (idx + 1));
      var name = c.name || c.label || key;
      var rawWeight = parseFloat(c.weight);
      if (isNaN(rawWeight) || rawWeight <= 0) {
        rawWeight = 1;
      }

      var normWeight = rawWeight / totalWeight; // w_j positif (0 - 1)
      sumNormalized += normWeight;

      var typeStr = String(c.type || 'benefit').trim().toLowerCase();
      var isCost = (typeStr === 'cost' || typeStr === 'biaya');

      // Benefit = +w_j, Cost = -w_j
      var exponent = isCost ? -normWeight : normWeight;

      var itemDetail = {
        index: idx + 1,
        key: key,
        name: name,
        rawWeight: rawWeight,
        normWeight: normWeight,
        exponent: exponent,
        w_j: exponent, // alias praktis
        type: isCost ? 'cost' : 'benefit',
        typeLabel: isCost ? 'Cost' : 'Benefit',
        sign: isCost ? '-' : '+'
      };

      weightDetails.push(itemDetail);
      weightMap[key] = exponent;
    });

    var result = {
      totalWeight: totalWeight,
      sumNormalized: sumNormalized,
      details: weightDetails,
      map: weightMap
    };

    // Pasang getter langsung agar result[key] mengembalikan nilai exponent
    weightDetails.forEach(function (item) {
      if (!(item.key in result)) {
        result[item.key] = item.exponent;
      }
    });

    return result;
  }

  /**
   * 2. Perhitungan Vektor S (S_i)
   * Formula:
   *   S_i = Π (X_ij ^ w_j)  untuk j = 1 s.d n
   * Menggunakan Math.pow(X_ij, w_j) untuk tiap nilai atribut kriteria.
   *
   * @param {Array} data - Array data alternatif dari CSV: [{ Kode_Supplier: 'S001', ... }, ...]
   * @param {Array|Object} kriteria - Definisi kriteria yang dievaluasi
   * @param {Object} w_norm - Hasil normalizeWeights atau map bobot { [key]: exponent }
   * @returns {Array} Array hasil vektor S tiap alternatif beserta rincian perkalian.
   */
  function calculateVectorS(data, kriteria, w_norm) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data alternatif kosong atau tidak valid.');
    }

    // Resolusi kriteria
    var critList = [];
    if (Array.isArray(kriteria)) {
      critList = kriteria;
    } else if (kriteria && Array.isArray(kriteria.details)) {
      critList = kriteria.details;
    } else if (typeof kriteria === 'object') {
      critList = Object.keys(kriteria).map(function (k) {
        return { key: k, name: k };
      });
    }

    // Resolusi bobot ternormalisasi
    var exponentMap = {};
    if (w_norm && typeof w_norm === 'object') {
      if (w_norm.map) {
        exponentMap = w_norm.map;
      } else {
        exponentMap = w_norm;
      }
    } else {
      // Jika w_norm belum dihitung, hitung otomatis dari kriteria
      var normRes = normalizeWeights(critList);
      exponentMap = normRes.map;
    }

    var vectorSList = [];
    var totalS = 0;

    data.forEach(function (row, idx) {
      // Deteksi identitas alternatif (Kode & Nama)
      var code = row.Kode_Supplier || row.kode || row.Kode || row.id || row.ID || ('A' + (idx + 1));
      var name = row.Nama_Supplier || row.nama || row.Nama || row.name || row.supplier || code;

      var S_i = 1.0;
      var terms = [];

      critList.forEach(function (c) {
        var key = c.key || c.kode;
        var exp = typeof exponentMap[key] === 'number' ? exponentMap[key] : (exponentMap[key] && exponentMap[key].exponent ? exponentMap[key].exponent : 0);

        // Ambil nilai X_ij
        var rawVal = row[key];
        var x_val = parseFloat(rawVal);

        if (isNaN(x_val) || x_val <= 0) {
          // Weighted Product mensyaratkan nilai x > 0 untuk pemangkatan riil
          x_val = 1;
        }

        // Hitung pemangkatan: Math.pow(X_ij, w_j)
        var powered = Math.pow(x_val, exp);
        S_i *= powered;

        terms.push({
          key: key,
          name: c.name || key,
          x: x_val,
          w: exp,
          powered: powered,
          formulaStr: '(' + x_val + ')^(' + (exp >= 0 ? '+' : '') + exp.toFixed(4) + ')'
        });
      });

      totalS += S_i;

      vectorSList.push({
        index: idx + 1,
        code: String(code).trim(),
        name: String(name).trim(),
        S: S_i,
        formattedS: S_i.toFixed(6),
        terms: terms,
        rawRow: row
      });
    });

    // Sematkan properti totalS pada array return
    vectorSList.totalS = totalS;

    return vectorSList;
  }

  /**
   * 3. Perhitungan Vektor V (V_i)
   * Formula:
   *   V_i = S_i / Σ S_k
   * Nilai preferensi relatif V_i berkisar antara 0 s.d 1 dengan total Σ V = 1.
   *
   * @param {Array} vectorS - Array hasil dari calculateVectorS
   * @returns {Array} Array hasil vektor V dengan nilai preferensi & persentase.
   */
  function calculateVectorV(vectorS) {
    if (!Array.isArray(vectorS) || vectorS.length === 0) {
      throw new Error('Data Vektor S tidak valid untuk menghitung Vektor V.');
    }

    // Hitung total Σ S_k
    var sumS = typeof vectorS.totalS === 'number' && vectorS.totalS > 0
      ? vectorS.totalS
      : vectorS.reduce(function (sum, item) {
          return sum + (item.S || 0);
        }, 0);

    if (sumS <= 0) {
      throw new Error('Total penjumlahan Vektor S harus lebih besar dari 0.');
    }

    var totalV = 0;
    var vectorVList = vectorS.map(function (item) {
      var sVal = item.S || 0;
      var V_i = sVal / sumS;
      var percent = V_i * 100;
      totalV += V_i;

      return {
        index: item.index,
        code: item.code,
        name: item.name,
        S: sVal,
        formattedS: item.formattedS || sVal.toFixed(6),
        sumS: sumS,
        formattedSumS: sumS.toFixed(6),
        V: V_i,
        formattedV: V_i.toFixed(6),
        percent: percent,
        formattedPercent: percent.toFixed(2) + '%',
        terms: item.terms || [],
        rawRow: item.rawRow || {}
      };
    });

    vectorVList.totalV = totalV;
    vectorVList.sumS = sumS;

    return vectorVList;
  }

  /**
   * 4. Perangkingan Supplier / Alternatif
   * Mengurutkan alternatif dari nilai preferensi Vektor V tertinggi ke terendah.
   *
   * @param {Array} vectorV - Array hasil dari calculateVectorV
   * @returns {Array} Array yang sudah diurutkan lengkap dengan nomor peringkat (rank) dan status.
   */
  function rankSuppliers(vectorV) {
    if (!Array.isArray(vectorV) || vectorV.length === 0) {
      return [];
    }

    // Gandakan array agar tidak memutasi langsung array asal
    var ranked = vectorV.slice().sort(function (a, b) {
      return b.V - a.V; // Descending
    });

    return ranked.map(function (item, idx) {
      var rankNum = idx + 1;
      var isWinner = (rankNum === 1);
      
      var statusBadge = 'Dipertimbangkan';
      if (rankNum === 1) {
        statusBadge = 'Sangat Direkomendasikan (Juara #1)';
      } else if (rankNum === 2) {
        statusBadge = 'Rekomendasi Cadangan (Peringkat #2)';
      } else if (rankNum === 3) {
        statusBadge = 'Cukup Direkomendasikan (Peringkat #3)';
      }

      return Object.assign({}, item, {
        rank: rankNum,
        isWinner: isWinner,
        status: statusBadge
      });
    });
  }

  // ==========================================================================
  // EXPORT KE WINDOW GLOBAL OBJECT
  // ==========================================================================
  var WPEngine = {
    normalizeWeights: normalizeWeights,
    calculateVectorS: calculateVectorS,
    calculateVectorV: calculateVectorV,
    rankSuppliers: rankSuppliers
  };

  // Export sebagai namespace
  window.WPEngine = WPEngine;

  // Export juga fungsi individual langsung ke window
  window.normalizeWeights = normalizeWeights;
  window.calculateVectorS = calculateVectorS;
  window.calculateVectorV = calculateVectorV;
  window.rankSuppliers = rankSuppliers;

})(typeof window !== 'undefined' ? window : this);
