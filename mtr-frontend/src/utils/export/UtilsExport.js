import ExcelJS from "exceljs";
import { saveAs } from "file-saver"; // Для сохранения файла

// Функция экспорта данных в Excel
const handleExportToExcel = async (tableData) => {
  const columnMappings = {
    // number: "№ п/п",
    nameMTR: "Наименование МТР",
    party: "Код МТР",
    basic: "Ед. изм.",
    supplyVolume: "Кол-во",
    region: "Структурное подразделение Отправитель",
    transitional: "Структурное подразделение Получатель (промежуточный склад)",
    requirementsLaying:
      "№ Требования-Накладной на перемещение МТР между транзитными складами (TR), № / дата Распоряжения",
    express:
      "Определние срочности осуществляемой перевозки(срочная / плановая)",
    address: "Структурное подразделение Получатель",
    theBasisForOrdering: "Основание для разнарядки",
    repairObjectName: "Наименование объекта ремонта",
    supply: "Особые отметки. № Требования-Накладной для конечного Получателя",
    note: "Примечание",
  };

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("TableData");

  worksheet.getColumn(1).width = 7.5;
  worksheet.getColumn(2).width = 41.4;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 7;
  worksheet.getColumn(5).width = 14;
  worksheet.getColumn(6).width = 27;
  worksheet.getColumn(7).width = 26;
  worksheet.getColumn(8).width = 22;
  worksheet.getColumn(9).width = 22;
  worksheet.getColumn(10).width = 30;
  worksheet.getColumn(11).width = 23;
  worksheet.getColumn(12).width = 39; // Наименование объекта ремонта
  worksheet.getColumn(13).width = 31;
  worksheet.getColumn(14).width = 25;

  for (let i = 0; i < 9; i++) worksheet.addRow([]);

  const headers = ["№ п/п", ...Object.values(columnMappings)];
  worksheet.addRow(headers);

  const columnNumbers = [
    ...Array.from(
      { length: Object.keys(columnMappings).length + 1 },
      (_, i) => i + 1
    ),
  ];
  worksheet.addRow(columnNumbers);

  tableData.forEach((row, index) => {
    const rowData = [
      index + 1,
      ...Object.keys(columnMappings).map((key) => row[key] ?? ""),
    ];
    worksheet.addRow(rowData);
  });

  worksheet.getRow(10).eachCell((cell) => {
    cell.font = { name: "PT Astra Serif", bold: true, size: 12 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
  });

  worksheet.getRow(11).eachCell((cell) => {
    cell.font = { name: "PT Astra Serif", size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
  });

  worksheet.eachRow((row, rowIndex) => {
    if (rowIndex > 11) {
      row.eachCell((cell) => {
        cell.font = { name: "PT Astra Serif", size: 11 };
        cell.border = { top:{style:"thin"}, left:{style:"thin"}, bottom:{style:"thin"}, right:{style:"thin"} };
      });
    }
  });

  // Далее — тексты/шапка
  worksheet.getRow(1).getCell(12).value =
    "ВРИО начальника базы по хранению и реализации МТР";
  worksheet.getRow(1).getCell(12).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(1).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(2).getCell(12).value = "Югорского УМТСиК (п.Приобье)";
  worksheet.getRow(2).getCell(12).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(2).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(3).getCell(12).value = "С.А. Волкову";
  worksheet.getRow(3).getCell(12).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(3).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  worksheet.addRow([]);
  worksheet.getRow(5).getCell(12).value = "Руководителям филиалов";
  worksheet.getRow(5).getCell(12).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(5).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(6).getCell(12).value = "по списку";
  worksheet.getRow(6).getCell(12).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(6).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(7).getCell(1).value = "Служебная записка";
  worksheet.getRow(7).getCell(1).font = { name: "PT Astra Serif", bold: true, size: 14 };
  worksheet.getRow(7).getCell(12).alignment = { vertical: "middle", horizontal: "left" };

  const mergedUkaz = worksheet.getRow(8);
  mergedUkaz.getCell(1).value =
    "Прошу Вас дать указания подчиненным сотрудникам оформить сопроводительные документы, расходную накладную, осуществить отгрузку поставленных МТР. Грузополучателю организовать вывоз и получение продукции согласно перечню:";
  mergedUkaz.getCell(1).font = { name: "PT Astra Serif", size: 14 };
  mergedUkaz.getCell(1).alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  worksheet.mergeCells(`A8:N8`);
  worksheet.getRow(8).height = 50;

  worksheet.addRow([]);
  let footerRow = worksheet.addRow([]);
  footerRow.getCell(2).value = "Начальник отдела ...";
  footerRow.getCell(2).font = { name: "PT Astra Serif", bold: true, size: 14 };
  footerRow.getCell(9).value = "И.О. Фамилия";
  footerRow.getCell(9).font = { name: "PT Astra Serif", bold: true, size: 14 };

  worksheet.addRow([]);
  worksheet.addRow([]);
  footerRow = worksheet.addRow([]);
  footerRow.getCell(2).value = "Начальник Югорского УМТСиК";
  footerRow.getCell(2).font = { name: "PT Astra Serif", bold: true, size: 14 };
  footerRow.getCell(9).value = "А.Н. Шишмарев";
  footerRow.getCell(9).font = { name: "PT Astra Serif", bold: true, size: 14 };

  worksheet.addRow([]);
  worksheet.addRow([]);
  const mergedRow = worksheet.addRow([]);
  mergedRow.getCell(1).value =
    "Участку Югорского УМТСиК обеспечить оформление Требования-накладной в системе ИУС ПТ в течение 1 рабочего дня с момента получения разнарядки по системе DIRECTUM. Расходная накладная формируется при фактической отгрузке продукции в адрес Филиала.";
  mergedRow.getCell(1).font = { name: "PT Astra Serif", size: 12 };
  mergedRow.getCell(1).alignment = { vertical: "top", horizontal: "left", wrapText: true };
  worksheet.mergeCells(`A${mergedRow.number}:N${mergedRow.number}`);
  worksheet.getRow(mergedRow.number).height = 50;

  worksheet.addRow([]);
  const secondMergedRow = worksheet.addRow([]);
  secondMergedRow.getCell(1).value =
    "По факту поступления МТР на склад конечного грузополучателя, Филиал-грузополучатель оформляет Акт входного контроля 3-го этапа / запись в Журнал входного контроля согласно П-37-166-2013. Документацию по итогам входного контроля 3-его этапа грузополучатель направляет исполнителю данной служебной записки в течение 3-х рабочих дней.";
  secondMergedRow.getCell(1).font = { name: "PT Astra Serif", size: 12 };
  secondMergedRow.getCell(1).alignment = { vertical: "top", horizontal: "left", wrapText: true };
  worksheet.mergeCells(`A${secondMergedRow.number}:N${secondMergedRow.number}`);
  worksheet.getRow(secondMergedRow.number).height = 50;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "TableData.xlsx");
};

export default handleExportToExcel;
