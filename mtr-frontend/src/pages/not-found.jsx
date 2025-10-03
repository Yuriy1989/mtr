import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';

const NotFound = () => {
  const navigate = useNavigate();

  function goBack() {
    navigate("/");
  }

  return (
    <Result
      status="404"
      title="404"
      subTitle="Извините, страница не найдена, проверьте ссылку."
      extra={<Button onClick={ goBack } type="primary">Вернуться на главную</Button>}
    />
  )
}

export default NotFound;