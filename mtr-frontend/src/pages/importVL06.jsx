import { useState } from "react";
import { Divider, Button, Space, Typography, Spin, Tabs, message, Progress } from "antd"; // NEW: Progress
import { DownloadOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { read, utils } from "xlsx";
import { api as apiImportVL06 } from "../utils/ApiImportVL06";
import ImportTableVL06 from "../components/importTableVL06/importTableVL06";
import TableVl06 from "../components/tableVl06/tableVl06";
import { normalizeStatus } from "../constants/status";

const { Text } = Typography;

const ImportVL06 = () => {
  const [load, setLoad] = useState(false); // загрузка (общая)
  const [fileName, setFileName] = useState(); // файл импорта
  const [tableData, setTableData] = useState([]); // данные из импортированных таблиц
  const [dataDB, setDataDB] = useState([]); // данные из БД
  const [messageApi, contextHolder] = message.useMessage(); // уведомления
  const [messageArray, setMessageArray] = useState(); // сколько добавлено в БД
  const key = "updatable";

  // NEW: отдельные стейты для отправки в БД чанками
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100

  // запрос к бекенду для импорта данных в БД (чанками)
  const onImportVL06 = async () => {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      messageApi.warning("Нет данных для загрузки");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const res = await apiImportVL06.createMTRFromImportVL06(tableData, {
        chunkSize: 200,
        onProgress: ({ done, total }) => setProgress(Math.round((done / total) * 100)),
      });

      // Универсально берём число: либо count (как мы вернули), либо res.data.length, либо tableData.length
      const count =
        (typeof res?.count === "number" && res.count) ||
        (Array.isArray(res?.data) && res.data.length) ||
        tableData.length;

      setMessageArray(count);
      messageApi.success(`Данные успешно сохранены (${count})!`);
      setTableData([]); // очищаем импортированную таблицу после успешной загрузки
      setFileName(undefined);
      setProgress(100);
    } catch (error) {
      console.error("Ошибка загрузки данных в БД:", error);
      messageApi.error(error?.message || "Ошибка сохранения данных");
    } finally {
      setUploading(false);
    }
  };

  // выгрузка данных из БД
  const handleGetDataFromImport = async () => {
    setLoad(true);
    try {
      const data = await apiImportVL06.getMTRFromImportVL06ForZapiski();

      const filterData = (data?.data || []).map((row, i) => ({
        key: i,
        id: row.id,
        supply: row.supply,
        factory: row.factory,
        storage: row.storage,
        vacationOfTheMaterial: row.vacationOfTheMaterial,
        material: row.material,
        party: row.party,
        nameMTR: row.nameMTR,
        basic: row.basic,
        supplyVolume: row.supplyVolume,
        address: row.address,
        created: row.created,
        status: normalizeStatus(row.status),
      }));

      setDataDB(filterData);

      messageApi.open({
        key,
        type: "success",
        content: "Данные успешно загружены!",
        duration: 2,
      });
    } catch (error) {
      messageApi.open({
        key,
        type: "error",
        content: "Ошибка загрузки данных из БД!",
        duration: 2,
      });
      console.error("Ошибка загрузки данных из БД:", error);
    } finally {
      setLoad(false);
    }
  };

  // импорт из Excel
  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoad(true);
    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const wb = read(data, { cellText: false, cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws, { raw: false });

      const filterData = jsonData.map((row, i) => ({
        key: i,
        supply: row["Поставка"],
        factory: row["Завод"],
        storage: row["Склад"],
        vacationOfTheMaterial: row["Д/Отпуска материала"],
        material: row["Материал"],
        party: row["Партия"],
        nameMTR: row["Название"],
        basic: row["Базовая ЕИ"],
        supplyVolume: row["Объем поставки"],
        address: row["Имя получателя материала"],
        created: row["Создал"],
        status: 10, // по умолчанию "Новая"
      }));

      setTableData(filterData);
      setMessageArray(undefined); // сброс счётчика «добавлено»
      setProgress(0); // сброс прогресса
    } catch (error) {
      console.error("Ошибка при импорте данных:", error);
      messageApi.error("Ошибка при импорте данных");
      setTableData([]);
      setFileName(undefined);
    } finally {
      setLoad(false);
      e.target.value = "";
    }
  };

  const items = [
    {
      key: "1",
      label: "Реестр",
      children: (
        <>
          <Space style={{ marginTop: 16 }}>
            <Button size="small" type="primary" ghost onClick={handleGetDataFromImport}>
              Загрузить данные
            </Button>
          </Space>
          <TableVl06 initialData={dataDB} />
        </>
      ),
    },
    {
      key: "2",
      label: "Импорт",
      children: (
        <>
          <Space direction="horizontal" size="small" style={{ display: "flex", alignItems: "center" }}>
            <Button icon={<DownloadOutlined />} size="small">
              <label htmlFor="fileImport" style={{ cursor: "pointer", margin: 0 }}>Импортировать из VL-06</label>
            </Button>

            <Button
              type="primary"
              icon={<PlusSquareOutlined />}
              size="small"
              onClick={onImportVL06}
              disabled={tableData.length < 1 || uploading}
              loading={uploading} // NEW: лоадер на кнопке
            >
              Загрузить в базу данных
            </Button>

            {/* NEW: прогресс импорта чанков */}
            {uploading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Progress style={{ width: 160 }} percent={progress} size="small" />
                <span>{progress}%</span>
              </span>
            ) : null}

            {fileName && (
              <span>
                &nbsp;{fileName} загружен.{" "}
                <Text type={messageArray ? "success" : "secondary"}>
                  Добавлено {messageArray || 0} МТР
                </Text>
              </span>
            )}

            <input
              id="fileImport"
              type="file"
              name="file"
              style={{ display: "none" }}
              onChange={handleImportData}
              accept=".xlsx,.xls"
            />
          </Space>

          {load ? (
            <Spin spinning={load} fullscreen />
          ) : tableData && tableData.length > 0 ? (
            <ImportTableVL06 initialData={tableData} setData={setTableData} />
          ) : (
            <p>Данные отсутствуют. Загрузите файл для импорта.</p>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Divider orientation="left">Работа с формой VL-06 из ИУС ПТ</Divider>
      <Tabs defaultActiveKey="1" type="card" items={items} />
    </>
  );
};

export default ImportVL06;
