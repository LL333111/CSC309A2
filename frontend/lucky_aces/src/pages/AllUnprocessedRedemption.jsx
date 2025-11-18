import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllUnprocessedRedemption } from "../APIRequest"
import { QRCodeSVG } from 'qrcode.react';

function AllUnprocessedRedemption() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [redemptionList, setRedemptionList] = useState([]);
  const [showQRCode, setShowQRCode] = useState(null);

  const { loading, token } = useLoggedInUser();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    async function getData() {
      const data = await getAllUnprocessedRedemption(page, token);
      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }
      setRedemptionList(data.results);
    }
    if (!_loading) {
      getData();
    }
  }, [page, _loading]);

  const handlePrevious = (e) => {
    e.preventDefault();

    setPage(page === 1 ? 1 : page - 1);
  }

  const handleNext = (e) => {
    e.preventDefault();

    setPage(page === totalPage ? page : page + 1);
  }

  const toggleQRCode = (id, e) => {
    e.preventDefault();
    setShowQRCode(showQRCode === id ? null : id);
  };

  return (
    <div>
      {_loading ? (
        <div>
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <div>
            {redemptionList.map((redemption) => (
              <div key={redemption.id}>
                <p><strong>Transaction ID: </strong>{redemption.id}</p>
                <p><strong>Amount: </strong>{redemption.amount}</p>
                <p><strong>Remark: </strong>{redemption.remark}</p>
                <p><strong>Created By: </strong>{redemption.createdBy}</p>
                <button onClick={(e) => toggleQRCode(redemption.id, e)}>
                  {showQRCode === redemption.id ? "Hide QR Code" : "View QR Code"}
                </button>
                {showQRCode === redemption.id && (
                  <div style={{ border: '1px solid #ccc' }}>
                    <QRCodeSVG value={redemption} size={128} level="M" />
                    <p>Transaction ID: {redemption.id}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={(e) => handlePrevious(e)}>Previous Page</button>
          <p>{page}</p>
          <button onClick={(e) => handleNext(e)}>Next Page</button>
        </div >
      )
      }
    </div >
  )
}

export default AllUnprocessedRedemption;