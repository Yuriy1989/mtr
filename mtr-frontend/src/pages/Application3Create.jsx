// C:\Server\data\htdocs\umtsik\mtr\src\pages\Application3Create.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  App,
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Table,
  Tag,
  Typography,
  Segmented,
  Space,
  Tooltip,
  Select,
  Switch,
  Drawer,
  Descriptions,
  Empty,
} from "antd";
import {
  SaveOutlined,
  RollbackOutlined,
  SearchOutlined,
  DownloadOutlined,
  SendOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as apiRegions } from "../utils/ApiDirectories";
import { api as apiDirectories } from "../utils/ApiDirectories";
import { api as apiApplications } from "../utils/ApiApplications";
import "../theme/Application3Create.css";
import exportApp3Excel from "../utils/export/exportApp3Excel";

const { Title, Text } = Typography;

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
const isoOrNull = (d) => (d ? d.toISOString() : null);
const fmtNum = (n) =>
  Number.isFinite(n) ? Number(n).toLocaleString("ru-RU") : "—";
const fmtDateOnly = (v) =>
  v ? (dayjs(v).isValid() ? dayjs(v).format("DD.MM.YYYY") : String(v)) : "—";

const mapMtrToRows = (mtrList = []) =>
  (mtrList || []).map((row, idx) => {
    const v = row?.vl06 || row?.linkMtrList?.[0]?.vl06 || {};
    return {
      key: row.id ?? idx,
      vl06Id: v.id ?? null,
      vl06Status: v.status ?? null,

      nameMTR: v.nameMTR,
      address: v.address,
      supply: v.supply,
      factory: v.factory,
      storage: v.storage,
      vacationOfTheMaterial: v.vacationOfTheMaterial,
      material: v.material,
      party: v.party,
      basic: v.basic,
      supplyVolume: v.supplyVolume,
      created: v.created,
      urgent: toBool(row?.express),

      repairObjectName: row?.repairObjectName ?? null,
      note: row?.note ?? null,
    };
  });

