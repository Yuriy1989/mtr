// C:\Server\data\htdocs\umtsik\mtr\src\utils\export\exportApp3Excel.js
import ExcelJS from "exceljs";
import dayjs from "dayjs";

export default async function exportApp3Excel(rows = [], opts = {}) {
  const { filename = "Приложение_3.xlsx", meta = {}, dims = [], cats = [] } = opts;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Приложение №3");

  const fmtDate = (iso) => (iso ? dayjs(iso).format("DD.MM.YYYY") : "");
  const parseQty = (v) => {
    if (v == null || v === "") return 0;
    const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const labelTransport = (type) =>
    type === "container" ? "Контейнер" : type === "auto" ? "Авто" : "";

  // Шапка
  ws.addRow([`Приложение №3`, meta.app3Id ? `ID ${meta.app3Id}` : ""]);
  ws.addRow([`Служебная записка`, meta.zapiskaId ? `№ ${meta.zapiskaId}` : ""]);
  ws.addRow([`Дата выгрузки`, dayjs().format("DD.MM.YYYY HH:mm")]);
  ws.addRow([]);

  // Заголовки
  const headers = [
    "№","Срочный","Название","Имя получателя материала","Поставка","Завод","Склад",
    "Д/Отпуска материала","Материал","Партия","Базовая ЕИ","Объем поставки (план)",
    "Объект ремонта","Примечание (служ.)",
    "Заявка (дата)","Груз сформирован (тип/номер)","Отгрузка (дата)","Получатель",
    "М11 дата","М11 №","Отгружено ранее","Отгружено (волна)","Итого отгружено",
    "Остаток","Примечание",
  ];
  const head = ws.addRow(headers);
  head.font = { bold: true };
  head.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  const widths = [6,10,38,30,12,10,10,16,16,14,12,16,16,24,16,26,16,20,14,14,16,18,14,28];
  ws.columns = widths.map((w) => ({ width: w }));

  // ===== helper: волны из истории + текущая волна =====
  const buildWaves = (rec) => {
    const plan = parseQty(rec.supplyVolume);
    const hist = Array.isArray(rec.__history) ? rec.__history.slice() : [];
    hist.sort((a,b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf());

    const lastSaved = rec.__lastSaved || {};
    const currentCum = parseQty(lastSaved.discarded); // текущее зафиксированное ИТОГО
    const waves = [];

    // Если истории нет, но есть текущее cum > 0 — одна зафиксированная волна
    if (!hist.length && currentCum > 0) {
      const tLabel = labelTransport(lastSaved.format);
      const formedCell = (tLabel && lastSaved.transportNumber)
        ? `${tLabel} ${lastSaved.transportNumber}`
        : (tLabel || lastSaved.transportNumber || "");
      waves.push({
        type: "committed",
        before: 0,
        qty: Math.min(plan, currentCum), // на всякий
        after: Math.min(plan, currentCum),
        remainder: Math.max(0, plan - Math.min(plan, currentCum)),
        dateRequest: lastSaved.dateRequest || null,
        formed: formedCell,
        dateShipment: lastSaved.dateShipment || null,
        recipient: lastSaved.transit || "",
        m11Date: lastSaved.dateM11 || null,
        m11Number: lastSaved.numberM11 || "",
        note: lastSaved.addNote || "",
      });
    }

    // Если есть история — строим по разнице (s[i+1] - s[i]) и метаданным из snapshot[i+1]
    if (hist.length) {
      // цепочка состояний: s0, s1, ..., s_{k-1}, L (текущее)
      for (let i = 0; i < hist.length; i += 1) {
        const beforeSnap = hist[i]?.snapshot || {};
        const beforeCum = parseQty(beforeSnap.discarded);
        const afterSnap = (i + 1 < hist.length) ? (hist[i+1]?.snapshot || {}) : lastSaved;
        const afterCum = (i + 1 < hist.length)
          ? parseQty((hist[i+1]?.snapshot || {}).discarded)
          : currentCum;

        const qty = Math.max(0, Math.min(plan, afterCum) - Math.min(plan, beforeCum));
        if (qty <= 0) continue;

        const tLabel = labelTransport(afterSnap.format);
        const formedCell = (tLabel && afterSnap.transportNumber)
          ? `${tLabel} ${afterSnap.transportNumber}`
          : (tLabel || afterSnap.transportNumber || "");

        waves.push({
          type: "committed",
          before: Math.min(plan, beforeCum),
          qty,
          after: Math.min(plan, afterCum),
          remainder: Math.max(0, plan - Math.min(plan, afterCum)),
          dateRequest: afterSnap.dateRequest || null,
          formed: formedCell,
          dateShipment: afterSnap.dateShipment || null,
          recipient: afterSnap.transit || "",
          m11Date: afterSnap.dateM11 || null,
          m11Number: afterSnap.numberM11 || "",
          note: afterSnap.addNote || "",
        });
      }
    }

    // Текущая незакреплённая волна
    const ex = rec.__extras || {};
    const waveNow = typeof ex.shippedQty === "number" ? ex.shippedQty : 0;
    if (waveNow > 0) {
      const before = Math.min(plan, currentCum);
      const after = Math.min(plan, before + waveNow);
      const qty = Math.max(0, after - before);
      const tLabel = labelTransport(ex.transportRequest);
      const formedCell = (tLabel && ex.transportNumber)
        ? `${tLabel} ${ex.transportNumber}`
        : (tLabel || ex.transportNumber || "");
      waves.push({
        type: "current",
        before,
        qty,
        after,
        remainder: Math.max(0, plan - after),
        dateRequest: ex.shipmentRequestDate || null,
        formed: formedCell,
        dateShipment: ex.shipmentDate || null,
        recipient: ex.recipientName || "",
        m11Date: ex.m11Date || null,
        m11Number: ex.m11Number || "",
        note: ex.note || "",
      });
    }

    return { plan, waves };
  };

  // ===== заполняем строки с объединением A..N по количеству волн =====
  let rowPtr = ws.rowCount + 1;
  rows.forEach((rec, idx) => {
    const { plan, waves } = buildWaves(rec);
    const waveCount = Math.max(1, waves.length);

    // общие (A..N) — ставим в первую строку группы, остальные оставляем пустыми и склеиваем
    const common = [
      idx + 1,
      rec.urgent ? "Срочно" : "—",
      rec.nameMTR ?? "",
      rec.address ?? "",
      rec.supply ?? "",
      rec.factory ?? "",
      rec.storage ?? "",
      rec.vacationOfTheMaterial ? fmtDate(rec.vacationOfTheMaterial) : "",
      rec.material ?? "",
      rec.party ?? "",
      rec.basic ?? "",
      plan || 0,
      rec.repairObjectName ?? "",
      rec.note ?? "",
    ];

    for (let i = 0; i < waveCount; i += 1) {
      const w = waves[i] || {
        before: 0, qty: 0, after: 0, remainder: plan,
        dateRequest: null, formed: "", dateShipment: null, recipient: "",
        m11Date: null, m11Number: "", note: "",
      };
      const row = ws.addRow([
        ...(i === 0 ? common : new Array(common.length).fill("")),
        fmtDate(w.dateRequest),
        w.formed || "",
        fmtDate(w.dateShipment),
        w.recipient || "",
        fmtDate(w.m11Date),
        w.m11Number || "",
        w.before || 0,
        w.qty || 0,
        w.after || 0,
        w.remainder || 0,
        w.note || "",
      ]);
      // числовой формат: план и U..X
      [12, 21, 22, 23, 24].forEach((colIdx) => {
        row.getCell(colIdx).numFmt = "# ##0.####";
      });
    }

    // Вертикальные объединения A..N по группе
    const start = rowPtr;
    const end = rowPtr + waveCount - 1;
    for (let col = 1; col <= 14; col += 1) {
      if (waveCount > 1) ws.mergeCells(start, col, end, col);
      const cell = ws.getRow(start).getCell(col);
      cell.alignment = { vertical: "middle", horizontal: col === 1 ? "center" : "left", wrapText: true };
    }
    rowPtr = end + 1;
  });

  // рамки + подсветка шапки
  ws.eachRow((row, idx) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
      if (idx === head.number) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F6F6" } };
      }
    });
  });

  // ===== Вкладка «Итоги по категориям» =====
  const wsSum = wb.addWorksheet("Итоги по категориям");

  const lower = (s) => (s == null ? "" : String(s).trim().toLowerCase());
  const dimByCode = new Map();
  const dimByAlias = new Map();
  const baseByCategory = new Map();
  const catName = new Map();

  if (Array.isArray(dims)) {
    for (const d of dims) {
      if (d?.code) dimByCode.set(lower(d.code), d);
      if (d?.nameDimension) dimByAlias.set(lower(d.nameDimension), d);
      if (Array.isArray(d?.aliases)) for (const a of d.aliases || []) if (a) dimByAlias.set(lower(a), d);
      if (d?.category && d?.isBase) baseByCategory.set(d.category, d);
    }
  }
  if (Array.isArray(cats)) for (const c of cats) catName.set(c.key, c.nameRu || c.key);

  const resolveDimension = (rawUnit) => {
    const s = lower(rawUnit);
    if (!s) return null;
    if (dimByCode.has(s)) return dimByCode.get(s);
    if (dimByAlias.has(s)) return dimByAlias.get(s);
    return null;
  };
  const toBase = (dim, qty) => {
    if (!dim || !dim.category) return null;
    const n = Number(qty) || 0;
    if (dim.isBase) return n;
    const k = dim.toBaseFactor != null ? Number(dim.toBaseFactor) : null;
    if (k == null) return null;
    return n * k;
  };

  wsSum.addRow([`Итоги по категориям (в базовых единицах)`]);
  wsSum.addRow([`Дата выгрузки`, dayjs().format("DD.MM.YYYY HH:mm")]);
  wsSum.addRow([]);
  const h2 = wsSum.addRow(["Категория", "Базовая ЕИ", "Необходимо", "Отправлено", "Остаток"]);
  h2.font = { bold: true };
  h2.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  wsSum.columns = [{ width: 40 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }];

  const acc = new Map();
  for (const rec of rows) {
    const dim = resolveDimension(rec.basic);
    if (!dim?.category) continue;

    const plan = Number(parseQty(rec.supplyVolume) || 0);
    const base = Number.isFinite(Number(rec.__baseShipped)) ? Number(rec.__baseShipped) : 0;
    const wave = typeof rec.__extras?.shippedQty === "number" ? rec.__extras.shippedQty : 0;
    const shippedTotal = Math.min(plan, base + wave);

    const baseDim = baseByCategory.get(dim.category);
    const unit = baseDim?.code || baseDim?.nameDimension || "";

    const plannedBase = toBase(dim, plan) || 0;
    const shippedBase = toBase(dim, shippedTotal) || 0;

    const prev = acc.get(dim.category) || { unit, planned: 0, shipped: 0 };
    acc.set(dim.category, {
      unit,
      planned: prev.planned + plannedBase,
      shipped: prev.shipped + shippedBase,
    });
  }

  const rowsForSum = Array.from(acc.entries())
    .map(([cat, v]) => ({
      catLabel: catName.get(cat) || cat,
      unit: String(v.unit || "").toUpperCase(),
      planned: Number(v.planned) || 0,
      shipped: Number(v.shipped) || 0,
      remainder: Math.max(0, (Number(v.planned) || 0) - (Number(v.shipped) || 0)),
    }))
    .sort((a, b) => a.catLabel.localeCompare(b.catLabel, "ru"));

  rowsForSum.forEach((r) => {
    const tr = wsSum.addRow([r.catLabel, r.unit, r.planned, r.shipped, r.remainder]);
    [3, 4, 5].forEach((colIdx) => tr.getCell(colIdx).numFmt = "# ##0.####");
  });

  wsSum.eachRow((row, idx) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
      if (idx === h2.number) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F6F6" } };
      }
    });
  });

  // Скачивание
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
