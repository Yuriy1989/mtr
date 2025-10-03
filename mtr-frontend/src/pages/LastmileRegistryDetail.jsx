import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiLastmile } from "../utils/ApiLastmile";
import { STATUS_FOR_ZAPISKA, statusColor } from "../constants/status";
import exportApp3SummaryExcel from "../utils/export/exportApp3SummaryExcel";

const { Title } = Typography;

export default function LastmileRegistryDetail() {
  const { message } = App.useApp();
  const { appId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [appInfo, setAppInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState({ current: 1, pageSize: 50 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiLastmile.registryDetail(Number(appId));
      const data = res?.data;
      setAppInfo(data?.application || null);
      setRows(data?.rows || []);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Не удалось загрузить реестр");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [appId]);

  const filtered = rows.filter((r) => {
    const s = query.trim().toLowerCase();
    if (!s) return true;
    return [
      r.nameMTR,
      r.storage,
      r.transportNumber,
      r.transit,
      r.decision?.reason,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(s);
  });

  const columns = [
    { title: "Название", dataIndex: "nameMTR", width: 280, fixed: "left", ellipsis: true },
    { title: "Склад", dataIndex: "storage", width: 120, align: "center" },
    { title: "Объём", dataIndex: "supplyVolume", width: 120, align: "right",
      render: (v) => (Number.isFinite(v) ? v : "—") },
    { title: "Отгружено", dataIndex: "shippedQty", width: 120, align: "right",
      render: (v) => (v != null ? v : "—") },
    { title: "Получатель", dataIndex: "transit", width: 220, ellipsis: true },
    { title: "Груз (тип+№)", width: 180, render: (_, r) => {
        const t = r.format === "container" ? "Конт." : r.format === "auto" ? "Авто" : "";
        return t || r.transportNumber ? `${t}${t ? " " : ""}${r.transportNumber || ""}` : "—";
      }
    },
    { title: "Решение", width: 150, render: (_, r) => {
        const d = r.decision;
        if (!d) return <Tag>—</Tag>;
        return d.accepted
          ? <Tag color="green">Принят</Tag>
          : <Tag color="volcano">Не принят</Tag>;
      }
    },
    { title: "Причина (если не принят)", width: 280, render: (_, r) => r.decision?.reason || "—" },
    { title: "Дата решения", width: 160, align: "center",
      render: (_, r) => r.decision?.decidedAt ? dayjs(r.decision.decidedAt).format("DD.MM.YYYY HH:mm") : "—" },
  ];

  const exportExcel = async () => {
    if (!filtered.length) {
      message.info("Нет данных для экспорта");
      return;
    }
    const shaped = filtered.map((r) => ({
      appId: appInfo?.id,
      zapiskaId: appInfo?.zapiskaId,
      nameMTR: r.nameMTR,
      storage: r.storage,
      supplyVolume: r.supplyVolume,
      shippedQty: r.shippedQty,
      transit: r.transit,
      format: r.format,
      transportNumber: r.transportNumber,
      accepted: r.decision?.accepted ? "Да" : r.decision ? "Нет" : "",
      reason: r.decision?.reason || "",
    }));
    await exportApp3SummaryExcel(shaped);
    message.success("Экспорт выполнен");
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
      <div style={{ padding: 16 }}>
        <Card bordered={false} style={{ boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Назад
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Реестр · Приложение №3 #{appInfo?.id} · СЗ {appInfo?.zapiskaId}
              </Title>
              {appInfo?.status != null && (
                <Tag color={statusColor(appInfo.status)}>
                  {STATUS_FOR_ZAPISKA[appInfo.status] ?? appInfo.status}
                </Tag>
              )}
            </Space>
            <Space>
              <Input
                allowClear
                placeholder="Поиск по позициям…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: 300 }}
              />
              <Tooltip title="Экспорт в Excel">
                <Button icon={<PrinterOutlined />} onClick={exportExcel}>
                  Excel
                </Button>
              </Tooltip>
            </Space>
          </Space>

          <Table
            style={{ marginTop: 12 }}
            size="small"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            pagination={{
              current: page.current,
              pageSize: page.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["25", "50", "100", "200"],
              showTotal: (t) => `Всего: ${t}`,
              onChange: (current, pageSize) =>
                setPage({ current, pageSize }),
            }}
            scroll={{ x: "max-content", y: 560 }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
