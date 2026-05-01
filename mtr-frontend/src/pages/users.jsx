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
  Tabs,
  Switch,
  Space,
} from "antd";
import SubmitButton from "../components/button/Button";
import { api } from "../utils/ApiDirectories";
import { apiUsers } from "../utils/ApiUsers";
import { useEffect, useState } from "react";
import TableDirectories from "../components/dataTable/DataTable";
import { v4 as uuidv4 } from "uuid";
import { RULES } from "../constants/rules"; // поправьте путь при необходимости

const { Option } = Select;
const TOKEN_PREFIX = "$";
const DEFAULT_AD_USER_DN_TEMPLATE = `${TOKEN_PREFIX}{username}@${TOKEN_PREFIX}{domain}`;

const Users = () => {
  const [formInput] = Form.useForm();
  const [departments, setDepartments] = useState([]); //филиалы
  const [regions, setRegions] = useState([]); //регионы
  const [storages, setStorages] = useState([]); //склады
  const [users, setUsers] = useState([]); //пользователи
  const [adUsers, setAdUsers] = useState([]);
  const [adUsersLoading, setAdUsersLoading] = useState(false);
  const [adSearch, setAdSearch] = useState("");
  const [activeTab, setActiveTab] = useState("local");
  const [adSettingsForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage(); //сообщения об успешности создания пользователя
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const authProvider = Form.useWatch("authProvider", formInput) || "local";
  const isAdUserForm = authProvider === "ad";
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
      title: "Тип",
      dataIndex: "authProvider",
      key: "authProvider",
      render: (value) => (value === "ad" ? "AD DS" : "Локальный"),
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

  const adColumns = [
    {
      title: "Логин",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "ФИО",
      dataIndex: "displayName",
      key: "displayName",
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
      title: "UPN",
      dataIndex: "userPrincipalName",
      key: "userPrincipalName",
    },
    {
      title: "Статус",
      dataIndex: "registered",
      key: "registered",
      render: (registered) => (registered ? "Уже добавлен" : "Не добавлен"),
    },
    {
      title: "Операции",
      dataIndex: "operation",
      render: (_, record) =>
        record.registered ? (
          <Typography.Text type="secondary">Уже добавлен</Typography.Text>
        ) : (
          <Typography.Link onClick={() => assignAdUser(record)}>
            Назначить права
          </Typography.Link>
        ),
    },
  ];

  // запрос к бекенду для добавления нового user
  const onFinish = (values) => {
    const request =
      values.authProvider === "ad"
        ? apiUsers.importAdUser(values)
        : apiUsers.createUser(values);

    request
      .then((res) => {
        console.log("Ответ от сервера:", res);
        if (res && res.success === true) {
          getUsers();
          // Показать "success"
          messageApi.open({
            key,
            type: "success",
            content: "Пользователь успешно сохранен!",
            duration: 2,
          });

          // Очистить форму после успешного создания
          formInput.resetFields();
          setIsEditingForm(false);
          setEditingUserId(null);
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

  const assignAdUser = (record) => {
    const existingUser = users.find(
      (user) => user.username?.toLowerCase() === record.username?.toLowerCase()
    );
    if (existingUser) {
      messageApi.open({
        key,
        type: "warning",
        content: "Этот пользователь уже зарегистрирован в системе.",
        duration: 3,
      });
      return;
    }

    formInput.setFieldsValue({
      ...record,
      authProvider: "ad",
      department: existingUser?.department
        ? departments.find((d) => d.nameDepartment === existingUser.department)?.id?.toString()
        : undefined,
      storage: existingUser?.storage
        ? storages.find((s) => s.nameStorage === existingUser.storage)?.id?.toString()
        : undefined,
      region: existingUser?.region
        ? regions.find((r) => r.nameRegion === existingUser.region)?.id?.toString()
        : undefined,
      roles: existingUser?.roles
        ? existingUser.roles
            .map((roleLabel) => {
              const found = Object.entries(RULES).find(([, label]) => label === roleLabel);
              return found ? String(found[0]) : null;
            })
            .filter(Boolean)
        : ["10"],
      password: undefined,
      adDn: record.distinguishedName,
    });
    setIsEditingForm(false);
    setEditingUserId(null);
    setActiveTab("local");
    messageApi.open({
      key,
      type: "info",
      content: "Пользователь AD перенесен в форму. Выберите отдел и роли.",
      duration: 3,
    });
  };

  // передаем значение из таблицы в input для редактирования и сохраняем key выбранной строки
  const edit = (record) => {
    formInput.setFieldsValue({
      ...record,
      authProvider: record.authProvider || "local",
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
          password: values.authProvider === "ad" ? undefined : values.password,
          roles: values.roles,
          authProvider: values.authProvider,
          adDn: values.adDn,
        };
        // Добавляем пароль только если он не пустой
        if (
          values.authProvider !== "ad" &&
          values.password &&
          values.password.trim() !== ""
        ) {
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
            authProvider: item.authProvider,
            adDn: item.adDn,
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

  const getAdSettings = () => {
    apiUsers
      .getAdSettings()
      .then((res) => {
        adSettingsForm.setFieldsValue({
          enabled: res.enabled,
          url: res.url,
          domain: res.domain,
          baseDn: res.baseDn,
          bindUsername: res.bindUsername,
          bindPassword: undefined,
          userDnTemplate: res.userDnTemplate,
          timeout: res.timeout,
        });
      })
      .catch((err) => message.error(err?.message || "Не удалось получить настройки AD"));
  };

  const saveAdSettings = async (values) => {
    try {
      await apiUsers.updateAdSettings(values);
      message.success("Настройки AD сохранены");
      getAdSettings();
    } catch (err) {
      message.error(err?.message || "Не удалось сохранить настройки AD");
    }
  };

  const getAdUsers = async (search = adSearch) => {
    setAdUsersLoading(true);
    try {
      const res = await apiUsers.getAdUsers(search);
      setAdUsers(
        res.map((item) => ({
          ...item,
          key: item.distinguishedName || item.username,
          registered: users.some(
            (user) =>
              user.username?.toLowerCase() === item.username?.toLowerCase()
          ),
        }))
      );
    } catch (err) {
      message.error(err?.message || "Не удалось получить пользователей AD");
    } finally {
      setAdUsersLoading(false);
    }
  };

  useEffect(() => {
    getDepartmentsAll();
    getRegionsAll();
    getStoragesAll();
    getUsers();
    getAdSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {contextHolder}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "local",
            label: "Пользователи",
            children: (
              <>
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

          <Form.Item name="authProvider" initialValue="local" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="adDn" hidden>
            <Input />
          </Form.Item>

          {!isAdUserForm && (
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
          )}
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
            ),
          },
          {
            key: "ad-users",
            label: "Пользователи AD",
            children: (
              <>
                <Divider orientation="left">Пользователи домена</Divider>
                <Space style={{ marginBottom: 16 }} wrap>
                  <Input.Search
                    allowClear
                    placeholder="Логин, ФИО, e-mail"
                    enterButton="Найти"
                    loading={adUsersLoading}
                    value={adSearch}
                    onChange={(event) => setAdSearch(event.target.value)}
                    onSearch={(value) => getAdUsers(value)}
                    style={{ width: 360 }}
                  />
                  <Button onClick={() => getAdUsers("")} loading={adUsersLoading}>
                    Показать всех
                  </Button>
                </Space>
                <TableDirectories dataSource={adUsers} columns={adColumns} />
              </>
            ),
          },
          {
            key: "ad-settings",
            label: "Настройки AD",
            children: (
              <>
                <Divider orientation="left">Подключение к домену</Divider>
                <Form
                  form={adSettingsForm}
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 12 }}
                  style={{ maxWidth: 900 }}
                  onFinish={saveAdSettings}
                  initialValues={{
                    enabled: false,
                    url: "ldap://192.168.2.20:389",
                    domain: "mfc.dom",
                    baseDn: "DC=mfc,DC=dom",
                    bindUsername: "Администратор@mfc.dom",
                    userDnTemplate: DEFAULT_AD_USER_DN_TEMPLATE,
                    timeout: 5000,
                  }}
                >
                  <Form.Item name="enabled" label="AD включен" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="url" label="LDAP адрес" rules={[{ required: true }]}>
                    <Input placeholder="ldap://192.168.2.20:389" />
                  </Form.Item>
                  <Form.Item name="domain" label="Домен" rules={[{ required: true }]}>
                    <Input placeholder="mfc.dom" />
                  </Form.Item>
                  <Form.Item name="baseDn" label="Base DN" rules={[{ required: true }]}>
                    <Input placeholder="DC=mfc,DC=dom" />
                  </Form.Item>
                  <Form.Item name="bindUsername" label="Администратор AD" rules={[{ required: true }]}>
                    <Input placeholder="Администратор@mfc.dom" />
                  </Form.Item>
                  <Form.Item name="bindPassword" label="Пароль AD">
                    <Input.Password placeholder="Оставьте пустым, чтобы не менять" />
                  </Form.Item>
                  <Form.Item name="userDnTemplate" label="Шаблон входа" rules={[{ required: true }]}>
                    <Input placeholder={DEFAULT_AD_USER_DN_TEMPLATE} />
                  </Form.Item>
                  <Form.Item name="timeout" label="Таймаут, мс" rules={[{ required: true }]}>
                    <Input type="number" min={1000} max={60000} />
                  </Form.Item>
                  <Form.Item wrapperCol={{ offset: 6, span: 12 }}>
                    <Button type="primary" htmlType="submit">
                      Сохранить настройки
                    </Button>
                  </Form.Item>
                </Form>
              </>
            ),
          },
        ]}
      />
    </>
  );
};

export default Users;
