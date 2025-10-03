import { Result, Button } from "antd";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="Недостаточно прав для доступа к этой странице."
      extra={<Button><Link to="/">На главную</Link></Button>}
    />
  );
}
