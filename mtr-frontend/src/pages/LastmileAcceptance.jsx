import { useEffect, useMemo, useState } from "react";
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
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiLastmile } from "../utils/ApiLastmile";
import { STATUS_FOR_ZAPISKA, statusColor } from "../constants/status";
import { useNavigate } from "react-router-dom";

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

export default function LastmileAcceptance() {
  const { message } = App.useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState("all");

  // управляемая пагинация
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const load = async () => {
    setLoading(true);
    try {
      const s = status === "all" ? undefined : Number(status);
      const res = await apiLastmile.pending({ days, status: s });
      setRows(res?.data ?? []);
      // не сбрасываю current — ниже авто-подстройка по длине
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить список на приёмку");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /*eslint-disable-next-line*/
  }, [days, status]);

  const search = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) => {
      // фолбэк на id приложения
      const appId = r.appId ?? r.applicationId ?? r.id;
      const hay = [
        appId,
        r.zapiskaId,
        STATUS_FOR_ZAPISKA[r.status] || r.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(search);
    });
  }, [rows, search]);

  // если после фильтрации текущая страница «вылетела» за пределы — поджимаем
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
        // фолбэки по названию полей даты СЗ
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
        // у бэка часто appId = id приложения; делаем фолбэк
        const appId = r.appId ?? r.applicationId ?? r.id;
        if (!appId) return "—";
        // фолбэки по дате приложения
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
              // маршрут ожидает :id = zapiskaId, appId пробрасываем в state
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
      width: 200,
      render: (v) => (
        <Tag color={statusColor(v)}>{STATUS_FOR_ZAPISKA[v] ?? v}</Tag>
      ),
    },
    {
      title: "Отгружено позиций",
      dataIndex: "shippedCount",
      width: 160,
      align: "center",
    },
    {
      title: "Создано",
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
      width: 140,
      render: (_, r) => (
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate(`/lastmile/acceptance/${r.id}`)}
        >
          Открыть
        </Button>
      ),
    },
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
              Последняя миля · Приемка
            </Title>
            <Space>
              <Input
                allowClear
                placeholder="Поиск (№ прил., СЗ, статус)…"
                prefix={<SearchOutlined />}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  // на поиске обычно удобно сбрасывать на 1 страницу
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ width: 300 }}
              />
              <Select
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ width: 240 }}
                options={[
                  { value: "all", label: "Статус: Отправлено + Частично" },
                  { value: "50", label: "Отправлено (50)" },
                  { value: "60", label: "Отправлено частично (60)" },
                ]}
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
                  { value: 14, label: "За 14 дней" },
                  { value: 30, label: "За 30 дней" },
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
              showTotal: (total, range) => `${range[0]}–${range[1]} из ${total}`,
              onChange: (page, pageSize) =>
                setPagination({ current: page, pageSize }),
            }}
            scroll={{ x: "max-content", y: 520 }}
          />
        </Card>
      </div>
    </ConfigProvider>
  );
}
