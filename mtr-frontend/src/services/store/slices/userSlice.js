import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../../utils/ApiAuth";
import { getCookie, setCookie, deleteCookie } from "../../../utils/cookie";

const initialState = {
  isAuthChecked: false,
  isAuth: false,
  loading: false,
  error: null,
  accessToken: getCookie("accessToken") || null,
  userData: {},
};

// --- Thunks ---

export const login = createAsyncThunk(
  "user/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await api.login({ username, password });
      const { access_token, user } = res;

      if (!user) return rejectWithValue("Неверный логин или пароль");

      // refreshToken сервер положил в httpOnly-куку; сохраняем только access
      if (access_token) {
        setCookie("accessToken", access_token, { expires: 15 * 60, path: "/" });
      }

      return { access_token, user };
    } catch (e) {
      return rejectWithValue(e?.payload?.message || e?.message || "Ошибка авторизации");
    }
  }
);

export const checkAuth = createAsyncThunk(
  "user/checkAuth",
  async (_, { rejectWithValue, dispatch }) => {
    const token = getCookie("accessToken");
    if (!token) return { user: null };

    try {
      const res = await api.getMe();
      return { user: res.user || null };
    } catch (e) {
      if (e.status === 401) {
        try {
          const refreshed = await dispatch(refreshToken()).unwrap();
          if (refreshed?.access_token) {
            setCookie("accessToken", refreshed.access_token, { expires: 15 * 60, path: "/" });
          }
          const res = await api.getMe();
          return { user: res.user || null };
        } catch {
          deleteCookie("accessToken");
          return { user: null };
        }
      }
      return rejectWithValue("Сессия недействительна");
    }
  }
);

export const refreshToken = createAsyncThunk(
  "user/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.refreshToken();

      const { access_token } = res || {};
      if (access_token) {
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут
        setCookie("accessToken", access_token, { expires, path: "/" });
      }

      return { access_token };
    } catch (e) {
      const status = typeof e === "number" ? e : e?.status ?? e?.response?.status;
      const message =
        e?.message ??
        e?.response?.data?.message ??
        "Не удалось обновить токен";

      // при 401/403 можно инициировать логаут/очистку accessToken
      if (status === 401 || status === 403) {
        deleteCookie("accessToken");
      }

      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk("user/logout", async () => {
  await api.logout();
  deleteCookie("accessToken");
  return true;
});

// --- Slice ---

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.isAuthChecked = true;
        state.userData = action.payload.user;
        state.accessToken = action.payload.access_token || null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuth = false;
        state.isAuthChecked = true;
        state.userData = {};
        state.error = action.payload || "Ошибка авторизации";
      })

      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isAuthChecked = false;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthChecked = true;
        state.userData = action.payload.user || {};
        state.isAuth = !!action.payload.user;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isAuthChecked = true;
        state.isAuth = false;
        state.userData = {};
        state.accessToken = null;
        state.error = action.payload || null;
      })

      // Refresh
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access_token || null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isAuth = false;
        state.userData = {};
        state.accessToken = null;
        state.error = action.payload || "Ошибка обновления токена";
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuth = false;
        state.isAuthChecked = true;
        state.accessToken = null;
        state.userData = {};
        state.error = null;
      });
  },
});

export default userSlice.reducer;
