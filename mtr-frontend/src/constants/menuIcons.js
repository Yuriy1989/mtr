import {
  HomeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ClusterOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  CarOutlined,
  FileTextOutlined,
  ContainerOutlined,
  SettingOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FormOutlined,
  EditOutlined,
  PlusSquareOutlined,
  UploadOutlined,
  ScheduleOutlined,
  BookOutlined,
  ExperimentOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  InboxOutlined,
} from "@ant-design/icons";

const byKeyword = [
  { kw: ["главная", "main", "/"], icon: HomeOutlined },
  { kw: ["users", "пользов", "сотруд"], icon: TeamOutlined },
  { kw: ["depart", "отдел"], icon: ApartmentOutlined },
  { kw: ["filial", "филиал"], icon: ClusterOutlined },
  { kw: ["storage", "склад"], icon: ContainerOutlined },
  { kw: ["region", "регион"], icon: EnvironmentOutlined },
  { kw: ["dimension", "единиц", "размер"], icon: DeploymentUnitOutlined },
  { kw: ["deliver", "доставка", "перевоз"], icon: CarOutlined },
  { kw: ["zapiska", "служеб"], icon: FileTextOutlined },
  { kw: ["import", "vl06", "загрузка"], icon: UploadOutlined },
  { kw: ["application", "прилож"], icon: FormOutlined },
  { kw: ["showApplications", "реестр", "журнал"], icon: InboxOutlined },
  { kw: ["reports", "отчёт", "report", "analytics"], icon: BarChartOutlined },
  { kw: ["summary", "свод"], icon: PieChartOutlined },
  { kw: ["edit", "редак"], icon: EditOutlined },
  { kw: ["create", "нов", "add"], icon: PlusSquareOutlined },
  { kw: ["settings", "настрой"], icon: SettingOutlined },
  { kw: ["lastmile", "приемосдат", "последняя миля"], icon: SafetyCertificateOutlined },
  { kw: ["transport", "транспорт"], icon: CarOutlined },
  { kw: ["journal", "лог", "аудит"], icon: BookOutlined },
  { kw: ["dict", "справ", "directories"], icon: DatabaseOutlined },
  { kw: ["activity", "активн"], icon: ScheduleOutlined },
  { kw: ["test", "экспер"], icon: ExperimentOutlined },
  { kw: ["tools", "инструм"], icon: ToolOutlined },
  { kw: ["apps", "модули"], icon: AppstoreOutlined },
];

export const pickIconByText = (label = "", url = "") => {
  const s = `${(label || "").toLowerCase()} ${url || ""}`.toLowerCase();
  for (const rule of byKeyword) {
    if (rule.kw.some((k) => s.includes(k))) return rule.icon;
  }
  return AppstoreOutlined; // дефолтная
};
