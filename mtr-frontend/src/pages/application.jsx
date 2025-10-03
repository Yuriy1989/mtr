import { useMemo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Divider,
  Space,
  Table,
  Spin,
  Input,
  ConfigProvider,
  Card,
  App,
  Modal,
  Tag,
} from "antd";
import { SearchOutlined, FileExcelOutlined } from "@ant-design/icons";
import "../theme/Application.css";
import handleExportToExcel from "../utils/export/UtilsExport";
import { NavLink, useNavigate } from "react-router-dom";
import { api as apiMtrList } from "../utils/ApiMtrList";
import { api as ApiZapiski } from "../utils/ApiZapiski";
import { api as apiRegions } from "../utils/ApiDirectories";
import { api as apiApplications } from "../utils/ApiApplications";
import {
  STATUS_FOR_ZAPISKA,
  statusColor,
  normalizeStatus,
} from "../constants/status";
import StatusTag from "../components/status/StatusTag";

const ALLOWED_STATUSES = [20, 30];
const SELECTABLE_STATUS = 30;

/** Ячейка «Направление»: лениво подгружает МТР по записке, мапит storage -> регион, кэширует результат */
const DirectionCell = ({ zapiskaId, regionIds, regions, cache, setCache }) => {
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  // мапа id -> name
  const mapIdsToNames = (ids = []) => {
    if (!Array.isArray(ids) || !ids.length) return [];
    const dict = new Map(regions.map((r) => [r.id, r.nameRegion]));
    return [...new Set(ids.map((id) => dict.get(id)).filter(Boolean))];
  };

  const getRegionNamesByStorages = (storages = []) => {
    if (!regions || !Array.isArray(regions)) return [];
    const result = [];
    for (const st of storages) {
      const found = regions.find(
        (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(st)
      );
      if (found) result.push(found.nameRegion);
    }
    return [...new Set(result)];
  };

  useEffect(() => {
    // 1) если regionIds есть — используем их
    if (Array.isArray(regionIds) && regionIds.length) {
      const names = mapIdsToNames(regionIds);
      const value = names.length ? names.join(", ") : "—";
      if (cache[zapiskaId] === undefined) {
        setCache((prev) => ({ ...prev, [zapiskaId]: value }));
      }
      return;
    }

    // 2) иначе — лениво считаем по MTR (как раньше)
    if (cache[zapiskaId] !== undefined) return;

    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        setLoading(true);
        const mtrList = await apiMtrList.getMtrListForId(zapiskaId);
        const storages = (mtrList || [])
          .map((row) => row?.linkMtrList?.[0]?.vl06?.storage)
          .filter(Boolean);
        const directions = getRegionNamesByStorages(storages);
        const value = directions.length === 0 ? "—" : directions.join(", ");
        setCache((prev) => ({ ...prev, [zapiskaId]: value }));
      } catch (e) {
        console.error("Ошибка при вычислении направления:", e);
        setCache((prev) => ({ ...prev, [zapiskaId]: "—" }));
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zapiskaId, regionIds, regions, cache, setCache]);

  if (loading && cache[zapiskaId] === undefined) return <Spin size="small" />;
  const val = cache[zapiskaId];

  if (!val || val === "—") return <>—</>;
  return (
    <Space size={4} wrap>
      {val.split(", ").map((regionName) => (
        <Tag key={regionName}>{regionName}</Tag>
      ))}
    </Space>
  );
};

const Application = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]); // служебные записки
  const [load, setLoad] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  // Справочник направлений (регионы)
  const [regions, setRegions] = useState([]); // массив { id, nameRegion, codeRegion[] ... }
  const [directionsCache, setDirectionsCache] = useState({});

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    showSizeChanger: true,
  });
  const { message } = App.useApp();

  // Поиск (по запискам + направлениям)
  const [globalQuery, setGlobalQuery] = useState("");

  // Выбор + модалка
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedZapiska, setSelectedZapiska] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const user = useSelector((state) => state.users.userData);

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fullName = (u) => {
    if (!u) return "—";
    const { surname, firstName, lastName, username, email, id } = u;
    const fio = [surname, firstName, lastName].filter(Boolean).join(" ");
    return fio || username || email || `ID ${id}`;
  };

  const shortFio = (u) => {
    if (!u) return "—";
    const { surname, firstName, lastName, username, email, id } = u;
    const fi = [
      surname,
      firstName?.[0] && firstName[0] + ".",
      lastName?.[0] && lastName[0] + ".",
    ]
      .filter(Boolean)
      .join(" ");
    return fi || username || email || `ID ${id}`;
  };

  const mapMtrToRows = (mtrList = []) =>
    mtrList?.map((row) => ({
      key: row?.vl06?.id,
      nameMTR: row?.vl06?.nameMTR,
      address: row?.vl06?.address,
      supply: row?.vl06?.supply,
      factory: row?.vl06?.factory,
      storage: row?.vl06?.storage,
      vacationOfTheMaterial: row?.vl06?.vacationOfTheMaterial,
      material: row?.vl06?.material,
      party: row?.vl06?.party,
      basic: row?.vl06?.basic,
      supplyVolume: row?.vl06?.supplyVolume,
      created: row?.vl06?.created,
      express: row?.express || "",
      note: row?.note || "",
      repairObjectName:
        row.repairObjectName ??
        row.objectName ??
        row.repairObject ??
        row.vl06?.repairObjectName ??
        "",
    }));

  const getRegionNameByStorage = (storageCode, regionsArr) => {
    if (!regionsArr || !Array.isArray(regionsArr)) return null;
    const found = regionsArr.find(
      (r) => Array.isArray(r.codeRegion) && r.codeRegion.includes(storageCode)
    );
    return found?.nameRegion || null;
  };

  const resolveDirectionForZapiska = async (
    zapiskaId,
    regionsArr,
    setCache
  ) => {
    try {
      const mtrList = await apiMtrList.getMtrListForId(zapiskaId);
      const storages = (mtrList || [])
        .map((row) => row?.linkMtrList?.[0]?.vl06?.storage)
        .filter(Boolean);

      const uniqueStorages = [...new Set(storages)];
      const directions = uniqueStorages
        .map((code) => getRegionNameByStorage(code, regionsArr))
        .filter(Boolean);

      const value = directions.length
        ? [...new Set(directions)].join(", ")
        : "—";
      setCache((prev) => ({ ...prev, [zapiskaId]: value }));
    } catch (e) {
      console.error("Ошибка при вычислении направления:", e);
      setCache((prev) => ({ ...prev, [zapiskaId]: "—" }));
    }
  };

  const normalize = (v) => String(v ?? "").toLowerCase();

  const filteredOrders = useMemo(() => {
    const q = normalize(globalQuery);
    if (!q) return orders;

    return orders.filter((r) => {
      const id = normalize(r.id);
      const created = normalize(formatDateTime(r.createdAt));
      const updated = normalize(formatDateTime(r.updatedAt));
      const mtr = normalize(r.mtrCount);
      const u = r.user || {};
      const name = normalize(fullName(u));
      const email = normalize(u.email);
      const direction = normalize(directionsCache[r.id] || ""); // поиск по направлению

      return [id, name, email, created, updated, mtr, direction]
        .join(" ")
        .includes(q);
    });
  }, [orders, globalQuery, directionsCache]); // учитываем кэш направлений

  // При вводе поискового запроса — подгружаем направления, которых нет в кэше (мягкий лимит)
  useEffect(() => {
    if (!globalQuery?.trim()) return;
    const missing = filteredOrders
      .map((x) => x.id)
      .filter((id) => directionsCache[id] === undefined);

    const slice = missing.slice(0, 20); // не бомбим API
    slice.forEach((id) => {
      resolveDirectionForZapiska(id, regions, setDirectionsCache);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalQuery, filteredOrders, regions, directionsCache]);

  const handleExportZapiska = async (zapiskaId) => {
    try {
      setExportingId(zapiskaId);
      const mtrList = await apiMtrList.getMtrListForId(zapiskaId);
      const rows = mapMtrToRows(mtrList);
      await handleExportToExcel(rows);
      message.success(`Экспортировано: записка № ${zapiskaId}`);
    } catch (e) {
      console.error(e);
      message.error("Не удалось выгрузить в Excel");
    } finally {
      setExportingId(null);
    }
  };

  const handleCreateApp3 = async () => {
    if (!selectedZapiska) return;

    try {
      setShowCreateModal(false);
      message.loading({ content: "Готовим данные…", key: "app3create" });

      // 1) исходный список MTR по записке
      const mtrList = await apiMtrList.getMtrListForId(selectedZapiska.id);

      const items = (mtrList || [])
        .map((row) => Number(row?.id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .map((mtrListId) => ({
          mtrListId,
          dateRequest: null,
          dateShipment: null,
          format: null,
          transportNumber: null,
          transit: "",
          dateM11: null,
          numberM11: "",
          shippedQty: null,
          note: "",
        }));

      if (items.length === 0) {
        throw new Error(
          "По выбранной записке нет валидных строк МТР (mtrListId)."
        );
      }

      // 2) один вызов — и приложение, и все связи (идемпотентно)
      message.loading({
        content: "Сохраняем Приложение № 3…",
        key: "app3create",
      });
      const upsertRes = await apiApplications.saveAppendix3({
        zapiskaId: Number(selectedZapiska.id),
        userId: user?.id,
        items,
      });

      const linkId = Number(upsertRes?.linkId);
      if (!Number.isFinite(linkId) || linkId <= 0) {
        throw new Error(
          "Сервер не вернул id связки (linkId) для Приложения № 3"
        );
      }

      message.success({
        content: "Приложение № 3 создано/обновлено",
        key: "app3create",
      });

      // 3) Переход на страницу редактирования по linkId
      navigate(`/application/app3/new/${linkId}`, {
        state: { zapiska: selectedZapiska, linkId },
      });
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Не удалось сформировать Приложение № 3");
    }
  };

  const columns = [
    {
      title: "№",
      key: "rowNumber",
      width: 56,
      align: "center",
      fixed: "left",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Служебная записка",
      key: "numDate",
      width: 240,
      render: (_, r) => (
        <span>
          № {r.id} от {formatDateShort(r.createdAt)}
        </span>
      ),
      // eslint-disable-next-line no-dupe-keys
      render: (_, r) => (
        <NavLink
          to={`/editZapiskaFromImport/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          title={`Открыть служебную записку № ${r.id}`}
          style={{ textDecoration: "underline" }}
          className="z-link"
        >
          № {r.id} от {formatDateShort(r.createdAt)}
        </NavLink>
      ),
      sorter: (a, b) => {
        const byDate =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return byDate !== 0 ? byDate : a.id - b.id;
      },
      defaultSortOrder: "descend",
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center",
      filters: ALLOWED_STATUSES.map((code) => ({
        text: STATUS_FOR_ZAPISKA[code],
        value: code,
      })),
      onFilter: (val, record) => normalizeStatus(record.status) === Number(val),
      sorter: (a, b) => normalizeStatus(a.status) - normalizeStatus(b.status),
      render: (v) => {
        const s = normalizeStatus(v);
        return <Tag color={statusColor(s)}>{STATUS_FOR_ZAPISKA[s] ?? s}</Tag>;
      },
    },
    {
      title: "Автор",
      dataIndex: "user",
      key: "user",
      width: 260,
      ellipsis: true,
      render: (_, record) => {
        const u = record.user;
        if (!u) return "—";
        const name = shortFio(u);
        return (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 500 }}>{name}</div>
            {u.email ? (
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.45)" }}>
                {u.email}
              </div>
            ) : null}
          </div>
        );
      },
      // Имеет свой выпадающий фильтр по авторам (как было ранее)
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Поиск..."
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Найти
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Сброс
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const u = record.user;
        if (!u) return false;
        const name = fullName(u).toLowerCase();
        const email = (u.email || "").toLowerCase();
        const val = String(value || "").toLowerCase();
        return name.includes(val) || email.includes(val);
      },
    },
    {
      title: "МТР",
      dataIndex: "mtrCount",
      key: "mtrCount",
      width: 90,
      align: "center",
      render: (v) => <span className="pill">{v ?? 0}</span>,
      sorter: (a, b) => (a.mtrCount || 0) - (b.mtrCount || 0),
    },
    {
      title: "Направление",
      key: "direction",
      width: 260,
      render: (_, record) => (
        <DirectionCell
          zapiskaId={record.id}
          regions={regions}
          regionIds={record.region}
          cache={directionsCache}
          setCache={setDirectionsCache}
        />
      ),
    },
    {
      title: "Обновлена",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      render: (v) => formatDateShort(v),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      responsive: ["lg"],
    },
    {
      title: "",
      key: "action",
      fixed: "right",
      width: 190,
      render: (_, record) => (
        <Space size={6} wrap className="actions-cell">
          <Button
            size="small"
            icon={<FileExcelOutlined />}
            className="btn-excel"
            loading={exportingId === record.id}
            onClick={() => handleExportZapiska(record.id)}
          >
            Excel
          </Button>
        </Space>
      ),
    },
  ];

  // Загрузка: записки + регионы
  const apiGetZapiski = async () => {
    setLoad(true);
    try {
      const { data } = await ApiZapiski.getAllZapiski();
      setOrders(
        (data || []).filter((z) =>
          ALLOWED_STATUSES.includes(normalizeStatus(z.status))
        )
      );
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoad(false);
    }
  };

  const loadRegions = async () => {
    try {
      const res = await apiRegions.getRegionsAll(); // ожидается массив регионов
      setRegions(res || []);
    } catch (error) {
      console.error("Ошибка при получении регионов:", error);
      setRegions([]);
    }
  };

  useEffect(() => {
    apiGetZapiski();
    loadRegions();
  }, []);

  // Сброс выбора, если выбранная запись исчезла из фильтра
  useEffect(() => {
    if (
      selectedZapiska &&
      !filteredOrders.some((x) => x.id === selectedZapiska.id)
    ) {
      setSelectedZapiska(null);
      setSelectedRowKeys([]);
    }
  }, [filteredOrders, selectedZapiska]);

  return (
    <ConfigProvider
      theme={{
        token: { borderRadius: 8, fontSize: 12 },
        components: {
          Table: {
            cellPaddingBlockSM: 6,
            cellPaddingInlineSM: 8,
            headerBg: "#fafafa",
            headerSplitColor: "#f0f0f0",
            rowHoverBg: "#f5faff",
          },
          Input: { controlHeight: 32 },
        },
      }}
    >
      <Divider orientation="left">
        Формирование формы для Распоряжения № 3
      </Divider>
      <div className="zapiski-page">
        <Card className="zapiski-card" bordered>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {/* Верхняя панель: кнопка + общий поиск по запискам и направлениям */}

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                disabled={
                  !selectedZapiska ||
                  normalizeStatus(selectedZapiska?.status) !== SELECTABLE_STATUS
                }
                onClick={() => setShowCreateModal(true)}
              >
                Создать приложение № 3
              </Button>

              <Input
                allowClear
                size="middle"
                prefix={<SearchOutlined />}
                placeholder="Поиск по служебным запискам и направлениям…"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <Table
              className="zapiski-table z-compact"
              columns={columns}
              dataSource={filteredOrders}
              rowKey="id"
              size="small"
              bordered={false}
              loading={load}
              tableLayout="fixed"
              sticky
              pagination={{
                ...pagination,
                showTotal: (total) =>
                  globalQuery
                    ? `Найдено: ${total} (из ${orders.length})`
                    : `Всего: ${total}`,
                locale: { items_per_page: "на странице" },
                size: "small",
              }}
              onChange={(pag) => {
                setPagination((p) => ({
                  ...p,
                  current: pag.current || 1,
                  pageSize: pag.pageSize || p.pageSize,
                }));
              }}
              scroll={{ x: "max-content" }}
              rowClassName={(record) =>
                "zapiski-row " +
                (normalizeStatus(record.status) !== SELECTABLE_STATUS
                  ? "z-row--disabled"
                  : "")
              }
              rowSelection={{
                type: "radio",
                selectedRowKeys,
                onChange: (keys, rows) => {
                  setSelectedRowKeys(keys);
                  setSelectedZapiska(rows?.[0] || null);
                },
                getCheckboxProps: (record) => ({
                  disabled:
                    normalizeStatus(record.status) !== SELECTABLE_STATUS,
                }),
              }}
              onRow={(record) => ({
                onClick: () => {
                  if (normalizeStatus(record.status) === SELECTABLE_STATUS) {
                    setSelectedRowKeys([record.id]);
                    setSelectedZapiska(record);
                  }
                },
              })}
              footer={() => {
                const counters = new Map();
                (filteredOrders || []).forEach((z) => {
                  const s = normalizeStatus(z.status);
                  counters.set(s, (counters.get(s) || 0) + 1);
                });
                return (
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
                    {ALLOWED_STATUSES.map((code) => {
                      const count = counters.get(code) || 0;
                      return (
                        <span
                          key={code}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <StatusTag code={code} type="zapiska" />
                          <Tag style={{ padding: "0 8px" }}>{count}</Tag>
                        </span>
                      );
                    })}
                    <Tag style={{ padding: "0 8px" }}>
                      Всего: {filteredOrders.length}
                    </Tag>
                  </div>
                );
              }}
            />
          </Space>
        </Card>

        {/* Модальное окно подтверждения */}
        <Modal
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          title="Создать Приложение № 3"
          footer={
            <Space>
              <Button type="primary" onClick={handleCreateApp3}>
                Да
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>Нет</Button>
            </Space>
          }
          destroyOnClose
        >
          <p>Создать Приложение № 3?</p>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default Application;
