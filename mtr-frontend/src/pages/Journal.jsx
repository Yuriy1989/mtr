import { useEffect, useMemo, useState } from "react";
import { Card, Space, DatePicker, Input, Button, Table, Tag, App, ConfigProvider } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { api as apiJournal } from "../utils/ApiJournal";

dayjs.locale("ru");
const { RangePicker } = DatePicker;

const actionColor = (a = "") => {
  const k = String(a).toLowerCase();
  if (k.includes("create") || k.includes("add")) return "green";
  if (k.includes("update") || k.includes("edit")) return "blue";
  if (k.includes("delete") || k.includes("remove")) return "red";
  if (k.includes("login") || k.includes("auth")) return "geekblue";
  return "default";
};

export default function Journal() {
  const { message } = App.useApp();

  // По умолчанию: за сутки
  const [range, setRange] = useState([dayjs().subtract(1, "day").startOf("day"), dayjs().endOf("day")]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sorter, setSorter] = useState({ field: "createdAt", order: "descend" });

  const fetchData = async (p = page, ps = pageSize, s = sorter) => {
    try {
      setLoading(true);
      const [start, end] = range || [];
      const params = {
        start: start ? start.toISOString() : undefined,
        end: end ? end.toISOString() : undefined,
        q: q || undefined,
        page: p,
        pageSize: ps,
        sortField: s?.field || "createdAt",
        sortOrder: s?.order === "ascend" ? "ASC" : "DESC",
      };
      const data = await apiJournal.list(params);
      setRows(data.items || []);
      setTotal(Number(data.total || 0));
      setPage(Number(data.page || p));
      setPageSize(Number(data.pageSize || ps));
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить журнал");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, pageSize, sorter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Дата/время",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 170,
        sorter: true,
        render: (v) =>
          v ? dayjs(v).format("DD.MM.YYYY HH:mm:ss") : "—",
      },
      {
        title: "Пользователь",
        key: "user",
        width: 220,
        render: (_, r) =>
          r.userName
            ? `${r.userName}${r.userId ? ` (id: ${r.userId})` : ""}`
            : r.userId
            ? `ID ${r.userId}`
            : "—",
      },
      {
        title: "Действие",
        dataIndex: "action",
        key: "action",
        width: 160,
        render: (a) => <Tag color={actionColor(a)}>{a || "—"}</Tag>,
      },
      { title: "Сущность", dataIndex: "entity", key: "entity", width: 160 },
      { title: "ID", dataIndex: "entityId", key: "entityId", width: 120 },
      {
        title: "Описание",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
      },
      { title: "IP", dataIndex: "ip", key: "ip", width: 120 },
      { title: "Маршрут", dataIndex: "route", key: "route", width: 200, ellipsis: true },
      { title: "Метод", dataIndex: "method", key: "method", width: 90 },
      {
        title: "Статус",
        dataIndex: "success",
        key: "success",
        width: 100,
        render: (ok) => (ok ? <Tag color="green">OK</Tag> : <Tag color="red">Ошибка</Tag>),
      },
    ],
    []
  );

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontSize: 12 } }}>
      <Card
        title="Журнал событий"
        extra={
          <Space>
            <RangePicker
              allowClear
              value={range}
              onChange={(v) => setRange(v)}
              format="DD.MM.YYYY HH:mm"
              showTime
              presets={[
                { label: "Сутки", value: [dayjs().subtract(1, "day").startOf("day"), dayjs().endOf("day")] },
                { label: "7 дней", value: [dayjs().subtract(7, "day").startOf("day"), dayjs().endOf("day")] },
                { label: "30 дней", value: [dayjs().subtract(30, "day").startOf("day"), dayjs().endOf("day")] },
              ]}
            />
            <Input.Search
              placeholder="Поиск (пользователь, действие, сущность, описание...)"
              allowClear
              style={{ width: 360 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onSearch={() => fetchData(1, pageSize, sorter)}
            />
            <Button type="primary" onClick={() => fetchData(1, pageSize, sorter)}>
              Показать
            </Button>
          </Space>
        }
      >
        <Table
          className="z-compact"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              fetchData(p, ps, sorter);
            },
          }}
          onChange={(_, __, s) => {
            const next = Array.isArray(s) ? s[0] : s;
            const sr = next?.order
              ? { field: next.field, order: next.order }
              : { field: "createdAt", order: "descend" };
            setSorter(sr);
            fetchData(1, pageSize, sr);
          }}
          expandable={{
            expandedRowRender: (r) =>
              r?.meta ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(r.meta, null, 2)}
                </pre>
              ) : (
                <i>Без дополнительных данных</i>
              ),
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </ConfigProvider>
  );
}
