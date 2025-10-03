import { useEffect, useMemo, useState } from "react";
import {
  Layout,
  Modal,
  Avatar,
  Dropdown,
  Breadcrumb,
  Tooltip,
  Space,
  Typography,
} from "antd";
import NotificationsBell from "../notifications/NotificationsBell";
import {
  UserOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useLocation, Link, Outlet } from "react-router-dom";
import { logout } from "../../services/store/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import MainMenu from "../../components/menu/Menu";
import styleApp from "./App.module.css";
import dayjs from "dayjs";
import { OBJECT_MENU } from "../../constants/menu";

const { Header, Footer, Sider, Content } = Layout;
const { Text } = Typography;
const year = new Date();

const LayoutMain = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(dayjs());
  const dispatch = useDispatch();
  const user = useSelector((state) => state.users.userData);
  const location = useLocation();

  // Часы в шапке
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);

  const showModal = () => setIsModalVisible(true);
  const handleClick = () => {
    dispatch(logout());
    window.location.href = "/login";
    setIsModalVisible(false);
  };
  const handleCancel = () => setIsModalVisible(false);

  const menuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Выйти",
      onClick: showModal,
    },
  ];

  // карта для хлебных крошек из OBJECT_MENU
  const breadcrumbItems = useMemo(() => {
    const flat = [];

    (OBJECT_MENU || []).forEach((m) => {
      if (m.url) flat.push({ path: m.url, label: m.nameMenu });
      (m.menuLevel_2 || []).forEach((c) => {
        if (c.url) flat.push({ path: c.url, label: c.name });
      });
    });

    const parts = location.pathname.split("/").filter(Boolean);
    const acc = [];
    const crumbs = parts.map((_, idx) => {
      const path = "/" + parts.slice(0, idx + 1).join("/");
      acc.push(path);
      const match = flat.find((f) => f.path === path) || { // fallback — просто сегмент пути
        path,
        label: decodeURIComponent(parts[idx]),
      };
      return {
        title:
          idx < parts.length - 1 ? (
            <Link to={match.path}>{match.label}</Link>
          ) : (
            match.label
          ),
      };
    });

    return [{ title: <Link to="/">Главная</Link> }, ...crumbs];
  }, [location.pathname]);

  const appVersion =
    (typeof process !== "undefined" && process?.env?.REACT_APP_VERSION) || "";

  return (
    <div className={styleApp.bodyMain}>
      <Layout hasSider>
        <Sider
          className={styleApp.siderStyle}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={240}
          collapsedWidth={64}
          breakpoint="lg"
        >
          <div className={styleApp.brand}>
            <div className={styleApp.brandLogo} />
            {!collapsed && <div className={styleApp.brandTitle}>МТР</div>}
          </div>
          <MainMenu />
        </Sider>

        <Layout className={styleApp.main}>
          <Header className={styleApp.header}>
            <div className={styleApp.headerLeft}>
              <button
                className={styleApp.collapseBtn}
                onClick={() => setCollapsed((v) => !v)}
                aria-label="Toggle menu"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
              <Breadcrumb items={breadcrumbItems} />
            </div>

            <div className={styleApp.headerRight}>
              <Space size="middle" align="center">
                <Text className={styleApp.clock} title="Местное время">
                  {now.format("DD.MM.YYYY HH:mm:ss")}
                </Text>

                <NotificationsBell />

                <Tooltip title="О системе">
                  <InfoCircleOutlined className={styleApp.iconBtn} />
                </Tooltip>

                <Dropdown
                  menu={{ items: menuItems }}
                  placement="bottomRight"
                  arrow
                >
                  <Avatar
                    size="large"
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: "#f56a00",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  />
                </Dropdown>

                <div className={styleApp.userName}>
                  {user?.firstName} {user?.lastName}
                </div>
              </Space>
            </div>
          </Header>

          <Content className={styleApp.contentStyle}>
            <Outlet />
          </Content>

          <Footer className={styleApp.footer}>
            <div className={styleApp.footerRow}>
              <span>
                Югорское Управление материально-технического снабжения и
                комплектации © {year.getFullYear()}
              </span>

              <span className={styleApp.dot} />

              <span>Версия: {appVersion || "—"}</span>

              <span className={styleApp.dot} />

              <span>Среда: {process.env.NODE_ENV || "production"}</span>

              <span className={styleApp.dot} />

              <span>
                Пользователь:{" "}
                {user?.username || `${user?.firstName || ""}`.trim()}
              </span>
            </div>
          </Footer>
        </Layout>
      </Layout>

      {/* Модалка выхода */}
      <Modal
        title="Вы точно хотите выйти?"
        open={isModalVisible}
        onOk={handleClick}
        onCancel={handleCancel}
        okText="Да"
        cancelText="Нет"
      >
        <p>Выход из приложения приведёт к завершению текущей сессии.</p>
      </Modal>
    </div>
  );
};

export default LayoutMain;
