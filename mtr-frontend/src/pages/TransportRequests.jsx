import { useEffect, useState, } from "react";
import {
  Table,
  Card,
  Space,
  Button,
  Tag,
  Modal,
  Input,
  App,
  ConfigProvider,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiTrans } from "../utils/ApiTransports";
import { api as apiRegions } from "../utils/ApiDirectories";
import { api as apiApplications } from "../utils/ApiApplications"; // NEW
import { api as apiMtrList } from "../utils/ApiMtrList"; // NEW
import { api as apiDirectories } from "../utils/ApiDirectories"; // NEW
import { useNavigate } from "react-router-dom";

const STATUS = {
  10: "На согласовании",
  20: "Согласовано",
  30: "Не согласовано",
};
const statusColor = (s) =>
  ({ 10: "gold", 20: "green", 30: "red" }[Number(s)] || "default");

const toLocal = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm") : "—");

// ===== helpers для нормализации ЕИ в базовые по категориям =====
const lower = (s) => (s == null ? "" : String(s).trim().toLowerCase());
const parseQty = (v) => {
  if (v == null) return 0;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
function buildDimHelpers(dimensions = [], categories = []) {
  const dimByCode = new Map();
  const dimByAlias = new Map();
  const baseByCategory = new Map();
  const catName = new Map();

  for (const d of dimensions || []) {
    if (d?.code) dimByCode.set(lower(d.code), d);
    if (d?.nameDimension) dimByAlias.set(lower(d.nameDimension), d);
    if (Array.isArray(d?.aliases)) {
      for (const a of d.aliases) if (a) dimByAlias.set(lower(a), d);
    }
    if (d?.category && d?.isBase) baseByCategory.set(d.category, d);
  }
  for (const c of categories || []) {
    catName.set(c.key, c.nameRu || c.key);
  }
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

  return { resolveDimension, toBase, baseByCategory, catName };
}

export default function TransportRequests() {
  const { message } = App.useApp();
  const [rows, setRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState([]);
  const [catList, setCatList] = useState([]);
  const [catStats, setCatStats] = useState(() => new Map());
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const [list, regs] = await Promise.all([
        apiTrans.list(10), // только "На согласование"
        apiRegions.getRegionsAll(),
      ]);
      setRows(list);
      setRegions(regs || []);
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Подтягиваем справочники ЕИ (для итогов по категориям)
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

  // Имя региона по складу
  const regionNameByStorage = (storage) => {
    const found = regions.find(
      (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(storage)
    );
    return found?.nameRegion || storage || "—";
  };

  // Подсчёт итогов по категориям для конкретной заявки (по связанной служебке)
  const computeStatsForTransport = async (tr) => {
    try {
      const zapId = tr?.application?.zapiska?.id;
      if (!zapId) return;

      // 1) База (VL06) по служебке
      const mtrList = await apiMtrList.getMtrListForIdApp(zapId); // [{ id, vl06: {...} , express, note, repairObjectName }]
      // 2) Доп. строки Прил. №3
      const appData = await apiApplications.getAppendix3ByZapiska(zapId);
      const appRows = appData?.data?.rows || []; // TableApplication[] (eager mtrList)

      // мапа mtrListId -> shippedQty (number)
      const shippedByMtr = new Map();
      for (const r of appRows) {
        const key = r?.mtrList?.id;
        if (!key) continue;
        const shippedRaw = r?.discarded;
        const shipped =
          shippedRaw != null && shippedRaw !== ""
            ? Number(String(shippedRaw).replace(/\s/g, "").replace(",", "."))
            : null;
        if (typeof shipped === "number" && Number.isFinite(shipped)) {
          shippedByMtr.set(key, shipped);
        }
      }

      const { resolveDimension, toBase, baseByCategory, catName } =
        buildDimHelpers(dimensions, catList);

      // аккумулируем по категории
      const acc = new Map(); // catKey -> { unit, planned, shipped }
      for (const row of mtrList || []) {
        const v = row?.vl06 || {};
        const volPlan = parseQty(v?.supplyVolume);
        const shipped = parseQty(shippedByMtr.get(row.id));

        const dim = resolveDimension(v?.basic);
        if (!dim?.category) continue;

        const base = baseByCategory.get(dim.category);
        const unit = base?.code || base?.nameDimension || "";

        const pBase = toBase(dim, volPlan) || 0;
        const sBase = toBase(dim, shipped) || 0;

        const prev = acc.get(dim.category) || { unit, planned: 0, shipped: 0 };
        acc.set(dim.category, {
          unit,
          planned: prev.planned + pBase,
          shipped: prev.shipped + sBase,
        });
      }

      // приводим к спискам
      const byCat = Array.from(acc.entries()).map(([catKey, v]) => {
        const label = catName.get(catKey) || catKey;
        const unit = String(v.unit || "").toUpperCase();
        const planned = Number(v.planned) || 0;
        const shipped = Number(v.shipped) || 0;
        return { label, unit, planned, shipped };
      });
      byCat.sort((a, b) => a.label.localeCompare(b.label, "ru"));

      const plannedList = byCat.map((x) => ({
        label: x.label,
        unit: x.unit,
        total: x.planned,
      }));
      const shippedList = byCat.map((x) => ({
        label: x.label,
        unit: x.unit,
        total: x.shipped,
      }));

      setCatStats((prev) => {
        const next = new Map(prev);
        next.set(tr.id, { planned: plannedList, shipped: shippedList });
        return next;
      });
    } catch (e) {
      console.error("Не удалось посчитать итоги по категориям:", e);
    }
  };

  // Когда есть и строки, и справочники — считаем статистику для каждой строки, которой ещё нет
  useEffect(() => {
    if (!rows.length || !dimensions.length) return;
    const missing = rows.filter((r) => !catStats.has(r.id));
    if (!missing.length) return;
    missing.forEach((r) => computeStatsForTransport(r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, dimensions, catList]);

  const columns = [
    // Нумерация строк — последовательная
    {
      title: "№",
      width: 60,
      fixed: "left",
      align: "center",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "Статус",
      dataIndex: "status",
      width: 150,
      render: (s) => <Tag color={statusColor(s)}>{STATUS[s] ?? s}</Tag>,
    },
    {
      title: "Прил. №3",
      dataIndex: ["application", "id"],
      width: 120,
      render: (id, r) =>
        id ? (
          <a
            href={`/application/app3/new/${id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/application/app3/new/${id}`, {
                state: {
                  linkId: id,
                  zapiska: r?.application?.zapiska
                    ? { id: r.application.zapiska.id }
                    : undefined,
                },
              });
            }}
          >
            № {id}
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Направление",
      dataIndex: "storages",
      width: 230,
      render: (arr) =>
        Array.isArray(arr) && arr.length
          ? [...new Set(arr.map(regionNameByStorage))].join(", ")
          : "—",
      ellipsis: true,
    },
    {
      title: "Объем поставки (сумма)",
      dataIndex: "supplyVolumeTotal",
      width: 260,
      render: (val, r) => {
        const s = catStats.get(r.id);
        if (s?.planned?.length) {
          return (
            <Space size={[6, 6]} wrap>
              {s.planned.map((x) => (
                <Tag key={`${r.id}-p-${x.label}`} color="blue">
                  {x.label}: {Number(x.total).toLocaleString("ru-RU")} {x.unit}
                </Tag>
              ))}
            </Space>
          );
        }
        return val != null ? Number(val).toLocaleString("ru-RU") : "—";
      },
    },
    {
      title: "Отгружено (сумма)",
      dataIndex: "shippedTotal",
      width: 240,
      render: (val, r) => {
        const s = catStats.get(r.id);
        if (s?.shipped?.length) {
          return (
            <Space size={[6, 6]} wrap>
              {s.shipped.map((x) => (
                <Tag key={`${r.id}-s-${x.label}`} color="green">
                  {x.label}: {Number(x.total).toLocaleString("ru-RU")} {x.unit}
                </Tag>
              ))}
            </Space>
          );
        }
        return val != null ? Number(val).toLocaleString("ru-RU") : "—";
      },
    },
    {
      title: "Получатель",
      dataIndex: "recipientsSummary",
      width: 240,
      ellipsis: true,
    },
    {
      title: "Груз (конт./авто)",
      dataIndex: "cargoFormedSummary",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Материалы",
      dataIndex: "materialsSummary",
      width: 260,
      ellipsis: true,
    },
    { title: "Создано", dataIndex: "createdAt", width: 150, render: toLocal },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 220,
      render: (_, r) => (
        <Space size={6} wrap>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={async () => {
              try {
                await apiTrans.approve(r.id);
                message.success("Заявка согласована");
                setCatStats((m) => {
                  const n = new Map(m);
                  n.delete(r.id);
                  return n;
                });
                load();
              } catch {
                message.error("Не удалось согласовать");
              }
            }}
          >
            Согласовать
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              let reason = "";
              Modal.confirm({
                title: "Указать причину отказа",
                content: (
                  <Input.TextArea
                    autoSize
                    onChange={(e) => (reason = e.target.value)}
                    placeholder="Причина"
                  />
                ),
                okText: "Не согласовать",
                cancelText: "Отмена",
                async onOk() {
                  try {
                    await apiTrans.reject(r.id, reason);
                    message.success("Заявка отклонена");
                    setCatStats((m) => {
                      const n = new Map(m);
                      n.delete(r.id);
                      return n;
                    });
                    load();
                  } catch {
                    message.error("Не удалось отклонить");
                  }
                },
              });
            }}
          >
            Не согласовать
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontSize: 12 } }}>
      <Card
        title={
          <>
            Заявки на транспорт — на согласование
            <Button type="link" icon={<ReloadOutlined />} onClick={load} />
          </>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="small"
          pagination={{ pageSize: 20 }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </ConfigProvider>
  );
}