const getRegionNameByStorage = (storageCode, regionsArr) => {
  if (!regionsArr || !Array.isArray(regionsArr)) return null;
  const found = regionsArr.find(
    (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(storageCode)
  );
  return found?.nameRegion || null;
};

const defaultsPerRow = {
  shipmentRequestDate: null,
  transportRequest: null, // "container" | "auto" | null
  transportNumber: "",
  shipmentDate: null,
  recipientName: "",
  m11Date: null,
  m11Number: "",
  shippedQty: null, // "эта волна" (пока не отправили)
  note: "",
};

const normalize = (v) => String(v ?? "").toLowerCase();

export default function Application3Create() {
  const { linkId: linkIdParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedZapiska = location.state?.zapiska || null;
  const stateLinkId = location.state?.linkId;
  const openLeftoversOnly = !!location.state?.leftoversOnly;
  const { message } = App.useApp();

  const normalizeId = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const linkIdFromUrl = normalizeId(linkIdParam);
  const linkIdFromState = normalizeId(stateLinkId);
  const linkId = linkIdFromUrl ?? linkIdFromState;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sending, setSending] = useState(false);
  const [uiLocked, setUiLocked] = useState(false);

  const [mtrListRaw, setMtrListRaw] = useState([]);
  const [appRowsRaw, setAppRowsRaw] = useState([]);
  const [zapiskaId, setZapiskaId] = useState(null);
  const [app3Id, setApp3Id] = useState(null);
  const [zapiska, setZapiska] = useState(passedZapiska || null);
  const [mtrRows, setMtrRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [rowExtras, setRowExtras] = useState({});
  const [viewMode, setViewMode] = useState("Основные");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [bulkTransportNumber, setBulkTransportNumber] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [leftoversOnly, setLeftoversOnly] = useState(false);
  const [app3Status, setApp3Status] = useState(null);

  // сколько уже зафиксировано в БД на момент загрузки (итог)
  const [baseShipped, setBaseShipped] = useState({});

  const isRowLockedByStatus = (row) => Number(row?.vl06Status) === 50;
  const [bulkRecipient, setBulkRecipient] = useState("");
  const [bulkM11Date, setBulkM11Date] = useState(null);
  const [zayvkaDate, setZayvkaM11Date] = useState(null);
  const [otgruzkaDate, setOtgruzkaDate] = useState(null);
  const [bulkM11Number, setBulkM11Number] = useState("");
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const readOnly = Number(app3Status) === 50 || Number(zapiska?.status) === 50;

  const [app3SendLock, setApp3SendLock] = useState(false);

  const [dimensions, setDimensions] = useState([]);
  const [catList, setCatList] = useState([]);

  const user = useSelector((state) => state.users.userData);

  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(globalQuery), 250);
    return () => clearTimeout(t);
  }, [globalQuery]);

  useEffect(() => {
    if (!loading && !readOnly && !app3SendLock) setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowExtras]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!(!readOnly && dirty && !app3SendLock)) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, readOnly, app3SendLock]);

  useEffect(() => {
    const onKey = (e) => {
      const isSaveComb =
        (e.ctrlKey || e.metaKey) && (e.key === "s" || e.code === "KeyS");
      if (isSaveComb) {
        e.preventDefault();
        if (!saving && !readOnly) handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saving,
    sending,
    uiLocked,
    rowExtras,
    mtrRows,
    zapiskaId,
    user?.id,
    app3SendLock,
  ]);

  const controlsDisabled =
    readOnly || sending || uiLocked || app3SendLock;

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        if (!linkId) {
          message.error("Некорректный идентификатор приложения (linkId).");
          navigate("/application");
          return;
        }

        const app = await apiApplications.getApplicationById(linkId);
        if (!app) throw new Error("Application not found");

        const zId = app?.zapiska?.id;
        if (!Number.isFinite(Number(zId)))
          throw new Error("zapiskaId not found");

        setZapiskaId(Number(zId));
        setApp3Id(app.id);
        setApp3SendLock(!!app.sendLock);
        setApp3Status(app.status ?? null);

        const z =
          location.state?.zapiska ||
          (await ApiZapiski.getIdZapiski(zId).then((r) => r?.data || r));
        setZapiska(z);

        const list = await apiMtrList.getMtrListForId(zId);
        const rows = mapMtrToRows(list);
        setMtrRows(rows);
        setMtrListRaw(Array.isArray(list) ? list : []);

        const baseExtras = rows.reduce((acc, r) => {
          acc[r.key] = { ...defaultsPerRow };
          return acc;
        }, {});
        const baseShippedLocal = {};

        const appRes = await apiApplications.getAppendix3ByZapiska(zId);
        const savedRows = appRes?.data?.rows || [];
        setAppRowsRaw(savedRows);

        for (const r of savedRows) {
          const key = r?.mtrList?.id;
          if (!key) continue;

          const shippedRaw = r?.discarded;
          const shipped =
            shippedRaw != null && shippedRaw !== ""
              ? Number(String(shippedRaw).replace(/\s/g, "").replace(",", "."))
              : null;

          baseExtras[key] = {
            shipmentRequestDate: r?.dateRequest || null,
            transportRequest: r?.format || null,
            transportNumber: r?.transportNumber || "",
            shipmentDate: r?.dateShipment || null,
            recipientName: r?.transit || "",
            m11Date: r?.dateM11 || null,
            m11Number: r?.numberM11 || "",
            shippedQty: null, // волна редактируется в UI, сохраняется только при "Отправить"
            note: r?.addNote || "",
          };

          baseShippedLocal[key] =
            Number.isFinite(shipped) && shipped >= 0 ? shipped : 0;
        }

        setRowExtras(baseExtras);
        setBaseShipped(baseShippedLocal);

        const regs = await apiRegions.getRegionsAll();
        setRegions(regs || []);
        setDirty(false);

        const isPartial = Number(app.status) === 60;
        setLeftoversOnly(openLeftoversOnly || isPartial);
      } catch (e) {
        console.error(e);
        message.error("Ошибка загрузки Приложения № 3");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId]);

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
        console.error("Не удалось получить справочники ЕИ:", e);
        setDimensions([]);
        setCatList([]);
      }
    })();
  }, []);

  const directions = useMemo(() => {
    const storages = [
      ...new Set(mtrRows.map((r) => r.storage).filter(Boolean)),
    ];
    const names = storages
      .map((code) => getRegionNameByStorage(code, regions))
      .filter(Boolean);
    return [...new Set(names)];
  }, [mtrRows, regions]);

  const fmtDateTime = (iso) =>
    iso
      ? new Date(iso).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const setExtra = (rowKey, patch) => {
    if (readOnly || sending || uiLocked || app3SendLock) return;
    setRowExtras((p) => ({ ...p, [rowKey]: { ...p[rowKey], ...patch } }));
  };

  // === commit-логика и обычное сохранение ===
  const remainderSavedOf = useCallback(
    (row) => {
      const vol = parseQty(row.supplyVolume);
      const shippedWas = Number(baseShipped[row.key] ?? 0);
      if (!Number.isFinite(vol)) return null;
      return Math.max(0, vol - shippedWas);
    },
    [baseShipped]
  );

  const remainderCurrentOf = (row) => {
    const vol = parseQty(row.supplyVolume);
    const prev = Number(baseShipped[row.key] ?? 0);
    const wave =
      typeof row.__extras?.shippedQty === "number"
        ? row.__extras.shippedQty
        : 0;
    if (!Number.isFinite(vol)) return null;
    return Math.max(0, vol - (prev + wave));
  };

  const isRowEditable = (row) => {
    if (isRowLockedByStatus(row)) return false;
    if (!app3SendLock && Number(app3Status) < 50) return true;
    return (remainderSavedOf(row) || 0) > 0;
  };

  const normalizeStr = (s) => (s == null ? "" : String(s));

  // История
  const [historyOpenFor, setHistoryOpenFor] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyCurrentRow, setHistoryCurrentRow] = useState(null);

  const openHistory = async (row) => {
    try {
      setHistoryOpenFor(row);
      setHistoryLoading(true);
      const appRow = appRowsRaw.find((x) => x?.mtrList?.id === row.key);
      setHistoryCurrentRow(appRow || null);
      if (!appRow?.id) {
        setHistoryItems([]);
      } else {
        const list = await apiApplications.getApp3RowHistory(appRow.id);
        setHistoryItems(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const datasetWithExtras = useMemo(
    () =>
      mtrRows.map((r) => ({
        ...r,
        __extras: rowExtras[r.key] || {},
      })),
    [mtrRows, rowExtras]
  );

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
    for (const d of dimensions || [])
      if (d?.category && d.isBase) m.set(d.category, d);
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

  const globallyFilteredRows = useMemo(() => {
    const q = normalize(normalizeStr(debouncedQuery));
    let base = datasetWithExtras;

    if (urgentOnly) base = base.filter((rec) => !!rec.urgent);
    if (leftoversOnly)
      base = base.filter((rec) => (remainderSavedOf(rec) || 0) > 0);

    if (!q) return base;

    return base.filter((rec) => {
      const ex = rec.__extras;
      const hay = [
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
        String(parseQty(rec.supplyVolume)),
        rec.created,
        fmtDate(ex.shipmentRequestDate),
        ex.transportRequest,
        ex.transportNumber,
        fmtDate(ex.shipmentDate),
        ex.recipientName,
        fmtDate(ex.m11Date),
        ex.m11Number,
        ex.shippedQty != null ? String(ex.shippedQty) : "",
        ex.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    datasetWithExtras,
    urgentOnly,
    leftoversOnly,
    debouncedQuery,
    remainderSavedOf,
  ]);

  const totals = useMemo(() => {
    let rows = datasetWithExtras;
    if (urgentOnly) rows = rows.filter((r) => !!r.urgent);
    if (leftoversOnly)
      rows = rows.filter((r) => (remainderSavedOf(r) || 0) > 0);

    const total = rows.length;

    let shippedSum = 0;
    let volumeSum = 0;
    let overCount = 0;
    let remainderCount = 0;

    rows.forEach((r) => {
      const ex = r.__extras || {};
      const wave = typeof ex.shippedQty === "number" ? ex.shippedQty : 0;
      const prev = Number(baseShipped[r.key] ?? 0);
      const vol = parseQty(r.supplyVolume) || 0;

      const remainder = Number.isFinite(vol)
        ? Math.max(0, vol - (prev + wave))
        : 0;

      if (remainder > 0) remainderCount += 1;
      shippedSum += prev + (Number.isFinite(wave) ? wave : 0);
      volumeSum += vol;
      if (prev + wave > vol && Number.isFinite(vol)) overCount += 1;
    });

    return { total, shippedSum, volumeSum, overCount, remainderCount };
  }, [
    datasetWithExtras,
    urgentOnly,
    leftoversOnly,
    remainderSavedOf,
    baseShipped,
  ]);

  const totalsByCategory = useMemo(() => {
    let rows = datasetWithExtras;
    if (urgentOnly) rows = rows.filter((r) => !!r.urgent);
    if (leftoversOnly)
      rows = rows.filter((r) => (remainderSavedOf(r) || 0) > 0);

    const acc = new Map();
    for (const r of rows) {
      const dim = resolveDimension(r.basic);
      if (!dim?.category) continue;

      const base = baseByCategory.get(dim.category);
      const unit = base?.code || base?.nameDimension || "";
      const planned = toBase(dim, parseQty(r.supplyVolume));
      const prev = Number(baseShipped[r.key] ?? 0);
      const wave =
        typeof r.__extras?.shippedQty === "number" ? r.__extras.shippedQty : 0;
      const shipped = toBase(dim, prev + wave);

      if (planned == null && shipped == null) continue;

      const prevAcc = acc.get(dim.category) || { unit, planned: 0, shipped: 0 };
      acc.set(dim.category, {
        unit,
        planned: prevAcc.planned + (Number(planned) || 0),
        shipped: prevAcc.shipped + (Number(shipped) || 0),
      });
    }

    const out = {};
    for (const [cat, v] of acc.entries()) {
      out[cat] = {
        unit: v.unit,
        planned: v.planned,
        shipped: v.shipped,
        remainder: Math.max(
          0,
          (Number(v.planned) || 0) - (Number(v.shipped) || 0)
        ),
      };
    }
    return out;
  }, [
    datasetWithExtras,
    urgentOnly,
    leftoversOnly,
    remainderSavedOf,
    resolveDimension,
    baseByCategory,
    baseShipped,
  ]);

  const isM11Invalid = (rowKey) => {
    const ex = rowExtras[rowKey] || {};
    if (!ex.m11Date || !ex.shipmentDate) return false;
    const m11 = dayjs(ex.m11Date).startOf("day");
    const ship = dayjs(ex.shipmentDate).startOf("day");
    return m11.isBefore(ship);
  };

  const textSearchProps = ({ accessor }) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8, width: 220 }}>
        <Input
          autoFocus
          allowClear
          placeholder="Поиск…"
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button type="primary" size="small" onClick={() => confirm()}>
            Найти
          </Button>
          <Button
            size="small"
            onClick={() => {
              clearFilters();
              confirm();
            }}
          >
            Сброс
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      normalize(accessor(record)).includes(normalize(value)),
  });

  const numberRangeProps = ({ accessor }) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys = [],
      confirm,
      clearFilters,
    }) => {
      const [min = "", max = ""] = selectedKeys;
      return (
        <div style={{ padding: 8, width: 220 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <InputNumber
              placeholder="Мин"
              style={{ width: "100%" }}
              value={min === "" ? null : Number(min)}
              onChange={(v) => setSelectedKeys([v ?? "", max])}
            />
            <InputNumber
              placeholder="Макс"
              style={{ width: "100%" }}
              value={max === "" ? null : Number(max)}
              onChange={(v) => setSelectedKeys([min, v ?? ""])}
            />
            <Space>
              <Button type="primary" size="small" onClick={() => confirm()}>
                Применить
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters();
                  confirm();
                }}
              >
                Сброс
              </Button>
            </Space>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (valArray, record) => {
      const [min, max] = Array.isArray(valArray) ? valArray : ["", ""];
      const n = accessor(record);
      if (min !== "" && n < Number(min)) return false;
      if (max !== "" && n > Number(max)) return false;
      return true;
    },
  });

  const baseCols = [
    {
      title: "№",
      width: 50,
      align: "center",
      fixed: "left",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Срочный",
      width: 100,
      align: "center",
      fixed: "left",
      sorter: (a, b) => Number(b.urgent) - Number(a.urgent),
      defaultSortOrder: "descend",
      filters: [
        { text: "Срочно", value: "yes" },
        { text: "Не срочно", value: "no" },
      ],
      onFilter: (v, rec) => (v === "yes" ? !!rec.urgent : !rec.urgent),
      render: (_, rec) =>
        rec.urgent ? <Tag className="urgent-tag">Срочно</Tag> : <Tag>—</Tag>,
    },
    {
      title: "Название",
      dataIndex: "nameMTR",
      ellipsis: true,
      width: 260,
      fixed: "left",
      ...textSearchProps({ accessor: (r) => r.nameMTR }),
    },
    {
      title: "Имя получателя материала",
      dataIndex: "address",
      ellipsis: true,
      width: 220,
      ...textSearchProps({ accessor: (r) => r.address }),
    },
    {
      title: "Поставка",
      dataIndex: "supply",
      width: 110,
      align: "center",
      ...textSearchProps({ accessor: (r) => r.supply }),
    },
    {
      title: "Завод",
      dataIndex: "factory",
      width: 90,
      align: "center",
      ...textSearchProps({ accessor: (r) => r.factory }),
    },
    {
      title: "Склад",
      dataIndex: "storage",
      width: 90,
      align: "center",
      ...textSearchProps({ accessor: (r) => r.storage }),
    },
    {
      title: "Д/Отпуска материала",
      dataIndex: "vacationOfTheMaterial",
      width: 140,
      align: "center",
      render: (v) => (v ? new Date(v).toLocaleDateString("ru-RU") : "—"),
      ...textSearchProps({ accessor: (r) => fmtDate(r.vacationOfTheMaterial) }),
    },
    {
      title: "Материал",
      dataIndex: "material",
      width: 140,
      ...textSearchProps({ accessor: (r) => r.material }),
    },
    {
      title: "Партия",
      dataIndex: "party",
      width: 130,
      ...textSearchProps({ accessor: (r) => r.party }),
    },
    {
      title: "Базовая ЕИ",
      dataIndex: "basic",
      width: 90,
      align: "center",
      ...textSearchProps({ accessor: (r) => r.basic }),
    },
    {
      title: "Объем поставки (план)",
      dataIndex: "supplyVolume",
      width: 160,
      align: "left",
      render: (_, rec) => {
        const plan = parseQty(rec.supplyVolume);
        const rem = remainderSavedOf(rec);
        return (
          <div style={{ lineHeight: 1.1 }}>
            <div>
              <b>Остаток:</b> {fmtNum(rem)}
            </div>
            <div style={{ color: "rgba(0,0,0,.65)" }}>План: {fmtNum(plan)}</div>
          </div>
        );
      },
      ...numberRangeProps({ accessor: (r) => parseQty(r.supplyVolume) }),
    },
    {
      title: "История",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, rec) => (
        <Button
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => openHistory(rec)}
        >
          История
        </Button>
      ),
    },
  ];

  const extraCols = [
    {
      title: "№",
      width: 50,
      align: "center",
      fixed: "left",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Срочный",
      width: 100,
      align: "center",
      fixed: "left",
      sorter: (a, b) => Number(b.urgent) - Number(a.urgent),
      defaultSortOrder: "descend",
      filters: [
        { text: "Срочно", value: "yes" },
        { text: "Не срочно", value: "no" },
      ],
      onFilter: (v, rec) => (v === "yes" ? !!rec.urgent : !rec.urgent),
      render: (_, rec) =>
        rec.urgent ? <Tag className="urgent-tag">Срочно</Tag> : <Tag>—</Tag>,
    },
    {
      title: "Название",
      dataIndex: "nameMTR",
      ellipsis: true,
      width: 250,
      fixed: "left",
      ...textSearchProps({ accessor: (r) => r.nameMTR }),
    },

    {
      title: "Заявка (дата)",
      width: 150,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.shipmentRequestDate;
        return (
          <DatePicker
            size="small"
            format="DD.MM.YYYY"
            value={v ? dayjs(v) : null}
            onChange={(d) =>
              setExtra(rec.key, { shipmentRequestDate: isoOrNull(d) })
            }
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => fmtDate((rowExtras[r.key] || {}).shipmentRequestDate),
      }),
    },
    {
      title: "Груз сформирован в контейнер/автотранспорт",
      width: 340,
      render: (_, rec) => {
        const ex = rowExtras[rec.key] || {};
        const selVal = ex.transportRequest ?? "none";
        return (
          <Space.Compact block>
            <Select
              size="small"
              value={selVal}
              style={{ width: 120 }}
              onChange={(val) =>
                setExtra(rec.key, {
                  transportRequest: val === "none" ? null : val,
                })
              }
              options={[
                { value: "container", label: "Конт." },
                { value: "auto", label: "Авто" },
                { value: "none", label: "—" },
              ]}
              disabled={controlsDisabled || !isRowEditable(rec)}
            />
            <Input
              size="small"
              placeholder="Номер контейнер/авто"
              value={ex.transportNumber ?? ""}
              onChange={(e) =>
                setExtra(rec.key, { transportNumber: e.target.value })
              }
              style={{ width: 200 }}
              disabled={controlsDisabled || !isRowEditable(rec)}
            />
          </Space.Compact>
        );
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        let state = { type: "any", number: "" };
        try {
          state = JSON.parse(selectedKeys?.[0] || "{}");
        } catch {}
        const setState = (patch) =>
          setSelectedKeys([JSON.stringify({ ...state, ...patch })]);
        return (
          <div style={{ padding: 8, width: 260 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                size="small"
                value={state.type}
                onChange={(v) => setState({ type: v })}
                options={[
                  { value: "any", label: "Любой" },
                  { value: "container", label: "Контейнер" },
                  { value: "auto", label: "Авто" },
                  { value: "none", label: "Не сформирован" },
                ]}
              />
              <Input
                size="small"
                allowClear
                placeholder="По номеру"
                value={state.number}
                onChange={(e) => setState({ number: e.target.value })}
              />
              <Space>
                <Button type="primary" size="small" onClick={() => confirm()}>
                  Применить
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    clearFilters();
                    confirm();
                  }}
                >
                  Сброс
                </Button>
              </Space>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (stateJSON, rec) => {
        let state = {};
        try {
          state = JSON.parse(stateJSON);
        } catch {}
        const ex = rowExtras[rec.key] || {};
        const typeOk =
          state.type === "any"
            ? true
            : state.type === "none"
            ? !ex.transportRequest
            : ex.transportRequest === state.type;
        const numOk = state.number
          ? normalize(ex.transportNumber).includes(normalize(state.number))
          : true;
        return typeOk && numOk;
      },
    },
    {
      title: "Отгрузка (дата)",
      width: 150,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.shipmentDate;
        return (
          <DatePicker
            size="small"
            format="DD.MM.YYYY"
            value={v ? dayjs(v) : null}
            onChange={(d) => setExtra(rec.key, { shipmentDate: isoOrNull(d) })}
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => fmtDate((rowExtras[r.key] || {}).shipmentDate),
      }),
    },
    {
      title: "Получатель",
      width: 240,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.recipientName ?? "";
        return (
          <Input
            size="small"
            value={v}
            onChange={(e) =>
              setExtra(rec.key, { recipientName: e.target.value })
            }
            placeholder="Транзитный / конечный"
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => (rowExtras[r.key] || {}).recipientName || "",
      }),
    },
    {
      title: "М11 дата",
      width: 130,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.m11Date;
        const invalid = isM11Invalid(rec.key);
        return (
          <DatePicker
            size="small"
            format="DD.MM.YYYY"
            value={v ? dayjs(v) : null}
            onChange={(d) => setExtra(rec.key, { m11Date: isoOrNull(d) })}
            status={invalid ? "error" : undefined}
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => fmtDate((rowExtras[r.key] || {}).m11Date),
      }),
    },
    {
      title: "М11 №",
      width: 130,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.m11Number ?? "";
        return (
          <Input
            size="small"
            value={v}
            onChange={(e) => setExtra(rec.key, { m11Number: e.target.value })}
            placeholder="Номер"
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => (rowExtras[r.key] || {}).m11Number || "",
      }),
    },

    {
      title: "Объем поставки (план)",
      dataIndex: "supplyVolume",
      width: 160,
      align: "left",
      render: (_, rec) => {
        const plan = parseQty(rec.supplyVolume);
        const rem = remainderSavedOf(rec);
        return (
          <div style={{ lineHeight: 1.1 }}>
            <div>
              <b>Остаток:</b> {fmtNum(rem)}
            </div>
            <div style={{ color: "rgba(0,0,0,.65)" }}>План: {fmtNum(plan)}</div>
          </div>
        );
      },
      ...numberRangeProps({ accessor: (r) => parseQty(r.supplyVolume) }),
    },
    {
      title: "Отгружено (кол-во)",
      width: 420,
      align: "right",
      render: (_, rec) => {
        const plan = parseQty(rec.supplyVolume);
        const prev = Number(baseShipped[rec.key] ?? 0);
        const remSaved = Number.isFinite(plan)
          ? Math.max(0, plan - prev)
          : null;

        const val = rowExtras[rec.key]?.shippedQty;
        const wave = typeof val === "number" ? val : null; // в этой волне

        const minAllowed = 0;
        const maxAllowed = Number.isFinite(remSaved) ? remSaved : undefined;

        const setVal = (n) =>
          setExtra(rec.key, {
            shippedQty:
              typeof n === "number"
                ? Math.max(minAllowed, Math.min(n, remSaved ?? n))
                : null,
          });

        const clampOnBlur = () => {
          if (typeof wave !== "number") return;
          let next = wave;
          if (Number.isFinite(remSaved) && next > remSaved) next = remSaved;
          if (next < minAllowed) next = minAllowed;
          if (next !== wave) setExtra(rec.key, { shippedQty: next });
        };

        const remainderNow = Number.isFinite(plan)
          ? Math.max(0, plan - (prev + (wave || 0)))
          : null;

        const editable = !controlsDisabled && isRowEditable(rec);

        return (
          <Space
            size={6}
            style={{
              width: "100%",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <InputNumber
              size="small"
              min={minAllowed}
              max={maxAllowed}
              value={wave}
              onChange={setVal}
              onBlur={clampOnBlur}
              placeholder="0"
              style={{ width: 160 }}
              disabled={!editable}
            />

            <Tooltip title="Отправить остаток (до плана)">
              <Button
                size="small"
                className="btn-max"
                onClick={() =>
                  Number.isFinite(remSaved) &&
                  setExtra(rec.key, { shippedQty: remSaved })
                }
                disabled={
                  !editable || !Number.isFinite(remSaved) || remSaved <= 0
                }
              >
                MAX
              </Button>
            </Tooltip>

            <Tooltip title="Отправить остаток (до плана)">
              <Button
                size="small"
                className="btn-max"
                onClick={() =>
                  Number.isFinite(remSaved) &&
                  setExtra(rec.key, { shippedQty: remSaved })
                }
                disabled={
                  !editable || !Number.isFinite(remSaved) || remSaved <= 0
                }
              >
                REM
              </Button>
            </Tooltip>

            <span style={{ color: "rgba(0,0,0,.65)" }}>
              ранее фикс.: {fmtNum(prev)} / план: {fmtNum(plan)} / остаток:{" "}
              {fmtNum(remSaved)}
            </span>

            <span style={{ color: "rgba(0,0,0,.65)" }}>
              в этой волне: +{fmtNum(wave || 0)} / тек. ост.:{" "}
              {fmtNum(remainderNow)}
            </span>

            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => openHistory(rec)}
            >
              История
            </Button>
          </Space>
        );
      },
      ...numberRangeProps({
        accessor: (r) => {
          const ex = rowExtras[r.key] || {};
          return typeof ex.shippedQty === "number" ? ex.shippedQty : -Infinity;
        },
      }),
    },

    {
      title: "Примечание",
      width: 280,
      render: (_, rec) => {
        const v = rowExtras[rec.key]?.note ?? "";
        return (
          <Input
            size="small"
            value={v}
            onChange={(e) => setExtra(rec.key, { note: e.target.value })}
            placeholder="Комментарий…"
            disabled={controlsDisabled || !isRowEditable(rec)}
          />
        );
      },
      ...textSearchProps({
        accessor: (r) => (rowExtras[r.key] || {}).note || "",
      }),
    },

    {
      title: "Остаток (тек.)",
      width: 120,
      align: "right",
      render: (_, rec) => {
        const rem = remainderCurrentOf(rec);
        return fmtNum(Number.isFinite(rem) ? rem : null);
      },
    },
  ];

  const columns = viewMode === "Основные" ? baseCols : extraCols;

  // Массовые действия
  const fillAllShippedToMax = () => {
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        const plan = parseQty(r.supplyVolume);
        const prevFix = Number(baseShipped[r.key] ?? 0);
        const rem = Number.isFinite(plan) ? Math.max(0, plan - prevFix) : 0;
        if (rem > 0) {
          next[r.key] = {
            ...(next[r.key] || { ...defaultsPerRow }),
            shippedQty: rem, // волна = остаток
          };
        }
      });
      return next;
    });
  };
  const fillAllRequestDateToday = () => {
    const iso = zayvkaDate
      ? isoOrNull(dayjs(zayvkaDate).startOf("day").toDate())
      : null;
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          shipmentRequestDate: iso,
        };
      });
      return next;
    });
  };

  const fillAllShipmentDateToday = () => {
    const iso = otgruzkaDate
      ? isoOrNull(dayjs(otgruzkaDate).startOf("day").toDate())
      : null;
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          shipmentDate: iso,
        };
      });
      return next;
    });
  };

  const setAllTransport = (val) => {
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          transportRequest: val,
          transportNumber:
            bulkTransportNumber || (next[r.key]?.transportNumber ?? ""),
        };
      });
      return next;
    });
  };

  const setAllRecipient = () => {
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          recipientName: bulkRecipient,
        };
      });
      return next;
    });
  };

  const setAllM11Date = () => {
    const iso = bulkM11Date
      ? isoOrNull(dayjs(bulkM11Date).startOf("day").toDate())
      : null;
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          m11Date: iso,
        };
      });
      return next;
    });
  };

  const setAllM11Number = () => {
    setRowExtras((prev) => {
      const next = { ...prev };
      mtrRows.forEach((r) => {
        if (controlsDisabled || !isRowEditable(r)) return;
        next[r.key] = {
          ...(next[r.key] || { ...defaultsPerRow }),
          m11Number: bulkM11Number,
        };
      });
      return next;
    });
  };

  // Собрать items для сохранения
  const buildItems = ({ commit }) => {
    return mtrRows
      .filter((r) => !isRowLockedByStatus(r))
      .map((r) => {
        const ex = rowExtras[r.key] || {};
        const plan = parseQty(r.supplyVolume);
        const prev = Number(baseShipped[r.key] ?? 0);
        const wave = typeof ex.shippedQty === "number" ? ex.shippedQty : 0;

        // Если commit=true — фиксируем новую волну (prev+wave, с лимитом плана).
        // Если commit=false — НЕ трогаем отгруженное: оставляем prev (чтобы не создавать волну).
        let shipped = commit ? prev + wave : prev;
        if (Number.isFinite(plan)) shipped = Math.min(shipped, plan);
        shipped = Math.max(shipped, prev);

        return {
          mtrListId: Number(r.key),
          dateRequest: ex.shipmentRequestDate || null,
          dateShipment: ex.shipmentDate || null,
          format: ex.transportRequest ?? null,
          transportNumber: ex.transportNumber || null,
          transit: ex.recipientName || "",
          dateM11: ex.m11Date || null,
          numberM11: ex.m11Number || "",
          shippedQty: shipped, // при обычном save == prev; при commit == prev+wave
          note: ex.note || "",
        };
      });
  };

  const exportAllTables = async () => {
    try {
      if (!datasetWithExtras.length) {
        message.warning("Нет данных для экспорта.");
        return;
      }

      // подтянуть последнюю сохранённую строку приложения для каждой позиции
      const mapAppRowByMtrId = new Map(
        (appRowsRaw || [])
          .filter((r) => r?.mtrList?.id)
          .map((r) => [r.mtrList.id, r])
      );

      // подтянуть историю по каждой строке
      const histories = await Promise.all(
        datasetWithExtras.map(async (rec) => {
          const appRow = mapAppRowByMtrId.get(rec.key);
          try {
            const list = appRow?.id
              ? await apiApplications.getApp3RowHistory(appRow.id)
              : [];
            return { key: rec.key, list: Array.isArray(list) ? list : [] };
          } catch {
            return { key: rec.key, list: [] };
          }
        })
      );
      const histMap = new Map(histories.map((x) => [x.key, x.list]));

      const rowsForExport = datasetWithExtras.map((rec) => {
        const appRow = mapAppRowByMtrId.get(rec.key) || null;
        return {
          ...rec,
          __baseShipped: baseShipped[rec.key] ?? 0,
          __lastSaved: appRow,          // текущее состояние строки приложения
          __history: histMap.get(rec.key) || [], // снимки "до изменения"
        };
      });

      await exportApp3Excel(rowsForExport, {
        filename: `Приложение_3_${zapiskaId ?? ""}.xlsx`,
        meta: { zapiskaId, app3Id },
        dims: dimensions,
        cats: catList,
      });
      message.success("Экспорт выполнен.");
    } catch (e) {
      console.error(e);
      message.error("Ошибка при экспорте в Excel.");
    }
  };

  const handleSave = async () => {
    try {
      if (app3SendLock) {
        message.info(
          "Заявка на транспорт на согласовании. Редактирование заблокировано."
        );
        return;
      }

      const invalidKeys = mtrRows
        .map((r) => r.key)
        .filter((k) => isM11Invalid(k));
      if (invalidKeys.length) {
        message.error(
          "Проверьте даты: «М11 дата» не может быть раньше «Отгрузка (дата)»."
        );
        return;
      }
      setSaving(true);

      // Обычное сохранение: НЕ создаём волну — shippedQty остаётся равным prev
      const items = buildItems({ commit: false });

      await apiApplications.saveAppendix3({
        zapiskaId: Number(zapiskaId),
        userId: user?.id,
        items,
      });

      message.success("Приложение № 3 сохранено.");
      setDirty(false);

      // Перезагрузим appRowsRaw (для истории/показа текущих значений)
      try {
        const appRes = await apiApplications.getAppendix3ByZapiska(zapiskaId);
        const savedRows = appRes?.data?.rows || [];
        setAppRowsRaw(savedRows);
      } catch {}
    } catch (e) {
      console.error(e);
      message.error("Не удалось сохранить Приложение № 3");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyToSend = useMemo(() => {
    return mtrRows.some((r) => {
      const prev = Number(baseShipped[r.key] ?? 0);
      const wave =
        typeof rowExtras[r.key]?.shippedQty === "number"
          ? rowExtras[r.key].shippedQty
          : 0;
      return prev + wave > 0;
    });
  }, [mtrRows, baseShipped, rowExtras]);

  const doSend = async () => {
    try {
      setUiLocked(true);
      setSending(true);

      // 1) Сначала сохраним без фиксации волн (чтобы не потерять доп. поля)
      if (dirty && !app3SendLock) {
        await handleSave();
      }

      // 2) Теперь зафиксируем ВОЛНУ (prev + wave) и обнулим "эту волну" в UI
      const commitItems = buildItems({ commit: true });
      await apiApplications.saveAppendix3({
        zapiskaId: Number(zapiskaId),
        userId: user?.id,
        items: commitItems,
      });

      // обновим «ранее фикс.» и обнулим «эту волну»
      const fresh = {};
      const zeroWave = {};
      commitItems.forEach((it) => {
        if (typeof it.shippedQty === "number") {
          fresh[it.mtrListId] = it.shippedQty;
          zeroWave[it.mtrListId] = {
            ...(rowExtras[it.mtrListId] || defaultsPerRow),
            shippedQty: null,
          };
        }
      });
      setBaseShipped((prev) => ({ ...prev, ...fresh }));
      setRowExtras((prev) => ({ ...prev, ...zeroWave }));

      // обновим appRowsRaw (для истории и текущего состояния)
      try {
        const appRes = await apiApplications.getAppendix3ByZapiska(zapiskaId);
        const savedRows = appRes?.data?.rows || [];
        setAppRowsRaw(savedRows);
      } catch {}

      // 3) И только потом — отправка (смена статусов/создание заявки)
      const resp = await ApiZapiski.sendToSent50(zapiskaId);
      const newStatus = resp?.data?.status ?? resp?.status ?? 60;
      setApp3Status(newStatus);
      setApp3SendLock(true);
      setZapiska((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setDirty(false);
      message.success(
        newStatus === 50
          ? "Отправлено полностью. Заявка создана."
          : "Отправлено частично. Создана новая заявка."
      );
    } catch (e) {
      console.error(e);
      message.error("Не удалось отправить. Попробуйте позже.");
      setUiLocked(false);
    } finally {
      setSending(false);
    }
  };

  const confirmAndSend = async () => {
    const invalidKeys = mtrRows
      .map((r) => r.key)
      .filter((k) => isM11Invalid(k));
    if (invalidKeys.length) {
      message.error(
        "Исправьте даты: «М11 дата» не может быть раньше «Отгрузка (дата)»."
      );
      return;
    }
    if (!zapiskaId) {
      message.error("Неизвестна служебная записка.");
      return;
    }
    if (!hasAnyToSend) {
      message.warning(
        "Нет отгружаемых позиций. Укажите количество хотя бы по одной строке."
      );
      return;
    }
    setConfirmSendOpen(true);
  };

  const needsSave = !readOnly && dirty && !app3SendLock;

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
        },
      }}
    >
      {/* Верхняя панель */}
      <div className="app3-topbar">
        <div className="app3-topbar-left" style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<SaveOutlined />}
            className="app3-save btn-save"
            onClick={handleSave}
            loading={saving}
            disabled={controlsDisabled || !dirty}
          >
            {dirty && !app3SendLock ? "Сохранить" : "Сохранено"}
          </Button>

          <Button
            icon={<DownloadOutlined />}
            onClick={exportAllTables}
            disabled={!mtrListRaw.length && !appRowsRaw.length}
          >
            Экспорт (Excel)
          </Button>

          <Button
            icon={<SendOutlined />}
            className="btn-send"
            onClick={confirmAndSend}
            disabled={readOnly || !zapiskaId || app3SendLock || uiLocked}
            loading={sending}
          >
            Отправить
          </Button>
        </div>
        <div className="app3-topbar-right">
          <Button
            icon={<RollbackOutlined />}
            className="btn-exit"
            onClick={() => setExitOpen(true)}
          >
            Выход
          </Button>
        </div>
      </div>

      <div className="app3-container">
        <Card
          loading={loading}
          bordered={false}
          className="app3-card"
        >
          <Title level={4} style={{ margin: "0 0 8px" }}>
            Приложение № 3 {app3Id ? `#${app3Id}` : ""} по служебной записке{" "}
            {zapiskaId ? `#${zapiskaId}` : "—"}
            {Number(app3Status) === 50 && (
              <Tag color="geekblue" style={{ marginLeft: 8 }}>
                Отправлено полностью (только чтение)
              </Tag>
            )}
            {Number(app3Status) === 60 && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Отправлено частично
              </Tag>
            )}
          </Title>

          <div className="app3-stats">
            <span className="pill">Строк: {totals.total}</span>
            <span className="pill" style={{ background: "#fff7e6" }}>
              Остатки по позициям: {totals.remainderCount}
            </span>
            {!readOnly && dirty && !app3SendLock && (
              <span className="pill" style={{ background: "#e6f4ff" }}>
                Черновик
              </span>
            )}
            {app3SendLock && Number(app3Status) < 50 && (
              <Tag color="gold" style={{ marginLeft: 8 }}>
                На согласовании (редактирование заблокировано)
              </Tag>
            )}
          </div>

          {/* Сводка по категориям */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Общий подсчёт по категориям (в базовых ЕИ)
            </div>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div>
                <b>Необходимо отправить:</b>{" "}
                {Object.keys(totalsByCategory).length ? (
                  Object.entries(totalsByCategory).map(([cat, v]) => (
                    <Tag
                      key={`p-${cat}`}
                      color="blue"
                      style={{ marginBottom: 6 }}
                    >
                      {catName.get(cat) || cat}:{" "}
                      {Number(v.planned).toLocaleString("ru-RU")}{" "}
                      {String(v.unit || "").toUpperCase()}
                    </Tag>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
              <div>
                <b>Отправлено:</b>{" "}
                {Object.keys(totalsByCategory).length ? (
                  Object.entries(totalsByCategory).map(([cat, v]) => (
                    <Tag
                      key={`s-${cat}`}
                      color="green"
                      style={{ marginBottom: 6 }}
                    >
                      {catName.get(cat) || cat}:{" "}
                      {Number(v.shipped).toLocaleString("ru-RU")}{" "}
                      {String(v.unit || "").toUpperCase()}
                    </Tag>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
              <div>
                <b>Остаток всего:</b>{" "}
                {Object.keys(totalsByCategory).length ? (
                  Object.entries(totalsByCategory).map(([cat, v]) => (
                    <Tag key={`r-${cat}`} style={{ marginBottom: 6 }}>
                      {catName.get(cat) || cat}:{" "}
                      {Number(v.remainder).toLocaleString("ru-RU")}{" "}
                      {String(v.unit || "").toUpperCase()}
                    </Tag>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </Space>
          </div>

          <div className="app3-info">
            <div>
              <Text strong>Служебная записка:</Text>{" "}
              {zapiska ? (
                <>
                  № {zapiska.id} от {fmtDateTime(zapiska.createdAt)}
                  {zapiska?.user ? (
                    <>
                      {" "}
                      — <Text>Автор:</Text>{" "}
                      {[
                        zapiska.user.surname,
                        zapiska.user.firstName,
                        zapiska.user.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </>
                  ) : null}
                </>
              ) : (
                "—"
              )}
            </div>
            <div>
              <Text strong>Направление доставки:</Text>{" "}
              {directions.length
                ? directions.map((d) => <Tag key={d}>{d}</Tag>)
                : "—"}
            </div>
          </div>

          {/* Поиск + режимы */}
          <div className="app3-toolbar">
            <Space className="app3-toolbar-left" size={12} align="center" wrap>
              <Segmented
                options={["Основные", "Доп. поля"]}
                value={viewMode}
                onChange={(v) => setViewMode(v)}
              />

              <Tag
                color={urgentOnly ? "red" : "default"}
                style={{ cursor: "pointer" }}
                onClick={() => setUrgentOnly((v) => !v)}
              >
                {urgentOnly ? "Показать все" : "Только срочно"}
              </Tag>

              <Space size={6} align="center">
                <Text style={{ userSelect: "none" }}>Остатки</Text>
                <Switch
                  checked={leftoversOnly}
                  onChange={setLeftoversOnly}
                  checkedChildren="вкл"
                  unCheckedChildren="выкл"
                />
              </Space>

              <Input
                allowClear
                className="app3-search"
                prefix={<SearchOutlined />}
                placeholder="Глобальный поиск по всем столбцам…"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
              />
            </Space>

            {/* Массовые действия */}
            {viewMode === "Доп. поля" && !controlsDisabled && (
              <div className="app3-bulk">
                <div className="app3-bulk-group">
                  <DatePicker
                    size="small"
                    format="DD.MM.YYYY"
                    value={zayvkaDate ? dayjs(zayvkaDate) : null}
                    onChange={(d) => setZayvkaM11Date(d ? d.toDate() : null)}
                  />
                  <Button
                    size="small"
                    className="btn-bulk"
                    onClick={fillAllRequestDateToday}
                  >
                    Заявка (дата)
                  </Button>

                  <div className="app3-bulk-group app3-bulk-transport">
                    <Input
                      size="small"
                      placeholder="Номер контейнер/автотранспорт (общий)"
                      value={bulkTransportNumber}
                      onChange={(e) => setBulkTransportNumber(e.target.value)}
                      style={{ width: 260 }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      className="btn-bulk"
                      onClick={() => setAllTransport("container")}
                    >
                      Контейнер
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      className="btn-bulk"
                      onClick={() => setAllTransport("auto")}
                    >
                      Авто
                    </Button>
                  </div>
                  <DatePicker
                    size="small"
                    format="DD.MM.YYYY"
                    value={otgruzkaDate ? dayjs(otgruzkaDate) : null}
                    onChange={(d) => setOtgruzkaDate(d ? d.toDate() : null)}
                  />
                  <Button
                    size="small"
                    className="btn-bulk"
                    onClick={fillAllShipmentDateToday}
                  >
                    Отгрузка (дата)
                  </Button>
                  <Tooltip title="Отгружено = Остаток (до плана)">
                    <Button
                      size="small"
                      className="btn-bulk"
                      onClick={fillAllShippedToMax}
                    >
                      Отгружено = Остаток
                    </Button>
                  </Tooltip>
                </div>
                <div
                  className="app3-bulk-group"
                  style={{ gap: 8, display: "flex", flexWrap: "wrap" }}
                >
                  <Input
                    size="small"
                    placeholder="Получатель (общий)"
                    value={bulkRecipient}
                    onChange={(e) => setBulkRecipient(e.target.value)}
                    style={{ width: 260 }}
                  />
                  <Button
                    size="small"
                    className="btn-bulk"
                    onClick={setAllRecipient}
                  >
                    Получатель
                  </Button>

                  <DatePicker
                    size="small"
                    format="DD.MM.YYYY"
                    value={bulkM11Date ? dayjs(bulkM11Date) : null}
                    onChange={(d) => setBulkM11Date(d ? d.toDate() : null)}
                  />
                  <Button
                    size="small"
                    className="btn-bulk"
                    onClick={setAllM11Date}
                  >
                    М11 (дата)
                  </Button>

                  <Input
                    size="small"
                    placeholder="М11 № (общий)"
                    value={bulkM11Number}
                    onChange={(e) => setBulkM11Number(e.target.value)}
                    style={{ width: 160 }}
                  />
                  <Button
                    size="small"
                    className="btn-bulk"
                    onClick={setAllM11Number}
                  >
                    Всем: М11 №
                  </Button>
                </div>
                <Tooltip title="Очистить все доп. поля во всех строках">
                  <Button
                    size="small"
                    danger
                    onClick={() => {
                      setRowExtras((prev) => {
                        const next = {};
                        mtrRows.forEach(
                          (r) => (next[r.key] = { ...defaultsPerRow })
                        );
                        return next;
                      });
                    }}
                  >
                    Сбросить все доп. поля
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>

          <Title level={5} style={{ margin: "8px 0 12px" }}>
            Регионы доставки: {directions.length ? directions.join(", ") : "—"}
          </Title>

          <Table
            className="app3-table"
            size="small"
            columns={columns}
            dataSource={globallyFilteredRows}
            rowKey="key"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} из ${total}`,
            }}
            scroll={{ x: "max-content", y: 420 }}
            onChange={(pag) => {
              setPagination({ current: pag.current, pageSize: pag.pageSize });
            }}
            rowClassName={(rec) => {
              const ex = rowExtras[rec.key] || {};
              const plan = parseQty(rec.supplyVolume);
              const prev = Number(baseShipped[rec.key] ?? 0);
              const wave =
                typeof ex.shippedQty === "number" ? ex.shippedQty : 0;
              const over = Number.isFinite(plan) && prev + wave > plan;
              const readonly = !isRowEditable(rec);
              return over
                ? "app3-row--over"
                : readonly
                ? "app3-row--readonly"
                : rec.urgent
                ? "app3-row--urgent"
                : "";
            }}
          />
        </Card>

        <div className="app3-footer">
          {directions[0] || "—"} © {new Date().getFullYear()}
        </div>
      </div>

      {/* Модалка отправки */}
      <Modal
        open={confirmSendOpen}
        title="Вы хотите сохранить и отправить?"
        onCancel={() => setConfirmSendOpen(false)}
        footer={[
          <Button
            key="yes"
            className="btn-send"
            onClick={async () => {
              setConfirmSendOpen(false);
              await doSend();
            }}
            loading={sending}
          >
            Да
          </Button>,
          <Button
            key="cancel"
            className="btn-save"
            onClick={() => setConfirmSendOpen(false)}
          >
            Отмена
          </Button>,
          <Button key="no" danger onClick={() => setConfirmSendOpen(false)}>
            Нет
          </Button>,
        ]}
        centered
      >
        После отправки статусы обновятся, и будет создана заявка на транспорт.
      </Modal>

      {/* Модалка выхода */}
      <Modal
        open={exitOpen}
        title="Выход"
        onCancel={() => setExitOpen(false)}
        footer={
          needsSave
            ? [
                <Button
                  key="yes"
                  className="btn-send"
                  onClick={async () => {
                    try {
                      await handleSave();
                    } catch {}
                    navigate("/application");
                  }}
                >
                  Да
                </Button>,
                <Button
                  key="cancel"
                  className="btn-save"
                  onClick={() => setExitOpen(false)}
                >
                  Отмена
                </Button>,
                <Button
                  key="no"
                  className="btn-exit"
                  onClick={() => {
                    setExitOpen(false);
                    navigate("/application");
                  }}
                >
                  Нет
                </Button>,
              ]
            : [
                <Button
                  key="yes"
                  className="btn-exit"
                  onClick={() => navigate("/application")}
                >
                  Да
                </Button>,
                <Button key="no" onClick={() => setExitOpen(false)}>
                  Нет
                </Button>,
              ]
        }
        centered
      >
        {needsSave
          ? "Сохранить изменения перед выходом?"
          : "Выйти со страницы?"}
      </Modal>

      {/* Drawer «История изменений строки» */}
      <Drawer
        width={720}
        title={
          historyOpenFor
            ? `История — ${historyOpenFor.nameMTR || "позиция"} (MTR #${
                historyOpenFor.key
              })`
            : "История"
        }
        open={!!historyOpenFor}
        onClose={() => setHistoryOpenFor(null)}
      >
        {historyLoading ? (
          <div style={{ padding: 32 }}>Загрузка…</div>
        ) : (
          <>
            {/* Текущее состояние */}
            {historyCurrentRow ? (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title="Текущее состояние"
              >
                {(() => {
                  const plan = parseQty(historyOpenFor?.supplyVolume);
                  const currShipped = parseQty(historyCurrentRow?.discarded);
                  // предыдущий кумулятив по истории (если есть)
                  const prevCum =
                    Array.isArray(historyItems) && historyItems.length
                      ? parseQty(
                          historyItems
                            .slice()
                            .sort(
                              (a, b) =>
                                dayjs(a.createdAt).valueOf() -
                                dayjs(b.createdAt).valueOf()
                            )
                            .at(-1)?.snapshot?.discarded
                        )
                      : 0;
                  const waveNow = Math.max(0, currShipped - prevCum);
                  const currRem = Number.isFinite(plan)
                    ? Math.max(0, plan - currShipped)
                    : null;
                  return (
                    <Descriptions size="small" column={2} bordered>
                      <Descriptions.Item label="Отгружено (итого)">
                        {fmtNum(currShipped)}
                      </Descriptions.Item>
                      <Descriptions.Item label="В этой волне">
                        +{fmtNum(waveNow)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Остаток">
                        {fmtNum(currRem)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Тип транспорта">
                        {historyCurrentRow?.format || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Номер конт./авто">
                        {historyCurrentRow?.transportNumber || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Заявка (дата)">
                        {fmtDateOnly(historyCurrentRow?.dateRequest)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Отгрузка (дата)">
                        {fmtDateOnly(historyCurrentRow?.dateShipment)}
                      </Descriptions.Item>
                      <Descriptions.Item label="М11 №">
                        {historyCurrentRow?.numberM11 || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="М11 дата">
                        {fmtDateOnly(historyCurrentRow?.dateM11)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Получатель" span={2}>
                        {historyCurrentRow?.transit || "—"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Примечание" span={2}>
                        {historyCurrentRow?.addNote || "—"}
                      </Descriptions.Item>
                    </Descriptions>
                  );
                })()}
              </Card>
            ) : null}

            {/* История изменений (снимки ДО изменений) */}
            {Array.isArray(historyItems) && historyItems.length ? (
              (() => {
                const asc = historyItems
                  .slice()
                  .sort(
                    (a, b) =>
                      dayjs(a.createdAt).valueOf() -
                      dayjs(b.createdAt).valueOf()
                  );

                let prev = 0;
                const enriched = asc
                  .map((h) => {
                    const cum = parseQty(h?.snapshot?.discarded);
                    const wave = Math.max(0, cum - prev);
                    prev = Math.max(prev, cum);
                    return { h, cum, wave };
                  })
                  .reverse();

                return enriched.map(({ h, cum, wave }) => {
                  const plan = parseQty(historyOpenFor?.supplyVolume);
                  const snap = h?.snapshot || {};
                  const snapRem = Number.isFinite(plan)
                    ? Math.max(0, plan - cum)
                    : null;
                  return (
                    <Card key={h.id} size="small" style={{ marginBottom: 12 }}>
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label="Когда" span={2}>
                          {h.createdAt
                            ? new Date(h.createdAt).toLocaleString("ru-RU")
                            : "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Отгружено (на момент)">
                          {fmtNum(cum)}
                        </Descriptions.Item>
                        <Descriptions.Item label="В этой волне">
                          +{fmtNum(wave)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Остаток">
                          {fmtNum(snapRem)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Тип транспорта">
                          {snap.format || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Номер конт./авто">
                          {snap.transportNumber || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Заявка (дата)">
                          {fmtDateOnly(snap.dateRequest)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Отгрузка (дата)">
                          {fmtDateOnly(snap.dateShipment)}
                        </Descriptions.Item>
                        <Descriptions.Item label="М11 №">
                          {snap.numberM11 || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="М11 дата">
                          {fmtDateOnly(snap.dateM11)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Получатель" span={2}>
                          {snap.transit || "—"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Примечание" span={2}>
                          {snap.addNote || "—"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  );
                });
              })()
            ) : (
              <Empty description="Истории изменений пока нет" />
            )}
          </>
        )}
      </Drawer>
    </ConfigProvider>
  );
}
