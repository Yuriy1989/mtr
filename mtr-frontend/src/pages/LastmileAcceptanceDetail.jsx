import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SaveOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { api as apiLastmile } from "../utils/ApiLastmile";
import exportApp3SummaryExcel from "../utils/export/exportApp3SummaryExcel";
import { STATUS_FOR_ZAPISKA, statusColor } from "../constants/status";

const { Title } = Typography;

export default function LastmileAcceptanceDetail() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp(); // <- берём modal из контекста

  const [loading, setLoading] = useState(false);
  const [appInfo, setAppInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [decisions, setDecisions] = useState({}); // rowId -> {accepted, reason}
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // управляемая пагинация
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiLastmile.getAcceptance(Number(appId));
      const data = res?.data;
      setAppInfo(data?.application || null);
      setRows(data?.rows || []);
      const map = {};
      (data?.rows || []).forEach((r) => {
        if (r.decision)
          map[r.id] = {
            accepted: !!r.decision.accepted,
            reason: r.decision.reason || "",
          };
        else map[r.id] = { accepted: true, reason: "" };
      });
      setDecisions(map);
      setSelectedRowKeys([]);
      setPagination((p) => ({ ...p, current: 1 })); // сброс на первую страницу
    } catch (e) {
      console.error(e);
      message.error("Не удалось загрузить карточку приёмки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /*eslint-disable-next-line*/
  }, [appId]);

  const setDecision = (rowId, patch) => {
    setDecisions((old) => ({
      ...old,
      [rowId]: { ...(old[rowId] || {}), ...patch },
    }));
  };

  // ---------- Массовые операции ----------
  const applyBulk = (ids, patch) => {
    setDecisions((old) => {
      const next = { ...old };
      ids.forEach((id) => {
        next[id] = { ...(next[id] || {}), ...patch(id, next[id]) };
      });
      return next;
    });
  };

  const bulkAccept = (scope = "all") => {
    const ids =
      scope === "selected" && selectedRowKeys.length
        ? selectedRowKeys
        : rows.map((r) => r.id);
    if (!ids.length) return;
    applyBulk(ids, () => ({ accepted: true, reason: "" }));
  };

  const bulkReject = (scope = "all") => {
    const ids =
      scope === "selected" && selectedRowKeys.length
        ? selectedRowKeys
        : rows.map((r) => r.id);
    if (!ids.length) return;

    let reason = "";
    modal.confirm({
      title: "Массовая отметка «Не принят»",
      content: (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 8, color: "rgba(0,0,0,.65)" }}>
            Укажите общую причину (её можно будет изменить в конкретной строке):
          </div>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            onChange={(e) => (reason = e.target.value)}
            placeholder="Например: повреждение упаковки / недостача / пересортица…"
          />
        </div>
      ),
      okText: "Применить",
      cancelText: "Отмена",
      onOk: () => {
        applyBulk(ids, () => ({
          accepted: false,
          reason: (reason || "").trim(),
        }));
      },
    });
  };

  const clearSelection = () => setSelectedRowKeys([]);

  const finish = async () => {
    // валидация: по rejected нужна причина
    for (const r of rows) {
      const d = decisions[r.id];
      if (d && d.accepted === false && !(d.reason || "").trim()) {
        message.warning(`Укажите причину для позиции «${r.nameMTR}»`);
        return;
      }
    }

    modal.confirm({
      title: "Завершить приёмку?",
      content: "Статусы будут выставлены для Прил.№3, СЗ и позиций VL06.",
      okText: "Завершить",
      cancelText: "Отмена",
      onOk: async () => {
        try {
          setLoading(true);
          const payload = rows.map((r) => ({
            tableApplicationRowId: r.id,
            accepted: !!decisions[r.id]?.accepted,
            reason: decisions[r.id]?.reason || null,
          }));
          const res = await apiLastmile.accept(Number(appId), payload);
          message.success("Приёмка завершена");
          const st = res?.data?.status;
          if (st != null) {
            modal.info({
              title: "Итоговый статус",
              content: (
                <Tag color={statusColor(st)}>
                  {STATUS_FOR_ZAPISKA[st] ?? st}
                </Tag>
              ),
            });
          }
          navigate("/lastmile/acceptance");
        } catch (e) {
          console.error(e);
          message.error(e?.message || "Не удалось завершить приёмку");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const exportExcel = async () => {
    const source =
      selectedRowKeys.length > 0
        ? rows.filter((r) => selectedRowKeys.includes(r.id))
        : rows;

    if (!source.length) {
      message.info("Нет строк для экспорта.");
      return;
    }

    const shaped = source.map((r) => ({
      appId: appInfo?.id,
      zapiskaId: appInfo?.zapiskaId,
      nameMTR: r.nameMTR,
      storage: r.storage,
      supplyVolume: r.supplyVolume,
      shippedQty: r.shippedQty,
      transit: r.transit,
      format: r.format,
      transportNumber: r.transportNumber,
    }));
    await exportApp3SummaryExcel(shaped);
    message.success("Экспорт в Excel выполнен");
  };

  const columns = [
    {
      title: "Название",
      dataIndex: "nameMTR",
      width: 280,
      fixed: "left",
      ellipsis: true,
    },
    { title: "Склад", dataIndex: "storage", width: 120, align: "center" },
    { title: "Объём", dataIndex: "supplyVolume", width: 120, align: "right" },
    { title: "Отгружено", dataIndex: "shippedQty", width: 120, align: "right" },
    { title: "Получатель", dataIndex: "transit", width: 200, ellipsis: true },
    {
      title: "Решение",
      width: 180,
      render: (_, r) => (
        <Select
          value={decisions[r.id]?.accepted ? "yes" : "no"}
          onChange={(v) => setDecision(r.id, { accepted: v === "yes" })}
          options={[
            {
              value: "yes",
              label: (
                <span>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Принят
                </span>
              ),
            },
            {
              value: "no",
              label: (
                <span>
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} /> Не принят
                </span>
              ),
            },
          ]}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: "Причина (если не принят)",
      width: 300,
      render: (_, r) => (
        <Input
          placeholder="Укажите причину"
          value={decisions[r.id]?.reason}
          onChange={(e) => setDecision(r.id, { reason: e.target.value })}
          disabled={decisions[r.id]?.accepted !== false}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
      <div style={{ padding: 16 }}>
        <Card
          bordered={false}
          style={{ boxShadow: "0 6px 18px rgba(0,0,0,.06)" }}
        >
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space wrap>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Назад
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Приёмка · Приложение №3 #{appInfo?.id} · СЗ {appInfo?.zapiskaId}
              </Title>
              {appInfo?.status != null && (
                <Tag color={statusColor(appInfo.status)}>
                  {STATUS_FOR_ZAPISKA[appInfo.status] ?? appInfo.status}
                </Tag>
              )}
            </Space>

            <Space wrap>
              <Tooltip title="Отметить все позиции как «Принят»">
                <Button onClick={() => bulkAccept("all")}>
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Принять все
                </Button>
              </Tooltip>
              <Tooltip title="Отметить все позиции как «Не принят» (с общей причиной)">
                <Button danger onClick={() => bulkReject("all")}>
                  <CloseCircleOutlined /> Не принять все
                </Button>
              </Tooltip>

              <Tooltip title="Отметить выбранные строки как «Принят»">
                <Button
                  onClick={() => bulkAccept("selected")}
                  disabled={!selectedRowKeys.length}
                >
                  <CheckCircleOutlined style={{ color: "#52c41a" }} /> Принять выбранные
                </Button>
              </Tooltip>
              <Tooltip title="Отметить выбранные строки как «Не принят» (с общей причиной)">
                <Button
                  danger
                  onClick={() => bulkReject("selected")}
                  disabled={!selectedRowKeys.length}
                >
                  <CloseCircleOutlined /> Не принять выбранные
                </Button>
              </Tooltip>

              <Tooltip title="Снять выбор строк">
                <Button onClick={clearSelection} disabled={!selectedRowKeys.length}>
                  Снять выбор
                </Button>
              </Tooltip>

              <Tooltip title="Печать/Excel">
                <Button icon={<PrinterOutlined />} onClick={exportExcel}>
                  Excel
                </Button>
              </Tooltip>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={loading}
                onClick={finish}
              >
                Завершить приёмку
              </Button>
            </Space>
          </Space>

          <Table
            style={{ marginTop: 12 }}
            size="small"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            rowSelection={rowSelection}
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
