/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Card,
  ConfigProvider,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  Select,
  Segmented,
} from "antd";
import {
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as apiApplications } from "../utils/ApiApplications";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as apiRegions } from "../utils/ApiDirectories";
import exportApp3ReportExcel from "../utils/export/exportApp3ReportExcel";
import {
  STATUS_FOR_ZAPISKA,
  STATUS_FOR_APP3,
  STATUS_FOR_MTR,
  statusColor,
  normalizeStatus,
  STATUS_SHORT_FOR_MTR,
} from "../constants/status";

const { Title, Text } = Typography;

const fmtDate = (d) => (d ? dayjs(d).format("DD.MM.YYYY HH:mm") : "—");
const short = (s) =>
  STATUS_SHORT_FOR_MTR[normalizeStatus(s)] ?? normalizeStatus(s);
const getRegionNameByStorage = (storageCode, regionsArr) => {
  if (!regionsArr || !Array.isArray(regionsArr)) return null;
  const found = regionsArr.find(
    (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(storageCode)
  );
  return found?.nameRegion || null;
};

export default function ReportsApp3() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("Компактно");

  const refresh = async () => {
    try {
      setLoading(true);

      // 1) Служебки
      const zRes = await ApiZapiski.getAllZapiski();
      const zapisList = (zRes?.data ?? []).map((z) => ({
        id: z.id,
        createdAt: z.createdAt,
        status: z.status,
        user: z.user,
      }));

      // 2) Приложения (связь с zapiska присутствует)
      const apps = await apiApplications.getApplications();
      const byZap = new Map();
      for (const a of apps) {
        const zapId = a?.zapiska?.id;
        if (zapId) byZap.set(zapId, a);
      }

      // 2.1) Справочник регионов (для маппинга склад->направление)
      const regs = await apiRegions.getRegionsAll().catch(() => []);

      // 3) Для каждой служебки — подтянуть mtrList (+vl06) и посчитать статусы VL06
      const enriched = await Promise.all(
        zapisList.map(async (z) => {
          let vl06Stats = {};
          let vl06Total = 0;

          try {
            const mtr = await apiMtrList.getMtrListForId(z.id); // MtrList с relation: vl06
            mtr?.forEach((r) => {
              const st = normalizeStatus(r?.vl06?.status);
              vl06Stats[st] = (vl06Stats[st] || 0) + 1;
              vl06Total += 1;
            });
          } catch {
            /* нет строк — ок */
          }

          const app = byZap.get(z.id) || null;
          const storages = app?.storages ?? [];
          const directionNames = [
            ...new Set(
              storages
                .map((code) => getRegionNameByStorage(code, regs))
                .filter(Boolean)
            ),
          ];

          // статус Прил.3: если нет — null (для "—")
          const appStatusRaw = app?.application?.status ?? app?.status ?? null;
          const appStatus = Number.isFinite(Number(appStatusRaw))
            ? Number(appStatusRaw)
            : null;

          return {
            key: z.id,
            // СЗ
            zapiskaId: z.id,
            zapiskaCreatedAt: z.createdAt,
            zapiskaAuthor: z.user
              ? [z.user?.surname, z.user?.firstName, z.user?.lastName]
                  .filter(Boolean)
                  .join(" ")
              : null,
            zapiskaStatus: normalizeStatus(z.status),

            // Приложение 3
            appId: app?.application?.id ?? app?.id ?? null,
            appCreatedAt: app?.application?.createdAt ?? app?.createdAt ?? null,
            appUpdatedAt: app?.application?.updatedAt ?? app?.updatedAt ?? null,
            appStatus, // null если нет статуса
            rowsCount: app?.rowsCount ?? 0,
            storages,
            directions: directionNames,

            // VL06
            vl06Total,
            vl06Stats, // { 10: n, 20: n, ... }
          };
        })
      );

      setRows(enriched);
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить отчёт Приложение 3");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchLower = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let base = rows;
    if (statusFilter !== "all") {
      const [scope, codeStr] = String(statusFilter).split("-");
      const code = Number(codeStr);
      if (scope === "z" && Number.isFinite(code)) {
        base = base.filter((r) => r.zapiskaStatus === code);
      } else if (scope === "a" && Number.isFinite(code)) {
        base = base.filter((r) => r.appStatus === code);
      }
    }
    if (!searchLower) return base;
    return base.filter((r) => {
      const hay = [
        r.zapiskaId,
        fmtDate(r.zapiskaCreatedAt),
        r.zapiskaAuthor,
        STATUS_FOR_ZAPISKA[r.zapiskaStatus],
        r.appId,
        fmtDate(r.appCreatedAt),
        STATUS_FOR_APP3[r.appStatus],
        r.vl06Total,
        ...Object.entries(r.vl06Stats || {}).map(
          ([k, v]) => `${STATUS_FOR_MTR[k]} ${v}`
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(searchLower);
    });
  }, [rows, statusFilter, searchLower]);

  const columnsCompact = [
    {
      title: "СЗ № / дата",
      dataIndex: "zapiskaId",
      width: 180,
      fixed: "left",
      render: (_, r) => (
        <div>
          <Text strong>№ {r.zapiskaId}</Text>
          <div style={{ color: "rgba(0,0,0,.45)" }}>
            {fmtDate(r.zapiskaCreatedAt)}
          </div>
        </div>
      ),
    },
    {
      title: "Автор СЗ",
      dataIndex: "zapiskaAuthor",
      width: 160,
      render: (v) => v || "—",
    },
    {
      title: "Статус СЗ",
      dataIndex: "zapiskaStatus",
      width: 130,
      render: (s) => (
        <Tag color={statusColor(s)}>{STATUS_FOR_ZAPISKA[s] || s}</Tag>
      ),
      filters: Object.entries(STATUS_FOR_ZAPISKA).map(([value, text]) => ({
        text,
        value,
      })),
      onFilter: (v, r) => String(r.zapiskaStatus) === String(v),
    },
    {
      title: "Приложение №3",
      width: 200,
      render: (_, r) => (
        <div>
          {r.appId ? (
            // eslint-disable-next-line react/jsx-no-comment-textnodes
            <>
              <a
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/application/app3/new/${r.appId}`, {
                    state: { linkId: r.appId, zapiska: { id: r.zapiskaId } },
                  });
                }}
              >
                № {r.appId}
              </a>
              <div style={{ color: "rgba(0,0,0,.45)" }}>
                {fmtDate(r.appCreatedAt)}
              </div>
            </>
          ) : (
            "—"
          )}
        </div>
      ),
    },
    {
      title: "Статус Прил.3",
      dataIndex: "appStatus",
      width: 140,
      render: (s) =>
        Number.isFinite(Number(s)) ? (
          <Tag color={statusColor(s)}>{STATUS_FOR_APP3[s] || s}</Tag>
        ) : (
          "—"
        ),
      filters: Object.entries(STATUS_FOR_APP3).map(([value, text]) => ({
        text,
        value,
      })),
      onFilter: (v, r) => String(r.appStatus) === String(v),
    },
    {
      title: "VL06: всего / по статусам",
      dataIndex: "vl06Total",
      width: 360,
      render: (_, r) => {
        const stats = r.vl06Stats || {};
        const chips = Object.entries(stats)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([code, cnt]) => (
            <Tag
              key={code}
              color={statusColor(code)}
              style={{ marginBottom: 4 }}
            >
              {short(code)}: {cnt}
            </Tag>
          ));
        return (
          <Space size={6} wrap>
            <Tag color="default">Всего: {r.vl06Total}</Tag>
            {chips}
          </Space>
        );
      },
      sorter: (a, b) => a.vl06Total - b.vl06Total,
    },
  ];

  const columnsWide = [
    ...columnsCompact,
    {
      title: "Строк в Прил.3",
      dataIndex: "rowsCount",
      width: 130,
      align: "right",
      sorter: (a, b) => a.rowsCount - b.rowsCount,
      render: (v) => v ?? 0,
    },
    {
      title: "Склады",
      dataIndex: "storages",
      width: 260,
      render: (arr) =>
        Array.isArray(arr) && arr.length ? (
          <Space size={6} wrap>
            {arr.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Направления",
      dataIndex: "directions",
      width: 280,
      render: (arr) =>
        Array.isArray(arr) && arr.length ? (
          <Space size={6} wrap>
            {arr.map((n) => (
              <Tag key={n}>{n}</Tag>
            ))}
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Обновлено Прил.3",
      dataIndex: "appUpdatedAt",
      width: 170,
      render: (v) => fmtDate(v),
      sorter: (a, b) =>
        new Date(a.appUpdatedAt || 0) - new Date(b.appUpdatedAt || 0),
    },
    {
      title: "VL06: Отпр./Готово",
      width: 210,
      render: (_, r) => {
        const sent = r?.vl06Stats?.[50] || 0;
        const done = r?.vl06Stats?.[100] || 0;
        return (
          <Space size={6} wrap>
            <Tag color={statusColor(50)}>Отпр.: {sent}</Tag>
            <Tag color={statusColor(100)}>Готово: {done}</Tag>
          </Space>
        );
      },
      sorter: (a, b) => {
        const av = (a?.vl06Stats?.[50] || 0) + (a?.vl06Stats?.[100] || 0);
        const bv = (b?.vl06Stats?.[50] || 0) + (b?.vl06Stats?.[100] || 0);
        return av - bv;
      },
    },
    {
      title: "Прогресс, %",
      width: 120,
      align: "right",
      render: (_, r) => {
        const total = r.vl06Total || 0;
        const sent = r?.vl06Stats?.[50] || 0;
        const done = r?.vl06Stats?.[100] || 0;
        const perc = total ? Math.round(((sent + done) / total) * 100) : 0;
        return `${perc}%`;
      },
      sorter: (a, b) => {
        const ap = a.vl06Total
          ? ((a?.vl06Stats?.[50] || 0) + (a?.vl06Stats?.[100] || 0)) /
            a.vl06Total
          : 0;
        const bp = b.vl06Total
          ? ((b?.vl06Stats?.[50] || 0) + (b?.vl06Stats?.[100] || 0)) /
            b.vl06Total
          : 0;
        return ap - bp;
      },
    },
  ];

  const columns = view === "Компактно" ? columnsCompact : columnsWide;

  const exportExcel = async () => {
    if (!filtered.length) {
      message.info("Нет данных для экспорта.");
      return;
    }
    await exportApp3ReportExcel(filtered, {
      filename: `Отчёт_Приложение_3_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`,
    });
    message.success("Экспорт выполнен.");
  };

  // ЕДИНЫЙ набор опций для Select (без старых пунктов)
  const statusOptions = [
    { value: "all", label: "Статус: все" },
    {
      label: "Служебная записка",
      options: Object.entries(STATUS_FOR_ZAPISKA).map(([code, txt]) => ({
        value: `z-${code}`,
        label: txt,
      })),
    },
    {
      label: "Приложение №3",
      options: Object.entries(STATUS_FOR_APP3).map(([code, txt]) => ({
        value: `a-${code}`,
        label: txt,
      })),
    },
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontSize: 12 } }}>
      <div style={{ padding: 16, background: "#f5f7fa", minHeight: "100%" }}>
        <Card
          bordered={false}
          style={{ boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Отчёт · Приложение № 3
            </Title>
            <Space>
              <Segmented
                options={["Компактно", "Подробно"]}
                value={view}
                onChange={setView}
              />
              <Input
                allowClear
                placeholder="Поиск по всем полям…"
                prefix={<SearchOutlined />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: 340 }}
              />
              <Select
                value={statusFilter}
                style={{ width: 260 }}
                onChange={setStatusFilter}
                options={statusOptions}
                showSearch
                optionFilterProp="label"
              />
              <Tooltip title="Обновить">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refresh}
                  loading={loading}
                />
              </Tooltip>
              <Button icon={<DownloadOutlined />} onClick={exportExcel}>
                Экспорт (Excel)
              </Button>
            </Space>
          </div>

          <Table
            style={{ marginTop: 12 }}
            size="small"
            rowKey="key"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            scroll={{ x: "max-content" }}
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
        </Card>
      </div>
    </ConfigProvider>
  );
}
