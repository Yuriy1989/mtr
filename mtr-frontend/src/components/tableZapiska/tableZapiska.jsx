import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlusSquareOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  ConfigProvider,
  Tooltip,
  Tag,
  App,
} from "antd";
import ru_RU from "antd/locale/ru_RU";
import Highlighter from "react-highlight-words";
import { api as apiDirectories } from "../../utils/ApiDirectories";
import "./TableZapiska.css";
import {
  STATUS_FOR_MTR,
  statusColor,
  normalizeStatus,
  STATUS_SHORT_FOR_MTR,
} from "../../constants/status";

const TableZapiska = ({ initialData }) => {
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableData, setTableData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    setTableData(
      (initialData || []).map((r) => ({
        ...r,
        status: normalizeStatus(r.status),
      }))
    );
  }, [initialData]);

  /**
   * Проверка регионов — как было
   */
  function checkSelectedRegions(selectedData, regions) {
    const codeToRegion = new Map();
    regions.forEach((r) => {
      (r.codeRegion || []).forEach((code) => {
        const existed = codeToRegion.get(code);
        if (existed && existed.id !== r.id) {
          codeToRegion.set(code, { ...r, __ambiguous: true });
        } else {
          codeToRegion.set(code, r);
        }
      });
    });

    const usedRegionIds = new Set();
    const usedRegionNames = new Set();
    const notFoundCodes = new Set();
    const ambiguousCodes = new Set();

    selectedData.forEach((row) => {
      const code = row.storage;
      const region = codeToRegion.get(code);
      if (!region) {
        notFoundCodes.add(code);
        return;
      }
      if (region.__ambiguous) {
        ambiguousCodes.add(code);
        return;
      }
      usedRegionIds.add(region.id);
      usedRegionNames.add(region.nameRegion);
    });

    const ok =
      usedRegionIds.size <= 1 &&
      notFoundCodes.size === 0 &&
      ambiguousCodes.size === 0;

    return {
      ok,
      regionId: usedRegionIds.size === 1 ? [...usedRegionIds][0] : undefined,
      regionName:
        usedRegionNames.size === 1 ? [...usedRegionNames][0] : undefined,
      usedRegionIds: [...usedRegionIds],
      usedRegionNames: [...usedRegionNames],
      notFoundCodes: [...notFoundCodes],
      ambiguousCodes: [...ambiguousCodes],
    };
  }

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

  // Сохранение из модалки (локально)
  const onSave = () => {
    form.validateFields().then((values) => {
      const updated = tableData.map((row) =>
        row.key === editingRow.key ? { ...row, ...values } : row
      );
      setTableData(updated);
      setIsEditing(false);
      setEditingRow(null);
    });
  };
  const onCancel = () => {
    setIsEditing(false);
    setEditingRow(null);
  };

  // Создание служебки из выбранных
  const onCreateZapiskaFromImport = async () => {
    // грузим регионы
    const regions = await apiDirectories.getRegionsAll();
    const selectedData = tableData.filter((row) =>
      selectedRowKeys.includes(row.key)
    );

    const result = checkSelectedRegions(selectedData, regions);

    if (result.notFoundCodes.length) {
      modal.error({
        title: "Не найдены регионы для складов",
        content: `Для следующих складов не найден регион: ${result.notFoundCodes.join(
          ", "
        )}`,
      });
      return;
    }
    if (result.ambiguousCodes.length) {
      modal.error({
        title: "Неоднозначная привязка региона",
        content: `Склады ${result.ambiguousCodes.join(
          ", "
        )} встречаются в разных регионах. Уточните справочник регионов.`,
      });
      return;
    }

    const go = () =>
      navigate("/createZapiskaFromImport", {
        state: {
          // Передаём вместе с данными новое поле repairObjectName
          selectedData: selectedData.map((r) => ({
            ...r,
            repairObjectName: r.repairObjectName || "",
          })),
        },
      });

    if (result.ok) {
      message.success(`Регион: ${result.regionName}`);
      go();
      return;
    }

    modal.confirm({
      title: "Есть МТР для разных регионов",
      content: `Обнаружены склады из разных регионов: ${result.usedRegionNames.join(
        ", "
      )}. Продолжить?`,
      okText: "Да",
      cancelText: "Нет",
      onOk: go,
    });
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };
  const rowSelection = { selectedRowKeys, onChange: onSelectChange };

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 20,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
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
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        (Number(a.supplyVolume) || 0) - (Number(b.supplyVolume) || 0),
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
      {tableData ? (
        <>
          <ConfigProvider locale={ru_RU}>
            <Space style={{ marginTop: 16 }} wrap>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<PlusSquareOutlined />}
                onClick={onCreateZapiskaFromImport}
                disabled={selectedRowKeys.length === 0}
              >
                Создать из выбранных элементов
              </Button>
            </Space>

            <Table
              rowSelection={rowSelection}
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

            <Modal
              title="Редактировать данные"
              open={isEditing}
              onOk={onSave}
              onCancel={onCancel}
            >
              <Form form={form} layout="vertical">
                <Form.Item
                  name="material"
                  label="Материал"
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, введите материал!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="supply"
                  label="Поставка"
                  rules={[
                    {
                      required: true,
                      message: "Пожалуйста, введите поставку!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Form>
            </Modal>
          </ConfigProvider>
        </>
      ) : null}
    </>
  );
};

export default TableZapiska;
