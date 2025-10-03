import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import handleExportToExcel from "../utils/export/UtilsExport";

import {
  Divider,
  Button,
  Input,
  Space,
  Table,
  Tabs,
  Spin,
  Card,
  ConfigProvider,
  App,
  Select,
  Tag,
  Tooltip,
  Modal,
  DatePicker,
} from "antd";

import {
  DownloadOutlined,
  SearchOutlined,
  FileExcelOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import * as XLSX from "xlsx"; // для реестрового экспорта
import { api } from "../utils/ApiImportVL06";
import TableZapiska from "../components/tableZapiska/tableZapiska";
import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as apiRegions } from "../utils/ApiDirectories";
import "../theme/Zapiski.css";
import {
  STATUS_FOR_MTR,
  STATUS_SHORT_FOR_MTR,
  statusColor,
  normalizeStatus,
  STATUS_FOR_ZAPISKA,
} from "../constants/status";
import StatusTag from "../components/status/StatusTag";

dayjs.locale("ru");
const { RangePicker } = DatePicker;

const Zapiska = () => {
  const { message } = App.useApp(); // контекстные API
  const [orders, setOrders] = useState([]);
  const [load, setLoad] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [exportingId, setExportingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState([10]); // [] = все статусы
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    showSizeChanger: true,
  });
  const [globalQuery, setGlobalQuery] = useState("");
  const [regions, setRegions] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==== новый фильтр периода по умолчанию: ПОСЛЕДНЯЯ НЕДЕЛЯ ====
  const [range, setRange] = useState([
    dayjs().subtract(7, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const regionsMap = useMemo(() => {
    const m = new Map();
    (regions || []).forEach((r) => m.set(r.id, r.nameRegion));
    return m;
  }, [regions]);

  const regionNamesFor = (rec) => {
    const ids = Array.isArray(rec?.region) ? rec.region : [];
    const names = ids.map((id) => regionsMap.get(id)).filter(Boolean);
    return [...new Set(names)];
  };

  const statusOptions = useMemo(
    () =>
      Object.entries(STATUS_FOR_MTR).map(([value, full]) => {
        const code = Number(value);
        const short = STATUS_SHORT_FOR_MTR?.[code] || full;
        return {
          value: code,
          label: (
            <Tooltip title={full}>
              <Tag
                color={statusColor(code)}
                style={{ marginInline: 0, height: 22, lineHeight: "22px" }}
              >
                {short}
              </Tag>
            </Tooltip>
          ),
        };
      }),
    []
  );

  const fullName = (u) => {
    if (!u) return "—";
    const { surname, firstName, lastName, username, email, id } = u;
    const fio = [surname, firstName, lastName].filter(Boolean).join(" ");
    return fio || username || email || `ID ${id}`;
  };

  const getColumnSearchProps = () => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder="Поиск..."
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            loading={load}
            disabled={load}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Найти
          </Button>
          <Button
            onClick={() => {
              clearFilters();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            Сброс
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      const u = record.user;
      if (!u) return false;
      const name = fullName(u).toLowerCase();
      const email = (u.email || "").toLowerCase();
      const val = String(value || "").toLowerCase();
      return name.includes(val) || email.includes(val);
    },
  });

  const shortFio = (u) => {
    if (!u) return "—";
    const { surname, firstName, lastName, username, email, id } = u;
    const fi = [
      surname,
      firstName && firstName[0] && firstName[0] + ".",
      lastName && lastName[0] && lastName[0] + ".",
    ]
      .filter(Boolean)
      .join(" ");
    return fi || username || email || `ID ${id}`;
  };

  const formatDateShort = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalize = (v) => String(v ?? "").toLowerCase();

  const filteredOrders = useMemo(() => {
    const q = normalize(globalQuery);
    if (!q) return orders;

    return orders.filter((r) => {
      const id = normalize(r.id);
      const created = normalize(formatDateTime(r.createdAt));
      const updated = normalize(formatDateTime(r.updatedAt));
      const mtr = normalize(r.mtrCount);
      const u = r.user || {};
      const name = normalize(fullName(u));
      const email = normalize(u.email);
      const direction = normalize(regionNamesFor(r).join(", "));
      return [id, name, email, created, updated, mtr, direction]
        .join(" ")
        .includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, globalQuery, regionsMap]);

  const columns = [
    {
      title: "№",
      key: "rowNumber",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Служебная записка",
      key: "numDate",
      width: 240,
      render: (_, r) => (
        <NavLink
          to={`/editZapiskaFromImport/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          title={`Открыть служебную записку № ${r.id}`}
          className="z-link"
          style={{ textDecoration: "underline" }}
        >
          № {r.id} от {formatDateShort(r.createdAt)}
        </NavLink>
      ),
      sorter: (a, b) => {
        const byDate =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return byDate !== 0 ? byDate : a.id - b.id;
      },
      defaultSortOrder: "descend",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      filters: Object.entries(STATUS_FOR_ZAPISKA).map(([code, label]) => ({
        text: label,
        value: Number(code),
      })),
      onFilter: (val, record) => normalizeStatus(record.status) === Number(val),
      sorter: (a, b) => normalizeStatus(a.status) - normalizeStatus(b.status),
      render: (v) => {
        const s = normalizeStatus(v);
        return <Tag color={statusColor(s)}>{STATUS_FOR_ZAPISKA[s] ?? s}</Tag>;
      },
    },
    {
      title: "Автор",
      dataIndex: "user",
      key: "user",
      width: 280,
      ellipsis: true,
      ...getColumnSearchProps(),
      render: (_, record) => {
        const u = record.user;
        if (!u) return "—";
        const name = shortFio(u);
        return (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {u.email ? (
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
                {u.email}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "МТР",
      dataIndex: "mtrCount",
      key: "mtrCount",
      width: 90,
      align: "center",
      render: (v) => <span className="pill">{v ?? 0}</span>,
      sorter: (a, b) => (a.mtrCount || 0) - (b.mtrCount || 0),
    },
    {
      title: "Направление",
      key: "direction",
      width: 260,
      render: (_, record) => {
        const names = regionNamesFor(record);
        if (!names.length) return "—";
        return (
          <Space size={4} wrap>
            {names.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        );
      },
      sorter: (a, b) =>
        regionNamesFor(a)
          .join(", ")
          .localeCompare(regionNamesFor(b).join(", ")),
    },
    {
      title: "Обновлена",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      render: (v) => formatDateShort(v),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      responsive: ["lg"],
    },
    {
      title: "",
      key: "action",
      fixed: "right",
      width: 260,
      render: (_, record) => (
        <Space size={6} wrap className="actions-cell">
          <Button
            size="small"
            icon={<FileExcelOutlined />}
            className="btn-excel"
            loading={exportingId === record}
            onClick={() => handleExportZapiska(record)}
          >
            Excel
          </Button>

          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            className="btn-delete"
            onClick={() => handleDelete(record)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const mapMtrToRows = (mtrList = []) =>
    mtrList?.map((row) => ({
      key: row.id,
      nameMTR: row.vl06.nameMTR,
      address: row.vl06.address,
      supply: row.vl06.supply,
      factory: row.vl06.factory,
      storage: row.vl06.storage,
      vacationOfTheMaterial: row.vl06.vacationOfTheMaterial,
      material: row.vl06.material,
      party: row.vl06.party,
      basic: row.vl06.basic,
      supplyVolume: row.vl06.supplyVolume,
      created: row.vl06.created,
      express: row.express || "",
      note: row.note || "",
      repairObjectName:
        row.repairObjectName ?? row.objectName ?? row.repairObject ?? "",
    }));

  // экспорт МТР по конкретной записке
  const handleExportZapiska = async (zapiskaId) => {
    try {
      setExportingId(zapiskaId.id);
      const mtrList = await apiMtrList.getMtrListForId(zapiskaId.id);
      const rows = mapMtrToRows(mtrList);
      await handleExportToExcel(rows);
      message.success(`Экспортировано: записка № ${zapiskaId.id}`);
    } catch (e) {
      console.error(e);
      message.error("Не удалось выгрузить в Excel");
    } finally {
      setExportingId(null);
    }
  };

  // импорт из VL06 (без изменений)
  const handleLoadData = async () => {
    setLoad(true);
    try {
      const data = await api.getMTRFromImportVL06ForZapiski({
        statuses: statusFilter.length ? statusFilter : undefined,
      });
      const raw = Array.isArray(data?.data) ? data.data : [];

      const filtered = statusFilter.length
        ? raw.filter((it) => statusFilter.includes(normalizeStatus(it.status)))
        : raw;
      const transformedData = filtered?.map((item, i) => ({
        id: item.id,
        key: item.id ?? i,
        supply: item.supply,
        factory: item.factory,
        storage: item.storage,
        vacationOfTheMaterial: item.vacationOfTheMaterial,
        material: item.material,
        party: item.party,
        nameMTR: item.nameMTR,
        basic: item.basic,
        supplyVolume: item.supplyVolume,
        address: item.address,
        created: item.created,
        status: normalizeStatus(item.status),
      }));
      setTableData(transformedData);
    } catch (error) {
      console.error("Ошибка при импорте данных:", error);
    } finally {
      setLoad(false);
    }
  };

  // удаление
  const handleDelete = (record) => {
    setDeleteRecord(record);
    setDeleteOpen(true);
  };

  // === Загрузка реестра с сервера с учётом диапазона дат ===
  const apiGetZapiski = async (fromIso, toIso) => {
    setLoad(true);
    try {
      const { data } = await ApiZapiski.getAllZapiski(
        fromIso && toIso ? { from: fromIso, to: toIso } : undefined
      );
      setOrders(data);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoad(false);
    }
  };

  // Показать за выбранный период
  const loadByRange = () => {
    if (!range || !range[0] || !range[1]) {
      message.warning("Укажите период");
      return;
    }
    const fromIso = range[0].startOf("day").toISOString();
    const toIso = range[1].endOf("day").toISOString();
    apiGetZapiski(fromIso, toIso);
  };

  // Выгрузить реестр за период (Excel)
  const exportRegistryForPeriod = () => {
    if (!orders?.length) {
      message.info("Нет данных для выгрузки за выбранный период");
      return;
    }
    const rows = orders.map((r) => ({
      "№": r.id,
      "Создана": formatDateTime(r.createdAt),
      "Статус": STATUS_FOR_ZAPISKA[normalizeStatus(r.status)] ?? r.status,
      "Автор": r.user ? fullName(r.user) : "—",
      "МТР (шт.)": r.mtrCount ?? 0,
      "Направление": regionNamesFor(r).join(", "),
      "Обновлена": formatDateTime(r.updatedAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Записки");
    const name = `Записки_${dayjs(range[0]).format("YYYY-MM-DD")}__${dayjs(
      range[1]
    ).format("YYYY-MM-DD")}.xlsx`;
    XLSX.writeFile(wb, name);
  };

  // грузим справочник регионов
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRegions.getRegionsAll();
        setRegions(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Ошибка при получении регионов:", e);
        setRegions([]);
      }
    })();
  }, []);

  // ПЕРВОЕ ОТКРЫТИЕ: сразу показываем ЗА ПОСЛЕДНЮЮ НЕДЕЛЮ
  useEffect(() => {
    loadByRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 8, fontSize: 12 },
        components: {
          Table: {
            cellPaddingBlockSM: 6,
            cellPaddingInlineSM: 8,
            headerBg: "#fafafa",
            headerSplitColor: "#f0f0f0",
            rowHoverBg: "#f5faff",
          },
          Input: { controlHeight: 32 },
        },
      }}
    >
      <Divider orientation="left">Служебные записки</Divider>

      {/* Панель периода и выгрузки */}
      <Card style={{ marginBottom: 12 }}>
        <Space size="small" wrap align="center">
          <span style={{ color: "#667085" }}>Период:</span>
          <RangePicker
            allowClear={false}
            value={range}
            onChange={(val) => setRange(val)}
            format="DD.MM.YYYY"
          />
          <Button
            icon={<SearchOutlined />}
            type="primary"
            onClick={loadByRange}
            loading={load}
          >
            Показать
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportRegistryForPeriod}
            disabled={!orders?.length}
          >
            Выгрузить за период
          </Button>
          <span style={{ color: "#98A2B3", fontSize: 12 }}>
            По умолчанию отображается последняя неделя.
          </span>
        </Space>
      </Card>

      <Tabs
        defaultActiveKey="1"
        type="card"
        items={[
          {
            key: "1",
            label: "Реестр",
            children: (
              <div className="zapiski-page">
                <Card className="zapiski-card" bordered>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    <Input
                      allowClear
                      size="middle"
                      prefix={<SearchOutlined />}
                      placeholder="Поиск…"
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                    />
                    <Table
                      className="zapiski-table z-compact"
                      columns={columns}
                      dataSource={filteredOrders}
                      rowKey="id"
                      size="small"
                      bordered={false}
                      loading={load}
                      tableLayout="fixed"
                      sticky
                      pagination={{
                        ...pagination,
                        showTotal: (total) =>
                          globalQuery
                            ? `Найдено: ${total} (из ${orders.length})`
                            : `Всего: ${total}`,
                        locale: { items_per_page: "на странице" },
                        size: "small",
                      }}
                      onChange={(pag) => {
                        setPagination((p) => ({
                          ...p,
                          current: pag.current || 1,
                          pageSize: pag.pageSize || p.pageSize,
                        }));
                      }}
                      scroll={{ x: "max-content" }}
                      rowClassName={() => "zapiski-row"}
                      footer={() => {
                        const counters = new Map();
                        (filteredOrders || []).forEach((z) => {
                          const s = normalizeStatus(z.status);
                          counters.set(s, (counters.get(s) || 0) + 1);
                        });
                        return (
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              padding: "4px 8px",
                            }}
                          >
                            {Object.keys(STATUS_FOR_ZAPISKA).map((code) => {
                              const c = Number(code);
                              const count = counters.get(c) || 0;
                              return (
                                <span
                                  key={code}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <StatusTag code={c} type="zapiska" />
                                  <Tag style={{ padding: "0 8px" }}>
                                    {count}
                                  </Tag>
                                </span>
                              );
                            })}
                            <Tag style={{ padding: "0 8px" }}>
                              Всего: {filteredOrders.length}
                            </Tag>
                          </div>
                        );
                      }}
                    />
                  </Space>
                </Card>
              </div>
            ),
          },
          {
            key: "2",
            label: "Создать",
            children: (
              <>
                <Space
                  direction="horizontal"
                  size="small"
                  style={{ display: "flex" }}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    maxTagCount="responsive"
                    placeholder="Статусы (все)"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ minWidth: 260 }}
                    options={statusOptions}
                  />
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={handleLoadData}
                  >
                    Загрузить...
                  </Button>
                </Space>

                {load ? (
                  <Spin spinning={load} fullscreen />
                ) : tableData && tableData.length > 0 ? (
                  <TableZapiska initialData={tableData} />
                ) : (
                  <p>
                    Данные отсутствуют. Нажмите кнопку «Загрузить» — будут
                    подгружены записи, ранее импортированные из формы VL-06 (уже
                    использованные МТР исключаются).
                  </p>
                )}
              </>
            ),
          },
        ]}
      />
      <Modal
        open={deleteOpen}
        title="Удалить служебную записку?"
        onCancel={() => setDeleteOpen(false)}
        footer={[
          <Button
            key="yes"
            className="btn-send"
            loading={deleting}
            onClick={async () => {
              if (!deleteRecord) return;
              try {
                setDeleting(true);
                const res = await ApiZapiski.deleteZapiska(deleteRecord.id);
                if (res?.success === false) {
                  throw new Error(res?.message || "Не удалось удалить");
                }
                setOrders((prev) =>
                  prev.filter((x) => x.id !== deleteRecord.id)
                );
                message.success(`Записка № ${deleteRecord.id} удалена`);
                setDeleteOpen(false);
                setDeleteRecord(null);
              } catch (e) {
                console.error(e);
                message.error("Ошибка при удалении. Попробуйте позже.");
              } finally {
                setDeleting(false);
              }
            }}
          >
            Да
          </Button>,
          <Button
            key="cancel"
            className="btn-save"
            onClick={() => setDeleteOpen(false)}
          >
            Отмена
          </Button>,
          <Button key="no" danger onClick={() => setDeleteOpen(false)}>
            Нет
          </Button>,
        ]}
        centered
      >
        Действие необратимо. Записка № <b>{deleteRecord?.id}</b> будет удалена.
      </Modal>
    </ConfigProvider>
  );
};

export default Zapiska;
