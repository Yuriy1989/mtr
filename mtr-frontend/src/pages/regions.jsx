import { PlusOutlined } from "@ant-design/icons";
import {
  Divider,
  Form,
  Input,
  Typography,
  Popconfirm,
  Tag,
  theme,
} from "antd";
import { TweenOneGroup } from "rc-tween-one";
import SubmitButton from "../components/button/Button";
import EditableCell from "../components/editTableCell/EditTableCell";
import { api } from "../utils/ApiDirectories";
import { useCallback, useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import TableDirectories from "../components/dataTable/DataTable";

const Regions = () => {
  const [formNameRegion] = Form.useForm(); // форма для добавления нового региона
  const [form] = Form.useForm(); // форма для редактирования региона
  const [dataRegions, setDataRegions] = useState([]);
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record) => record.key === editingKey;

  const onFinishFailed = (errorInfo) => {
    console.error("Failed", errorInfo);
  };

  // добавление нового региона
  const onFinish = useCallback(
    (values) => {
      api.createRegion(values).then(() => {
        getRegions();
        formNameRegion.resetFields();
      });
    },
    [formNameRegion]
  );

  // начать редактирование
  const edit = (record) => {
    form.setFieldsValue({
      name: "",
      ...record,
    });
    setEditingKey(record.key);
  };

  // отмена редактирования
  const cancel = () => {
    setEditingKey("");
  };

  // локально обновить теги конкретной строки
  const updateRowTags = (rowKey, nextTags) => {
    setDataRegions((prev) =>
      prev.map((r) => (r.key === rowKey ? { ...r, codeName: nextTags } : r))
    );
  };

  // сохранить изменения (включая теги)
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataRegions];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const merged = { ...item, ...row }; // теги уже в merged.codeName

        newData.splice(index, 1, merged);
        setDataRegions(newData);
        setEditingKey("");

        // при необходимости адаптируйте под формат бэка
        const payload = {
          id: merged.id,
          nameRegion: merged.name,
          codeRegion: merged.codeName, // массив; если нужен CSV: merged.codeName.join(",")
        };
        api.patchRegion(payload);
      } else {
        newData.push(row);
        setDataRegions(newData);
        setEditingKey("");
      }
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  // локальный редактор тегов внутри ячейки
  const TagEditor = ({ value = [], onChange, editable }) => {
    const { token } = theme.useToken();
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
      if (inputVisible) inputRef.current?.focus();
    }, [inputVisible]);

    const removeTag = (tag) => {
      const next = value.filter((t) => t !== tag);
      onChange?.(next);
    };

    const addTag = () => {
      const v = inputValue.trim();
      if (v && !value.includes(v)) {
        onChange?.([...value, v]);
      }
      setInputVisible(false);
      setInputValue("");
    };

    const tagPlusStyle = {
      background: token.colorBgContainer,
      borderStyle: "dashed",
      cursor: "pointer",
    };

    // режим просмотра
    if (!editable) {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {value.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {value.length === 0 && (
            <Typography.Text type="secondary">—</Typography.Text>
          )}
        </div>
      );
    }

    // режим редактирования
    return (
      <>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <TweenOneGroup
            appear={false}
            enter={{ scale: 0.9, opacity: 0, type: "from", duration: 120 }}
            leave={{ opacity: 0, width: 0, scale: 0, duration: 180 }}
            onEnd={(e) => {
              if (e.type === "appear" || e.type === "enter") {
                e.target.style = "display: inline-block";
              }
            }}
          >
            {value.map((tag) => (
              <span key={tag} style={{ display: "inline-block" }}>
                <Tag
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    removeTag(tag);
                  }}
                >
                  {tag}
                </Tag>
              </span>
            ))}
          </TweenOneGroup>
        </div>

        {inputVisible ? (
          <Input
            ref={inputRef}
            type="text"
            size="small"
            style={{ width: 160 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={addTag}
            onPressEnter={addTag}
            placeholder="Новый тег"
            allowClear
          />
        ) : (
          <Tag onClick={() => setInputVisible(true)} style={tagPlusStyle}>
            <PlusOutlined /> Добавить тег
          </Tag>
        )}
      </>
    );
  };

  // колонки таблицы
  const columns = [
    {
      title: "#",
      dataIndex: "number",
      key: "number",
      width: 80,
    },
    {
      title: "Название участка",
      dataIndex: "name",
      key: "name",
      editable: true,
    },
    {
      title: "Код участка",
      dataIndex: "codeName",
      key: "codeName",
      render: (_, record) => {
        const editable = isEditing(record);
        return (
          <TagEditor
            value={record.codeName}
            editable={editable}
            onChange={(next) => updateRowTags(record.key, next)}
          />
        );
      },
    },
    {
      title: "Операции",
      dataIndex: "operation",
      key: "operation",
      width: 220,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link onClick={cancel} style={{ marginRight: 8 }}>
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
            &nbsp;&nbsp;
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
  ];

  // обёртка для редактируемых колонок
  const mergedColumns = columns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // загрузка регионов с приведениям codeRegion к массиву тегов
  const getRegions = () => {
    api
      .getRegionsAll()
      .then((res) => {
        const formattedRegions = res.map((item, n) => ({
          id: item.id,
          name: item.nameRegion,
          codeName: Array.isArray(item.codeRegion)
            ? item.codeRegion
            : item.codeRegion
            ? String(item.codeRegion)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          number: n + 1,
          key: `${uuidv4()}`,
        }));
        setDataRegions(formattedRegions);
      })
      .catch((err) => console.log(err));
  };

  // удаление строки
  const handleDelete = (key) => {
    const newData = dataRegions.filter((item) => item.key !== key);
    const deleteData = dataRegions.filter((item) => item.key === key);
    setDataRegions(newData);
    api.deleteRegion(deleteData).then(() => {
      getRegions();
    });
  };

  useEffect(() => {
    getRegions();
  }, []);

  return (
    <>
      <Divider orientation="left">Участки</Divider>

      <Form
        form={formNameRegion}
        name="createRegion"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        autoComplete="off"
        onFinishFailed={onFinishFailed}
        onFinish={onFinish}
      >
        <Form.Item
          label="Участок"
          name="nameRegion"
          rules={[{ required: true, message: "Введите название участка" }]}
        >
          <Input placeholder="Название участка" />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 4, span: 14 }}>
          <SubmitButton form={formNameRegion} />
        </Form.Item>
      </Form>

      <TableDirectories
        dataSource={dataRegions}
        columns={mergedColumns}
        editableCell={EditableCell}
        cancel={cancel}
        form={form}
      />
    </>
  );
};

export default Regions;
