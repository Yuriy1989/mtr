import {
  Divider,
  Form,
  Input,
  Select,
  Typography,
  Popconfirm,
  Checkbox,
  message,
  Button,
} from "antd";
import SubmitButton from "../components/button/Button";
import { api } from "../utils/ApiDirectories";
import { apiUsers } from "../utils/ApiUsers";
import { useEffect, useState } from "react";
import TableDirectories from "../components/dataTable/DataTable";
import { v4 as uuidv4 } from "uuid";
import { RULES } from "../constants/rules"; // поправьте путь при необходимости

const { Option } = Select;

const Users = () => {
  const [formInput] = Form.useForm();
  const [departments, setDepartments] = useState([]); //филиалы
  const [regions, setRegions] = useState([]); //регионы
  const [storages, setStorages] = useState([]); //склады
  const [users, setUsers] = useState([]); //пользователи
  const [messageApi, contextHolder] = message.useMessage(); //сообщения об успешности создания пользователя
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const key = "updatable";

  //параметры самой таблицы, кол-во колонок, их названия и другое
  const columns = [
    {
      title: "#",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Фамилия",
      dataIndex: "surname",
      key: "surname",
    },
    {
      title: "Имя",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Отчество",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "E-mail",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Должность",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Отдел(группа)",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Склад",
      dataIndex: "storage",
      key: "storage",
    },
    {
      title: "Участок",
      dataIndex: "region",
      key: "region",
    },
    {
      title: "Роли",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => (
        <div>
          {roles.map((role, index) => (
            <div key={index}>{role}</div>
          ))}
        </div>
      ),
    },
    {
      title: "Операции",
      dataIndex: "operation",
      render: (_, record) => {
        return (
          <>
            <Typography.Link
              onClick={() => edit(record)}
            >
              Редактировать
            </Typography.Link>{" "}
            &nbsp;
            <Popconfirm
              title="Подтвердите удаление?"
              onConfirm={() => handleDelete(record.key)}
            >
              <Typography.Link
              >
                Удалить
              </Typography.Link>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  // запрос к бекенду для добавления нового user
  const onFinish = (values) => {
    apiUsers
      .createUser(values)
      .then((res) => {
        console.log("Ответ от сервера:", res);
        if (res && res.success === true) {
          getUsers();
          // Показать "success"
          messageApi.open({
            key,
            type: "success",
            content: "Пользователь успешно создан!",
            duration: 2,
          });

          // Очистить форму после успешного создания
          formInput.resetFields();
        } else {
          messageApi.open({
            key,
            type: "error",
            content: "Ошибка создания пользователя",
            duration: 2,
          });
          console.error("Ответ от сервера не содержит success:", res);
        }
      })
      .catch((err) => {
        messageApi.open({
          key,
          type: "error",
          content: `Ошибка: ${err?.message || err}`,
          duration: 2,
        });
        console.error("Ошибка при создании пользователя:", err);
      });
  };

  // передаем значение из таблицы в input для редактирования и сохраняем key выбранной строки
  const edit = (record) => {
    formInput.setFieldsValue({
      ...record,
      department: departments
        .find((d) => d.nameDepartment === record.department)
        ?.id?.toString(),
      storage: storages
        .find((s) => s.nameStorage === record.storage)
        ?.id?.toString(),
      region: regions
        .find((r) => r.nameRegion === record.region)
        ?.id?.toString(),
      roles: record.roles
        .map((roleLabel) => {
          const found = Object.entries(RULES).find(
            ([, label]) => label === roleLabel
          );
          return found ? String(found[0]) : null; // вернуть строковый ID
        })
        .filter(Boolean),
    });
    setIsEditingForm(true);
    setEditingUserId(record.id);
  };

  const handleUpdateUser = () => {
    formInput.validateFields().then(async (values) => {
      try {
        const updatedUser = {
          id: editingUserId,
          surname: values.surname,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          position: values.position,
          department: values.department,
          region: values.region,
          storage: values.storage,
          username: values.username,
          password: values.password,
          roles: values.roles,
        };
        // Добавляем пароль только если он не пустой
        if (values.password && values.password.trim() !== "") {
          updatedUser.password = values.password;
        }

        await apiUsers.patchUser(updatedUser);
        message.success("Пользователь успешно обновлен");
        getUsers();
        formInput.resetFields();
        setIsEditingForm(false);
        setEditingUserId(null);
      } catch (error) {
        console.error(
          "Ошибка при обновлении пользователя:",
          JSON.stringify(error, null, 2)
        );
        message.error(
          `Не удалось обновить пользователя: ${
            error?.message || JSON.stringify(error)
          }`
        );
      }
    });
  };

  // убираем удаленную строку и делаем запрос к бекенду для удаления выбранной строки
  const handleDelete = (key) => {
    const newData = users.filter((item) => item.key !== key);
    const deleteData = users.filter((item) => item.key === key);
    setUsers(newData);
    apiUsers.deleteUsers(deleteData).then((res) => {
      getUsers();
    });
  };

  const getDepartmentsAll = () => {
    api.getDepartmentsAll().then((res) => {
      setDepartments(res);
    });
  };

  const getRegionsAll = () => {
    api.getRegionsAll().then((res) => {
      setRegions(res);
    });
  };

  const getStoragesAll = () => {
    api.getStoragesAll().then((res) => {
      setStorages(res);
    });
  };

  const getUsers = () => {
    apiUsers
      .getUsers()
      .then((res) => {
        const formattedUsers = res.map((item, n) => {
          const roles = item.roles?.map((roleId) => RULES[roleId]) || [];
          return {
            id: item.id,
            key: `${uuidv4()}`,
            number: n + 1,
            username: item.username,
            surname: item.surname,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            position: item.position,
            department: item?.department?.nameDepartment,
            region: item?.region?.nameRegion,
            storage: item?.storage?.nameStorage,
            roles,
          };
        });
        setUsers(formattedUsers);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getDepartmentsAll();
    getRegionsAll();
    getStoragesAll();
    getUsers();
  }, []);

  return (
    <>
      {contextHolder}
      <Divider orientation="left">Пользователи</Divider>
      <Form
        form={formInput}
        name="createUser"
        labelCol={{
          span: 6,
        }}
        wrapperCol={{
          span: 14,
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          maxWidth: 900,
        }}
        initialValues={{
          remember: true,
        }}
        autoComplete="off"
        onFinish={onFinish}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 600,
          }}
        >
          <Form.Item
            label="Фамилия"
            name="surname"
            rules={[{ required: true, message: "Введите фамилию" }]}
          >
            <Input placeholder="Фамилия" />
          </Form.Item>

          <Form.Item
            label="Имя"
            name="firstName"
            rules={[{ required: true, message: "Введите имя пользователя" }]}
          >
            <Input placeholder="Имя" />
          </Form.Item>

          <Form.Item
            label="Отчество"
            name="lastName"
            rules={[{ required: true, message: "Введите отчество" }]}
          >
            <Input placeholder="Отчество" />
          </Form.Item>

          <Form.Item
            label="E-mail"
            name="email"
            rules={[{ required: true, message: "Введите e-mail" }]}
          >
            <Input placeholder="E-mail" />
          </Form.Item>

          <Form.Item
            label="Должность"
            name="position"
            rules={[{ required: true, message: "Введите должность" }]}
          >
            <Input placeholder="Должность" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Отдел(группа)"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              placeholder="Выберите отдел(группу) в которой числиться пользователь"
              allowClear
            >
              {departments.map((item, index) => (
                <Option key={index} value={`${item?.id}`}>
                  {item?.nameDepartment}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="storage" label="Склад">
            <Select
              placeholder="Выберите склад на котором работает работник"
              allowClear
            >
              {storages.map((item, index) => (
                <Option key={index} value={`${item?.id}`}>
                  {item?.nameStorage}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="region" label="Участок">
            <Select
              placeholder="Выберите регион на котором работает работник"
              allowClear
            >
              {regions.map((item, index) => (
                <Option key={index} value={`${item?.id}`}>
                  {item?.nameRegion}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Логин"
            name="username"
            rules={[{ required: true, message: "Введите логин" }]}
          >
            <Input placeholder="Логин" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={
              isEditingForm
                ? [] // без required при редактировании
                : [{ required: true, message: "Введите пароль" }]
            }
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              offset: 6,
              span: 14,
            }}
          >
            {isEditingForm ? (
              <Button
                type="button"
                className="ant-btn ant-btn-primary"
                onClick={handleUpdateUser}
              >
                Сохранить изменения
              </Button>
            ) : (
              <SubmitButton form={formInput} />
            )}
            {isEditingForm && (
              <Button
                type="button"
                className="ant-btn"
                onClick={() => {
                  setIsEditingForm(false);
                  setEditingUserId(null);
                  formInput.resetFields();
                }}
                style={{ marginLeft: 8 }}
              >
                Отмена
              </Button>
            )}
          </Form.Item>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 250,
          }}
        >
          <Form.Item
            name="roles"
            style={{ minWidth: 300 }}
            label="Роли"
            rules={[{ required: true, message: "Выберите хотя бы одну роль" }]}
          >
            <Checkbox.Group>
              {Object.entries(RULES).map(([id, label]) => (
                <Checkbox key={id} value={String(id)}>
                  {label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </div>
      </Form>
      <TableDirectories dataSource={users} columns={columns} />
    </>
  );
};

export default Users;
