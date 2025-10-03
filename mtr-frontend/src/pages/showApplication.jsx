// src/pages/showApplication.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import StatusTag from "../components/status/StatusTag";
import {
  Table,
  Divider,
  Space,
  Button,
  Modal,
  Tag,
  Card,
  ConfigProvider,
  App,
  Tooltip,
  DatePicker,
} from "antd";
import {
  DeleteOutlined,
  FileExcelOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { api as apiApp } from "../utils/ApiApplications";
import { api as apiRegions } from "../utils/ApiDirectories";
import { api as apiApplications } from "../utils/ApiApplications";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as apiDirectories } from "../utils/ApiDirectories";
import exportApp3Excel from "../utils/export/exportApp3Excel";
import { STATUS_FOR_APP3, normalizeStatus } from "../constants/status";
import { ROLE_IDS } from "../constants/rules";
import "../theme/Application.css";

const { RangePicker } = DatePicker;

const toLocalDate = (d) => (d ? dayjs(d).format("DD.MM.YYYY") : "—");

const fullName = (u) => {
  if (!u) return "—";
  const { surname, firstName, lastName, email, username, id } = u;
  const fio = [surname, firstName, lastName].filter(Boolean).join(" ");
  return fio || email || username || `ID ${id}`;
};

const TR_STATUS = {
  10: "На согласовании",
  20: "Согласовано",
  30: "Не согласовано",
};
const trStatusColor = (s) =>
  ({ 10: "gold", 20: "green", 30: "red" }[Number(s)] || "default");

