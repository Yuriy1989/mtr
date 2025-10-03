import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Drawer, List, Typography, Space, Button, Tag, Skeleton, Empty, Tooltip } from "antd";
import { BellOutlined, CheckOutlined, ReloadOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { apiNotifications } from "../../utils/ApiNotifications";
import dayjs from "dayjs";

const { Text } = Typography;

const typeColor = (t) => {
  if (!t) return "default";
  const s = String(t).toLowerCase();
  if (s.includes("error") || s.includes("problem")) return "red";
  if (s.includes("warning") || s.includes("warn")) return "gold";
  if (s.includes("success") || s.includes("ok")) return "green";
  return "blue";
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const timerRef = useRef(null);

  const fetchCount = async () => {
    try {
      setLoadingCount(true);
      const res = await apiNotifications.unreadCount();
      setCount(res?.count ?? 0);
    } catch {
      // ignore
    } finally {
      setLoadingCount(false);
    }
  };

  const fetchPage = async (p = 0) => {
    try {
      setLoading(true);
      const res = await apiNotifications.list({ limit: pageSize, offset: p * pageSize });
      setItems(res?.items || []);
      setTotal(res?.total || 0);
      setPage(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async () => {
    setOpen(true);
    await fetchPage(0);
  };

  const onClose = () => setOpen(false);

  const markRead = async (id) => {
    try {
      await apiNotifications.markRead(id);
      await fetchCount();
      await fetchPage(page);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiNotifications.markAllRead();
      await fetchCount();
      await fetchPage(0);
    } catch {}
  };

  useEffect(() => {
    fetchCount();
    timerRef.current = setInterval(fetchCount, 30_000);
    return () => clearInterval(timerRef.current);
  }, []);

  const totalPages = useMemo(() => Math.ceil(total / pageSize) || 1, [total]);

  return (
    <>
      <Badge count={loadingCount ? 0 : count} overflowCount={99} size="small">
        <BellOutlined
          onClick={openDrawer}
          style={{ fontSize: 18, cursor: "pointer" }}
          aria-label="Уведомления"
        />
      </Badge>

      <Drawer
        title={
          <Space>
            Уведомления
            <Tooltip title="Обновить">
              <Button size="small" icon={<ReloadOutlined />} onClick={() => fetchPage(page)} />
            </Tooltip>
          </Space>
        }
        width={440}
        open={open}
        onClose={onClose}
        extra={
          <Space>
            <Button onClick={markAllRead} icon={<CheckOutlined />}>
              Прочитать всё
            </Button>
          </Space>
        }
      >
        {loading ? (
          <Skeleton active />
        ) : items.length === 0 ? (
          <Empty description="Новых уведомлений нет" />
        ) : (
          <>
            <List
              itemLayout="vertical"
              dataSource={items}
              renderItem={(n) => (
                <List.Item
                  key={n.id}
                  actions={[
                    !n.isRead && (
                      <Button key="read" type="link" onClick={() => markRead(n.id)}>
                        Отметить прочитанным
                      </Button>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <Text strong>{n.title || "Уведомление"}</Text>
                        {n.type && <Tag color={typeColor(n.type)}>{n.type}</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        <ClockCircleOutlined />
                        <Text type="secondary">{dayjs(n.createdAt).format("DD.MM.YYYY HH:mm")}</Text>
                      </Space>
                    }
                  />
                  <div>{n.body}</div>
                </List.Item>
              )}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <Button disabled={page <= 0} onClick={() => fetchPage(page - 1)}>
                Назад
              </Button>
              <Text type="secondary">
                Страница {page + 1} из {totalPages}
              </Text>
              <Button disabled={page + 1 >= totalPages} onClick={() => fetchPage(page + 1)}>
                Вперёд
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
