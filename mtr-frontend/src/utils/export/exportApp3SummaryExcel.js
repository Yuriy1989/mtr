// Плоский экспорт сводной таблицы "Сводная по Приложениям 3"
import ExcelJS from "exceljs";
import dayjs from "dayjs";

const fmtDate = (iso) => (iso ? dayjs(iso).format("DD.MM.YYYY") : "");
const labelTransport = (type) =>
  type === "container" ? "Контейнер" : type === "auto" ? "Авто" : "";

/**
 * rows — строки из ReportsApp3Summary (после фильтров), без группировок
 */
export default async function exportApp3SummaryExcel(rows = [], opts = {}) {
  const { filename = `Сводная_Приложение_3_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx` } = opts;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Сводная по Прил.3");

  // Шапка
  ws.addRow([`Сводная по Приложениям №3`, dayjs().format("DD.MM.YYYY HH:mm")]);
  ws.addRow([]);

  // Заголовки
  const headers = [
    "№",
    "Приложение №3",
    "СЗ №",
    "Направление",
    "Срочный",
    "Название",
    "Имя получателя материала",
    "Поставка",
    "Завод",
    "Склад",
    "Д/Отпуска материала",
    "Материал",
    "Партия",
    "Базовая ЕИ",
    "Объем поставки",
    "Заявка (дата)",
    "Груз сформирован (тип + №)",
    "Отгрузка (дата)",
    "Получатель",
    "М11 дата",
    "М11 №",
    "Отгружено (кол-во)",
    "Примечание",
  ];
  const head = ws.addRow(headers);
  head.font = { bold: true };

  // Ширины
  const widths = [6, 12, 10, 24, 10, 38, 30, 12, 10, 10, 16, 16, 14, 12, 14, 16, 28, 16, 24, 12, 12, 18, 28];
  ws.columns = widths.map((w) => ({ width: w }));

  // Данные
  rows.forEach((r, i) => {
    const formed = (() => {
      const t = labelTransport(r.format || r.transportRequest);
      const num = r.transportNumber || "";
      if (t && num) return `${t} ${num}`;
      if (t) return t;
      if (num) return num;
      return "";
    })();

    ws.addRow([
      i + 1,
      r.appId ?? "",
      r.zapiskaId ?? "",
      r.direction || "",
      r.urgent ? "Срочно" : "—",
      r.nameMTR ?? "",
      r.address ?? "",
      r.supply ?? "",
      r.factory ?? "",
      r.storage ?? "",
      fmtDate(r.vacationOfTheMaterial),
      r.material ?? "",
      r.party ?? "",
      r.basic ?? "",
      r.supplyVolume ?? "",
      fmtDate(r.dateRequest),
      formed,
      fmtDate(r.dateShipment),
      r.transit ?? "",
      fmtDate(r.dateM11),
      r.numberM11 ?? "",
      typeof r.shippedQty === "number" ? r.shippedQty : "",
      r.addNote ?? "",
    ]);
  });

  // Границы/оформление
  ws.eachRow((row, idx) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
      if (idx === head.number)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F6F6" } };
    });
  });

  // Скачать
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
