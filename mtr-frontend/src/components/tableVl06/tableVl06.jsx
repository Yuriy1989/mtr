import { useState, useRef, useEffect } from "react";
import { SearchOutlined, EditOutlined } from "@ant-design/icons";
import {
  STATUS_FOR_MTR,
  statusColor,
  STATUS_SHORT_FOR_MTR,
  normalizeStatus
} from "../../constants/status";
import {
  Table,
  Button,
  Input,
  Space,
  ConfigProvider,
  Tooltip,
  Tag,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Select,
  Row,
  Col,
  message,
} from "antd";
import dayjs from "dayjs";
import ru_RU from "antd/locale/ru_RU";
import Highlighter from "react-highlight-words";
import "./TableVl06.css";

// (опционально) если хочешь сразу писать в БД одной позицией:
import { api as apiImportVL06 } from "../../utils/ApiImportVL06";

const TableVl06 = ({ initialData = [] }) => {
  // локальные данные таблицы (чтобы сразу видеть изменения)
  const [tableData, setTableData] = useState(initialData);
  useEffect(() => setTableData(initialData || []), [initialData]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // редактирование
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();
  const [saving, setSaving] = useState(false); // лоадер на кнопке "ОК"

  // дата: "1/28/25" -> dayjs
  const parseUsShortDate = (str) => {
    if (!str) return null;
    const parts = String(str).split("/");
    if (parts.length !== 3) return null;
    let [m, d, y] = parts.map((p) => parseInt(p, 10));
    if (y < 100) y = 2000 + y;
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
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder={`Поиск по ${placeholder}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
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
              style={{ width: 90 }}
            >
              Сброс
            </Button>
            <Button type="link" size="small" onClick={() => close()}>
              Закрыть
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      (record[dataIndex] || "")
        .toString()
        .toLowerCase()
        .includes(String(value).toLowerCase()),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) setTimeout(() => searchInput.current?.select(), 100);
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  // Открыть модалку редактирования
  const onEdit = (record) => {
    setIsEditing(true);
    setEditingRow(record);

    const djs =
      record.vacationOfTheMaterial &&
      String(record.vacationOfTheMaterial).includes(".")
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

  // Сохранить изменения
  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // локальный payload (для таблицы)
      const payload = {
        ...editingRow,
        nameMTR: values.nameMTR?.trim() ?? "",
        address: values.address?.trim() ?? "",
        supply: values.supply?.trim() ?? "",
        factory: values.factory?.trim() ?? "",
        storage: values.storage?.trim() ?? "",
        vacationOfTheMaterial: values.vacationOfTheMaterial
          ? formatDotDate(values.vacationOfTheMaterial)
          : "",
        material: values.material?.trim() ?? "",
        party: values.party?.trim() ?? "",
        basic: values.basic?.trim() ?? "",
        created: values.created?.trim() ?? "",
        supplyVolume:
          typeof values.supplyVolume === "number"
            ? values.supplyVolume
            : parseFloat(values.supplyVolume) || 0,
        status: normalizeStatus(values.status),
      };

      // payload для бэка (ISO + число)
      const payloadForBackend = {
        ...payload,
        vacationOfTheMaterial: values.vacationOfTheMaterial
          ? values.vacationOfTheMaterial.format("YYYY-MM-DD")
          : null,
      };

      // оптимистично обновим таблицу (с возможностью отката)
      const prev = tableData;
      setTableData((prevData) =>
        prevData.map((r) => (r.key === editingRow.key ? payload : r))
      );

      if (editingRow?.id && typeof apiImportVL06.updateVl06 === "function") {
        try {
          await apiImportVL06.updateVl06(editingRow.id, payloadForBackend);
          messageApi.success("Данные изменены");
          setIsEditing(false);
          setEditingRow(null);
        } catch (e) {
          setTableData(prev); // откат
          messageApi.error(e?.message || "Не удалось сохранить изменения");
        }
      } else {
        // локальный режим без запроса
        messageApi.success("Данные изменены");
        setIsEditing(false);
        setEditingRow(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setIsEditing(false);
    setEditingRow(null);
  };

  const columns = [
    // фиксированные СЛЕВА должны идти подряд
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 56,
      fixed: "left",
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "",
      key: "actions",
      fixed: "left",
      width: 56,
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          shape="circle"
          icon={<EditOutlined />}
          onClick={() => onEdit(record)}
        />
      ),
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
        const textShort = STATUS_SHORT_FOR_MTR?.[code] || textFull;
        return (
          <Tooltip title={textFull}>
            <Tag
              color={statusColor(code)}
              style={{
                paddingInline: 6,
                height: 22,
                lineHeight: "22px",
                fontSize: 12,
                marginInline: 0,
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
    // дальше — обычные колонки
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
        // поддержка "YYYY.MM.DD" и "M/D/YY"
        const d = String(text).includes(".")
          ? dayjs(String(text), "YYYY.MM.DD", true)
          : parseUsShortDate(String(text));
        return d && d.isValid() ? d.format("YYYY.MM.DD") : text;
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
      ...getColumnSearchProps("supplyVolume"),
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
        {contextHolder}
        <Table
          className="custom-table"
          columns={columns}
          dataSource={tableData}
          scroll={{ x: "max-content", y: 550 }}
          pagination={{
            pageSize,
            size: "small",
            current: currentPage,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              setPageSize(pageSize);
            },
          }}
          showSorterTooltip={{ target: "sorter-icon" }}
          rowClassName={(record) =>
            Number(record.status) === 0 ? "row-deleted" : ""
          }
        />

        {/* Модалка с формой — ВСЕГДА смонтирована */}
        <Modal
          title="Редактировать данные"
          open={isEditing}
          onOk={onSave}
          onCancel={onCancel}
          centered
          destroyOnClose={false}
          confirmLoading={saving} // ← индикатор загрузки
          okText="Сохранить"
          cancelText="Отмена"
          width={720}
          style={{ top: 16 }}
          styles={{
            body: { padding: 12, maxHeight: "70vh", overflow: "auto" },
          }}
        >
          <Form form={form} layout="vertical" preserve>
            {/* 1: Название */}
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

            {/* 2: Адрес + Создал */}
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

            {/* 3: Поставка + Завод + Склад */}
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

            {/* 3.1: Статус */}
            <Row gutter={[12, 8]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="status"
                  label="Статус"
                  rules={[{ required: true, message: "Выберите статус!" }]}
                >
                  <Select
                    options={Object.entries(STATUS_FOR_MTR).map(
                      ([value, label]) => ({
                        value: Number(value),
                        label,
                      })
                    )}
                    placeholder="Выберите статус"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 4: Дата + Объем поставки */}
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

            {/* 5: Материал + Партия + Базовая ЕИ */}
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
          </Form>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default TableVl06;
