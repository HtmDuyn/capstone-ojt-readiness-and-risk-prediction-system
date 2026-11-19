import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./routers/PublicRouter";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<p role="status" className="py-8 text-center text-sm text-slate-500">Đang tải trang…</p>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
