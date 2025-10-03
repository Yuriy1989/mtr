import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ConfigProvider, App as AntApp } from "antd";
import ruRU from "antd/locale/ru_RU";
import dayjs from "dayjs";
import "dayjs/locale/ru";
// pages
import Main from "../../pages/main";
import Users from "../../pages/users";
import Departments from "../../pages/departments";
import Filials from "../../pages/filials";
import Storages from "../../pages/storages";
import Regions from "../../pages/regions";
import Dimensions from "../../pages/dimensions";
import Login from "../../pages/login";
import Application from "../../pages/application";
import LayoutMain from "../../components/layout/layout";
import NotFound from "../../pages/not-found";
import ShowApplications from "../../pages/showApplication";
import Zapiska from "../../pages/zapiska";
import CreateZapiskaFromImport from "../../pages/createZapiskaFromImport";
import ImportVL06 from "../../pages/importVL06";
import EditZapiskaFromImport from "../../pages/editZapiskaFromImport";
import Application3Create from "../../pages/Application3Create";
import ReportsApp3 from "../../pages/ReportsApp3";
import ReportsApp3Summary from "../../pages/ReportsApp3Summary";
import Forbidden from "../../pages/Forbidden";
import TransportRequests from "../../pages/TransportRequests";
import TransportRegistry from "../../pages/TransportRegistry";
import Journal from "../../pages/Journal";
import LastmileAcceptance from "../../pages/LastmileAcceptance";
import LastmileAcceptanceDetail from "../../pages/LastmileAcceptanceDetail";
import LastmileRegistry from "../../pages/LastmileRegistry";
import LastmileRegistryDetail from "../../pages/LastmileRegistryDetail";

import "../../theme/Application.css";
// auth
import { ProtectedRoute } from "../ProtectedRoute";
import { checkAuth, refreshToken } from "../../services/store/slices/userSlice";

dayjs.locale("ru");

function App() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.users.accessToken);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => {
      dispatch(refreshToken());
    }, 14 * 60 * 1000);
    return () => clearInterval(id);
  }, [accessToken, dispatch]);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 10,
          colorBgContainer: "#ffffff",
          colorText: "#1f1f1f",
        },
        components: {
          Layout: {
            headerBg: "#ffffff",
            siderBg: "#f7f9fc",
            bodyBg: "#f5f5f5",
            footerBg: "#ffffff",
          },
          Menu: {
            itemBorderRadius: 8,
            itemHoverBg: "rgba(22,119,255,0.08)",
            itemSelectedBg: "rgba(22,119,255,0.16)",
          },
          Breadcrumb: {
            linkColor: "#1677ff",
            linkHoverColor: "#0958d9",
          },
          Tag: {
            defaultBg: "#f5f5f5",
            defaultColor: "#595959",
          },
        },
      }}
    >
      <AntApp>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LayoutMain />
              </ProtectedRoute>
            }
          >
            <Route index element={<Main />} />

            {/* только админ (роль 100) */}
            <Route
              path="users"
              element={
                <ProtectedRoute rolesRequired={[100]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="lastmile/acceptance"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <LastmileAcceptance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lastmile/registry/:appId"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <LastmileRegistryDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="lastmile/acceptance/:appId"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <LastmileAcceptanceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="lastmile/registry"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <LastmileRegistry />
                </ProtectedRoute>
              }
            />
            <Route
              path="departments"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Departments />
                </ProtectedRoute>
              }
            />
            <Route
              path="filials"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Filials />
                </ProtectedRoute>
              }
            />
            <Route
              path="storages"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Storages />
                </ProtectedRoute>
              }
            />
            <Route
              path="regions"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Regions />
                </ProtectedRoute>
              }
            />
            <Route
              path="dimensions"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Dimensions />
                </ProtectedRoute>
              }
            />
            <Route
              path="zapiska"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Zapiska />
                </ProtectedRoute>
              }
            />
            <Route
              path="showApplications"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <ShowApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="application"
              element={
                <ProtectedRoute rolesRequired={[100, 30]}>
                  <Application />
                </ProtectedRoute>
              }
            />
            <Route
              path="importVL06"
              element={
                <ProtectedRoute rolesRequired={[100, 11]}>
                  <ImportVL06 />
                </ProtectedRoute>
              }
            />
            <Route
              path="transport-requests"
              element={
                <ProtectedRoute rolesRequired={[100, 50]}>
                  <TransportRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="transport-requests/registry"
              element={
                <ProtectedRoute rolesRequired={[100, 50]}>
                  <TransportRegistry />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings/journal"
              element={
                <ProtectedRoute rolesRequired={[101, 100, 40]}>
                  <Journal />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/app3"
              element={
                <ProtectedRoute rolesRequired={[100, 50, 40]}>
                  <ReportsApp3 />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports/app3-summary"
              element={
                <ProtectedRoute rolesRequired={[100, 50, 40]}>
                  <ReportsApp3Summary />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/application/app3/new/:id"
            element={
              <ProtectedRoute rolesRequired={[100, 20]}>
                <Application3Create />
              </ProtectedRoute>
            }
          />
          <Route
            path="/createZapiskaFromImport"
            element={
              <ProtectedRoute rolesRequired={[100, 11]}>
                <CreateZapiskaFromImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editZapiskaFromImport/:idZapiska"
            element={
              <ProtectedRoute rolesRequired={[100, 11]}>
                <EditZapiskaFromImport />
              </ProtectedRoute>
            }
          />
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
