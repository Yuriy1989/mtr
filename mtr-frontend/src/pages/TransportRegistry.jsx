// src/pages/TransportRegistry.jsx
import { useEffect, useMemo, useState } from "react";
import { Table, Card, Tag, App, Button, Space, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiTrans } from "../utils/ApiTransports";
import { api as apiDirectories } from "../utils/ApiDirectories";
import { api as apiApplications } from "../utils/ApiApplications";
import { useNavigate } from "react-router-dom";

const STATUS = {
  10: "На согласовании",
  20: "Согласовано",
  30: "Не согласовано",
};
const statusColor = (s) =>
  ({ 10: "gold", 20: "green", 30: "red" }[Number(s)] || "default");
const toLocal = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm") : "—");
const parseQty = (v) => {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const lower = (s) => (s == null ? "" : String(s).trim().toLowerCase());

export default function TransportRegistry() {
  const { message } = App.useApp();
  const [rows, setRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);

  // справочники ЕИ/категорий
  const [dimensions, setDimensions] = useState([]);
  const [catList, setCatList] = useState([]);

  const navigate = useNavigate();

  // карты для быстрого разрешения ЕИ/категорий
  const dimByCode = useMemo(() => {
    const m = new Map();
    for (const d of dimensions || []) if (d.code) m.set(lower(d.code), d);
    return m;
  }, [dimensions]);

  const dimByAlias = useMemo(() => {
    const m = new Map();
    for (const d of dimensions || []) {
      if (Array.isArray(d.aliases)) for (const a of d.aliases) if (a) m.set(lower(a), d);
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
    const m = new Map();
    for (const c of catList || []) m.set(c.key, c.nameRu || c.key);
    return m;
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

  const regionNameByStorage = (s) => {
    const found = regions.find(
      (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(s)
    );
    return found?.nameRegion || s || "—";
  };

  const load = async () => {
    try {
      setLoading(true);

      const [list, regs, dims, cats] = await Promise.all([
        apiTrans.list(), // все заявки
        apiDirectories.getRegionsAll(),
        apiDirectories.getDimensionsAll().catch(() => []),
        apiDirectories.getDimensionCategories().catch(() => []),
      ]);

      setRegions(regs || []);
      setDimensions(Array.isArray(dims) ? dims : []);
      setCatList(Array.isArray(cats) ? cats : []);

      const apps = Array.from(
        new Set((list || []).map((t) => t?.application?.id).filter(Boolean))
      );

      // appId -> zapiskaId
      const appToZap = new Map();
      await Promise.all(
        apps.map(async (appId) => {
          try {
            const app = await apiApplications.getApplicationById(appId);
            if (app?.zapiska?.id) appToZap.set(appId, Number(app.zapiska.id));
          } catch {}
        })
      );

      // appId -> { planned:{cat:{unit,qty}}, shipped:{...} }
      const byAppCat = new Map();
      await Promise.all(
        apps.map(async (appId) => {
          const zId = appToZap.get(appId);
          if (!zId) return;
          try {
            const res = await apiApplications.getAppendix3ByZapiska(zId);
            const aRows = res?.data?.rows || [];

            const planned = new Map();
            const shipped = new Map();

            for (const r of aRows) {
              const v = r?.mtrList?.vl06 || {};
              const dim = resolveDimension(v?.basic);
              if (!dim?.category) continue;

              const base = baseByCategory.get(dim.category);
              const baseUnit = base?.code || base?.nameDimension || "";

              const volBase = toBase(dim, parseQty(v?.supplyVolume));
              const shipBase = toBase(dim, parseQty(r?.discarded));

              if (Number.isFinite(volBase)) {
                const prev = planned.get(dim.category) || { unit: baseUnit, qty: 0 };
                planned.set(dim.category, { unit: baseUnit, qty: prev.qty + volBase });
              }
              if (Number.isFinite(shipBase)) {
                const prev = shipped.get(dim.category) || { unit: baseUnit, qty: 0 };
                shipped.set(dim.category, { unit: baseUnit, qty: prev.qty + shipBase });
              }
            }

            const toObj = (m) => {
              const o = {};
              for (const [cat, v] of m.entries()) o[cat] = v;
              return o;
            };
            byAppCat.set(appId, { planned: toObj(planned), shipped: toObj(shipped) });
          } catch {}
        })
      );

      const enriched = (list || []).map((t) => {
        const appId = t?.application?.id;
        return { ...t, _byCat: appId ? byAppCat.get(appId) || null : null };
        // fallback остаётся через supplyVolumeTotal/shippedTotal
      });

      setRows(enriched);
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить реестр");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // рендеры «Итоги по категориям»
  const renderPlannedByCat = (_, r) => {
    const by = r?._byCat?.planned;
    if (!by || !Object.keys(by).length) {
      return r?.supplyVolumeTotal != null ? (
        <Tag color="blue">{Number(r.supplyVolumeTotal).toLocaleString("ru-RU")}</Tag>
      ) : (
        "—"
      );
    }
    return (
      <Space size={6} wrap>
        {Object.entries(by).map(([cat, v]) => (
          <Tag key={`p-${r.id}-${cat}`} color="blue">
            {catName.get(cat) || cat}: {Number(v.qty).toLocaleString("ru-RU")}{" "}
            {String(v.unit || "").toUpperCase()}
          </Tag>
        ))}
      </Space>
    );
  };

  const renderShippedByCat = (_, r) => {
    const by = r?._byCat?.shipped;
    if (!by || !Object.keys(by).length) {
      return r?.shippedTotal != null ? (
        <Tag color="green">{Number(r.shippedTotal).toLocaleString("ru-RU")}</Tag>
      ) : (
        "—"
      );
    }
    return (
      <Space size={6} wrap>
        {Object.entries(by).map(([cat, v]) => (
          <Tag key={`s-${r.id}-${cat}`} color="green">
            {catName.get(cat) || cat}: {Number(v.qty).toLocaleString("ru-RU")}{" "}
            {String(v.unit || "").toUpperCase()}
          </Tag>
        ))}
      </Space>
    );
  };

  const columns = [
    { title: "№", dataIndex: "id", width: 80, fixed: "left" },
    {
      title: "Статус",
      dataIndex: "status",
      width: 160,
      render: (s) => <Tag color={statusColor(s)}>{STATUS[s] ?? s}</Tag>,
    },
    {
      title: "Причина отказа",
      dataIndex: "rejectReason",
      width: 260, // фиксированная ширина
      ellipsis: true,
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <div
              style={{
                maxWidth: 260,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {text}
            </div>
          </Tooltip>
        ) : (
          "—"
        ),
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
      width: 260,
      ellipsis: true,
      render: (arr) =>
        Array.isArray(arr) && arr.length
          ? [...new Set(arr.map(regionNameByStorage))].join(", ")
          : "—",
    },

    // «Итоги по категориям», как в TransportRequests
    {
      title: "Объем поставки (сумма)",
      dataIndex: "supplyVolumeTotal",
      width: 280,
      align: "left",
      render: renderPlannedByCat,
    },
    {
      title: "Отгружено (сумма)",
      dataIndex: "shippedTotal",
      width: 280,
      align: "left",
      render: renderShippedByCat,
    },

    {
      title: "Получатель",
      dataIndex: "recipientsSummary",
      width: 260,
      ellipsis: true,
    },
    {
      title: "Груз (конт./авто)",
      dataIndex: "cargoFormedSummary",
      width: 240,
      ellipsis: true,
    },
    {
      title: "Материалы",
      dataIndex: "materialsSummary",
      width: 260,
      ellipsis: true,
    },
    { title: "Создано", dataIndex: "createdAt", width: 160, render: toLocal },
    { title: "Обновлено", dataIndex: "updatedAt", width: 160, render: toLocal },
  ];

  return (
    <Card
      title={
        <>
          Заявки на транспорт — реестр{" "}
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
        tableLayout="fixed" // фиксируем ширины, чтобы длинный текст не растягивал сетку
      />
    </Card>
  );
}
