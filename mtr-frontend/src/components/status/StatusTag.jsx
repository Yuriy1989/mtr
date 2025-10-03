import { Tag } from "antd";
import { statusColor, STATUS_FOR_MTR, STATUS_FOR_ZAPISKA, STATUS_FOR_APP3 } from "../../constants/status";
import { statusIcon } from "../../constants/statusIcons";

/**
 * Универсальный компонент для отображения статуса
 *
 * props:
 * - code: число/строка статуса
 * - type: "mtr" | "zapiska" | "app3" (по умолчанию "mtr")
 * - short: true/false — использовать короткий вариант текста (если есть)
 */
const StatusTag = ({ code, type = "mtr", short = false }) => {
  let dict;
  if (type === "zapiska") dict = STATUS_FOR_ZAPISKA;
  else if (type === "app3") dict = STATUS_FOR_APP3;
  else dict = STATUS_FOR_MTR;

  const text = dict[code] || "Неизвестно";
  const Icon = statusIcon(code);
  const color = statusColor(code);

  return (
    <Tag color={color} icon={<Icon />} style={{ display: "inline-flex", alignItems: "center" }}>
      {text}
    </Tag>
  );
};

export default StatusTag;
