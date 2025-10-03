// src/pages/main.js
import React, { useMemo, useState, useEffect } from "react";
import { Card, ConfigProvider, Row, Col, Segmented, Space, Tag, Statistic, Divider, App } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { MRT_Localization_RU } from "material-react-table/locales/ru";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";

import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as ApiApplications } from "../utils/ApiApplications";
import { api as ApiRegions } from "../utils/ApiDirectories";
import { api as ApiTrans } from "../utils/ApiTransports"; // используется опционально, если есть
import { STATUS_FOR_APP3, STATUS_FOR_ZAPISKA, normalizeStatus, statusColor } from "../constants/status";
import "../theme/Application.css";

dayjs.locale("ru");

// Chart.js регистрируем модули
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler
);

// ————— helpers —————
const fmtDay = (d) => dayjs(d).format("DD.MM");

export default function Main() {
  const { message } = App.useApp();

  // период: 7д = по умолчанию
  const [period, setPeriod] = useState("7d");

  // данные
  const [apps, setApps] = useState([]); // из ApiApplications.getApplications() (детализированный список)
  const [zapiski, setZapiski] = useState([]); // из ApiZapiski.getAllZapiski()
  const [regions, setRegions] = useState([]); // справочник
  const [trans, setTrans] = useState({ 10: [], 20: [], 30: [] }); // заявки на транспорт по статусам (может не быть — не критично)
  const [loading, setLoading] = useState(false);

  // период -> начальная дата
  const since = useMemo(() => {
    if (period === "7d") return dayjs().subtract(7, "day").startOf("day");
    if (period === "30d") return dayjs().subtract(30, "day").startOf("day");
    if (period === "90d") return dayjs().subtract(90, "day").startOf("day");
    return dayjs("1970-01-01");
  }, [period]);

  // загрузка
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [appsRes, zRes, regs] = await Promise.all([
          ApiApplications.getApplications().catch(() => []),
          ApiZapiski.getAllZapiski().catch(() => ({ data: [] })),
          ApiRegions.getRegionsAll().catch(() => []),
        ]);

        if (!mounted) return;

        setApps(Array.isArray(appsRes) ? appsRes : []);
        setZapiski(Array.isArray(zRes?.data) ? zRes.data : []);
        setRegions(Array.isArray(regs) ? regs : []);

        // заявки на транспорт — пробуем подтянуть по 3 статусам
        const pullTrans = async (s) => {
          try {
            const list = await ApiTrans.list(s);
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        };
        const [t10, t20, t30] = await Promise.all([pullTrans(10), pullTrans(20), pullTrans(30)]);
        if (mounted) setTrans({ 10: t10, 20: t20, 30: t30 });
      } catch (e) {
        console.error(e);
        message.error("Не удалось загрузить данные для дашборда");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [message]);

  // справочник: storageCode -> regionName
  const storageToRegionName = useMemo(() => {
    const map = new Map();
    (regions || []).forEach((r) => {
      (r.codeRegion || []).forEach((code) => {
        if (!map.has(code)) map.set(code, r.nameRegion);
      });
    });
    return map;
  }, [regions]);

  // фильтрация по периоду (по createdAt приложения/записки)
  const appsInPeriod = useMemo(
    () =>
      (apps || []).filter((x) =>
        dayjs(x?.application?.createdAt || x?.application?.updatedAt || null).isAfter(since)
      ),
    [apps, since]
  );
  const zapisInPeriod = useMemo(
    () => (zapiski || []).filter((z) => dayjs(z?.createdAt || null).isAfter(since)),
    [zapiski, since]
  );

  // KPI
  const kpi = useMemo(() => {
    const totalApps = appsInPeriod.length;
    const shippedFull = appsInPeriod.filter((x) => normalizeStatus(x?.application?.status) === 50).length;
    const shippedPart = appsInPeriod.filter((x) => normalizeStatus(x?.application?.status) === 60).length;
    const withRemainders = appsInPeriod.reduce((s, x) => s + (x?.remainderCount > 0 ? 1 : 0), 0);
    const totalZapiski = zapisInPeriod.length;

    // заявки на транспорт
    const t10 = (trans[10] || []).filter((t) => dayjs(t?.createdAt || null).isAfter(since)).length;
    const t20 = (trans[20] || []).filter((t) => dayjs(t?.createdAt || null).isAfter(since)).length;
    const t30 = (trans[30] || []).filter((t) => dayjs(t?.createdAt || null).isAfter(since)).length;

    return { totalApps, shippedFull, shippedPart, withRemainders, totalZapiski, t10, t20, t30 };
  }, [appsInPeriod, zapisInPeriod, trans, since]);

  // тренд по дням: приложения и служебки
  const trend = useMemo(() => {
    // собираем список дней в периоде
    const days = [];
    const d0 = since.clone().startOf("day");
    const d1 = dayjs().endOf("day");
    for (let d = d0; d.isBefore(d1); d = d.add(1, "day")) days.push(d.clone());

    const countByDay = (arr, getDate) => {
      const m = new Map(days.map((d) => [d.format("YYYY-MM-DD"), 0]));
      (arr || []).forEach((x) => {
        const d = dayjs(getDate(x));
        const k = d.format("YYYY-MM-DD");
        if (m.has(k)) m.set(k, (m.get(k) || 0) + 1);
      });
      return days.map((d) => m.get(d.format("YYYY-MM-DD")) || 0);
    };

    const appsSeries = countByDay(appsInPeriod, (x) => x?.application?.createdAt || x?.application?.updatedAt);
    const zapSeries = countByDay(zapisInPeriod, (z) => z?.createdAt);

    return {
      labels: days.map((d) => fmtDay(d)),
      appsSeries,
      zapSeries,
    };
  }, [appsInPeriod, zapisInPeriod, since]);

  // распределение статусов по приложениям
  const appStatusDist = useMemo(() => {
    const map = new Map();
    Object.keys(STATUS_FOR_APP3).forEach((k) => map.set(Number(k), 0));
    (appsInPeriod || []).forEach((a) => {
      const s = normalizeStatus(a?.application?.status);
      map.set(s, (map.get(s) || 0) + 1);
    });
    const labels = Object.keys(STATUS_FOR_APP3).map((k) => STATUS_FOR_APP3[k]);
    const values = Object.keys(STATUS_FOR_APP3).map((k) => map.get(Number(k)) || 0);
    return { labels, values };
  }, [appsInPeriod]);

  // разрез по направлениям (регионам)
  const byRegion = useMemo(() => {
    const map = new Map();
    (appsInPeriod || []).forEach((a) => {
      const storages = Array.isArray(a?.storages) ? a.storages : [];
      const names = [...new Set(storages.map((s) => storageToRegionName.get(s)).filter(Boolean))];
      if (!names.length) names.push("—");
      names.forEach((n) => map.set(n, (map.get(n) || 0) + 1));
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: entries.map(([n]) => n),
      values: entries.map(([, v]) => v),
    };
  }, [appsInPeriod, storageToRegionName]);

  // таблица по приложениям — компактный набор колонок
  const tableColumns = useMemo(
    () => [
      { accessorKey: "applicationId", header: "Прил. №3", size: 80, enableSorting: true },
      { accessorKey: "createdAt", header: "Создано", size: 100, enableSorting: true },
      { accessorKey: "status", header: "Статус", size: 110 },
      { accessorKey: "rowsCount", header: "Строк", size: 70 },
      { accessorKey: "remainderCount", header: "Остатки", size: 80 },
      { accessorKey: "waves", header: "Заявок (итераций)", size: 110 },
      { accessorKey: "direction", header: "Направление (регион)", size: 260 },
      { accessorKey: "zapiskaId", header: "СЗ №", size: 80 },
      { accessorKey: "author", header: "Автор СЗ", size: 180 },
    ],
    []
  );

  const tableData = useMemo(() => {
    const fmt = (iso) => (iso ? dayjs(iso).format("DD.MM.YYYY") : "—");

    return (appsInPeriod || [])
      .slice() // копия, чтобы не портить исходник
      .sort((a, b) => dayjs(b?.application?.createdAt).valueOf() - dayjs(a?.application?.createdAt).valueOf())
      .slice(0, 200) // ограничим до 200 строк в таблице
      .map((x) => {
        const a = x?.application || {};
        const z = x?.zapiska || {};
        const status = normalizeStatus(a.status);
        const storages = Array.isArray(x?.storages) ? x.storages : [];
        const dirNames = [...new Set(storages.map((s) => storageToRegionName.get(s)).filter(Boolean))];
        return {
          applicationId: a.id,
          createdAt: fmt(a.createdAt),
          status: STATUS_FOR_APP3[status] || status,
          rowsCount: x?.rowsCount ?? 0,
          remainderCount: x?.remainderCount ?? 0,
          waves: x?.waves ?? (x?.transport ? 1 : 0),
          direction: dirNames.length ? dirNames.join(", ") : "—",
          zapiskaId: z?.id ?? "—",
          author: z?.user
            ? [z.user.surname, z.user.firstName, z.user.lastName].filter(Boolean).join(" ")
            : "—",
        };
      });
  }, [appsInPeriod, storageToRegionName]);

  const mrt = useMaterialReactTable({
    columns: tableColumns,
    data: tableData,
    localization: MRT_Localization_RU,
    enableColumnFilterModes: false,
    enableColumnOrdering: true,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableStickyHeader: true,
    muiTableContainerProps: { sx: { maxHeight: 440 } },
    initialState: { density: "compact", pagination: { pageSize: 20, pageIndex: 0 } },
  });

  // ——— chart datasets ———
  const lineData = useMemo(
    () => ({
      labels: trend.labels,
      datasets: [
        {
          label: "Приложения №3",
          data: trend.appsSeries,
          borderWidth: 2,
          fill: false,
        },
        {
          label: "Служебные записки",
          data: trend.zapSeries,
          borderWidth: 2,
          fill: false,
        },
      ],
    }),
    [trend]
  );

  const barStatusData = useMemo(
    () => ({
      labels: appStatusDist.labels,
      datasets: [
        {
          label: "Кол-во приложений",
          data: appStatusDist.values,
          backgroundColor: "rgba(22,119,255,0.2)",
          borderColor: "rgba(22,119,255,1)",
          borderWidth: 1,
        },
      ],
    }),
    [appStatusDist]
  );

  const doughnutRegionsData = useMemo(
    () => ({
      labels: byRegion.labels,
      datasets: [
        {
          data: byRegion.values,
          backgroundColor: byRegion.labels.map((_, i) => `hsl(${(i * 37) % 360} 70% 55%)`),
        },
      ],
    }),
    [byRegion]
  );

  // транспорт (если не загрузился — будет нули)
  const transportPieData = useMemo(
    () => ({
      labels: ["На согласовании", "Согласовано", "Не согласовано"],
      datasets: [
        {
          data: [kpi.t10, kpi.t20, kpi.t30],
          backgroundColor: ["#faad14", "#52c41a", "#ff4d4f"],
        },
      ],
    }),
    [kpi.t10, kpi.t20, kpi.t30]
  );

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 8, fontSize: 12 },
        components: {
          Card: { headerFontSize: 14 },
        },
      }}
    >
      <div style={{ padding: 16 }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 12 }} align="center">
          <h3 style={{ margin: 0 }}>Дашборд</h3>
          <Segmented
            options={[
              { label: "7 дней", value: "7d" },
              { label: "30 дней", value: "30d" },
              { label: "90 дней", value: "90d" },
              { label: "Все", value: "all" },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </Space>

        {/* KPI */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Приложений №3" value={kpi.totalApps} />
              <Divider style={{ margin: "8px 0" }} />
              <Space size={4} wrap>
                <Tag color={statusColor(50)}>Отправлено полностью: {kpi.shippedFull}</Tag>
                <Tag color={statusColor(60)}>Отправлено частично: {kpi.shippedPart}</Tag>
                <Tag color="orange">С остатками: {kpi.withRemainders}</Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Служебных записок" value={kpi.totalZapiski} />
              <Divider style={{ margin: "8px 0" }} />
              <Space size={4} wrap>
                {Object.entries(STATUS_FOR_ZAPISKA).map(([s, label]) => {
                  const cnt = zapisInPeriod.filter((z) => normalizeStatus(z.status) === Number(s)).length;
                  return (
                    <Tag key={s} color={statusColor(Number(s))}>
                      {label}: {cnt}
                    </Tag>
                  );
                })}
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Заявки на транспорт" value={kpi.t10 + kpi.t20 + kpi.t30} />
              <Divider style={{ margin: "8px 0" }} />
              <Space size={4} wrap>
                <Tag color="#faad14">На согласовании: {kpi.t10}</Tag>
                <Tag color="#52c41a">Согласовано: {kpi.t20}</Tag>
                <Tag color="#ff4d4f">Не согласовано: {kpi.t30}</Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Период"
                value={
                  period === "all"
                    ? "все время"
                    : `с ${since.format("DD.MM.YYYY")} по ${dayjs().format("DD.MM.YYYY")}`
                }
              />
              <Divider style={{ margin: "8px 0" }} />
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
                Данные агрегируются на клиенте для быстроты. Таблица ограничена 200 строками.
              </div>
            </Card>
          </Col>
        </Row>

        {/* Графики */}
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col xs={24} md={12}>
            <Card title="Тренд (по дням)" bodyStyle={{ height: 280 }}>
              <div style={{ height: 240 }}>
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                    elements: { point: { radius: 2 } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Статусы Приложений №3" bodyStyle={{ height: 280 }}>
              <div style={{ height: 240 }}>
                <Bar
                  data={barStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Направления (ТОП-10 регионов)" bodyStyle={{ height: 280 }}>
              <div style={{ height: 240 }}>
                <Doughnut
                  data={doughnutRegionsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Заявки на транспорт по статусам" bodyStyle={{ height: 280 }}>
              <div style={{ height: 240 }}>
                <Doughnut
                  data={transportPieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Таблица по приложениям */}
        <Card style={{ marginTop: 12 }} title="Приложения №3 (последние в периоде)">
          <MaterialReactTable table={mrt} />
        </Card>
      </div>
    </ConfigProvider>
  );
}
