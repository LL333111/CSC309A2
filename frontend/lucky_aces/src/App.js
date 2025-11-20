import './App.css';
import { Routes, Route, BrowserRouter } from "react-router-dom"
import { LoggedInUserContextProvider } from './contexts/LoggedInUserContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile'
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword'
import QRInitTransaction from './pages/QRInitTransaction'
import CreateTransferTransaction from './pages/CreateTransferTransaction'
import CreateRedemptionTransaction from './pages/CreateRedemptionTransaction';
import AllUnprocessedRedemption from './pages/AllUnprocessedRedemption';
import AllPromotions from './pages/AllPromotions';
import AllEvents from './pages/AllEvents';
import Auth from './components/auth';
import NotFound from './pages/NotFound';

import NeedLogin from './NeedLogin';

function App() {
  return (
    <LoggedInUserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />} >
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />

            {/* need log in routes */}
            <Route path="profile" element={<NeedLogin min_role={0}><Profile /></NeedLogin>} />
            <Route path="register" element={<NeedLogin min_role={2}><Register /></NeedLogin>} />
            <Route path="edit_profile" element={<NeedLogin min_role={1}><EditProfile /></NeedLogin>} />
            <Route path="change_password" element={<NeedLogin min_role={1}><ChangePassword /></NeedLogin>} />
            <Route path="qr_init_transaction" element={<NeedLogin min_role={1}><QRInitTransaction /></NeedLogin>} />
            <Route path="transfer_transaction" element={<NeedLogin min_role={1}><CreateTransferTransaction /></NeedLogin>} />
            <Route path="redemption_transaction" element={<NeedLogin min_role={1}><CreateRedemptionTransaction /></NeedLogin>} />
            <Route path="all_unprocessed_redemption_transaction" element={<NeedLogin min_role={1}><AllUnprocessedRedemption /></NeedLogin>} />
            <Route path="all_promotions" element={<NeedLogin min_role={1}><AllPromotions /></NeedLogin>} />
            <Route path="all_events" element={<NeedLogin min_role={1}><AllEvents /></NeedLogin>} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LoggedInUserContextProvider>
    // <Auth />
  );
}

export default App;
