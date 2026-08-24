import AuthInitializer from "./components/AuthInitializer.tsx";

import AppRoutes from "./routes/AppRoutes.tsx";

function App() {
  return (
    <>
      <AppRoutes />
      <AuthInitializer />
    </>
  );
}

export default App;
