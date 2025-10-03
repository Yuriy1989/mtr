// Экспорт сводного отчёта "Отчёт · Приложение №3"
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import {
  STATUS_FOR_ZAPISKA,
  STATUS_FOR_APP3,
  STATUS_FOR_MTR,
} from "../../constants/status";

export default async function exportApp3ReportExcel(rows = [], opts = {}) {
  const { filename = `Отчёт_Приложение_3.xlsx` } = opts;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Отчёт Прил.3");

  ws.addRow([`Отчёт · Приложение №3`, dayjs().format("DD.MM.YYYY HH:mm")]);
  ws.addRow([]);
  const headers = [
    "СЗ №",
    "СЗ дата",
    "Автор СЗ",
    "Статус СЗ",
    "Прил.3 №",
    "Прил.3 дата",
    "Статус Прил.3",
    "Строк Прил.3",
    "Склады",
    "Направления",
    "Обновлено Прил.3",
    "VL06 Всего",
    "VL06 по статусам",
  ];
  const head = ws.addRow(headers);
  head.font = { bold: true };

  ws.columns = [
    { width: 10 },
    { width: 18 },
    { width: 26 },
    { width: 16 },
    { width: 10 },
    { width: 18 },
    { width: 18 },
    { width: 14 },
    { width: 24 },
    { width: 26 },
    { width: 18 },
    { width: 12 },
    { width: 46 },
  ];

  rows.forEach((r) => {
    const vl06StatsStr = Object.entries(r.vl06Stats || {})
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([code, cnt]) => `${STATUS_FOR_MTR[code] || code}: ${cnt}`)
      .join("; ");

    ws.addRow([
      r.zapiskaId ?? "",
      r.zapiskaCreatedAt
        ? dayjs(r.zapiskaCreatedAt).format("DD.MM.YYYY HH:mm")
        : "",
      r.zapiskaAuthor ?? "",
      STATUS_FOR_ZAPISKA[r.zapiskaStatus] || r.zapiskaStatus || "",
      r.appId ?? "",
      r.appCreatedAt ? dayjs(r.appCreatedAt).format("DD.MM.YYYY HH:mm") : "",
      r.appStatus ? STATUS_FOR_APP3[r.appStatus] || r.appStatus : "",
      Number.isFinite(Number(r.appStatus))
        ? STATUS_FOR_APP3[r.appStatus] || r.appStatus
        : "",
      r.rowsCount ?? 0,
      Array.isArray(r.storages) ? r.storages.join(", ") : "",
      Array.isArray(r.directions) ? r.directions.join(", ") : "",
      r.appUpdatedAt ? dayjs(r.appUpdatedAt).format("DD.MM.YYYY HH:mm") : "",
      r.vl06Total ?? 0,
      vl06StatsStr,
    ]);
  });

  ws.eachRow((row, i) => {
    row.eachCell((c) => {
      c.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
      if (i === head.number) {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF6F6F6" },
        };
      }
      c.alignment = { vertical: "middle", wrapText: true };
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