export default function ShowApplications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message: antdMsg } = App.useApp();
  const userData = useSelector((s) => s.users.userData);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // диапазон по умолчанию — последние 7 дней
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, "day").startOf("day"),
    dayjs().endOf("day"),
  ]);

  // фильтр по статусу (кликабельные счётчики в футере)
  const [statusFilter, setStatusFilter] = useState(null); // number | null

  // справочники для итогов по категориям в Excel
  const [dimensions, setDimensions] = useState([]);
  const [catList, setCatList] = useState([]);

  const hasEditRole = Array.isArray(userData?.roles)
    ? userData.roles.map(Number).includes(ROLE_IDS.REDAKTOR)
    : false;
  const currentUserId = Number(userData?.id || userData?.user?.id || 0);

  const load = async (range = dateRange) => {
    try {
      setLoading(true);
      const [start, end] = Array.isArray(range) ? range : [null, null];
      const params =
        start && end
          ? {
              start: start.startOf("day").toISOString(),
              end: end.endOf("day").toISOString(),
            }
          : {};

      const [apps, regs] = await Promise.all([
        apiApp.getApplications(params), // бэк умеет фильтровать по периоду
        apiRegions.getRegionsAll(),
      ]);

      const regionNameByStorageLocal = (storage, regionsArr) => {
        if (!storage || !Array.isArray(regionsArr)) return null;
        const found = regionsArr.find(
          (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(storage)
        );
        return found?.nameRegion || null;
      };

      const formatted = (apps || []).map((x, idx) => {
        const a = x.application || {};
        const z = x.zapiska || {};
        const u = z.user || null;

        const directionNames = (x.storages || [])
          .map((s) => regionNameByStorageLocal(s, regs))
          .filter(Boolean);
        const direction = directionNames.length
          ? [...new Set(directionNames)].join(", ")
          : "—";

        const tr = x.transport || null; // { id, status, rejectReason, wave? }
        const waves = Number(x.transportCount || x.waves || 0) || (tr ? 1 : 0);

        return {
          key: a.id,
          idx: idx + 1,
          applicationId: a.id,
          appStatus: normalizeStatus(a.status),
          appCreatedAt: a.createdAt,
          appUpdatedAt: a.updatedAt,
          appRowsCount: x.rowsCount ?? 0,
          remainderCount: x.remainderCount ?? 0,

          zapiskaId: z?.id ?? null,
          zapStatus: normalizeStatus(z?.status),
          zapCreatedAt: z?.createdAt ?? null,
          zapAuthor: u ? fullName(u) : "—",

          direction,
          transport: tr
            ? {
                id: tr.id,
                status: tr.status,
                reason: tr.rejectReason || "",
                wave: tr.wave || null,
              }
            : null,
          waves,

          // ← принимаем новое поле
          lastmile: x.lastmile || { hasRejected: false, reasons: [] },
        };
      });

      setRows(formatted);
    } catch (e) {
      console.error(e);
      antdMsg.error("Не удалось загрузить список приложений");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleEditApp3 = async (zapiskaId) => {
    if (!zapiskaId) return antdMsg.warning("Нет id служебной записки");
    if (!Number.isInteger(currentUserId) || currentUserId < 1) {
      return antdMsg.error("Не найден ID пользователя. Перезайдите в систему.");
    }
    try {
      await apiApp.saveAppendix3({
        zapiskaId,
        userId: currentUserId,
        items: [],
      });
      antdMsg.success("Статус Прил. №3 и связанных записей установлен на 40");
      load();
    } catch (e) {
      console.error(e);
      antdMsg.error("Не удалось перевести в статус 40");
    }
  };

  const handleDeleteApp3 = async (appId, appStatus) => {
    if (!appId) return antdMsg.warning("Не найден ID Приложения №3");
    if (normalizeStatus(appStatus) >= 50)
      return antdMsg.warning(
        "Нельзя удалять отправленные приложения (статус ≥ 50)."
      );

    setDeleteRecord({ appId, appStatus });
    setDeleteOpen(true);
  };

  const exportOneApp = async (r) => {
    try {
      const zapiskaId = r?.zapiskaId;
      const app3Id = r?.applicationId;
      if (!zapiskaId || !app3Id) {
        return antdMsg.warning("Нет zapiskaId или applicationId для экспорта.");
      }

      const mtrList = await apiMtrList.getMtrListForIdApp(zapiskaId);
      const appData = await apiApplications.getAppendix3ByZapiska(zapiskaId);
      const savedRows = appData?.data?.rows || [];

      const toBool = (v) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return v !== 0;
        if (typeof v === "string") {
          const s = v.trim().toLowerCase();
          return (
            s !== "" && s !== "0" && s !== "false" && s !== "нет" && s !== "no"
          );
        }
        return false;
      };

      const baseRows = (mtrList || []).map((row, idx) => {
        const v = row?.vl06 || {};
        return {
          key: row.id ?? idx,
          nameMTR: v.nameMTR,
          address: v.address,
          supply: v.supply,
          factory: v.factory,
          storage: v.storage,
          vacationOfTheMaterial: v.vacationOfTheMaterial,
          material: v.material,
          party: v.party,
          basic: v.basic,
          supplyVolume: v.supplyVolume,
          created: v.created,
          urgent: toBool(row?.express),
          repairObjectName: row?.repairObjectName ?? null,
          note: row?.note ?? null,
        };
      });

      const defaultsPerRow = {
        shipmentRequestDate: null,
        transportRequest: null,
        transportNumber: "",
        shipmentDate: null,
        recipientName: "",
        m11Date: null,
        m11Number: "",
        shippedQty: null,
        note: "",
      };

      const extras = baseRows.reduce((acc, r) => {
        acc[r.key] = { ...defaultsPerRow };
        return acc;
      }, {});

      for (const r2 of savedRows) {
        const key = r2?.mtrList?.id;
        if (!key) continue;
        const shippedRaw = r2?.discarded;
        const shipped =
          shippedRaw != null && shippedRaw !== ""
            ? Number(String(shippedRaw).replace(/\s/g, "").replace(",", "."))
            : null;

        extras[key] = {
          shipmentRequestDate: r2?.dateRequest || null,
          transportRequest: r2?.format || null,
          transportNumber: r2?.transportNumber || "",
          shipmentDate: r2?.dateShipment || null,
          recipientName: r2?.transit || "",
          m11Date: r2?.dateM11 || null,
          m11Number: r2?.numberM11 || "",
          shippedQty: Number.isFinite(shipped)
            ? shipped
            : shipped === 0
            ? 0
            : null,
          note: r2?.addNote || "",
        };
      }

      const datasetWithExtras = baseRows.map((row) => ({
        ...row,
        __extras: extras[row.key] || {},
      }));

      await exportApp3Excel(datasetWithExtras, {
        filename: `Приложение_3_${zapiskaId}.xlsx`,
        meta: { zapiskaId, app3Id },
        dims: dimensions,
        cats: catList,
      });

      antdMsg.success("Экспортировано в Excel");
    } catch (e) {
      console.error(e);
      antdMsg.error("Не удалось экспортировать Приложение № 3");
    }
  };

  const columns = [
    { title: "№", dataIndex: "idx", width: 64, fixed: "left", align: "center" },
    {
      title: "Приложение № 3",
      key: "appIdDate",
      width: 220,
      render: (_, r) => {
        const num = r.applicationId ? `№ ${r.applicationId}` : "—";
        const dt = r.appCreatedAt ? toLocalDate(r.appCreatedAt) : "—";
        return (
          <a
            className="z-link"
            href={`/application/app3/new/${r.applicationId}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/application/app3/new/${r.applicationId}`, {
                state: {
                  linkId: r.applicationId,
                  zapiska: { id: r.zapiskaId },
                },
              });
            }}
            title={`Открыть Приложение №3 №${r.applicationId}`}
          >
            {num} от {dt}
          </a>
        );
      },
    },

    {
      title: "Статус Прил. №3",
      dataIndex: "appStatus",
      width: 160,
      render: (s) => <StatusTag code={s} type="app3" />,
      sorter: (a, b) => a.appStatus - b.appStatus,
    },

    {
      title: "Заявка на транспорт",
      key: "transport",
      width: 300,
      render: (_, r) => {
        const st = r.transport?.status;
        const text = st ? TR_STATUS[st] || st : "—";
        const color = trStatusColor(st);

        const lmHasRejected = r.lastmile?.hasRejected;
        const lmReasons = Array.isArray(r.lastmile?.reasons)
          ? r.lastmile.reasons
          : [];
        const lmTooltip =
          lmReasons.length > 1 ? (
            <div style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>
              {lmReasons.map((t, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  • {t}
                </div>
              ))}
            </div>
          ) : (
            lmReasons[0] || ""
          );

        return (
          <Space size={6} wrap>
            <Tag color={color}>{text}</Tag>
            {r.transport?.wave != null && (
              <Tag>Итерация #{r.transport.wave}</Tag>
            )}

            {/* Причина отказа по самой заявке на транспорт (старое поле) */}
            {r.transport?.status === 30 && r.transport?.reason ? (
              <Tooltip title={r.transport.reason}>
                <Tag color="red-inverse">Причина (заявка)</Tag>
              </Tooltip>
            ) : null}

            {/* Новое: причины отказа на последней миле */}
            {lmHasRejected ? (
              <Tooltip title={lmTooltip}>
                <Tag color="volcano-inverse">Последняя миля</Tag>
              </Tooltip>
            ) : null}

            {r.waves > 1 && <Tag color="blue">Всего заявок: {r.waves}</Tag>}
          </Space>
        );
      },
    },

    {
      title: "Обновлено",
      dataIndex: "appUpdatedAt",
      width: 130,
      render: (v) => toLocalDate(v),
      sorter: (a, b) => new Date(a.appUpdatedAt) - new Date(b.appUpdatedAt),
      align: "center",
    },

    {
      title: "Служебная записка",
      key: "zapiska",
      width: 200,
      render: (_, r) => {
        const num = r.zapiskaId ? `№ ${r.zapiskaId}` : "—";
        const dt = r.zapCreatedAt ? toLocalDate(r.zapCreatedAt) : "—";
        return (
          <span>
            {num} от {dt}
          </span>
        );
      },
    },

    {
      title: "Автор служебки",
      dataIndex: "zapAuthor",
      width: 240,
      ellipsis: true,
    },

    {
      title: "Направление",
      dataIndex: "direction",
      width: 240,
      ellipsis: true,
    },

    {
      title: "Остатки",
      dataIndex: "remainderCount",
      width: 110,
      align: "center",
      render: (n) =>
        n > 0 ? <Tag color="orange">Есть: {n}</Tag> : <Tag>Нет</Tag>,
    },

    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 360,
      render: (_, r) => (
        <Space size={6} wrap className="actions-cell">
          <Button
            size="small"
            className="btn-excel"
            icon={<FileExcelOutlined />}
            onClick={() => exportOneApp(r)}
            title="Экспортировать в Excel"
          >
            Excel
          </Button>

          {r.remainderCount > 0 && (
            <Button
              size="small"
              onClick={() =>
                navigate(`/application/app3/new/${r.applicationId}`, {
                  state: {
                    linkId: r.applicationId,
                    zapiska: { id: r.zapiskaId },
                    leftoversOnly: true,
                  },
                })
              }
              title="Показать только позиции с остатком"
            >
              Продолжить отгрузку
            </Button>
          )}

          {hasEditRole && (
            <Button
              size="small"
              className="btn-edit"
              onClick={() => handleEditApp3(r.zapiskaId)}
              title="Перевести статусы на 40 (Редактировать)"
            >
              Редактировать
            </Button>
          )}
          <Button
            danger
            size="small"
            className="btn-delete"
            icon={<DeleteOutlined />}
            title="Удалить Приложение №3"
            disabled={normalizeStatus(r.appStatus) >= 50}
            onClick={() => handleDeleteApp3(r.applicationId, r.appStatus)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const counters = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      map.set(r.appStatus, (map.get(r.appStatus) || 0) + 1);
    }
    return map;
  }, [rows]);

  const dataFiltered = useMemo(() => {
    if (statusFilter == null) return rows;
    return rows.filter((r) => r.appStatus === Number(statusFilter));
  }, [rows, statusFilter]);

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 8, fontSize: 12 },
        components: {
          Table: {
            cellPaddingBlockSM: 4,
            cellPaddingInlineSM: 6,
            headerBg: "#fafafa",
            headerSplitColor: "#f0f0f0",
            rowHoverBg: "#f5faff",
          },
          Input: { controlHeight: 28 },
        },
      }}
    >
      <Divider orientation="left" style={{ marginBottom: 8 }}>
        Приложение № 3 — список
      </Divider>

      {/* NEW: панель периода */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          margin: "0 0 8px 8px",
        }}
      >
        <RangePicker
          size="small"
          format="DD.MM.YYYY"
          value={dateRange}
          onChange={(r) => setDateRange(r)}
          allowClear={false}
        />
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => load()}
          title="Обновить по выбранному периоду"
        >
          Показать
        </Button>
        <Button
          size="small"
          onClick={() => {
            const def = [
              dayjs().subtract(6, "day").startOf("day"),
              dayjs().endOf("day"),
            ];
            setDateRange(def);
            load(def);
          }}
        >
          За 7 дней
        </Button>
        {statusFilter != null && (
          <Tag
            color="blue"
            style={{ marginLeft: 8, cursor: "pointer" }}
            onClick={() => setStatusFilter(null)}
          >
            Сбросить фильтр статуса
          </Tag>
        )}
      </div>

      <Card className="zapiski-card" bordered>
        <Table
          className="zapiski-table z-compact"
          columns={columns}
          dataSource={dataFiltered}
          rowKey="key"
          size="small"
          bordered={false}
          loading={loading}
          tableLayout="fixed"
          sticky
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: "max-content" }}
          footer={() => (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "4px 8px",
              }}
            >
              {Object.keys(STATUS_FOR_APP3).map((code) => {
                const c = Number(code);
                const count = counters.get(c) || 0;
                const active = statusFilter === c;
                return (
                  <span
                    key={code}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                    onClick={() => setStatusFilter(active ? null : c)}
                    title={
                      active ? "Сбросить фильтр" : "Фильтровать по статусу"
                    }
                  >
                    <StatusTag code={c} type="app3" />
                    <Tag
                      color={active ? "blue" : "default"}
                      style={{ padding: "0 8px" }}
                    >
                      {count}
                    </Tag>
                  </span>
                );
              })}
              <Tag
                style={{ padding: "0 8px", cursor: "pointer" }}
                color={statusFilter == null ? "blue" : "default"}
                onClick={() => setStatusFilter(null)}
                title="Показать все"
              >
                Всего: {rows.length}
              </Tag>
            </div>
          )}
        />
      </Card>

      <Modal
        open={deleteOpen}
        title="Удалить Приложение №3?"
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteRecord(null);
        }}
        footer={[
          <Button
            key="yes"
            className="btn-send"
            loading={deleting}
            onClick={async () => {
              if (!deleteRecord?.appId) return;
              try {
                setDeleting(true);
                await apiApp.deleteApp3(deleteRecord.appId);
                antdMsg.success("Приложение №3 удалено. Статусы обновлены.");
                setDeleteOpen(false);
                setDeleteRecord(null);
                load();
              } catch (e) {
                console.error(e);
                antdMsg.error("Ошибка при удалении Приложения №3");
              } finally {
                setDeleting(false);
              }
            }}
          >
            Да
          </Button>,
          <Button
            key="cancel"
            className="btn-save"
            onClick={() => {
              setDeleteOpen(false);
            }}
          >
            Отмена
          </Button>,
          <Button
            key="no"
            danger
            onClick={() => {
              setDeleteOpen(false);
              setDeleteRecord(null);
            }}
          >
            Нет
          </Button>,
        ]}
        centered
      >
        Действие необратимо. Запись будет удалена.
      </Modal>
    </ConfigProvider>
  );
}
