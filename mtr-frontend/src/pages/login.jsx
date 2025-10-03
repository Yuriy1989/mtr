import { useEffect } from "react";
import { Form, Input, Button, Typography, App } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { login, checkAuth } from "../services/store/slices/userSlice";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const Login = () => {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuth, loading, error } = useSelector((state) => state.users);
  const [form] = Form.useForm();

  useEffect(() => {
    if (isAuth) navigate("/");
  }, [isAuth, navigate]);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // показываем ошибки (если хочешь показывать только ошибки login — отфильтруй по типу экшена в слайсе)
  useEffect(() => {
    if (error) message.error(error);
  }, [error, message]);

  const onFinish = async (values) => {
    try {
      await dispatch(login(values)).unwrap();
      message.success("Вы успешно вошли!");
      form.resetFields();
    } catch (err) {
      message.error(err || "Ошибка авторизации");
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}>
      <div style={{
        width: 400,
        padding: 30,
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
          Вход
        </Title>
        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="Имя пользователя"
            name="username"
            rules={[{ required: true, message: "Введите имя пользователя" }]}
          >
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: "100%" }}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
