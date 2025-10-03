import {
  DeleteOutlined,
  PlusCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  HourglassOutlined,
  RocketOutlined,
  SyncOutlined,
  FlagOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import { normalizeStatus } from "./status";

// функция подбора иконки по коду статуса
export const statusIcon = (code) => {
  const c = normalizeStatus(code);

  if (c === 0) return DeleteOutlined;                  // Удален
  if (c === 10) return PlusCircleOutlined;             // Новая
  if (c === 20) return EditOutlined;                   // Создание СЗ
  if (c === 30) return CheckCircleOutlined;            // Согласован
  if (c === 40) return HourglassOutlined;              // В сборке / формирование
  if (c === 50) return RocketOutlined;                 // Отправлено
  if (c === 60) return SyncOutlined;                   // Отправлено частично
  if (c === 100) return FlagOutlined;                  // Завершено
  if (c === 110) return ExclamationCircleOutlined;     // Завершено частично
  if (c === 115) return WarningOutlined;               // Завершено частично, но есть проблемы
  if (c === 120) return AlertOutlined;                 // Завершено, но есть проблемы
  if (c === 130) return CloseCircleOutlined;           // Не принят

  return EditOutlined; // дефолт
};
