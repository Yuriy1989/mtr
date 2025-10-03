import {
  HomeOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  CarOutlined,
  DeploymentUnitOutlined,
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  ContainerOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  FormOutlined,
  BookOutlined,
} from "@ant-design/icons";

const menuLevel_2_Settings = [
  {
    name: "Журнал",
    url: "/settings/journal",
    rolesRequired: [101],
    icon: BookOutlined,
  },
];

const menuLevel_2_Lastmile = [
  { name: "Приемка", url: "/lastmile/acceptance", icon: DeploymentUnitOutlined },
  { name: "Реестр", url: "/lastmile/registry", icon: FileTextOutlined },
];

export const menu_CreateOrders = [
  {
    icon: FileDoneOutlined,
    nameMenu: "Выход",
    url: "/",
  },
  {
    icon: FileDoneOutlined,
    nameMenu: "Просмотр",
    url: "/showOrders",
  },
];

const menuLevel_2_Apllication = [
  {
    name: "Сформировать",
    url: "/application",
    icon: FormOutlined,
  },
  {
    name: "Реестр",
    url: "/showApplications",
    icon: FileTextOutlined,
  },
];

const menuLevel_2_Request = [
  {
    name: "На согласование",
    url: "/transport-requests",
    icon: FileDoneOutlined,
  },
  {
    name: "Реестр",
    url: "/transport-requests/registry",
    icon: FileTextOutlined,
  },
];

export const menuLevel_2_Directories = [
  {
    name: "Пользователи",
    url: "/users",
    rolesRequired: [100],
    icon: TeamOutlined,
  },
  {
    name: "Склады",
    url: "/storages",
    rolesRequired: [100],
    icon: ContainerOutlined,
  },
  {
    name: "Отделы",
    url: "/departments",
    rolesRequired: [100],
    icon: ApartmentOutlined,
  },
  {
    name: "Участки",
    url: "/regions",
    rolesRequired: [100],
    icon: EnvironmentOutlined,
  },
  {
    name: "Филиалы",
    url: "/filials",
    rolesRequired: [100],
    icon: ClusterOutlined,
  },
  {
    name: "Единицы изменения",
    url: "/dimensions",
    rolesRequired: [100],
    icon: DatabaseOutlined,
  },
  {
    name: "Импорт данных",
    url: "/importVL06",
    rolesRequired: [100, 11],
    icon: FileDoneOutlined,
  },
];

export const OBJECT_MENU = [
  {
    icon: HomeOutlined,
    nameMenu: "Главная",
    menuLevel_2: [],
    url: "/",
  },
  {
    icon: FileTextOutlined,
    nameMenu: "Служебные записки",
    menuLevel_2: [],
    url: "/zapiska",
    rolesRequired: [100, 30, 20, 11],
  },
  {
    icon: FileDoneOutlined,
    nameMenu: "Движение МТР",
    menuLevel_2: menuLevel_2_Apllication,
    rolesRequired: [100, 20, 30, 40, 50],
  },
  {
    icon: CarOutlined,
    nameMenu: "Заявки на транспорт",
    menuLevel_2: menuLevel_2_Request,
    rolesRequired: [100, 20, 30],
  },
  {
    icon: DeploymentUnitOutlined,
    nameMenu: "Последняя миля",
    menuLevel_2: menuLevel_2_Lastmile,
    rolesRequired: [100, 30],
  },
  {
    nameMenu: "Отчёты",
    icon: BarChartOutlined,
    rolesRequired: [100, 40, 50, 20],
    menuLevel_2: [
      {
        name: "Приложение 3",
        url: "/reports/app3",
        icon: FileTextOutlined,
      },
      {
        name: "Сводная по Приложениям 3",
        url: "/reports/app3-summary",
        icon: BarChartOutlined,
      },
    ],
  },
  {
    icon: DatabaseOutlined,
    nameMenu: "Справочники",
    menuLevel_2: menuLevel_2_Directories,
  },
  {
    icon: SettingOutlined,
    nameMenu: "Настройки",
    menuLevel_2: menuLevel_2_Settings,
    rolesRequired: [100],
  },
];
