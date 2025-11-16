import './App.css';
import { Routes, Route, BrowserRouter } from "react-router-dom"
import { LoggedInUserContextProvider } from './contexts/LoggedInUserContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Auth from './components/auth';
import NotFound from './pages/NotFound';

function App() {
  return (
    <LoggedInUserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />} >
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            {/* need log in routes */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LoggedInUserContextProvider>
    // <Auth />
  );
}

export default App;
