import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import "./QRInitDetail.css";

function QRInitDetail() {
  const { utorid } = useParams();
  const navigate = useNavigate();

  const [_loading, _setLoading] = useState(true);

  const { loading, role } = useLoggedInUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <h2>QR Code Detail Page</h2>
          <p>UTORID: {utorid}</p>
          <button onClick={() => navigate(`/transfer_transaction/${utorid}`)}>Go Transfer</button>
          {role >= 2 && <button onClick={() => navigate(`/purchase_transaction/${utorid}`)}>
            Go Purchase
          </button>}
        </div>
      )}
    </div>
  )
}

export default QRInitDetail;