// ReportsApp3Summary.jsx
import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  Select,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// API
import { api as apiApplications } from "../utils/ApiApplications";
import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as apiRegions } from "../utils/ApiDirectories";
import exportApp3SummaryExcel from "../utils/export/exportApp3SummaryExcel";

// recharts (алиасим Tooltip, чтобы не конфликтовал с antd)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s !== "" && s !== "0" && s !== "false" && s !== "нет" && s !== "no";
  }
  return false;
};
const parseQty = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmtDate = (iso) => (iso ? dayjs(iso).format("DD.MM.YYYY") : "");
const fmtDateTime = (iso) =>
  iso ? dayjs(iso).format("DD.MM.YYYY HH:mm") : "—";
const labelTransport = (type) =>
  type === "container" ? "Конт." : type === "auto" ? "Авто" : "";

const STATUS_LABEL = {
  40: "Формирование (40)",
  50: "Отправлено (50)",
  60: "Частично (60)",
  100: "Завершено (100)",
};

// пресеты для диапазонов
const presets = [
  {
    label: "Последние 7 дней",
    value: [dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Последние 30 дней",
    value: [dayjs().subtract(30, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "Этот месяц",
    value: [dayjs().startOf("month"), dayjs().endOf("month")],
  },
];

export default function ReportsApp3Summary() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  // данные
  const [rows, setRows] = useState([]);

  // загрузочный период (ограничивает, по каким приложениям грузим строки)
  const [fetchRange, setFetchRange] = useState([
    dayjs().subtract(7, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);

  // текстовый поиск и «основные» фильтры
  const [query, setQuery] = useState("");
  const [appStatus, setAppStatus] = useState("all");
  const [directions, setDirections] = useState([]); // значения
  const [urgentFilter, setUrgentFilter] = useState("all"); // all|yes|no
  const [transportType, setTransportType] = useState("all"); // all|container|auto|none
  const [shippedFilter, setShippedFilter] = useState("all"); // all|gt0|eq0

  // локальные «датовые» фильтры (по уже загруженным строкам)
  const [reqDateRange, setReqDateRange] = useState(null); // dateRequest
  const [shipDateRange, setShipDateRange] = useState(null); // dateShipment

  // справочник направлений (storage code -> name)
  const [regionMap, setRegionMap] = useState({});

  // --- загрузка данных ---
  const load = async () => {
    try {
      setLoading(true);

      // 0) справочник направлений (по складу)
      const regs = (await apiRegions.getRegionsAll().catch(() => [])) || [];
      const map = {};
      regs.forEach((r) => {
        (Array.isArray(r.codeRegion) ? r.codeRegion : []).forEach((code) => {
          if (code == null) return;
          const key = String(code).trim().toUpperCase();
          map[key] = r.nameRegion;
        });
      });
      setRegionMap(map);

      // 1) список приложений (связаны с СЗ)
      const apps = await apiApplications.getApplications(); // findAllDetailed
      // сузим по периоду (дата создания приложения)
      const [from, to] = fetchRange || [];
      const fromTs = from ? from.startOf("day").valueOf() : null;
      const toTs = to ? to.endOf("day").valueOf() : null;

      const candidates = [];
      const appIndex = new Map();
      apps.forEach((x) => {
        const aId = x?.application?.id ?? x?.id;
        const zId = x?.zapiska?.id ?? x?.zapiskaId;
        const appCreatedAt = x?.application?.createdAt ?? x?.createdAt;
        const appStatus = x?.application?.status ?? x?.status;
        const zapCreatedAt = x?.zapiska?.createdAt;
        const zapStatus = x?.zapiska?.status;

        if (!aId || !zId) return;

        // фильтр по диапазону загрузки
        const ts = appCreatedAt ? dayjs(appCreatedAt).valueOf() : null;
        if (fromTs && ts && ts < fromTs) return;
        if (toTs && ts && ts > toTs) return;

        candidates.push({
          appId: aId,
          zapiskaId: zId,
          appCreatedAt,
          appStatus,
          zapCreatedAt,
          zapStatus,
        });
        appIndex.set(zId, { appId: aId, appCreatedAt, appStatus });
      });

      // 2) для отобранных приложений — получить строки Прил.3
      const all = [];
      for (const rec of candidates) {
        const zId = rec.zapiskaId;
        const appInfo = appIndex.get(zId) || {};
        const res = await apiApplications.getAppendix3ByZapiska(zId);
        const savedRows = res?.data?.rows || [];
        const appId = res?.data?.application?.id ?? appInfo.appId;
        const appCreatedAt =
          res?.data?.application?.createdAt ?? appInfo.appCreatedAt;
        const appStatus = res?.data?.application?.status ?? appInfo.appStatus;

        // СЗ — для «шапки»
        let zap = null;
        try {
          const zr = await ApiZapiski.getIdZapiski(zId);
          zap = zr?.data || zr;
        } catch {}

        savedRows.forEach((r, idx) => {
          const v = r?.mtrList?.vl06 || {};
          const urgent = toBool(r?.mtrList?.express);
          const supplyVol = parseQty(v?.supplyVolume);
          const storageKey = String(v?.storage ?? "")
            .trim()
            .toUpperCase();
          const directionName = storageKey ? map[storageKey] || "" : "";

          all.push({
            key: `${zId}-${appId}-${r.id}-${idx}`,
            zapiskaId: zId,
            appId,
            appCreatedAt,
            appStatus,
            zapCreatedAt: zap?.createdAt ?? rec.zapCreatedAt,
            zapStatus: zap?.status ?? rec.zapStatus,
            direction: directionName,

            urgent,
            nameMTR: v.nameMTR,
            address: v.address,
            supply: v.supply,
            factory: v.factory,
            storage: v.storage,
            vacationOfTheMaterial: v.vacationOfTheMaterial,
            material: v.material,
            party: v.party,
            basic: v.basic,
            supplyVolume: supplyVol,
            createdBy: v.created,

            dateRequest: r?.dateRequest || null,
            transportRequest: r?.transport || null,
            dateShipment: r?.dateShipment || null,
            format: r?.format || null, // 'container' | 'auto'
            transportNumber: r?.transportNumber || "",
            transit: r?.transit || "",
            dateM11: r?.dateM11 || null,
            numberM11: r?.numberM11 || "",
            shippedQty:
              r?.discarded != null
                ? Number(
                    String(r.discarded).replace(/\s/g, "").replace(",", ".")
                  )
                : null,
            addNote: r?.addNote || "",
          });
        });
      }

      setRows(all);
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить сводный отчёт по Приложениям №3");
    } finally {
      setLoading(false);
    }
  };

  // экспорт
  const exportExcel = async () => {
    if (!filtered.length) {
      message.info("Нет данных для экспорта.");
      return;
    }
    await exportApp3SummaryExcel(filtered);
    message.success("Экспорт выполнен.");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // начальная загрузка за 7 дней

  // --- опции направлений (из уже загруженных строк) ---
  const directionOptions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => r.direction && s.add(r.direction));
    return Array.from(s)
      .sort()
      .map((d) => ({ label: d, value: d }));
  }, [rows]);

  // --- цепочка фильтров ---
  const searchLower = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let base = rows;

    // статус приложения
    if (appStatus !== "all") {
      const code = Number(appStatus);
      if (Number.isFinite(code))
        base = base.filter((r) => Number(r.appStatus) === code);
    }

    // направления (мультиселект)
    if (directions.length) {
      const set = new Set(directions);
      base = base.filter((r) => set.has(r.direction || ""));
    }

    // срочность
    if (urgentFilter !== "all") {
      base = base.filter((r) =>
        urgentFilter === "yes" ? !!r.urgent : !r.urgent
      );
    }

    // тип транспорта
    if (transportType !== "all") {
      base = base.filter((r) => {
        const t = r.format || r.transportRequest || null;
        if (!t) return transportType === "none";
        return t === transportType;
      });
    }

    // shipped
    if (shippedFilter !== "all") {
      base = base.filter((r) => {
        const v = typeof r.shippedQty === "number" ? r.shippedQty : 0;
        return shippedFilter === "gt0" ? v > 0 : v === 0;
      });
    }

    // локальные датовые фильтры
    const inRange = (d, range) => {
      if (!range || !Array.isArray(range) || range.length !== 2) return true;
      if (!d) return false;
      const ts = dayjs(d).valueOf();
      const from = range[0]?.startOf("day").valueOf();
      const to = range[1]?.endOf("day").valueOf();
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      return true;
    };

    if (reqDateRange) {
      base = base.filter((r) => inRange(r.dateRequest, reqDateRange));
    }
    if (shipDateRange) {
      base = base.filter((r) => inRange(r.dateShipment, shipDateRange));
    }

    // текстовый поиск
    if (searchLower) {
      base = base.filter((rec) => {
        const hay = [
          rec.zapiskaId,
          rec.appId,
          rec.direction,
          rec.urgent ? "срочно" : "",
          rec.nameMTR,
          rec.address,
          rec.supply,
          rec.factory,
          rec.storage,
          fmtDate(rec.vacationOfTheMaterial),
          rec.material,
          rec.party,
          rec.basic,
          String(rec.supplyVolume),
          rec.createdBy,
          fmtDate(rec.dateRequest),
          rec.format,
          rec.transportNumber,
          fmtDate(rec.dateShipment),
          rec.transit,
          fmtDate(rec.dateM11),
          rec.numberM11,
          rec.shippedQty != null ? String(rec.shippedQty) : "",
          rec.addNote,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(searchLower);
      });
    }

    return base;
  }, [
    rows,
    appStatus,
    directions,
    urgentFilter,
    transportType,
    shippedFilter,
    reqDateRange,
    shipDateRange,
    searchLower,
  ]);

  // --- графики (по отфильтрованным данным) ---
  const shippedByDirection = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.direction || "—";
      const shipped = typeof r.shippedQty === "number" ? r.shippedQty : 0;
      map.set(key, (map.get(key) || 0) + shipped);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const countByDirection = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = r.direction || "—";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const statusDistribution = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const s = Number(r.appStatus);
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, value]) => ({
      name: STATUS_LABEL[status] || String(status),
      value,
    }));
  }, [filtered]);

  const pieColors = ["#1677FF", "#52C41A", "#FAAD14", "#EB2F96", "#722ED1"];

  const CHART = {
    barPrimary: "#1677FF", // синий (antd primary)
    barSecondary: "#13C2C2", // циан
    axis: "#8c8c8c",
    grid: "#eaeaea",
  };

  // --- сброс локальных фильтров ---
  const resetFilters = () => {
    setQuery("");
    setAppStatus("all");
    setDirections([]);
    setUrgentFilter("all");
    setTransportType("all");
    setShippedFilter("all");
    setReqDateRange(null);
    setShipDateRange(null);
  };

  // --- перезагрузка по новому периоду ---
  const reloadByPeriod = () => load();

  // --- колонки таблицы ---
  const columns = [
    {
      title: "Прил.№3",
      width: 98,
      fixed: "left",
      render: (_, r) => (
        <div>
          <div>
            <strong>#{r.appId}</strong>
          </div>
          <div style={{ color: "rgba(0,0,0,.45)" }}>
            {fmtDateTime(r.appCreatedAt)}
          </div>
        </div>
      ),
    },
    { title: "СЗ №", dataIndex: "zapiskaId", width: 90, fixed: "left" },
    {
      title: "Направление",
      dataIndex: "direction",
      width: 160,
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Срочный",
      dataIndex: "urgent",
      width: 90,
      align: "center",
      sorter: (a, b) => Number(b.urgent) - Number(a.urgent),
      render: (v) => (v ? <Tag color="red">Срочно</Tag> : <Tag>—</Tag>),
      filters: [
        { text: "Срочно", value: "yes" },
        { text: "Не срочно", value: "no" },
      ],
      onFilter: (v, rec) => (v === "yes" ? !!rec.urgent : !rec.urgent),
    },
    { title: "Название", dataIndex: "nameMTR", width: 260, ellipsis: true },
    {
      title: "Имя получателя материала",
      dataIndex: "address",
      width: 240,
      ellipsis: true,
    },
    { title: "Поставка", dataIndex: "supply", width: 120, align: "center" },
    { title: "Завод", dataIndex: "factory", width: 90, align: "center" },
    { title: "Склад", dataIndex: "storage", width: 90, align: "center" },
    {
      title: "Д/Отпуска материала",
      dataIndex: "vacationOfTheMaterial",
      width: 140,
      align: "center",
      render: (v) => (v ? new Date(v).toLocaleDateString("ru-RU") : "—"),
    },
    { title: "Материал", dataIndex: "material", width: 140 },
    { title: "Партия", dataIndex: "party", width: 130 },
    { title: "Базовая ЕИ", dataIndex: "basic", width: 110, align: "center" },
    {
      title: "Объем поставки",
      dataIndex: "supplyVolume",
      width: 130,
      align: "right",
      render: (v) => (Number.isFinite(v) && v !== 0 ? v : "—"),
      sorter: (a, b) => (a.supplyVolume || 0) - (b.supplyVolume || 0),
    },
    {
      title: "Заявка (дата)",
      dataIndex: "dateRequest",
      width: 140,
      align: "center",
      render: (v) => fmtDate(v),
    },
    {
      title: "Груз сформирован (тип + №)",
      width: 260,
      render: (_, r) => {
        const t = labelTransport(r.format || r.transportRequest);
        return t || r.transportNumber
          ? `${t}${t ? " " : ""}${r.transportNumber || ""}`
          : "—";
      },
    },
    {
      title: "Отгрузка (дата)",
      dataIndex: "dateShipment",
      width: 140,
      align: "center",
      render: (v) => fmtDate(v),
    },
    { title: "Получатель", dataIndex: "transit", width: 220 },
    {
      title: "М11 дата",
      dataIndex: "dateM11",
      width: 130,
      align: "center",
      render: (v) => fmtDate(v),
    },
    { title: "М11 №", dataIndex: "numberM11", width: 120 },
    {
      title: "Отгружено (кол-во)",
      dataIndex: "shippedQty",
      width: 150,
      align: "right",
      render: (v) => (typeof v === "number" ? v : "—"),
      sorter: (a, b) =>
        (a.shippedQty ?? -Infinity) - (b.shippedQty ?? -Infinity),
    },
    { title: "Примечание", dataIndex: "addNote", width: 280, ellipsis: true },
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontSize: 12 } }}>
      <div style={{ padding: 16, background: "#f5f7fa", minHeight: "100%" }}>
        <Card
          bordered={false}
          style={{ boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}
        >
          {/* Шапка с периодом загрузки (бьёт по БД), обновлением и экспортом */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Отчёт · Сводная по Приложениям № 3
            </Title>

            <Space wrap>
              <Text type="secondary">Период загрузки:</Text>
              <RangePicker
                allowEmpty={[false, false]}
                value={fetchRange}
                onChange={setFetchRange}
                presets={presets}
                format="DD.MM.YYYY"
              />
              <Tooltip title="Загрузить за выбранный период (строки тянем только для попавших приложений)">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={reloadByPeriod}
                  loading={loading}
                >
                  Обновить
                </Button>
              </Tooltip>
              <Button icon={<DownloadOutlined />} onClick={exportExcel}>
                Экспорт (Excel)
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* Панель фильтров (локальные, по уже загруженным строкам) */}
          <Card
            size="small"
            type="inner"
            title={
              <Space>
                <FilterOutlined />
                <span>Фильтры</span>
              </Space>
            }
            style={{ marginBottom: 12 }}
            bodyStyle={{ paddingBottom: 8 }}
          >
            <Row gutter={[12, 8]} align="middle">
              <Col xs={24} md={8} lg={6} xl={6}>
                <Input
                  allowClear
                  placeholder="Поиск по всем полям…"
                  prefix={<SearchOutlined />}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </Col>

              <Col xs={24} md={8} lg={6} xl={5}>
                <Select
                  value={appStatus}
                  onChange={setAppStatus}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "Статус Прил.3: все" },
                    { value: "40", label: "Формирование (40)" },
                    { value: "50", label: "Отправлено (50)" },
                    { value: "60", label: "Частично (60)" },
                    { value: "100", label: "Завершено (100)" },
                  ]}
                />
              </Col>

              <Col xs={24} md={8} lg={6} xl={6}>
                <Select
                  mode="multiple"
                  allowClear
                  value={directions}
                  onChange={setDirections}
                  placeholder="Направления"
                  style={{ width: "100%" }}
                  options={directionOptions}
                  maxTagCount="responsive"
                />
              </Col>

              <Col xs={24} md={8} lg={6} xl={4}>
                <Select
                  value={urgentFilter}
                  onChange={setUrgentFilter}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "Срочность: все" },
                    { value: "yes", label: "Только срочные" },
                    { value: "no", label: "Только не срочные" },
                  ]}
                />
              </Col>

              <Col xs={24} md={8} lg={6} xl={4}>
                <Select
                  value={transportType}
                  onChange={setTransportType}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "Тип транспорта: все" },
                    { value: "container", label: "Контейнер" },
                    { value: "auto", label: "Авто" },
                    { value: "none", label: "Не задан" },
                  ]}
                />
              </Col>

              <Col xs={24} md={8} lg={6} xl={4}>
                <Select
                  value={shippedFilter}
                  onChange={setShippedFilter}
                  style={{ width: "100%" }}
                  options={[
                    { value: "all", label: "Отгрузка: все" },
                    { value: "gt0", label: "Отгружено > 0" },
                    { value: "eq0", label: "Не отгружено" },
                  ]}
                />
              </Col>

              <Col xs={24} md={12} lg={8} xl={6}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary">Дата заявки</Text>
                  <RangePicker
                    allowEmpty={[true, true]}
                    value={reqDateRange}
                    onChange={setReqDateRange}
                    presets={presets}
                    format="DD.MM.YYYY"
                    style={{ width: "100%" }}
                  />
                </Space>
              </Col>

              <Col xs={24} md={12} lg={8} xl={6}>
                <Space direction="vertical" size={4} style={{ width: "100%" }}>
                  <Text type="secondary">Дата отгрузки</Text>
                  <RangePicker
                    allowEmpty={[true, true]}
                    value={shipDateRange}
                    onChange={setShipDateRange}
                    presets={presets}
                    format="DD.MM.YYYY"
                    style={{ width: "100%" }}
                  />
                </Space>
              </Col>

              <Col xs={24} md={8} lg={6} xl={4}>
                <Button icon={<ClearOutlined />} onClick={resetFilters} block>
                  Сброс фильтров
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Таблица — СВЕРХУ */}
          <Table
            size="small"
            rowKey="key"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: "max-content", y: 520 }}
          />

          <div
            style={{
              textAlign: "right",
              color: "rgba(0,0,0,.45)",
              marginTop: 8,
            }}
          >
            Всего строк: {filtered.length}
          </div>

          {/* Графики — СНИЗУ, компактные */}
          <div style={{ marginTop: 16 }}>
            <Title level={5} style={{ marginBottom: 8 }}>
              Аналитика по выборке
            </Title>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} lg={8}>
                <Card
                  size="small"
                  title="Отгружено по направлению (сумма)"
                  bodyStyle={{ padding: 8 }}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={shippedByDirection}>
                      <CartesianGrid
                        stroke={CHART.grid}
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" hide tick={{ fill: CHART.axis }} />
                      <YAxis tick={{ fill: CHART.axis }} />
                      <RTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Отгружено"
                        fill={CHART.barPrimary}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Card
                  size="small"
                  title="Кол-во позиций по направлению"
                  bodyStyle={{ padding: 8 }}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={countByDirection}>
                      <CartesianGrid
                        stroke={CHART.grid}
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" hide tick={{ fill: CHART.axis }} />
                      <YAxis tick={{ fill: CHART.axis }} />
                      <RTooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Позиции"
                        fill={CHART.barSecondary}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} md={12} lg={8}>
                <Card
                  size="small"
                  title="Распределение статусов Прил.3"
                  bodyStyle={{ padding: 8 }}
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <RTooltip />
                      <Legend />
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        {statusDistribution.map((_, i) => (
                          <Cell
                            key={i}
                            fill={pieColors[i % pieColors.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}
