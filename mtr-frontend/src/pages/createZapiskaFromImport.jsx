import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Modal,
  Input,
  Space,
  Layout,
  Checkbox,
  Spin,
  App,
  Tag,
  Divider,
  Card,
} from "antd";
import {
  DeleteOutlined,
  FileExcelOutlined,
  SearchOutlined,
  CheckSquareOutlined,
  SelectOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import { handleExportToExcel } from "../utils/export/handleExportToExcelZapiski";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as apiZapiska } from "../utils/ApiZapiski";
import { api as apiRegions } from "../utils/ApiDirectories";
import { api as apiVl06 } from "../utils/ApiImportVL06";
import { api as apiDirectories } from "../utils/ApiDirectories";
import { STATUS_FOR_ZAPISKA, statusColor } from "../constants/status";

const { Header, Content, Footer } = Layout;

const CreateZapiskaFromImport = () => {
  const location = useLocation();
  const updatedData = location.state?.selectedData || [];
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableData, setTableData] = useState(updatedData);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenForSave, setIsModalOpenForSave] = useState(false);
  const [load, setLoad] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [region, setRegions] = useState(null);
  const [massRepairName, setMassRepairName] = useState("");
  const [catList, setCatList] = useState([]); // категории из БД

  const searchInput = useRef(null);
  const { message } = App.useApp();

  const navigate = useNavigate();
  const user = useSelector((state) => state.users.userData);
  const year = new Date();

  // ===== Справочник единиц из БД =====
  const [dimensions, setDimensions] = useState([]);
  const lower = (s) => (s == null ? "" : String(s).trim().toLowerCase());

  const dimByCode = useMemo(() => {
    const m = new Map();
    for (const d of dimensions || []) if (d.code) m.set(lower(d.code), d);
    return m;
  }, [dimensions]);

  const dimByAlias = useMemo(() => {
    const m = new Map();
    for (const d of dimensions || []) {
      if (Array.isArray(d.aliases)) {
        for (const t of d.aliases) if (t) m.set(lower(t), d);
      }
      if (d.nameDimension) m.set(lower(d.nameDimension), d);
    }
    return m;
  }, [dimensions]);

  const baseByCategory = useMemo(() => {
    const m = new Map();
    for (const d of dimensions || []) if (d?.category && d.isBase) m.set(d.category, d);
    return m;
  }, [dimensions]);

  const catName = useMemo(() => {
    const map = new Map();
    for (const c of catList || []) map.set(c.key, c.nameRu || c.key);
    return map;
  }, [catList]);

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

  const ZAPISKA_PLANNED_STATUS = 20;
  const zapStatusLabel =
    STATUS_FOR_ZAPISKA[ZAPISKA_PLANNED_STATUS] ||
    `Статус ${ZAPISKA_PLANNED_STATUS}`;
  const zapStatusColor = statusColor(ZAPISKA_PLANNED_STATUS);

  const rowNumber = (_, __, index) => (currentPage - 1) * pageSize + index + 1;

  const calcRegionIdsForCurrentTable = () => {
    if (!region) return [];
    const storages = Array.from(
      new Set((tableData || []).map((r) => r.storage).filter(Boolean))
    );
    const ids = new Set();
    storages.forEach((st) => {
      const found = region.find((rg) => (rg.codeRegion || []).includes(st));
      if (found?.id) ids.add(found.id);
    });
    return Array.from(ids);
  };

  const deliveryRegions = useMemo(() => {
    if (!region) return { names: [], unknownCodes: [] };
    const storageCodes = Array.from(
      new Set((tableData || []).map((r) => r.storage).filter(Boolean))
    );
    const namesSet = new Set();
    const unknown = [];
    storageCodes.forEach((code) => {
      const found = region.find((rg) => (rg.codeRegion || []).includes(code));
      if (found) namesSet.add(found.nameRegion);
      else unknown.push(code);
    });
    return { names: Array.from(namesSet), unknownCodes: unknown };
  }, [tableData, region]);

  // ===== статистика по ЕИ (из БД) =====
  const stats = useMemo(() => {
    const raw = new Map(); // «как указано в данных»
    const byCategory = new Map(); // нормализация в базовую ед. категории

    for (const r of tableData || []) {
      const qty = Number(r.supplyVolume) || 0;
      const unitRaw = r.basic;

      const keyRaw = unitRaw || "—";
      raw.set(keyRaw, (raw.get(keyRaw) || 0) + qty);

      const dim = resolveDimension(unitRaw);
      if (!dim?.category) continue;

      const baseDim = baseByCategory.get(dim.category);
      const valBase = toBase(dim, qty);
      if (baseDim && valBase != null) {
        const prev = byCategory.get(dim.category) || {
          total: 0,
          unit: baseDim.code || baseDim.nameDimension || "",
        };
        byCategory.set(dim.category, {
          total: prev.total + valBase,
          unit: prev.unit,
        });
      }
    }

    const toObj = (m) => {
      const o = {};
      for (const [k, v] of m.entries()) o[k] = v;
      return o;
    };
    return { raw: toObj(raw), normalized: toObj(byCategory) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableData, dimByCode, dimByAlias, baseByCategory]);

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
        repairObjectName: "объекту ремонта",
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

  const columns = [
    {
      title: "№",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: rowNumber,
      fixed: "left",
    },
    {
      title: "Действия",
      key: "actions",
      fixed: "left",
      width: 70,
      render: (_, record) => {
        const isSelected = selectedRowKeys.includes(record.key);
        return (
          <Space>
            <Button
              size="small"
              shape="circle"
              danger={isSelected}
              disabled={!isSelected}
              icon={<DeleteOutlined />}
              onClick={() => onDeleteRow(record.key)}
              title={isSelected ? "Удалить строку" : "Отметьте строку слева"}
            />
          </Space>
        );
      },
    },
    {
      title: "Срочный",
      danaIndex: "express",
      key: "express",
      width: 70,
      fixed: "left",
      render: (_, record) => (
        <Checkbox
          checked={record.express === "Срочный"}
          onChange={(e) => handleExpressChange(record.key, e.target.checked)}
        />
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
      width: 180,
      fixed: "left",
      sorter: (a, b) => (a.address || "").localeCompare(b.address || ""),
      ...getColumnSearchProps("address"),
    },
    {
      title: "Поставка",
      width: 120,
      dataIndex: "supply",
      key: "supply",
      sorter: (a, b) => (a.supply || "").localeCompare(b.supply || ""),
      ...getColumnSearchProps("supply"),
    },
    {
      title: "Завод",
      width: 120,
      dataIndex: "factory",
      key: "factory",
      sorter: (a, b) => (a.factory || "").localeCompare(b.factory || ""),
      ...getColumnSearchProps("factory"),
    },
    {
      title: "Склад",
      dataIndex: "storage",
      key: "storage",
      width: 120,
      sorter: (a, b) => (a.storage || "").localeCompare(b.storage || ""),
      ...getColumnSearchProps("storage"),
    },
    {
      title: "Д/Отпуска материала",
      dataIndex: "vacationOfTheMaterial",
      key: "vacationOfTheMaterial",
      width: 180,
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
      width: 160,
      sorter: (a, b) => (a.material || "").localeCompare(b.material || ""),
      ...getColumnSearchProps("material"),
    },
    {
      title: "Партия",
      dataIndex: "party",
      key: "party",
      width: 140,
      sorter: (a, b) => (a.party || "").localeCompare(b.party || ""),
      ...getColumnSearchProps("party"),
    },
    {
      title: "Базовая ЕИ",
      dataIndex: "basic",
      key: "basic",
      width: 130,
      sorter: (a, b) => (a.basic || "").localeCompare(b.basic || ""),
      ...getColumnSearchProps("basic"),
    },
    {
      title: "Объем поставки",
      dataIndex: "supplyVolume",
      key: "supplyVolume",
      width: 140,
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        (Number(a.supplyVolume) || 0) - (Number(b.supplyVolume) || 0),
      ...getColumnSearchProps("supplyVolume"),
    },
    {
      title: "Создал",
      dataIndex: "created",
      key: "created",
      width: 130,
      sorter: (a, b) => (a.created || "").localeCompare(b.created || ""),
      ...getColumnSearchProps("created"),
    },
    {
      title: "Наименование объекта ремонта",
      dataIndex: "repairObjectName",
      key: "repairObjectName",
      width: 240,
      ...getColumnSearchProps("repairObjectName"),
      render: (v, record) => (
        <Input
          size="small"
          placeholder="Введите…"
          value={record.repairObjectName || ""}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((row) =>
                row.key === record.key
                  ? { ...row, repairObjectName: e.target.value }
                  : row
              )
            )
          }
        />
      ),
    },
    {
      title: "Примечание",
      dataIndex: "note",
      key: "note",
      width: 160,
      render: (_, record) => (
        <Input
          size="small"
          placeholder="Введите примечание"
          value={record.note || ""}
          onChange={(e) => handleNoteChange(record.key, e.target.value)}
        />
      ),
    },
  ];

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  // сохранить и выйти на главную
  const handleSaveAndExit = async () => {
    setLoad(true);
    try {
      await handleCreateZapiska();
      setLoad(false);
      handleCancel();
      handleLocationMain();
    } catch (error) {
      console.log(error);
    }
  };

  // Сохранение служебки
  const handleCreateZapiska = async () => {
    setLoad(true);
    try {
      const regionIds = calcRegionIdsForCurrentTable();

      const newZapiska = await apiZapiska.createZapiski(user?.id, regionIds);
      const zapiskaId = newZapiska?.data?.id;
      if (!zapiskaId) throw new Error("Не удалось получить id записки");

      const items = tableData.map(
        ({ id, express, note, repairObjectName }) => ({
          vl06Id: id,
          express: express || null,
          note: note || null,
          repairObjectName: repairObjectName || null,
        })
      );
      await apiMtrList.syncForZapiska(Number(zapiskaId), items);

      const vl06Ids = tableData.map(({ id }) => id).filter(Boolean);
      await apiVl06
        .updateStatuses(vl06Ids, 20)
        .catch((e) => console.warn("Не все статусы VL06 обновились:", e));

      message.success("Служебная записка создана и сохранена", 3);
      navigate(`/editZapiskaFromImport/${newZapiska?.data?.id}`);
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      message.error(
        error?.message || "Не удалось сохранить служебную записку",
        4
      );
    } finally {
      setLoad(false);
      setIsModalOpenForSave(false);
    }
  };

  const showModal = () => setIsModalOpen(true);
  const showModalForSave = () => setIsModalOpenForSave(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsModalOpenForSave(false);
  };

  const onDeleteRow = (key) => {
    const updatedData = tableData.filter((row) => row.key !== key);
    handlePaginationAfterUpdate(updatedData);
  };

  function handleLocationMain() {
    setIsModalOpen(false);
    navigate("/");
  }

  const handlePaginationAfterUpdate = (updatedData) => {
    setTableData(updatedData);
    const newTotalPages = Math.ceil(updatedData.length / pageSize);
    if (currentPage > newTotalPages) setCurrentPage(newTotalPages || 1);
  };

  const handleExpressChange = (key, checked) => {
    const updatedData = tableData.map((item) =>
      item.key === key ? { ...item, express: checked ? "Срочный" : "" } : item
    );
    setTableData(updatedData);
  };

  const handleNoteChange = (key, value) => {
    const updatedData = tableData.map((item) =>
      item.key === key ? { ...item, note: value } : item
    );
    setTableData(updatedData);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const fillSelectedRepair = () => {
    if (!massRepairName.trim()) {
      message.warning("Введите наименование объекта ремонта");
      return;
    }
    const setSel = new Set(selectedRowKeys);
    setTableData((prev) =>
      prev.map((r) =>
        setSel.has(r.key) ? { ...r, repairObjectName: massRepairName } : r
      )
    );
  };

  const fillAllRepair = () => {
    if (!massRepairName.trim()) {
      message.warning("Введите наименование объекта ремонта");
      return;
    }
    setTableData((prev) =>
      prev.map((r) => ({ ...r, repairObjectName: massRepairName }))
    );
  };

  const regions = async () => {
    try {
      const res = await apiRegions.getRegionsAll();
      setRegions(res);
    } catch (error) {
      console.error("Ошибка при получении регионов:", error);
    }
  };

  useEffect(() => {
    regions();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [dims, cats] = await Promise.all([
          apiDirectories.getDimensionsAll(),
          apiDirectories.getDimensionCategories(),
        ]);
        setDimensions(Array.isArray(dims) ? dims : []);
        setCatList(Array.isArray(cats) ? cats : []);
      } catch (e) {
        console.error("Не удалось получить справочники:", e);
        setDimensions([]);
        setCatList([]);
      }
    })();
  }, []);

  return (
    <>
      {load ? (
        <Spin spinning={load} fullscreen />
      ) : (
        <Layout
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 10px",
              background: "#001529",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button
                onClick={() => handleExportToExcel(tableData)}
                color="green"
                icon={<FileExcelOutlined />}
                style={{
                  backgroundColor: "#217346",
                  borderColor: "#217346",
                }}
              />
              <Button
                variant="solid"
                onClick={showModalForSave}
                disabled={!tableData.length || load}
              >
                Сохранить
              </Button>
            </div>
            <div>
              <span style={{ padding: "10px 10px", color: "#fff" }}>
                {user?.firstName} {user?.lastName}
              </span>
              <Button type="primary" onClick={showModal}>
                Выход
              </Button>
            </div>
          </Header>

          <Content style={{ flex: 1, padding: 10 }}>
            <Space direction="vertical" size="middle" style={{ display: "flex", margin: 5 }}>
              <span style={{ fontSize: 18, fontWeight: "bold" }}>
                Регионы доставки:&nbsp;
                {region
                  ? deliveryRegions.names.length
                    ? deliveryRegions.names.join(", ")
                    : "—"
                  : "Загрузка..."}
              </span>
            </Space>

            <Space direction="horizontal" size="middle" style={{ display: "flex", margin: 5, flexWrap: "wrap" }}>
              <Tag color={zapStatusColor}>
                Статус служебной записки: {zapStatusLabel}
              </Tag>
              <Tag>Позиций: {tableData?.length ?? 0}</Tag>
              <Tag>
                Регионы:{" "}
                {deliveryRegions.names.length
                  ? deliveryRegions.names.join(", ")
                  : "—"}
              </Tag>
            </Space>

            {/* Массовое заполнение "Объект ремонта" */}
            <Card
              size="small"
              style={{ marginBottom: 8, background: "#fff", borderRadius: 8 }}
              bodyStyle={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
            >
              <span style={{ fontSize: 12, color: "#667085" }}>
                Объект ремонта:
              </span>
              <Input
                style={{ width: 360, maxWidth: "100%" }}
                size="small"
                placeholder="Введите наименование…"
                value={massRepairName}
                onChange={(e) => setMassRepairName(e.target.value)}
                allowClear
              />

              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckSquareOutlined />}
                onClick={fillSelectedRepair}
                disabled={!selectedRowKeys.length}
              >
                Заполнить выбранные
              </Button>

              <Button
                size="small"
                type="primary"
                ghost
                icon={<SelectOutlined />}
                onClick={fillAllRepair}
                disabled={!tableData.length}
              >
                Заполнить все
              </Button>
            </Card>

            <Table
              rowSelection={rowSelection}
              className="custom-table"
              columns={columns}
              dataSource={tableData}
              scroll={{ x: "max-content", y: 520 }}
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
            />

            {/* Статистика по ЕИ */}
            <Divider style={{ marginTop: 12, marginBottom: 12 }} />
            <h4 style={{ marginTop: 0, marginBottom: 8 }}>
              Итоги по единицам измерения
            </h4>

            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div style={{ fontSize: 13, color: "#475467" }}>
                <b style={{ color: "#344054" }}>Как указано в данных:</b>&nbsp;
                {Object.keys(stats.raw).length ? (
                  Object.entries(stats.raw).map(([u, v]) => (
                    <Tag key={u} style={{ marginBottom: 6 }}>
                      {String(u).toUpperCase()}:{" "}
                      {Number(v).toLocaleString("ru-RU")}
                    </Tag>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>

              <div style={{ fontSize: 13, color: "#475467" }}>
                <b style={{ color: "#344054" }}>
                  По категориям (в базовых единицах):
                </b>
                &nbsp;
                {Object.keys(stats.normalized).length ? (
                  Object.entries(stats.normalized).map(
                    ([catKey, { total, unit }]) => (
                      <Tag key={catKey} color="blue" style={{ marginBottom: 6 }}>
                        {catName.get(catKey) || catKey}:{" "}
                        {Number(total).toLocaleString("ru-RU")}{" "}
                        {String(unit).toUpperCase()}
                      </Tag>
                    )
                  )
                ) : (
                  <span>—</span>
                )}
              </div>
            </Space>
          </Content>

          <Footer style={{ textAlign: "center" }}>
            Югорское УМТСиК © {year.getFullYear()}
          </Footer>

          <Modal
            open={isModalOpen}
            title="Выход"
            onCancel={handleCancel}
            footer={[
              <Button
                key="yes"
                className="btn-send"
                onClick={handleSaveAndExit}
                loading={load}
              >
                Да
              </Button>,
              <Button key="cancel" className="btn-save" onClick={handleCancel}>
                Отмена
              </Button>,
              <Button
                key="no"
                className="btn-exit"
                onClick={handleLocationMain}
              >
                Нет
              </Button>,
            ]}
            centered
          >
            <p>Сохранить изменения перед выходом?</p>
          </Modal>

          <Modal
            open={isModalOpenForSave}
            title="Сохранить?"
            onCancel={handleCancel}
            footer={[
              <Button
                key="yes"
                className="btn-send"
                onClick={handleCreateZapiska}
                loading={load}
              >
                Да
              </Button>,
              <Button key="no" onClick={handleCancel}>
                Нет
              </Button>,
            ]}
            centered
          />
        </Layout>
      )}
    </>
  );
};

export default CreateZapiskaFromImport;
