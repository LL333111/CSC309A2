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
import YourPromotions from './pages/YourPromotions';
import AllEvents from './pages/AllEvents';
import PublishedEvents from './pages/PublishedEvents';
import AllUsers from './pages/AllUsers';
import AllTransactions from './pages/AllTransactions';
import YourTransactions from './pages/YourTransactions';
import ProcessRedemption from './pages/ProcessRedemption';
import CreatePurchaseTransaction from './pages/CreatePurchaseTransaction';
import OrganizerEvents from './pages/OrganizerEvents';
import Auth from './components/auth';
import NotFound from './pages/NotFound';

import NeedLogin from './NeedLogin';
import UpdateUser from './pages/UpdateUsers';
import SpecificTransaction from './pages/SpecificTransaction';
import NewEvent from './pages/NewEvent';
import NewPromotions from './pages/NewPromotions';

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
            <Route path="purchase_transaction" element={<NeedLogin min_role={2}><CreatePurchaseTransaction /></NeedLogin>} />
            <Route path="redemption_transaction" element={<NeedLogin min_role={1}><CreateRedemptionTransaction /></NeedLogin>} />
            <Route path="all_unprocessed_redemption_transaction" element={<NeedLogin min_role={1}><AllUnprocessedRedemption /></NeedLogin>} />
            <Route path="all_promotions" element={<NeedLogin min_role={3}><AllPromotions /></NeedLogin>} />
            <Route path="new_promotion" element={<NeedLogin min_role={3}><NewPromotions /></NeedLogin>} />
            <Route path="your_promotions" element={<NeedLogin min_role={1}><YourPromotions /></NeedLogin>} />
            <Route path="all_events" element={<NeedLogin min_role={3}><AllEvents /></NeedLogin>} />
            <Route path="new_event" element={<NeedLogin min_role={3}><NewEvent /></NeedLogin>} />
            <Route path="published_events" element={<NeedLogin min_role={1}><PublishedEvents /></NeedLogin>} />
            <Route path="all_users" element={<NeedLogin min_role={3}><AllUsers /></NeedLogin>} />
            <Route path="all_transactions" element={<NeedLogin min_role={3}><AllTransactions /></NeedLogin>} />
            <Route path="your_transactions" element={<NeedLogin min_role={1}><YourTransactions /></NeedLogin>} />
            <Route path="process_redemption" element={<NeedLogin min_role={2}><ProcessRedemption /></NeedLogin>} />
            <Route path="update_user/:userId" element={<NeedLogin min_role={3}><UpdateUser /></NeedLogin>} />
            <Route path="specific_transaction/:transactionId" element={<NeedLogin min_role={3}><SpecificTransaction /></NeedLogin>} />
            <Route path="organizer_events" element={<NeedLogin min_role={1}><OrganizerEvents /></NeedLogin>} />


            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LoggedInUserContextProvider>
    // <Auth />
  );
}

export default App;
