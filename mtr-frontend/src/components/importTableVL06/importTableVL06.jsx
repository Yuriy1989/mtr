import { useState, useRef } from "react";
import { DatePicker, InputNumber } from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  ConfigProvider,
  Select,
  Row,
  Col,
  Tag,
  Tooltip,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import Highlighter from "react-highlight-words";
import "./ImportTableVL06.css"; // Подключаем файл стилей
import {
  STATUS_FOR_MTR,
  statusColor,
  STATUS_SHORT_FOR_MTR,
  normalizeStatus,
} from "../../constants/status";

const ImportTableVL06 = ({ initialData, setData }) => {
  const [tableData, setTableData] = useState(initialData); // Управляем состоянием данных таблицы
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null); // Состояние текущей строки для редактирования
  const [currentPage, setCurrentPage] = useState(1); // Текущая страница
  const [pageSize, setPageSize] = useState(10); // Размер страницы
  const pageSizeOptions = [10, 20, 50, 100];
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  // "1/28/25" (MM/DD/YY) -> dayjs
  const parseUsShortDate = (str) => {
    if (!str) return null;
    // безопасный парсинг "M/D/YY"
    const parts = str.split("/");
    if (parts.length !== 3) return null;
    let [m, d, y] = parts.map((p) => parseInt(p, 10));
    if (y < 100) y = 2000 + y; // 25 -> 2025 (при необходимости подстрой)
    const dt = dayjs(new Date(y, m - 1, d));
    return dt.isValid() ? dt : null;
  };

  // dayjs -> "YYYY.MM.DD"
  const formatDotDate = (djs) => (djs ? djs.format("YYYY.MM.DD") : "");

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const statusOptions = Object.entries(STATUS_FOR_MTR).map(
    ([value, label]) => ({
      value: Number(value),
      label,
    })
  );

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => {
      const placeholders = {
        nameMTR: "названию",
        address: "адресу",
        supply: "поставке",
        factory: "заводу",
        storage: "складу",
        material: "материалу",
        party: "партии",
        basic: "базовой ЕИ",
        supplyVolume: "объему поставки",
        created: "создателю",
      };

      const placeholder = placeholders[dataIndex] || "значению";

      return (
        <div
          style={{
            padding: 8,
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Input
            ref={searchInput}
            placeholder={`Поиск по ${placeholder}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{
              marginBottom: 8,
              display: "block",
            }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{
                width: 90,
              }}
            >
              Поиск
            </Button>
            <Button
              onClick={() => {
                clearFilters && clearFilters();
                setSelectedKeys([]);
                setSearchText("");
                confirm({ closeDropdown: true });
              }}
              size="small"
              style={{
                width: 90,
              }}
            >
              Сброс
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => {
                close();
              }}
            >
              Закрыть
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      (record[dataIndex] || "")
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  // Функция редактирования строки
  const onEdit = (record) => {
    setIsEditing(true);
    setEditingRow(record);

    const djs =
      record.vacationOfTheMaterial && record.vacationOfTheMaterial.includes(".")
        ? dayjs(record.vacationOfTheMaterial, "YYYY.MM.DD", true)
        : parseUsShortDate(record.vacationOfTheMaterial);

    form.setFieldsValue({
      nameMTR: record.nameMTR ?? "",
      address: record.address ?? "",
      supply: record.supply ?? "",
      factory: record.factory ?? "",
      storage: record.storage ?? "",
      vacationOfTheMaterial: djs && djs.isValid() ? djs : null,
      material: record.material ?? "",
      party: record.party ?? "",
      basic: record.basic ?? "",
      supplyVolume:
        typeof record.supplyVolume === "number"
          ? record.supplyVolume
          : parseFloat(record.supplyVolume) || 0,
      created: record.created ?? "",
      status: normalizeStatus(record.status),
    });
  };

  // Функция сохранения изменений
  const onSave = async () => {
    // 1) валидируем форму
    const values = await form.validateFields();

    // 2) нормализуем поля
    const toNumber = (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = Number(v.replace(",", ".").trim());
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const payload = {
      ...editingRow,
      nameMTR: values.nameMTR?.trim() ?? "",
      address: values.address?.trim() ?? "",
      supply: values.supply?.trim() ?? "",
      factory: values.factory?.trim() ?? "",
      storage: values.storage?.trim() ?? "",
      vacationOfTheMaterial: values.vacationOfTheMaterial
        ? formatDotDate(values.vacationOfTheMaterial) // YYYY.MM.DD
        : "",
      material: values.material?.trim() ?? "",
      party: values.party?.trim() ?? "",
      basic: values.basic?.trim() ?? "",
      created: values.created?.trim() ?? "",
      supplyVolume: toNumber(values.supplyVolume),
      status: normalizeStatus(values.status),
    };
    // 3) обновляем локальные данные
    const updatedData = tableData.map((row) =>
      row.key === editingRow.key ? payload : row
    );
    setTableData(updatedData);
    setData(updatedData);

    // 4) выходим из режима редактирования
    setIsEditing(false);
    setEditingRow(null);
  };

  // Функция отмены редактирования
  const onCancel = () => {
    setIsEditing(false);
    setEditingRow(null);
  };

  // Функция удаления одной строки
  const onDeleteRow = (key) => {
    const updatedData = initialData.filter((row) => row.key !== key);
    handlePaginationAfterUpdate(updatedData);
  };

  // Функция удаления нескольких выбранных строк
  const onDeleteSelectedRows = () => {
    const updatedData = initialData.filter(
      (row) => !selectedRowKeys.includes(row.key)
    );
    setSelectedRowKeys([]);
    handlePaginationAfterUpdate(updatedData);
  };

  const handlePaginationAfterUpdate = (updatedData) => {
    setData(updatedData);
    const newTotalPages = Math.ceil(updatedData.length / pageSize);

    // Обновляем текущую страницу, если текущая превышает новое число страниц
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages || 1); // Переход на последнюю страницу или первую, если данные отсутствуют
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // Функция отмены редактирования
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 20,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1, // Сквозная нумерация строк
      fixed: "left",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      fixed: "left",
      width: 88,
      align: "center",
      filters: Object.entries(STATUS_FOR_MTR).map(([v, text]) => ({
        text,
        value: Number(v),
      })),
      onFilter: (value, record) =>
        Number(record.status ?? 10) === Number(value),
      sorter: (a, b) => Number(a.status ?? 10) - Number(b.status ?? 10),
      render: (value) => {
        const code = Number(value ?? 10);
        const textFull = STATUS_FOR_MTR[code] || "—";
        const textShort = STATUS_SHORT_FOR_MTR[code] || textFull;

        return (
          <Tooltip title={textFull}>
            <Tag
              color={statusColor(code)}
              style={{
                paddingInline: 6, // ужимаем горизонтальные отступы
                height: 22,
                lineHeight: "22px",
                fontSize: 12, // компактнее шрифт
                marginInline: 0, // чтобы не раздвигать колонку
                whiteSpace: "nowrap",
              }}
            >
              {textShort}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Действия",
      key: "actions",
      fixed: "left",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Button
            size="small"
            danger
            shape="circle"
            icon={<DeleteOutlined />}
            onClick={() => onDeleteRow(record.key)}
          />
        </Space>
      ),
    },
    {
      title: "Название",
      dataIndex: "nameMTR",
      key: "nameMTR",
      width: 300,
      fixed: "left",
      sorter: (a, b) => (a.nameMTR || "").localeCompare(b.nameMTR || ""),
      ...getColumnSearchProps("nameMTR"),
    },
    {
      title: "Имя получателя материала",
      dataIndex: "address",
      key: "address",
      width: 150,
      fixed: "left",
      ...getColumnSearchProps("address"),
      sorter: (a, b) => (a.address || "").localeCompare(b.address || ""),
    },
    {
      title: "Поставка",
      width: 100,
      dataIndex: "supply",
      key: "supply",
      sorter: (a, b) => (a.supply || "").localeCompare(b.supply || ""),
      ...getColumnSearchProps("supply"),
    },
    {
      title: "Завод",
      width: 100,
      dataIndex: "factory",
      key: "factory",
      sorter: (a, b) => (a.factory || "").localeCompare(b.factory || ""),
      ...getColumnSearchProps("factory"),
    },
    {
      title: "Склад",
      dataIndex: "storage",
      key: "storage",
      width: 100,
      sorter: (a, b) => (a.storage || "").localeCompare(b.storage || ""),
      ...getColumnSearchProps("storage"),
    },
    {
      title: "Д/Отпуска материала",
      dataIndex: "vacationOfTheMaterial",
      key: "vacationOfTheMaterial",
      width: 150,
      sorter: (a, b) =>
        (a.vacationOfTheMaterial || "").localeCompare(
          b.vacationOfTheMaterial || ""
        ),
      ...getColumnSearchProps("vacationOfTheMaterial"),
      render: (text) => {
        if (!text) return "—";

        const date = new Date(text); // Превращаем "1/28/25" в объект Date
        if (isNaN(date)) return text; // если не смогли распарсить — выводим как есть

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
      },
    },
    {
      title: "Материал",
      dataIndex: "material",
      key: "material",
      width: 150,
      sorter: (a, b) => (a.material || "").localeCompare(b.material || ""),
      ...getColumnSearchProps("material"),
    },
    {
      title: "Партия",
      dataIndex: "party",
      key: "party",
      width: 150,
      sorter: (a, b) => (a.party || "").localeCompare(b.party || ""),
      ...getColumnSearchProps("party"),
    },
    {
      title: "Базовая ЕИ",
      dataIndex: "basic",
      key: "basic",
      width: 150,
      sorter: (a, b) => (a.basic || "").localeCompare(b.basic || ""),
      ...getColumnSearchProps("basic"),
    },
    {
      title: "Объем поставки",
      dataIndex: "supplyVolume",
      key: "supplyVolume",
      width: 150,
      align: "right",
      defaultSortOrder: "descend",
      sorter: (a, b) => {
        const av =
          typeof a.supplyVolume === "number"
            ? a.supplyVolume
            : parseFloat(a.supplyVolume) || 0;
        const bv =
          typeof b.supplyVolume === "number"
            ? b.supplyVolume
            : parseFloat(b.supplyVolume) || 0;
        return av - bv;
      },
      ...getColumnSearchProps("supplyVolume"), // поиск оставляем строковым ("вхождение")
    },
    {
      title: "Создал",
      dataIndex: "created",
      key: "created",
      width: 110,
      sorter: (a, b) => (a.created || "").localeCompare(b.created || ""),
      ...getColumnSearchProps("created"),
    },
  ];

  return (
    <>
      <ConfigProvider locale={ru_RU}>
        <Space style={{ marginTop: 16 }}>
          <Button
            size="small"
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={onDeleteSelectedRows}
            disabled={selectedRowKeys.length === 0}
          >
            Удалить выбранные
          </Button>
        </Space>

        {/* Таблица показываем, только если есть данные */}
        {Array.isArray(initialData) && initialData.length > 0 ? (
          <Table
            rowSelection={rowSelection}
            className="custom-table"
            columns={columns}
            dataSource={initialData}
            scroll={{ x: "max-content", y: 550 }}
            pagination={{
              pageSize,
              size: "small",
              current: currentPage,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
            }}
            showSorterTooltip={{ target: "sorter-icon" }}
            bordered
            rowClassName={(record) =>
              Number(record.status) === 0 ? "row-deleted" : ""
            }
            footer={() => (
              <Space>
                <span>Всего строк: {initialData.length}</span>
                <Select
                  value={pageSize}
                  onChange={(value) => {
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  options={pageSizeOptions.map((size) => ({
                    value: size,
                    label: `${size} на странице`,
                  }))}
                  style={{ width: 150 }}
                />
              </Space>
            )}
          />
        ) : (
          <div style={{ padding: 8, color: "#999" }}>
            Данные отсутствуют. Загрузите файл для импорта.
          </div>
        )}

        {/* Модалка с формой — ВСЕГДА смонтирована */}
        <Modal
          title="Редактировать данные"
          open={isEditing}
          onOk={onSave}
          onCancel={onCancel}
          centered
          destroyOnClose={false} // не размонтируем форму при закрытии
          width={720}
          style={{ top: 16 }}
          styles={{
            body: { padding: 12, maxHeight: "70vh", overflow: "auto" },
          }}
        >
          <Form form={form} layout="vertical" className="compact-form" preserve>
            {/* 1-я строка: Название */}
            <Row gutter={[12, 8]}>
              <Col span={24}>
                <Form.Item
                  name="nameMTR"
                  label="Название"
                  rules={[{ required: true, message: "Введите название!" }]}
                >
                  <Input placeholder="Название" />
                </Form.Item>
              </Col>
            </Row>

            {/* 2-я строка: Адрес + Создал */}
            <Row gutter={[12, 8]}>
              <Col xs={24} md={14}>
                <Form.Item name="address" label="Имя получателя материала">
                  <Input placeholder="Получатель" />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item name="created" label="Создал">
                  <Input placeholder="ФИО" />
                </Form.Item>
              </Col>
            </Row>

            {/* 3-я строка: Поставка + Завод + Склад */}
            <Row gutter={[12, 8]}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="supply"
                  label="Поставка"
                  rules={[{ required: true, message: "Введите поставку!" }]}
                >
                  <Input placeholder="Поставка" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="factory" label="Завод">
                  <Input placeholder="Завод" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="storage" label="Склад">
                  <Input placeholder="Склад" />
                </Form.Item>
              </Col>
            </Row>

            {/* 4-я строка: Материал + Партия + Базовая ЕИ */}
            <Row gutter={[12, 8]}>
              <Col xs={24} md={10}>
                <Form.Item
                  name="material"
                  label="Материал"
                  rules={[{ required: true, message: "Введите материал!" }]}
                >
                  <Input placeholder="Материал" />
                </Form.Item>
              </Col>
              <Col xs={24} md={7}>
                <Form.Item name="party" label="Партия">
                  <Input placeholder="Партия" />
                </Form.Item>
              </Col>
              <Col xs={24} md={7}>
                <Form.Item name="basic" label="Базовая ЕИ">
                  <Input placeholder="Единица" />
                </Form.Item>
              </Col>
            </Row>

            {/* 5-я строка: Дата + Объем поставки */}
            <Row gutter={[12, 8]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="vacationOfTheMaterial"
                  label="Д/Отпуска материала"
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY.MM.DD"
                    allowClear
                    inputReadOnly
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="supplyVolume"
                  label="Объем поставки"
                  rules={[
                    { required: true, message: "Введите объем поставки!" },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[12, 8]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Статус"
                  rules={[{ required: true, message: "Выберите статус!" }]}
                >
                  <Select
                    options={statusOptions}
                    placeholder="Выберите статус"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default ImportTableVL06;
