# ShrimpMate Mobile 🦐

Ứng dụng di động quản lý và giám sát ao nuôi tôm thông minh (IoT & Aquaculture Management) được xây dựng trên nền tảng **React Native**, **Expo (SDK 57)** và **Expo Router** (File-based Routing).

---

## 🚀 Cấu trúc dự án (Architecture)

```
ShrimpMate_Mobile/
├── assets/                   # Hình ảnh, splash, icons, tab icons
├── src/
│   ├── app/                  # Expo Router - File-based routing
│   │   ├── _layout.tsx       # Root Layout với AuthProvider & ThemeProvider
│   │   ├── index.tsx         # Trang chủ / Dashboard giám sát ao tôm
│   │   └── explore.tsx       # Màn hình điều khiển thiết bị & cảnh báo
│   ├── api/                  # API Client & Services (Axios/Fetch layer)
│   │   ├── client.ts         # ApiClient xử lý timeout, token interceptor, json parse
│   │   ├── endpoints.ts      # Danh mục đường dẫn API tập trung
│   │   └── services/         # auth.service.ts, pond.service.ts, alert.service.ts
│   ├── components/           # UI Components
│   │   ├── common/           # Button, StatusBadge, MetricCard, PondCard
│   │   ├── app-tabs.tsx      # Native Bottom Tabs navigation
│   │   └── ui/               # Collapsible, etc.
│   ├── constants/            # Theme, Colors (Aquaculture semantic), Config
│   ├── context/              # React Context (auth-context.tsx)
│   ├── hooks/                # Custom hooks (useAuth, usePonds, useTheme)
│   ├── types/                # TypeScript Interfaces (Pond, SensorMetric, Alert, User, Api)
│   └── utils/                # Formatters (ngày giờ VN, chỉ số nước), Storage
├── app.json                  # Cấu hình Expo
├── tsconfig.json             # TypeScript & Path aliases (@/*)
└── package.json
```

---

## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Khởi động môi trường phát triển (Metro Bundler)

```bash
npm start
# hoặc:
npx expo start
```

### 2. Chạy trên thiết bị hoặc máy ảo:
- **Thiết bị thật (Expo Go)**: Quét mã QR hiển thị trong terminal bằng app Expo Go (trên Android) hoặc Camera (trên iOS).
- **Android Emulator**: Nhấn phím `a` trong terminal (hoặc chạy `npm run android`).
- **Web Browser**: Nhấn phím `w` trong terminal (hoặc chạy `npm run web`).

---

## 🧪 Kiểm tra TypeScript

Để kiểm tra kiểu dữ liệu toàn bộ dự án:

```bash
npx tsc --noEmit
```

---

## ⚙️ Biến môi trường (.env)

Tạo file `.env` từ file mẫu `.env.example`:

```env
EXPO_PUBLIC_API_URL=https://api.shrimpmate.vn/v1
EXPO_PUBLIC_SOCKET_URL=wss://api.shrimpmate.vn/ws
```
