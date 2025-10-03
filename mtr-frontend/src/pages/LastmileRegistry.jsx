import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Card,
  ConfigProvider,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiLastmile } from "../utils/ApiLastmile";
import {
  STATUS_FOR_ZAPISKA,
  STATUS_FOR_APP3,
  statusColor,
} from "../constants/status";

const { Title } = Typography;

// безопасный парсер даты: ISO, число-таймстамп, либо null
const toDayjs = (v) => {
  if (!v && v !== 0) return null;
  const d1 = dayjs(v);
  if (d1.isValid()) return d1;
  const n = Number(v);
  const d2 = Number.isFinite(n) ? dayjs(n) : null;
  return d2 && d2.isValid() ? d2 : null;
};

export default function LastmileRegistry() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState("all");
  const navigate = useNavigate();

  // управляемая пагинация
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiLastmile.registry({ days });
      let data = res?.data ?? [];
      if (status !== "all") {
        const code = Number(status);
        data = data.filter((x) => Number(x.status) === code);
      }
      setRows(data);
      // current не сбрасываем — ниже авто-подстройка по длине
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
  }, [days, status]);

  const searchLower = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!searchLower) return rows;
    return rows.filter((r) =>
      [
        `${r.id ?? r.appId ?? r.applicationId ?? ""}`,
        `${r.zapiskaId ?? ""}`,
        STATUS_FOR_ZAPISKA[r.status] ?? r.status ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchLower)
    );
  }, [rows, searchLower]);

  // если после фильтрации текущая страница «вылетела» — поджимаем
  useEffect(() => {
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
    if (pagination.current > maxPage) {
      setPagination((p) => ({ ...p, current: maxPage }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, pagination.pageSize]);

  const columns = [
    {
      title: "СЗ",
      width: 220,
      fixed: "left",
      render: (_, r) => {
        if (!r.zapiskaId) return "—";
        const zdt =
          toDayjs(
            r.zapiskaCreatedAt ??
              r.zapCreatedAt ??
              r.createdAt ??
              r?.zapiska?.createdAt
          ) || null;
        const dateStr = zdt ? zdt.format("DD.MM.YYYY") : "—";
        return (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() =>
              navigate(`/editZapiskaFromImport/${r.zapiskaId}`, {
                state: { zapiskaId: r.zapiskaId },
              })
            }
          >
            № {r.zapiskaId} от {dateStr}
          </Button>
        );
      },
    },
    {
      title: "Приложение № 3",
      width: 240,
      fixed: "left",
      render: (_, r) => {
        const appId = r.appId ?? r.applicationId ?? r.id;
        if (!appId) return "—";
        const adt =
          toDayjs(
            r.appCreatedAt ??
              r.applicationCreatedAt ??
              r.createdAt ??
              r?.application?.createdAt
          ) || null;
        const dateStr = adt ? adt.format("DD.MM.YYYY") : "—";
        return (
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() =>
              navigate(`/application/app3/new/${r.zapiskaId}`, {
                state: { linkId: r.zapiskaId, appId },
              })
            }
          >
            № {appId} от {dateStr}
          </Button>
        );
      },
    },
    {
      title: "Статус",
      dataIndex: "status",
      width: 260,
      render: (v) => (
        <Tag color={statusColor(v)}>{STATUS_FOR_ZAPISKA[v] ?? v}</Tag>
      ),
    },
    {
      title: "Обновлён",
      dataIndex: "updatedAt",
      width: 160,
      render: (v) => {
        const d = toDayjs(v);
        return d ? d.format("DD.MM.YYYY HH:mm") : "—";
      },
    },
    {
      title: "Создан",
      dataIndex: "createdAt",
      width: 160,
      render: (v) => {
        const d = toDayjs(v);
        return d ? d.format("DD.MM.YYYY HH:mm") : "—";
      },
    },
    {
      title: "Действия",
      fixed: "right",
      width: 130,
      render: (_, r) => {
        const appId = r.id ?? r.appId ?? r.applicationId;
        if (!appId) return "—";
        return (
          <Button
            type="link"
            onClick={() => navigate(`/lastmile/registry/${appId}`)}
            style={{ padding: 0 }}
          >
            Просмотр
          </Button>
        );
      },
    },
  ];

  const COMPLETION_CODES = [100, 110, 115, 120];
  const statusOptions = [
    { value: "all", label: `Статус: все (${COMPLETION_CODES.join(",")})` },
    ...COMPLETION_CODES.map((code) => ({
      value: String(code),
      label: `${STATUS_FOR_APP3[code]} (${code})`,
    })),
  ];

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
      <div style={{ padding: 16 }}>
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
              Последняя миля · Реестр
            </Title>
            <Space>
              <Input
                allowClear
                placeholder="Поиск (№ прил., СЗ, статус)…"
                prefix={<SearchOutlined />}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ width: 280 }}
              />
              <Select
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ width: 300 }}
                options={statusOptions}
              />
              <Select
                value={days}
                onChange={(v) => {
                  setDays(v);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ width: 160 }}
                options={[
                  { value: 7, label: "За 7 дней" },
                  { value: 30, label: "За 30 дней" },
                  { value: 90, label: "За 90 дней" },
                ]}
              />
              <Tooltip title="Обновить">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={load}
                  loading={loading}
                />
              </Tooltip>
            </Space>
          </div>

          <Table
            style={{ marginTop: 12 }}
            size="small"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} из ${total}`,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
            }}
            scroll={{ x: "max-content", y: 560 }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
