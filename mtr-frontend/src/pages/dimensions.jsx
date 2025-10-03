import {
  Divider,
  Form,
  Input,
  Typography,
  Popconfirm,
  Select,
  Switch,
  InputNumber,
  Space,
  Tag,
} from "antd";
import SubmitButton from "../components/button/Button";
import EditableCell from "../components/editTableCell/EditTableCell";
import { api } from "../utils/ApiDirectories";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableDirectories from "../components/dataTable/DataTable";

const Dimensions = () => {
  const [formNameDimension] = Form.useForm();
  const [form] = Form.useForm();
  const [dataDimensions, setDataDimensions] = useState([]);
  const [catList, setCatList] = useState([]); // [{key,nameRu,nameEn}]
  const [editingKey, setEditingKey] = useState("");
  const isEditing = (record) => record.key === editingKey;

  const onFinishFailed = (errorInfo) => console.error("Failed", errorInfo);

  // helpers
  const toSingleStr = (val) =>
    Array.isArray(val) ? (val[0] ?? "").trim() : (val ?? "").trim();

  const normFactor = (val, isBase) => {
    if (isBase) return undefined; // бэкенд сам проставит "1"
    if (val === "" || val == null) return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const loadCategories = async () => {
    try {
      const fromApi = await api.getDimensionCategories();
      setCatList(Array.isArray(fromApi) ? fromApi : []);
    } catch (e) {
      console.error("Не удалось получить категории:", e);
      setCatList([]);
    }
  };

  /** Создание новой единицы (форма сверху). */
  const onFinish = useCallback(
    async (values) => {
      const categoryKey = toSingleStr(values.category) || null;
      const isBase = Boolean(values.isBase);

      const payload = {
        nameDimension: (values.nameDimension ?? "").trim(),
        code: values.code?.trim(),
        category: categoryKey,
        isBase,
        toBaseFactor: normFactor(values.toBaseFactor, isBase),
        aliases: values.aliasesText
          ? values.aliasesText
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };

      // мягкий апсерт категории (не блокирует создание единицы)
      if (categoryKey && !catList.some((c) => c.key === categoryKey)) {
        try {
          await api.upsertDimensionCategory({
            key: categoryKey,
            nameRu: categoryKey,
          });
          await loadCategories();
        } catch (e) {
          console.warn(
            "Не удалось апсертнуть категорию, продолжаю создание:",
            e
          );
        }
      }

      await api.createDimension(payload);
      await getDimensions();
      formNameDimension.resetFields();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catList]
  );

  const edit = (record) => {
    form.setFieldsValue({
      ...record, // СНАЧАЛА исходные значения
      // затем правим то, что нужно для UI:
      category: record.category ? [record.category] : [],
      aliasesText: Array.isArray(record.aliases)
        ? record.aliases.join(", ")
        : "",
    });
    setEditingKey(record.key);
  };

  const handleDelete = async (key) => {
    const row = dataDimensions.find((i) => i.key === key);
    if (!row?.id) return;
    await api.deleteDimension(row.id); // <— только числовой id
    await getDimensions();
  };

  const cancel = () => setEditingKey("");

  /** Сохранение строки */
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataDimensions];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];

        const isBase = Boolean(row.isBase ?? item.isBase);
        const updated = {
          ...item,
          ...row,
          category: toSingleStr(row.category) || null, // массив(tags) → строка
          aliases: row.aliasesText
            ? row.aliasesText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          toBaseFactor: normFactor(row.toBaseFactor, isBase),
          isBase,
        };

        // мягкий апсерт категории
        if (
          updated.category &&
          !catList.some((c) => c.key === updated.category)
        ) {
          try {
            await api.upsertDimensionCategory({
              key: updated.category,
              nameRu: updated.category,
            });
            await loadCategories();
          } catch (e) {
            console.warn(
              "Апсерт категории не прошёл, продолжаю сохранение:",
              e
            );
          }
        }

        await api.patchDimension({
          id: updated.id,
          nameDimension: updated.nameDimension,
          code: updated.code,
          category: updated.category,
          isBase: updated.isBase,
          toBaseFactor: updated.toBaseFactor,
          aliases: updated.aliases,
        });

        await getDimensions(); // перезагрузка: единичность базовой и т.д.
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  /** Колонки */
  const columns = useMemo(
    () => [
      { title: "#", dataIndex: "number", key: "number", width: 60 },
      {
        title: "Единица (название)",
        dataIndex: "nameDimension",
        key: "nameDimension",
        editable: true,
        width: 220,
      },
      {
        title: "Код",
        dataIndex: "code",
        key: "code",
        editable: true,
        width: 120,
        render: (v) => (v ? <Tag color="blue">{v}</Tag> : "—"),
      },
      {
        title: "Категория (ключ)",
        dataIndex: "category",
        key: "category",
        editable: true,
        width: 200,
        render: (v) => (v ? <Tag>{v}</Tag> : "—"),
      },
      {
        title: "Базовая",
        dataIndex: "isBase",
        key: "isBase",
        editable: true,
        width: 100,
        render: (v) => (v ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>),
      },
      {
        title: "К коэф. базовой",
        dataIndex: "toBaseFactor",
        key: "toBaseFactor",
        editable: true,
        width: 140,
        render: (v, r) => (r.isBase ? "1" : v ?? "—"),
      },
      {
        title: "Алиасы (через запятую)",
        dataIndex: "aliasesText",
        key: "aliasesText",
        editable: true,
        width: 420,
        render: (_, r) =>
          Array.isArray(r.aliases) && r.aliases.length
            ? r.aliases.map((a) => <Tag key={a}>{a}</Tag>)
            : "—",
      },
      {
        title: "Операции",
        dataIndex: "operation",
        width: 170,
        render: (_, record) => {
          const editable = isEditing(record);
          return editable ? (
            <span>
              <Typography.Link
                onClick={() => cancel()}
                style={{ marginRight: 8 }}
              >
                Отмена
              </Typography.Link>
              <Popconfirm
                title="Подтвердите изменение?"
                onConfirm={() => save(record.key)}
              >
                <Typography.Link>Сохранить</Typography.Link>
              </Popconfirm>
            </span>
          ) : (
            <>
              <Typography.Link
                disabled={editingKey !== ""}
                onClick={() => edit(record)}
              >
                Редактировать
              </Typography.Link>
              &nbsp;
              <Popconfirm
                title="Подтвердите удаление?"
                onConfirm={() => handleDelete(record.key)}
              >
                <Typography.Link disabled={editingKey !== ""}>
                  Удалить
                </Typography.Link>
              </Popconfirm>
            </>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataDimensions, editingKey]
  );

  /** Редактируемые ячейки */
  const mergedColumns = columns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record) => {
        const inputType =
          col.dataIndex === "isBase"
            ? "switch"
            : col.dataIndex === "toBaseFactor"
            ? "number"
            : col.dataIndex === "category"
            ? "select"
            : "text";
        return {
          record,
          inputType,
          dataIndex: col.dataIndex,
          title: col.title,
          editing: isEditing(record),
          options:
            col.dataIndex === "category"
              ? catList.map((c) => ({
                  value: c.key,
                  label: c.nameRu ? `${c.key} — ${c.nameRu}` : c.key,
                }))
              : undefined,
        };
      },
    };
  });

  /** Загрузка списка единиц */
  const getDimensions = async () => {
    try {
      const res = await api.getDimensionsAll();
      const formatted = (Array.isArray(res) ? res : []).map((item, n) => ({
        id: item.id,
        nameDimension: item.nameDimension,
        code: item.code,
        category: item.category || "",
        isBase: Boolean(item.isBase),
        toBaseFactor: item.toBaseFactor,
        aliases: item.aliases || [],
        aliasesText: (item.aliases || []).join(", "),
        number: n + 1,
        key: uuidv4(),
      }));
      setDataDimensions(formatted);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadCategories();
    getDimensions();
  }, []);

  return (
    <>
      <Divider orientation="left">Единицы измерения</Divider>

      {/* Форма добавления единицы */}
      <Form
        form={formNameDimension}
        name="createDimension"
        labelCol={{ span: 40 }}
        wrapperCol={{ span: 14 }}
        style={{ maxWidth: 900 }}
        initialValues={{ remember: true, isBase: false }}
        autoComplete="off"
        onFinishFailed={onFinishFailed}
        onFinish={onFinish}
      >
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Form.Item
            label="Единица (название)"
            name="nameDimension"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Например: Килограмм" />
          </Form.Item>

          <Form.Item
            label="Код"
            name="code"
            rules={[{ required: true, message: "Введите код (kg, m, pcs…)" }]}
          >
            <Input placeholder="kg / pcs / m / т / шт / мм" />
          </Form.Item>

          <Form.Item
            label="Категория (ключ)"
            name="category"
            rules={[{ required: true, message: "Укажите ключ категории" }]}
          >
            <Select
              mode="tags"
              maxTagCount={1}
              showSearch
              allowClear
              placeholder="Категория (ключ)"
              options={catList.map((c) => ({
                value: c.key,
                label: c.nameRu ? `${c.key} — ${c.nameRu}` : c.key,
              }))}
              tokenSeparators={[",", " "]}
            />
          </Form.Item>

          <Form.Item
            label="Базовая единица"
            name="isBase"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(p, c) => p.isBase !== c.isBase}>
            {({ getFieldValue }) => (
              <Form.Item label="Коэффициент к базовой" name="toBaseFactor">
                <InputNumber
                  min={0}
                  step={0.000001}
                  placeholder="Напр.: для мм → м это 0.001"
                  style={{ width: 200 }}
                  disabled={getFieldValue("isBase")}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item label="Алиасы (через запятую)" name="aliasesText">
            <Input placeholder="миллиметр, мм., mm; килограмм, кг; штука, шт;" />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4, span: 14 }}>
            <SubmitButton form={formNameDimension} />
          </Form.Item>
        </Space>
      </Form>

      {/* Таблица */}
      <TableDirectories
        dataSource={dataDimensions}
        columns={mergedColumns}
        editableCell={(props) => {
          const { inputType, editing, dataIndex, options, ...rest } = props;
          if (!editing) return <EditableCell {...props} />;

          if (inputType === "switch") {
            return (
              <td {...rest}>
                <Form.Item
                  name={dataIndex}
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Switch />
                </Form.Item>
              </td>
            );
          }
          if (inputType === "number") {
            return (
              <td {...rest}>
                <Form.Item name={dataIndex} style={{ margin: 0 }}>
                  <InputNumber min={0} step={0.000001} />
                </Form.Item>
              </td>
            );
          }
          if (inputType === "select") {
            return (
              <td {...rest}>
                <Form.Item name={dataIndex} style={{ margin: 0 }}>
                  <Select
                    mode="tags"
                    maxTagCount={1}
                    showSearch
                    allowClear
                    options={options}
                    placeholder="Категория"
                  />
                </Form.Item>
              </td>
            );
          }
          return <EditableCell {...props} />;
        }}
        cancel={cancel}
        form={form}
      />
    </>
  );
};

export default Dimensions;
