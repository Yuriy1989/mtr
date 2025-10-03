import { Divider, Form, Input, Typography, Popconfirm, message } from "antd";
import SubmitButton from "../components/button/Button";
import EditableCell from "../components/editTableCell/EditTableCell";
import { api } from "../utils/ApiDirectories";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableDirectories from "../components/dataTable/DataTable";

const Departments = () => {
  const [formNameDepartment] = Form.useForm(); //встроенный хук ANTD для формы при добавленнии нового отдела
  const [form] = Form.useForm(); //встроенный хук ANTD для формы при изменении отдела
  const [dataDepartments, setDataDepartments] = useState([]); //отделы
  const [editingKey, setEditingKey] = useState("");
  const [msgApi, msgCtx] = message.useMessage(); // для сообщений пользователю
  const isEditing = (record) => record.key === editingKey;

  const getDepartments = useCallback(() => {
    api
      .getDepartmentsAll()
      .then((res) => {
        const formatted = res.map((item, n) => ({
          id: item.id,
          name: item.nameDepartment,
          numberDepartment: item.numberDepartment,
          number: n + 1,
          key: `${uuidv4()}`,
        }));
        setDataDepartments(formatted);
      })
      .catch((err) => {
        msgApi.error(`Не удалось загрузить отделы: ${err.message}`);
        console.error(err);
      });
  }, [msgApi]);

  // вывод ошибок в консоль в случае пустых input,
  // но тут кнопка не активна пока не будет заполнены все input
  const onFinishFailed = (errorInfo) => {
    console.error("Failed", errorInfo);
  };

  const onFinish = useCallback(
    (values) => {
      api
        .createDepartment(values)
        .then(() => {
          msgApi.success("Отдел создан");
          formNameDepartment.resetFields();
          getDepartments();
        })
        .catch((err) => {
          msgApi.error(`Ошибка при создании: ${err.message}`);
          console.error(err);
        });
    },
    [getDepartments, msgApi, formNameDepartment]
  );

  // передаем значение из таблицы в input для редактирования и сохраняем key выбранной строки
  const edit = (record) => {
    form.setFieldsValue({
      name: "",
      ...record,
    });
    setEditingKey(record.key);
  };

  const handleDelete = async (key) => {
    const row = dataDepartments.find((item) => item.key === key);
    if (!row) return;

    try {
      // НЕ удаляем из state заранее
      await api.deleteDepartment(row);
      // удачно — теперь обновим список
      msgApi.success("Отдел удалён");
      getDepartments();
    } catch (err) {
      // Специальный кейс: нарушение внешнего ключа
      if (
        err.code === "23503" ||
        err.code === "ER_ROW_IS_REFERENCED_2" ||
        err.status === 409
      ) {
        msgApi.error("Нельзя удалить отдел: к нему привязаны пользователи.");
      } else {
        msgApi.error(`Ошибка при удалении: ${err.message}`);
      }
      console.error(err);
      // Ничего не трогаем в state — строка остаётся
    }
  };

  // отменяем редактирования и сбрасывает key выбранной строки
  const cancel = () => {
    setEditingKey("");
  };

  const save = async (key) => {
    try {
      const row = await form.validateFields();
      const newData = [...dataDepartments];
      const index = newData.findIndex((item) => key === item.key);

      if (index > -1) {
        const item = newData[index];
        const updated = { ...item, ...row };
        // сначала бекенд
        await api.patchDepartment(updated);
        // потом локальный стейт
        newData.splice(index, 1, updated);
        setDataDepartments(newData);
        setEditingKey("");
        msgApi.success("Изменения сохранены");
      }
    } catch (err) {
      msgApi.error(`Не удалось сохранить: ${err?.message || "проверьте поля"}`);
      console.error(err);
    }
  };

  //параметры самой таблицы, кол-во колонок, их названия и другое
  const columns = [
    {
      title: "#",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Отдел(группа)",
      dataIndex: "name",
      key: "name",
      editable: true,
    },
    {
      title: "Номер отдела(группы)",
      dataIndex: "numberDepartment",
      key: "numberDepartment",
      editable: true,
    },
    {
      title: "Операции",
      dataIndex: "operation",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => cancel()}
              style={{
                marginRight: 8,
              }}
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
            </Typography.Link>{" "}
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
  ];

  //параметры самой таблицы, с учетом редактирования
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
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

  useEffect(() => {
    getDepartments();
  }, [getDepartments]);

  return (
    <>
      {msgCtx}
      <Divider orientation="left">Отделы</Divider>
      <Form
        form={formNameDepartment}
        name="createDepartment"
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 14,
        }}
        style={{
          maxWidth: 600,
        }}
        initialValues={{
          remember: true,
        }}
        autoComplete="off"
        onFinishFailed={onFinishFailed}
        onFinish={onFinish}
      >
        <Form.Item
          label="Отдел(группа)"
          name="nameDepartment"
          rules={[
            { required: true, message: "Введите название отдела(группы)" },
          ]}
        >
          <Input placeholder="Название отдела(группы)"></Input>
        </Form.Item>

        <Form.Item
          label="Номер отдела(группы)"
          name="numberDepartment"
          rules={[{ required: true, message: "Введите номер отдела(группы)" }]}
        >
          <Input placeholder="Название номер отдела(группы)"></Input>
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 8,
            span: 14,
          }}
        >
          <SubmitButton form={formNameDepartment} />
        </Form.Item>
      </Form>
      <TableDirectories
        dataSource={dataDepartments}
        columns={mergedColumns}
        editableCell={EditableCell}
        cancel={cancel}
        form={form}
      />
    </>
  );
};

export default Departments;
