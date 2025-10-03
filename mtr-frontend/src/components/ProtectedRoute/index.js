import { useSelector } from "react-redux";
import { useLocation, Navigate } from "react-router-dom";

const normalizeRoles = (roles) =>
  (roles || []).map((r) => Number(r)).filter((n) => !Number.isNaN(n));

export const ProtectedRoute = ({
  onlyUnAuth = false,
  rolesRequired = [],
  children,
}) => {
  const location = useLocation();
  const { isAuth, isAuthChecked, userData } = useSelector((state) => state.users);

  if (!isAuthChecked) {
    return <p>Загрузка...</p>;
  }

  // Роуты только для неавторизованных (если используете)
  if (onlyUnAuth) {
    return isAuth ? <Navigate to="/" replace /> : children;
  }

  // Обычная защита авторизацией
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка ролей (OR-логика: достаточно одной роли)
  if (rolesRequired.length > 0) {
    const userRoles = normalizeRoles(userData?.roles);
    const required = normalizeRoles(rolesRequired);
    const hasAny = required.some((r) => userRoles.includes(r));

    if (!hasAny) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
};
